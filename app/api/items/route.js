import { NextResponse } from 'next/server';
import getDb from '@/lib/db';
import { getSession } from '@/lib/auth';

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

  const db = getDb();
  const items = db.prepare(`
    SELECT * FROM items ORDER BY bought ASC, created_at DESC
  `).all();

  return NextResponse.json(items);
}

export async function POST(request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

  const { name, quantity, category } = await request.json();
  if (!name?.trim()) return NextResponse.json({ error: 'El nombre es requerido' }, { status: 400 });

  const db = getDb();
  const result = db.prepare(`
    INSERT INTO items (name, quantity, category, added_by_id, added_by_name)
    VALUES (?, ?, ?, ?, ?)
  `).run(name.trim(), quantity?.trim() || null, category || 'general', session.id, session.displayName);

  const item = db.prepare('SELECT * FROM items WHERE id = ?').get(result.lastInsertRowid);
  return NextResponse.json(item, { status: 201 });
}
