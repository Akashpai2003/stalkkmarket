import React, { useState, useEffect, useRef, useCallback } from "react"
import { motion } from "motion/react"
import { ArrowLeft, MagnifyingGlass, ArrowsClockwise, Check, ArrowRight, ShieldWarning, GitDiff, ChartBar as BarChart3, Waveform, Sparkle, TrendUp as TrendingUp, Lightning as Zap, Crosshair as Target, Trophy, PaperPlaneRight, Building } from "@phosphor-icons/react"
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip } from "recharts"
import stockIndex from "../stock_index.json"
import { OpenUIRenderer } from "./OpenUIRenderer"
import { getDummyAnalysis } from "../lib/dummyData"
import type { StockAnalysis, ChartDataPoint } from "../lib/dummyData"

interface StockItem {
  Symbol: string
  "Company Name": string
  Sector: string
}

interface ResearchAssistantProps {
  selectedSymbol: string | null
  onSelectSymbol: (symbol: string | null) => void
  isExpanded?: boolean
}

type ViewState = "home" | "explore_market" | "analyze_stock" | "compare_stocks" | "explore_portfolio" | "chat" | "setups" | "compare" | "analyze" | "review"

interface ChatMessage {
  role: "user" | "assistant"
  content?: string
  responseType?: string
  data?: any
  sources?: string[]
}

const ChatLoadingIndicator: React.FC<{ message?: string }> = ({ message = "Looking into this..." }) => {
  return (
    <div className="flex flex-col gap-1 items-start w-full max-w-[60%] select-none my-1">
      <span className="text-[11px] text-white font-medium px-1">Assistant</span>
      <div className="bg-card border border-border/40 p-4 rounded-2xl flex items-center gap-3 shadow-sm w-full">
        <div className="ai-organic-blob w-7 h-7 shrink-0" />
        <div className="flex flex-col gap-0.5">
          <span className="text-xs text-foreground font-medium">
            {message}
          </span>
          <span className="text-2xs text-text-muted">Gathering insights...</span>
        </div>
      </div>
    </div>
  )
}



export const Chatbot: React.FC<ResearchAssistantProps> = ({
  selectedSymbol,
  onSelectSymbol: _onSelectSymbol,
  isExpanded = false,
}) => {
  // Navigation stack
  const [history, setHistory] = useState<ViewState[]>(["home"])
  const currentView = history[history.length - 1] || "home"
  // Autocomplete & Comparison State
  const [stock1Query, setStock1Query] = useState("")
  const [stock2Query, setStock2Query] = useState("")
  const [selectedStock1, setSelectedStock1] = useState<StockItem | null>(null)
  const [selectedStock2, setSelectedStock2] = useState<StockItem | null>(null)
  const [suggestions1, setSuggestions1] = useState<StockItem[]>([])
  const [suggestions2, setSuggestions2] = useState<StockItem[]>([])
  const [showSuggestions1, setShowSuggestions1] = useState(false)
  const [showSuggestions2, setShowSuggestions2] = useState(false)
  const [compareLoading, setCompareLoading] = useState(false)
  const [compareError, setCompareError] = useState<string | null>(null)
  const [compareResult, setCompareResult] = useState<any | null>(null)

  // Chat History & Inputs State
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([])
  const [suggestedFollowUps, setSuggestedFollowUps] = useState<string[]>([])
  const [chatInput, setChatInput] = useState("")
  const [searchQuery, setSearchQuery] = useState("")
  const [chatLoading, setChatLoading] = useState(false)
  const [chatError, setChatError] = useState<string | null>(null)
  const [pendingFlow, setPendingFlow] = useState<"analyze" | "compare" | "check" | "why" | null>(null)
  
  // Progressive response building state
  const [buildingResponse, setBuildingResponse] = useState<{
    active: boolean;
    stock: string;
    stage: 'thinking' | 'chart' | 'metrics' | 'analysis' | 'followups';
    data?: StockAnalysis;
  } | null>(null)
  const buildingTimers = useRef<ReturnType<typeof setTimeout>[]>([])
  
  // Clean up building timers on unmount
  useEffect(() => {
    return () => {
      buildingTimers.current.forEach(clearTimeout);
      buildingTimers.current = [];
    };
  }, [])

  useEffect(() => {
    if (selectedSymbol) {
      setSuggestedFollowUps([
        `Show the swing trade setup for ${selectedSymbol}`,
        `What is the opportunity score for ${selectedSymbol}?`,
        `What does the RSI indicate for ${selectedSymbol}?`
      ])
    } else {
      setSuggestedFollowUps([
        "What are the top opportunities today?",
        "Explain the swing strategy rules",
        "How do I connect my Nubra broker?"
      ])
    }
  }, [selectedSymbol])

  // ====================================================
  // Conversational Analysis with Progressive Build
  // ====================================================
  const startConversationalAnalysis = useCallback((symbol: string, name?: string) => {
    // Clear any existing building timers
    buildingTimers.current.forEach(clearTimeout);
    buildingTimers.current = [];

    // Add user message
    const userMsg: ChatMessage = {
      role: "user",
      content: `Analyze ${symbol}${name ? ` (${name})` : ''}`
    };
    setChatHistory(prev => [...prev, userMsg]);
    setSuggestedFollowUps([]);

    // Generate dummy data
    const analysis = getDummyAnalysis(symbol);

    // Helper to set stage
    const setStage = (stage: 'thinking' | 'chart' | 'metrics' | 'analysis' | 'followups') => {
      setBuildingResponse({
        active: true,
        stock: symbol,
        stage: stage as any,
        data: analysis
      });
    };

    // Stage 1: Thinking (immediate for 2.4s)
    setBuildingResponse({
      active: true,
      stock: symbol,
      stage: 'thinking',
      data: analysis
    });

    // Stage 2: Chart appears (2.4s)
    buildingTimers.current.push(setTimeout(() => {
      setStage('chart');
    }, 2400));

    // Stage 3: Metrics appear (3.6s)
    buildingTimers.current.push(setTimeout(() => {
      setStage('metrics');
    }, 3600));

    // Stage 4: Analysis text appears (4.8s)
    buildingTimers.current.push(setTimeout(() => {
      setStage('analysis');
    }, 4800));

    // Stage 5: Complete with follow-ups (6s) and add to chat
    buildingTimers.current.push(setTimeout(() => {
      setBuildingResponse(null);

      const responseMsg: ChatMessage = {
        role: "assistant",
        responseType: "OpenUI",
        data: {
          openui: analysis.openuiCode,
          text: analysis.analysis,
          stockData: analysis
        },
        content: analysis.analysis,
        sources: ["Dummy Data Engine", "Technical Analysis"]
      };
      setChatHistory(prev => [...prev, responseMsg]);
      setSuggestedFollowUps(analysis.followUps.slice(0, 3));
    }, 6000));
  }, []);

  const handleSelectStockForAnalysis = (symbol: string, name?: string) => {
    const stockDisplayName = name || symbol;
    setChatHistory(prev => [
      ...prev,
      { role: "user", content: symbol },
      {
        role: "assistant",
        content: `Selected **${stockDisplayName}**. Choose analysis type:`,
        responseType: "InteractivePrompt",
        data: { flow: "analyze_step2", symbol }
      }
    ]);
  };

  const handleConfirmCompareStocks = (s1: string, s2: string) => {
    const sym1 = s1.trim() || "RELIANCE";
    const sym2 = s2.trim() || "TATAMOTORS";
    setChatHistory(prev => [
      ...prev,
      { role: "user", content: `Compare ${sym1} vs ${sym2}` },
      {
        role: "assistant",
        content: `What matters most to you in comparing **${sym1}** and **${sym2}**?`,
        responseType: "InteractivePrompt",
        data: { flow: "compare_step2", stock1: sym1, stock2: sym2 }
      }
    ]);
  };

  // Helper: render a mini chart for the building response
  const renderMiniChart = (data: ChartDataPoint[] | undefined, metric: 'price' | 'rsi' = 'price') => {
    if (!data || data.length === 0) return null;
    const isPrice = metric === 'price';
    const color = isPrice ? 'var(--success)' : 'var(--primary)';
    const dataKey = isPrice ? 'price' : 'rsi';
    const domain: [number, number] = isPrice
      ? [Math.min(...data.map(d => d.price)) * 0.98, Math.max(...data.map(d => d.price)) * 1.02]
      : [20, 80];

    return (
      <div className="w-full h-48">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data}>
            <defs>
              <linearGradient id={`gradient-${metric}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={color} stopOpacity={0.15} />
                <stop offset="95%" stopColor={color} stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" strokeOpacity={0.3} />
            <XAxis dataKey="date" tick={{ fontSize: 10, fill: 'var(--text-muted)' }} tickFormatter={(v) => v?.slice(5) || ''} interval="preserveStartEnd" />
            <YAxis domain={domain} tick={{ fontSize: 10, fill: 'var(--text-muted)' }} tickFormatter={(v) => isPrice ? `₹${v}` : v.toFixed(0)} width={55} />
            <Tooltip
              contentStyle={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 8, fontSize: 12 }}
              labelStyle={{ color: 'var(--foreground)', fontWeight: 500 }}
              formatter={(value: any) => [isPrice ? `₹${Number(value).toFixed(2)}` : Number(value).toFixed(1), isPrice ? 'Price' : 'RSI']}
            />
            <Area type="monotone" dataKey={dataKey} stroke={color} strokeWidth={2} fill={`url(#gradient-${metric})`} dot={false} activeDot={{ r: 3 }} />
            {!isPrice && (
              <>
                <Area type="monotone" dataKey={() => 70} stroke="#ef4444" strokeWidth={1} strokeDasharray="4 4" fill="none" />
                <Area type="monotone" dataKey={() => 30} stroke="#10b981" strokeWidth={1} strokeDasharray="4 4" fill="none" />
              </>
            )}
          </AreaChart>
        </ResponsiveContainer>
      </div>
    );
  };

  // Helper: render the building response in chat
  const renderBuildingResponse = () => {
    if (!buildingResponse?.active) return null;
    const { stage, data } = buildingResponse;
    if (!data) return null;

    return (
      <div className="flex flex-col items-start w-full my-2">
        <div className="flex items-center gap-1.5 px-1 mb-1 select-none">
          <div className="ai-organic-blob w-3.5 h-3.5 shrink-0" style={{ filter: "none", animation: "none" }} />
          <span className="text-[11px] text-amber-500/70 font-medium tracking-wide">AI</span>
        </div>
        <div className="bg-card border border-border/20 rounded-[20px] rounded-tl-sm w-full overflow-hidden">
          {/* Thinking Stage */}
          {stage === 'thinking' && (
            <div className="flex items-center gap-3.5 p-5">
              <div className="ai-organic-blob w-8 h-8 shrink-0" />
              <div>
                <span className="text-[14px] text-text-muted font-medium">Analyzing {buildingResponse.stock}...</span>
                <div className="flex mt-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-foreground/50 animate-bounce" style={{ animationDelay: "0ms" }}></span>
                  <span className="w-1.5 h-1.5 rounded-full bg-foreground/50 animate-bounce ml-1" style={{ animationDelay: "150ms" }}></span>
                  <span className="w-1.5 h-1.5 rounded-full bg-foreground/50 animate-bounce ml-1" style={{ animationDelay: "300ms" }}></span>
                </div>
              </div>
            </div>
          )}

          {/* Chart Stage */}
          {['chart', 'metrics', 'analysis', 'followups'].includes(stage) && (
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, ease: "easeOut" }}
              className="p-4 border-b border-border/20"
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <BarChart3 size={16} className="text-foreground/60" weight="regular" />
                  <span className="text-[13px] font-medium text-foreground">{data.symbol} — RSI Movement (14-Day)</span>
                </div>
                <div className="flex gap-2">
                  <span className="text-2xs text-rose-400 bg-rose-500/10 px-2 py-0.5 rounded-full border border-rose-500/20">↑ Overbought &gt;70</span>
                  <span className="text-2xs text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">↓ Oversold &lt;30</span>
                </div>
              </div>
              {renderMiniChart(data.chartData, 'rsi')}
            </motion.div>
          )}

          {/* Metrics Stage */}
          {['metrics', 'analysis', 'followups'].includes(stage) && (
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, ease: "easeOut" }}
              className="p-4 border-b border-border/20"
            >
              <div className="flex items-center gap-2 mb-3">
                <Waveform size={16} className="text-foreground/60" weight="regular" />
                <span className="text-[13px] font-medium text-foreground">Key Metrics</span>
              </div>
              <div className="grid grid-cols-3 gap-2.5">
                <div className="bg-accent/30 border border-border/40 rounded-xl p-3">
                  <span className="text-2xs text-text-muted uppercase tracking-wider font-medium">Price (LTP)</span>
                  <span className="text-[22px] font-medium text-foreground block mt-1 font-mono whitespace-nowrap leading-none">₹{data.metrics.price.toFixed(2)}</span>
                  <span className={`text-[11px] font-medium mt-1 block ${data.metrics.change >= 0 ? 'text-success' : 'text-destructive'}`}>
                    {data.metrics.change >= 0 ? '+' : ''}{data.metrics.changePercent.toFixed(2)}%
                  </span>
                </div>
                <div className="bg-accent/30 border border-border/40 rounded-xl p-3">
                  <span className="text-2xs text-text-muted uppercase tracking-wider font-medium">Score</span>
                  <span className="text-[22px] font-medium text-foreground block mt-1 font-mono whitespace-nowrap leading-none">{data.score}</span>
                  <span className="text-[11px] font-medium text-text-muted mt-1 block">{data.score >= 70 ? 'High Conviction' : data.score >= 55 ? 'Moderate' : 'Low'}</span>
                </div>
                <div className="bg-accent/30 border border-border/40 rounded-xl p-3">
                  <span className="text-2xs text-text-muted uppercase tracking-wider font-medium">RSI (14)</span>
                  <span className="text-[22px] font-medium text-foreground block mt-1 font-mono whitespace-nowrap leading-none">{data.rsi.toFixed(1)}</span>
                  {data.rsi > 60 ? (
                    <span className="text-[11px] font-medium mt-1 block text-success">Strong Momentum</span>
                  ) : data.rsi < 40 ? (
                    <span className="text-[11px] font-medium mt-1 block text-destructive">Oversold</span>
                  ) : null}
                </div>
              </div>
            </motion.div>
          )}

          {/* Analysis Summary — visual blocks */}
          {['analysis', 'followups'].includes(stage) && (
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, ease: "easeOut" }}
              className="p-4"
            >
              {/* Visual RSI Zone Bar */}
              <div className="bg-accent/30 border border-border/40 rounded-xl p-3.5 mb-3 shadow-sm">
                <span className="text-xs font-medium text-foreground mb-2.5 block">RSI Zone</span>
                <div className="relative h-8 w-full">
                  {/* Track */}
                  <div className="absolute inset-0 top-2.5 h-3 rounded-full overflow-hidden flex">
                    <div className="w-[30%] bg-red-500/20 border-r border-border/30" />
                    <div className="w-[40%] bg-amber-500/10" />
                    <div className="w-[30%] bg-emerald-500/20 border-l border-border/30" />
                  </div>
                  {/* Labels */}
                  <div className="absolute -top-1 left-0 text-[9px] text-red-400 font-medium">0</div>
                  <div className="absolute -top-1 left-[30%] -translate-x-1/2 text-[9px] text-text-muted">30</div>
                  <div className="absolute -top-1 left-[70%] -translate-x-1/2 text-[9px] text-text-muted">70</div>
                  <div className="absolute -top-1 right-0 text-[9px] text-emerald-400 font-medium">100</div>
                  {/* Zone labels inside bar */}
                  <div className="absolute top-2.5 left-[2%] w-[28%] h-3 flex items-center justify-center">
                    <span className="text-[8px] text-red-300/70 font-medium">Oversold</span>
                  </div>
                  <div className="absolute top-2.5 left-[32%] w-[36%] h-3 flex items-center justify-center">
                    <span className="text-[8px] text-amber-300/50 font-medium">Neutral</span>
                  </div>
                  <div className="absolute top-2.5 left-[72%] w-[26%] h-3 flex items-center justify-center">
                    <span className="text-[8px] text-emerald-300/70 font-medium">Overbought</span>
                  </div>
                  {/* Marker */}
                  {(() => {
                    const pct = Math.min(100, Math.max(0, data.rsi));
                    return (
                      <div className="absolute top-0.5 w-0 h-0" style={{ left: `${pct}%` }}>
                        <div className="-translate-x-1/2 w-5 h-5 bg-foreground rounded-full border-2 border-background shadow-lg flex items-center justify-center">
                          <span className="text-[7px] font-bold text-background">{data.rsi.toFixed(0)}</span>
                        </div>
                      </div>
                    );
                  })()}
                </div>
              </div>

              {/* Key Stats — 3 visual cards */}
              <div className="grid grid-cols-3 gap-2 mb-3">
                <div className="bg-accent/30 border border-border/40 rounded-xl p-3 text-center">
                  <span className="text-[10px] text-text-muted uppercase tracking-wider font-medium block">Status</span>
                  <span className={`text-sm font-bold mt-1 block ${data.rsi > 60 ? 'text-emerald-400' : data.rsi < 40 ? 'text-red-400' : 'text-amber-400'}`}>
                    {data.rsi > 60 ? 'Strong' : data.rsi < 40 ? 'Weak' : 'Flat'}
                  </span>
                </div>
                <div className="bg-accent/30 border border-border/40 rounded-xl p-3 text-center">
                  <span className="text-[10px] text-text-muted uppercase tracking-wider font-medium block">Range</span>
                  <span className="text-sm font-bold mt-1 block text-foreground">30–70</span>
                  <span className="text-[9px] text-text-muted block mt-0.5">Healthy band</span>
                </div>
                <div className="bg-accent/30 border border-border/40 rounded-xl p-3 text-center">
                  <span className="text-[10px] text-text-muted uppercase tracking-wider font-medium block">Signal</span>
                  <span className={`text-sm font-bold mt-1 block ${data.rsi > 50 ? 'text-emerald-400' : 'text-red-400'}`}>
                    {data.rsi > 50 ? 'Bullish' : 'Bearish'}
                  </span>
                  <span className="text-[9px] text-text-muted block mt-0.5">Bias</span>
                </div>
              </div>

              {/* Entry/Target/Stop block */}
              {data.metrics.entry && (
                <div className="flex items-center gap-3 mb-3 text-xs bg-accent/30 rounded-xl p-3.5 border border-border/40 shadow-sm">
                  <div className="w-6 h-6 rounded-lg bg-emerald-500/10 flex items-center justify-center shrink-0 text-emerald-400">
                                      <Target size={14} weight="regular" />
                  </div>
                  <div className="flex gap-3 flex-wrap items-center">
                    <div><span className="text-text-muted">Entry:</span> <span className="text-foreground font-mono font-medium">{data.metrics.entry.replace('INR ', '₹')}</span></div>
                    <div className="w-px h-3 bg-border/50" />
                    <div><span className="text-text-muted">Target:</span> <span className="text-success font-mono font-medium">{data.metrics.target?.replace('INR ', '₹') || '—'}</span></div>
                    <div className="w-px h-3 bg-border/50" />
                    <div><span className="text-text-muted">Stop:</span> <span className="text-destructive font-mono font-medium">{data.metrics.stop?.replace('INR ', '₹') || '—'}</span></div>
                    <div className="w-px h-3 bg-border/50" />
                    <div><span className="text-text-muted">Risk reward:</span> <span className="text-foreground font-mono font-medium">{data.metrics.riskReward}:1</span></div>
                  </div>
                </div>
              )}

              {/* Sources */}
              <div className="flex items-center gap-2 text-xs text-text-muted/60 border-t border-border/30 pt-3 select-none">
                <ShieldWarning size={14} className="text-text-muted/60 shrink-0" weight="regular" />
                <span>Yahoo Finance Gateway</span>
                <span className="text-text-muted/30">•</span>
                <span>Technical Indicators Calculator</span>
              </div>
            </motion.div>
          )}

          {/* Follow-ups (manifesting) */}
          {stage === 'followups' && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.3 }}
              className="p-4"
            >
              <span className="text-[11px] text-text-muted/60 font-medium">Suggested follow-ups</span>
              <div className="flex flex-wrap gap-1.5 mt-2">
                {data.followUps.slice(0, 3).map((q, i) => (
                  <button
                    key={i}
                    onClick={() => {
                      setChatHistory(prev => [...prev, { role: "user", content: q }]);
                      setSuggestedFollowUps([]);
                      startConversationalAnalysis(data.symbol);
                    }}
                    className="bg-accent/40 hover:bg-accent border border-border/40 hover:border-border text-foreground px-3 py-1.5 rounded-lg text-[12px] font-medium transition-all cursor-pointer"
                  >
                    {q}
                  </button>
                ))}
              </div>
            </motion.div>
          )}
        </div>
      </div>
    );
  };

  // Analyze Workflow State
  const [analyzeQuery, setAnalyzeQuery] = useState("")
  const [selectedAnalyzeStock, setSelectedAnalyzeStock] = useState<StockItem | null>(null)
  const [analyzeSuggestions, setAnalyzeSuggestions] = useState<StockItem[]>([])
  const [showAnalyzeSuggestions, setShowAnalyzeSuggestions] = useState(false)


  // Redesigned Workflow States
  const [marketOpenUICode, setMarketOpenUICode] = useState<string | null>(null)
  const [marketFollowUps, setMarketFollowUps] = useState<string[]>([])
  const [marketLoading, setMarketLoading] = useState(false)
  const [marketError, setMarketError] = useState<string | null>(null)

  const [portfolioOpenUICode, setPortfolioOpenUICode] = useState<string | null>(null)
  const [portfolioFollowUps, setPortfolioFollowUps] = useState<string[]>([])
  const [portfolioLoading, setPortfolioLoading] = useState(false)
  const [portfolioError, setPortfolioError] = useState<string | null>(null)

  const [analyzeOpenUICode, setAnalyzeOpenUICode] = useState<string | null>(null)
  const [analyzeFollowUps, setAnalyzeFollowUps] = useState<string[]>([])
  const [analyzeLoading, setAnalyzeLoading] = useState(false)
  const [analyzeError, setAnalyzeError] = useState<string | null>(null)

  const [compareOpenUICode, setCompareOpenUICode] = useState<string | null>(null)
  const [compareFollowUps, setCompareFollowUps] = useState<string[]>([])

  const chatEndRef = useRef<HTMLDivElement>(null)

  // Magnetic Snap Scroll: Magnetically snaps to the latest user message & loading bubble
  const snapToActiveUserMessage = () => {
    setTimeout(() => {
      const userMsgElements = document.querySelectorAll('.chat-user-message')
      if (userMsgElements.length > 0) {
        const lastUserMsg = userMsgElements[userMsgElements.length - 1]
        lastUserMsg.scrollIntoView({ behavior: 'smooth', block: 'start' })
      }
    }, 60)
  }

  // Trigger magnetic snap when a user message is sent or chat loading state begins
  useEffect(() => {
    if (chatLoading || buildingResponse?.active || chatHistory.length > 0) {
      snapToActiveUserMessage()
    }
  }, [chatLoading, buildingResponse?.active, chatHistory.length])

  const fetchMarketData = async () => {
    setMarketLoading(true)
    setMarketError(null)
    try {
      const response = await fetch("/api/chat/market", {
        method: "POST",
        headers: { "Content-Type": "application/json" }
      })
      if (!response.ok) throw new Error("Failed to fetch market overview")
      const res = await response.json()
      setMarketOpenUICode(res.data.openui || res.data.code)
      setMarketFollowUps(res.suggestedFollowUps || [])
    } catch (err: any) {
      setMarketError(err.message || "Something went wrong")
    } finally {
      setMarketLoading(false)
    }
  }

  const fetchPortfolioData = async () => {
    setPortfolioLoading(true)
    setPortfolioError(null)
    try {
      const response = await fetch("/api/chat/portfolio", {
        method: "POST",
        headers: { "Content-Type": "application/json" }
      })
      if (!response.ok) throw new Error("Failed to fetch portfolio data")
      const res = await response.json()
      setPortfolioOpenUICode(res.data.openui || res.data.code)
      setPortfolioFollowUps(res.suggestedFollowUps || [])
    } catch (err: any) {
      setPortfolioError(err.message || "Something went wrong")
    } finally {
      setPortfolioLoading(false)
    }
  }

  const handleRunAnalyze = async (symbol: string) => {
    setAnalyzeLoading(true)
    setAnalyzeError(null)
    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: `Analyze stock ${symbol}`,
          history: [],
          symbol: symbol
        })
      })
      if (!response.ok) throw new Error("Failed to fetch stock analysis")
      const res = await response.json()
      if (res.responseType === "OpenUI") {
        setAnalyzeOpenUICode(res.data.openui || res.data.code)
      } else {
        setAnalyzeOpenUICode(`root = TextResponse("${res.data?.text || ''}")`)
      }
      setAnalyzeFollowUps(res.suggestedFollowUps || [])
    } catch (err: any) {
      setAnalyzeError(err.message || "Something went wrong")
    } finally {
      setAnalyzeLoading(false)
    }
  }

  const handleRunCompare = async (sym1: string, sym2: string) => {
    setCompareLoading(true)
    setCompareError(null)
    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: `Compare ${sym1} and ${sym2}`,
          history: [],
          symbol: sym1
        })
      })
      if (!response.ok) throw new Error("Failed to fetch stock comparison")
      const res = await response.json()
      if (res.responseType === "OpenUI") {
        setCompareOpenUICode(res.data.openui || res.data.code)
      } else {
        setCompareOpenUICode(`root = TextResponse("${res.data?.text || ''}")`)
      }
      setCompareFollowUps(res.suggestedFollowUps || [])
    } catch (err: any) {
      setCompareError(err.message || "Something went wrong")
    } finally {
      setCompareLoading(false)
    }
  }

  // Trigger data fetches based on view state
  useEffect(() => {
    if (currentView === "explore_market" && !marketOpenUICode && !marketLoading) {
      fetchMarketData()
    } else if (currentView === "explore_portfolio" && !portfolioOpenUICode && !portfolioLoading) {
      fetchPortfolioData()
    }
  }, [currentView])

  const handleFollowUpClick = (followUpText: string) => {
    const userMsg: ChatMessage = { role: "user", content: followUpText }
    const updatedHistory = [...chatHistory, userMsg]
    setChatHistory(updatedHistory)
    setSuggestedFollowUps([])
    pushView("chat")
    runChatQuery(followUpText, selectedSymbol, updatedHistory)
  }

  const runChatQuery = async (queryText: string, activeSymbol: string | null = null, currentHistory: ChatMessage[] = []) => {
    setChatLoading(true)
    setChatError(null)
    try {
      const backendHistory = currentHistory.map(m => ({
        role: m.role,
        content: m.content || (m.responseType === "TextResponse" ? m.data?.text : JSON.stringify(m.data)) || ""
      }))

      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: queryText,
          history: backendHistory,
          symbol: activeSymbol || selectedSymbol || null
        })
      })
      if (!response.ok) {
        throw new Error(`Chat request failed with status: ${response.status}`)
      }
      const data = await response.json()
      
      // Enforce 1.8s authentic thinking state during prototype so user perceives live AI reasoning
      setTimeout(() => {
        setChatLoading(false)
        setChatHistory(prev => [
          ...prev,
          {
            role: "assistant",
            responseType: data.responseType || "TextResponse",
            data: data.data,
            content: data.responseType === "TextResponse" ? data.data?.text : undefined,
            sources: data.sources
          }
        ])
        if (data.suggestedFollowUps && data.suggestedFollowUps.length === 3) {
          setSuggestedFollowUps(data.suggestedFollowUps)
        } else {
          setSuggestedFollowUps([])
        }
      }, 1800);
    } catch {
      // Client-side fallback: generate helpful answers when backend is unreachable
      const q = queryText.toLowerCase()

      // 1. Volume Query -> VolumeChart (3 months)
      if (q.includes("volume")) {
        const symbolMatch = (stockIndex as StockItem[]).find(s => 
          q.toUpperCase().includes(s.Symbol) || q.toLowerCase().includes(s["Company Name"].toLowerCase())
        );
        const targetSymbol = symbolMatch?.Symbol || activeSymbol || selectedSymbol || "RELIANCE";

        setTimeout(() => {
          setChatLoading(false)
          setChatHistory(prev => [
            ...prev,
            {
              role: "assistant",
              responseType: "OpenUI",
              data: {
                openui: `root = VolumeChart("${targetSymbol}", [], 90)`
              },
              sources: ["Offline Strategy Playbook", "Technical Calculator"]
            }
          ])
          setSuggestedFollowUps([
            `How is the RSI looking for ${targetSymbol}?`,
            `Show the swing trade setup for ${targetSymbol}`,
            `Where are key support levels for ${targetSymbol}?`
          ])
        }, 1800)
        return;
      }

      // 2. RSI / Momentum Query -> RSIChart
      if (q.includes("rsi") || q.includes("momentum")) {
        const symbolMatch = (stockIndex as StockItem[]).find(s => 
          q.toUpperCase().includes(s.Symbol) || q.toLowerCase().includes(s["Company Name"].toLowerCase())
        );
        const targetSymbol = symbolMatch?.Symbol || activeSymbol || selectedSymbol || "RELIANCE";

        setTimeout(() => {
          setChatLoading(false)
          setChatHistory(prev => [
            ...prev,
            {
              role: "assistant",
              responseType: "OpenUI",
              data: {
                openui: `root = RSIChart("${targetSymbol}", [], 90)`
              },
              sources: ["Offline Strategy Playbook", "Technical Calculator"]
            }
          ])
          setSuggestedFollowUps([
            `Show volume activity for ${targetSymbol}`,
            `Show the swing trade setup for ${targetSymbol}`,
            `Compare ${targetSymbol} with sector peers`
          ])
        }, 1800)
        return;
      }

      // 2. Trade Setup / Entry / Exit Query -> TradeSetup
      if (q.includes("setup") || q.includes("swing trade") || q.includes("entry") || q.includes("stop loss") || q.includes("target")) {
        const symbolMatch = (stockIndex as StockItem[]).find(s => 
          q.toUpperCase().includes(s.Symbol) || q.toLowerCase().includes(s["Company Name"].toLowerCase())
        );
        const targetSymbol = symbolMatch?.Symbol || activeSymbol || selectedSymbol || "RELIANCE";
        const dummy = getDummyAnalysis(targetSymbol);
        const price = dummy.currentPrice;

        setTimeout(() => {
          setChatLoading(false)
          setChatHistory(prev => [
            ...prev,
            {
              role: "assistant",
              responseType: "TradeSetup",
              data: {
                symbol: targetSymbol,
                entry: `₹${(price * 0.98).toFixed(2)} – ₹${(price * 1.01).toFixed(2)}`,
                target: `₹${(price * 1.15).toFixed(2)}`,
                stop: `₹${(price * 0.94).toFixed(2)}`,
                risk_reward: "2.5",
                invalidation_reason: `Daily close below ₹${(price * 0.94).toFixed(2)} support level`
              },
              content: undefined,
              sources: ["Offline Strategy Playbook", "Technical Calculator"]
            }
          ])
          setSuggestedFollowUps([
            `What is the opportunity score for ${targetSymbol}?`,
            `What does the RSI momentum indicate for ${targetSymbol}?`,
            `Compare ${targetSymbol} with sector peers`
          ])
        }, 1800)
        return;
      }

      // 3. Opportunity Score / Breakdown Query -> ScoreBreakdown
      if (q.includes("score") || q.includes("breakdown") || q.includes("conviction")) {
        const symbolMatch = (stockIndex as StockItem[]).find(s => 
          q.toUpperCase().includes(s.Symbol) || q.toLowerCase().includes(s["Company Name"].toLowerCase())
        );
        const targetSymbol = symbolMatch?.Symbol || activeSymbol || selectedSymbol || "RELIANCE";
        const dummy = getDummyAnalysis(targetSymbol);

        setTimeout(() => {
          setChatLoading(false)
          setChatHistory(prev => [
            ...prev,
            {
              role: "assistant",
              responseType: "ScoreBreakdown",
              data: {
                symbol: targetSymbol,
                total_score: dummy.score,
                breakdown: [
                  { label: "Trend Structure", score: Math.round(dummy.score * 0.35), max: 35 },
                  { label: "Volume Profile", score: Math.round(dummy.score * 0.30), max: 30 },
                  { label: "RSI Momentum", score: Math.round(dummy.score * 0.20), max: 20 },
                  { label: "Risk-Reward Ratio", score: Math.round(dummy.score * 0.15), max: 15 }
                ]
              },
              content: undefined,
              sources: ["Offline Strategy Playbook", "Technical Calculator"]
            }
          ])
          setSuggestedFollowUps([
            `Show the swing trade setup for ${targetSymbol}`,
            `What does the RSI momentum indicate for ${targetSymbol}?`,
            `Compare ${targetSymbol} with sector peers`
          ])
        }, 1800)
        return;
      }

      // 4. Compare Stocks Query -> StockComparison
      if (q.includes("compare") || q.includes(" vs ")) {
        const matches = (stockIndex as StockItem[]).filter(s => 
          q.toUpperCase().includes(s.Symbol) || q.toLowerCase().includes(s["Company Name"].toLowerCase())
        );
        const s1 = matches[0]?.Symbol || "RELIANCE";
        const s2 = matches[1]?.Symbol || "TATAMOTORS";
        const d1 = getDummyAnalysis(s1);
        const d2 = getDummyAnalysis(s2);

        setTimeout(() => {
          setChatLoading(false)
          setChatHistory(prev => [
            ...prev,
            {
              role: "assistant",
              responseType: "StockComparison",
              data: {
                stocks: [
                  { symbol: s1, price: d1.currentPrice.toFixed(2), change: d1.changePercent.toFixed(2), score: d1.score, rsi: d1.rsi.toFixed(1), trend: d1.metrics.trend },
                  { symbol: s2, price: d2.currentPrice.toFixed(2), change: d2.changePercent.toFixed(2), score: d2.score, rsi: d2.rsi.toFixed(1), trend: d2.metrics.trend }
                ]
              },
              content: undefined,
              sources: ["Offline Strategy Playbook", "Technical Calculator"]
            }
          ])
          setSuggestedFollowUps([
            `Show the swing trade setup for ${s1}`,
            `Show the swing trade setup for ${s2}`,
            `What are the top opportunities today?`
          ])
        }, 1800)
        return;
      }

      // 5. Top Opportunities Query -> OpportunityList
      if (q.includes("opportunity") || q.includes("top setups") || q.includes("best trades") || q.includes("watchlist")) {
        setTimeout(() => {
          setChatLoading(false)
          setChatHistory(prev => [
            ...prev,
            {
              role: "assistant",
              responseType: "OpportunityList",
              data: {
                opportunities: [
                  { symbol: "RELIANCE", name: "Reliance Industries", sector: "Energy", price: 2942.50, score: 88 },
                  { symbol: "TATAMOTORS", name: "Tata Motors", sector: "Automobile", price: 496.20, score: 84 },
                  { symbol: "HDFCBANK", name: "HDFC Bank", sector: "Banking", price: 1540.00, score: 79 },
                  { symbol: "ICICIBANK", name: "ICICI Bank", sector: "Banking", price: 1120.40, score: 76 }
                ]
              },
              content: undefined,
              sources: ["Offline Strategy Playbook", "Technical Calculator"]
            }
          ])
          setSuggestedFollowUps([
            "Show the swing trade setup for RELIANCE",
            "Compare RELIANCE vs TATAMOTORS",
            "Explain the swing strategy rules"
          ])
        }, 1800)
        return;
      }

      const knowledgeMap: Record<string, string> = {
        "macd": "### MACD (Trend Momentum)\nMACD convergence/divergence indicates dynamic momentum shifts.\n\n> **Core Signals:**\n> • Bullish Cross (MACD above Signal) → Buy setup\n> • Bearish Cross (MACD below Signal) → Sell warning\n\n> **Components:** MACD Line (12–26 EMA diff) and Signal Line (9 EMA).",
        "moving average": "### Moving Averages (EMA & SMA)\nMoving averages smooth price action to identify primary trends.\n\n> **Key Reference Lines:**\n> • EMA 20: Short-term support / pullback entry line\n> • EMA 50: Medium-term trend validation\n> • EMA 200: Long-term bullish/bearish boundary\n\n> **Golden Cross:** EMA 50 crossing above EMA 200 indicates major structural strength.",
        "ema": "### Exponential Moving Average (EMA)\nEMAs track recent price weight to stay responsive to trends.\n\n> • EMA 20: Short-term support\n> • EMA 50: Medium-term trend confirmation\n> • EMA 200: Long-term directional bias\n\n> Price trading above all three EMAs confirms a strong bullish posture.",
        "sma": "### Simple Moving Average (SMA)\nSMAs calculate equal-weighted average prices to smooth out noise.\n\n> • SMA 50 and SMA 200 identify key institutional support/resistance.\n> • SMA is slower to react than EMA, ideal for long-term trend boundary confirmation.",
        "risk management": "### Portfolio Risk Management\nPreserving capital is more important than chasing potential gains.\n\n> **Playbook Standards:**\n> • **1% Cap:** Risk maximum 1% of total capital on any single setup.\n> • **10% Size:** Maximum position sizing is capped at 10% of portfolio value.\n> • **Sizing Formula:** Capital Risk / (Entry - Stop Loss).",
        "position siz": "### Position Sizing Formula\nShares = (Total Capital × Risk%) ÷ (Entry − Stop Loss)\n\n> **Standard Example:**\n> • Portfolio: ₹10,00,000 | Risk: 1% (₹10,000 max loss)\n> • Entry: ₹150 | Stop Loss: ₹140 (Risk: ₹10/share)\n> • Position Size: ₹10,000 ÷ ₹10 = 1,000 shares.",
        "breakout": "### Breakout Technical Checklist\nBreakouts qualify when price clears key resistance with strong volume.\n\n> **Requirements:**\n> 1. Price closes above resistance (not just intraday spike)\n> 2. Volume exceeds 2x the 20-day average\n> 3. RSI remains below 75 (avoids extreme overbought)\n> 4. Invalidation is set below the breakout level.",
        "market hour": "### NSE Trading Hours\n\n> • Pre-Open: 9:00 AM – 9:15 AM IST\n> • Normal Session: 9:15 AM – 3:30 PM IST\n> • Closing Session: 3:30 PM – 3:40 PM IST\n\n> Orders placed outside normal session hours are queued as After-Market Orders (AMO).",
        "when does market": "### NSE Market Timings\n\n> • Pre-Open: 9:00 AM – 9:15 AM IST\n> • Normal Session: 9:15 AM – 3:30 PM IST\n\n> Closed on Saturdays, Sundays, and national holidays.",
        "golden cross": "### Golden Cross Signal\nWhen the 50-day EMA crosses above the 200-day EMA.\n\n> Indicates a major long-term bullish transition. Always check volume confirmation on the crossover day.",
        "playbook": "### Strategy Playbooks\nStrategy playbooks are PDF or URL trading systems indexed in your AI's knowledge base.\n\n> The assistant references playbook instructions to filter, score, and invalidate setups.\n> Customize your strategy rules under the **Playbook** sidebar tab.",
        "stalk market": "### Scout Research Assistant\nScout is your strategy playbook research companion.\n\n> **Key Utilities:**\n> • Technical indicator analysis and scoring checks\n> • Quick lookups for trading rules and playbook concepts\n> • Setup validations (entry, target, and stop calculation)\n\n> Try asking: *\"What is RSI?\"*, *\"Analyze HFCL\"*, or *\"Show setups\"*"
      }

      const greetings = ["hi", "hello", "hey", "good morning", "good afternoon", "good evening"]
      const isGreeting = greetings.some(g => q.trim().startsWith(g)) || greetings.includes(q.trim())
      
      let fallbackText: string
      if (isGreeting) {
        const symbolNote = activeSymbol ? ` I see you're researching **${activeSymbol}** — ask me anything about it!` : ""
        fallbackText = `### Hello!\n\nWelcome to Stalk Market's Research Assistant.${symbolNote}\n\nI can help you with:\n- **Stock Analysis**: Technical indicators, score breakdowns, and trade setups\n- **Trading Concepts**: RSI, MACD, moving averages, breakout strategies\n- **Risk Management**: Position sizing, stop loss strategies\n- **Market Info**: Trading hours, session timings\n\nJust type your question!`
      } else if (["what can you do", "help", "capabilities", "what are you"].some(kw => q.includes(kw))) {
        fallbackText = knowledgeMap["stalk market"]
      } else {
        const matchedKey = Object.keys(knowledgeMap).find(key => q.includes(key))
        if (matchedKey) {
          fallbackText = knowledgeMap[matchedKey]
        } else {
          const symbolNote = activeSymbol ? ` regarding **${activeSymbol}**` : ""
          fallbackText = `### Trading Insights${symbolNote}\n\nThanks for your question! Here are key principles from the strategy playbook:\n\n**Core Swing Trading Rules:**\n- **Trend Confirmation**: Trade in the direction of the trend (price above EMA 20 & 50)\n- **Volume Validation**: Enter breakouts when volume exceeds 1.5x the 20-day average\n- **RSI Check**: Ensure RSI is not in extreme overbought (> 75) territory\n- **Risk Management**: Risk no more than 1–2% of total capital per trade\n- **Position Sizing**: No single position should exceed 10% of portfolio\n\n**Tip**: Try asking about specific concepts like *"What is RSI?"*, *"How does MACD work?"*, or type a stock name to analyze it.`
        }
      }

      setTimeout(() => {
        setChatLoading(false)
        setChatHistory(prev => [
          ...prev,
          {
            role: "assistant",
            responseType: "TextResponse",
            data: { text: fallbackText },
            content: fallbackText,
            sources: ["Offline Strategy Playbook", "Technical Calculator"]
          }
        ])
        setSuggestedFollowUps([
          `What is the price trend for RELIANCE?`,
          `Where are key support levels for RELIANCE?`,
          `Show volume activity for RELIANCE`
        ])
      }, 1800)
    }
  }

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!searchQuery.trim()) return
    const query = searchQuery.trim()
    
    // Check if it looks like a stock symbol
    const stockMatch = (stockIndex as StockItem[]).find(s => 
      s.Symbol.toLowerCase() === query.toLowerCase() || 
      s["Company Name"].toLowerCase().includes(query.toLowerCase())
    )
    
    if (stockMatch) {
      setSearchQuery("")
      pushView("chat")
      startConversationalAnalysis(stockMatch.Symbol, stockMatch["Company Name"])
    } else {
      // Free-form text search - go to chat with normal query
      const initialHistory: ChatMessage[] = [{ role: "user", content: query }]
      setChatHistory(initialHistory)
      setSearchQuery("")
      pushView("chat")
      runChatQuery(query, null, initialHistory)
    }
  }

  const handleChatSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!chatInput.trim() || chatLoading || (buildingResponse?.active ?? false)) return
    const text = chatInput.trim()
    setChatInput("")
    
    // Check if it's a stock query in the chat view
    const stockMatch = (stockIndex as StockItem[]).find(s => 
      s.Symbol.toLowerCase() === text.toLowerCase() || 
      s["Company Name"].toLowerCase().includes(text.toLowerCase())
    )
    
    if (stockMatch && (text.toLowerCase().includes("analyze") || text.length <= 5 || text === stockMatch.Symbol)) {
      startConversationalAnalysis(stockMatch.Symbol, stockMatch["Company Name"])
      return
    }
    
    const updatedHistory: ChatMessage[] = [
      ...chatHistory,
      { role: "user", content: text }
    ]
    setChatHistory(updatedHistory)
    
    if (pendingFlow) {
      let queryText = text
      if (pendingFlow === "analyze") {
        queryText = `Analyze stock ${text}`
      } else if (pendingFlow === "compare") {
        queryText = `Compare ${text}`
      } else if (pendingFlow === "check") {
        queryText = `Review trade for ${text}`
      } else if (pendingFlow === "why") {
        queryText = `Why is ${text} moving`
      }
      setPendingFlow(null)
      runChatQuery(queryText, selectedSymbol, updatedHistory)
    } else {
      runChatQuery(text, selectedSymbol, updatedHistory)
    }
  }

  const handleAnalyzeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value
    setAnalyzeQuery(val)
    setSelectedAnalyzeStock(null)
    if (val.trim()) {
      const filtered = (stockIndex as StockItem[]).filter(s => 
        s.Symbol.toLowerCase().includes(val.toLowerCase()) || 
        s["Company Name"].toLowerCase().includes(val.toLowerCase())
      ).slice(0, 5)
      setAnalyzeSuggestions(filtered)
      setShowAnalyzeSuggestions(true)
    } else {
      setAnalyzeSuggestions([])
      setShowAnalyzeSuggestions(false)
    }
  }

  const selectAnalyzeStock = (stock: StockItem) => {
    setSelectedAnalyzeStock(stock)
    setAnalyzeQuery(stock.Symbol)
    setShowAnalyzeSuggestions(false)
  }



  const dropdownRef1 = useRef<HTMLDivElement>(null)
  const dropdownRef2 = useRef<HTMLDivElement>(null)
  const dropdownRefAnalyze = useRef<HTMLDivElement>(null)

  // Navigation helpers
  const pushView = (view: ViewState) => {
    setHistory(prev => [...prev, view])
  }

  const popView = () => {
    setHistory(prev => {
      if (prev.length <= 1) return ["home"]
      return prev.slice(0, -1)
    })
  }

  // Handle outside clicks to close autocomplete suggestions
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (dropdownRef1.current && !dropdownRef1.current.contains(e.target as Node)) {
        setShowSuggestions1(false)
      }
      if (dropdownRef2.current && !dropdownRef2.current.contains(e.target as Node)) {
        setShowSuggestions2(false)
      }
      if (dropdownRefAnalyze.current && !dropdownRefAnalyze.current.contains(e.target as Node)) {
        setShowAnalyzeSuggestions(false)
      }
    }
    document.addEventListener("mousedown", handleOutsideClick)
    return () => document.removeEventListener("mousedown", handleOutsideClick)
  }, [])


  // ====================================================
  // Workflow 2: Compare Two Stocks Logic
  // ====================================================
  const handleStock1Change = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value
    setStock1Query(val)
    setSelectedStock1(null)
    setCompareResult(null)
    if (val.trim()) {
      const filtered = (stockIndex as StockItem[]).filter(s => 
        s.Symbol.toLowerCase().includes(val.toLowerCase()) || 
        s["Company Name"].toLowerCase().includes(val.toLowerCase())
      ).slice(0, 5)
      setSuggestions1(filtered)
      setShowSuggestions1(true)
    } else {
      setSuggestions1([])
      setShowSuggestions1(false)
    }
  }

  const handleStock2Change = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value
    setStock2Query(val)
    setSelectedStock2(null)
    setCompareResult(null)
    if (val.trim()) {
      const filtered = (stockIndex as StockItem[]).filter(s => 
        s.Symbol.toLowerCase().includes(val.toLowerCase()) || 
        s["Company Name"].toLowerCase().includes(val.toLowerCase())
      ).slice(0, 5)
      setSuggestions2(filtered)
      setShowSuggestions2(true)
    } else {
      setSuggestions2([])
      setShowSuggestions2(false)
    }
  }

  const selectStock1 = (stock: StockItem) => {
    setSelectedStock1(stock)
    setStock1Query(stock.Symbol)
    setShowSuggestions1(false)
  }

  const selectStock2 = (stock: StockItem) => {
    setSelectedStock2(stock)
    setStock2Query(stock.Symbol)
    setShowSuggestions2(false)
  }

  const runComparison = async () => {
    if (!selectedStock1 || !selectedStock2) return
    setCompareLoading(true)
    setCompareError(null)
    setCompareResult(null)
    try {
      const response = await fetch(`/api/market/compare?sym1=${selectedStock1.Symbol}&sym2=${selectedStock2.Symbol}`, {
        headers: { "Accept": "application/json" }
      })
      if (!response.ok) {
        throw new Error(`Server returned status ${response.status}`)
      }
      const data = await response.json()
      setCompareResult(data)
    } catch (err: any) {
      setCompareError(err.message || "Failed to compare the selected assets. Ensure the trading engine is active.")
    } finally {
      setCompareLoading(false)
    }
  }

  const getStronger = (metric: string, val1: any, val2: any) => {
    if (val1 === val2 || val1 === undefined || val2 === undefined) return null
    if (metric === "score" || metric === "change" || metric === "rs" || metric === "rr") {
      return val1 > val2 ? 1 : 2
    }
    if (metric === "trend") {
      const ranks: Record<string, number> = { "Strong Uptrend": 3, "Uptrend": 2, "Neutral": 1, "Downtrend": 0 }
      const r1 = ranks[val1] || 0
      const r2 = ranks[val2] || 0
      if (r1 === r2) return null
      return r1 > r2 ? 1 : 2
    }
    return null
  }

  // Row renderer for comparison table to avoid visual duplication
  const renderCompareRow = (
    label: string,
    val1: string | number,
    val2: string | number,
    strongerSide: number | null,
    isPct: boolean = false
  ) => {
    let displayVal1 = val1
    let displayVal2 = val2
    
    let cellStyle1 = "p-2 font-normal text-foreground text-[15px]"
    let cellStyle2 = "p-2 font-normal text-foreground text-[15px]"
    
    if (strongerSide === 1) {
      cellStyle1 = "p-2 bg-success/5 text-success font-medium border-l border-success/30 text-[15px]"
    } else if (strongerSide === 2) {
      cellStyle2 = "p-2 bg-success/5 text-success font-medium border-l border-success/30 text-[15px]"
    }
    
    if (isPct) {
      if (typeof val1 === "number") {
        displayVal1 = `${val1 >= 0 ? "+" : ""}${val1.toFixed(2)}%`
        if (strongerSide !== 1) cellStyle1 += val1 >= 0 ? " text-success" : " text-destructive"
      }
      if (typeof val2 === "number") {
        displayVal2 = `${val2 >= 0 ? "+" : ""}${val2.toFixed(2)}%`
        if (strongerSide !== 2) cellStyle2 += val2 >= 0 ? " text-success" : " text-destructive"
      }
    }

    return (
      <tr className="hover:bg-accent/10 transition-colors">
        <td className="p-2 text-text-muted font-normal text-[14px] font-sans">{label}</td>
        <td className={cellStyle1}>{displayVal1}</td>
        <td className={cellStyle2}>{displayVal2}</td>
      </tr>
    )
  }

  // ====================================================
  // Render views dynamically
  // ====================================================

  // Header Back Button & Control
  const renderPanelHeader = () => {
    if (!isExpanded && history.length <= 1) return null;
    return (
      <div className={`flex items-center gap-2 border-b border-border shrink-0 bg-card select-none ${isExpanded ? 'px-4 py-3.5 min-h-12' : 'p-3'}`}>
        {(isExpanded || history.length > 1) && (
          <button 
            onClick={popView}
            className="flex items-center gap-1.5 cursor-pointer transition-colors text-text-muted hover:text-foreground bg-transparent border-none"
          >
            <ArrowLeft size={14} weight="regular" />
                        <span className="text-xs font-medium">Back</span>
          </button>
        )}
      </div>
    );
  };

  if (currentView === "home") {
    return (
      <div className="ra-ambient bg-card flex flex-col h-full text-foreground overflow-hidden relative select-none rounded-none border-none">
        {/* Center Content */}
        <div className="flex-1 flex flex-col p-5 justify-center items-center gap-7 overflow-y-auto scrollbar-none pb-24 relative z-10">
          {/* Header & Subtitle */}
          <div className="flex flex-col items-center text-center gap-2 max-w-[340px]">
            <div className="ai-organic-blob w-10 h-10 mb-1.5" />
            <h1 className="text-base font-medium text-foreground tracking-tight m-0">Research Assistant</h1>
            <p className="text-xs text-text-muted leading-relaxed font-normal m-0">
              Explore stocks, compare setups, or uncover volume catalysts.
            </p>
          </div>

          {/* 3 Action Rows */}
          <div className="flex flex-col gap-2 w-full max-w-[380px]">
            {/* 1. RSI Momentum */}
            <button
              onClick={() => {
                pushView("chat");
                setChatHistory([
                  {
                    role: "assistant",
                    content: "Pick a stock to analyze, then choose what to look at.",
                    responseType: "InteractivePrompt",
                    data: { flow: "analyze_combined" }
                  }
                ]);
              }}
              className="ra-action-row text-left p-3 border border-border/50 rounded-[8px] cursor-pointer transition-all flex items-center gap-3 group select-none bg-white/[0.02] hover:bg-white/[0.05] hover:border-border"
            >
              <div className="p-2 rounded-[6px] bg-white/[0.04] border border-border/30 text-text-muted group-hover:text-foreground transition-colors shrink-0">
                <Waveform size={16} weight="regular" />
              </div>
              <div className="flex flex-col gap-0.5 flex-1 min-w-0">
                <span className="text-[13px] font-medium text-foreground">RSI Momentum</span>
                <span className="text-[11px] text-text-muted/70 leading-tight font-normal">
                  Understand buying strength &amp; RSI
                </span>
              </div>
              <ArrowRight className="h-3.5 w-3.5 text-text-muted/40 group-hover:text-text-muted transition-colors shrink-0" />
            </button>

            {/* 2. Volume Spikes */}
            <button
              onClick={() => {
                pushView("chat");
                setChatHistory([
                  {
                    role: "user",
                    content: "Show me volume spikes today"
                  },
                  {
                    role: "assistant",
                    content: "Here is the 3-month volume activity analysis highlighting institutional buying spikes:",
                    responseType: "OpenUI",
                    data: {
                      openui: `root = VolumeChart("TATAMOTORS", [], 180)`
                    }
                  }
                ]);
              }}
              className="ra-action-row text-left p-3 border border-border/50 rounded-[8px] cursor-pointer transition-all flex items-center gap-3 group select-none bg-white/[0.02] hover:bg-white/[0.05] hover:border-border"
            >
              <div className="p-2 rounded-[6px] bg-white/[0.04] border border-border/30 text-text-muted group-hover:text-foreground transition-colors shrink-0">
                <BarChart3 size={16} weight="bold" />
              </div>
              <div className="flex flex-col gap-0.5 flex-1 min-w-0">
                <span className="text-[13px] font-medium text-foreground">Volume Spikes</span>
                <span className="text-[11px] text-text-muted/70 leading-tight font-normal">
                  Discover institutional buying spikes
                </span>
              </div>
              <ArrowRight className="h-3.5 w-3.5 text-text-muted/40 group-hover:text-text-muted transition-colors shrink-0" />
            </button>

            {/* 3. Compare Stocks */}
            <button
              onClick={() => {
                pushView("chat");
                setChatHistory([
                  {
                    role: "assistant",
                    content: "Pick two stocks to compare.",
                    responseType: "InteractivePrompt",
                    data: { flow: "compare_step1" }
                  }
                ]);
              }}
              className="ra-action-row text-left p-3 border border-border/50 rounded-[8px] cursor-pointer transition-all flex items-center gap-3 group select-none bg-white/[0.02] hover:bg-white/[0.05] hover:border-border"
            >
              <div className="p-2 rounded-[6px] bg-white/[0.04] border border-border/30 text-text-muted group-hover:text-foreground transition-colors shrink-0">
                <GitDiff size={16} weight="regular" />
              </div>
              <div className="flex flex-col gap-0.5 flex-1 min-w-0">
                <span className="text-[13px] font-medium text-foreground">Compare Stocks</span>
                <span className="text-[11px] text-text-muted/70 leading-tight font-normal">
                  Side-by-side indicator comparison
                </span>
              </div>
              <ArrowRight className="h-3.5 w-3.5 text-text-muted/40 group-hover:text-text-muted transition-colors shrink-0" />
            </button>
          </div>

          {/* Popular Securities */}
          <div className="w-full max-w-[380px] flex flex-col gap-2.5 select-none">
            <span className="text-[11px] font-medium text-white/90 text-center block">Popular securities</span>
            <div className="flex gap-2 w-full justify-center">
              {[
                { symbol: "RELIANCE", name: "Reliance", price: "₹1,487.20", change: "+0.82%", positive: true },
                { symbol: "TATAMOTORS", name: "Tata Motors", price: "₹496.81", change: "−0.69%", positive: false },
                { symbol: "HDFCBANK", name: "HDFC Bank", price: "₹1,996.40", change: "+0.34%", positive: true },
              ].map((stock) => (
                <button
                  key={stock.symbol}
                  onClick={() => {
                    pushView("chat");
                    startConversationalAnalysis(stock.symbol, stock.name);
                  }}
                  className="flex items-center gap-2 bg-white/10 hover:bg-white/15 border border-white/20 hover:border-white/35 backdrop-blur-md rounded-full py-1.5 px-3 transition-all cursor-pointer outline-none shadow-none"
                  title={stock.name}
                >
                  <span className="text-[11px] font-medium text-white whitespace-nowrap">{stock.name}</span>
                  <span className={`text-[10px] font-mono font-medium tabular-nums whitespace-nowrap ${stock.positive ? 'text-[#34D399]' : 'text-[#FF5555]'}`}>{stock.change}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Search Input Container with Send Button Outside */}
        <div className="absolute bottom-0 left-0 right-0 pt-3 px-3 pb-3 select-none z-10 border-t border-border bg-black/10 backdrop-blur-md">
          <form onSubmit={handleSearchSubmit} className="flex items-center gap-2 w-full">
            <div className="relative flex-1">
              <MagnifyingGlass size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white" weight="regular" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Ask about Reliance, RSI, or volume..."
                className="w-full bg-card/90 border border-border/80 rounded-xl pl-9 pr-4 py-3 text-xs font-normal focus:outline-none focus:border-border-hover focus:bg-card transition-all text-foreground placeholder-text-muted/50 shadow-md backdrop-blur-md"
              />
            </div>
            <button
              type="submit"
              disabled={!searchQuery.trim()}
              className="w-10 h-10 rounded-xl bg-white hover:bg-white/90 flex items-center justify-center shrink-0 shadow-md border-none disabled:opacity-30 cursor-pointer transition-all"
              aria-label="Send message"
            >
              <PaperPlaneRight size={16} className="text-[#10B981]" weight="regular" />
            </button>
          </form>
        </div>
      </div>
    );
  }

  // View 2: Explore the Market
  if (currentView === "explore_market") {
    return (
      <div className="bg-card flex flex-col h-full text-foreground overflow-hidden">
        {renderPanelHeader()}
        
        <div className="flex-1 overflow-y-auto flex flex-col p-4 bg-card gap-4 select-none scrollbar-thin">
          <div className="flex flex-col gap-0.5">
            <h2 className="text-[16px] font-medium text-foreground tracking-tight">Explore the Market</h2>
            <p className="text-[13px] text-text-muted">Real-time indices, sectors, and top trade opportunities.</p>
          </div>

          {marketLoading && (
            <ChatLoadingIndicator />
          )}

          {marketError && (
            <div className="p-4 bg-destructive/5 border border-destructive/20 rounded-xl flex flex-col gap-2 items-center text-center">
              <ShieldWarning size={20} className="text-destructive" weight="regular" />
              <span className="text-[13px] font-medium text-foreground">Market Fetch Failed</span>
              <span className="text-[12px] text-text-muted">{marketError}</span>
              <button onClick={fetchMarketData} className="mt-2 text-xs text-primary hover:underline font-medium bg-transparent border-none cursor-pointer">Retry</button>
            </div>
          )}

          {!marketLoading && !marketError && marketOpenUICode && (
            <div className="flex flex-col gap-4">
              <OpenUIRenderer 
                code={marketOpenUICode} 
                onSelectSymbol={(sym) => sym && handleSelectStockForAnalysis(sym)}
              />
              
              {marketFollowUps.length > 0 && (
                <div className="flex flex-col gap-1.5 mt-2 border-t border-border/20 pt-4">
                  <span className="text-[12px] text-text-muted font-medium">Suggested follow ups:</span>
                  <div className="flex flex-col gap-1.5 items-start">
                    {marketFollowUps.map((q, idx) => (
                      <button
                        key={idx}
                        onClick={() => handleFollowUpClick(q)}
                        className="text-left text-[13px] text-primary hover:text-primary-hover hover:underline bg-transparent border-none p-0 cursor-pointer font-medium"
                      >
                        {q}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    )
  }

  // View 3: Explore My Portfolio
  if (currentView === "explore_portfolio") {
    return (
      <div className="bg-card flex flex-col h-full text-foreground overflow-hidden">
        {renderPanelHeader()}
        
        <div className="flex-1 overflow-y-auto flex flex-col p-4 bg-card gap-4 select-none scrollbar-thin">
          <div className="flex flex-col gap-0.5">
            <h2 className="text-[16px] font-medium text-foreground tracking-tight">Explore My Portfolio</h2>
            <p className="text-[13px] text-text-muted">Linked broker allocation, risk bounds, and returns.</p>
          </div>

          {portfolioLoading && (
            <ChatLoadingIndicator />
          )}

          {portfolioError && (
            <div className="p-4 bg-destructive/5 border border-destructive/20 rounded-xl flex flex-col gap-2 items-center text-center">
              <ShieldWarning size={20} className="text-destructive" weight="regular" />
              <span className="text-[13px] font-medium text-foreground">Portfolio Sync Failed</span>
              <span className="text-[12px] text-text-muted">{portfolioError}</span>
              <button onClick={fetchPortfolioData} className="mt-2 text-xs text-primary hover:underline font-medium bg-transparent border-none cursor-pointer">Retry</button>
            </div>
          )}

          {!portfolioLoading && !portfolioError && portfolioOpenUICode && (
            <div className="flex flex-col gap-4">
              <OpenUIRenderer 
                code={portfolioOpenUICode} 
                onSelectSymbol={(sym) => sym && handleSelectStockForAnalysis(sym)}
              />
              
              {portfolioFollowUps.length > 0 && (
                <div className="flex flex-col gap-1.5 mt-2 border-t border-border/20 pt-4">
                  <span className="text-[12px] text-text-muted font-medium">Suggested follow ups:</span>
                  <div className="flex flex-col gap-1.5 items-start">
                    {portfolioFollowUps.map((q, idx) => (
                      <button
                        key={idx}
                        onClick={() => handleFollowUpClick(q)}
                        className="text-left text-[13px] text-primary hover:text-primary-hover hover:underline bg-transparent border-none p-0 cursor-pointer font-medium"
                      >
                        {q}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    )
  }

  // View 4: Comparison Workflow
  if (currentView === "compare") {
    const isCompareActive = selectedStock1 !== null && selectedStock2 !== null && !compareLoading

    return (
      <div className="bg-card flex flex-col h-full text-foreground overflow-hidden">
        {renderPanelHeader()}
        
        <div className="flex-1 overflow-y-auto flex flex-col p-3.5 bg-card">
          
          {/* Inputs Section */}
          <div className="flex flex-col gap-3 select-none">
            {/* Input 1 */}
            <div ref={dropdownRef1} className="relative">
              <label className="text-[14px] text-text-muted tracking-wider block mb-1">First Stock</label>
              <div className="relative">
                <MagnifyingGlass size={14} className="absolute left-3 top-2.5 text-white" weight="regular" />
                <input
                  type="text"
                  value={stock1Query}
                  onChange={handleStock1Change}
                  onFocus={() => stock1Query && setShowSuggestions1(true)}
                  placeholder="Type symbol or name..."
                  className="w-full bg-background border border-border rounded-xl pl-9 pr-8 py-2 text-[16px] font-normal focus:outline-none focus:border-foreground"
                />
                {selectedStock1 && (
                  <Check className="absolute right-3 top-3 h-3.5 w-3.5 text-success" />
                )}
              </div>
              
              {showSuggestions1 && suggestions1.length > 0 && (
                <div className="absolute z-50 left-0 right-0 mt-1 max-h-48 overflow-y-auto bg-card border border-border rounded-xl shadow-lg divide-y divide-border/40 scrollbar-thin">
                  {suggestions1.map(item => (
                    <button
                      key={item.Symbol}
                      type="button"
                      onClick={() => selectStock1(item)}
                      className="w-full text-left px-3 py-2 text-xs hover:bg-accent/40 transition-colors text-foreground flex justify-between items-center cursor-pointer font-normal border-none"
                    >
                      <span className="font-medium text-[16px]">{item.Symbol}</span>
                      <span className="text-[14px] text-text-muted truncate max-w-[150px]">{item["Company Name"]}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Input 2 */}
            <div ref={dropdownRef2} className="relative">
              <label className="text-[14px] text-text-muted tracking-wider block mb-1">Second Stock</label>
              <div className="relative">
                <MagnifyingGlass size={14} className="absolute left-3 top-2.5 text-white" weight="regular" />
                <input
                  type="text"
                  value={stock2Query}
                  onChange={handleStock2Change}
                  onFocus={() => stock2Query && setShowSuggestions2(true)}
                  placeholder="Type symbol or name..."
                  className="w-full bg-background border border-border rounded-xl pl-9 pr-8 py-2 text-[16px] font-normal focus:outline-none focus:border-foreground"
                />
                {selectedStock2 && (
                  <Check className="absolute right-3 top-3 h-3.5 w-3.5 text-success" />
                )}
              </div>

              {showSuggestions2 && suggestions2.length > 0 && (
                <div className="absolute z-50 left-0 right-0 mt-1 max-h-48 overflow-y-auto bg-card border border-border rounded-xl shadow-lg divide-y divide-border/40 scrollbar-thin">
                  {suggestions2.map(item => (
                    <button
                      key={item.Symbol}
                      type="button"
                      onClick={() => selectStock2(item)}
                      className="w-full text-left px-3 py-2 text-xs hover:bg-accent/40 transition-colors text-foreground flex justify-between items-center cursor-pointer font-normal border-none"
                    >
                      <span className="font-medium text-[16px]">{item.Symbol}</span>
                      <span className="text-[14px] text-text-muted truncate max-w-[150px]">{item["Company Name"]}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Examples helper */}
            <div className="text-[14px] text-text-muted px-1 flex gap-1 items-baseline">
              <span>Examples:</span>
              <button 
                type="button"
                onClick={() => {
                  const tata = (stockIndex as StockItem[]).find(s => s.Symbol === "TATAMOTORS")
                  if (tata) selectStock1(tata)
                }}
                className="text-primary hover:underline font-medium border-none bg-transparent p-0 cursor-pointer"
              >
                Tata Motors (TATAMOTORS)
              </button>
              <span>/</span>
              <button 
                type="button"
                onClick={() => {
                  const reliance = (stockIndex as StockItem[]).find(s => s.Symbol === "RELIANCE")
                  if (reliance) selectStock2(reliance)
                }}
                className="text-primary hover:underline font-medium border-none bg-transparent p-0 cursor-pointer"
              >
                Reliance (RELIANCE)
              </button>
            </div>

            {/* Compare Button */}
            <button
              onClick={runComparison}
              disabled={!isCompareActive}
              className="w-full btn btn-primary btn-md rounded-xl text-[16px] py-2.5 mt-1 font-medium flex items-center justify-center gap-1.5"
            >
              {compareLoading ? <ArrowsClockwise size={14} className="animate-spin" weight="regular" /> : null}
              <span>Compare Scrips</span>
            </button>
          </div>

          {/* Results State */}
          <div className="flex-1 mt-4">
            {compareLoading && (
              <div className="animate-pulse flex flex-col gap-3">
                <div className="h-40 bg-accent/15 border border-border/50 rounded-xl"></div>
                <div className="h-24 bg-accent/15 border border-border/50 rounded-xl"></div>
              </div>
            )}

            {compareError && (
              <div className="flex flex-col items-center justify-center text-center p-6 border border-border/60 rounded-xl bg-card gap-3">
                <ShieldWarning size={24} className="text-destructive" weight="regular" />
                <h4 className="text-sm font-medium text-foreground">Comparison Error</h4>
                <p className="text-[14px] text-text-muted leading-relaxed">{compareError}</p>
                <div className="flex gap-2 w-full max-w-[180px] mt-1 select-none">
                  <button 
                    onClick={() => setCompareError(null)}
                    className="flex-1 btn btn-secondary btn-sm h-7 rounded-lg text-2xs"
                  >
                    Clear
                  </button>
                  <button 
                    onClick={runComparison}
                    className="flex-1 btn btn-primary btn-sm h-7 rounded-lg text-2xs"
                  >
                    Retry
                  </button>
                </div>
              </div>
            )}

            {compareResult && (
              <div className="flex flex-col gap-4 select-none">
                {/* Horizontal scroll comparison table */}
                <div className="overflow-x-auto border border-border rounded-xl bg-card shadow-sm scrollbar-thin">
                  <table className="w-full text-left border-collapse text-[15px] leading-normal min-w-[280px]">
                    <thead>
                      <tr className="bg-accent/40 border-b border-border font-sans font-normal text-text-muted text-[14px]">
                        <th className="p-2 font-normal">Metric</th>
                        <th className="p-2 font-normal">{compareResult.sym1.symbol}</th>
                        <th className="p-2 font-normal">{compareResult.sym2.symbol}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/50 text-[15px]">
                      {renderCompareRow("Price", `₹${compareResult.sym1.price.toLocaleString("en-IN", { minimumFractionDigits: 2 })}`, `₹${compareResult.sym2.price.toLocaleString("en-IN", { minimumFractionDigits: 2 })}`, null)}
                      {renderCompareRow("Daily Change", compareResult.sym1.change, compareResult.sym2.change, getStronger("change", compareResult.sym1.change, compareResult.sym2.change), true)}
                      {renderCompareRow("Opportunity Score", compareResult.sym1.score, compareResult.sym2.score, getStronger("score", compareResult.sym1.score, compareResult.sym2.score))}
                      {renderCompareRow("Market Trend", compareResult.sym1.trend, compareResult.sym2.trend, getStronger("trend", compareResult.sym1.trend, compareResult.sym2.trend))}
                      {renderCompareRow("RSI (14)", `${compareResult.sym1.rsi_value} (${compareResult.sym1.rsi_status})`, `${compareResult.sym2.rsi_value} (${compareResult.sym2.rsi_status})`, null)}
                      {renderCompareRow("Volume Strength", `${compareResult.sym1.volume_value} (${compareResult.sym1.volume_status})`, `${compareResult.sym2.volume_value} (${compareResult.sym2.volume_status})`, null)}
                      {renderCompareRow("Relative Strength", `${compareResult.sym1.rs_value >= 0 ? "+" : ""}${compareResult.sym1.rs_value.toFixed(1)}% (${compareResult.sym1.rs_status})`, `${compareResult.sym2.rs_value >= 0 ? "+" : ""}${compareResult.sym2.rs_value.toFixed(1)}% (${compareResult.sym2.rs_status})`, getStronger("rs", compareResult.sym1.rs_value, compareResult.sym2.rs_value))}
                      {renderCompareRow("MA Structure", compareResult.sym1.ma_structure, compareResult.sym2.ma_structure, null)}
                      {renderCompareRow("Entry Range", compareResult.sym1.entry, compareResult.sym2.entry, null)}
                      {renderCompareRow("Target Price", compareResult.sym1.target, compareResult.sym2.target, null)}
                      {renderCompareRow("Stop Loss", compareResult.sym1.stop, compareResult.sym2.stop, null)}
                      {renderCompareRow("Risk Reward", `${compareResult.sym1.risk_reward}:1`, `${compareResult.sym2.risk_reward}:1`, getStronger("rr", compareResult.sym1.risk_reward, compareResult.sym2.risk_reward))}
                      {renderCompareRow("Setup Classification", compareResult.sym1.setup, compareResult.sym2.setup, null)}
                    </tbody>
                  </table>
                </div>

                {/* Deterministic Summary Summary */}
                <div className="bg-accent/15 border border-border/60 rounded-xl p-3.5 text-[15px] text-text-muted leading-relaxed">
                  {renderMarkdown(compareResult.summary)}
                </div>
              </div>
            )}
          </div>

        </div>
      </div>
    )
  }

  // View 4: AI Chat View
  if (currentView === "chat") {
    return (
      <div className={`ra-ambient bg-card flex flex-col h-full text-foreground overflow-hidden relative rounded-none border-none ${isExpanded ? 'expanded-chat' : ''}`}>
        {!isExpanded && renderPanelHeader()}
        
        {/* Scrollable chat messages container */}
        <div className={`flex-1 overflow-y-auto flex flex-col relative z-10 select-text [mask-image:linear-gradient(to_bottom,black_85%,transparent_100%)] ${isExpanded ? 'p-5 gap-5 pb-40' : 'p-3.5 gap-4 pb-36'}`}>
          {chatHistory.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center text-center text-text-muted my-auto gap-4 p-4 select-none">
              <div className="flex flex-col items-center gap-1">
                <Sparkle size={24} className="text-foreground/70 mb-1" weight="regular" />
                <span className="text-base font-medium text-foreground">How can I help with your trade research today?</span>
                <span className="text-xs text-text-muted">Ask anything about stocks, trends, indicators, or setups.</span>
              </div>

              <div className="flex flex-col gap-2 w-full max-w-md mt-2">
                <span className="text-[11px] text-text-muted font-medium uppercase tracking-wider text-left px-1">Top Questions Traders Ask:</span>
                {[
                  "What are the top opportunities today?",
                  "Is Tata Motors a good setup right now?",
                  "Explain RSI momentum in plain English"
                ].map((q, i) => (
                  <button
                    key={i}
                    onClick={() => handleFollowUpClick(q)}
                    className="text-left text-xs p-3 bg-card hover:bg-accent/50 border border-border rounded-[8px] text-foreground font-medium transition-colors cursor-pointer flex items-center justify-between group"
                  >
                    <span>{q}</span>
                    <ArrowRight size={14} className="text-text-muted group-hover:text-foreground transition-colors" weight="regular" />
                  </button>
                ))}
              </div>
            </div>
          ) : (
            chatHistory.map((msg, idx) => (
              <div key={idx} className={`chat-message-item ${msg.role === "user" ? "chat-user-message" : ""} flex flex-col gap-1 w-full ${msg.role === "user" ? "items-end" : "items-start"}`}>
                <div className="flex items-center gap-1.5 px-1 select-none">
                  {msg.role === "user" ? (
                    <span className="text-[12px] text-text-muted font-medium">You</span>
                  ) : (
                    <div className="flex items-center gap-1.5">
                      <div className="ai-blob-label" />
                      <span className="text-[11px] text-white font-medium tracking-wide">AI Assistant</span>
                    </div>
                  )}
                </div>
                
                <div className={`p-4 rounded-2xl ${
                  msg.role === "user" 
                    ? "bg-white text-gray-900 font-medium text-xs max-w-[80%] text-left shadow-md rounded-[22px] p-3.5 ml-auto select-text relative" 
                    : "bg-card/90 backdrop-blur-md border border-border text-foreground text-xs flex flex-col gap-3.5 shadow-sm w-full max-w-none"
                }`}>
                  {msg.role === "user" ? (
                    <>
                      <p className="whitespace-pre-wrap">{msg.content}</p>
                      <div className="absolute -right-[7px] bottom-3 w-0 h-0 border-l-[10px] border-l-white border-t-[7px] border-t-transparent border-b-[7px] border-b-transparent" />
                    </>
                  ) : (
                    <>
                      {/* Text/Markdown Response */}
                      {msg.responseType === "TextResponse" && msg.content && (
                        <div className="leading-relaxed text-base text-text-muted select-text">
                          {renderMarkdown(msg.content)}
                        </div>
                      )}

                      {/* Interactive Step Prompt Flow */}
                      {msg.responseType === "InteractivePrompt" && (
                        <div className="flex flex-col gap-3 w-full">
                          <div className="leading-relaxed text-base text-foreground font-normal">
                            {renderMarkdown(msg.content || "")}
                          </div>
                          
                          {/* Step 1: Stock Picker for Analysis */}
                          {msg.data?.flow === "analyze_step1" && (
                            <div className="flex flex-col gap-3 w-full mt-1">
                              <div className="relative w-full">
                                <MagnifyingGlass size={14} className="absolute left-3 top-3 text-white" weight="regular" />
                                <input
                                  type="text"
                                  placeholder="Search stock by name or symbol (e.g. Tata Motors, Reliance)..."
                                  className="w-full bg-input border border-border rounded-xl pl-9 pr-4 py-2.5 text-xs font-normal focus:outline-none focus:border-border-hover text-foreground placeholder-text-muted/40"
                                  onChange={(e) => {
                                    const val = e.target.value.toUpperCase();
                                    if (val.length >= 2) {
                                      const matches = (stockIndex as StockItem[]).filter(s => 
                                        s.Symbol.includes(val) || s["Company Name"].toUpperCase().includes(val)
                                      ).slice(0, 5);
                                      setSuggestions1(matches);
                                      setShowSuggestions1(true);
                                    } else {
                                      setShowSuggestions1(false);
                                    }
                                  }}
                                />
                                {showSuggestions1 && suggestions1.length > 0 && (
                                  <div className="absolute left-0 right-0 top-full mt-1 bg-card border border-border rounded-xl shadow-2xl z-50 overflow-hidden divide-y divide-border/40">
                                    {suggestions1.map((stk) => (
                                      <button
                                        key={stk.Symbol}
                                        onClick={() => {
                                          setShowSuggestions1(false);
                                          handleSelectStockForAnalysis(stk.Symbol, stk["Company Name"]);
                                        }}
                                        className="w-full text-left px-3.5 py-2.5 text-xs hover:bg-accent flex justify-between items-center cursor-pointer border-none"
                                      >
                                        <span className="font-medium text-foreground">{stk["Company Name"]}</span>
                                        <span className="text-[11px] font-mono text-text-muted">{stk.Symbol}</span>
                                      </button>
                                    ))}
                                  </div>
                                )}
                              </div>

                              {/* Popular Text Link Suggestions */}
                              <div className="flex items-center gap-2 pt-1 flex-wrap text-xs text-text-muted select-none">
                                <span className="text-[11px] font-medium text-text-muted/80">Popular securities:</span>
                                {[
                                  { symbol: "RELIANCE", name: "Reliance" },
                                  { symbol: "TATAMOTORS", name: "Tata Motors" },
                                  { symbol: "HDFCBANK", name: "HDFC Bank" },
                                  { symbol: "ICICIBANK", name: "ICICI Bank" },
                                  { symbol: "BHARTIARTL", name: "Bharti Airtel" },
                                ].map((stk) => (
                                  <button
                                    key={stk.symbol}
                                    onClick={() => handleSelectStockForAnalysis(stk.symbol, stk.name)}
                                    className="text-xs px-2.5 py-1 bg-chat-bg-secondary hover:bg-chat-bg-tertiary border border-border text-foreground/90 hover:text-white font-normal rounded-lg transition-colors cursor-pointer shadow-xs"
                                  >
                                    {stk.name}
                                  </button>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Step 2: Stock Aspect Picker (2-Column Grid with Lucide Vector Icons) */}
                          {msg.data?.flow === "analyze_step2" && (
                            <div className="grid grid-cols-2 gap-2.5 w-full mt-1.5">
                              {[
                                { 
                                  title: "Price trend", 
                                  desc: "See how the price has moved recently.", 
                                  Icon: TrendingUp, 
                                  query: `Show price trend for ${msg.data.symbol}` 
                                },
                                { 
                                  title: "Momentum", 
                                  desc: "Understand whether buying strength is increasing.", 
                                  Icon: Zap, 
                                  query: `What does the RSI momentum indicate for ${msg.data.symbol}?` 
                                },
                                { 
                                  title: "Volume activity", 
                                  desc: "See whether trading activity is unusual.", 
                                  Icon: BarChart3, 
                                  query: `How has ${msg.data.symbol} volume looked over the last 3 months?` 
                                },
                                { 
                                  title: "Key price levels", 
                                  desc: "Find important support and resistance areas.", 
                                  Icon: Target, 
                                  query: `Where are key support and resistance levels for ${msg.data.symbol}?` 
                                },
                                { 
                                  title: "Overall setup", 
                                  desc: "Get a simple overview of the current setup.", 
                                  Icon: Trophy, 
                                  query: `Show the swing trade setup for ${msg.data.symbol}` 
                                },
                                { 
                                  title: "Sector comparison", 
                                  desc: "How it stacks up against sector peers.", 
                                  Icon: Building, 
                                  query: `How does ${msg.data.symbol} compare to its sector peers?` 
                                }
                              ].map((opt) => {
                                const IconComponent = opt.Icon;
                                return (
                                  <button
                                    key={opt.title}
                                    onClick={() => handleFollowUpClick(opt.query)}
                                    className="text-left p-3.5 bg-chat-bg hover:bg-chat-bg-tertiary border border-border hover:border-border-hover rounded-lg cursor-pointer transition-all flex flex-col gap-1.5 group select-none shadow-md"
                                  >
                                    <div className="flex items-center gap-2">
                                      <IconComponent className="w-4 h-4 text-white/70 group-hover:text-white transition-colors shrink-0" />
                                      <span className="text-xs font-medium text-foreground whitespace-nowrap">{opt.title}</span>
                                    </div>
                                    <span className="text-[11px] text-text-muted font-normal leading-normal">{opt.desc}</span>
                                  </button>
                                );
                              })}
                            </div>
                          )}

                          {/* Combined Flow: Stock Picker + Aspect Options (one view) */}
                          {msg.data?.flow === "analyze_combined" && (
                            <div className="flex flex-col gap-3 w-full mt-1">
                              {/* Stock Search */}
                              <div className="relative w-full">
                                <MagnifyingGlass size={14} className="absolute left-3 top-3 text-white" weight="regular" />
                                <input
                                  type="text"
                                  placeholder="Search stock by name or symbol..."
                                  className="w-full bg-chat-bg-secondary border border-border rounded-lg pl-9 pr-4 py-2.5 text-xs font-normal focus:outline-none focus:border-border-hover text-foreground placeholder-text-muted/60"
                                  onChange={(e) => {
                                    const val = e.target.value.toUpperCase();
                                    if (val.length >= 2) {
                                      const matches = (stockIndex as StockItem[]).filter(s => 
                                        s.Symbol.includes(val) || s["Company Name"].toUpperCase().includes(val)
                                      ).slice(0, 5);
                                      setSuggestions1(matches);
                                      setShowSuggestions1(true);
                                    } else {
                                      setShowSuggestions1(false);
                                    }
                                  }}
                                />
                                {showSuggestions1 && suggestions1.length > 0 && (
                                  <div className="absolute left-0 right-0 top-full mt-1 bg-card border border-border rounded-lg shadow-2xl z-50 overflow-hidden divide-y divide-border">
                                    {suggestions1.map((stk) => (
                                      <button
                                        key={stk.Symbol}
                                        onClick={() => {
                                          setShowSuggestions1(false);
                                          handleSelectStockForAnalysis(stk.Symbol, stk["Company Name"]);
                                        }}
                                        className="w-full text-left px-3.5 py-2.5 text-xs hover:bg-chat-bg-tertiary flex justify-between items-center cursor-pointer border-none"
                                      >
                                        <span className="font-medium text-foreground">{stk["Company Name"]}</span>
                                        <span className="text-[11px] font-mono text-text-muted">{stk.Symbol}</span>
                                      </button>
                                    ))}
                                  </div>
                                )}
                              </div>

                              {/* Popular Stocks as Buttons */}
                              <div className="flex flex-col gap-2 w-full">
                                <span className="text-[11px] font-medium text-text-muted/80">Popular</span>
                                {[
                                  { symbol: "RELIANCE", name: "Reliance", sector: "Energy", price: "₹1,487.20", change: "+0.82%", positive: true },
                                  { symbol: "TATAMOTORS", name: "Tata Motors", sector: "Auto", price: "₹496.81", change: "−0.69%", positive: false },
                                  { symbol: "HDFCBANK", name: "HDFC Bank", sector: "Banking", price: "₹1,996.40", change: "+0.34%", positive: true },
                                ].map((stock) => (
                                  <button
                                    key={stock.symbol}
                                    onClick={() => handleSelectStockForAnalysis(stock.symbol, stock.name)}
                                    className="flex items-center justify-between p-3 bg-chat-bg border border-border hover:border-border-hover hover:bg-chat-bg-tertiary rounded-lg transition-all cursor-pointer outline-none group w-full shadow-sm"
                                  >
                                    <span className="text-sm font-medium text-foreground">{stock.name}</span>
                                    <div className="flex items-center gap-2.5">
                                      <span className="text-sm font-medium font-mono text-foreground/90 tabular-nums">{stock.price}</span>
                                      <span className={`text-xs font-mono font-medium tabular-nums ${stock.positive ? 'text-success' : 'text-destructive'}`}>{stock.change}</span>
                                      <ArrowRight size={14} className="text-text-muted/60 group-hover:text-text-muted transition-colors shrink-0" weight="regular" />
                                    </div>
                                  </button>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Step 1: Stock Comparison Selector */}
                          {msg.data?.flow === "compare_step1" && (
                            <div className="flex flex-col gap-2.5 w-full mt-1">
                              <div className="grid grid-cols-2 gap-2">
                                <input
                                  type="text"
                                  placeholder="Stock 1 (e.g. RELIANCE)"
                                  value={stock1Query}
                                  onChange={(e) => setStock1Query(e.target.value.toUpperCase())}
                                  className="bg-background border border-border rounded-xl px-3 py-2 text-xs font-normal focus:outline-none focus:border-foreground"
                                />
                                <input
                                  type="text"
                                  placeholder="Stock 2 (e.g. TATAMOTORS)"
                                  value={stock2Query}
                                  onChange={(e) => setStock2Query(e.target.value.toUpperCase())}
                                  className="bg-background border border-border rounded-xl px-3 py-2 text-xs font-normal focus:outline-none focus:border-foreground"
                                />
                              </div>
                              <button
                                onClick={() => handleConfirmCompareStocks(stock1Query || "RELIANCE", stock2Query || "TATAMOTORS")}
                                className="w-full bg-primary text-primary-foreground text-xs font-medium py-2 rounded-xl hover:opacity-90 transition-opacity cursor-pointer border-none"
                              >
                                Continue to Comparison Options →
                              </button>
                            </div>
                          )}

                          {/* Step 2: Compare Dimension Picker */}
                          {msg.data?.flow === "compare_step2" && (
                            <div className="flex flex-wrap gap-2 w-full mt-1">
                              {[
                                { label: "Momentum", query: `Compare momentum between ${msg.data.stock1} and ${msg.data.stock2}` },
                                { label: "Short term trading opportunity", query: `Compare trade setup between ${msg.data.stock1} and ${msg.data.stock2}` },
                                { label: "Risk", query: `Compare risk factors between ${msg.data.stock1} and ${msg.data.stock2}` },
                                { label: "Price performance", query: `Compare price performance between ${msg.data.stock1} and ${msg.data.stock2}` },
                                { label: "Volume strength", query: `Compare volume strength between ${msg.data.stock1} and ${msg.data.stock2}` },
                                { label: "Compare everything", query: `Compare ${msg.data.stock1} and ${msg.data.stock2}` }
                              ].map((opt) => (
                                <button
                                  key={opt.label}
                                  onClick={() => handleFollowUpClick(opt.query)}
                                  className="text-xs p-2.5 bg-accent/30 hover:bg-accent border border-border rounded-xl text-foreground font-medium cursor-pointer transition-colors"
                                >
                                  {opt.label}
                                </button>
                              ))}
                            </div>
                          )}

                          {/* Step 1: Why Moving Stock Picker */}
                          {msg.data?.flow === "why_moving_step1" && (
                            <div className="flex flex-wrap gap-1.5 mt-1">
                              {[
                                { symbol: "TATAMOTORS", name: "Tata Motors" },
                                { symbol: "RELIANCE", name: "Reliance Industries" },
                                { symbol: "HDFCBANK", name: "HDFC Bank" },
                                { symbol: "INFY", name: "Infosys" },
                                { symbol: "BHARTIARTL", name: "Bharti Airtel" }
                              ].map((stk) => (
                                <button
                                  key={stk.symbol}
                                  onClick={() => handleFollowUpClick(`Why is ${stk.name} moving today?`)}
                                  className="text-xs bg-accent/40 hover:bg-accent border border-border/50 px-3 py-1.5 rounded-full text-foreground font-medium cursor-pointer"
                                >
                                  {stk.name}
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                      )}

                      {/* OpenUI Generative UI Response */}
                      {msg.responseType === "OpenUI" && msg.data?.openui && (
                        <div className="w-full flex flex-col gap-3">
                          {(msg.content || msg.data?.text) && (
                            <div className="leading-relaxed text-[14.5px] text-foreground font-normal select-text border-b border-border/15 pb-2.5">
                              {renderMarkdown(msg.content || msg.data?.text || "")}
                            </div>
                          )}
                          <OpenUIRenderer
                            code={msg.data.openui}
                            fallbackText={msg.content || msg.data?.text || ""}
                            onSelectSymbol={(sym) => sym && handleSelectStockForAnalysis(sym)}
                          />
                        </div>
                      )}

                      {/* Opportunity List Component */}
                      {msg.responseType === "OpportunityList" && msg.data && (
                        <div className="flex flex-col gap-3 w-full">
                          <span className="text-[13px] text-text-muted block font-medium select-none">Discovered Opportunities</span>
                          {msg.data.opportunities.map((op: any) => (
                            <div 
                              key={op.symbol}
                              onClick={() => handleSelectStockForAnalysis(op.symbol, op.name)}
                              className="border border-border/20 hover:border-border bg-accent/40 hover:bg-accent/60 rounded-xl p-3 flex flex-col gap-2 transition-all cursor-pointer shadow-sm"
                            >
                              <div className="flex justify-between items-baseline select-none">
                                <span className="font-medium text-foreground text-[15px]">{op.symbol}</span>
                                <span className="text-[13px] text-text-muted font-normal">{op.sector}</span>
                              </div>
                              <div className="flex justify-between items-center mt-1 select-none">
                                <span className="text-[15px] font-medium text-foreground">₹{op.price?.toLocaleString("en-IN")}</span>
                                <span className="text-[13px] text-text-muted">Score: <strong className="text-success font-medium">{op.score}</strong></span>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Stock Comparison Component */}
                      {msg.responseType === "StockComparison" && msg.data && (
                        <div className="flex flex-col gap-3 w-full">
                          <span className="text-[13px] text-text-muted block font-medium select-none">Comparison Results</span>
                          <div className="border border-border/20 rounded-xl bg-accent/40 overflow-hidden shadow-sm">
                            <table className="w-full text-left border-collapse text-[15px]">
                              <thead>
                                <tr className="bg-accent/20 border-b border-border/20 font-sans font-normal text-text-muted text-[14px]">
                                  <th className="p-2 font-normal">Metric</th>
                                  {msg.data.stocks.map((s: any) => (
                                    <th key={s.symbol} className="p-2 font-normal">{s.symbol}</th>
                                  ))}
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-border/10">
                                <tr className="hover:bg-accent/10">
                                  <td className="p-2 text-[14px] text-text-muted font-sans font-normal">Price</td>
                                  {msg.data.stocks.map((s: any) => (
                                    <td key={s.symbol} className="p-2 text-[15px]">₹{s.price} ({s.change}%)</td>
                                  ))}
                                </tr>
                                <tr className="hover:bg-accent/10">
                                  <td className="p-2 text-[14px] text-text-muted font-sans font-normal">AI Score</td>
                                  {msg.data.stocks.map((s: any) => (
                                    <td key={s.symbol} className="p-2 text-[15px] font-medium">{s.score}</td>
                                  ))}
                                </tr>
                                <tr className="hover:bg-accent/10">
                                  <td className="p-2 text-[14px] text-text-muted font-sans font-normal">RSI (14)</td>
                                  {msg.data.stocks.map((s: any) => (
                                    <td key={s.symbol} className="p-2 text-[15px]">{s.rsi}</td>
                                  ))}
                                </tr>
                                <tr className="hover:bg-accent/10">
                                  <td className="p-2 text-[14px] text-text-muted font-sans font-normal">Trend</td>
                                  {msg.data.stocks.map((s: any) => (
                                    <td key={s.symbol} className="p-2 text-[15px]">{s.trend}</td>
                                  ))}
                                </tr>
                              </tbody>
                            </table>
                          </div>
                        </div>
                      )}

                      {/* Indicator Chart Component — exact graph rendering */}
                      {msg.responseType === "IndicatorChart" && msg.data && (
                        <div className="flex flex-col gap-2 w-full select-none">
                          <span className="text-[13px] text-text-muted block font-normal select-none">
                            Technical indicator chart for {msg.data.symbol} ({msg.data.indicator || "RSI"}).
                          </span>
                          <OpenUIRenderer
                            code={`root = Stack([
                              IndicatorChart("${msg.data.symbol}", "${msg.data.indicator || "RSI"}", ${msg.data.value || 42}, [], "${msg.data.status || "Neutral"}")
                            ])`}
                            onSelectSymbol={(sym) => sym && handleSelectStockForAnalysis(sym)}
                          />
                        </div>
                      )}

                      {/* Trade Setup Component */}
                      {msg.responseType === "TradeSetup" && msg.data && (
                        <div className="flex flex-col gap-3 w-full">
                          <span className="text-[13px] text-text-muted block font-medium select-none">Swing Trade Setup</span>
                          <div className="border border-border/20 rounded-xl p-3 bg-accent/40 flex flex-col gap-2.5 shadow-sm">
                            <span className="font-medium text-[16px] text-foreground select-none">{msg.data.symbol}</span>
                            <div className="grid grid-cols-2 gap-2 text-[14px] mt-1 bg-background/30 p-2.5 rounded-lg select-none">
                              <div><span className="text-text-muted">Entry Range:</span> <span className="font-medium block text-foreground">{msg.data.entry}</span></div>
                              <div><span className="text-text-muted">Target:</span> <span className="font-medium block text-success">{msg.data.target}</span></div>
                              <div><span className="text-text-muted">Stop Loss:</span> <span className="font-medium block text-destructive">{msg.data.stop}</span></div>
                              <div><span className="text-text-muted">R:R:</span> <span className="font-medium block text-foreground">{msg.data.risk_reward}:1</span></div>
                            </div>
                            <div className="text-[14px] text-text-muted mt-1 leading-relaxed select-text">
                              <strong>Invalidation:</strong> {msg.data.invalidation_reason}
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Score Breakdown Component */}
                      {msg.responseType === "ScoreBreakdown" && msg.data && (
                        <div className="flex flex-col gap-3 w-full">
                          <div className="flex justify-between items-baseline select-none">
                            <span className="text-[13px] text-text-muted font-medium">Opportunity Score Breakdown</span>
                            <span className="text-[15px] font-medium text-foreground">{msg.data.symbol}: {msg.data.total_score}</span>
                          </div>
                          <div className="flex flex-col gap-2 bg-accent/40 border border-border/20 rounded-xl p-3 shadow-sm select-none">
                            {msg.data.breakdown.map((b: any, i: number) => (
                              <div key={i} className="flex flex-col gap-0.5 py-1.5 border-b border-border/10 last:border-b-0 text-[14px]">
                                <div className="flex justify-between items-baseline">
                                  <span className="font-medium text-foreground">{b.category}</span>
                                  <span className="text-text-muted">{b.score} / {b.max}</span>
                                </div>
                                <span className="text-text-muted text-[13px] leading-relaxed mt-0.5">{b.comment}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Sources metadata */}
                      {msg.sources && msg.sources.length > 0 && (
                        <div className="text-[12px] text-text-muted border-t border-border/20 pt-2 flex flex-wrap gap-x-2 select-none">
                          <span>Sources:</span>
                          {msg.sources.map((src, sidx) => (
                            <span key={sidx} className="bg-accent/40 px-1.5 py-0.5 rounded text-[11px] font-normal">{src}</span>
                          ))}
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>
            ))
          )}

          {chatLoading && (
            <div className="flex items-start gap-2.5 w-full select-none py-2 animate-fade-in">
              <div className="ai-organic-blob w-7 h-7 shrink-0 mt-0.5" />
              <div className="bg-card border border-border rounded-2xl px-4 py-3 text-foreground text-xs flex items-center gap-1.5 shadow-sm">
                <span className="h-1.5 w-1.5 rounded-full bg-foreground/40 animate-bounce" style={{ animationDelay: '0ms' }} />
                <span className="h-1.5 w-1.5 rounded-full bg-foreground/60 animate-bounce" style={{ animationDelay: '150ms' }} />
                <span className="h-1.5 w-1.5 rounded-full bg-foreground/40 animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          )}

          {/* Progressive building response */}
          {renderBuildingResponse()}

          {chatError && (
            <div className="flex flex-col items-center justify-center text-center p-6 bg-card border border-border/20 rounded-xl gap-3">
              <ShieldWarning size={24} className="text-destructive" weight="regular" />
              <h4 className="text-sm font-medium text-foreground">Chat Query Failed</h4>
              <p className="text-[14px] text-text-muted leading-relaxed">{chatError}</p>
              <div className="flex gap-2 w-full max-w-[200px] mt-2">
                <button 
                  onClick={popView}
                  className="flex-1 btn btn-secondary btn-sm h-8 rounded-lg text-[12px]"
                >
                  Back
                </button>
                <button 
                  onClick={() => {
                    const lastUserMsg = [...chatHistory].reverse().find(m => m.role === "user")
                    if (lastUserMsg) {
                      setChatError(null)
                      runChatQuery(lastUserMsg.content || "", null, chatHistory.filter((_, idx) => idx < chatHistory.length - 1))
                    }
                  }}
                  className="flex-1 btn btn-primary btn-sm h-8 rounded-lg text-[12px] font-medium"
                >
                  Retry
                </button>
              </div>
            </div>
          )}

          {/* Suggested Followups */}
          {!chatLoading && !chatError && suggestedFollowUps && suggestedFollowUps.length > 0 && (
            <div className="flex flex-col gap-1.5 mt-2 px-1 select-none w-full">
              <span className="text-xs text-text-muted/70 font-medium select-none">Suggested follow-ups</span>
              <div className="flex flex-nowrap overflow-x-auto gap-2 pb-1 scrollbar-thin [mask-image:linear-gradient(to_right,black_88%,transparent_100%)]">
                {suggestedFollowUps.map((question, qIdx) => (
                  <button
                    key={qIdx}
                    onClick={() => {
                      setChatHistory(prev => [...prev, { role: "user", content: question }]);
                      setSuggestedFollowUps([]);
                      runChatQuery(question, selectedSymbol || null, [...chatHistory, { role: "user", content: question }]);
                    }}
                    className="bg-card hover:bg-accent border border-border hover:border-border-hover text-foreground/90 hover:text-foreground px-3 py-1.5 rounded-lg text-xs font-normal transition-all cursor-pointer select-none outline-none shrink-0 whitespace-nowrap"
                  >
                    {question}
                  </button>
                ))}
              </div>
            </div>
          )}
          
          <div ref={chatEndRef} />
        </div>

        {/* Sticky bottom search bar with Send Button Outside */}
        <div className={`absolute bottom-0 left-0 right-0 select-none z-10 border-t border-border bg-black/10 backdrop-blur-md ${isExpanded ? 'pt-3 px-3 pb-3' : 'pt-2.5 px-2.5 pb-2.5'}`}>
          <form onSubmit={handleChatSubmit} className={`flex items-center gap-2 w-full ${isExpanded ? 'max-w-3xl mx-auto' : ''}`}>
            <div className="relative flex-1">
              <MagnifyingGlass size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white shrink-0" weight="regular" style={{ color: "#FFFFFF", opacity: 1 }} />
              <input
                type="text"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                placeholder="Ask about a stock, compare companies, or explore a market trend..."
                className="w-full bg-card/90 border border-border/80 rounded-xl pl-9 pr-4 py-3 text-xs font-normal focus:outline-none focus:border-border-hover focus:bg-card transition-colors text-white placeholder:text-white/70 shadow-md backdrop-blur-md"
              />
            </div>
            <button
              type="submit"
              style={{ backgroundColor: "#FFFFFF", opacity: 1 }}
              className="w-10 h-10 rounded-xl !bg-white hover:!bg-white flex items-center justify-center shrink-0 shadow-md border-none cursor-pointer transition-all !opacity-100"
              aria-label="Send message"
            >
              <PaperPlaneRight size={16} className="text-[#10B981]" weight="regular" />
            </button>
          </form>
        </div>
      </div>
    )
  }

  // View 5: Analyze Stock Workflow
  if (currentView === "analyze_stock") {
    const isAnalyzeActive = selectedAnalyzeStock !== null
    
    return (
      <div className="bg-card flex flex-col h-full text-foreground overflow-hidden">
        {renderPanelHeader()}
        
        <div className="flex-1 overflow-y-auto flex flex-col p-4 bg-card gap-4 select-none scrollbar-thin">
          <div className="flex flex-col gap-0.5">
            <h2 className="text-[16px] font-medium text-foreground tracking-tight">Analyze a Stock</h2>
            <p className="text-[13px] text-text-muted">Enter a company name or ticker to run deep technical audit.</p>
          </div>

          {!isAnalyzeActive && (
            <div className="flex flex-col gap-3">
              <div ref={dropdownRefAnalyze} className="relative">
                <label className="text-[12px] text-text-muted uppercase tracking-wider block mb-1">Search Security</label>
                <div className="relative">
                  <MagnifyingGlass size={14} className="absolute left-3 top-2.5 text-white" weight="regular" />
                  <input
                    type="text"
                    value={analyzeQuery}
                    onChange={handleAnalyzeChange}
                    onFocus={() => analyzeQuery && setShowAnalyzeSuggestions(true)}
                    placeholder="Type symbol or name (e.g. Tata Motors)..."
                    className="w-full bg-background border border-border rounded-xl pl-9 pr-8 py-2 text-[14px] font-normal focus:outline-none focus:border-foreground"
                  />
                </div>
                
                {showAnalyzeSuggestions && analyzeSuggestions.length > 0 && (
                  <div className="absolute z-50 left-0 right-0 mt-1 max-h-48 overflow-y-auto bg-card border border-border rounded-xl shadow-lg divide-y divide-border/40 scrollbar-thin">
                    {analyzeSuggestions.map(item => (
                      <button
                        key={item.Symbol}
                        type="button"
                        onClick={() => {
                          selectAnalyzeStock(item)
                          handleRunAnalyze(item.Symbol)
                        }}
                        className="w-full text-left px-3 py-2 text-xs hover:bg-accent/40 transition-colors text-foreground flex justify-between items-center cursor-pointer font-normal border-none"
                      >
                        <span className="font-medium text-[14px]">{item.Symbol}</span>
                        <span className="text-[12px] text-text-muted truncate max-w-[150px]">{item["Company Name"]}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div className="text-[13px] text-text-muted px-1 flex gap-1 items-baseline">
                <span>Example:</span>
                <button 
                  type="button"
                  onClick={() => {
                    const tata = (stockIndex as StockItem[]).find(s => s.Symbol === "TATAMOTORS")
                    if (tata) {
                      selectAnalyzeStock(tata)
                      handleRunAnalyze("TATAMOTORS")
                    }
                  }}
                  className="text-primary hover:underline font-medium border-none bg-transparent p-0 cursor-pointer"
                >
                  Tata Motors (TATAMOTORS)
                </button>
              </div>
            </div>
          )}

          {isAnalyzeActive && analyzeLoading && (
            <ChatLoadingIndicator />
          )}

          {isAnalyzeActive && analyzeError && (
            <div className="p-4 bg-destructive/5 border border-destructive/20 rounded-xl flex flex-col gap-2 items-center text-center">
              <ShieldWarning size={20} className="text-destructive" weight="regular" />
              <span className="text-[13px] font-medium text-foreground">Analysis Failed</span>
              <span className="text-[12px] text-text-muted">{analyzeError}</span>
              <div className="flex gap-2 mt-2 w-full">
                <button onClick={() => handleRunAnalyze(selectedAnalyzeStock!.Symbol)} className="flex-1 btn btn-primary text-xs py-1.5">Retry</button>
                <button onClick={() => { setSelectedAnalyzeStock(null); setAnalyzeOpenUICode(null); }} className="flex-1 btn btn-secondary text-xs py-1.5">Change Stock</button>
              </div>
            </div>
          )}

          {isAnalyzeActive && !analyzeLoading && !analyzeError && analyzeOpenUICode && (
            <div className="flex flex-col gap-4">
              <div className="flex justify-between items-center bg-accent/10 border border-border/20 px-3 py-2 rounded-xl">
                <div className="flex flex-col">
                  <span className="text-[14px] font-medium text-foreground">{selectedAnalyzeStock?.Symbol}</span>
                  <span className="text-[11px] text-text-muted truncate max-w-[200px]">{selectedAnalyzeStock?.["Company Name"]}</span>
                </div>
                <button 
                  onClick={() => { setSelectedAnalyzeStock(null); setAnalyzeOpenUICode(null); }}
                  className="text-xs text-text-muted hover:text-foreground font-medium bg-transparent border-none cursor-pointer"
                >
                  Change Stock
                </button>
              </div>

              <OpenUIRenderer 
                code={analyzeOpenUICode} 
                onSelectSymbol={(sym) => sym && handleSelectStockForAnalysis(sym)}
              />

              {analyzeFollowUps.length > 0 && (
                <div className="flex flex-col gap-1.5 mt-2 border-t border-border/20 pt-4">
                  <span className="text-[12px] text-text-muted font-medium">Suggested follow ups:</span>
                  <div className="flex flex-col gap-1.5 items-start">
                    {analyzeFollowUps.map((q, idx) => (
                      <button
                        key={idx}
                        onClick={() => handleFollowUpClick(q)}
                        className="text-left text-[13px] text-primary hover:text-primary-hover hover:underline bg-transparent border-none p-0 cursor-pointer font-medium"
                      >
                        {q}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    )
  }

  // View 6: Compare Stocks Workflow
  if (currentView === "compare_stocks") {
    const isCompareReady = selectedStock1 !== null && selectedStock2 !== null
    const isCompareComplete = compareOpenUICode !== null

    return (
      <div className="bg-card flex flex-col h-full text-foreground overflow-hidden">
        {renderPanelHeader()}
        
        <div className="flex-1 overflow-y-auto flex flex-col p-4 bg-card gap-4 select-none scrollbar-thin">
          <div className="flex flex-col gap-0.5">
            <h2 className="text-[16px] font-medium text-foreground tracking-tight">Compare Stocks</h2>
            <p className="text-[13px] text-text-muted">Compare daily metrics and technical indicator setups side-by-side.</p>
          </div>

          {!isCompareComplete && (
            <div className="flex flex-col gap-3">
              {/* Input 1 */}
              <div ref={dropdownRef1} className="relative">
                <label className="text-[12px] text-text-muted uppercase tracking-wider block mb-1">First Stock</label>
                <div className="relative">
                  <MagnifyingGlass size={14} className="absolute left-3 top-2.5 text-white" weight="regular" />
                  <input
                    type="text"
                    value={stock1Query}
                    onChange={handleStock1Change}
                    onFocus={() => stock1Query && setShowSuggestions1(true)}
                    placeholder="Search first stock..."
                    className="w-full bg-background border border-border rounded-xl pl-9 pr-8 py-2 text-[14px] font-normal focus:outline-none focus:border-foreground"
                  />
                  {selectedStock1 && <Check className="absolute right-3 top-3 h-3.5 w-3.5 text-success" />}
                </div>
                
                {showSuggestions1 && suggestions1.length > 0 && (
                  <div className="absolute z-50 left-0 right-0 mt-1 max-h-48 overflow-y-auto bg-card border border-border rounded-xl shadow-lg divide-y divide-border/40 scrollbar-thin">
                    {suggestions1.map(item => (
                      <button
                        key={item.Symbol}
                        type="button"
                        onClick={() => selectStock1(item)}
                        className="w-full text-left px-3 py-2 text-xs hover:bg-accent/40 transition-colors text-foreground flex justify-between items-center cursor-pointer font-normal border-none"
                      >
                        <span className="font-medium text-[14px]">{item.Symbol}</span>
                        <span className="text-[12px] text-text-muted truncate max-w-[150px]">{item["Company Name"]}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Input 2 */}
              <div ref={dropdownRef2} className="relative">
                <label className="text-[12px] text-text-muted uppercase tracking-wider block mb-1">Second Stock</label>
                <div className="relative">
                  <MagnifyingGlass size={14} className="absolute left-3 top-2.5 text-white" weight="regular" />
                  <input
                    type="text"
                    value={stock2Query}
                    onChange={handleStock2Change}
                    onFocus={() => stock2Query && setShowSuggestions2(true)}
                    placeholder="Search second stock..."
                    className="w-full bg-background border border-border rounded-xl pl-9 pr-8 py-2 text-[14px] font-normal focus:outline-none focus:border-foreground"
                  />
                  {selectedStock2 && <Check className="absolute right-3 top-3 h-3.5 w-3.5 text-success" />}
                </div>
                
                {showSuggestions2 && suggestions2.length > 0 && (
                  <div className="absolute z-50 left-0 right-0 mt-1 max-h-48 overflow-y-auto bg-card border border-border rounded-xl shadow-lg divide-y divide-border/40 scrollbar-thin">
                    {suggestions2.map(item => (
                      <button
                        key={item.Symbol}
                        type="button"
                        onClick={() => selectStock2(item)}
                        className="w-full text-left px-3 py-2 text-xs hover:bg-accent/40 transition-colors text-foreground flex justify-between items-center cursor-pointer font-normal border-none"
                      >
                        <span className="font-medium text-[14px]">{item.Symbol}</span>
                        <span className="text-[12px] text-text-muted truncate max-w-[150px]">{item["Company Name"]}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div className="text-[13px] text-text-muted px-1 flex gap-1 items-baseline">
                <span>Example:</span>
                <button 
                  type="button"
                  onClick={() => {
                    const tata = (stockIndex as StockItem[]).find(s => s.Symbol === "TATAMOTORS")
                    const reliance = (stockIndex as StockItem[]).find(s => s.Symbol === "RELIANCE")
                    if (tata) selectStock1(tata)
                    if (reliance) selectStock2(reliance)
                  }}
                  className="text-primary hover:underline font-medium border-none bg-transparent p-0 cursor-pointer"
                >
                  Tata Motors / Reliance
                </button>
              </div>

              <button
                onClick={() => handleRunCompare(selectedStock1!.Symbol, selectedStock2!.Symbol)}
                disabled={!isCompareReady}
                className="w-full btn btn-primary btn-md rounded-xl text-[14px] py-2.5 mt-2 font-medium flex items-center justify-center gap-1.5"
              >
                Compare Stocks
              </button>
            </div>
          )}

          {isCompareComplete && compareLoading && (
            <ChatLoadingIndicator />
          )}

          {isCompareComplete && compareError && (
            <div className="p-4 bg-destructive/5 border border-destructive/20 rounded-xl flex flex-col gap-2 items-center text-center">
              <ShieldWarning size={20} className="text-destructive" weight="regular" />
              <span className="text-[13px] font-medium text-foreground">Comparison Failed</span>
              <span className="text-[12px] text-text-muted">{compareError}</span>
              <div className="flex gap-2 mt-2 w-full">
                <button onClick={() => handleRunCompare(selectedStock1!.Symbol, selectedStock2!.Symbol)} className="flex-1 btn btn-primary text-xs py-1.5">Retry</button>
                <button onClick={() => { setCompareOpenUICode(null); }} className="flex-1 btn btn-secondary text-xs py-1.5">Change Setup</button>
              </div>
            </div>
          )}

          {isCompareComplete && !compareLoading && !compareError && compareOpenUICode && (
            <div className="flex flex-col gap-4">
              <div className="flex justify-between items-center bg-accent/10 border border-border/20 px-3 py-2 rounded-xl">
                <span className="text-[13px] font-medium text-foreground">{selectedStock1?.Symbol} vs {selectedStock2?.Symbol}</span>
                <button 
                  onClick={() => { setCompareOpenUICode(null); }}
                  className="text-xs text-text-muted hover:text-foreground font-medium bg-transparent border-none cursor-pointer"
                >
                  Change Setup
                </button>
              </div>

              <OpenUIRenderer 
                code={compareOpenUICode} 
                onSelectSymbol={(sym) => sym && handleSelectStockForAnalysis(sym)}
              />

              {compareFollowUps.length > 0 && (
                <div className="flex flex-col gap-1.5 mt-2 border-t border-border/20 pt-4">
                  <span className="text-[12px] text-text-muted font-medium">Suggested follow ups:</span>
                  <div className="flex flex-col gap-1.5 items-start">
                    {compareFollowUps.map((q, idx) => (
                      <button
                        key={idx}
                        onClick={() => handleFollowUpClick(q)}
                        className="text-left text-[13px] text-primary hover:text-primary-hover hover:underline bg-transparent border-none p-0 cursor-pointer font-medium"
                      >
                        {q}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    )
  }

  return null
}

// ====================================================
// Markdown Parser Logic
// ====================================================
const parseCodeInline = (text: string) => {
  const codeParts = text.split(/(\`.*?\`)/g)
  return codeParts.map((part, index) => {
    if (part.startsWith("`") && part.endsWith("`")) {
      return (
        <code 
          key={index} 
          className="px-1 py-0.5 bg-accent border border-border/80 text-[14px] font-mono rounded text-foreground font-medium"
        >
          {part.slice(1, -1)}
        </code>
      )
    }
    return part
  })
}

const parseInlineMarkdown = (text: string) => {
  const boldParts = text.split(/(\*\*.*?\*\*)/g)
  return boldParts.map((part, index) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return (
        <span key={index} className="text-foreground font-normal">
          {parseCodeInline(part.slice(2, -2))}
        </span>
      )
    }
    return parseCodeInline(part)
  })
}

const renderMarkdown = (text: string) => {
  const parts = text.split(/(\`\`\`[\s\S]*?\`\`\`)/g)
  
  return parts.map((part, index) => {
    if (part.startsWith("```") && part.endsWith("```")) {
      const codeLines = part.slice(3, -3).trim().split("\n")
      if (codeLines[0] && !codeLines[0].includes(" ") && codeLines[0].length < 15) {
        codeLines.shift()
      }
      const code = codeLines.join("\n")
      return (
        <pre 
          key={index} 
          className="bg-accent/40 border border-border/80 rounded-xl p-3 my-1 overflow-x-auto text-[14px] font-mono text-foreground shadow-sm leading-normal"
        >
          <code>{code}</code>
        </pre>
      )
    }
    
    const lines = part.split("\n")
    let listItems: React.ReactNode[] = []
    const elements: React.ReactNode[] = []
    
    let inTable = false
    let tableRows: string[][] = []

    let inBlockquote = false
    let blockquoteLines: string[] = []

    const flushList = (key: string | number) => {
      if (listItems.length > 0) {
        elements.push(
          <ul key={`ul-${key}`} className="list-disc pl-4 my-1 flex flex-col gap-0.5 text-[15px]">
            {listItems}
          </ul>
        )
        listItems = []
      }
    }

    const flushTable = (key: string | number) => {
      if (tableRows.length > 0) {
        const hasHeaders = tableRows.length > 1 && tableRows[1].some(cell => cell.trim().startsWith("---") || cell.trim().startsWith(":---"))
        
        let headers: string[] = []
        let bodyRows: string[][] = []
        
        if (hasHeaders) {
          headers = tableRows[0]
          bodyRows = tableRows.slice(2)
        } else {
          bodyRows = tableRows
        }
        
        elements.push(
          <div key={`table-container-${key}`} className="overflow-x-auto my-1.5 border border-border rounded-xl shadow-sm bg-card">
            <table className="min-w-full divide-y divide-border text-[14px] text-left leading-normal">
              {headers.length > 0 && (
                <thead className="bg-accent/50 font-medium">
                  <tr>
                    {headers.map((h, i) => (
                      <th key={i} className="px-2 py-1.5 border-b border-border font-medium text-text-muted">{parseInlineMarkdown(h)}</th>
                    ))}
                  </tr>
                </thead>
              )}
              <tbody className="divide-y divide-border/60">
                {bodyRows.map((row, ri) => (
                  <tr key={ri} className="hover:bg-accent/20">
                    {row.map((cell, ci) => (
                      <td key={ci} className="px-2 py-1.5 text-foreground">{parseInlineMarkdown(cell)}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )
        tableRows = []
        inTable = false
      }
    }

    const flushBlockquote = (key: string | number) => {
      if (blockquoteLines.length > 0) {
        elements.push(
          <div key={`bq-${key}`} className="my-2.5 bg-accent/25 border-l-2 border-primary/70 px-3.5 py-2.5 rounded-r-xl text-[13.5px] leading-relaxed text-text-muted select-text flex flex-col gap-1.5 border border-l-0 border-border/10 shadow-[0_2px_8px_rgba(0,0,0,0.01)]">
            {blockquoteLines.map((line, li) => (
              <span key={li} className="block">{parseInlineMarkdown(line)}</span>
            ))}
          </div>
        )
        blockquoteLines = []
        inBlockquote = false
      }
    }
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i]
      const trimmed = line.trim()
      
      if (trimmed.startsWith("|")) {
        flushList(i)
        flushBlockquote(i)
        inTable = true
        const cells = line.split("|").map(c => c.trim()).filter((_, idx, arr) => idx > 0 && idx < arr.length - 1)
        tableRows.push(cells)
        continue
      } else if (inTable) {
        flushTable(i)
      }

      if (trimmed.startsWith(">")) {
        flushList(i)
        flushTable(i)
        inBlockquote = true
        const content = line.startsWith("> ") ? line.slice(2) : line.slice(1)
        blockquoteLines.push(content)
        continue
      } else if (inBlockquote) {
        flushBlockquote(i)
      }
      
      if (trimmed.startsWith("### ")) {
        flushList(i)
        elements.push(
          <div key={i} className="mt-4 mb-2 first:mt-0 border-l-2 border-primary pl-3 py-0.5 select-none">
            <h3 className="text-xs font-medium text-foreground uppercase tracking-wider">{parseInlineMarkdown(trimmed.slice(4))}</h3>
          </div>
        )
      } else if (trimmed.startsWith("#### ")) {
        flushList(i)
        elements.push(<h4 key={i} className="text-[13px] font-medium text-foreground mt-2 mb-0.5 leading-none">{parseInlineMarkdown(trimmed.slice(5))}</h4>)
      } else if (trimmed.startsWith("## ")) {
        flushList(i)
        elements.push(<h2 key={i} className="text-[14px] font-medium text-foreground mt-3 mb-1 leading-none">{parseInlineMarkdown(trimmed.slice(3))}</h2>)
      } else if (trimmed.startsWith("- ") || trimmed.startsWith("* ")) {
        listItems.push(<li key={`li-${i}`} className="leading-snug text-text-muted mt-0.5 text-[15px]">{parseInlineMarkdown(trimmed.slice(2))}</li>)
      } else if (trimmed === "") {
        flushList(i)
        elements.push(<div key={`br-${i}`} className="h-1" />)
      } else {
        flushList(i)
        elements.push(<p key={i} className="my-1 leading-snug text-text-muted text-[15px]">{parseInlineMarkdown(line)}</p>)
      }
    }
    
    flushList("end")
    flushTable("end")
    flushBlockquote("end")
    
    return <React.Fragment key={index}>{elements}</React.Fragment>
  })
}
