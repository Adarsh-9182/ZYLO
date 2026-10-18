import { money } from "./UI";
import type { Row } from "@/lib/admin/db";
export function SalesChart({ rows }: { rows: Row[] }) {
  const max = Math.max(...rows.map((r) => Number(r.sales)), 10000),
    total = rows.reduce((s, r) => s + Number(r.sales), 0);
  const labels = rows.length > 30 ? 15 : rows.length > 7 ? 5 : 1;
  return (
    <>
      <div className="a-chart-total">
        <strong>{money(total)}</strong>
        <span>in product orders</span>
      </div>
      <div
        className="a-chart"
        role="img"
        aria-label={`Sales over the selected period: ${money(total)}. Cancelled and returned orders excluded.`}
      >
        <div className="a-chart-grid">
          {[1, 0.75, 0.5, 0.25, 0].map((v) => (
            <div key={v}>
              <span>{money(max * v)}</span>
            </div>
          ))}
        </div>
        <div className="a-bars">
          {rows.map((r, i) => (
            <div className="a-bar-wrap" key={String(r.day)}>
              <div
                className="a-bar"
                style={{
                  height: `${Math.max((Number(r.sales) / max) * 100, 1)}%`,
                }}
              />
              {(i % labels === 0 || i === rows.length - 1) && (
                <span>
                  {new Date(String(r.day)).toLocaleDateString("en-IN", {
                    day: "numeric",
                    month: "short",
                  })}
                </span>
              )}
              <div className="a-tooltip">
                {String(r.day)} · {money(r.sales)}
              </div>
            </div>
          ))}
        </div>
        {total === 0 && (
          <div className="a-chart-zero">
            <strong>A fresh start, a clear view.</strong>
            <span>Your sales will show up as orders come in.</span>
          </div>
        )}
      </div>
      <p className="a-chart-legend">
        <i />
        Order sales · excludes cancellations & returns
      </p>
    </>
  );
}
