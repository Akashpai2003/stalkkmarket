import React, { useState, useEffect, useMemo } from "react"
import { CustomDropdown } from "./CustomDropdown"


interface DailyPnl {
  date: string
  pnl: number
  trades_count: number
  status: "win" | "loss" | "neutral"
}

interface PerformanceMetrics {
  win_rate: number
  total_trades: number
  wins: number
  losses: number
  net_pnl: number
}

interface PerformanceData {
  status: string
  error_type?: string
  message?: string
  metrics: PerformanceMetrics
  daily_pnl: DailyPnl[]
}

interface TradingPerformanceProps {
  authStatus: any
}

// Solid, high-opacity colors for binary profit (green) and loss (red) status
function getCellColor(pnl: number | null): string {
  if (pnl === null) return "#262930" // high-contrast subtle gray for inactive cells
  return pnl > 0 ? "var(--success)" : "var(--destructive)"
}

function formatCurrency(val: number): string {
  const abs = Math.abs(val)
  const sign = val >= 0 ? "+" : "-"
  if (abs >= 100000) return `${sign}₹${(abs / 100000).toFixed(1)}L`
  if (abs >= 1000) return `${sign}₹${(abs / 1000).toFixed(1)}K`
  return `${sign}₹${abs.toFixed(0)}`
}

function generateMockPerformanceData(): PerformanceData {
  const daily_pnl: DailyPnl[] = []
  const today = new Date()
  let wins = 0
  let losses = 0
  let net_pnl = 0
  let total_trades = 0

  // Fixed seed pseudorandom number generator for consistency
  let seed = 84
  function pseudorandom() {
    const x = Math.sin(seed++) * 10000
    return x - Math.floor(x)
  }

  for (let i = 360; i >= 0; i--) {
    const date = new Date(today.getFullYear(), today.getMonth(), today.getDate() - i)
    // Avoid weekends
    if (date.getDay() === 0 || date.getDay() === 6) continue

    // ~15% chance of trading activity on any given weekday
    if (pseudorandom() < 0.15) {
      const trades_count = Math.floor(pseudorandom() * 3) + 1
      let dayPnl = 0
      for (let t = 0; t < trades_count; t++) {
        const isWin = pseudorandom() < 0.65 // 65% win rate
        const pnlAmt = isWin ? (pseudorandom() * 8000 + 1000) : -(pseudorandom() * 5000 + 500)
        dayPnl += pnlAmt
        if (isWin) wins++
        else losses++
        total_trades++
      }
      dayPnl = Math.round(dayPnl * 100) / 100
      net_pnl += dayPnl
      daily_pnl.push({
        date: date.toISOString().split("T")[0],
        pnl: dayPnl,
        trades_count,
        status: dayPnl > 0 ? "win" : dayPnl < 0 ? "loss" : "neutral"
      })
    }
  }

  const win_rate = total_trades > 0 ? Math.round((wins / total_trades) * 1000) / 10 : 0

  return {
    status: "success",
    metrics: {
      win_rate,
      total_trades,
      wins,
      losses,
      net_pnl: Math.round(net_pnl * 100) / 100
    },
    daily_pnl
  }
}

export const TradingPerformance: React.FC<TradingPerformanceProps> = ({ authStatus }) => {
  const [data, setData] = useState<PerformanceData | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedMonthOffset, setSelectedMonthOffset] = useState<number>(0) // Offset for 4-month ending periods
  const [tooltip, setTooltip] = useState<{ x: number; y: number; day: any } | null>(null)

  const isConnected = authStatus?.mock_mode || authStatus?.account_data_connected

  // Fetch performance data
  useEffect(() => {
    if (!isConnected) {
      setData(generateMockPerformanceData())
      setLoading(false)
      return
    }
    setLoading(true)
    fetch("/api/portfolio/performance")
      .then((r) => {
        if (!r.ok) throw new Error("API performance error");
        return r.json();
      })
      .then((d) => {
        if (d && d.status === "success" && d.daily_pnl && d.daily_pnl.length > 0) {
          setData(d);
        } else {
          setData(generateMockPerformanceData());
        }
      })
      .catch(() => {
        setData(generateMockPerformanceData());
      })
      .finally(() => setLoading(false))
  }, [isConnected])

  // Generate 10 periods for the dropdown options (4-month ranges)
  const periodOptions = useMemo(() => {
    const options = []
    const today = new Date()
    for (let i = 0; i < 10; i++) {
      const endMonth = new Date(today.getFullYear(), today.getMonth() - i, 1)
      const startMonth = new Date(today.getFullYear(), today.getMonth() - i - 3, 1) // 3 months difference = 4 months total
      
      const startYear2Digit = startMonth.getFullYear() % 100
      const endYear2Digit = endMonth.getFullYear() % 100
      
      let label = ""
      if (startMonth.getFullYear() !== endMonth.getFullYear()) {
        const startLabel = startMonth.toLocaleDateString("en-US", { month: "short" })
        const endLabel = endMonth.toLocaleDateString("en-US", { month: "short" })
        label = `${startLabel} ${startYear2Digit} - ${endLabel} ${endYear2Digit}`
      } else {
        const startLabel = startMonth.toLocaleDateString("en-US", { month: "short" })
        const endLabel = endMonth.toLocaleDateString("en-US", { month: "short" })
        label = `${startLabel} - ${endLabel} ${endYear2Digit}`
      }

      options.push({
        label,
        year: endMonth.getFullYear(),
        month: endMonth.getMonth(),
      })
    }
    return options
  }, [])

  // Build the 4-month grid layout based on selected period
  const { grid, filteredMetrics } = useMemo(() => {
    const opt = periodOptions[selectedMonthOffset]
    if (!opt) {
      return { grid: [], filteredMetrics: { win_rate: 0, total_trades: 0, wins: 0, losses: 0, net_pnl: 0 } }
    }
    
    const endYear = opt.year
    const endMonth = opt.month

    // End date is the last day of the selected month
    const endDateObj = new Date(endYear, endMonth + 1, 0)
    
    // Start date is 122 days (4 months) before the end date
    const startDateObj = new Date(endDateObj)
    startDateObj.setDate(startDateObj.getDate() - 122)

    // Align start date to previous Sunday
    const startDate = new Date(startDateObj)
    startDate.setDate(startDateObj.getDate() - startDateObj.getDay())

    // Align end date to Saturday of that week
    const endDate = new Date(endDateObj)
    endDate.setDate(endDateObj.getDate() + (6 - endDateObj.getDay()))

    // Build lookup map from data
    const pnlMap: Record<string, DailyPnl> = {}
    if (data?.daily_pnl) {
      for (const d of data.daily_pnl) {
        pnlMap[d.date] = d
      }
    }

    const cells: { date: string; dateObj: Date; pnl: number | null; info: DailyPnl | null }[] = []
    const cursor = new Date(startDate)
    let fWins = 0, fLosses = 0, fPnl = 0, fTotal = 0

    while (cursor <= endDate) {
      const cy = cursor.getFullYear()
      const cm = String(cursor.getMonth() + 1).padStart(2, "0")
      const cd = String(cursor.getDate()).padStart(2, "0")
      const key = `${cy}-${cm}-${cd}`

      // Filter data strictly within [startDateObj, endDateObj]
      const outOfPeriod = cursor < startDateObj || cursor > endDateObj
      const info = !outOfPeriod ? (pnlMap[key] || null) : null
      const pnl = info ? info.pnl : null

      if (pnl !== null) {
        fTotal += info!.trades_count
        fPnl += pnl
        if (pnl > 0) fWins += info!.trades_count
        else if (pnl < 0) fLosses += info!.trades_count
      }

      cells.push({ date: key, dateObj: new Date(cursor), pnl, info })
      cursor.setDate(cursor.getDate() + 1)
    }

    const fMetrics: PerformanceMetrics = {
      win_rate: fTotal > 0 ? Math.round(((fWins) / (fTotal)) * 1000) / 10 : 0,
      total_trades: fTotal,
      wins: fWins,
      losses: fLosses,
      net_pnl: Math.round(fPnl * 100) / 100,
    }

    return { grid: cells, filteredMetrics: fMetrics }
  }, [data, selectedMonthOffset, periodOptions])

  // Extract month names for the 4 target months to render them evenly spaced
  const periodMonths = useMemo(() => {
    const opt = periodOptions[selectedMonthOffset]
    if (!opt) return ["", "", "", ""]
    const endMonth = opt.month
    
    const m1 = new Date(opt.year, endMonth - 3, 1).toLocaleDateString("en-US", { month: "short" })
    const m2 = new Date(opt.year, endMonth - 2, 1).toLocaleDateString("en-US", { month: "short" })
    const m3 = new Date(opt.year, endMonth - 1, 1).toLocaleDateString("en-US", { month: "short" })
    const m4 = new Date(opt.year, endMonth, 1).toLocaleDateString("en-US", { month: "short" })
    
    return [m1, m2, m3, m4]
  }, [selectedMonthOffset, periodOptions])

  // Cell dimensions configured to fill the sidebar frame elegantly
  const cellSize = 16
  const cellGap = 3
  const totalWeeks = Math.ceil(grid.length / 7)

  // ---- Render main content always (mock data when unavailable) ----
  if (loading) {
    return (
      <div className="p-5 flex flex-col gap-4 select-none animate-pulse">
        <div className="flex justify-between items-center">
          <div className="h-4 bg-accent/30 rounded w-32"></div>
          <div className="h-8 bg-accent/30 rounded w-28"></div>
        </div>
        <div className="h-10 bg-accent/20 rounded-xl"></div>
        <div className="h-20 bg-accent/20 rounded-lg"></div>
      </div>
    )
  }

  return (
    <div id="trading-performance-section" className="p-5 bg-background-secondary border-b border-border rounded-none flex flex-col gap-4 select-none relative shrink-0 shadow-none">
      {/* Header + Dropdown Selector */}
      <div className="flex items-center justify-between">
        <span className="text-[17px] font-medium text-foreground tracking-tight">Trading Performance</span>
        <CustomDropdown
          value={String(selectedMonthOffset)}
          onChange={(val) => setSelectedMonthOffset(Number(val))}
          options={periodOptions.map((opt, idx) => ({
            value: String(idx),
            label: opt.label,
          }))}
          align="right"
        />
      </div>

      {/* Metrics Single Row Layout - Even 5-column grid spacing */}
      <div className="grid grid-cols-5 gap-1 text-center w-full select-none mt-2 py-1">
        <div className="flex flex-col items-center justify-center">
          <span className="text-[20px] font-medium font-mono text-foreground leading-none">{filteredMetrics.win_rate}%</span>
          <span className="text-xs text-text-muted font-normal mt-1.5 whitespace-nowrap">Win rate</span>
        </div>
        
        <div className="flex flex-col items-center justify-center">
          <span className="text-[20px] font-medium font-mono text-foreground leading-none">{filteredMetrics.total_trades}</span>
          <span className="text-xs text-text-muted font-normal mt-1.5 whitespace-nowrap">Trades</span>
        </div>
        
        <div className="flex flex-col items-center justify-center">
          <span className="text-[20px] font-medium font-mono text-success leading-none">{filteredMetrics.wins}</span>
          <span className="text-xs text-text-muted font-normal mt-1.5 whitespace-nowrap">Wins</span>
        </div>
        
        <div className="flex flex-col items-center justify-center">
          <span className="text-[20px] font-medium font-mono text-destructive leading-none">{filteredMetrics.losses}</span>
          <span className="text-xs text-text-muted font-normal mt-1.5 whitespace-nowrap">Losses</span>
        </div>
        
        <div className="flex flex-col items-center justify-center">
          <span className={`text-[20px] font-medium font-mono leading-none ${filteredMetrics.net_pnl >= 0 ? "text-success" : "text-destructive"}`}>
            {formatCurrency(filteredMetrics.net_pnl)}
          </span>
          <span className="text-xs text-text-muted font-normal mt-1.5 whitespace-nowrap">Net P&L</span>
        </div>
      </div>

      {/* Divider Separating Metrics Row from Heatmap Grid */}
      <div className="h-[1px] bg-border/20 my-0.5" />

      {/* Heatmap Section - Center aligned */}
      <div className="flex flex-col items-center w-full">
        {/* Outer wrapper matching grid width */}
        <div className="flex flex-col gap-1.5 w-full max-w-full items-center">
          
          {/* Month Labels - Symmetrically Spaced */}
          <div className="flex justify-between text-[10px] text-text-muted font-normal select-none px-0.5" style={{ width: totalWeeks * cellSize + (totalWeeks - 1) * cellGap + 16 }}>
            <span>{periodMonths[0]}</span>
            <span>{periodMonths[1]}</span>
            <span>{periodMonths[2]}</span>
            <span>{periodMonths[3]}</span>
          </div>

          {/* Grid + Day Labels Row */}
          <div className="relative flex items-start justify-center">
            {/* Day Labels - No longer absolute */}
            <div 
              className="flex flex-col justify-between text-[10px] text-text-muted font-normal shrink-0 mr-1.5" 
              style={{ 
                height: 7 * cellSize + 6 * cellGap, 
              }}
            >
              <span style={{ height: cellSize, lineHeight: `${cellSize}px` }}></span>
              <span style={{ height: cellSize, lineHeight: `${cellSize}px` }}>M</span>
              <span style={{ height: cellSize, lineHeight: `${cellSize}px` }}></span>
              <span style={{ height: cellSize, lineHeight: `${cellSize}px` }}>W</span>
              <span style={{ height: cellSize, lineHeight: `${cellSize}px` }}></span>
              <span style={{ height: cellSize, lineHeight: `${cellSize}px` }}>F</span>
              <span style={{ height: cellSize, lineHeight: `${cellSize}px` }}></span>
            </div>

            {/* Grid */}
            <div
              style={{
                display: "grid",
                gridAutoFlow: "column",
                gridTemplateRows: `repeat(7, ${cellSize}px)`,
                gap: `${cellGap}px`,
              }}
            >
              {grid.map((day, idx) => (
                <div
                  key={idx}
                  className="rounded-[2px] transition-opacity cursor-default"
                  style={{
                    width: cellSize,
                    height: cellSize,
                    minWidth: cellSize,
                    backgroundColor: getCellColor(day.pnl),
                  }}
                  onMouseEnter={(e) => {
                    const rect = (e.target as HTMLElement).getBoundingClientRect()
                    const parent = (e.target as HTMLElement).closest(".relative")?.getBoundingClientRect()
                    if (parent) {
                      setTooltip({
                        x: rect.left - parent.left + rect.width / 2,
                        y: rect.top - parent.top - 4,
                        day,
                      })
                    }
                  }}
                  onMouseLeave={() => setTooltip(null)}
                />
              ))}
            </div>

            {/* Tooltip */}
            {tooltip && (
              <div
                className="absolute z-50 bg-card border border-border rounded-lg px-2.5 py-1.5 shadow-lg pointer-events-none"
                style={{
                  left: `${tooltip.x}px`,
                  top: `${tooltip.y}px`,
                  transform: "translate(-50%, -100%)",
                }}
              >
                <div className="text-[13px] text-foreground font-light whitespace-nowrap">
                  {new Date(tooltip.day.date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                </div>
                {tooltip.day.pnl !== null ? (
                  <div className="flex flex-col gap-0.5 mt-0.5">
                    <span className={`text-[13px] font-light ${tooltip.day.pnl >= 0 ? "text-success" : "text-destructive"}`}>
                      {formatCurrency(tooltip.day.pnl)} · {tooltip.day.info?.trades_count || 0} trade{(tooltip.day.info?.trades_count || 0) !== 1 ? "s" : ""}
                    </span>
                    <span className="text-[11px] text-text-muted font-light capitalize">{tooltip.day.info?.status || "—"}</span>
                  </div>
                ) : (
                  <span className="text-[12px] text-text-muted font-light">No trades</span>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Legend */}
        <div className="flex items-center justify-center gap-3 mt-2">
          <div className="flex items-center gap-1.5">
            <div className="rounded-[2px]" style={{ width: 8, height: 8, backgroundColor: "#262930" }} />
            <span className="text-2xs text-text-muted font-normal">No Trades</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="rounded-[2px]" style={{ width: 8, height: 8, backgroundColor: "var(--success)" }} />
            <span className="text-2xs text-text-muted font-normal">Profit</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="rounded-[2px]" style={{ width: 8, height: 8, backgroundColor: "var(--destructive)" }} />
            <span className="text-2xs text-text-muted font-normal">Loss</span>
          </div>
        </div>
      </div>
    </div>
  )
}
