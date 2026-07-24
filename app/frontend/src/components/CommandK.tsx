import React, { useState, useEffect, useRef } from "react"
import { MagnifyingGlass, Sparkle, CaretRight } from "@phosphor-icons/react"
import stockIndex from "../stock_index.json"

interface CommandKProps {
  isOpen: boolean
  onClose: () => void
  onSelectStock: (symbol: string) => void
}

export const CommandK: React.FC<CommandKProps> = ({
  isOpen,
  onClose,
  onSelectStock,
}) => {
  const [query, setQuery] = useState<string>("")
  const [results, setResults] = useState<any[]>([])
  const overlayRef = useRef<HTMLDivElement>(null)

  // Trigger search query locally on stock_index.json
  useEffect(() => {
    const trimmedQuery = query.trim()
    if (!trimmedQuery) {
      setResults([])
      return
    }

    const searchStocks = () => {
      const q = trimmedQuery.toLowerCase()
      
      const filtered = stockIndex.filter(
        (s: any) =>
          s.Symbol.toLowerCase().includes(q) ||
          s["Company Name"].toLowerCase().includes(q) ||
          s.Sector.toLowerCase().includes(q)
      )

      // Sort: prioritize exact match or prefix matches
      const sorted = [...filtered].sort((a: any, b: any) => {
        const aSym = a.Symbol.toLowerCase()
        const bSym = b.Symbol.toLowerCase()
        const aStarts = aSym.startsWith(q)
        const bStarts = bSym.startsWith(q)
        
        if (aStarts && !bStarts) return -1
        if (!aStarts && bStarts) return 1
        
        return aSym.localeCompare(bSym)
      })

      // Limit results to 8 suggestions for height and layout constraint
      setResults(sorted.slice(0, 8))
    }

    const timer = setTimeout(searchStocks, 150) // Debounced by 150ms
    return () => clearTimeout(timer)
  }, [query])

  // Close command K on ESC key or outer click
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose()
    }
    if (isOpen) {
      window.addEventListener("keydown", handleKeyDown)
    }
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [isOpen, onClose])

  if (!isOpen) return null

  const handleSelect = (symbol: string) => {
    onSelectStock(symbol.toUpperCase())
    setQuery("")
    onClose()
  }

  const defaultSuggestions = [
    { symbol: "HFCL", name: "HFCL Ltd.", sector: "Telecom" },
    { symbol: "KPITTECH", name: "KPIT Technologies", sector: "Auto Ancillary" },
    { symbol: "JBM AUTO", name: "JBM Auto Ltd.", sector: "Auto" },
    { symbol: "BLS INTL", name: "BLS International", sector: "Financials" }
  ]

  return (
    <div 
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-start justify-center pt-28 px-4"
      onClick={(e) => e.target === overlayRef.current && onClose()}
      ref={overlayRef}
    >
      <div className="bg-card border border-border rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col">
        {/* Search Input Bar */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-border bg-background/40">
          <MagnifyingGlass size={16} className="text-text-muted shrink-0" weight="regular" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search a stock (e.g., RELIANCE, TCS, HFCL) or sector..."
            autoFocus
            className="w-full bg-transparent text-foreground placeholder-text-muted text-xs focus:outline-none"
          />
          <kbd className="text-[10px] bg-accent text-foreground border border-border px-1.5 py-0.5 rounded-xl font-mono select-none">
            ESC
          </kbd>
        </div>

        {/* Results Panel */}
        <div className="p-2.5 max-h-[320px] overflow-y-auto flex flex-col gap-1.5">
          {query.trim() === "" ? (
            <>
              <div className="px-2 py-1 text-[9px] font-bold text-text-muted uppercase tracking-wider">
                Suggested Opportunities
              </div>
              {defaultSuggestions.map((item, index) => (
                <button
                  key={index}
                  onClick={() => handleSelect(item.symbol)}
                  className="h-8 flex items-center justify-between px-3 hover:bg-accent focus:bg-accent focus:outline-none rounded-xl text-left text-foreground transition-colors w-full cursor-pointer text-xs"
                >
                  <div className="flex items-center gap-2">
                    <Sparkle size={14} className="text-text-muted" weight="regular" />
                    <div>
                      <span className="font-semibold text-foreground">{item.symbol}</span>
                      <span className="text-text-muted ml-2 text-[11px]">{item.name}</span>
                    </div>
                  </div>
                  <span className="text-[10px] text-text-muted bg-background border border-border px-2 py-0.5 rounded-full">
                    {item.sector}
                  </span>
                </button>
              ))}
            </>
          ) : results.length > 0 ? (
            <>
              <div className="px-2 py-1 text-[9px] font-bold text-text-muted uppercase tracking-wider">
                Scrips Found ({results.length})
              </div>
              {results.map((item: any, index: number) => (
                <button
                  key={index}
                  onClick={() => handleSelect(item.Symbol)}
                  className="h-8 flex items-center justify-between px-3 hover:bg-accent focus:bg-accent focus:outline-none rounded-xl text-left text-foreground transition-colors w-full cursor-pointer text-xs"
                >
                  <div className="flex items-center gap-2">
                    <Sparkle size={14} className="text-text-muted" weight="regular" />
                    <div>
                      <span className="font-semibold text-foreground">{item.Symbol}</span>
                      <span className="text-text-muted ml-2 text-[11px]">{item["Company Name"]}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-text-muted bg-background border border-border px-2 py-0.5 rounded-full">
                      {item.Sector}
                    </span>
                    <CaretRight size={14} className="text-text-muted shrink-0" weight="regular" />
                  </div>
                </button>
              ))}
            </>
          ) : (
            <div className="py-6 text-center text-text-muted text-xs">
              No matching scrips or sectors found for "{query}"
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
