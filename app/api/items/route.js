import { NextResponse } from 'next/server';
import { getDb, row } from '@/lib/db';
import { getSession } from '@/lib/auth';

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

  const db = await getDb();
  const result = await db.execute('SELECT * FROM items ORDER BY bought ASC, created_at DESC');

  return NextResponse.json(result.rows.map(row));
}

export async function POST(request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

  const { name, quantity, category } = await request.json();
  if (!name?.trim()) return NextResponse.json({ error: 'El nombre es requerido' }, { status: 400 });

  const db = await getDb();
  const insertResult = await db.execute({
    sql: 'INSERT INTO items (name, quantity, category, added_by_id, added_by_name) VALUES (?, ?, ?, ?, ?)',
    args: [name.trim(), quantity?.trim() || null, category || 'general', session.id, session.displayName],
  });

  const itemResult = await db.execute({
    sql: 'SELECT * FROM items WHERE id = ?',
    args: [Number(insertResult.lastInsertRowid)],
  });

  return NextResponse.json(row(itemResult.rows[0]), { status: 201 });
}
