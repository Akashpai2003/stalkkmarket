// Seeded pseudo-random number generator
function createPRNG(seed: number) {
  let s = seed;
  return () => {
    s = (s * 1664525 + 1013904223) & 0xffffffff;
    return (s >>> 0) / 0xffffffff;
  };
}

function hashSymbol(symbol: string): number {
  let hash = 0;
  for (let i = 0; i < symbol.length; i++) {
    hash = ((hash << 5) - hash) + symbol.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash) || 42;
}

export interface ChartDataPoint {
  date: string;
  price: number;
  rsi: number;
  volume: number;
  sma20?: number;
  sma50?: number;
}

export interface StockMetrics {
  price: number;
  change: number;
  changePercent: number;
  rsi: number;
  score: number;
  trend: string;
  volumeStatus: string;
  smaAlignment: string;
  entry?: string;
  target?: string;
  stop?: string;
  riskReward?: string;
}

export interface StockAnalysis {
  symbol: string;
  name: string;
  sector: string;
  currentPrice: number;
  change: number;
  changePercent: number;
  rsi: number;
  score: number;
  metrics: StockMetrics;
  chartData: ChartDataPoint[];
  metricBreakdown: { label: string; value: number; max: number; desc: string; color?: string }[];
  analysis: string;
  recommendation: string;
  followUps: string[];
  openuiCode: string;
}

// Stock metadata
const STOCK_META: Record<string, { name: string; sector: string; basePrice: number }> = {
  TATAMOTORS: { name: "Tata Motors Ltd", sector: "Automobile", basePrice: 496 },
  RELIANCE: { name: "Reliance Industries Ltd", sector: "Energy", basePrice: 2942 },
  HDFCBANK: { name: "HDFC Bank Ltd", sector: "Banking", basePrice: 1540 },
  ICICIBANK: { name: "ICICI Bank Ltd", sector: "Banking", basePrice: 1120 },
  BHARTIARTL: { name: "Bharti Airtel Ltd", sector: "Telecom", basePrice: 1310 },
  INFY: { name: "Infosys Ltd", sector: "IT Services", basePrice: 1485 },
  TCS: { name: "Tata Consultancy Services", sector: "IT Services", basePrice: 3850 },
  WIPRO: { name: "Wipro Ltd", sector: "IT Services", basePrice: 420 },
  ITC: { name: "ITC Ltd", sector: "FMCG", basePrice: 445 },
  SBIN: { name: "State Bank of India", sector: "Banking", basePrice: 780 },
  LT: { name: "Larsen & Toubro Ltd", sector: "Infrastructure", basePrice: 3450 },
  TITAN: { name: "Titan Company Ltd", sector: "Consumer Durables", basePrice: 3200 },
  MARUTI: { name: "Maruti Suzuki India Ltd", sector: "Automobile", basePrice: 11800 },
  HINDUNILVR: { name: "Hindustan Unilever Ltd", sector: "FMCG", basePrice: 2480 },
  SUNPHARMA: { name: "Sun Pharmaceutical Inds", sector: "Pharma", basePrice: 1280 },
  BAJFINANCE: { name: "Bajaj Finance Ltd", sector: "NBFC", basePrice: 7200 },
  KOTAKBANK: { name: "Kotak Mahindra Bank", sector: "Banking", basePrice: 1820 },
  NTPC: { name: "NTPC Ltd", sector: "Power", basePrice: 340 },
  POWERGRID: { name: "Power Grid Corp of India", sector: "Power", basePrice: 280 },
  ONGC: { name: "Oil & Natural Gas Corp", sector: "Energy", basePrice: 248 },
  HFCL: { name: "HFCL Ltd", sector: "Telecom", basePrice: 115 },
  KPITTECH: { name: "KPIT Technologies Ltd", sector: "IT Services", basePrice: 1640 },
  COFORGE: { name: "Coforge Ltd", sector: "IT Services", basePrice: 5210 },
};

function generateTrend(rand: () => number): { trend: string; sma: string } {
  const r = rand();
  if (r < 0.35) return { trend: "Strong Uptrend", sma: "Bullish" };
  if (r < 0.60) return { trend: "Uptrend", sma: "Bullish" };
  if (r < 0.80) return { trend: "Neutral", sma: "Neutral" };
  return { trend: "Downtrend", sma: "Bearish" };
}

function generateVolumeStatus(rand: () => number): string {
  const r = rand();
  if (r < 0.25) return "High Expansion";
  if (r < 0.50) return "Above Average";
  if (r < 0.75) return "Average";
  return "Below Average";
}

function generateAnalysis(symbol: string, meta: { name: string; sector: string }, price: number, change: number, rsi: number, score: number, trend: string): string {
  const isPositive = change >= 0;
  const priceAction = isPositive
    ? `${symbol} is trading in a ${trend.toLowerCase()} with bullish price action.`
    : `${symbol} shows a slight pullback within an overall ${trend.toLowerCase()} structure.`;
  
  const rsiComment = rsi > 60
    ? `RSI at ${rsi.toFixed(1)} indicates strong momentum with room for further upside before reaching overbought territory (>70).`
    : rsi > 40
    ? `RSI at ${rsi.toFixed(1)} is in neutral-bullish territory, suggesting balanced momentum with upward bias.`
    : `RSI at ${rsi.toFixed(1)} is approaching oversold levels (<30), which could signal a reversal opportunity.`;

  const scoreComment = score >= 75
    ? `The opportunity score of ${score} reflects strong technical alignment with your playbook criteria.`
    : score >= 55
    ? `The opportunity score of ${score} indicates moderate setup quality — confirm with additional filters.`
    : `The opportunity score of ${score} suggests caution — the setup needs more confirmation.`;

  return [
    `**${symbol} (${meta.name})** — ${meta.sector}`,
    ``,
    `${priceAction} Currently trading at **₹${price.toFixed(2)}** (${isPositive ? '+' : ''}${change.toFixed(2)}%).`,
    ``,
    `**Technical Assessment:**`,
    `• ${rsiComment}`,
    `• Volume is ${generateVolumeStatus(() => Math.random()).toLowerCase()} — ` + (score > 60 ? `supporting the current trend structure.` : `suggesting reduced participation.`),
    `• Price is trading ${trend === "Strong Uptrend" ? "well above" : trend === "Uptrend" ? "above" : trend === "Neutral" ? "around" : "below"} key moving averages.`,
    ``,
    `**Score Analysis:**`,
    `• ${scoreComment}`,
    `• Key strengths: ${score > 70 ? "trend structure and momentum indicators" : score > 50 ? "momentum and risk parameters" : "valuation and mean reversion potential"}`,
    `• Key risks: ${score < 60 ? "volume profile and trend consistency" : "sector rotation and macro headwinds"}`,
    ``,
    `**Recommendation:** ${score >= 70 ? "Consider adding to watchlist for a confirmed entry setup." : score >= 50 ? "Monitor for additional confirmation signals." : "Wait for better setup alignment before considering entry."}`
  ].join("\n");
}

function generateFollowUps(symbol: string, _meta: { name: string; sector: string }): string[] {
  return [
    `Show swing trade setup for ${symbol}`,
    `What is the ${symbol} RSI divergence signal?`,
    `Compare ${symbol} with sector peers`,
    `What are the key support levels for ${symbol}?`,
    `Analyze volume profile for ${symbol}`
  ];
}

function generateOpenUICode(_symbol: string, price: number, change: number, rsi: number, score: number, trend: string): string {
  const changeStr = change >= 0 ? `+${change.toFixed(2)}%` : `${change.toFixed(2)}%`;
  const isPositive = change >= 0;
  return `root = Stack([
  Grid([
    Metric("Price (LTP)", "₹${price.toFixed(2)}", "${changeStr}", "${isPositive ? "Bullish" : "Bearish"}"),
    Metric("Opportunity Score", "${score}", "", "${score >= 70 ? "High" : score >= 50 ? "Medium" : "Low"}"),
    Metric("RSI (14)", "${rsi.toFixed(1)}", "", "${rsi > 60 ? "Strong Momentum" : rsi > 40 ? "Neutral" : "Oversold"}"),
    Metric("Trend", "${trend}", "", "${trend.includes("Uptrend") ? "Bullish" : trend === "Neutral" ? "Neutral" : "Bearish"}")
  ])
])`;
}

export function getDummyAnalysis(symbol: string): StockAnalysis {
  const meta = STOCK_META[symbol.toUpperCase()] || {
    name: `${symbol.toUpperCase()} Ltd`,
    sector: "Diversified",
    basePrice: 500 + Math.random() * 3000
  };

  const rand = createPRNG(hashSymbol(symbol) + 42);
  const basePrice = meta.basePrice;

  // Generate 30 days of data
  const chartData: ChartDataPoint[] = [];
  let currentPrice = basePrice * (0.95 + rand() * 0.1);
  const trend = generateTrend(rand);

  for (let i = 30; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    if (date.getDay() === 0 || date.getDay() === 6) continue;

    const volatility = basePrice * 0.025;
    const drift = trend.trend.includes("Uptrend") ? 0.001 : trend.trend === "Neutral" ? 0.0002 : -0.001;
    const change = (rand() - 0.48 + drift) * volatility;
    currentPrice = Math.max(currentPrice + change, basePrice * 0.7);

    chartData.push({
      date: date.toISOString().split("T")[0],
      price: Math.round(currentPrice * 100) / 100,
      rsi: Math.round((35 + rand() * 35) * 10) / 10, // 35-70 range
      volume: Math.round(rand() * 8000000 + 500000)
    });
  }

  // Assign proper RSI values based on trend
  const baseRSI = trend.trend.includes("Uptrend") ? 55 + rand() * 15 : trend.trend === "Neutral" ? 45 + rand() * 10 : 35 + rand() * 10;
  chartData.forEach((d, idx) => {
    d.rsi = Math.round((baseRSI + (rand() - 0.5) * 12) * 10) / 10;
    d.rsi = Math.min(Math.max(d.rsi, 25), 78);
    d.sma20 = chartData.slice(Math.max(0, idx - 20), idx + 1).reduce((s, p) => s + p.price, 0) / Math.min(idx + 1, 20);
    d.sma50 = chartData.slice(Math.max(0, idx - 50), idx + 1).reduce((s, p) => s + p.price, 0) / Math.min(idx + 1, 50);
  });

  const lastData = chartData[chartData.length - 1];
  const prevData = chartData[chartData.length - 2] || lastData;
  const dailyChange = lastData.price - prevData.price;
  const changePercent = ((lastData.price - prevData.price) / prevData.price) * 100;

  const avgVolume = chartData.reduce((s, d) => s + d.volume, 0) / chartData.length;
  const lastVolume = lastData.volume;
  const volumeRatio = lastVolume / avgVolume;
  const volumeStatus = volumeRatio > 1.8 ? "High Expansion" : volumeRatio > 1.2 ? "Above Average" : volumeRatio > 0.7 ? "Average" : "Below Average";

  const score = Math.round(45 + rand() * 40);

  const metricBreakdown = [
    { label: "Trend Structure", value: trend.trend.includes("Strong") ? 20 : trend.trend === "Uptrend" ? 16 : trend.trend === "Neutral" ? 10 : 4, max: 20, desc: trend.trend.includes("Uptrend") ? "Price is in a strong uptrend structure." : trend.trend === "Neutral" ? "Price is consolidating." : "Price is in a downtrend.", color: trend.trend.includes("Uptrend") ? "success" : "neutral" },
    { label: "Volume Profile", value: volumeRatio > 1.5 ? 13 : volumeRatio > 1.0 ? 8 : volumeRatio > 0.5 ? 4 : 0, max: 15, desc: `Volume is ${volumeStatus.toLowerCase()} (${volumeRatio.toFixed(1)}x avg).`, color: volumeRatio > 1.0 ? "success" : "neutral" },
    { label: "RSI Momentum", value: baseRSI > 55 ? 15 : baseRSI > 45 ? 10 : 5, max: 15, desc: `RSI (14) value is ${baseRSI.toFixed(1)} (${baseRSI > 55 ? "Strong Momentum" : baseRSI > 40 ? "Neutral" : "Weak"}).`, color: baseRSI > 50 ? "success" : "neutral" },
    { label: "Volatility Risk", value: basePrice > 1000 ? rand() * 20 : 10 + rand() * 10, max: 20, desc: "Volatility is within acceptable range for setup.", color: "neutral" },
    { label: "Relative Strength", value: score > 65 ? 15 : score > 50 ? 10 : 5, max: 15, desc: `Stock is ${score > 65 ? "outperforming" : score > 50 ? "in line with" : "underperforming"} sector peers.`, color: score > 55 ? "success" : "neutral" },
  ];

  return {
    symbol: symbol.toUpperCase(),
    name: meta.name,
    sector: meta.sector,
    currentPrice: lastData.price,
    change: dailyChange,
    changePercent,
    rsi: baseRSI,
    score,
    metrics: {
      price: lastData.price,
      change: dailyChange,
      changePercent,
      rsi: baseRSI,
      score,
      trend: trend.trend,
      volumeStatus,
      smaAlignment: trend.sma,
      entry: `₹${(lastData.price * 0.97).toFixed(1)} - ${(lastData.price * 0.99).toFixed(1)}`,
      target: `₹${(lastData.price * 1.12).toFixed(1)}`,
      stop: `₹${(lastData.price * 0.94).toFixed(1)}`,
      riskReward: ((lastData.price * 1.12 - lastData.price) / (lastData.price - lastData.price * 0.94)).toFixed(1),
    },
    chartData,
    metricBreakdown,
    analysis: generateAnalysis(symbol, { name: meta.name, sector: meta.sector }, lastData.price, changePercent, baseRSI, score, trend.trend),
    recommendation: score >= 70 ? "Strong Buy — technical alignment confirmed" : score >= 55 ? "Watch — monitor for confirmation" : "Avoid — setup lacks conviction",
    followUps: generateFollowUps(symbol, meta),
    openuiCode: generateOpenUICode(symbol, lastData.price, changePercent, baseRSI, score, trend.trend),
  };
}

export function getDummyComparison(sym1: string, sym2: string) {
  const d1 = getDummyAnalysis(sym1);
  const d2 = getDummyAnalysis(sym2);
  return {
    sym1: { symbol: d1.symbol, name: d1.name, price: d1.currentPrice, change: d1.changePercent, score: d1.score, rsi_value: d1.rsi, rsi_status: d1.rsi > 60 ? "Strong" : d1.rsi > 40 ? "Neutral" : "Weak", volume_value: d1.metrics.volumeStatus, volume_status: d1.metrics.volumeStatus, rs_value: d1.score - 50, rs_status: d1.score > 60 ? "Outperform" : "In-Line", ma_structure: d1.metrics.smaAlignment, entry: d1.metrics.entry || "—", target: d1.metrics.target || "—", stop: d1.metrics.stop || "—", risk_reward: d1.metrics.riskReward || "—", setup: d1.metrics.trend, trend: d1.metrics.trend },
    sym2: { symbol: d2.symbol, name: d2.name, price: d2.currentPrice, change: d2.changePercent, score: d2.score, rsi_value: d2.rsi, rsi_status: d2.rsi > 60 ? "Strong" : d2.rsi > 40 ? "Neutral" : "Weak", volume_value: d2.metrics.volumeStatus, volume_status: d2.metrics.volumeStatus, rs_value: d2.score - 50, rs_status: d2.score > 60 ? "Outperform" : "In-Line", ma_structure: d2.metrics.smaAlignment, entry: d2.metrics.entry || "—", target: d2.metrics.target || "—", stop: d2.metrics.stop || "—", risk_reward: d2.metrics.riskReward || "—", setup: d2.metrics.trend, trend: d2.metrics.trend },
    summary: `## Comparison: ${d1.symbol} vs ${d2.symbol}\\n\\n**${d1.symbol} (${d1.name})** — Score: ${d1.score}/100, RSI: ${d1.rsi.toFixed(1)}, Trend: ${d1.metrics.trend}\\n\\n**${d2.symbol} (${d2.name})** — Score: ${d2.score}/100, RSI: ${d2.rsi.toFixed(1)}, Trend: ${d2.metrics.trend}\\n\\n${d1.score > d2.score ? `${d1.symbol}` : `${d2.symbol}`} shows stronger overall technical alignment based on playbook scoring. Key differentiators include trend structure and momentum consistency.\\n\\n> **Recommendation:** Consider ${d1.score > d2.score ? d1.symbol : d2.symbol} for prioritization in your watchlist.`
  };
}

export function getDummyMarketData() {
  const stocks = ["RELIANCE", "TCS", "HDFCBANK", "ICICIBANK", "BHARTIARTL", "SBIN", "LT", "INFY", "TITAN", "MARUTI", "ITC", "NTPC"];
  const data = stocks.map(s => {
    const d = getDummyAnalysis(s);
    return { symbol: d.symbol, name: d.name, sector: d.sector, price: d.currentPrice, change: d.changePercent, score: d.score, setup: d.metrics.trend };
  });
  return data;
}

export function getDummyPortfolioData() {
  const holdings = ["RELIANCE", "TCS", "HDFCBANK", "KPITTECH", "HFCL"].map(s => {
    const d = getDummyAnalysis(s);
    const qty = Math.round(10 + Math.random() * 90);
    return {
      symbol: d.symbol,
      displayName: d.name,
      exchange: "NSE",
      qty,
      avg_price: d.currentPrice * (0.95 + Math.random() * 0.1),
      ltp: d.currentPrice,
      invested_value: d.currentPrice * qty * 0.96,
      current_value: d.currentPrice * qty,
      net_pnl: d.currentPrice * qty * 0.04,
      net_pnl_chg: d.score > 60 ? 4.5 + Math.random() * 3 : -2 + Math.random() * 4,
      day_pnl: Math.random() * 500
    };
  });
  return holdings;
}
