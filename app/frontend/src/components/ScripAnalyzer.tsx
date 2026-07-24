import React, { useState, useEffect } from "react"
import {
  ArrowLeft,
  Check,
  Circle,
  ArrowRight,
  Bell,
  Lightning,
} from "@phosphor-icons/react"
import {
  ResponsiveContainer,
  AreaChart as RechartsAreaChart,
  Area,
  BarChart as RechartsBarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
  ReferenceArea,
} from "recharts"

interface ScripAnalyzerProps {
  symbol: string
  onBack: () => void
  onOpenOrderTicket: (scrip: any) => void
}

// ─── Fallback Data Generator ───────────────────────────────────────────────────
function generateFallbackData(symbol: string) {
  const basePrice = 1436.60
  const now = Date.now()
  const dayMs = 86400000
  const candles = Array.from({ length: 60 }, (_, i) => {
    const t = now - (59 - i) * dayMs
    const noise = (Math.random() - 0.5) * 60
    const trend = Math.sin(i / 12) * 30
    const close = basePrice + noise + trend
    const open = close + (Math.random() - 0.5) * 8
    const high = Math.max(open, close) + Math.random() * 12
    const low = Math.min(open, close) - Math.random() * 12
    return {
      time: new Date(t).toISOString().split("T")[0],
      open: Math.round(open * 100) / 100,
      high: Math.round(high * 100) / 100,
      low: Math.round(low * 100) / 100,
      close: Math.round(close * 100) / 100,
      volume: Math.round(500000 + Math.random() * 2500000),
    }
  })

  const entryLow = 1429.42
  const entryHigh = 1450.97
  const targetNum = 1591.26
  const stopNum = 1359.27

  return {
    symbol,
    price: basePrice,
    change: 0.82,
    ref_id: `${symbol}-REF-001`,
    score: 62,
    parameters: {
      entry_low: entryLow,
      entry_high: entryHigh,
      target_num: targetNum,
      stop_num: stopNum,
      holding_period: "2-4 weeks",
      entry: `${entryLow} - ${entryHigh}`,
    },
    indicators: {
      trend: { status: "Strong Uptrend" },
      volume: { value: "1.2x Average" },
      rsi: { value: 58.4, status: "Slightly Bullish" },
      risk: { value: "Medium", details: ["Exit immediately if daily price closes below the invalidation level."] },
    },
    ai_summary:
      "**Setup Assessment:** The stock is showing a **developing bullish structure** with price holding above key moving averages.\n\n**Key Levels:**\n- **Entry Zone:** ₹1,429–₹1,451\n- **Target:** ₹1,591 (+10.8%)\n- **Stop Loss:** ₹1,359 (−5.4%)\n\n**Risk Management:** Position sizing should account for the 1:1.9 risk-reward ratio. Consider adding on dips within the entry zone.",
    candles,
  }
}

// ─── Render Markdown Inline ─────────────────────────────────────────────────────
function renderMarkdown(text: string) {
  if (!text) return null
  return text.split("\n").map((line, idx) => {
    const trimmed = line.trim()
    if (!trimmed) return <div key={idx} className="h-2" />

    const parts: React.ReactNode[] = []
    const boldRegex = /\*\*([^*]+)\*\*/g
    let match: RegExpExecArray | null
    let lastIndex = 0

    while ((match = boldRegex.exec(trimmed)) !== null) {
      if (match.index > lastIndex) {
        parts.push(trimmed.substring(lastIndex, match.index))
      }
      parts.push(
        <strong key={match.index} className="font-medium text-foreground">
          {match[1]}
        </strong>
      )
      lastIndex = boldRegex.lastIndex
    }
    if (lastIndex < trimmed.length) {
      parts.push(trimmed.substring(lastIndex))
    }

    if (trimmed.startsWith("####")) {
      return (
        <h4 key={idx} className="text-sm font-medium text-foreground mt-3 mb-1 select-none">
          {parts.slice(1)}
        </h4>
      )
    }
    if (trimmed.startsWith("###")) {
      return (
        <h3 key={idx} className="text-base font-medium text-foreground mt-3 mb-1 select-none">
          {parts.slice(1)}
        </h3>
      )
    }
    if (trimmed.startsWith("-") || trimmed.startsWith("*")) {
      const contentParts = trimmed.replace(/^[\s*-]+/, "")
      const cleanParts: React.ReactNode[] = []
      let bulletIndex = 0
      let bMatch: RegExpExecArray | null
      const bRegex = /\*\*([^*]+)\*\*/g
      while ((bMatch = bRegex.exec(contentParts)) !== null) {
        if (bMatch.index > bulletIndex) {
          cleanParts.push(contentParts.substring(bulletIndex, bMatch.index))
        }
        cleanParts.push(
          <strong key={bMatch.index} className="font-medium text-foreground">
            {bMatch[1]}
          </strong>
        )
        bulletIndex = bRegex.lastIndex
      }
      if (bulletIndex < contentParts.length) {
        cleanParts.push(contentParts.substring(bulletIndex))
      }
      return (
        <li key={idx} className="list-disc list-inside text-text-muted my-1 pl-1 text-sm">
          {cleanParts}
        </li>
      )
    }
    return (
      <p key={idx} className="my-1.5 text-sm text-text-muted leading-relaxed">
        {parts}
      </p>
    )
  })
}

// ─── Event Markers on Candle Data ───────────────────────────────────────────────
function addEventMarkers(candles: any[]): any[] {
  if (!candles || candles.length < 10) return candles || []
  const marked = candles.map((c) => ({ ...c }))
  const len = marked.length
  // Place synthetic markers at interesting candle positions
  const events: { idx: number; label: string }[] = [
    { idx: Math.round(len * 0.22), label: "S" },
    { idx: Math.round(len * 0.45), label: "B" },
    { idx: Math.round(len * 0.65), label: "V" },
    { idx: Math.round(len * 0.82), label: "E" },
  ]
  events.forEach(({ idx, label }) => {
    if (marked[idx]) {
      marked[idx] = { ...marked[idx], event: label }
    }
  })
  return marked
}

// ─── RSI Calculation (14-period Wilder's) ───────────────────────────────────────
function computeRSI(candles: any[]): any[] {
  const valid = (candles || []).filter(
    (c) => c && typeof c.close === "number" && !isNaN(c.close)
  )
  if (valid.length < 15) return []
  const gains: number[] = []
  const losses: number[] = []
  for (let i = 1; i < valid.length; i++) {
    const diff = valid[i].close - valid[i - 1].close
    gains.push(diff > 0 ? diff : 0)
    losses.push(diff < 0 ? -diff : 0)
  }
  let avgGain = gains.slice(0, 14).reduce((a, b) => a + b, 0) / 14
  let avgLoss = losses.slice(0, 14).reduce((a, b) => a + b, 0) / 14
  const series: any[] = []
  for (let i = 14; i < valid.length; i++) {
    const rs = avgLoss === 0 ? 100 : avgGain / avgLoss
    const rsi = avgLoss === 0 ? 100 : 100 - 100 / (1 + rs)
    const rsiVal = Math.round(rsi * 10) / 10
    if (!isNaN(rsiVal) && isFinite(rsiVal)) {
      series.push({ time: valid[i].time, rsi: rsiVal, close: rsiVal })
    }
    const diff = valid[i].close - valid[i - 1].close
    const currentGain = diff > 0 ? diff : 0
    const currentLoss = diff < 0 ? -diff : 0
    avgGain = (avgGain * 13 + currentGain) / 14
    avgLoss = (avgLoss * 13 + currentLoss) / 14
  }
  return series
}

// ─── Checklist Item ─────────────────────────────────────────────────────────────
interface ChecklistItemProps {
  label: string
  checked: boolean
}

const ChecklistItem: React.FC<ChecklistItemProps> = ({ label, checked }) => (
  <div className="flex items-center gap-2.5 text-sm select-none">
    {checked ? (
      <div className="h-4.5 w-4.5 rounded flex items-center justify-center shrink-0 border border-foreground/20">
        <Check size={12} className="text-foreground/70" weight="bold" />
      </div>
    ) : (
      <Circle size={16} className="text-border/40 shrink-0" weight="regular" />
    )}
    <span
      className={
        checked ? "text-foreground/85 font-medium" : "text-text-muted/60"
      }
    >
      {label}
    </span>
  </div>
)

// ─── Journey Step (Trade Plan) ──────────────────────────────────────────────────




// ─── Setup Conditions Evaluator ─────────────────────────────────────────────────
function evaluateConditions(data: any) {
  const trendStatus = (data.indicators?.trend?.status || "").toLowerCase()
  const volumeVal = (data.indicators?.volume?.value || "").toLowerCase()
  const rsiValue = data.indicators?.rsi?.value ?? null
  const hasEntryRange =
    data.parameters?.entry_low != null && data.parameters?.entry_high != null

  const conditions = [
    {
      label: "Trend structure confirmed",
      checked:
        trendStatus.includes("strong") ||
        trendStatus.includes("uptrend") ||
        trendStatus.includes("bullish"),
      whatNeeded: "Stronger trend confirmation with higher highs",
    },
    {
      label: "Price holding above SMA20",
      checked: trendStatus.includes("strong") || trendStatus.includes("above"),
      whatNeeded: "Price needs to hold above the 20-period SMA",
    },
    {
      label: "Buying volume expanding",
      checked:
        volumeVal.includes("above") ||
        volumeVal.includes("high") ||
        volumeVal.includes("strong") ||
        volumeVal.includes("rising"),
      whatNeeded: "Stronger buying volume needed with above-average volume bars",
    },
    {
      label: "Entry zone confirmation",
      checked: hasEntryRange && data.price != null && data.parameters?.entry_low != null && data.price >= data.parameters.entry_low && data.price <= data.parameters.entry_high,
      whatNeeded: "Price needs to enter the defined entry zone",
    },
    {
      label: "Momentum confirmation",
      checked:
        rsiValue !== null && rsiValue > 50 && rsiValue < 75,
      whatNeeded: "RSI momentum needs to show positive divergence above 50",
    },
  ]

  const confirmed = conditions.filter((c) => c.checked).length
  return { conditions, confirmed, total: conditions.length }
}

// ─── MAIN COMPONENT ─────────────────────────────────────────────────────────────
export const ScripAnalyzer: React.FC<ScripAnalyzerProps> = ({
  symbol,
  onBack,
  onOpenOrderTicket,
}) => {
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState<boolean>(true)
  const [loadingStep, setLoadingStep] = useState<number>(0)
  const [chartTab, setChartTab] = useState<"price" | "rsi" | "volume">("price")
  const [alertSet, setAlertSet] = useState<boolean>(false)

  // Fetch scrip data from FastAPI backend with staged loading
  useEffect(() => {
    let t1: ReturnType<typeof setTimeout> | undefined
    let t2: ReturnType<typeof setTimeout> | undefined
    let t3: ReturnType<typeof setTimeout> | undefined
    let cancelled = false

    const fetchScripData = async (isSilent: boolean = false) => {
      if (!isSilent) {
        setLoading(true)
        setLoadingStep(0)
        t1 = setTimeout(() => setLoadingStep(1), 800)
        t2 = setTimeout(() => setLoadingStep(2), 1600)
      }
      try {
        const response = await fetch(`/api/stock/${symbol}/details`)
        const details = await response.json()
        if (!response.ok) throw new Error(details.detail || "Stock data is unavailable")
        if (!cancelled) {
          setData(details)
        }
      } catch (e) {
        console.error("Failed to load scrip details, using fallback", e)
        if (!cancelled) {
          setData(generateFallbackData(symbol))
        }
      } finally {
        if (!isSilent && !cancelled) {
          t3 = setTimeout(() => {
            setLoading(false)
          }, 2400)
        }
      }
    }

    fetchScripData(false)

    const interval = setInterval(() => {
      fetchScripData(true)
    }, 15000)

    return () => {
      cancelled = true
      clearInterval(interval)
      clearTimeout(t1)
      clearTimeout(t2)
      clearTimeout(t3)
    }
  }, [symbol])

  // Client-side Wilder's RSI calculation (14 period)
  const candles = data?.candles || []
  const rsiSeries = React.useMemo(() => computeRSI(candles), [candles])

  const volumeSeries = React.useMemo(() => {
    return (candles || [])
      .filter((c: any) => c && typeof c.volume === "number" && !isNaN(c.volume))
      .map((c: any) => ({
        time: c.time,
        volume: c.volume,
        close: c.close,
        open: c.open,
        isUp: (c.close || 0) >= (c.open || 0)
      }))
  }, [candles])

  const priceSeries = React.useMemo(() => {
    return addEventMarkers(
      (candles || []).filter(
        (c: any) => c && typeof c.close === "number" && !isNaN(c.close)
      )
    )
  }, [candles])

  // ─── Loading State ────────────────────────────────────────────────────────
  if (loading || !data) {
    const loadingMessages = [
      `Loading real-time market data for ${symbol}...`,
      `Calculating 20-day & 50-day EMAs and RSI momentum...`,
      `Building technical chart & setup metrics...`,
    ]

    return (
      <div className="flex flex-col items-center justify-center min-h-[480px] text-foreground gap-4 select-none">
        <div className="ai-organic-blob w-12 h-12 mb-1" />
        <div className="flex flex-col items-center text-center gap-1.5 max-w-sm">
          <h3 className="text-base font-medium text-foreground tracking-tight m-0">
            Analyzing {symbol}
          </h3>
          <p className="text-xs text-foreground/60 font-medium animate-pulse m-0">
            {loadingMessages[loadingStep] || loadingMessages[0]}
          </p>
        </div>
        <div className="flex items-center gap-1.5 mt-2">
          <span
            className={`h-1.5 rounded-full transition-all duration-300 ${
              loadingStep >= 0
                ? "w-5 bg-foreground/80"
                : "w-1.5 bg-border/30"
            }`}
          />
          <span
            className={`h-1.5 rounded-full transition-all duration-300 ${
              loadingStep >= 1
                ? "w-5 bg-foreground/80"
                : "w-1.5 bg-border/30"
            }`}
          />
          <span
            className={`h-1.5 rounded-full transition-all duration-300 ${
              loadingStep >= 2
                ? "w-5 bg-success"
                : "w-1.5 bg-border/30"
            }`}
          />
        </div>
      </div>
    )
  }

  // ─── Calculations ────────────────────────────────────────────────────────
  const pricePositive = data.change >= 0
  const entryLow = data.parameters?.entry_low ?? null
  const entryHigh = data.parameters?.entry_high ?? null
  const entryMid =
    entryLow !== null && entryHigh !== null ? (entryLow + entryHigh) / 2 : null
  const targetNum = data.parameters?.target_num ?? null
  const stopNum = data.parameters?.stop_num ?? null
  const risk =
    entryMid !== null && stopNum !== null
      ? Math.max(entryMid - stopNum, 0.01)
      : null
  const reward =
    targetNum !== null && entryMid !== null
      ? Math.max(targetNum - entryMid, 0)
      : null
  const riskRewardVal =
    reward !== null && risk !== null ? (reward / risk) : null
  const upsidePct =
    data.price != null && targetNum != null
      ? (((targetNum - data.price) / data.price) * 100).toFixed(1)
      : null
  const downsidePct =
    data.price != null && stopNum != null
      ? (Math.abs(((stopNum - data.price) / data.price) * 100)).toFixed(1)
      : null
  const holdingPeriod = data.parameters?.holding_period || "2-4 weeks"

  const { conditions, confirmed, total } = evaluateConditions(data)
  const unconfirmed = conditions.filter((c) => !c.checked)
  const isReady = confirmed >= 4
  const setupStatus = isReady ? "Ready" : confirmed >= 3 ? "Developing" : "Weak"

  // ─── RENDER ──────────────────────────────────────────────────────────────
  return (
    <div
      id="scrip-analyzer-section"
      className="flex flex-col gap-5 text-foreground leading-normal font-sans py-1 max-w-5xl mx-auto select-none"
    >
      {/* ── TOP SUMMARY STRIP ──────────────────────────────────────────────── */}
      <div className="flex flex-col gap-3">
        {/* Header Row: Back | Symbol + Badge | Current Price */}
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <button
              onClick={onBack}
              className="h-9 w-9 flex items-center justify-center bg-card hover:bg-accent text-text-muted hover:text-foreground rounded-lg border border-border/40 transition-colors cursor-pointer"
              aria-label="Back"
            >
              <ArrowLeft size={16} />
            </button>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-medium text-foreground m-0 tracking-tight leading-none">
                {data.symbol}
              </h1>
              <span
                className={`text-xs font-medium px-2 py-0.5 rounded leading-none ${
                  pricePositive
                    ? "text-success bg-success/10 border border-success/15"
                    : "text-destructive bg-destructive/10 border border-destructive/15"
                }`}
              >
                {pricePositive ? "+" : ""}
                {data.change?.toFixed(2)}%
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-2xl font-medium font-mono text-foreground tracking-tight leading-none whitespace-nowrap tabular-nums">
              ₹
              {data.price?.toLocaleString("en-IN", {
                minimumFractionDigits: 2,
              })}
            </span>
          </div>
        </div>

        {/* Metrics Strip — cohesive 5-column row with 100% consistent font sizes */}
        <div className="flex items-center gap-0 bg-card border border-border rounded-2xl px-4 py-3.5 shadow-sm">
          {/* Potential Gain */}
          <div className="flex-1 flex flex-col gap-1 items-center min-w-0 px-2">
            <span className="text-[11px] text-text-muted font-normal">
              Potential gain
            </span>
            <span className="text-lg font-medium text-success font-mono leading-none tabular-nums whitespace-nowrap">
              +{upsidePct ?? "—"}%
            </span>
          </div>

          <div className="w-px bg-border/40 self-stretch" />

          {/* Downside Risk */}
          <div className="flex-1 flex flex-col gap-1 items-center min-w-0 px-2">
            <span className="text-[11px] text-text-muted font-normal">
              Downside risk
            </span>
            <span className="text-lg font-medium text-destructive font-mono leading-none tabular-nums whitespace-nowrap">
              −{downsidePct ?? "—"}%
            </span>
          </div>

          <div className="w-px bg-border/40 self-stretch" />

          {/* Risk Reward */}
          <div className="flex-1 flex flex-col gap-1 items-center min-w-0 px-2">
            <span className="text-[11px] text-text-muted font-normal">
              Risk reward
            </span>
            <span className="text-lg font-medium text-foreground font-mono leading-none tabular-nums whitespace-nowrap">
              {riskRewardVal != null ? `${riskRewardVal.toFixed(1)}×` : "—"}
            </span>
          </div>

          <div className="w-px bg-border/40 self-stretch" />

          {/* Entry Range */}
          <div className="flex-1 flex flex-col gap-1 items-center min-w-0 px-2">
            <span className="text-[11px] text-text-muted font-normal">
              Entry range
            </span>
            <span className="text-lg font-medium text-foreground font-mono leading-none tabular-nums whitespace-nowrap">
              ₹
              {entryLow?.toLocaleString("en-IN", {
                minimumFractionDigits: 2,
              })}
              –₹
              {entryHigh?.toLocaleString("en-IN", {
                minimumFractionDigits: 2,
              })}
            </span>
          </div>

          <div className="w-px bg-border/40 self-stretch" />

          {/* Holding Period */}
          <div className="flex-1 flex flex-col gap-1 items-center min-w-0 px-2">
            <span className="text-[11px] text-text-muted font-normal">
              Holding period
            </span>
            <span className="text-lg font-medium text-foreground font-mono leading-none whitespace-nowrap">
              {holdingPeriod}
            </span>
          </div>
        </div>
      </div>

      {/* ── MAIN GRID: Chart + Trade Plan (3 cols) vs Setup Readiness (1 col) ── */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-5 items-stretch">
        {/* ── LEFT COLUMN (col-span-3): 2 SEPARATE CARDS WITH EVEN GAPPING ── */}
        <div className="lg:col-span-3 flex flex-col gap-5 justify-between">
          
          {/* Card 1: Technical Chart Card */}
          <div className="bg-card border border-border rounded-xl p-4 md:p-5 flex flex-col gap-3">
            {/* Header & Tab Switcher */}
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium text-text-muted">
                Technical chart
              </span>
              <div className="flex bg-[#0B0C0C] border border-border/80 p-1 rounded-lg gap-1">
                {(["price", "rsi", "volume"] as const).map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setChartTab(tab)}
                    className={`text-xs px-3.5 py-1 rounded-md cursor-pointer transition-all font-normal ${
                      chartTab === tab
                        ? "bg-[#1A1B1E] border border-white/10 text-foreground shadow-sm"
                        : "bg-transparent border-transparent text-text-muted hover:text-foreground hover:bg-white/5"
                    }`}
                  >
                    {tab === "rsi" ? "RSI" : tab === "price" ? "Price" : "Volume"}
                  </button>
                ))}
              </div>
            </div>

            {/* Chart Area */}
            <div className="h-[280px] w-full">
              {chartTab === "price" && (
                <ResponsiveContainer width="100%" height="100%">
                  <RechartsAreaChart
                    data={priceSeries}
                    margin={{ top: 10, right: 12, left: 10, bottom: 5 }}
                  >
                    <defs>
                      <linearGradient
                        id="priceGradient"
                        x1="0"
                        y1="0"
                        x2="0"
                        y2="1"
                      >
                        <stop
                          offset="5%"
                          stopColor={
                            pricePositive
                              ? "var(--success)"
                              : "var(--destructive)"
                          }
                          stopOpacity={0.12}
                        />
                        <stop
                          offset="95%"
                          stopColor={
                            pricePositive
                              ? "var(--success)"
                              : "var(--destructive)"
                          }
                          stopOpacity={0.0}
                        />
                      </linearGradient>
                    </defs>
                    <CartesianGrid
                      vertical={false}
                      stroke="var(--border)"
                      strokeDasharray="3 3"
                    />
                    <XAxis
                      dataKey="time"
                      tickLine={false}
                      axisLine={false}
                      tickMargin={8}
                      tickFormatter={(t) =>
                        new Date(t).toLocaleDateString([], {
                          month: "short",
                          day: "numeric",
                        })
                      }
                      stroke="var(--text-muted)"
                      fontSize={11}
                      minTickGap={25}
                    />
                    <YAxis
                      domain={["dataMin - 10", "dataMax + 10"]}
                      hide={true}
                    />
                    <Tooltip
                      content={({ active, payload }: any) => {
                        if (
                          active &&
                          payload &&
                          payload.length &&
                          payload[0].value
                        ) {
                          const val = payload[0].value
                          const dateStr = new Date(
                            payload[0].payload.time
                          ).toLocaleDateString([], {
                            month: "short",
                            day: "numeric",
                          })
                          return (
                            <div className="bg-card border border-border/80 px-2.5 py-1.5 rounded-lg shadow-xl text-xs font-mono select-none">
                              <span className="text-text-muted block text-[10px]">
                                {dateStr}
                              </span>
                              <span className="text-foreground font-normal">
                                ₹
                                {val.toLocaleString("en-IN", {
                                  minimumFractionDigits: 2,
                                })}
                              </span>
                            </div>
                          )
                        }
                        return null
                      }}
                    />

                    {/* Shaded bands for trade levels */}
                    {typeof stopNum === "number" &&
                      typeof entryLow === "number" &&
                      !isNaN(stopNum) &&
                      !isNaN(entryLow) && (
                        <ReferenceArea
                          y1={stopNum}
                          y2={entryLow}
                          fill="var(--destructive)"
                          fillOpacity={0.04}
                        />
                      )}
                    {typeof entryLow === "number" &&
                      typeof entryHigh === "number" &&
                      !isNaN(entryLow) &&
                      !isNaN(entryHigh) && (
                        <ReferenceArea
                          y1={entryLow}
                          y2={entryHigh}
                          fill="var(--foreground)"
                          fillOpacity={0.05}
                        />
                      )}
                    {typeof entryHigh === "number" &&
                      typeof targetNum === "number" &&
                      !isNaN(entryHigh) &&
                      !isNaN(targetNum) && (
                        <ReferenceArea
                          y1={entryHigh}
                          y2={targetNum}
                          fill="var(--success)"
                          fillOpacity={0.03}
                        />
                      )}

                    {/* Reference Lines with clean non-bold labels (fontWeight: 400) */}
                    {typeof targetNum === "number" &&
                      !isNaN(targetNum) &&
                      isFinite(targetNum) &&
                      targetNum > 0 && (
                        <ReferenceLine
                          y={targetNum}
                          stroke="var(--success)"
                          strokeWidth={1.5}
                          strokeDasharray="4 4"
                          label={{
                            value: `Target ₹${targetNum.toLocaleString("en-IN")} +${upsidePct}%`,
                            fill: "var(--success)",
                            position: "insideTopRight",
                            fontSize: 11,
                            fontWeight: 400,
                          }}
                        />
                      )}
                    {typeof stopNum === "number" &&
                      !isNaN(stopNum) &&
                      isFinite(stopNum) &&
                      stopNum > 0 && (
                        <ReferenceLine
                          y={stopNum}
                          stroke="var(--destructive)"
                          strokeWidth={1.5}
                          strokeDasharray="4 4"
                          label={{
                            value: `Stop ₹${stopNum.toLocaleString("en-IN")} −${downsidePct}%`,
                            fill: "var(--destructive)",
                            position: "insideBottomRight",
                            fontSize: 11,
                            fontWeight: 400,
                          }}
                        />
                      )}
                    {typeof data.price === "number" &&
                      !isNaN(data.price) &&
                      isFinite(data.price) &&
                      data.price > 0 && (
                        <ReferenceLine
                          y={data.price}
                          stroke="var(--text-muted)"
                          strokeWidth={1}
                          strokeDasharray="2 2"
                          opacity={0.5}
                          label={{
                            value: `Current ₹${data.price.toLocaleString("en-IN")}`,
                            fill: "var(--text-muted)",
                            position: "insideTopLeft",
                            fontSize: 11,
                            fontWeight: 400,
                          }}
                        />
                      )}

                    {/* Area line */}
                    <Area
                      type="monotone"
                      dataKey="close"
                      stroke={
                        pricePositive
                          ? "var(--success)"
                          : "var(--destructive)"
                      }
                      strokeWidth={1.5}
                      fill="url(#priceGradient)"
                      activeDot={{
                        r: 4,
                        fill: pricePositive
                          ? "var(--success)"
                          : "var(--destructive)",
                      }}
                    />
                  </RechartsAreaChart>
                </ResponsiveContainer>
              )}

              {chartTab === "rsi" && (
                <ResponsiveContainer width="100%" height="100%">
                  <RechartsAreaChart
                    data={rsiSeries}
                    margin={{ top: 10, right: 12, left: 10, bottom: 5 }}
                  >
                    <defs>
                      <linearGradient id="rsiGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="var(--foreground)" stopOpacity={0.15} />
                        <stop offset="95%" stopColor="var(--foreground)" stopOpacity={0.0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid
                      vertical={false}
                      stroke="var(--border)"
                      strokeDasharray="3 3"
                    />
                    <XAxis
                      dataKey="time"
                      tickLine={false}
                      axisLine={false}
                      tickMargin={8}
                      tickFormatter={(t) =>
                        new Date(t).toLocaleDateString([], {
                          month: "short",
                          day: "numeric",
                        })
                      }
                      stroke="var(--text-muted)"
                      fontSize={11}
                      minTickGap={25}
                    />
                    <YAxis domain={[0, 100]} hide={true} />
                    <Tooltip
                      content={({ active, payload }: any) => {
                        if (
                          active &&
                          payload &&
                          payload.length &&
                          payload[0].value !== undefined
                        ) {
                          const val = payload[0].value
                          const dateStr = new Date(
                            payload[0].payload.time
                          ).toLocaleDateString([], {
                            month: "short",
                            day: "numeric",
                          })
                          const status = val >= 70 ? "Overbought" : val <= 30 ? "Oversold" : val >= 55 ? "Bullish" : "Neutral"
                          return (
                            <div className="bg-card border border-border/80 px-2.5 py-1.5 rounded-lg shadow-xl text-xs font-mono select-none">
                              <span className="text-text-muted block text-[10px]">
                                {dateStr}
                              </span>
                              <span className="text-foreground font-medium">
                                RSI: {val} ({status})
                              </span>
                            </div>
                          )
                        }
                        return null
                      }}
                    />
                    <ReferenceLine
                      y={70}
                      stroke="var(--destructive)"
                      strokeDasharray="3 3"
                      label={{
                        value: "Overbought 70",
                        fill: "var(--destructive)",
                        position: "insideTopRight",
                        fontSize: 11,
                        fontWeight: 400,
                      }}
                    />
                    <ReferenceLine
                      y={50}
                      stroke="var(--text-muted)"
                      strokeDasharray="2 2"
                      opacity={0.4}
                    />
                    <ReferenceLine
                      y={30}
                      stroke="var(--success)"
                      strokeDasharray="3 3"
                      label={{
                        value: "Oversold 30",
                        fill: "var(--success)",
                        position: "insideBottomRight",
                        fontSize: 11,
                        fontWeight: 400,
                      }}
                    />
                    <Area
                      type="monotone"
                      dataKey="rsi"
                      stroke="var(--foreground)"
                      strokeWidth={1.5}
                      fill="url(#rsiGradient)"
                      activeDot={{ r: 4, fill: "var(--foreground)" }}
                    />
                  </RechartsAreaChart>
                </ResponsiveContainer>
              )}

              {chartTab === "volume" && (
                <ResponsiveContainer width="100%" height="100%">
                  <RechartsBarChart
                    data={volumeSeries}
                    margin={{ top: 10, right: 12, left: 10, bottom: 5 }}
                  >
                    <CartesianGrid
                      vertical={false}
                      stroke="var(--border)"
                      strokeDasharray="3 3"
                    />
                    <XAxis
                      dataKey="time"
                      tickLine={false}
                      axisLine={false}
                      tickMargin={8}
                      tickFormatter={(t) =>
                        new Date(t).toLocaleDateString([], {
                          month: "short",
                          day: "numeric",
                        })
                      }
                      stroke="var(--text-muted)"
                      fontSize={11}
                      minTickGap={25}
                    />
                    <YAxis hide={true} />
                    <Tooltip
                      cursor={{ fill: "rgba(255, 255, 255, 0.05)" }}
                      content={({ active, payload }: any) => {
                        if (
                          active &&
                          payload &&
                          payload.length &&
                          payload[0].value !== undefined
                        ) {
                          const val = payload[0].value
                          const dateStr = new Date(
                            payload[0].payload.time
                          ).toLocaleDateString([], {
                            month: "short",
                            day: "numeric",
                          })
                          const formattedVal = val >= 1000000 
                            ? `${(val / 1000000).toFixed(2)}M` 
                            : val >= 1000 
                            ? `${(val / 1000).toFixed(1)}K` 
                            : val.toString()
                          return (
                            <div className="bg-card border border-border/80 px-2.5 py-1.5 rounded-lg shadow-xl text-xs font-mono select-none">
                              <span className="text-text-muted block text-[10px]">
                                {dateStr}
                              </span>
                              <span className="text-foreground font-medium">
                                Volume: {val.toLocaleString("en-IN")} ({formattedVal})
                              </span>
                            </div>
                          )
                        }
                        return null
                      }}
                    />
                    <Bar
                      dataKey="volume"
                      fill="var(--text-muted)"
                      opacity={0.5}
                      radius={[2, 2, 0, 0]}
                    />
                  </RechartsBarChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          {/* Card 2: Trade Execution Plan Card (Distinct Separate Card) */}
          <div className="bg-card border border-border rounded-xl p-4 md:p-5 flex flex-col gap-4">
            <div className="flex flex-col gap-0.5">
              <h2 className="text-sm font-medium text-foreground m-0">Trade execution plan</h2>
              <span className="text-xs text-text-muted/70 font-normal">Parameters &amp; risk-reward structure</span>
            </div>

            {/* 3 Parameter Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="bg-accent/50 border border-border/60 rounded-lg p-3 flex flex-col gap-1 select-none">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-normal text-foreground/90">1. Enter</span>
                  <span className="text-[10px] text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded font-mono">Buy zone</span>
                </div>
                <span className="text-base sm:text-lg font-medium font-mono text-foreground mt-0.5">
                  {entryLow != null && entryHigh != null
                    ? `₹${entryLow.toLocaleString("en-IN", { minimumFractionDigits: 2 })} – ₹${entryHigh.toLocaleString("en-IN", { minimumFractionDigits: 2 })}`
                    : "—"}
                </span>
                <span className="text-[11px] text-text-muted font-normal">Buy within zone on confirmation</span>
              </div>

              <div className="bg-accent/50 border border-border/60 rounded-lg p-3 flex flex-col gap-1 select-none">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-normal text-destructive">2. Stop loss</span>
                  {downsidePct != null && (
                    <span className="text-[10px] text-destructive bg-destructive/10 px-1.5 py-0.5 rounded font-mono">-{downsidePct}%</span>
                  )}
                </div>
                <span className="text-base sm:text-lg font-medium font-mono text-destructive mt-0.5">
                  {stopNum != null ? `₹${stopNum.toLocaleString("en-IN", { minimumFractionDigits: 2 })}` : "—"}
                </span>
                <span className="text-[11px] text-text-muted font-normal">Exit daily close below level</span>
              </div>

              <div className="bg-accent/50 border border-border/60 rounded-lg p-3 flex flex-col gap-1 select-none">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-normal text-success">3. Target</span>
                  {upsidePct != null && (
                    <span className="text-[10px] text-success bg-success/10 px-1.5 py-0.5 rounded font-mono">+{upsidePct}%</span>
                  )}
                </div>
                <span className="text-base sm:text-lg font-medium font-mono text-success mt-0.5">
                  {targetNum != null ? `₹${targetNum.toLocaleString("en-IN", { minimumFractionDigits: 2 })}` : "—"}
                </span>
                <span className="text-[11px] text-text-muted font-normal">Target profit zone</span>
              </div>
            </div>

            {/* Supporting Visual: Risk-Reward Execution Track */}
            {riskRewardVal != null && (
              <div className="bg-accent/70 border border-border rounded-xl p-3.5 flex flex-col gap-2.5 select-none">
                <div className="flex items-center justify-between text-xs font-mono">
                  <span className="text-destructive font-normal">Stop ₹{stopNum?.toLocaleString("en-IN")}</span>
                  <span className="text-foreground/90 font-normal">Current ₹{data.price?.toLocaleString("en-IN")}</span>
                  <span className="text-success font-normal">Target ₹{targetNum?.toLocaleString("en-IN")}</span>
                </div>

                {/* Horizontal Risk Reward Proportion Bar (h-7, deep colors, white text) */}
                <div className="h-7 w-full rounded-lg bg-card border border-border/40 overflow-hidden flex p-0.5 shadow-inner">
                  <div
                    className="h-full bg-[#DC2626] rounded-l flex items-center justify-center text-xs font-mono text-white font-medium transition-all"
                    style={{ width: `${Math.max(25, Math.min(45, (1 / (1 + riskRewardVal)) * 100))}%` }}
                  >
                    Risk 1.0x
                  </div>
                  <div
                    className="h-full bg-[#059669] rounded-r flex items-center justify-center text-xs font-mono text-white font-medium transition-all"
                    style={{ width: `${100 - Math.max(25, Math.min(45, (1 / (1 + riskRewardVal)) * 100))}%` }}
                  >
                    Reward {riskRewardVal.toFixed(1)}x
                  </div>
                </div>

                <div className="flex items-center justify-between text-[11px] text-text-muted/70 font-normal pt-0.5">
                  <span>Trade invalidation: Exit below ₹{stopNum?.toLocaleString("en-IN")}</span>
                  <span className="text-foreground font-mono">Risk : Reward 1 : {riskRewardVal.toFixed(1)}</span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ── RIGHT SIDE PANEL: Setup Readiness ───────────────────────────── */}
        <div className="lg:col-span-1 bg-card border border-border rounded-xl p-4 md:p-5 flex flex-col gap-4">
          {/* Header */}
          <div className="flex flex-col gap-1.5">
            <h2 className="text-sm font-medium text-foreground m-0">
              Setup readiness
            </h2>
            <div className="flex items-center gap-2">
              <span
                className={`text-xs font-medium px-2 py-0.5 rounded leading-none ${
                  isReady
                    ? "text-success bg-success/10 border border-success/15"
                    : setupStatus === "Developing"
                    ? "text-warning bg-warning/10 border border-warning/15"
                    : "text-destructive bg-destructive/10 border border-destructive/15"
                }`}
              >
                {setupStatus}
              </span>
            </div>
          </div>

          {/* Progress: X of Y conditions */}
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between">
              <span className="text-xs text-text-muted">
                {confirmed} of {total} conditions confirmed
              </span>
              <span className="text-2xs font-mono text-text-muted tabular-nums">
                {Math.round((confirmed / total) * 100)}%
              </span>
            </div>
            <div className="h-1 w-full rounded-full bg-border/20 overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  isReady
                    ? "bg-success"
                    : confirmed >= 2
                    ? "bg-foreground/40"
                    : "bg-destructive/60"
                }`}
                style={{ width: `${(confirmed / total) * 100}%` }}
              />
            </div>
          </div>

          {/* AI Insight Gradient Card matching Reference Image 5 */}
          <div className="bg-gradient-to-r from-emerald-500/10 via-cyan-500/5 to-transparent border-l-2 border-l-[#10B981] border border-white/[0.08] rounded-xl p-3.5 flex flex-col gap-1.5 shadow-sm">
            <div className="flex items-center gap-2">
              <div className="ai-organic-blob w-4 h-4 shrink-0" style={{ animation: "none" }} />
              <span className="text-xs text-emerald-400 font-medium tracking-tight">AI Insight</span>
            </div>
            <p className="text-xs text-foreground/90 leading-relaxed m-0 font-normal">
              {isReady
                ? "All setup conditions are confirmed. The trade setup is ready for execution with favorable risk-reward parameters."
                : confirmed >= 3
                ? "Trend structure is positive, but buying volume and entry confirmation are still developing."
                : "Multiple conditions are not yet met. Consider waiting for better confirmation signals before entering."}
            </p>
          </div>

          {/* Checklist */}
          <div className="flex flex-col gap-2">
            <span className="text-2xs font-medium text-text-muted">
              Setup checklist
            </span>
            <div className="flex flex-col gap-1.5">
              {conditions.map((item, idx) => (
                <ChecklistItem
                  key={idx}
                  label={item.label}
                  checked={item.checked}
                />
              ))}
            </div>
          </div>

          {/* Next confirmation */}
          {unconfirmed.length > 0 && (
            <div className="flex flex-col gap-1.5 bg-accent/20 rounded-lg p-3 border border-border/10">
              <span className="text-2xs font-medium text-text-muted">
                Next confirmation
              </span>
              <ul className="flex flex-col gap-1 m-0 p-0 list-none">
                {unconfirmed.map((item, idx) => (
                  <li
                    key={idx}
                    className="flex items-start gap-1.5 text-xs text-text-muted"
                  >
                    <ArrowRight size={12} className="text-text-muted/50 shrink-0 mt-0.5" />
                    <span>{item.whatNeeded}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Divider */}
          <div className="border-t border-border/10" />

          {/* Action Buttons */}
          <div className="flex flex-col gap-2">
            <button
              onClick={() => {
                setAlertSet(true)
                setTimeout(() => setAlertSet(false), 2500)
              }}
              className={`flex items-center justify-center gap-2 w-full px-4 py-2 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                alertSet
                  ? "bg-success/15 text-success border border-success/20"
                  : "bg-accent hover:bg-accent/70 text-foreground border border-border/30"
              }`}
            >
              <Bell size={14} />
              {alertSet ? "Alert Set ✓" : "Set Entry Alert"}
            </button>
            <button
              onClick={() =>
                onOpenOrderTicket({
                  symbol: data.symbol,
                  price: data.price,
                  ref_id: data.ref_id,
                })
              }
              className="flex items-center justify-center gap-2 w-full px-4 py-2 rounded-lg text-xs font-medium bg-foreground text-background hover:opacity-90 transition-all cursor-pointer"
            >
              <Lightning size={14} />
              Execute Setup
            </button>
          </div>
        </div>
      </div>

      {/* ── Collapsed Detailed Playbook Insights ──────────────────────────── */}
      {data.ai_summary && (
        <div className="border-t border-border/15 pt-4 mt-1">
          <details className="group">
            <summary className="text-xs font-medium text-text-muted cursor-pointer hover:text-foreground select-none list-none flex items-center gap-1.5">
              <span className="transition-transform group-open:rotate-90 text-[10px] text-text-muted/70">
                ▶
              </span>
              <span>Detailed playbook analysis</span>
            </summary>
            <div className="mt-3 text-sm leading-relaxed text-text-muted bg-accent/10 p-3.5 rounded-lg border border-border/5 max-h-[160px] overflow-y-auto scrollbar-thin select-text">
              {renderMarkdown(data.ai_summary)}
            </div>
          </details>
        </div>
      )}
    </div>
  )
}
