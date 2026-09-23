import { ShieldCheck, Wallet } from "lucide-react";
import { formatCurrency } from "@/utils/format";

const money = (n: number) => formatCurrency(n).replace(/\.00$/, "");

// Hand-authored paths in a 320x110 box. pathLength="1" lets CSS animate the
// stroke drawing in without measuring the path in JS.
const INCOME_LINE = "M0 84 C30 80 50 60 80 64 S130 40 160 46 S210 22 240 30 S290 10 320 14";
const EXPENSE_LINE = "M0 96 C30 92 50 88 80 86 S130 76 160 78 S210 66 240 68 S290 58 320 56";

/** Overlapping demo "dashboard" cards for the hero. Pure SVG + CSS — no chart library. */
export default function HeroVisual() {
  return (
    <div className="lp-hv" aria-hidden="true">
      <div className="lp-hc lp-hc-main">
        <p className="lp-hc-label">Net balance</p>
        <p className="lp-hc-value">{money(124580)}</p>
        <p className="lp-delta">+8.2% vs last month</p>
        <svg className="lp-svg" viewBox="0 0 320 110" focusable="false">
          <defs>
            <linearGradient id="lp-area-grad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" className="lp-stop-a" />
              <stop offset="100%" className="lp-stop-b" />
            </linearGradient>
          </defs>
          <line className="lp-grid-line" x1="0" x2="320" y1="30" y2="30" />
          <line className="lp-grid-line" x1="0" x2="320" y1="60" y2="60" />
          <line className="lp-grid-line" x1="0" x2="320" y1="90" y2="90" />
          <path className="lp-area" d={`${INCOME_LINE} L320 110 L0 110 Z`} fill="url(#lp-area-grad)" />
          <path className="lp-line lp-line-a" pathLength={1} d={INCOME_LINE} />
          <path className="lp-line lp-line-b" pathLength={1} d={EXPENSE_LINE} />
        </svg>
      </div>

      <div className="lp-hc lp-hc-save">
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <span className="lp-hc-chip">
            <Wallet size={18} />
          </span>
          <div>
            <p className="lp-hc-label">Monthly savings</p>
            <p className="lp-hc-title">{money(18240)}</p>
          </div>
        </div>
        <div className="lp-track">
          <div className="lp-fill" style={{ width: "72%" }} />
        </div>
        <p className="lp-hc-sub" style={{ marginTop: 8 }}>
          72% of monthly goal
        </p>
      </div>

      <div className="lp-hc lp-hc-secure">
        <span className="lp-hc-chip">
          <ShieldCheck size={18} />
        </span>
        <div>
          <p className="lp-hc-title">Secure sessions</p>
          <p className="lp-hc-sub">Rate-limited API</p>
        </div>
      </div>
    </div>
  );
}
