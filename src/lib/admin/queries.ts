import "server-only";
import { requireOwner } from "./auth";
import { adminSql } from "./db";
export function period(raw: unknown) {
  const value = Number(raw);
  return [7, 30, 90].includes(value) ? value : 30;
}
export function pageNumber(raw: unknown) {
  const value = Number(raw);
  return Number.isInteger(value) && value > 0 ? Math.min(value, 100000) : 1;
}
export async function storeSettings() {
  const sql = adminSql();
  const [s] = await sql`SELECT * FROM store_settings WHERE id=1`;
  return s;
}
export async function dashboardData(days: number) {
  await requireOwner();
  const sql = adminSql();
  const [metrics, previous, chart, top, statuses, stock, recent] =
    await Promise.all([
      sql`SELECT count(*)::int AS orders,count(*) FILTER(WHERE status NOT IN ('cancelled','returned'))::int AS valid_orders,count(DISTINCT lower(email))::int AS customers,coalesce(sum(total_paise) FILTER(WHERE status NOT IN ('cancelled','returned')),0)::bigint AS sales,coalesce(sum(total_paise) FILTER(WHERE payment_status='paid'),0)::bigint AS collected,count(*) FILTER(WHERE status IN ('placed','confirmed','packed'))::int AS to_fulfill,count(*) FILTER(WHERE status='returned')::int AS returned,coalesce(sum(total_paise) FILTER(WHERE payment_status='pending' AND status NOT IN ('cancelled','returned')),0)::bigint AS outstanding FROM orders WHERE placed_at>=((now() AT TIME ZONE 'Asia/Kolkata')::date-(${days - 1}*interval '1 day')-interval '5 hours 30 minutes')`,
      sql`SELECT count(*)::int AS orders,count(*) FILTER(WHERE status NOT IN ('cancelled','returned'))::int AS valid_orders,count(DISTINCT lower(email))::int AS customers,coalesce(sum(total_paise) FILTER(WHERE status NOT IN ('cancelled','returned')),0)::bigint AS sales FROM orders WHERE placed_at>=((now() AT TIME ZONE 'Asia/Kolkata')::date-(${days * 2 - 1}*interval '1 day')-interval '5 hours 30 minutes') AND placed_at<((now() AT TIME ZONE 'Asia/Kolkata')::date-(${days - 1}*interval '1 day')-interval '5 hours 30 minutes')`,
      sql`SELECT to_char(d.day,'YYYY-MM-DD') AS day,coalesce(sum(o.total_paise) FILTER(WHERE o.status NOT IN ('cancelled','returned')),0)::bigint AS sales FROM generate_series((now() AT TIME ZONE 'Asia/Kolkata')::date-(${days - 1}*interval '1 day'),(now() AT TIME ZONE 'Asia/Kolkata')::date,interval '1 day') d(day) LEFT JOIN orders o ON (o.placed_at AT TIME ZONE 'UTC' AT TIME ZONE 'Asia/Kolkata')::date=d.day::date GROUP BY d.day ORDER BY d.day`,
      sql`SELECT i.product_id,min(i.title) AS title,min(i.thumbnail) AS thumbnail,sum(i.qty)::int AS units,sum(i.unit_paise::bigint*i.qty)::bigint AS sales FROM order_items i JOIN orders o ON o.id=i.order_id WHERE o.placed_at>=((now() AT TIME ZONE 'Asia/Kolkata')::date-(${days - 1}*interval '1 day')-interval '5 hours 30 minutes') AND o.status NOT IN ('cancelled','returned') GROUP BY i.product_id ORDER BY sales DESC LIMIT 5`,
      sql`SELECT status,count(*)::int AS count FROM orders WHERE placed_at>=((now() AT TIME ZONE 'Asia/Kolkata')::date-(${days - 1}*interval '1 day')-interval '5 hours 30 minutes') GROUP BY status ORDER BY count DESC`,
      sql`SELECT count(*) FILTER(WHERE active)::int AS active,count(*) FILTER(WHERE active AND stock<=(SELECT low_stock_threshold FROM store_settings WHERE id=1))::int AS low,count(*) FILTER(WHERE active AND stock=0)::int AS out,coalesce(sum(stock) FILTER(WHERE active),0)::bigint AS units FROM products`,
      sql`SELECT o.*, (SELECT coalesce(sum(qty),0)::int FROM order_items i WHERE i.order_id=o.id) AS item_count,(SELECT string_agg(title,', ') FROM order_items i WHERE i.order_id=o.id) AS item_summary FROM orders o ORDER BY placed_at DESC LIMIT 5`,
    ]);
  return {
    metrics: metrics[0],
    previous: previous[0],
    chart,
    top,
    statuses,
    stock: stock[0],
    recent,
  };
}
export function growth(current: unknown, previous: unknown) {
  return Number(previous) > 0
    ? ((Number(current) - Number(previous)) / Number(previous)) * 100
    : null;
}
