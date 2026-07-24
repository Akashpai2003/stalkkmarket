import React, { useState, useEffect } from "react"
import { WarningCircle, Bank, ShieldCheck, Question } from "@phosphor-icons/react"

interface OrderTicketProps {
  scrip: any
  availableMargin: number
  onPlaceOrder: (orderPayload: any) => Promise<boolean>
  onClose: () => void
}

export const OrderTicket: React.FC<OrderTicketProps> = ({
  scrip,
  availableMargin,
  onPlaceOrder,
  onClose,
}) => {
  const [side, setSide] = useState<"BUY" | "SELL">("BUY")
  const [qty, setQty] = useState<number>(1)
  const priceType = "LIMIT"
  const [price, setPrice] = useState<number>(scrip.price)
  const [marginRequired, setMarginRequired] = useState<number>(0)
  const [loadingMargin, setLoadingMargin] = useState<boolean>(false)
  const [submitting, setSubmitting] = useState<boolean>(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [successMsg, setSuccessMsg] = useState<string | null>(null)

  // Fetch margin requirement dynamically when input changes
  useEffect(() => {
    const fetchMargin = async () => {
      if (qty <= 0) return
      setLoadingMargin(true)
      try {
        const response = await fetch(`/api/trade/margin`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ref_id: scrip.ref_id,
            qty: qty,
            side: side.toLowerCase(),
            price,
          }),
        })
        if (response.ok) {
          const data = await response.json()
          setMarginRequired(data.total_margin || (qty * price))
        } else {
          setMarginRequired(qty * price)
        }
      } catch (e) {
        console.error("Failed to fetch margin required, falling back to cash value", e)
        setMarginRequired(qty * price)
      } finally {
        setLoadingMargin(false)
      }
    }

    const timer = setTimeout(fetchMargin, 400)
    return () => clearTimeout(timer)
  }, [qty, price, side, scrip])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (qty <= 0) {
      setErrorMsg("Quantity must be greater than 0")
      return
    }
    if (price <= 0) {
      setErrorMsg("Limit price must be greater than 0")
      return
    }
    if (!scrip.ref_id) {
      setErrorMsg("Missing Nubra instrument ref_id. Resolve this symbol before placing an order.")
      return
    }
    if (marginRequired > availableMargin && side === "BUY") {
      setErrorMsg("Insufficient funds to place this order")
      return
    }

    setSubmitting(true)
    setErrorMsg(null)
    setSuccessMsg(null)

    try {
      const success = await onPlaceOrder({
        ref_id: scrip.ref_id,
        qty: qty,
        side: side,
        price,
        price_type: priceType,
        symbol: scrip.symbol,
      })

      if (success) {
        setSuccessMsg("Order executed successfully!")
        setTimeout(() => {
          onClose()
        }, 1500)
      } else {
        setErrorMsg("Failed to place order. Please check credentials.")
      }
    } catch (e: any) {
      setErrorMsg(e.message || "Failed to execute order")
    } finally {
      setSubmitting(false)
    }
  }

  const isBuy = side === "BUY"

  return (
    <div className="bg-card border border-border rounded-2xl p-4 w-full max-w-sm relative overflow-hidden shadow-2xl">
      {/* Side Color Header Bar Accent */}
      <div className={`absolute top-0 left-0 right-0 h-1 ${isBuy ? 'bg-primary' : 'bg-destructive'}`} />
      
      <div className="flex items-center justify-between mb-4 mt-2">
        <div>
          <h2 className="text-xs font-bold text-foreground flex items-center gap-1.5">
            <Bank size={16} className="text-text-muted" weight="regular" />
            Nubra Order Ticket
          </h2>
          <span className="text-[10px] text-text-muted uppercase tracking-wider font-semibold">
            {scrip.symbol} • CNC DELIVERY
          </span>
        </div>
        <button
          onClick={onClose}
          className="text-text-muted hover:text-foreground text-xs px-2 py-1 rounded-xl hover:bg-accent cursor-pointer transition-colors"
        >
          Cancel
        </button>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        {/* Buy/Sell selector */}
        <div className="grid grid-cols-2 p-1 bg-background rounded-xl border border-border">
          <button
            type="button"
            onClick={() => setSide("BUY")}
            className={`py-1.5 text-xs font-semibold rounded-xl transition-all cursor-pointer ${
              isBuy 
                ? 'bg-foreground text-background font-bold shadow-sm' 
                : 'text-text-muted hover:text-foreground'
            }`}
          >
            BUY
          </button>
          <button
            type="button"
            onClick={() => setSide("SELL")}
            className={`py-1.5 text-xs font-semibold rounded-xl transition-all cursor-pointer ${
              !isBuy 
                ? 'bg-destructive text-destructive-foreground font-bold shadow-sm' 
                : 'text-text-muted hover:text-foreground'
            }`}
          >
            SELL
          </button>
        </div>

        {/* Quantity and Price inputs */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-[10px] font-semibold text-text-muted uppercase block mb-1">Quantity</label>
            <input
              type="number"
              value={qty}
              min="1"
              onChange={(e) => setQty(Math.max(1, parseInt(e.target.value) || 1))}
              className="input-md font-mono"
            />
          </div>
          <div>
            <label className="text-[10px] font-semibold text-text-muted uppercase block mb-1">Price Type</label>
            <div className="input-md font-mono flex items-center bg-accent">LIMIT</div>
          </div>
        </div>

        {priceType === "LIMIT" && (
          <div>
            <label className="text-[10px] font-semibold text-text-muted uppercase block mb-1">Limit Price (₹)</label>
            <input
              type="number"
              step="0.05"
              value={price}
              onChange={(e) => setPrice(Math.max(0.05, parseFloat(e.target.value) || 0))}
              className="input-md font-mono"
            />
          </div>
        )}

        {/* Stats and Margin info */}
        <div className="bg-background border border-border rounded-xl p-3 flex flex-col gap-2 text-xs">
          <div className="flex justify-between items-center text-text-muted">
            <span>Available Balance</span>
            <span className="font-bold text-foreground">
              ₹{availableMargin?.toLocaleString("en-IN", { maximumFractionDigits: 2 })}
            </span>
          </div>
          <div className="flex justify-between items-center text-text-muted">
            <span className="flex items-center gap-1">
              Required Margin
              <Question size={12} className="text-text-muted/60" weight="regular" />
            </span>
            <span className="font-bold text-foreground">
              {loadingMargin ? (
                <span className="text-[10px] text-text-muted">Estimating...</span>
              ) : (
                `₹${marginRequired.toLocaleString("en-IN", { maximumFractionDigits: 2 })}`
              )}
            </span>
          </div>
        </div>

        {/* Status Messages */}
        {errorMsg && (
          <div className="p-3 bg-destructive/10 border border-destructive/25 text-destructive rounded-xl text-xs flex items-start gap-2 shadow-sm animate-pulse">
            <WarningCircle size={16} className="text-destructive shrink-0 mt-0.5" weight="regular" />
            <span>{errorMsg}</span>
          </div>
        )}

        {successMsg && (
          <div className="p-3 bg-accent border border-border text-foreground rounded-xl text-xs flex items-start gap-2 shadow-sm">
            <ShieldCheck className="h-4 w-4 shrink-0 mt-0.5 text-success animate-bounce" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Action Button */}
        <button
          type="submit"
          disabled={submitting}
          className={`btn btn-md w-full font-bold ${
            isBuy ? 'btn-primary' : 'btn-destructive'
          }`}
        >
          {submitting ? "PROCESSING TRANSACTION..." : `${side} ${qty} ${scrip.symbol}`}
        </button>
      </form>
    </div>
  )
}
