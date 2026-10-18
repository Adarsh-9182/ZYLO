import { owner } from "@/lib/admin/auth";
import { adminSql } from "@/lib/admin/db";
import { csvCell } from "@/lib/admin/validation";
import { period } from "@/lib/admin/queries";
export async function GET(request: Request) {
  if (!(await owner()))
    return Response.json(
      { error: "Unauthorized" },
      { status: 401, headers: { "Cache-Control": "no-store" } },
    );
  const url = new URL(request.url),
    type = url.searchParams.get("type"),
    sql = adminSql(),
    days = url.searchParams.has("days")
      ? period(url.searchParams.get("days"))
      : 0;
  let rows: Record<string, unknown>[];
  if (type === "orders")
    rows =
      await sql`SELECT o.reference,o.customer_name,o.email,o.phone,o.address_line,o.city,o.state,o.pincode,o.status,o.payment_status,o.carrier,o.tracking_number,o.total_paise/100.0 AS total_inr,o.placed_at,(SELECT string_agg(i.title || ' x ' || i.qty::text,'; ') FROM order_items i WHERE i.order_id=o.id) AS items FROM orders o WHERE (${days}=0 OR placed_at>=((now() AT TIME ZONE 'Asia/Kolkata')::date-(${days - 1}*interval '1 day')-interval '5 hours 30 minutes')) ORDER BY placed_at DESC LIMIT 10000`;
  else if (type === "products" || type === "inventory")
    rows =
      await sql`SELECT id,title,sku,category,brand,round(price::numeric*84) AS selling_price_inr,stock,active,thumbnail FROM products ORDER BY id DESC LIMIT 10000`;
  else if (type === "customers")
    rows =
      await sql`SELECT lower(email) AS email,(array_agg(customer_name ORDER BY placed_at DESC))[1] AS name,(array_agg(phone ORDER BY placed_at DESC))[1] AS phone,count(*)::int AS order_count,coalesce(sum(total_paise) FILTER(WHERE status NOT IN ('cancelled','returned')),0)/100.0 AS total_ordered_inr,max(placed_at) AS latest_order FROM orders GROUP BY lower(email) ORDER BY latest_order DESC LIMIT 10000`;
  else return Response.json({ error: "Unknown export type" }, { status: 400 });
  const keys = rows.length ? Object.keys(rows[0]) : ["No records"];
  const csv =
    "\ufeff" +
    [
      keys.map(csvCell).join(","),
      ...rows.map((r) => keys.map((k) => csvCell(r[k])).join(",")),
    ].join("\r\n");
  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="zylo-${type}-${new Date().toISOString().slice(0, 10)}.csv"`,
      "Cache-Control": "private, no-store",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
