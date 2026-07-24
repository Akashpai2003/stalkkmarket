import React from "react"
import { TrendUp, TrendDown, Wallet, Briefcase, Plus } from "@phosphor-icons/react"
import { ErrorDisplay } from "./ErrorDisplay"

interface HoldingsOverviewProps {
  portfolioData: any
  onSelectScrip: (symbol: string) => void
  onOpenUploader: () => void
  onOpenSyncModal?: () => void
}

export const HoldingsOverview: React.FC<HoldingsOverviewProps> = ({
  portfolioData,
  onSelectScrip,
  onOpenUploader,
  onOpenSyncModal,
}) => {
  const isError = portfolioData?.status === "error"
  const isUnauthenticated = !portfolioData || portfolioData?.holdings?.client_code === "UNAUTHENTICATED" || (isError && portfolioData.error_type === "NOT_AUTHENTICATED")

  const funds = portfolioData?.funds || {
    start_of_day_funds: 0,
    net_margin_available: 0,
    total_margin_blocked: 0,
    brokerage: 0
  }
  
  const holdingsStats = portfolioData?.holdings?.holding_stats || {
    invested_amount: 0,
    current_value: 0,
    total_pnl: 0,
    total_pnl_chg: 0,
    day_pnl: 0,
    day_pnl_chg: 0
  }

  const holdings = portfolioData?.holdings?.holdings || []

  // Check authentication error first
  if (isUnauthenticated) {
    return (
      <div className="flex flex-col items-center justify-center py-16 px-6 text-center bg-card border border-border rounded-2xl gap-6 max-w-md mx-auto mt-12 shadow-sm">
        <div className="p-4 bg-accent text-foreground rounded-full">
          <Wallet className="h-8 w-8" />
        </div>
        <div>
          <h2 className="text-base font-bold text-foreground">Connect Nubra Account</h2>
          <p className="text-xs text-text-muted mt-2 max-w-sm leading-relaxed">
            Authorize your Nubra broker session to view live holdings, check available margin limits, and execute automated trade setups.
          </p>
        </div>
        <button
          onClick={onOpenSyncModal}
          className="btn btn-primary btn-md px-6 font-bold"
        >
          SYNC NUBRA BROKER API
        </button>
      </div>
    )
  }

  // Handle other connection errors
  if (isError) {
    return (
      <div className="max-w-md mx-auto mt-12">
        <ErrorDisplay
          title={portfolioData.title || "Connection Failed"}
          reason={portfolioData.reason || "An error occurred while fetching your holdings from Nubra."}
          action={portfolioData.action || "Please try syncing your session again."}
          onRetry={onOpenSyncModal || (() => {})}
        />
      </div>
    )
  }

  const pnlIsPositive = holdingsStats.total_pnl >= 0

  const isSandbox = portfolioData?.is_sandbox
  const isPartial = portfolioData?.status === "partial"

  return (
    <div className="flex flex-col gap-6 text-foreground">
      {/* Sandbox Mode Warning Banner */}
      {isSandbox && (
        <div className="flex items-center gap-3 px-4 py-3 bg-accent border border-border text-foreground text-xs rounded-xl">
          <div className="h-2 w-2 rounded-full bg-warning animate-pulse" />
          <div>
            <span className="font-semibold">Sandbox Mode Active</span>
            <span className="text-text-muted ml-2">You are viewing a simulated sandbox portfolio. Link your Nubra account in Settings to trade with real capital.</span>
          </div>
        </div>
      )}

      {/* Partial Connection Caution Banner */}
      {isPartial && (
        <div className="flex items-start gap-3 px-4 py-3 bg-destructive/5 border border-destructive/20 text-destructive text-xs rounded-xl">
          <div className="h-2 w-2 rounded-full bg-destructive mt-1.5" />
          <div>
            <span className="font-semibold block">Partial Account Connection</span>
            <span className="text-text-muted mt-0.5 block leading-relaxed">
              Failed services: {Object.keys(portfolioData.partial_errors || {}).map(s => s.charAt(0).toUpperCase() + s.slice(1)).join(", ")}. Other parameters are fetched from cache.
            </span>
          </div>
        </div>
      )}

      {/* Portfolio Header Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Margin Card */}
        <div className="bg-card border border-border rounded-2xl p-4 flex items-start gap-4 shadow-sm">
          <div className="p-2.5 bg-accent rounded-xl text-foreground">
            <Wallet className="h-5 w-5" />
          </div>
          <div>
            <span className="text-[10px] font-semibold text-text-muted uppercase tracking-wider block">Available Margin</span>
            <span className="text-lg font-bold text-foreground mt-1 block">
              ₹{funds.net_margin_available?.toLocaleString("en-IN", { maximumFractionDigits: 2 })}
            </span>
            <span className="text-[10px] text-text-muted mt-0.5 block">
              SOD: ₹{funds.start_of_day_funds?.toLocaleString("en-IN")}
            </span>
          </div>
        </div>

        {/* Invested Value */}
        <div className="bg-card border border-border rounded-2xl p-4 flex items-start gap-4 shadow-sm">
          <div className="p-2.5 bg-accent rounded-xl text-foreground">
            <Briefcase className="h-5 w-5" />
          </div>
          <div>
            <span className="text-[10px] font-semibold text-text-muted uppercase tracking-wider block">Invested Value</span>
            <span className="text-lg font-bold text-foreground mt-1 block">
              ₹{holdingsStats.invested_amount?.toLocaleString("en-IN", { maximumFractionDigits: 2 })}
            </span>
            <span className="text-[10px] text-text-muted mt-0.5 block">
              Current: ₹{holdingsStats.current_value?.toLocaleString("en-IN", { maximumFractionDigits: 2 })}
            </span>
          </div>
        </div>

        {/* Total Returns */}
        <div className="bg-card border border-border rounded-2xl p-4 flex items-start gap-4 shadow-sm">
          <div className={`p-2.5 rounded-xl ${pnlIsPositive ? 'bg-success/10 text-success' : 'bg-destructive/10 text-destructive'}`}>
            {pnlIsPositive ? <TrendUp size={20} weight="regular" /> : <TrendDown size={20} weight="regular" />}
          </div>
          <div className="w-full">
            <span className="text-[10px] font-semibold text-text-muted uppercase tracking-wider block">Total Returns</span>
            <span className={`text-lg font-bold mt-1 block ${pnlIsPositive ? 'text-success' : 'text-destructive'}`}>
              ₹{holdingsStats.total_pnl?.toLocaleString("en-IN", { maximumFractionDigits: 2 })}
            </span>
            <span className={`text-[10px] mt-0.5 block font-semibold ${pnlIsPositive ? 'text-success' : 'text-destructive'}`}>
              {pnlIsPositive ? '+' : ''}{holdingsStats.total_pnl_chg?.toFixed(2)}% overall
            </span>
          </div>
        </div>
      </div>

      {/* Holdings Table Section */}
      <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm">
        <div className="p-4 border-b border-border flex items-center justify-between">
          <div>
            <h2 className="text-sm font-bold text-foreground">Active Trade Holdings</h2>
            <p className="text-[11px] text-text-muted mt-0.5">Live statistics synchronized via Nubra Demat account</p>
          </div>
          <button
            onClick={onOpenUploader}
            className="btn btn-accent btn-sm gap-1.5 font-semibold"
          >
            <Plus size={16} weight="regular" />
            Upload Playbook
          </button>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-background/40 text-text-muted border-b border-border uppercase tracking-wider text-[10px]">
              <tr>
                <th className="py-3 px-4 font-semibold">Instrument</th>
                <th className="py-3 px-4 font-semibold text-right">Qty</th>
                <th className="py-3 px-4 font-semibold text-right">Avg Price</th>
                <th className="py-3 px-4 font-semibold text-right">LTP</th>
                <th className="py-3 px-4 font-semibold text-right">Current Value</th>
                <th className="py-3 px-4 font-semibold text-right">Returns</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {holdings.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 px-4 text-center text-text-muted font-medium">
                    No active holdings in your linked Nubra account.
                  </td>
                </tr>
              ) : (
                holdings.map((holding: any, index: number) => {
                  const holdingPositive = holding.net_pnl >= 0
                  return (
                    <tr 
                      key={index} 
                      onClick={() => onSelectScrip(holding.symbol)}
                      className="hover:bg-accent/40 transition-colors cursor-pointer"
                    >
                      <td className="py-3 px-4">
                        <div className="font-semibold text-foreground">{holding.displayName}</div>
                        <div className="text-[10px] text-text-muted mt-0.5">{holding.exchange} • Equity</div>
                      </td>
                      <td className="py-3 px-4 text-right font-medium text-foreground">
                        {holding.qty}
                      </td>
                      <td className="py-3 px-4 text-right font-mono text-text-muted">
                        ₹{holding.avg_price?.toFixed(2)}
                      </td>
                      <td className="py-3 px-4 text-right font-mono text-foreground">
                        ₹{holding.ltp?.toFixed(2)}
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-medium text-foreground">
                        ₹{holding.current_value?.toLocaleString("en-IN", { maximumFractionDigits: 2 })}
                      </td>
                      <td className="py-3 px-4 text-right font-mono">
                        <span className={`font-semibold block ${holdingPositive ? 'text-success' : 'text-destructive'}`}>
                          {holdingPositive ? '+' : ''}₹{holding.net_pnl?.toLocaleString("en-IN", { maximumFractionDigits: 2 })}
                        </span>
                        <span className={`text-[10px] block mt-0.5 ${holdingPositive ? 'text-success font-semibold' : 'text-destructive'}`}>
                          {holdingPositive ? '+' : ''}{holding.net_pnl_chg?.toFixed(2)}%
                        </span>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
        <div className="h-4" />
      </div>
    </div>
  )
}
