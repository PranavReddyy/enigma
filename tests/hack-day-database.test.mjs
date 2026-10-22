import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { PGlite } from "@electric-sql/pglite";

test("PostgreSQL enforces private, approved, time-bound, one-email ballots", async () => {
  const db = new PGlite();
  try {
    await db.exec("create role anon; create role authenticated; create role service_role bypassrls;");
    await db.exec(await readFile(new URL("../db/hack-day-voting.sql", import.meta.url), "utf8"));
    await db.exec(await readFile(new URL("../db/hack-day-projects-review.sql", import.meta.url), "utf8"));
    const catalog = JSON.parse(await readFile(new URL("../lib/hack-day-projects.json", import.meta.url), "utf8"));
    assert.deepEqual((await db.query('select project_id from public."HackDayProject" order by project_id')).rows.map((row) => row.project_id), catalog.map((project) => project.id).sort());
    await db.exec(`insert into public."HackDayProject" values ('hack-day-2026', 'retired-challenge', true);`);
    await db.exec(await readFile(new URL("../db/hack-day-projects-review.sql", import.meta.url), "utf8"));
    assert.equal((await db.query(`select published from public."HackDayProject" where project_id = 'retired-challenge'`)).rows[0].published, false);
    const key = "a".repeat(64);
    const insert = (voter = key, project = "hack-day-pix-glance") => db.query('insert into public."HackDayVote" (event_id, voter_key, project_id) values ($1, $2, $3)', ["hack-day-2026", voter, project]);
    const code = (expected) => (error) => error.code === expected;

    await assert.rejects(insert(), code("23514"));
    await db.exec(`update public."HackDayEvent" set enabled = true, opens_at = now() - interval '1 hour';`);
    await assert.rejects(insert(), code("23514"));
    await db.exec(`update public."HackDayProject" set published = true where project_id = 'hack-day-pix-glance';`);
    const simultaneous = await Promise.allSettled([insert(), insert()]);
    assert.equal(simultaneous.filter((result) => result.status === "fulfilled").length, 1);
    assert.equal(simultaneous.find((result) => result.status === "rejected").reason.code, "23505");
    await insert("b".repeat(64));
    assert.equal((await db.query('select count(*)::int as count from public."HackDayVote"')).rows[0].count, 2);
    await assert.rejects(insert("c".repeat(64), "unapproved-or-forged"), code("23514"));
    await db.exec(`update public."HackDayEvent" set closes_at = now() - interval '1 second';`);
    await assert.rejects(insert("c".repeat(64)), code("23514"));
    await db.exec(`update public."HackDayEvent" set closes_at = null, opens_at = now() + interval '1 hour';`);
    await assert.rejects(insert("c".repeat(64)), code("23514"));

    for (const role of ["anon", "authenticated"]) {
      await db.exec(`set role ${role};`);
      await assert.rejects(db.query('select * from public."HackDayVote"'), code("42501"));
      await assert.rejects(db.query('select * from public."HackDayProject"'), code("42501"));
      await assert.rejects(insert("d".repeat(64)), code("42501"));
      await db.exec("reset role;");
    }

    await db.exec(`update public."HackDayEvent" set opens_at = now() - interval '1 hour'; set role service_role;`);
    await insert("e".repeat(64));
    assert.equal((await db.query('select count(*)::int as count from public."HackDayVote"')).rows[0].count, 3);
  } finally { await db.close(); }
});
