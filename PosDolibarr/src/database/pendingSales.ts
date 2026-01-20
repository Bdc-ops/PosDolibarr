import { getDatabase } from './database';
import { PendingSale } from '../types/pos';

export async function savePendingSale(sale: PendingSale): Promise<void> {
  const db = await getDatabase();
  await db.runAsync(
    `INSERT OR REPLACE INTO pending_sales (id, sale_data, created_at) VALUES (?, ?, ?)`,
    [sale.id, JSON.stringify(sale), Math.floor(Date.now() / 1000)],
  );
}

export async function listPendingSales(): Promise<Array<{ id: string; sale: PendingSale; created_at: number }>> {
  const db = await getDatabase();
  const rows = await db.getAllAsync<{ id: string; sale_data: string; created_at: number }>(
    `SELECT id, sale_data, created_at FROM pending_sales ORDER BY created_at DESC`,
  );
  return (rows || []).map((r) => ({ id: r.id, sale: JSON.parse(r.sale_data), created_at: r.created_at }));
}

export async function deletePendingSale(id: string): Promise<void> {
  const db = await getDatabase();
  await db.runAsync(`DELETE FROM pending_sales WHERE id = ?`, [id]);
}

