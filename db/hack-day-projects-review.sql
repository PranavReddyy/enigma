-- Only the ten Hack Day submissions, reviewed October 22, 2026.
-- Retire obsolete candidates without deleting projects or any existing votes.
begin;
update public."HackDayProject" set published = false
where event_id = 'hack-day-2026' and project_id not in ('hack-day-pix-glance', 'hack-day-sortling', 'hack-day-skill-barter', 'hack-day-washing-muchine', 'hack-day-sidequest', 'hack-day-back2u', 'hack-day-paani-police', 'hack-day-opportunity-atlas', 'hack-day-wispend', 'hack-day-junomate');

insert into public."HackDayProject" (event_id, project_id, published) values
('hack-day-2026', 'hack-day-pix-glance', false),
('hack-day-2026', 'hack-day-sortling', false),
('hack-day-2026', 'hack-day-skill-barter', false),
('hack-day-2026', 'hack-day-washing-muchine', false),
('hack-day-2026', 'hack-day-sidequest', false),
('hack-day-2026', 'hack-day-back2u', false),
('hack-day-2026', 'hack-day-paani-police', false),
('hack-day-2026', 'hack-day-opportunity-atlas', false),
('hack-day-2026', 'hack-day-wispend', false),
('hack-day-2026', 'hack-day-junomate', false)
on conflict (event_id, project_id) do nothing;
commit;
