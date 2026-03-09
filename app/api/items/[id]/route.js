import { NextResponse } from 'next/server';
import { getDb, row } from '@/lib/db';
import { getSession } from '@/lib/auth';

export async function PATCH(request, { params }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

  const { id } = await params;
  const body = await request.json();
  const db = await getDb();

  if ('bought' in body) {
    const bought = body.bought ? 1 : 0;
    await db.execute({
      sql: 'UPDATE items SET bought = ?, bought_by_name = ?, bought_at = ? WHERE id = ?',
      args: [bought, bought ? session.displayName : null, bought ? new Date().toISOString() : null, id],
    });
  }

  const itemResult = await db.execute({ sql: 'SELECT * FROM items WHERE id = ?', args: [id] });
  if (!itemResult.rows[0]) return NextResponse.json({ error: 'No encontrado' }, { status: 404 });

  return NextResponse.json(row(itemResult.rows[0]));
}

export async function DELETE(request, { params }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

  const { id } = await params;
  const db = await getDb();
  await db.execute({ sql: 'DELETE FROM items WHERE id = ?', args: [id] });

  return NextResponse.json({ ok: true });
}
