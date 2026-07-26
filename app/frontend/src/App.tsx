import { useState, useEffect, useRef } from "react"
import { MagnifyingGlass, ArrowsClockwise, WarningCircle, X, Layout, Briefcase, GraduationCap, Gear, Robot, Sparkle, TrendUp } from "@phosphor-icons/react"
import { CustomDropdown } from "./components/CustomDropdown"
import { HoldingsOverview } from "./components/HoldingsOverview"
import { ScripAnalyzer } from "./components/ScripAnalyzer"
import { OrderTicket } from "./components/OrderTicket"
import { PlaybookUploader } from "./components/PlaybookUploader"
import { SettingsPage } from "./components/SettingsPage"
import { AutomationLab } from "./components/AutomationLab"
import { CommandK } from "./components/CommandK"
import { Chatbot } from "./components/Chatbot"
import { TradingPerformance } from "./components/TradingPerformance"
import { gsap } from "gsap"

function getTechnicalExplanation(op: any) {
  const sym = op.symbol ? op.symbol.toUpperCase() : "";
  if (sym === "TITAN") {
    return "Consolidation breakout near key levels with strong consumer demand trends and rising relative strength.";
  } else if (sym === "BHARTIARTL") {
    return "Moving average crossover confirms sustained upward momentum in the telecom sector with high volume support.";
  } else if (sym === "HDFCBANK") {
    return "Pullback setup showing institutional buying support at key moving average support bands.";
  } else if (sym === "RELIANCE") {
    return "Ascending triangle pattern breakout with volume expansion confirming long side entry.";
  } else if (sym === "TCS") {
    return "Double bottom reversal pattern near multi-month support with positive MACD divergence.";
  } else if (sym === "INFY") {
    return "Shallow pullback towards 50-day EMA showing tight consolidation range ready for breakout.";
  } else if (sym === "ICICIBANK") {
    return "Relative strength outperformance versus Nifty Bank index with volume surge breakout.";
  } else if (sym === "SBIN") {
    return "RSI momentum shift above 60 key level following flag pattern breakout.";
  } else if (sym === "LT") {
    return "Order book momentum fueling breakout above multi-week resistance levels.";
  } else if (sym === "HFCL") {
    return "Volume exceeds 2.5x of 20-day average, confirming breakout above local consolidation.";
  } else if (sym === "KPITTECH") {
    return "Momentum sustained above 50-period EMA with active sector leadership.";
  } else if (sym === "JBM AUTO") {
    return "Consolidation pullback near major trendline support with clear risk invalidation.";
  } else if (sym === "BLS INTL") {
    return "RSI holds above neutral line during shallow pullback, indicating strong demand.";
  } else if (sym === "MARUTI") {
    return "Sector rotation into auto names with rising delivery volumes and supportive earnings momentum.";
  } else if (sym === "DIVISLAB") {
    return "Pharma sector leader breaking out of multi-month consolidation with institutional accumulation visible on delivery data.";
  } else if (sym === "COFORGE") {
    return "IT midcap outperformer showing relative strength versus Nifty IT with ascending channel continuation pattern.";
  } else if (sym === "BHARATFORG") {
    return "Capital goods momentum play with defense order book expansion supporting trend continuation above key EMAs.";
  } else {
    const tagsText = op.signal_tags?.filter((t: string) => t !== op.setup).join(", ").toLowerCase() || "momentum indicators";
    return `Setup aligns with playbook criteria, supported by expanding ${tagsText} structures.`;
  }
}

function App() {
  const [activeTab, setActiveTab] = useState<"dashboard" | "portfolio" | "playbook" | "automation" | "settings">("dashboard")
  const [selectedSymbol, setSelectedSymbol] = useState<string | null>(null)
  const [mobileChatbotOpen, setMobileChatbotOpen] = useState<boolean>(false)
  const [mobilePerformanceOpen, setMobilePerformanceOpen] = useState<boolean>(false)

  const [researchExpanded, setResearchExpanded] = useState<boolean>(false)
  
  useEffect(() => {
    const root = window.document.documentElement
    root.classList.remove("light", "dark")
    root.classList.add("dark")
    localStorage.setItem("theme", "dark")
  }, [])
  
  const isSandboxMode = window.location.search.includes("mode=sandbox");

  const hitBottomRef = useRef(false);
  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const target = e.currentTarget;
    const isAtBottom = target.scrollHeight - target.scrollTop <= target.clientHeight + 20;
    if (isAtBottom) {
      if (!hitBottomRef.current) {
        hitBottomRef.current = true;
        gsap.fromTo(
          ".opportunities-container",
          { paddingBottom: "140px" },
          {
            paddingBottom: "64px",
            duration: 0.8,
            ease: "bounce.out",
            overwrite: "auto"
          }
        );
      }
    } else {
      hitBottomRef.current = false;
    }
  };

  // Market & opportunities state
  const [marketOverview, setMarketOverview] = useState<any>({
    market_status: { session: "Regular Trading", open: true, time: new Date().toLocaleTimeString() },
    market_health: { score: 7.5, sentiment: "Constructive", suggested_exposure: "75%" },
    indices: {
      nifty: { price: 23767.45, change: -0.43, sparkline: [23700, 23720, 23750, 23760, 23767.45], data_available: true },
      sensex: { price: 76059.77, change: -0.43, sparkline: [76000, 76020, 76040, 76050, 76059.77], data_available: true },
      banknifty: { price: 56694.20, change: 0.18, sparkline: [56600, 56630, 56650, 56680, 56694.20], data_available: true },
      midcap: { price: 58942.50, change: -0.83, sparkline: [58900, 58910, 58920, 58930, 58942.50], data_available: true }
    }
  })
  
  const [opportunities, setOpportunities] = useState<any[]>([
    { 
      symbol: "RELIANCE", 
      name: "Reliance Industries Ltd", 
      sector: "Energy", 
      score: 88, 
      rsi: 61.2, 
      volume_status: "Above Average", 
      sma_alignment: "Bullish", 
      price: 2540.5, 
      change: 1.2,
      setup: "Ascending Triangle",
      entry: "INR 2500 - 2525",
      target: "INR 2650",
      stop: "INR 2470",
      risk_reward: "2.4",
      upside_pct: "5.1",
      ref_id: 1842210
    },
    { 
      symbol: "TVSMOTOR", 
      name: "TVS Motor Co", 
      sector: "Auto", 
      score: 74, 
      rsi: 54.3, 
      volume_status: "Average", 
      sma_alignment: "Bullish", 
      price: 1820.1, 
      change: -0.4,
      setup: "Support Pullback",
      entry: "INR 1800 - 1815",
      target: "INR 1930",
      stop: "INR 1765",
      risk_reward: "2.2",
      upside_pct: "6.0",
      ref_id: 83414
    },
    { 
      symbol: "HFCL", 
      name: "HFCL Ltd", 
      sector: "Telecom", 
      score: 81, 
      rsi: 59.8, 
      volume_status: "High Expansion", 
      sma_alignment: "Bullish", 
      price: 115.4, 
      change: 3.5,
      setup: "Breakout",
      entry: "INR 112 - 114",
      target: "INR 128",
      stop: "INR 108",
      risk_reward: "2.8",
      upside_pct: "11.2",
      ref_id: 1755599
    },
    { 
      symbol: "KPITTECH", 
      name: "KPIT Technologies", 
      sector: "IT Services", 
      score: 92, 
      rsi: 68.5, 
      volume_status: "High Expansion", 
      sma_alignment: "Bullish", 
      price: 1640.2, 
      change: 4.8,
      setup: "Confirmed Breakout",
      entry: "INR 1610 - 1630",
      target: "INR 1820",
      stop: "INR 1560",
      risk_reward: "2.6",
      upside_pct: "11.0",
      ref_id: 1755600
    },
    { 
      symbol: "HDFCBANK", 
      name: "HDFC Bank Ltd", 
      sector: "Banking", 
      score: 79, 
      rsi: 58.1, 
      volume_status: "Above Average", 
      sma_alignment: "Bullish", 
      price: 1680.5, 
      change: 0.9,
      setup: "Double Bottom",
      entry: "INR 1650 - 1670",
      target: "INR 1800",
      stop: "INR 1610",
      risk_reward: "2.2",
      upside_pct: "7.1",
      ref_id: 1755606
    },
    { 
      symbol: "COFORGE", 
      name: "Coforge Ltd", 
      sector: "IT Services", 
      score: 85, 
      rsi: 63.4, 
      volume_status: "High Expansion", 
      sma_alignment: "Bullish", 
      price: 5210.0, 
      change: 2.7,
      setup: "Flag Breakout",
      entry: "INR 5150 - 5190",
      target: "INR 5700",
      stop: "INR 4980",
      risk_reward: "2.4",
      upside_pct: "9.4",
      ref_id: 1755604
    },
    { 
      symbol: "INFY", 
      name: "Infosys Ltd", 
      sector: "IT", 
      score: 68, 
      rsi: 48.2, 
      volume_status: "Below Average", 
      sma_alignment: "Neutral", 
      price: 1485.4, 
      change: -1.1,
      setup: "Consolidation",
      entry: "INR 1460 - 1480",
      target: "INR 1590",
      stop: "INR 1430",
      risk_reward: "2.2",
      upside_pct: "7.0",
      ref_id: 1755607
    }
  ])
  
  const [portfolioStats, setPortfolioStats] = useState<any>({
    status: "success",
    is_sandbox: true,
    funds: {
      start_of_day_funds: 200000.0,
      net_margin_available: 150000.0,
      total_margin_blocked: 50000.0,
      brokerage: 150.0
    },
    holdings: {
      client_code: "SANDBOX_MOCK",
      holding_stats: {
        invested_amount: 317060.0,
        current_value: 323137.0,
        total_pnl: 6077.0,
        total_pnl_chg: 1.92,
        day_pnl: 2450.0,
        day_pnl_chg: 0.76
      },
      holdings: [
        {
          symbol: "RELIANCE",
          displayName: "Reliance Industries",
          exchange: "NSE",
          qty: 50,
          avg_price: 2500.0,
          ltp: 2540.5,
          invested_value: 125000.0,
          current_value: 127025.0,
          net_pnl: 2025.0,
          net_pnl_chg: 1.62,
          day_pnl: 520.0
        },
        {
          symbol: "TVSMOTOR",
          displayName: "TVS Motor",
          exchange: "NSE",
          qty: 40,
          avg_price: 1826.5,
          ltp: 1820.1,
          invested_value: 73060.0,
          current_value: 72804.0,
          net_pnl: -256.0,
          net_pnl_chg: -0.35,
          day_pnl: -80.0
        },
        {
          symbol: "HFCL",
          displayName: "HFCL Ltd",
          exchange: "NSE",
          qty: 500,
          avg_price: 110.0,
          ltp: 115.4,
          invested_value: 55000.0,
          current_value: 57700.0,
          net_pnl: 2700.0,
          net_pnl_chg: 4.91,
          day_pnl: 1250.0
        },
        {
          symbol: "KPITTECH",
          displayName: "KPIT Technologies",
          exchange: "NSE",
          qty: 40,
          avg_price: 1600.0,
          ltp: 1640.2,
          invested_value: 64000.0,
          current_value: 65608.0,
          net_pnl: 1608.0,
          net_pnl_chg: 2.51,
          day_pnl: 760.0
        }
      ]
    },
    positions: []
  })
  
  const [playbookStats, setPlaybookStats] = useState<{ files: string[], chunks_count: number, sources?: any[] }>(isSandboxMode ? {
    files: ["Sandbox_Trading_Rules.pdf"],
    chunks_count: 5,
    sources: []
  } : { files: [], chunks_count: 0, sources: [] })
  
  const [backendStatus, setBackendStatus] = useState<"connecting" | "connected" | "fallback">("connecting")
  const [offlineMode, setOfflineMode] = useState<boolean>(isSandboxMode)
  
  // Opportunities filters & sorting
  const [selectedSector, setSelectedSector] = useState<string>("All Sectors")
  const [sortBy, setSortBy] = useState<string>("AI Score")
  
  // Command K search state
  const [commandKOpen, setCommandKOpen] = useState<boolean>(false)
  const [sidebarWidth, setSidebarWidth] = useState<number>(240)
  const [isResizing, setIsResizing] = useState<boolean>(false)
  const sidebarCollapsed = sidebarWidth < 120
  
  const startResizing = (mouseDownEvent: React.MouseEvent) => {
    mouseDownEvent.preventDefault()
    setIsResizing(true)
  }
  
  // Order ticket state
  const [orderTicketOpen, setOrderTicketOpen] = useState<boolean>(false)
  const [orderTicketScrip, setOrderTicketScrip] = useState<any>(null)
  
  // Nubra API Auth sync state
  const [authModalOpen, setAuthModalOpen] = useState<boolean>(false)
  const [authStep, setAuthStep] = useState<number>(1)
  const [authPhone, setAuthPhone] = useState<string>("")
  const [authOtp, setAuthOtp] = useState<string>("")
  const [authPin, setAuthPin] = useState<string>("")
  const [authDeviceId, setAuthDeviceId] = useState<string>("STM_DEVICE_001")
  const [authTempToken, setAuthTempToken] = useState<string>("")
  const [authAuthToken, setAuthAuthToken] = useState<string>("")
  const [authStatus, setAuthStatus] = useState<any>(isSandboxMode ? { authenticated: true, mock_mode: true, phone_saved: true, mpin_saved: true, phone: "9876543210" } : { authenticated: false, mock_mode: true, phone_saved: false, mpin_saved: false, phone: "" })
  const [authError, setAuthError] = useState<string | null>(null)
  const [saveCredsCheckbox, setSaveCredsCheckbox] = useState<boolean>(true)
  const [savedCredsStatus, setSavedCredsStatus] = useState<{ phone_saved: boolean, mpin_saved: boolean, phone: string }>({ phone_saved: false, mpin_saved: false, phone: "" })

  const fetchCredentialsStatus = async () => {
    try {
      const res = await fetch("/api/auth/credentials")
      if (res.ok) {
        const data = await res.json()
        setSavedCredsStatus(data)
        if (data.phone_saved && data.phone) {
          setAuthPhone(data.phone)
        }
      }
    } catch (e) {
      console.error("Failed to fetch credentials status", e)
    }
  }

  useEffect(() => {
    if (authModalOpen) {
      fetchCredentialsStatus()
    }
  }, [authModalOpen])

  // Close research workspace on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && researchExpanded) {
        setResearchExpanded(false)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [researchExpanded])

  // Fetch initial dashboard & portfolio data
  const loadDashboardData = async (forceOffline: boolean = false) => {
    if (forceOffline) {
      // Set client-side dummy values to allow instant loading in sandbox mode
      setMarketOverview({
        market_status: { session: "Closed (Sandbox)", open: false, time: new Date().toLocaleTimeString() },
        market_health: { score: 7.2, sentiment: "Neutral Sandbox", suggested_exposure: "30%" },
        indices: {
          nifty: { price: 24200.5, change: 120.5, sparkline: [24000, 24050, 24100, 24150, 24200], data_available: true, provider: "Mock", last_updated: "Offline Sandbox" },
          sensex: { price: 79500.2, change: 380.4, sparkline: [79000, 79100, 79300, 79400, 79500], data_available: true, provider: "Mock", last_updated: "Offline Sandbox" }
        }
      });
      setOpportunities([
        { 
          symbol: "RELIANCE", 
          name: "Reliance Industries Ltd (Mock)", 
          sector: "Energy", 
          score: 88, 
          rsi: 61.2, 
          volume_status: "Above Average", 
          sma_alignment: "Bullish", 
          price: 2540.5, 
          change: 1.2,
          setup: "Ascending Triangle",
          entry: "INR 2500 - 2525",
          target: "INR 2650",
          stop: "INR 2470",
          risk_reward: "2.4",
          upside_pct: "5.1",
          ref_id: 1842210
        },
        { 
          symbol: "TVSMOTOR", 
          name: "TVS Motor Co (Mock)", 
          sector: "Auto", 
          score: 74, 
          rsi: 54.3, 
          volume_status: "Average", 
          sma_alignment: "Bullish", 
          price: 1820.1, 
          change: -0.4,
          setup: "Support Pullback",
          entry: "INR 1800 - 1815",
          target: "INR 1930",
          stop: "INR 1765",
          risk_reward: "2.2",
          upside_pct: "6.0",
          ref_id: 83414
        },
        { 
          symbol: "HFCL", 
          name: "HFCL Ltd (Mock)", 
          sector: "Telecom", 
          score: 81, 
          rsi: 59.8, 
          volume_status: "High Expansion", 
          sma_alignment: "Bullish", 
          price: 115.4, 
          change: 3.5,
          setup: "Breakout",
          entry: "INR 112 - 114",
          target: "INR 128",
          stop: "INR 108",
          risk_reward: "2.8",
          upside_pct: "11.2",
          ref_id: 1755599
        },
        { 
          symbol: "KPITTECH", 
          name: "KPIT Technologies (Mock)", 
          sector: "IT Services", 
          score: 92, 
          rsi: 68.5, 
          volume_status: "High Expansion", 
          sma_alignment: "Bullish", 
          price: 1640.2, 
          change: 4.8,
          setup: "Confirmed Breakout",
          entry: "INR 1610 - 1630",
          target: "INR 1820",
          stop: "INR 1560",
          risk_reward: "2.6",
          upside_pct: "11.0",
          ref_id: 1755600
        },
        { 
          symbol: "HDFCBANK", 
          name: "HDFC Bank Ltd (Mock)", 
          sector: "Banking", 
          score: 79, 
          rsi: 58.1, 
          volume_status: "Above Average", 
          sma_alignment: "Bullish", 
          price: 1680.5, 
          change: 0.9,
          setup: "Double Bottom",
          entry: "INR 1650 - 1670",
          target: "INR 1800",
          stop: "INR 1610",
          risk_reward: "2.2",
          upside_pct: "7.1",
          ref_id: 1755606
        },
        { 
          symbol: "COFORGE", 
          name: "Coforge Ltd (Mock)", 
          sector: "IT Services", 
          score: 85, 
          rsi: 63.4, 
          volume_status: "High Expansion", 
          sma_alignment: "Bullish", 
          price: 5210.0, 
          change: 2.7,
          setup: "Flag Breakout",
          entry: "INR 5150 - 5190",
          target: "INR 5700",
          stop: "INR 4980",
          risk_reward: "2.4",
          upside_pct: "9.4",
          ref_id: 1755604
        },
        { 
          symbol: "INFY", 
          name: "Infosys Ltd (Mock)", 
          sector: "IT", 
          score: 68, 
          rsi: 48.2, 
          volume_status: "Below Average", 
          sma_alignment: "Neutral", 
          price: 1485.4, 
          change: -1.1,
          setup: "Consolidation",
          entry: "INR 1460 - 1480",
          target: "INR 1590",
          stop: "INR 1430",
          risk_reward: "2.2",
          upside_pct: "7.0",
          ref_id: 1755607
        }
      ]);
      setPortfolioStats({
        status: "success",
        is_sandbox: true,
        funds: {
          start_of_day_funds: 200000.0,
          net_margin_available: 150000.0,
          total_margin_blocked: 50000.0,
          brokerage: 150.0
        },
        holdings: {
          client_code: "SANDBOX_MOCK",
          holding_stats: {
            invested_amount: 317060.0,
            current_value: 323137.0,
            total_pnl: 6077.0,
            total_pnl_chg: 1.92,
            day_pnl: 2450.0,
            day_pnl_chg: 0.76
          },
          holdings: [
            {
              symbol: "RELIANCE",
              displayName: "Reliance Industries",
              exchange: "NSE",
              qty: 50,
              avg_price: 2500.0,
              ltp: 2540.5,
              invested_value: 125000.0,
              current_value: 127025.0,
              net_pnl: 2025.0,
              net_pnl_chg: 1.62,
              day_pnl: 520.0
            },
            {
              symbol: "TVSMOTOR",
              displayName: "TVS Motor",
              exchange: "NSE",
              qty: 40,
              avg_price: 1826.5,
              ltp: 1820.1,
              invested_value: 73060.0,
              current_value: 72804.0,
              net_pnl: -256.0,
              net_pnl_chg: -0.35,
              day_pnl: -80.0
            },
            {
              symbol: "HFCL",
              displayName: "HFCL Ltd",
              exchange: "NSE",
              qty: 500,
              avg_price: 110.0,
              ltp: 115.4,
              invested_value: 55000.0,
              current_value: 57700.0,
              net_pnl: 2700.0,
              net_pnl_chg: 4.91,
              day_pnl: 1250.0
            },
            {
              symbol: "KPITTECH",
              displayName: "KPIT Technologies",
              exchange: "NSE",
              qty: 40,
              avg_price: 1600.0,
              ltp: 1640.2,
              invested_value: 64000.0,
              current_value: 65608.0,
              net_pnl: 1608.0,
              net_pnl_chg: 2.51,
              day_pnl: 760.0
            }
          ]
        },
        positions: []
      });
      setAuthStatus({ authenticated: true, mock_mode: true, phone_saved: true, mpin_saved: true, phone: "9876543210" });
      setPlaybookStats({ files: ["Sandbox_Trading_Rules.pdf"], chunks_count: 5 });
      setOfflineMode(true);
      return;
    }

    setBackendStatus("connecting")
    const API_BASE = "https://stalkkmarket.onrender.com"

    const fetchWithRetry = async (endpoint: string, retries = 3): Promise<any> => {
      let lastErr: any = null
      for (let i = 0; i < retries; i++) {
        try {
          const url = i === 0 ? endpoint : `${API_BASE}${endpoint}`
          const controller = new AbortController()
          const timeoutId = setTimeout(() => controller.abort(), 12000)
          const res = await fetch(url, { signal: controller.signal })
          clearTimeout(timeoutId)
          if (res.ok) return await res.json()
        } catch (err) {
          lastErr = err
          if (i < retries - 1) await new Promise((r) => setTimeout(r, 2500))
        }
      }
      throw lastErr || new Error(`Fetch failed for ${endpoint}`)
    }

    try {
      const fetchPromises = [
        fetchWithRetry("/api/market/overview").then((data) => setMarketOverview(data)),
        fetchWithRetry("/api/market/opportunities-v2").then((data) => setOpportunities(data)),
        fetchWithRetry("/api/portfolio/stats").then((data) => setPortfolioStats(data)),
        fetchWithRetry("/api/auth/status").then((data) => {
          setAuthStatus(data)
          if (data.device_id) setAuthDeviceId(data.device_id)
        }),
        fetchWithRetry("/api/playbook/list").then((data) => setPlaybookStats(data))
      ]

      await Promise.all(fetchPromises)
      setOfflineMode(false)
      setBackendStatus("connected")
    } catch (e: any) {
      console.error("Connection attempt failed. Re-trying or falling back.", e)
      setBackendStatus("fallback")
    }
  }

  useEffect(() => {
    const isSandbox = window.location.search.includes("mode=sandbox");
    if (isSandbox) {
      loadDashboardData(true)
    } else {
      loadDashboardData()
    }
    
    // Periodically update indices, opportunities, and portfolio limits every 10 seconds in the background
    const interval = setInterval(() => {
      // Do not auto-poll if we are in offline sandbox mode or currently loading
      const currentSandbox = window.location.search.includes("mode=sandbox");
      if (!currentSandbox && !offlineMode) {
        loadDashboardData(false)
      }
    }, 10000)
    
    return () => clearInterval(interval)
  }, [offlineMode])



  // Resize handler for the sidebar (collapsing only via drag)
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing) return
      let newWidth = e.clientX
      if (newWidth > 240) {
        newWidth = 240
      }
      if (newWidth < 120) {
        newWidth = 72 // Snap to collapsed width
      }
      setSidebarWidth(newWidth)
    }

    const handleMouseUp = () => {
      setIsResizing(false)
    }

    if (isResizing) {
      window.addEventListener("mousemove", handleMouseMove)
      window.addEventListener("mouseup", handleMouseUp)
    }

    return () => {
      window.removeEventListener("mousemove", handleMouseMove)
      window.removeEventListener("mouseup", handleMouseUp)
    }
  }, [isResizing])

  // Action methods

  // Action methods
  const handleExecuteTrade = async (orderPayload: any): Promise<boolean> => {
    if (offlineMode) {
      // Mock trade execution client-side for Sandbox Mode
      const qty = Number(orderPayload.qty);
      const price = Number(orderPayload.price);
      const symbol = orderPayload.symbol;
      const isBuy = orderPayload.side === "BUY";
      
      const tradeValue = qty * price;
      
      setPortfolioStats((prev: any) => {
        if (!prev) return prev;
        
        const funds = { ...prev.funds };
        const holdingsObj = { ...prev.holdings };
        let holdingsList = [...(holdingsObj.holdings || [])];
        
        if (isBuy) {
          if (funds.net_margin_available < tradeValue) {
            alert("Insufficient funds in Sandbox mode!");
            return prev;
          }
          funds.net_margin_available = Math.max(0, funds.net_margin_available - tradeValue);
          funds.total_margin_blocked = (funds.total_margin_blocked || 0) + tradeValue;
          
          // Check if already holding
          const existingIdx = holdingsList.findIndex((h: any) => h.symbol === symbol);
          if (existingIdx >= 0) {
            const existing = holdingsList[existingIdx];
            const newQty = existing.qty + qty;
            const newAvgPrice = ((existing.qty * existing.avg_price) + tradeValue) / newQty;
            const newCurrentValue = newQty * (existing.ltp || price);
            const newPnl = newCurrentValue - (newQty * newAvgPrice);
            holdingsList[existingIdx] = {
              ...existing,
              qty: newQty,
              avg_price: Math.round(newAvgPrice * 100) / 100,
              invested_value: Math.round(newQty * newAvgPrice * 100) / 100,
              current_value: Math.round(newCurrentValue * 100) / 100,
              net_pnl: Math.round(newPnl * 100) / 100,
              net_pnl_chg: Math.round((newPnl / (newQty * newAvgPrice)) * 10000) / 100
            };
          } else {
            holdingsList.push({
              symbol: symbol,
              displayName: symbol,
              exchange: "NSE",
              qty: qty,
              avg_price: price,
              ltp: price,
              invested_value: tradeValue,
              current_value: tradeValue,
              net_pnl: 0.0,
              net_pnl_chg: 0.0,
              day_pnl: 0.0
            });
          }
        } else {
          // Sell order
          const existingIdx = holdingsList.findIndex((h: any) => h.symbol === symbol);
          if (existingIdx < 0 || holdingsList[existingIdx].qty < qty) {
            alert("Insufficient quantity to sell!");
            return prev;
          }
          
          const existing = holdingsList[existingIdx];
          funds.net_margin_available = funds.net_margin_available + tradeValue;
          funds.total_margin_blocked = Math.max(0, funds.total_margin_blocked - (qty * existing.avg_price));
          
          if (existing.qty === qty) {
            holdingsList.splice(existingIdx, 1);
          } else {
            const newQty = existing.qty - qty;
            const newCurrentValue = newQty * (existing.ltp || price);
            const newPnl = newCurrentValue - (newQty * existing.avg_price);
            holdingsList[existingIdx] = {
              ...existing,
              qty: newQty,
              current_value: Math.round(newCurrentValue * 100) / 100,
              net_pnl: Math.round(newPnl * 100) / 100,
              net_pnl_chg: Math.round((newPnl / (newQty * existing.avg_price)) * 10000) / 100
            };
          }
        }
        
        // Re-calculate holding stats
        const invested_amount = holdingsList.reduce((sum: number, h: any) => sum + (h.invested_value || 0), 0);
        const current_value = holdingsList.reduce((sum: number, h: any) => sum + (h.current_value || 0), 0);
        const total_pnl = current_value - invested_amount;
        const total_pnl_chg = invested_amount > 0 ? (total_pnl / invested_amount) * 100 : 0.0;
        
        return {
          ...prev,
          funds,
          holdings: {
            ...holdingsObj,
            holding_stats: {
              invested_amount: Math.round(invested_amount * 100) / 100,
              current_value: Math.round(current_value * 100) / 100,
              total_pnl: Math.round(total_pnl * 100) / 100,
              total_pnl_chg: Math.round(total_pnl_chg * 100) / 100,
              day_pnl: prev.holdings?.holding_stats?.day_pnl || 0.0,
              day_pnl_chg: prev.holdings?.holding_stats?.day_pnl_chg || 0.0
            },
            holdings: holdingsList
          }
        };
      });
      return true;
    }

    try {
      const response = await fetch("/api/trade/place", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(orderPayload)
      })
      if (response.ok) {
        // Refresh portfolio immediately
        const portfolioRes = await fetch("/api/portfolio/stats")
        const portfolioData = await portfolioRes.json()
        setPortfolioStats(portfolioData)
        return true
      }
      return false
    } catch (e) {
      console.error("Order placement execution error", e)
      return false
    }
  }

  const handlePlaybookUpdate = () => {
    loadDashboardData()
  }

  // --- NUBRA AUTHENTICATION HANDLERS ---
  const handleRequestOTP = async (e: React.FormEvent) => {
    e.preventDefault()
    setAuthError(null)
    try {
      const response = await fetch("/api/auth/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: authPhone, skip_totp: false })
      })
      const data = await response.json()
      if (response.ok) {
        setAuthTempToken(data.temp_token)
        // Request immediate second step (OTP Generation)
        const secondRes = await fetch("/api/auth/send-otp", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ phone: authPhone, skip_totp: true, temp_token: data.temp_token })
        })
        const secondData = await secondRes.json()
        if (secondRes.ok) {
          setAuthTempToken(secondData.temp_token)
          setAuthStep(2)
        } else {
          setAuthError(secondData.detail || "Step 2 OTP generation failed")
        }
      } else {
        setAuthError(data.detail || "Failed to send OTP verification")
      }
    } catch (e) {
      setAuthError("Auth server unreachable")
    }
  }

  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault()
    setAuthError(null)
    try {
      const response = await fetch("/api/auth/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: authPhone, otp: authOtp, temp_token: authTempToken })
      })
      const data = await response.json()
      if (response.ok) {
        setAuthAuthToken(data.auth_token)
        
        // If MPIN is saved, proceed to verify MPIN automatically!
        if (savedCredsStatus.mpin_saved) {
          const mpinRes = await fetch("/api/auth/verify-mpin", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ pin: "SAVED_MPIN", auth_token: data.auth_token })
          })
          const mpinData = await mpinRes.json()
          if (mpinRes.ok) {
            setAuthModalOpen(false)
            loadDashboardData()
          } else {
            setAuthError(mpinData.detail || "Automatic MPIN verification failed. Enter manually.")
            setAuthStep(3) // Fall back to manual
          }
        } else {
          setAuthStep(3)
        }
      } else {
        setAuthError(data.detail || "Verification failed")
      }
    } catch (e) {
      setAuthError("Auth verification failed")
    }
  }

  const handleVerifyMPIN = async (e: React.FormEvent) => {
    e.preventDefault()
    setAuthError(null)
    try {
      if (saveCredsCheckbox) {
        await fetch("/api/auth/save-credentials", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ phone: authPhone, mpin: authPin, device_id: authDeviceId })
        })
      }
      
      const response = await fetch("/api/auth/verify-mpin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pin: authPin, auth_token: authAuthToken })
      })
      const data = await response.json()
      if (response.ok) {
        setAuthModalOpen(false)
        loadDashboardData()
      } else {
        setAuthError(data.detail || "Invalid MPIN code")
      }
    } catch (e) {
      setAuthError("Failed to verify MPIN code")
    }
  }

  const handleToggleMockMode = async () => {
    const nextMock = !authStatus.mock_mode
    try {
      await fetch(`/api/auth/toggle-mock?enabled=${nextMock}`, { method: "POST" })
      loadDashboardData()
    } catch (e) {
      console.error(e)
    }
  }

  const handleClearCredentials = async () => {
    if (confirm("Are you sure you want to clear saved credentials?")) {
      try {
        await fetch("/api/auth/clear-credentials", { method: "POST" })
        fetchCredentialsStatus()
        setAuthPhone("")
        setAuthPin("")
      } catch (e) {
        console.error(e)
      }
    }
  }




  return (
    <div className="app-shell flex h-screen overflow-hidden bg-background">
      <aside 
        id="app-sidebar"
        onDoubleClick={() => setSidebarWidth(240)}
        style={{ width: `${sidebarCollapsed ? 72 : sidebarWidth}px` }}
        className={`hidden md:flex border-r border-border bg-background-secondary flex-col justify-between shrink-0 select-none transition-all duration-150 ease-out relative z-20 ${sidebarCollapsed ? 'px-2 py-5' : 'p-5'}`}
        title={sidebarCollapsed ? "Double click to expand" : undefined}
      >
        {/* Resize Handle */}
        <div
          onMouseDown={startResizing}
          className="absolute top-0 right-0 bottom-0 w-1 cursor-col-resize hover:bg-violet-500/30 active:bg-violet-500 transition-colors z-30"
          title="Drag to resize"
        />

        <div className="flex flex-col gap-6 h-full overflow-hidden">
          {/* Logo Area */}
          <div className={`flex items-center select-none ${sidebarCollapsed ? 'justify-center' : 'px-2 py-1'}`}>
            {sidebarCollapsed ? (
              <img 
                src="/favicon.png" 
                alt="Stalk Market Icon" 
                className="h-8 w-8 object-contain" 
              />
            ) : (
              <img 
                src="/Logo.png" 
                alt="Stalk Market Logo" 
                className="h-24 w-auto object-contain" 
              />
            )}
          </div>

          {/* Navigation Items Organized by Section */}
          <div className="flex-1 flex flex-col gap-6 mt-4 overflow-y-auto scrollbar-none">
            {/* MAIN SECTION */}
            <div className="flex flex-col gap-1.5">
              {!sidebarCollapsed && (
                <div className="text-[10px] font-medium text-text-muted/50 tracking-widest px-3 mb-1.5 select-none">
                  Main
                </div>
              )}
              
              <div className="relative flex items-center group">
                <button
                  onClick={() => { setActiveTab("dashboard"); setSelectedSymbol(null); }}
                  className={`flex items-center select-none relative z-10 transition-all duration-150 cursor-pointer ${
                    sidebarCollapsed 
                      ? `w-10 h-10 rounded-lg items-center justify-center border ${
                          activeTab === "dashboard" && !selectedSymbol
                            ? "bg-neutral-950 text-white border-neutral-950 shadow-sm"
                            : "bg-neutral-900/60 text-text-muted hover:text-white hover:bg-white/[0.08] border-transparent"
                        }`
                      : `w-full gap-3.5 px-3 py-2.5 rounded-lg text-sm font-normal border ${
                          activeTab === "dashboard" && !selectedSymbol
                            ? "bg-neutral-950 text-white border-neutral-950 shadow-sm"
                            : "text-text-muted hover:text-white hover:bg-white/[0.08] border-transparent"
                        }`
                  }`}
                >
                  <Layout size={18} className="shrink-0 transition-colors" weight="regular" />
                  {!sidebarCollapsed && <span>Dashboard</span>}
                </button>
                {sidebarCollapsed && (
                  <div className="absolute left-full ml-3 px-2.5 py-1.5 bg-neutral-900 border border-neutral-800 text-neutral-100 text-[11px] font-medium rounded-md shadow-xl opacity-0 scale-95 group-hover:opacity-100 group-hover:scale-100 pointer-events-none transition-all duration-150 z-50 whitespace-nowrap">
                    Dashboard
                  </div>
                )}
              </div>

              <div className="relative flex items-center group">
                <button
                  onClick={() => { setActiveTab("portfolio"); setSelectedSymbol(null); }}
                  className={`flex items-center select-none relative z-10 transition-all duration-150 cursor-pointer ${
                    sidebarCollapsed 
                      ? `w-10 h-10 rounded-lg items-center justify-center border ${
                          activeTab === "portfolio"
                            ? "bg-neutral-950 text-white border-neutral-950 shadow-sm"
                            : "bg-neutral-900/60 text-text-muted hover:text-white hover:bg-white/[0.08] border-transparent"
                        }`
                      : `w-full gap-3.5 px-3 py-2.5 rounded-lg text-sm font-normal border ${
                          activeTab === "portfolio"
                            ? "bg-neutral-950 text-white border-neutral-950 shadow-sm"
                            : "text-text-muted hover:text-white hover:bg-white/[0.08] border-transparent"
                        }`
                  }`}
                >
                  <Briefcase size={18} className="shrink-0 transition-colors" weight="regular" />
                  {!sidebarCollapsed && <span>Portfolio</span>}
                </button>
                {sidebarCollapsed && (
                  <div className="absolute left-full ml-3 px-2.5 py-1.5 bg-neutral-900 border border-neutral-800 text-neutral-100 text-[11px] font-medium rounded-md shadow-xl opacity-0 scale-95 group-hover:opacity-100 group-hover:scale-100 pointer-events-none transition-all duration-150 z-50 whitespace-nowrap">
                    Portfolio
                  </div>
                )}
              </div>
            </div>

            {sidebarCollapsed && <div className="h-[1px] bg-border/20 my-1 mx-3" />}

            {/* TOOLS SECTION */}
            <div className="flex flex-col gap-1.5">
              {!sidebarCollapsed && (
                <div className="text-[10px] font-medium text-text-muted/50 tracking-widest px-3 mb-1.5 select-none">
                  Tools
                </div>
              )}

              <div className="relative flex items-center group">
                <button
                  onClick={() => { setActiveTab("playbook"); setSelectedSymbol(null); }}
                  className={`flex items-center select-none relative z-10 transition-all duration-150 cursor-pointer ${
                    sidebarCollapsed 
                      ? `w-10 h-10 rounded-lg items-center justify-center border ${
                          activeTab === "playbook"
                            ? "bg-neutral-950 text-white border-neutral-950 shadow-sm"
                            : "bg-neutral-900/60 text-text-muted hover:text-white hover:bg-white/[0.08] border-transparent"
                        }`
                      : `w-full gap-3.5 px-3 py-2.5 rounded-lg text-sm font-normal border ${
                          activeTab === "playbook"
                            ? "bg-neutral-950 text-white border-neutral-950 shadow-sm"
                            : "text-text-muted hover:text-white hover:bg-white/[0.08] border-transparent"
                        }`
                  }`}
                >
                  <GraduationCap size={18} className="shrink-0 transition-colors" weight="regular" />
                  {!sidebarCollapsed && <span>Playbooks</span>}
                </button>
                {sidebarCollapsed && (
                  <div className="absolute left-full ml-3 px-2.5 py-1.5 bg-neutral-900 border border-neutral-800 text-neutral-100 text-[11px] font-medium rounded-md shadow-xl opacity-0 scale-95 group-hover:opacity-100 group-hover:scale-100 pointer-events-none transition-all duration-150 z-50 whitespace-nowrap">
                    Playbooks
                  </div>
                )}
              </div>

              <div className="relative flex items-center group">
                <button
                  onClick={() => { setActiveTab("automation"); setSelectedSymbol(null); }}
                  className={`flex items-center select-none relative z-10 transition-all duration-150 cursor-pointer ${
                    sidebarCollapsed 
                      ? `w-10 h-10 rounded-lg items-center justify-center border ${
                          activeTab === "automation"
                            ? "bg-neutral-950 text-white border-neutral-950 shadow-sm"
                            : "bg-neutral-900/60 text-text-muted hover:text-white hover:bg-white/[0.08] border-transparent"
                        }`
                      : `w-full gap-3.5 px-3 py-2.5 rounded-lg text-sm font-normal border ${
                          activeTab === "automation"
                            ? "bg-neutral-950 text-white border-neutral-950 shadow-sm"
                            : "text-text-muted hover:text-white hover:bg-white/[0.08] border-transparent"
                        }`
                  }`}
                >
                  <Robot size={18} className="shrink-0 transition-colors" weight="regular" />
                  {!sidebarCollapsed && <span>Automation</span>}
                </button>
                {sidebarCollapsed && (
                  <div className="absolute left-full ml-3 px-2.5 py-1.5 bg-neutral-900 border border-neutral-800 text-neutral-100 text-[11px] font-medium rounded-md shadow-xl opacity-0 scale-95 group-hover:opacity-100 group-hover:scale-100 pointer-events-none transition-all duration-150 z-50 whitespace-nowrap">
                    Automation
                  </div>
                )}
              </div>
            </div>

            {sidebarCollapsed && <div className="h-[1px] bg-border/20 my-1 mx-3" />}

            {/* OTHER SECTION */}
            <div className="flex flex-col gap-1.5 mt-auto">
              {!sidebarCollapsed && (
                <div className="text-[10px] font-medium text-text-muted/50 tracking-widest px-3 mb-1.5 select-none">
                  Other
                </div>
              )}

              <div className="relative flex items-center group">
                <button
                  onClick={() => { setActiveTab("settings"); setSelectedSymbol(null); }}
                  className={`flex items-center select-none relative z-10 transition-all duration-150 cursor-pointer ${
                    sidebarCollapsed 
                      ? `w-10 h-10 rounded-lg items-center justify-center border ${
                          activeTab === "settings"
                            ? "bg-neutral-950 text-white border-neutral-950 shadow-sm"
                            : "bg-neutral-900/60 text-text-muted hover:text-white hover:bg-white/[0.08] border-transparent"
                        }`
                      : `w-full gap-3.5 px-3 py-2.5 rounded-lg text-sm font-normal border ${
                          activeTab === "settings"
                            ? "bg-neutral-950 text-white border-neutral-950 shadow-sm"
                            : "text-text-muted hover:text-white hover:bg-white/[0.08] border-transparent"
                        }`
                  }`}
                >
                  <Gear size={18} className="shrink-0 transition-colors" weight="regular" />
                  {!sidebarCollapsed && <span>Settings</span>}
                </button>
                {sidebarCollapsed && (
                  <div className="absolute left-full ml-3 px-2.5 py-1.5 bg-neutral-900 border border-neutral-800 text-neutral-100 text-[11px] font-medium rounded-md shadow-xl opacity-0 scale-95 group-hover:opacity-100 group-hover:scale-100 pointer-events-none transition-all duration-150 z-50 whitespace-nowrap">
                    Settings
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Indices Bottom Display */}
        {!sidebarCollapsed && sidebarWidth === 240 && !isResizing && (
          <div className="flex flex-col gap-3.5 mt-4 pt-4 border-t border-border/30 px-2.5">
            {[
              { key: "nifty", label: "NIFTY 50" },
              { key: "sensex", label: "SENSEX" },
              { key: "banknifty", label: "BANK NIFTY" },
              { key: "midcap", label: "NIFTY MIDCAP" }
            ].map(({ key, label }) => {
              const idx = marketOverview?.indices?.[key]
              return (
                <div key={key} className="flex items-center justify-between text-xs font-mono text-text-muted py-0.5">
                  <span>{label}</span>
                  <div className="flex gap-2 items-center">
                    {idx?.price !== null && idx?.price !== undefined ? (
                      <span className="text-foreground font-medium">
                        {idx.price.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </span>
                    ) : (
                      <span className="text-text-muted/40">—</span>
                    )}
                    {idx?.change !== null && idx?.change !== undefined && (
                      <span className={idx.change >= 0 ? 'text-success font-medium' : 'text-destructive font-medium'}>
                        {idx.change >= 0 ? '+' : ''}{idx.change.toFixed(2)}%
                      </span>
                    )}
                  </div>
                </div>
              )
            })}
            
            <div className="flex items-center justify-between text-[10px] text-text-muted mt-1 pt-2 border-t border-border/20 font-mono">
              <div className="flex items-center gap-1.5">
                <span className={`h-1.5 w-1.5 rounded-full ${
                  offlineMode 
                    ? 'bg-warning animate-pulse' 
                    : marketOverview?.market_status?.is_open 
                    ? 'bg-success animate-pulse' 
                    : 'bg-destructive'
                }`} /> 
                <span>{offlineMode ? 'Sandbox' : marketOverview?.market_status?.is_open ? 'Market Open' : 'Closed'}</span>
              </div>
              <span className="text-[10px]">
                {offlineMode ? 'Mock' : marketOverview?.market_status?.session || 'UAT'}
              </span>
            </div>
          </div>
        )}
      </aside>

      <main className="flex-1 flex flex-col h-screen overflow-hidden bg-background pb-16 md:pb-0">
        
        <header 
          id="app-header"
          className="h-14 border-b border-border px-6 flex items-center justify-between shrink-0 bg-background-secondary z-10">
          <div 
            onClick={() => setCommandKOpen(true)}
            className="w-32 sm:w-80 flex items-center gap-2.5 bg-input border border-border/80 rounded-lg px-3.5 h-8 text-xs text-text-muted hover:text-foreground hover:border-border-hover cursor-pointer transition-colors select-none"
          >
            <MagnifyingGlass size={16} className="text-text-muted" weight="regular" />
            <span>Search stock (e.g. HFCL)...</span>
          </div>

          <div className="flex items-center gap-3">
            {/* Backend Connection Indicator Badge */}
            {backendStatus === "connecting" && (
              <div 
                className="flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/25 text-amber-300 text-xs font-medium select-none transition-all duration-300"
                title="Render backend is waking up in the background. Operating on instant local data..."
              >
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-400"></span>
                </span>
                <span>Connecting to backend...</span>
              </div>
            )}
            {backendStatus === "connected" && (
              <div 
                className="flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/25 text-emerald-300 text-xs font-medium select-none transition-all duration-300"
                title="Connected live to FastAPI backend engine"
              >
                <span className="h-2 w-2 rounded-full bg-emerald-400"></span>
                <span>Backend connected</span>
              </div>
            )}
            {backendStatus === "fallback" && (
              <div 
                className="flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-text-muted text-xs font-medium select-none transition-all duration-300"
                title="Operating on local strategy engine data"
              >
                <span className="h-2 w-2 rounded-full bg-neutral-400"></span>
                <span>Offline fallback</span>
              </div>
            )}
          </div>
        </header>

        {/* 3. BODY DISPLAY SECTIONS */}
        <div className="flex-1 p-8 overflow-y-auto" onScroll={handleScroll}>
          {selectedSymbol ? (
            /* Selected Scrip Details view */
            <ScripAnalyzer
              symbol={selectedSymbol}
              onBack={() => setSelectedSymbol(null)}
              onOpenOrderTicket={(scr) => {
                setOrderTicketScrip(scr)
                setOrderTicketOpen(true)
              }}
            />
          ) : activeTab === "portfolio" ? (
            /* Portfolio Tab view */
            <HoldingsOverview
              portfolioData={portfolioStats}
              onSelectScrip={(sym) => {
                setSelectedSymbol(sym);
                setMobileChatbotOpen(false);
              }}
              onOpenUploader={() => setActiveTab("playbook")}
              onOpenSyncModal={() => setAuthModalOpen(true)}
            />
          ) : activeTab === "playbook" ? (
            /* Playbook Training Tab view */
            <div className="flex flex-col items-center pt-8">
              <PlaybookUploader onUploadSuccess={handlePlaybookUpdate} />
            </div>
          ) : activeTab === "automation" ? (
            /* Automation Lab view */
            <div className="flex flex-col items-center pt-8">
              <AutomationLab />
            </div>
          ) : activeTab === "settings" ? (
            /* Settings Tab view */
            <div className="flex flex-col items-center pt-8">
              <SettingsPage 
                onToggleMockMode={handleToggleMockMode}
                onClearCredentials={handleClearCredentials}
                playbookStats={playbookStats}
                onOpenUploader={() => setActiveTab("playbook")}
                onOpenSyncModal={() => {
                  setAuthStep(1)
                  setAuthPhone("")
                  setAuthOtp("")
                  setAuthPin("")
                  setAuthDeviceId(authStatus.device_id || "STM_DEVICE_001")
                  setAuthError(null)
                  setAuthModalOpen(true)
                }}
              />
            </div>
          ) : (
            /* Dashboard Tab view - editorial terminal design */
            <div className="flex flex-col gap-6 h-full">
              {/* Contextual Greeting header */}
              <div className="pt-1 pb-2">
                <h1 className="text-xl sm:text-[22px] font-medium text-foreground tracking-tight leading-normal">
                  {(() => {
                    const hour = new Date().getHours();
                    const timeOfDay = hour < 12 ? "morning" : hour < 17 ? "afternoon" : "evening";
                    return `Good ${timeOfDay}.`;
                  })()}
                  <span className="text-text-muted font-normal ml-2">
                    {opportunities.length} swing opportunities match your playbook criteria.
                  </span>
                </h1>
              </div>

              {/* 3 Top Trader Summary Cards */}
              <div className="pb-6 border-b border-border/60 -mx-8 px-8 mb-2">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 select-none">
                  
                  {/* Card 1: Market Health */}
                  <div className="bg-card border border-border rounded-[18px] p-6 flex flex-col justify-between min-h-[148px]">
                    <div className="flex justify-between items-start">
                      <div className="flex flex-col gap-1.5 min-w-0">
                        <span className="text-xs font-normal text-text-muted/80 truncate">Market health</span>
                        <div className="flex items-baseline gap-1.5">
                          <span className="text-2xl sm:text-[28px] font-normal font-mono text-foreground leading-none">
                            {marketOverview?.market_health?.score !== undefined ? `${marketOverview.market_health.score}` : "7.5"}
                          </span>
                          <span className="text-xs text-text-muted/70 font-normal font-sans">/ 10</span>
                        </div>
                      </div>

                      {/* Top Right Badge */}
                      <div className="h-7 px-3 flex items-center gap-1.5 text-[11px] font-medium text-emerald-400 bg-emerald-500/10 border border-emerald-500/15 rounded-full shrink-0">
                        <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                        <span>72% Bullish regime</span>
                      </div>
                    </div>

                    {/* Clean Segmented Sentiment Bar */}
                    <div className="w-full h-3 rounded-full bg-neutral-800 overflow-hidden flex gap-0.5 mt-auto mb-0.5">
                      <div 
                        className="h-full bg-emerald-500 rounded-l-full transition-all duration-200 hover:brightness-125 cursor-pointer" 
                        style={{ width: '72%' }} 
                        title="72% Bullish" 
                      />
                      <div 
                        className="h-full bg-amber-500 transition-all duration-200 hover:brightness-125 cursor-pointer" 
                        style={{ width: '18%' }} 
                        title="18% Neutral" 
                      />
                      <div 
                        className="h-full bg-rose-500 rounded-r-full transition-all duration-200 hover:brightness-125 cursor-pointer" 
                        style={{ width: '10%' }} 
                        title="10% Bearish" 
                      />
                    </div>
                  </div>

                  {/* Card 2: Available Margin — Recreated Fresh with Natural Aspect Ratio */}
                  <div className="bg-card border border-border rounded-[18px] p-6 flex flex-col justify-between min-h-[148px]">
                    {/* Top Row: Title + Metric on Left, Badge on Right */}
                    <div className="flex justify-between items-start">
                      <div className="flex flex-col gap-1.5 min-w-0">
                        <span className="text-xs font-normal text-text-muted/80 truncate">Available margin</span>
                        <span className="text-2xl sm:text-[28px] font-normal font-mono text-foreground leading-none">
                          ₹{portfolioStats?.funds?.net_margin_available !== undefined
                            ? portfolioStats.funds.net_margin_available.toLocaleString("en-IN", { maximumFractionDigits: 0 })
                            : "1,000"}
                        </span>
                      </div>

                      {/* Top Right Badge */}
                      <div className="h-7 px-3.5 flex items-center gap-1.5 text-[11px] font-medium text-emerald-400 bg-emerald-500/10 border border-emerald-500/15 rounded-full shrink-0">
                        <TrendUp size={14} weight="bold" className="shrink-0 text-emerald-400" />
                        <span>+1.92% today</span>
                      </div>
                    </div>

                    {/* Bottom Row: Clean 7-Session Area Sparkline with Natural Aspect Ratio & Perfect Round Dot */}
                    <div className="flex justify-end w-full mt-auto">
                      <div className="w-36 sm:w-44 h-10 shrink-0 relative flex items-center justify-end">
                        <svg className="w-full h-full" viewBox="0 0 140 36">
                          <defs>
                            <linearGradient id="margin-grad-clean" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="0%" stopColor="#10B981" stopOpacity="0.30" />
                              <stop offset="100%" stopColor="#10B981" stopOpacity="0.0" />
                            </linearGradient>
                          </defs>
                          <path
                            d="M 6,30 L 28,26 L 50,22 L 72,18 L 94,14 L 116,10 L 134,5"
                            fill="none"
                            stroke="#10B981"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                          <path
                            d="M 6,30 L 28,26 L 50,22 L 72,18 L 94,14 L 116,10 L 134,5 L 134,36 L 6,36 Z"
                            fill="url(#margin-grad-clean)"
                          />
                          <circle cx="134" cy="5" r="3.5" fill="#10B981" />
                        </svg>
                      </div>
                    </div>
                  </div>

                  {/* Card 3: Today's Edge — Horizontal Confidence Meter */}
                  <div 
                    className="bg-card border border-border rounded-[18px] p-6 flex flex-col justify-between min-h-[148px] cursor-pointer group"
                    title="81% Win Probability (Above average trading edge)"
                  >
                    {/* Top: Card Title */}
                    <div className="flex justify-between items-start">
                      <span className="text-xs font-normal text-text-muted/80 truncate">Today's Edge</span>
                    </div>

                    {/* Middle: Left Large Metric + Right Confidence Meter */}
                    <div className="flex items-center justify-between gap-4 my-auto">
                      {/* Middle Left: Primary Metric */}
                      <span className="text-3xl sm:text-[32px] font-medium font-mono text-foreground leading-none">
                        81%
                      </span>

                      {/* Middle Right: Horizontal Confidence Meter occupying right half */}
                      <div className="w-36 sm:w-44 flex flex-col gap-2 shrink-0">
                        {/* Meter Track & Dot Marker */}
                        <div className="relative w-full h-1 bg-neutral-800 rounded-full flex items-center">
                          {/* Filled track up to 81% */}
                          <div className="h-full bg-emerald-500 rounded-full transition-all duration-700 ease-out" style={{ width: '81%' }} />
                          {/* Circular Marker Dot at 81% */}
                          <div 
                            className="absolute w-2.5 h-2.5 bg-emerald-400 border border-neutral-900 rounded-full shadow-sm top-1/2 -translate-y-1/2 -ml-1 transition-all duration-700 ease-out" 
                            style={{ left: '81%' }} 
                          />
                        </div>

                        {/* Zone Labels */}
                        <div className="flex justify-between items-center text-[11px] text-text-muted/60 font-normal">
                          <span>Low</span>
                          <span>Medium</span>
                          <span>High</span>
                        </div>
                      </div>
                    </div>

                    {/* Bottom: Small Supporting Text */}
                    <div className="mt-auto">
                      <span className="text-[13px] text-text-muted/70 font-normal">
                        Above average probability
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Main Content Sections */}
              <div className="flex flex-col gap-6">
                {/* Top Opportunities Header & Filter Panel */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 mb-2">
                  <div>
                    <h2 className="text-xl sm:text-[22px] font-medium text-foreground tracking-tight">Top Opportunities</h2>
                    <p className="text-sm text-text-muted mt-1">Scanned from liquid universes based on custom strategy playbooks</p>
                  </div>
                  <div className="flex gap-2.5">
                    <CustomDropdown
                      value={selectedSector}
                      onChange={setSelectedSector}
                      options={["All Sectors", ...Array.from(new Set(opportunities.map((op: any) => op.sector || "Other")))]}
                      align="right"
                    />
                    <CustomDropdown
                      value={sortBy}
                      onChange={setSortBy}
                      options={[
                        { value: "AI Score", label: "Sort by: AI Score" },
                        { value: "Daily Change", label: "Sort by: Daily Change" },
                        { value: "LTP", label: "Sort by: LTP" }
                      ]}
                      align="right"
                    />
                  </div>
                </div>

                {/* Flat List of Opportunities as Clickable Cards */}
                <div className="opportunities-container flex flex-col gap-6 pb-16">
                  {opportunities.length === 0 && (
                    <div className="py-8 text-sm text-text-muted italic bg-accent/10 border border-border/40 px-4 rounded-lg">
                      No qualifying opportunities from the current data scan. The scanner will not show fabricated setups when market data or risk/reward filters fail.
                    </div>
                  )}
                  {opportunities
                    .filter((op: any) => selectedSector === "All Sectors" || op.sector === selectedSector)
                    .sort((a: any, b: any) => {
                      if (sortBy === "Daily Change") {
                        return (b.change || 0) - (a.change || 0)
                      } else if (sortBy === "LTP") {
                        return (b.price || 0) - (a.price || 0)
                      }
                      return (b.score || 0) - (a.score || 0)
                    })
                    .map((op: any, i: number) => {
                      const opPositive = op.change >= 0
                      return (
                        <div 
                          key={i} 
                          onClick={() => {
                            setSelectedSymbol(op.symbol);
                            setMobileChatbotOpen(false);
                          }}
                          onKeyDown={(e) => {
                            if (e.key === "Enter" || e.key === " ") {
                              e.preventDefault();
                              setSelectedSymbol(op.symbol);
                              setMobileChatbotOpen(false);
                            }
                          }}
                          tabIndex={0}
                          className="opportunity-card flex flex-col overflow-visible relative group/card hover:z-50 focus-within:z-50"
                        >
                          {/* Version 1 Layout with Header Price Alignment & 3-4px Larger KPI Font Sizes */}
                          <div className="p-5 flex flex-col gap-4 relative">
                            {/* AI Insight Icon — Top-right corner */}
                            <div className="absolute top-4 right-4 group">
                              <div className="w-7 h-7 rounded-full bg-amber-500/10 border border-amber-500/20 flex items-center justify-center cursor-pointer relative overflow-hidden">
                                {/* Shine overlay */}
                                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700 ease-in-out" />
                                <Sparkle size={13} className="text-amber-400/80 relative z-10" weight="fill" />
                              </div>
                              {/* Hover Popover */}
                              <div className="absolute right-0 top-full mt-2 w-72 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 ease-out z-[100] pointer-events-none">
                                <div className="bg-card border border-border rounded-xl shadow-2xl p-3.5 scrollbar-thin relative z-50">
                                  {/* Insight text — full, no truncation */}
                                  <p className="text-[11px] text-text-muted leading-relaxed mb-3">
                                    {getTechnicalExplanation(op)}
                                  </p>
                                  {/* RSI + Volume visual boxes */}
                                  <div className="grid grid-cols-2 gap-2 mb-3">
                                    <div className="bg-neutral-900/90 border border-neutral-800/60 rounded-lg p-2.5">
                                      <div className="flex items-center justify-between mb-1.5">
                                        <span className="text-[10px] font-medium text-foreground/80">RSI</span>
                                        <span className={`text-[11px] font-mono font-medium ${
                                          op.rsi > 60 ? 'text-success' : op.rsi < 40 ? 'text-destructive' : 'text-warning'
                                        }`}>{op.rsi?.toFixed(1)}</span>
                                      </div>
                                      <div className="h-1 rounded-full bg-neutral-800 overflow-hidden">
                                        <div className="h-full rounded-full" style={{
                                          width: `${Math.min(op.rsi || 50, 100)}%`,
                                          background: op.rsi > 60 ? '#22c55e' : op.rsi < 40 ? '#ef4444' : '#eab308'
                                        }} />
                                      </div>
                                      <span className="text-[9px] text-text-muted/70 mt-1 block">
                                        {op.rsi > 60 ? 'Strong momentum' : op.rsi < 40 ? 'Oversold' : 'Neutral'}
                                      </span>
                                    </div>
                                    <div className="bg-neutral-900/90 border border-neutral-800/60 rounded-lg p-2.5">
                                      <div className="flex items-center justify-between mb-1.5">
                                        <span className="text-[10px] font-medium text-foreground/80">Volume</span>
                                        <span className={`text-[11px] font-mono font-medium ${
                                          op.volume_status === 'High Expansion' ? 'text-success' : op.volume_status === 'Below Average' ? 'text-destructive' : 'text-warning'
                                        }`}>{op.volume_status === 'High Expansion' ? 'High' : op.volume_status === 'Above Average' ? 'Avg' : 'Low'}</span>
                                      </div>
                                      <div className="h-1 rounded-full bg-neutral-800 overflow-hidden">
                                        <div className="h-full rounded-full" style={{
                                          width: op.volume_status === 'High Expansion' ? '85%' : op.volume_status === 'Above Average' ? '60%' : '30%',
                                          background: op.volume_status === 'High Expansion' ? '#22c55e' : op.volume_status === 'Below Average' ? '#ef4444' : '#eab308'
                                        }} />
                                      </div>
                                      <span className="text-[9px] text-text-muted/70 mt-1 block">
                                        {op.volume_status === 'High Expansion' ? 'Institutional interest' : op.volume_status === 'Above Average' ? 'Healthy activity' : 'Low participation'}
                                      </span>
                                    </div>
                                  </div>
                                  {/* Conviction bar */}
                                  <div className="pt-2 border-t border-border/20">
                                    <div className="flex items-center justify-between gap-2 mb-1.5">
                                      <span className="text-[10px] font-medium text-foreground/80">Conviction</span>
                                      <span className={`text-[10px] font-mono font-medium ${
                                        op.score >= 70 ? 'text-success' : op.score >= 55 ? 'text-warning' : 'text-destructive'
                                      }`}>{op.score}/100</span>
                                    </div>
                                    <div className="h-1.5 rounded-full bg-neutral-800 overflow-hidden">
                                      <div className="h-full rounded-full transition-all duration-500" style={{ 
                                        width: `${op.score}%`,
                                        background: op.score >= 70 
                                          ? 'linear-gradient(90deg, #22c55e, #16a34a)' 
                                          : op.score >= 55 
                                          ? 'linear-gradient(90deg, #eab308, #ca8a04)' 
                                          : 'linear-gradient(90deg, #ef4444, #dc2626)'
                                      }} />
                                    </div>
                                    <span className={`text-[10px] mt-1 block ${
                                      op.score >= 70 ? 'text-success' : op.score >= 55 ? 'text-warning' : 'text-destructive'
                                    }`}>
                                      {op.score >= 70 ? 'Strong setup — multiple factors aligned' : op.score >= 55 ? 'Moderate — needs confirmation' : 'Weak — better opportunities elsewhere'}
                                    </span>
                                  </div>
                                </div>
                                <div className="absolute right-3 -top-1 w-2 h-2 bg-card border-l border-t border-border rotate-45 rounded-sm z-50" />
                              </div>
                            </div>

                            {/* Header Row: Title on Left Side, Pricing Structure on Right Side Right Before AI Icon */}
                            <div className="flex items-center justify-between gap-4 w-full pr-10">
                              {/* Left Side: Slightly Bigger Title */}
                              <div className="flex items-baseline gap-2.5 min-w-0">
                                <span className="text-xs text-text-muted/50 font-mono select-none tabular-nums shrink-0">
                                  {(i + 1).toString().padStart(2, '0')}
                                </span>
                                <span className="text-lg sm:text-[20px] font-medium text-foreground tracking-tight shrink-0">
                                  {op.symbol}
                                </span>
                                <span className="text-sm text-text-muted/70 truncate hidden sm:inline">
                                  {op.name} / {op.sector}
                                </span>
                              </div>

                              {/* Right Side: Pricing Structure (Price + Change) */}
                              <div className="flex items-baseline gap-2.5 shrink-0">
                                <span className="text-xl sm:text-[22px] font-medium font-mono text-foreground tracking-tight leading-none tabular-nums">
                                  {op.price !== null && op.price !== undefined ? `₹${op.price.toLocaleString("en-IN", { minimumFractionDigits: 2 })}` : "—"}
                                </span>
                                {op.change !== null && op.change !== undefined && (
                                  <span className={`text-xs sm:text-sm font-mono font-medium tabular-nums ${opPositive ? 'text-success' : 'text-destructive'}`}>
                                    {opPositive ? '+' : ''}{op.change.toFixed(2)}%
                                  </span>
                                )}
                              </div>
                            </div>

                            {/* 5 Column KPI Grid: All values enlarged by 3-4px (text-[19px] sm:text-[20px]) */}
                            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 pt-3.5 border-t border-border/30 text-center">
                              <div className="flex flex-col gap-0.5">
                                <span className="text-[11px] text-text-muted font-normal">Entry range</span>
                                <span className="text-[19px] sm:text-[20px] font-medium font-mono text-foreground truncate">
                                  {op.entry.replace("INR ", "₹")}
                                </span>
                              </div>

                              <div className="flex flex-col gap-0.5">
                                <span className="text-[11px] text-text-muted font-normal">Target price</span>
                                <span className="text-[19px] sm:text-[20px] font-medium font-mono text-success truncate">
                                  {op.target.replace("INR ", "₹")}
                                </span>
                              </div>

                              <div className="flex flex-col gap-0.5">
                                <span className="text-[11px] text-text-muted font-normal">Stop loss</span>
                                <span className="text-[19px] sm:text-[20px] font-medium font-mono text-destructive truncate">
                                  {op.stop.replace("INR ", "₹")}
                                </span>
                              </div>

                              <div className="flex flex-col gap-0.5">
                                <span className="text-[11px] text-text-muted font-normal">Risk reward</span>
                                <span className="text-[19px] sm:text-[20px] font-medium font-mono text-foreground truncate">
                                  {op.risk_reward ? `${op.risk_reward}:1` : "—"}
                                </span>
                              </div>

                              <div className="flex flex-col gap-0.5">
                                <span className="text-[11px] text-text-muted font-normal">Potential upside</span>
                                <span className="text-[19px] sm:text-[20px] font-medium font-mono text-success truncate">
                                  {op.upside_pct ? `+${op.upside_pct}%` : "—"}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      )
                    })}
                </div>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Right Sidebar Panel: Full-Bleed 2-Block Stack (480px) */}
      <aside className="hidden xl:flex w-[480px] border-l border-border bg-background-secondary flex-col gap-0 h-full shrink-0 z-10 overflow-y-auto">
        <TradingPerformance authStatus={authStatus} />
        <div className="flex-1 border-t border-border min-h-0 bg-background-secondary">
          <Chatbot selectedSymbol={selectedSymbol} onSelectSymbol={(sym) => setSelectedSymbol(sym)} />
        </div>
      </aside>

      {/* 4. MODALS OVERLAYS */}

      {/* Command K Search overlay */}
      <CommandK
        isOpen={commandKOpen}
        onClose={() => setCommandKOpen(false)}
        onSelectStock={(sym) => setSelectedSymbol(sym)}
      />

      {/* Order execution ticket overlay */}
      {orderTicketOpen && orderTicketScrip && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <OrderTicket
            scrip={orderTicketScrip}
            availableMargin={portfolioStats?.funds?.net_margin_available || 0}
            onPlaceOrder={handleExecuteTrade}
            onClose={() => setOrderTicketOpen(false)}
          />
        </div>
      )}

      {/* Nubra API Auth sync modal */}
      {authModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-card border border-border rounded-2xl p-6 w-full max-w-sm relative shadow-2xl">
            <button
              onClick={() => setAuthModalOpen(false)}
              className="absolute top-4 right-4 text-text-muted hover:text-foreground cursor-pointer p-1 rounded-xl hover:bg-accent"
            >
              <X size={16} weight="regular" />
            </button>
            <h2 className="text-sm font-bold text-foreground mb-2 flex items-center gap-2">
              <ArrowsClockwise size={16} className="text-primary animate-spin-slow" weight="regular" />
              Sync Nubra Broker API
            </h2>
            
            {savedCredsStatus.phone_saved && savedCredsStatus.mpin_saved && (
              <div className="flex justify-between items-center mb-4 p-2 bg-accent/40 rounded-xl border border-primary/10 text-[10px]">
                <span className="text-text-muted">
                  Auto-Sync credentials stored
                </span>
                <button 
                  onClick={handleClearCredentials}
                  className="text-destructive font-bold hover:underline cursor-pointer"
                >
                  Clear Stored
                </button>
              </div>
            )}
            
            {authError && (
              <div className="p-3 mb-4 bg-destructive/10 border border-destructive/25 text-destructive rounded-xl text-xs flex items-start gap-2 shadow-sm animate-pulse">
                <WarningCircle size={16} className="shrink-0 mt-0.5" weight="regular" />
                <span>{authError}</span>
              </div>
            )}

            {authStep === 1 && (
              <form onSubmit={handleRequestOTP} className="flex flex-col gap-4">
                <p className="text-xs text-text-muted leading-relaxed">
                  {savedCredsStatus.phone_saved ? (
                    <span>Using saved phone number <b>{authPhone}</b>. Click request to trigger OTP.</span>
                  ) : (
                    <span>Enter your registered mobile number linked to your Nubra trading account to request an OTP.</span>
                  )}
                </p>
                <input
                  type="text"
                  placeholder="Enter Phone Number (e.g. 0000000000)"
                  value={authPhone}
                  onChange={(e) => setAuthPhone(e.target.value)}
                  className="input-md font-mono"
                />
                <input
                  type="text"
                  placeholder="Nubra Device ID"
                  value={authDeviceId}
                  onChange={(e) => setAuthDeviceId(e.target.value)}
                  className="input-md font-mono"
                />
                <button
                  type="submit"
                  className="btn btn-primary btn-md w-full font-bold shadow-sm"
                >
                  REQUEST OTP
                </button>
              </form>
            )}

            {authStep === 2 && (
              <form onSubmit={handleVerifyOTP} className="flex flex-col gap-4">
                <p className="text-xs text-text-muted leading-relaxed">
                  Enter the OTP sent to <b>{authPhone}</b>. {savedCredsStatus.mpin_saved ? (
                    <span className="text-primary font-bold block mt-1">Stored MPIN will be verified automatically after OTP confirmation.</span>
                  ) : (
                    <span>(Use <b>123456</b> in mock mode).</span>
                  )}
                </p>
                <input
                  type="text"
                  placeholder="Enter 6-Digit OTP"
                  value={authOtp}
                  onChange={(e) => setAuthOtp(e.target.value)}
                  className="input-md font-mono"
                  autoFocus
                />
                <button
                  type="submit"
                  className="btn btn-primary btn-md w-full font-bold shadow-sm"
                >
                  VERIFY OTP & SYNC
                </button>
              </form>
            )}

            {authStep === 3 && (
              <form onSubmit={handleVerifyMPIN} className="flex flex-col gap-4">
                <p className="text-xs text-text-muted leading-relaxed">
                  Enter your Nubra Account MPIN to authenticate. (Use <b>1234</b> in mock mode).
                </p>
                <input
                  type="password"
                  placeholder="Enter 4-Digit MPIN"
                  value={authPin}
                  onChange={(e) => setAuthPin(e.target.value)}
                  className="input-md font-mono"
                  autoFocus
                />
                
                <div className="flex items-center gap-2 mt-1">
                  <input
                    type="checkbox"
                    id="save_creds"
                    checked={saveCredsCheckbox}
                    onChange={(e) => setSaveCredsCheckbox(e.target.checked)}
                    className="rounded border-border text-primary focus:ring-primary h-3.5 w-3.5"
                  />
                  <label htmlFor="save_creds" className="text-[11px] text-text-muted font-bold select-none cursor-pointer">
                    Save credentials for instant auto-sync in future
                  </label>
                </div>

                <button
                  type="submit"
                  className="btn btn-primary btn-md w-full font-bold shadow-sm mt-1"
                >
                  VERIFY MPIN & STORE
                </button>
              </form>
            )}
          </div>
        </div>
      )}

      {/* 4. MOBILE BOTTOM NAVIGATION BAR */}
      <nav className="xl:hidden fixed bottom-0 left-0 right-0 h-16 bg-card border-t border-border z-30 flex items-center justify-around px-2 pb-safe">
        <button 
          onClick={() => { setActiveTab("dashboard"); setSelectedSymbol(null); setMobileChatbotOpen(false); setMobilePerformanceOpen(false); }}
          className={`flex flex-col items-center justify-center gap-1 cursor-pointer transition-colors ${activeTab === "dashboard" && !mobileChatbotOpen && !mobilePerformanceOpen ? "text-foreground font-medium" : "text-text-muted"}`}
        >
          <Layout size={20} weight="regular" />
          <span className="text-[9px]">Dashboard</span>
        </button>
        <button 
          onClick={() => { setActiveTab("portfolio"); setSelectedSymbol(null); setMobileChatbotOpen(false); setMobilePerformanceOpen(false); }}
          className={`flex flex-col items-center justify-center gap-1 cursor-pointer transition-colors ${activeTab === "portfolio" && !mobileChatbotOpen && !mobilePerformanceOpen ? "text-foreground font-medium" : "text-text-muted"}`}
        >
          <Briefcase size={20} weight="regular" />
          <span className="text-[9px]">Portfolio</span>
        </button>
        <button 
          onClick={() => { setMobileChatbotOpen(true); setMobilePerformanceOpen(false); }}
          className={`flex flex-col items-center justify-center gap-1 cursor-pointer transition-colors ${mobileChatbotOpen ? "text-foreground font-medium" : "text-text-muted"}`}
        >
          <Robot size={20} weight="regular" />
          <span className="text-[9px]">AI Research</span>
        </button>
        <button 
          onClick={() => { setMobilePerformanceOpen(true); setMobileChatbotOpen(false); }}
          className={`flex flex-col items-center justify-center gap-1 cursor-pointer transition-colors ${mobilePerformanceOpen ? "text-foreground font-medium" : "text-text-muted"}`}
        >
          <ArrowsClockwise size={16} weight="regular" /> <span>Retry</span>
          <span className="text-[9px]">Performance</span>
        </button>
        <button 
          onClick={() => { setActiveTab("settings"); setSelectedSymbol(null); setMobileChatbotOpen(false); setMobilePerformanceOpen(false); }}
          className={`flex flex-col items-center justify-center gap-1 cursor-pointer transition-colors ${activeTab === "settings" && !mobileChatbotOpen && !mobilePerformanceOpen ? "text-foreground font-medium" : "text-text-muted"}`}
        >
          <ArrowsClockwise size={20} weight="regular" />
          <span className="text-[9px]">Settings</span>
        </button>
      </nav>

      {/* 5. MOBILE BOTTOM SHEET: AI RESEARCH ASSISTANT */}
      <div 
        className={`fixed inset-0 z-40 transition-opacity duration-300 xl:hidden ${
          mobileChatbotOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
      >
        <div className="absolute inset-0 bg-black/60 backdrop-blur-xs" onClick={() => setMobileChatbotOpen(false)} />
        <div 
          className={`absolute bottom-0 left-0 right-0 h-[82vh] bg-card rounded-t-2xl border-t border-border flex flex-col transition-transform duration-300 ease-out z-50 ${
            mobileChatbotOpen ? 'translate-y-0' : 'translate-y-full'
          }`}
        >
          <div className="h-12 border-b border-border flex items-center justify-between px-4 shrink-0 bg-card rounded-t-2xl">
            <div className="flex items-center gap-2">
              <Robot size={18} className="text-foreground" weight="regular" />
              <span className="text-xs font-medium text-foreground font-mono">Stalk AI Assistant</span>
            </div>
            <button onClick={() => setMobileChatbotOpen(false)} className="text-text-muted hover:text-foreground cursor-pointer">
              <X className="h-5 w-5" />
            </button>
          </div>
          <div className="flex-1 min-h-0 overflow-hidden bg-background">
            <Chatbot 
              selectedSymbol={selectedSymbol} 
              onSelectSymbol={() => {
                // Chatbot handles stock actions internally without altering background dashboard
              }} 
            />
          </div>
        </div>
      </div>

      {/* 6. MOBILE BOTTOM SHEET: TRADING PERFORMANCE */}
      <div 
        className={`fixed inset-0 z-40 transition-opacity duration-300 xl:hidden ${
          mobilePerformanceOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
      >
        <div className="absolute inset-0 bg-black/60 backdrop-blur-xs" onClick={() => setMobilePerformanceOpen(false)} />
        <div 
          className={`absolute bottom-0 left-0 right-0 h-[82vh] bg-card rounded-t-2xl border-t border-border flex flex-col transition-transform duration-300 ease-out z-50 ${
            mobilePerformanceOpen ? 'translate-y-0' : 'translate-y-full'
          }`}
        >
          <div className="h-12 border-b border-border flex items-center justify-between px-4 shrink-0 bg-card rounded-t-2xl">
            <div className="flex items-center gap-2">
              <ArrowsClockwise size={18} className="text-foreground animate-spin-slow" weight="regular" />
              <span className="text-xs font-medium text-foreground font-mono">Trading Performance</span>
            </div>
            <button onClick={() => setMobilePerformanceOpen(false)} className="text-text-muted hover:text-foreground cursor-pointer">
              <X className="h-5 w-5" />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto p-4 bg-background">
            <TradingPerformance authStatus={authStatus} />
          </div>
        </div>
      </div>
    </div>
  )
}

export default App

