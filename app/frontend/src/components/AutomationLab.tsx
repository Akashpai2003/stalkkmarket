import React, { useState } from "react"
import { Waveform, Warning, PlayCircle, ShieldCheck, ArrowsClockwise, Flask } from "@phosphor-icons/react"

const API_BASE = ""

export const AutomationLab: React.FC = () => {
  const [symbols, setSymbols] = useState("RELIANCE,TVSMOTOR,HFCL,KPITTECH")
  const [minScore, setMinScore] = useState(75)
  const [riskPct, setRiskPct] = useState(0.5)
  const [maxPositionPct, setMaxPositionPct] = useState(5)
  const [plans, setPlans] = useState<any[]>([])
  const [planMeta, setPlanMeta] = useState<any>(null)
  const [backtests, setBacktests] = useState<any[]>([])
  const [executionLog, setExecutionLog] = useState<any[]>([])
  const [loadingPlans, setLoadingPlans] = useState(false)
  const [loadingBacktest, setLoadingBacktest] = useState(false)
  const [status, setStatus] = useState<string | null>(null)

  const configPayload = {
    min_score: minScore,
    risk_per_trade_pct: riskPct,
    max_position_pct: maxPositionPct,
    max_orders: 2,
  }

  const loadPlans = async () => {
    setLoadingPlans(true)
    setStatus(null)
    try {
      const response = await fetch(`${API_BASE}/api/automation/plans`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...configPayload, dry_run: true }),
      })
      const data = await response.json()
      setPlans(data.plans || [])
      setPlanMeta(data)
    } catch (e) {
      setStatus("Unable to load automation plans.")
    } finally {
      setLoadingPlans(false)
    }
  }

  const runDryRun = async () => {
    setLoadingPlans(true)
    setStatus(null)
    try {
      const response = await fetch(`${API_BASE}/api/automation/run`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...configPayload, dry_run: true }),
      })
      const data = await response.json()
      setPlans(data.plans || [])
      setPlanMeta(data)
      setExecutionLog(data.execution_log || [])
      setStatus("Dry-run complete. No orders were placed.")
    } catch (e) {
      setStatus("Dry-run failed.")
    } finally {
      setLoadingPlans(false)
    }
  }

  const runBacktest = async () => {
    setLoadingBacktest(true)
    setStatus(null)
    try {
      const response = await fetch(`${API_BASE}/api/strategy/backtest`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          symbols: symbols.split(",").map((s) => s.trim()).filter(Boolean),
          period: "1y",
          initial_capital: 100000,
          risk_per_trade_pct: riskPct,
          max_position_pct: maxPositionPct,
          holding_days: 8,
        }),
      })
      const data = await response.json()
      setBacktests(data.results || [])
    } catch (e) {
      setStatus("Backtest failed.")
    } finally {
      setLoadingBacktest(false)
    }
  }

  return (
    <div className="w-full max-w-6xl px-4 flex flex-col gap-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border pb-4">
        <div>
          <h1 className="text-xl font-bold text-foreground">Automation Lab</h1>
          <p className="text-xs text-text-muted mt-1">Dry-run trading plans, risk checks, and backtests for NSE swing/scalp experiments.</p>
        </div>
        <div className="flex gap-2">
          <button onClick={loadPlans} disabled={loadingPlans} className="btn btn-secondary btn-sm gap-1.5">
            <ArrowsClockwise size={14} className={`${loadingPlans ? "animate-spin" : ""}`} weight="regular" />
            Refresh Plans
          </button>
          <button onClick={runDryRun} disabled={loadingPlans} className="btn btn-primary btn-sm gap-1.5">
            <PlayCircle className="h-3.5 w-3.5" />
            Dry Run
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="bg-card border border-border rounded-2xl p-5 shadow-sm flex flex-col gap-4">
          <div className="flex items-center gap-2">
            <ShieldCheck size={20} className="text-emerald-400" weight="regular" />
            <span className="text-xs font-bold uppercase tracking-wider">Risk Guard</span>
          </div>
          <label className="text-[10px] font-bold text-text-muted uppercase">Symbols</label>
          <input value={symbols} onChange={(e) => setSymbols(e.target.value)} className="input-md font-mono" />
          <label className="text-[10px] font-bold text-text-muted uppercase">Minimum Score</label>
          <input type="number" value={minScore} onChange={(e) => setMinScore(Number(e.target.value))} className="input-md font-mono" />
          <label className="text-[10px] font-bold text-text-muted uppercase">Risk Per Trade %</label>
          <input type="number" step="0.1" value={riskPct} onChange={(e) => setRiskPct(Number(e.target.value))} className="input-md font-mono" />
          <label className="text-[10px] font-bold text-text-muted uppercase">Max Position %</label>
          <input type="number" step="0.5" value={maxPositionPct} onChange={(e) => setMaxPositionPct(Number(e.target.value))} className="input-md font-mono" />
          <button onClick={runBacktest} disabled={loadingBacktest} className="btn btn-accent btn-md gap-1.5">
            <Flask size={16} weight="regular" />
            {loadingBacktest ? "Testing..." : "Run Backtest"}
          </button>
        </div>

        <div className="lg:col-span-3 flex flex-col gap-6">
          {status && (
            <div className="bg-accent border border-border rounded-2xl p-3 text-xs font-semibold text-foreground">
              {status}
            </div>
          )}

          <div className="bg-card border border-border rounded-2xl p-5 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Waveform size={20} className="text-emerald-400" weight="regular" />
                <h2 className="text-sm font-bold">Current Trade Plans</h2>
              </div>
              {planMeta && (
                <span className="text-[10px] font-mono text-text-muted">
                  Cash INR {Number(planMeta.available_cash || 0).toLocaleString("en-IN")} | Market {planMeta.market_open ? "Open" : "Closed"}
                </span>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {plans.length === 0 ? (
                <div className="text-xs text-text-muted border border-border rounded-xl p-4">No plans loaded yet.</div>
              ) : plans.map((plan) => (
                <div key={plan.symbol} className="border border-border rounded-xl p-4 bg-background/30 flex flex-col gap-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="text-sm font-bold text-foreground">{plan.symbol}</span>
                      <div className="text-[10px] text-text-muted font-mono mt-0.5">ref_id {plan.ref_id || "missing"}</div>
                    </div>
                    <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full border ${plan.status === "ready" ? "text-success border-success/30 bg-success/10" : "text-warning border-warning/30 bg-warning/10"}`}>
                      {plan.status}
                    </span>
                  </div>
                  <div className="grid grid-cols-4 gap-2 text-center text-[10px]">
                    <div><span className="block text-text-muted">Qty</span><b>{plan.qty}</b></div>
                    <div><span className="block text-text-muted">Limit</span><b>{plan.limit_price}</b></div>
                    <div><span className="block text-text-muted">Stop</span><b className="text-destructive">{plan.stop}</b></div>
                    <div><span className="block text-text-muted">Target</span><b className="text-success">{plan.target}</b></div>
                  </div>
                  {plan.warnings?.length > 0 && (
                    <div className="flex gap-2 text-[10px] text-warning border border-warning/25 bg-warning/10 rounded-xl p-2">
                      <Warning size={14} className="shrink-0" weight="regular" />
                      <span>{plan.warnings.join(" ")}</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {executionLog.length > 0 && (
            <div className="bg-card border border-border rounded-2xl p-5 shadow-sm">
              <h2 className="text-sm font-bold mb-3">Dry-Run Log</h2>
              <div className="flex flex-col gap-2">
                {executionLog.map((item, idx) => (
                  <div key={idx} className="text-xs font-mono border border-border rounded-xl p-3 bg-background/30">
                    {item.symbol}: {item.action}
                  </div>
                ))}
              </div>
            </div>
          )}

          {backtests.length > 0 && (
            <div className="bg-card border border-border rounded-2xl p-5 shadow-sm">
              <h2 className="text-sm font-bold mb-3">Backtest Results</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {backtests.map((bt) => (
                  <div key={bt.symbol} className="border border-border rounded-xl p-4 bg-background/30">
                    <div className="flex justify-between mb-3">
                      <span className="font-bold text-sm">{bt.symbol}</span>
                      <span className="text-[10px] text-text-muted">{bt.provider}</span>
                    </div>
                    <div className="grid grid-cols-3 gap-2 text-[10px] text-center">
                      <div><span className="block text-text-muted">Trades</span><b>{bt.summary.trade_count}</b></div>
                      <div><span className="block text-text-muted">Win Rate</span><b>{bt.summary.win_rate}%</b></div>
                      <div><span className="block text-text-muted">Return</span><b>{bt.summary.net_return_pct}%</b></div>
                      <div><span className="block text-text-muted">PnL</span><b>{bt.summary.net_pnl}</b></div>
                      <div><span className="block text-text-muted">Drawdown</span><b>{bt.summary.max_drawdown_pct}%</b></div>
                      <div><span className="block text-text-muted">Exp R</span><b>{bt.summary.expectancy_r}</b></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
