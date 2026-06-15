import { useState, useEffect } from "react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ReferenceLine, ResponsiveContainer } from "recharts";

// ─── USD CPI DATA (BLS CPI-U, annual averages 1950–2024) ──────────────────────
const USD_CPI = {
  1950:24.1,1951:26.0,1952:26.5,1953:26.7,1954:26.9,1955:26.8,1956:27.2,
  1957:28.1,1958:28.9,1959:29.1,1960:29.6,1961:29.9,1962:30.2,1963:30.6,
  1964:31.0,1965:31.5,1966:32.4,1967:33.4,1968:34.8,1969:36.7,1970:38.8,
  1971:40.5,1972:41.8,1973:44.4,1974:49.3,1975:53.8,1976:56.9,1977:60.6,
  1978:65.2,1979:72.6,1980:82.4,1981:90.9,1982:96.5,1983:99.6,1984:103.9,
  1985:107.6,1986:109.6,1987:113.6,1988:118.3,1989:124.0,1990:130.7,
  1991:136.2,1992:140.3,1993:144.5,1994:148.2,1995:152.4,1996:156.9,
  1997:160.5,1998:163.0,1999:166.6,2000:172.2,2001:177.1,2002:179.9,
  2003:184.0,2004:188.9,2005:195.3,2006:201.6,2007:207.3,2008:215.3,
  2009:214.5,2010:218.1,2011:224.9,2012:229.6,2013:233.0,2014:236.7,
  2015:237.0,2016:240.0,2017:245.1,2018:251.1,2019:255.7,2020:258.8,
  2021:270.9,2022:292.7,2023:304.7,2024:314.5
};

// ─── LKR CPI INDEX (base 100 = 1960, derived from IMF/World Bank annual rates) ─
const LKR_CPI = {
  1960:100,1961:102.7,1962:104.86,1963:108.53,1964:109.07,1965:111.8,
  1966:112.36,1967:116.29,1968:120.71,1969:123.72,1970:130.9,1971:135.74,
  1972:144.3,1973:158.44,1974:178.24,1975:190,1976:192.28,1977:195.17,
  1978:218.59,1979:242.2,1980:305.41,1981:360.08,1982:398.97,1983:454.82,
  1984:530.32,1985:538.28,1986:581.34,1987:626.1,1988:713.76,1989:796.55,
  1990:967.81,1991:1085.89,1992:1209.68,1993:1351.21,1994:1464.71,
  1995:1577.49,1996:1828.31,1997:2003.83,1998:2192.19,1999:2295.22,
  2000:2437.53,2001:2783.66,2002:3050.89,2003:3325.47,2004:3624.76,
  2005:4023.49,2006:4421.81,2007:5124.88,2008:6272.85,2009:6492.4,
  2010:6894.93,2011:7356.89,2012:7908.66,2013:8454.35,2014:8691.08,
  2015:8882.28,2016:9237.57,2017:9894.36,2018:10171.4,2019:10612.84,
  2020:11051.15,2021:12146.32,2022:19270.14,2023:19842.46,2024:19536.89
};

// ─── CURRENCY CONFIG ──────────────────────────────────────────────────────────
const CURRENCIES = {
  USD: {
    code: "USD", symbol: "$", flag: "🇺🇸", name: "US Dollar",
    cpi: USD_CPI, minYear: 1950, maxYear: 2024,
    source: "U.S. Bureau of Labor Statistics · CPI-U · Series CUUR0000SA0",
    color: "#4f7cff",
    defaultAmount: 1000, defaultFrom: 1990, defaultTo: 2024,
    note: null,
  },
  LKR: {
    code: "LKR", symbol: "₨", flag: "🇱🇰", name: "Sri Lankan Rupee",
    cpi: LKR_CPI, minYear: 1960, maxYear: 2024,
    source: "IMF / World Bank · CPI annual % change · Base index 1960 = 100",
    color: "#f59e0b",
    defaultAmount: 10000, defaultFrom: 1980, defaultTo: 2024,
    note: "LKR saw 58.7% inflation in 2022 during Sri Lanka's economic crisis — the highest on record.",
  },
};

// ─── CATEGORY MULTIPLIERS ──────────────────────────────────────────────────────
const USD_CATEGORIES = {
  general:   { label: "General (CPI)",   mult: 1.000, color: "#4f7cff", icon: "◈" },
  housing:   { label: "Housing",         mult: 1.180, color: "#f59e0b", icon: "⌂" },
  food:      { label: "Food & Beverage", mult: 0.960, color: "#10b981", icon: "◉" },
  medical:   { label: "Medical Care",    mult: 1.620, color: "#ef4444", icon: "✚" },
  energy:    { label: "Energy",          mult: 1.390, color: "#8b5cf6", icon: "◆" },
  education: { label: "Education",       mult: 1.740, color: "#f97316", icon: "▲" },
};

const LKR_CATEGORIES = {
  general:   { label: "General (CCPI)",  mult: 1.000, color: "#f59e0b", icon: "◈" },
  food:      { label: "Food Items",      mult: 1.080, color: "#10b981", icon: "◉" },
  housing:   { label: "Housing & Utils", mult: 0.920, color: "#4f7cff", icon: "⌂" },
  transport: { label: "Transport",       mult: 1.150, color: "#8b5cf6", icon: "◆" },
  medical:   { label: "Health",          mult: 1.200, color: "#ef4444", icon: "✚" },
  education: { label: "Education",       mult: 1.300, color: "#f97316", icon: "▲" },
};

// ─── HELPERS ──────────────────────────────────────────────────────────────────
function calcAdjusted(amount, fromYear, toYear, currency, category) {
  const cpi = CURRENCIES[currency].cpi;
  const cats = currency === "USD" ? USD_CATEGORIES : LKR_CATEGORIES;
  const cpiFrom = cpi[fromYear], cpiTo = cpi[toYear];
  if (!cpiFrom || !cpiTo) return null;
  return amount * (cpiTo / cpiFrom) * (cats[category]?.mult ?? 1);
}

function fmtCurrency(n, currency) {
  const sym = CURRENCIES[currency].symbol;
  if (currency === "LKR") {
    if (n >= 1_000_000_000) return `${sym}${(n/1_000_000_000).toFixed(2)}B`;
    if (n >= 1_000_000)     return `${sym}${(n/1_000_000).toFixed(2)}M`;
    if (n >= 1_000)         return `${sym}${(n/1_000).toFixed(1)}K`;
    return `${sym}${n.toFixed(2)}`;
  }
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD",
    minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n);
}

function fmtShort(n, currency) {
  const sym = CURRENCIES[currency].symbol;
  if (n >= 1_000_000_000) return `${sym}${(n/1_000_000_000).toFixed(1)}B`;
  if (n >= 1_000_000)     return `${sym}${(n/1_000_000).toFixed(1)}M`;
  if (n >= 1_000)         return `${sym}${(n/1_000).toFixed(1)}K`;
  return `${sym}${n.toFixed(0)}`;
}

function buildChartData(amount, fromYear, toYear, currency, category) {
  const cpi = CURRENCIES[currency].cpi;
  return Object.keys(cpi).map(Number)
    .filter(y => y >= fromYear && y <= toYear)
    .map(y => ({
      year: y,
      value: parseFloat(calcAdjusted(amount, fromYear, y, currency, category).toFixed(2)),
      original: amount,
    }));
}

function buildMilestones(amount, fromYear, toYear, currency, category) {
  const cpi = CURRENCIES[currency].cpi;
  const allYears = Object.keys(cpi).map(Number).filter(y => y >= fromYear && y <= toYear);
  const step = Math.ceil((toYear - fromYear) / 6);
  const picked = new Set([fromYear]);
  for (let y = fromYear + step; y < toYear; y += step) {
    const nearest = allYears.reduce((a, b) => Math.abs(b-y) < Math.abs(a-y) ? b : a);
    picked.add(nearest);
  }
  picked.add(toYear);
  return [...picked].sort((a,b)=>a-b).map(y => ({
    year: y,
    value: parseFloat(calcAdjusted(amount, fromYear, y, currency, category).toFixed(2)),
  }));
}

// ─── SUB-COMPONENTS ───────────────────────────────────────────────────────────
function CurrencyToggle({ currency, onChange }) {
  return (
    <div style={{
      display: "inline-flex", background: "#0a1628",
      border: "1px solid #1e293b", borderRadius: 12, padding: 4, gap: 4,
    }}>
      {Object.values(CURRENCIES).map(c => (
        <button key={c.code} onClick={() => onChange(c.code)} style={{
          background: currency === c.code ? c.color + "22" : "none",
          border: `1.5px solid ${currency === c.code ? c.color : "transparent"}`,
          borderRadius: 9, padding: "8px 20px", cursor: "pointer",
          fontFamily: "'Inter', sans-serif", fontWeight: 600, fontSize: 13,
          color: currency === c.code ? c.color : "#475569",
          transition: "all 0.2s", display: "flex", alignItems: "center", gap: 8,
        }}>
          <span style={{ fontSize: 18 }}>{c.flag}</span>
          <span>{c.symbol} {c.code}</span>
        </button>
      ))}
    </div>
  );
}

function NumberInput({ value, onChange, prefix }) {
  const [raw, setRaw] = useState(String(value));
  const [isFocused, setIsFocused] = useState(false);

  useEffect(() => { setRaw(String(value)); }, [value]);

  function commit() {
    const parsed = parseFloat(raw.replace(/[^0-9.]/g, ""));
    if (!isNaN(parsed) && parsed > 0) { onChange(parsed); setRaw(String(parsed)); }
    else setRaw(String(value));
    setIsFocused(false);
  }

  return (
    <div style={{ position: "relative", display: "flex", alignItems: "center", width: "100%" }}>
      {prefix && (
        <span style={{ position: "absolute", left: 14, color: "#94a3b8", fontSize: 16,
          fontFamily: "'DM Mono', monospace", pointerEvents: "none", zIndex: 1 }}>{prefix}</span>
      )}
      <input type="text" inputMode="decimal" value={raw}
        onChange={e => setRaw(e.target.value)}
        onBlur={commit} 
        onFocus={() => setIsFocused(true)}
        onKeyDown={e => e.key === "Enter" && commit()}
        style={{
          width: "100%", padding: prefix ? "13px 13px 13px 34px" : "13px",
          background: "#080f1e", 
          border: isFocused ? "1.5px solid #4f7cff" : "1.5px solid #1e3a5f", 
          borderRadius: 10,
          color: "#e2e8f0", fontSize: 15, fontFamily: "'DM Mono', monospace", outline: "none",
          transition: "border-color 0.2s",
        }}
      />
    </div>
  );
}

function YearSlider({ label, value, onChange, min, max, accentColor }) {
  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
        <span style={{ color: "#64748b", fontSize: 11, letterSpacing: "0.1em", textTransform: "uppercase" }}>{label}</span>
        <span style={{ color: accentColor, fontFamily: "'DM Mono', monospace", fontSize: 14, fontWeight: 600 }}>{value}</span>
      </div>
      <input type="range" min={min} max={max} value={value}
        onChange={e => onChange(Number(e.target.value))}
        style={{ width: "100%", accentColor, cursor: "pointer" }} />
      <div style={{ display: "flex", justifyContent: "space-between", marginTop: 4 }}>
        <span style={{ color: "#334155", fontSize: 11, fontFamily: "'DM Mono', monospace" }}>{min}</span>
        <span style={{ color: "#334155", fontSize: 11, fontFamily: "'DM Mono', monospace" }}>{max}</span>
      </div>
    </div>
  );
}

const CustomTooltip = ({ active, payload, label, currency }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: "#0f172a", border: "1px solid #1e3a5f", borderRadius: 10,
      padding: "10px 16px", boxShadow: "0 8px 32px rgba(0,0,0,0.5)" }}>
      <div style={{ color: "#64748b", fontSize: 11, marginBottom: 4, fontFamily: "'DM Mono', monospace" }}>{label}</div>
      <div style={{ color: CURRENCIES[currency].color, fontSize: 18, fontWeight: 700, fontFamily: "'DM Mono', monospace" }}>
        {fmtShort(payload[0]?.value, currency)}
      </div>
    </div>
  );
};

// ─── MAIN APP ─────────────────────────────────────────────────────────────────
export default function InflationCalculator() {
  const [currency, setCurrency] = useState("USD");
  const [amount,   setAmount]   = useState(1000);
  const [fromYear, setFromYear] = useState(1990);
  const [toYear,   setToYear]   = useState(2024);
  const [category, setCategory] = useState("general");
  const [activeTab, setActiveTab] = useState("chart");
  const [copied,   setCopied]   = useState(false);
  const [animKey,  setAnimKey]  = useState(0);

  const cfg      = CURRENCIES[currency];
  const cats     = currency === "USD" ? USD_CATEGORIES : LKR_CATEGORIES;
  const accentColor = cfg.color;

  // When switching currency, reset to sensible defaults & clamp years
  function switchCurrency(c) {
    setCurrency(c);
    const nc = CURRENCIES[c];
    setAmount(nc.defaultAmount);
    setFromYear(nc.defaultFrom);
    setToYear(nc.defaultTo);
    setCategory("general");
    setAnimKey(k => k+1);
  }

  useEffect(() => { setAnimKey(k => k+1); }, [amount, fromYear, toYear, category, currency]);

  const safeFrom = Math.min(fromYear, toYear - 1);
  const safeTo   = Math.max(toYear, fromYear + 1);
  const clampedFrom = Math.max(safeFrom, cfg.minYear);
  const clampedTo   = Math.min(safeTo,   cfg.maxYear);

  const adjusted    = calcAdjusted(amount, clampedFrom, clampedTo, currency, category) ?? 0;
  const totalChange = ((adjusted - amount) / amount) * 100;
  const years       = clampedTo - clampedFrom;
  const annualRate  = years > 0 ? (Math.pow(adjusted / amount, 1 / years) - 1) * 100 : 0;
  const chartData   = buildChartData(amount, clampedFrom, clampedTo, currency, category);
  const milestones  = buildMilestones(amount, clampedFrom, clampedTo, currency, category);
  const catColor    = cats[category]?.color ?? accentColor;

  // Quick amounts scaled to currency
  const quickAmounts = currency === "USD"
    ? [100, 1000, 10000, 50000]
    : [1000, 10000, 100000, 500000];

  function handleShare() {
    const params = new URLSearchParams({ cur: currency, amount, from: clampedFrom, to: clampedTo, cat: category });
    navigator.clipboard.writeText(`${window.location.origin}?${params}`).then(() => {
      setCopied(true); setTimeout(() => setCopied(false), 2000);
    });
  }

  useEffect(() => {
    const p = new URLSearchParams(window.location.search);
    if (p.get("cur") && CURRENCIES[p.get("cur")]) switchCurrency(p.get("cur"));
    if (p.get("amount")) setAmount(Number(p.get("amount")));
    if (p.get("from"))   setFromYear(Number(p.get("from")));
    if (p.get("to"))     setToYear(Number(p.get("to")));
    if (p.get("cat"))    setCategory(p.get("cat"));
  }, []);

  return (
    <div style={{ minHeight: "100vh", background: "#060d1a", fontFamily: "'Inter', system-ui, sans-serif", color: "#e2e8f0", paddingBottom: "40px" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&family=DM+Mono:wght@400;500&family=Syne:wght@700;800&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        input[type=range] { -webkit-appearance: none; height: 4px; border-radius: 4px; background: #1e3a5f; outline: none; }
        input[type=range]::-webkit-slider-thumb { -webkit-appearance: none; width: 18px; height: 18px; border-radius: 50%; background: var(--accent, #4f7cff); border: 2px solid #060d1a; cursor: pointer; box-shadow: 0 0 0 4px color-mix(in srgb, var(--accent, #4f7cff) 20%, transparent); }
        .tab-btn { background: none; border: none; cursor: pointer; padding: 8px 18px; border-radius: 8px; font-size: 12px; font-family: inherit; font-weight: 500; transition: all 0.2s; color: #475569; }
        .tab-btn.active { background: #0f172a; color: #e2e8f0; }
        .tab-btn:hover:not(.active) { color: #94a3b8; }
        .cat-chip { border: 1.5px solid #1e293b; border-radius: 999px; padding: 5px 12px; font-size: 11px; font-weight: 500; cursor: pointer; transition: all 0.18s; background: none; font-family: inherit; white-space: nowrap; }
        .cat-chip:hover { border-color: #334155; }
        .card { background: #0f172a; border: 1px solid #1e3a5f; border-radius: 16px; padding: 22px; width: 100%; }
        @keyframes fadeUp { from { opacity:0; transform:translateY(8px); } to { opacity:1; transform:translateY(0); } }
        .anim { animation: fadeUp 0.38s ease both; }
        
        /* Clean Responsive Layout Matrix */
        .main-grid { 
          display: grid; 
          grid-template-columns: 320px 1fr; 
          gap: 24px; 
          align-items: start; 
        }
        @media(max-width: 900px) { 
          .main-grid { 
            grid-template-columns: 1fr; 
            gap: 16px;
          } 
        }
      `}</style>

      {/* HEADER */}
      <header style={{ borderBottom: "1px solid #0d1f35", padding: "18px 40px",
        display: "flex", alignItems: "center", justifyContent: "space-between",
        width: "100%", maxWidth: "100%" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 32, height: 32, borderRadius: 8, background: accentColor,
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 16, fontWeight: 800, transition: "background 0.3s" }}>
            {cfg.symbol}
          </div>
          <span style={{ fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: 16, letterSpacing: "-0.02em" }}>
            PriceShift
          </span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ fontSize: 10, color: "#334155", fontFamily: "'DM Mono', monospace", maxWidth: 260, textAlign: "right", lineHeight: 1.4 }}>
            {cfg.source}
          </span>
          <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#10b981", boxShadow: "0 0 6px #10b981", flexShrink: 0 }} />
        </div>
      </header>

      {/* HERO */}
      <div style={{ textAlign: "center", padding: "40px 20px 28px", maxWidth: 680, margin: "0 auto" }}>
        <h1 style={{ fontFamily: "'Syne', sans-serif", fontSize: "clamp(28px, 5vw, 44px)",
          fontWeight: 800, lineHeight: 1.1, letterSpacing: "-0.03em",
          background: "linear-gradient(135deg, #e2e8f0 0%, #64748b 100%)",
          WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
          What did a {cfg.name} really cost?
        </h1>
        <p style={{ color: "#475569", fontSize: 15, marginTop: 14, lineHeight: 1.6 }}>
          Track purchasing power erosion with real historical CPI data.
        </p>

        {/* CURRENCY TOGGLE */}
        <div style={{ marginTop: 24, display: "flex", justifyContent: "center" }}>
          <CurrencyToggle currency={currency} onChange={switchCurrency} />
        </div>

        {/* LKR Crisis callout */}
        {currency === "LKR" && cfg.note && (
          <div style={{ marginTop: 16, padding: "10px 18px", background: "#f59e0b12",
            border: "1px solid #f59e0b30", borderRadius: 10, fontSize: 12, color: "#d97706",
            display: "inline-block" }}>
            ⚡ {cfg.note}
          </div>
        )}
      </div>

      {/* MAIN CONTENT */}
      <div style={{ width: "100%", maxWidth: "100%", padding: "0 40px" }}>
        <div className="main-grid">

          {/* ─── LEFT: CONTROLS ─── */}
          <div style={{ display: "flex", flexDirection: "column", gap: 16, width: "100%" }}>

            {/* Amount */}
            <div className="card">
              <label style={{ display: "block", color: "#64748b", fontSize: 10,
                letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 10 }}>
                Original Amount
              </label>
              <NumberInput value={amount} onChange={setAmount} prefix={cfg.symbol} />
              <div style={{ display: "flex", gap: 6, marginTop: 10, flexWrap: "wrap" }}>
                {quickAmounts.map(v => (
                  <button key={v} onClick={() => setAmount(v)} style={{
                    background: amount === v ? "#1e3a5f" : "none",
                    border: `1px solid ${amount === v ? accentColor : "#1e293b"}`,
                    borderRadius: 6, color: amount === v ? accentColor : "#475569",
                    padding: "3px 9px", fontSize: 11, cursor: "pointer",
                    fontFamily: "'DM Mono', monospace", transition: "all 0.15s"
                  }}>{fmtShort(v, currency)}</button>
                ))}
              </div>
            </div>

            {/* Year sliders */}
            <div className="card" style={{ display: "flex", flexDirection: "column", gap: 22 }}>
              <YearSlider label="From year" value={clampedFrom}
                onChange={v => setFromYear(Math.min(v, clampedTo - 1))}
                min={cfg.minYear} max={cfg.maxYear - 1} accentColor={accentColor} />
              <YearSlider label="To year" value={clampedTo}
                onChange={v => setToYear(Math.max(v, clampedFrom + 1))}
                min={cfg.minYear + 1} max={cfg.maxYear} accentColor={accentColor} />
            </div>

            {/* Categories */}
            <div className="card">
              <label style={{ display: "block", color: "#64748b", fontSize: 10,
                letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 12 }}>
                Spending Category
              </label>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 7 }}>
                {Object.entries(cats).map(([key, cat]) => (
                  <button key={key} className="cat-chip" onClick={() => setCategory(key)}
                    style={{
                      color: category === key ? cat.color : "#475569",
                      borderColor: category === key ? cat.color : "#1e293b",
                      background: category === key ? `${cat.color}18` : "none",
                    }}>
                    {cat.icon} {cat.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Mini stats */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, width: "100%" }}>
              {[
                { label: "Total inflation", value: `${totalChange > 0 ? "+" : ""}${totalChange.toFixed(1)}%`, color: totalChange > 0 ? "#10b981" : "#ef4444" },
                { label: "Annual avg rate", value: `${annualRate.toFixed(2)}%`, color: accentColor },
                { label: "Time span",       value: `${years} yrs`,             color: "#94a3b8" },
                { label: "CPI ratio",       value: `${(cfg.cpi[clampedTo] / cfg.cpi[clampedFrom]).toFixed(2)}×`, color: "#f97316" },
              ].map(s => (
                <div key={s.label} style={{ background: "#080f1e", border: "1px solid #1e293b",
                  borderRadius: 12, padding: "12px 14px" }}>
                  <div style={{ color: "#334155", fontSize: 9, letterSpacing: "0.1em",
                    textTransform: "uppercase", marginBottom: 5 }}>{s.label}</div>
                  <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 13,
                    fontWeight: 600, color: s.color }}>{s.value}</div>
                </div>
              ))}
            </div>
          </div>

          {/* ─── RIGHT: RESULTS + CHART ─── */}
          <div style={{ display: "flex", flexDirection: "column", gap: 16, width: "100%", minWidth: 0 }}>

            {/* BIG RESULT */}
            <div className="card" style={{ position: "relative", overflow: "hidden" }}>
              <div style={{ position: "absolute", top: -50, right: -50, width: 180, height: 180,
                borderRadius: "50%", background: `radial-gradient(circle, ${catColor}1a 0%, transparent 70%)`,
                pointerEvents: "none" }} />

              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 16, flexWrap: "wrap" }}>
                <div>
                  <div style={{ color: "#64748b", fontSize: 12, marginBottom: 6 }}>
                    {fmtCurrency(amount, currency)} in {clampedFrom} equals
                  </div>
                  <div key={animKey} className="anim" style={{
                    fontFamily: "'Syne', sans-serif", fontSize: "clamp(28px, 4vw, 46px)",
                    fontWeight: 800, letterSpacing: "-0.03em", color: catColor, lineHeight: 1
                  }}>
                    {fmtCurrency(adjusted, currency)}
                  </div>
                  <div style={{ color: "#475569", fontSize: 13, marginTop: 8 }}>
                    in {clampedTo} · {cats[category]?.label}
                  </div>
                </div>
                <div style={{ background: `${totalChange > 0 ? "#10b981" : "#ef4444"}12`,
                  border: `1px solid ${totalChange > 0 ? "#10b98140" : "#ef444440"}`,
                  borderRadius: 10, padding: "10px 18px", textAlign: "center", flexShrink: 0 }}>
                  <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 22, fontWeight: 700,
                    color: totalChange > 0 ? "#10b981" : "#ef4444" }}>
                    {totalChange > 0 ? "+" : ""}{totalChange.toFixed(1)}%
                  </div>
                  <div style={{ color: "#475569", fontSize: 10, marginTop: 2 }}>total change</div>
                </div>
              </div>

              {/* Purchasing power bar */}
              <div style={{ marginTop: 22 }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                  <span style={{ color: "#475569", fontSize: 11 }}>Purchasing power retained</span>
                  <span style={{ color: "#94a3b8", fontFamily: "'DM Mono', monospace", fontSize: 11 }}>
                    {(100 / (adjusted / amount)).toFixed(1)}%
                  </span>
                </div>
                <div style={{ background: "#1e293b", borderRadius: 4, height: 6, overflow: "hidden" }}>
                  <div style={{
                    height: "100%", borderRadius: 4,
                    background: `linear-gradient(90deg, ${catColor}, ${catColor}70)`,
                    width: `${Math.min(100, (100 / (adjusted / amount)))}%`,
                    transition: "width 0.5s ease"
                  }} />
                </div>
                <div style={{ color: "#334155", fontSize: 11, marginTop: 5 }}>
                  Today's {fmtCurrency(amount, currency)} would have been {fmtCurrency(amount / (adjusted / amount), currency)} in {clampedFrom}
                </div>
              </div>
            </div>

            {/* TABS */}
            <div style={{ display: "flex", gap: 3, background: "#0a1628",
              border: "1px solid #1e293b", borderRadius: 12, padding: 4, width: "fit-content" }}>
              {[
                { id: "chart",     label: "Growth curve" },
                { id: "breakdown", label: "Category compare" },
                { id: "milestones", label: "Milestones" },
              ].map(t => (
                <button key={t.id} className={`tab-btn ${activeTab === t.id ? "active" : ""}`}
                  onClick={() => setActiveTab(t.id)}>{t.label}</button>
              ))}
            </div>

            {/* GROWTH CURVE */}
            {activeTab === "chart" && (
              <div className="card">
                <div style={{ color: "#64748b", fontSize: 10, letterSpacing: "0.1em",
                  textTransform: "uppercase", marginBottom: 18 }}>
                  {fmtCurrency(amount, currency)} · {cats[category]?.label} · {clampedFrom}–{clampedTo}
                </div>
                <ResponsiveContainer width="100%" height={240}>
                  <AreaChart data={chartData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="grad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%"  stopColor={catColor} stopOpacity={0.28} />
                        <stop offset="95%" stopColor={catColor} stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                    <XAxis dataKey="year" stroke="#334155" tickLine={false} axisLine={false}
                      tick={{ fill: "#475569", fontSize: 10, fontFamily: "DM Mono" }}
                      interval="preserveStartEnd" />
                    <YAxis stroke="#334155" tickLine={false} axisLine={false}
                      tick={{ fill: "#475569", fontSize: 10, fontFamily: "DM Mono" }}
                      tickFormatter={v => fmtShort(v, currency)} width={72} />
                    <Tooltip content={<CustomTooltip currency={currency} />} />
                    <ReferenceLine y={amount} stroke="#334155" strokeDasharray="4 4"
                      label={{ value: "Original", fill: "#475569", fontSize: 10, position: "right" }} />
                    <Area type="monotone" dataKey="value" stroke={catColor} strokeWidth={2.5}
                      fill="url(#grad)" dot={false}
                      activeDot={{ r: 5, fill: catColor, stroke: "#060d1a", strokeWidth: 2 }} />
                  </AreaChart>
                </ResponsiveContainer>

                {/* LKR crisis annotation */}
                {currency === "LKR" && clampedFrom <= 2022 && clampedTo >= 2022 && (
                  <div style={{ marginTop: 14, padding: "8px 14px", background: "#f59e0b10",
                    border: "1px solid #f59e0b30", borderRadius: 8, fontSize: 11, color: "#d97706",
                    display: "flex", alignItems: "center", gap: 8 }}>
                    <span>⚡</span>
                    <span>The sharp spike in 2022 reflects Sri Lanka's economic crisis — 58.7% annual inflation, the highest in the dataset.</span>
                  </div>
                )}
              </div>
            )}

            {/* CATEGORY COMPARE */}
            {activeTab === "breakdown" && (
              <div className="card">
                <div style={{ color: "#64748b", fontSize: 10, letterSpacing: "0.1em",
                  textTransform: "uppercase", marginBottom: 18 }}>
                  {fmtCurrency(amount, currency)} in {clampedFrom} → {clampedTo} by category
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  {Object.entries(cats)
                    .map(([key, cat]) => ({
                      ...cat, key,
                      value: calcAdjusted(amount, clampedFrom, clampedTo, currency, key),
                      pct: ((calcAdjusted(amount, clampedFrom, clampedTo, currency, key) - amount) / amount) * 100
                    }))
                    .sort((a, b) => b.value - a.value)
                    .map(cat => {
                      const maxVal = Math.max(...Object.keys(cats).map(k =>
                        calcAdjusted(amount, clampedFrom, clampedTo, currency, k)));
                      return (
                        <div key={cat.key} onClick={() => setCategory(cat.key)} style={{
                          cursor: "pointer", padding: "11px 14px",
                          background: category === cat.key ? "#0a1628" : "transparent",
                          border: `1px solid ${category === cat.key ? cat.color + "60" : "#1e293b"}`,
                          borderRadius: 10, transition: "all 0.15s"
                        }}>
                          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 7 }}>
                            <span style={{ fontSize: 12, color: category === cat.key ? cat.color : "#94a3b8" }}>
                              {cat.icon} {cat.label}
                            </span>
                            <div>
                              <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 12,
                                fontWeight: 600, color: cat.color }}>{fmtShort(cat.value, currency)}</span>
                              <span style={{ color: "#475569", fontSize: 10, marginLeft: 8 }}>
                                +{cat.pct.toFixed(1)}%
                              </span>
                            </div>
                          </div>
                          <div style={{ background: "#1e293b", borderRadius: 3, height: 3 }}>
                            <div style={{ height: "100%", borderRadius: 3, background: cat.color,
                              width: `${(cat.value / maxVal) * 100}%`, transition: "width 0.4s ease" }} />
                          </div>
                        </div>
                      );
                    })}
                </div>
              </div>
            )}

            {/* MILESTONES */}
            {activeTab === "milestones" && (
              <div className="card">
                <div style={{ color: "#64748b", fontSize: 10, letterSpacing: "0.1em",
                  textTransform: "uppercase", marginBottom: 18 }}>
                  Value milestones · {fmtCurrency(amount, currency)} from {clampedFrom}
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
                  {milestones.map((d, i) => {
                    const isLast  = i === milestones.length - 1;
                    const isFirst = i === 0;
                    const growth  = ((d.value - amount) / amount) * 100;
                    return (
                      <div key={d.year} style={{ display: "flex", gap: 14 }}>
                        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", flexShrink: 0 }}>
                          <div style={{ width: 10, height: 10, borderRadius: "50%", flexShrink: 0, marginTop: 14,
                            background: isFirst ? accentColor : isLast ? catColor : "#1e3a5f",
                            border: `2px solid ${isFirst ? accentColor : isLast ? catColor : "#334155"}`,
                            boxShadow: isLast ? `0 0 8px ${catColor}` : "none" }} />
                          {!isLast && <div style={{ width: 1, flex: 1, background: "#1e293b", margin: "4px 0" }} />}
                        </div>
                        <div style={{ paddingBottom: isLast ? 0 : 18 }}>
                          <div style={{ display: "flex", gap: 14, alignItems: "baseline", flexWrap: "wrap" }}>
                            <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 11,
                              color: "#475569", paddingTop: 10 }}>{d.year}</span>
                            <span style={{ fontFamily: "'Syne', sans-serif", fontSize: 18,
                              fontWeight: 700, color: isLast ? catColor : "#e2e8f0", paddingTop: 7 }}>
                              {fmtCurrency(d.value, currency)}
                            </span>
                            {!isFirst && (
                              <span style={{ fontSize: 10, color: "#10b981", paddingTop: 10 }}>
                                +{growth.toFixed(1)}%
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* SHARE */}
            <div style={{ display: "flex", gap: 12, alignItems: "center", marginTop: 4 }}>
              <button onClick={handleShare} style={{
                background: accentColor, border: "none", borderRadius: 10,
                color: "#060d1a", fontFamily: "inherit", fontSize: 13, fontWeight: 700,
                padding: "11px 22px", cursor: "pointer", transition: "opacity 0.2s"
              }}>
                {copied ? "✓ Copied!" : "Share this calculation"}
              </button>
              <span style={{ color: "#334155", fontSize: 11 }}>
                URL encodes currency, amount & years
              </span>
            </div>
          </div>
        </div>

        {/* METHODOLOGY FOOTER */}
        <div style={{ marginTop: 40, padding: "22px 26px", background: "#080f1e",
          border: "1px solid #1e293b", borderRadius: 16, display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 24 }}>
          <div>
            <div style={{ color: "#334155", fontSize: 9, letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 6 }}>USD Source</div>
            <div style={{ color: "#475569", fontSize: 11, lineHeight: 1.6 }}>
              U.S. Bureau of Labor Statistics CPI-U, series CUUR0000SA0. Annual averages, not seasonally adjusted.
            </div>
          </div>
          <div>
            <div style={{ color: "#334155", fontSize: 9, letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 6 }}>LKR Source</div>
            <div style={{ color: "#475569", fontSize: 11, lineHeight: 1.6 }}>
              IMF / World Bank annual CPI % change data for Sri Lanka (1960–2024). Index rebased to 100 in 1960. 2022 figure reflects the Sri Lankan economic crisis peak.
            </div>
          </div>
          <div>
            <div style={{ color: "#334155", fontSize: 9, letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 6 }}>Formula</div>
            <div style={{ color: "#475569", fontSize: 11, lineHeight: 1.6, fontFamily: "'DM Mono', monospace" }}>
              Adjusted = Amount × (CPI_to / CPI_from) × CategoryMultiplier
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}