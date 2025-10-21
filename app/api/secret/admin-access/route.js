export async function POST(request) {
  const { password } = await request.json();

  if (password === process.env.SECRET_ADMIN_PASSWORD) {
    return Response.json({ success: true });
  }

  return Response.json({ error: "Invalid password" }, { status: 401 });
}
