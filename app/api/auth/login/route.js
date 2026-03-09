import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { getDb, row } from '@/lib/db';
import { signToken } from '@/lib/auth';

export async function POST(request) {
  const { username, password } = await request.json();

  if (!username || !password) {
    return NextResponse.json({ error: 'Faltan datos' }, { status: 400 });
  }

  const db = await getDb();
  const result = await db.execute({
    sql: 'SELECT * FROM users WHERE username = ?',
    args: [username.toLowerCase().trim()],
  });
  const user = row(result.rows[0]);

  if (!user || !bcrypt.compareSync(password, user.password_hash)) {
    return NextResponse.json({ error: 'Usuario o contraseña incorrectos' }, { status: 401 });
  }

  const token = signToken({ id: user.id, username: user.username, displayName: user.display_name });

  const response = NextResponse.json({ ok: true, displayName: user.display_name });
  response.cookies.set('hg_token', token, {
    httpOnly: true,
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 30,
    path: '/',
  });

  return response;
}
