import { NextResponse } from 'next/server';
import getDb from '@/lib/db';
import { getSession } from '@/lib/auth';

export async function PATCH(request, { params }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

  const { id } = await params;
  const body = await request.json();
  const db = getDb();

  // Toggle bought status
  if ('bought' in body) {
    const bought = body.bought ? 1 : 0;
    db.prepare(`
      UPDATE items SET
        bought = ?,
        bought_by_name = ?,
        bought_at = ?
      WHERE id = ?
    `).run(bought, bought ? session.displayName : null, bought ? new Date().toISOString() : null, id);
  }

  const item = db.prepare('SELECT * FROM items WHERE id = ?').get(id);
  if (!item) return NextResponse.json({ error: 'No encontrado' }, { status: 404 });

  return NextResponse.json(item);
}

export async function DELETE(request, { params }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

  const { id } = await params;
  const db = getDb();
  db.prepare('DELETE FROM items WHERE id = ?').run(id);

  return NextResponse.json({ ok: true });
}
