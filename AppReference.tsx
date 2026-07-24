import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  Paperclip, 
  ArrowUp, 
  BarChart3, 
  Activity, 
  Zap, 
  TrendingUp, 
  Sparkles, 
  ChevronRight, 
  Menu, 
  Bookmark, 
  BookmarkCheck,
  Plus
} from "lucide-react";
import { Workspace } from "./components/Workspace";
import { MiniSparkline } from "./components/MiniSparkline";
import { Sidebar } from "./components/Sidebar";
import { ClearAllModal } from "./components/ClearAllModal";
import { Conversation, ChatMessage, QueryType, OptionItem, StockInfo } from "./types";
import { cn } from "./lib/utils";

const POPULAR_STOCKS: StockInfo[] = [
  {
    name: "Reliance Industries",
    symbol: "RELIANCE",
    price: "₹2,942.50",
    change: "+1.82%",
    changePercent: 1.82,
    sparkline: [2880, 2895, 2910, 2900, 2925, 2930, 2942.5]
  },
  {
    name: "Tata Motors",
    symbol: "TATAMOTORS",
    price: "₹924.10",
    change: "-1.24%",
    changePercent: -1.24,
    sparkline: [945, 938, 932, 936, 928, 920, 924.1]
  },
  {
    name: "HDFC Bank",
    symbol: "HDFCBANK",
    price: "₹1,540.00",
    change: "+0.45%",
    changePercent: 0.45,
    sparkline: [1528, 1532, 1530, 1538, 1535, 1539, 1540]
  },
  {
    name: "ICICI Bank",
    symbol: "ICICIBANK",
    price: "₹1,120.30",
    change: "+2.10%",
    changePercent: 2.10,
    sparkline: [1090, 1098, 1105, 1112, 1108, 1118, 1120.3]
  },
  {
    name: "Bharti Airtel",
    symbol: "BHARTIARTL",
    price: "₹1,310.80",
    change: "+0.95%",
    changePercent: 0.95,
    sparkline: [1295, 1298, 1302, 1300, 1308, 1305, 1310.8]
  }
];

const STARTER_PROMPTS = [
  {
    id: 'rsi',
    title: "RSI Momentum Tracker",
    subtitle: "Identify overbought and oversold momentum zones",
    icon: <BarChart3 className="w-4 h-4 text-white" />,
    badge: "Technical"
  },
  {
    id: 'volume',
    title: "Analyze Unusual Volume Today",
    subtitle: "Spot institutional spikes and block order flows",
    icon: <Activity className="w-4 h-4 text-white" />,
    badge: "Volume Anomaly"
  },
  {
    id: 'drivers',
    title: "Reliance Growth Drivers",
    subtitle: "Retail expansion, green capex, and 5G subscriber growth",
    icon: <Zap className="w-4 h-4 text-white" />,
    badge: "Fundamentals"
  },
  {
    id: 'momentum',
    title: "Compare Top Banks Momentum",
    subtitle: "Relative strength leaderboard across banking sector",
    icon: <TrendingUp className="w-4 h-4 text-white" />,
    badge: "Sector Comparison"
  }
];

// Initial seed research conversations for rich history demonstration
const SEED_CONVERSATIONS: Conversation[] = [
  {
    id: 'conv-reliance-growth',
    title: 'Reliance growth outlook',
    createdAt: 'Today at 10:15 AM',
    updatedAt: Date.now() - 30 * 60 * 1000,
    isSaved: true,
    messages: [
      {
        id: 'msg-r1',
        sender: 'user',
        timestamp: '10:15 AM',
        text: 'What are the main growth drivers for Reliance Industries in Q3?'
      },
      {
        id: 'msg-r2',
        sender: 'assistant',
        timestamp: '10:15 AM',
        text: 'Here is the fundamental growth drivers analysis for Reliance Industries.',
        type: 'workspace',
        workspaceData: {
          queryType: 'drivers',
          subOption: 'Fundamental Growth Drivers',
          selectedStocks: ['Reliance Industries']
        }
      }
    ]
  },
  {
    id: 'conv-banking-sector',
    title: 'Banking sector momentum',
    createdAt: 'Today at 08:30 AM',
    updatedAt: Date.now() - 2 * 3600 * 1000,
    isSaved: false,
    messages: [
      {
        id: 'msg-b1',
        sender: 'user',
        timestamp: '08:30 AM',
        text: 'Compare banking sector relative strength across top private banks.'
      },
      {
        id: 'msg-b2',
        sender: 'assistant',
        timestamp: '08:30 AM',
        text: 'Here is the relative momentum comparison across top banking stocks.',
        type: 'workspace',
        workspaceData: {
          queryType: 'momentum',
          subOption: 'Banking Sector Relative Strength',
          selectedStocks: ['HDFC Bank', 'ICICI Bank']
        }
      }
    ]
  },
  {
    id: 'conv-hdfc-rsi',
    title: 'HDFC Bank RSI analysis',
    createdAt: 'Yesterday',
    updatedAt: Date.now() - 26 * 3600 * 1000,
    isSaved: true,
    messages: [
      {
        id: 'msg-h1',
        sender: 'user',
        timestamp: '04:20 PM',
        text: 'Analyze 14-day RSI overbought levels for HDFC Bank and Tata Motors.'
      },
      {
        id: 'msg-h2',
        sender: 'assistant',
        timestamp: '04:20 PM',
        text: 'Here is the requested 14-Day RSI Momentum Analysis.',
        type: 'workspace',
        workspaceData: {
          queryType: 'rsi',
          subOption: '14-Day Overbought (>70) & Oversold (<30) Zones',
          selectedStocks: ['Reliance Industries', 'Tata Motors', 'HDFC Bank']
        }
      }
    ]
  },
  {
    id: 'conv-volume-spikes',
    title: 'Volume anomaly detector',
    createdAt: '3 days ago',
    updatedAt: Date.now() - 3 * 24 * 3600 * 1000,
    isSaved: false,
    messages: [
      {
        id: 'msg-v1',
        sender: 'user',
        timestamp: '02:10 PM',
        text: 'Spot unusual volume surges over 2.0x 20D baseline.'
      },
      {
        id: 'msg-v2',
        sender: 'assistant',
        timestamp: '02:10 PM',
        text: 'Here is the daily volume anomaly detection workspace.',
        type: 'workspace',
        workspaceData: {
          queryType: 'volume',
          subOption: 'Volume Surge vs 20D Baseline (>2.0x)',
          selectedStocks: ['Tata Motors', 'HDFC Bank']
        }
      }
    ]
  }
];

// Thinking dots component
function ThinkingDots() {
  return (
    <div className="flex items-center gap-1.5 py-1 px-1">
      <motion.span
        className="w-2 h-2 rounded-full bg-white opacity-80"
        animate={{ scale: [0.8, 1.3, 0.8], opacity: [0.4, 1, 0.4] }}
        transition={{ duration: 0.8, repeat: Infinity, delay: 0 }}
      />
      <motion.span
        className="w-2 h-2 rounded-full bg-white opacity-80"
        animate={{ scale: [0.8, 1.3, 0.8], opacity: [0.4, 1, 0.4] }}
        transition={{ duration: 0.8, repeat: Infinity, delay: 0.2 }}
      />
      <motion.span
        className="w-2 h-2 rounded-full bg-white opacity-80"
        animate={{ scale: [0.8, 1.3, 0.8], opacity: [0.4, 1, 0.4] }}
        transition={{ duration: 0.8, repeat: Infinity, delay: 0.4 }}
      />
    </div>
  );
}

export default function App() {
  const [conversations, setConversations] = useState<Conversation[]>(SEED_CONVERSATIONS);
  const [activeChatId, setActiveChatId] = useState<string>('conv-reliance-growth');
  const [inputValue, setInputValue] = useState("");
  const [isOpenMobile, setIsOpenMobile] = useState(false);
  const [isCollapsedDesktop, setIsCollapsedDesktop] = useState(false);
  const [isClearAllModalOpen, setIsClearAllModalOpen] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const activeConversation = conversations.find(c => c.id === activeChatId) || conversations[0];

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [activeConversation?.messages]);

  // Create New Conversation
  const handleNewChat = () => {
    const newId = `conv-${Date.now()}`;
    const newConv: Conversation = {
      id: newId,
      title: 'New Research Chat',
      createdAt: 'Just now',
      updatedAt: Date.now(),
      isSaved: false,
      messages: []
    };

    setConversations(prev => [newConv, ...prev]);
    setActiveChatId(newId);
  };

  // Toggle Save / Pin
  const handleSaveChatToggle = (id: string) => {
    setConversations(prev =>
      prev.map(c => c.id === id ? { ...c, isSaved: !c.isSaved } : c)
    );
  };

  // Rename Conversation
  const handleRenameChat = (id: string, newTitle: string) => {
    setConversations(prev =>
      prev.map(c => c.id === id ? { ...c, title: newTitle } : c)
    );
  };

  // Delete Conversation
  const handleDeleteChat = (id: string) => {
    setConversations(prev => {
      const filtered = prev.filter(c => c.id !== id);
      if (filtered.length === 0) {
        // If all deleted, create fresh one
        const freshId = `conv-${Date.now()}`;
        const freshConv: Conversation = {
          id: freshId,
          title: 'New Research Chat',
          createdAt: 'Just now',
          updatedAt: Date.now(),
          isSaved: false,
          messages: []
        };
        setActiveChatId(freshId);
        return [freshConv];
      }
      if (activeChatId === id) {
        setActiveChatId(filtered[0].id);
      }
      return filtered;
    });
  };

  // Clear All Conversations
  const handleClearAllChats = () => {
    const freshId = `conv-${Date.now()}`;
    const freshConv: Conversation = {
      id: freshId,
      title: 'New Research Chat',
      createdAt: 'Just now',
      updatedAt: Date.now(),
      isSaved: false,
      messages: []
    };
    setConversations([freshConv]);
    setActiveChatId(freshId);
  };

  // Trigger Assistant response flow
  const triggerAssistantFlow = (userText: string, actionType?: QueryType, customOption?: OptionItem) => {
    if (!activeConversation) return;

    const userMsgId = `user-${Date.now()}`;
    const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    const userMsg: ChatMessage = {
      id: userMsgId,
      sender: 'user',
      timestamp,
      text: userText,
      type: 'text'
    };

    const thinkingMsgId = `thinking-${Date.now()}`;
    const thinkingMsg: ChatMessage = {
      id: thinkingMsgId,
      sender: 'assistant',
      timestamp,
      isThinking: true
    };

    // Auto update conversation title if it's the first message or generic title
    const shouldUpdateTitle = activeConversation.messages.length === 0 || activeConversation.title === 'New Research Chat';
    const updatedTitle = shouldUpdateTitle ? (userText.length > 28 ? userText.substring(0, 28) + '...' : userText) : activeConversation.title;

    setConversations(prev =>
      prev.map(c => {
        if (c.id === activeChatId) {
          return {
            ...c,
            title: updatedTitle,
            updatedAt: Date.now(),
            messages: [...c.messages, userMsg, thinkingMsg]
          };
        }
        return c;
      })
    );

    setTimeout(() => {
      const resTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      let responseMsg: ChatMessage;

      if (customOption) {
        responseMsg = {
          id: `assistant-${Date.now()}`,
          sender: 'assistant',
          timestamp: resTime,
          text: `Here is the requested ${customOption.label} workspace.`,
          type: 'workspace',
          workspaceData: {
            queryType: customOption.queryType,
            subOption: customOption.subOption || customOption.label,
            selectedStocks: customOption.stocks
          }
        };
      } else {
        const lower = userText.toLowerCase();

        if (lower.includes('volume') || lower.includes('spike') || lower.includes('anomaly')) {
          responseMsg = {
            id: `assistant-${Date.now()}`,
            sender: 'assistant',
            timestamp: resTime,
            text: "Which volume parameter or order flow spike would you like to inspect?",
            type: 'options',
            options: [
              {
                id: 'v1',
                label: "Volume Surge vs 20D Baseline (>2.0x)",
                description: "Tata Motors & HDFC Bank trading volume burst detection",
                queryType: 'volume',
                subOption: "Volume Surge vs 20D Baseline (>2.0x)",
                stocks: ["Tata Motors", "HDFC Bank"]
              },
              {
                id: 'v2',
                label: "Institutional Block Deals & Accumulation",
                description: "Reliance Industries & ICICI Bank block order accumulation",
                queryType: 'volume',
                subOption: "Institutional Block Orders & Accumulation",
                stocks: ["Reliance Industries", "ICICI Bank"]
              },
              {
                id: 'v3',
                label: "Price Breakout + High Volume Confirmation",
                description: "Verify if price movements are backed by volume",
                queryType: 'volume',
                subOption: "Price Breakout + High Volume Confirmation",
                stocks: ["Tata Motors", "Reliance Industries", "HDFC Bank"]
              }
            ]
          };
        } else if (lower.includes('rsi') || lower.includes('momentum') || lower.includes('overbought') || lower.includes('oversold')) {
          responseMsg = {
            id: `assistant-${Date.now()}`,
            sender: 'assistant',
            timestamp: resTime,
            text: "Which RSI momentum indicator setup would you like to open?",
            type: 'options',
            options: [
              {
                id: 'r1',
                label: "14-Day Overbought (>70) & Oversold (<30) Zones",
                description: "Reliance Industries, Tata Motors & HDFC Bank",
                queryType: 'rsi',
                subOption: "14-Day Overbought (>70) & Oversold (<30) Zones",
                stocks: ["Reliance Industries", "Tata Motors", "HDFC Bank"]
              },
              {
                id: 'r2',
                label: "Bullish & Bearish Divergence Signals",
                description: "Identify divergence between price and momentum",
                queryType: 'rsi',
                subOption: "Bullish & Bearish Divergence Signals",
                stocks: ["Tata Motors", "ICICI Bank"]
              },
              {
                id: 'r3',
                label: "Peer Relative Strength Matrix",
                description: "Compare RSI momentum across banking peers",
                queryType: 'rsi',
                subOption: "Peer Relative Strength Matrix",
                stocks: ["HDFC Bank", "ICICI Bank", "Bharti Airtel"]
              }
            ]
          };
        } else if (lower.includes('reliance') || lower.includes('driver') || lower.includes('growth')) {
          responseMsg = {
            id: `assistant-${Date.now()}`,
            sender: 'assistant',
            timestamp: resTime,
            text: "Here is the fundamental growth drivers analysis for Reliance Industries.",
            type: 'workspace',
            workspaceData: {
              queryType: 'drivers',
              subOption: "Fundamental Growth Drivers",
              selectedStocks: ["Reliance Industries"]
            }
          };
        } else if (lower.includes('bank') || lower.includes('sector') || lower.includes('compare')) {
          responseMsg = {
            id: `assistant-${Date.now()}`,
            sender: 'assistant',
            timestamp: resTime,
            text: "Here is the relative momentum comparison across top banking stocks.",
            type: 'workspace',
            workspaceData: {
              queryType: 'momentum',
              subOption: "Banking Sector Relative Strength",
              selectedStocks: ["HDFC Bank", "ICICI Bank"]
            }
          };
        } else {
          responseMsg = {
            id: `assistant-${Date.now()}`,
            sender: 'assistant',
            timestamp: resTime,
            text: `I identified research triggers for "${userText}". Select a generative workspace module below:`,
            type: 'options',
            options: [
              {
                id: 'g1',
                label: "14-Day RSI Momentum Tracker",
                description: "RSI zones for Tata Motors, Reliance & HDFC Bank",
                queryType: 'rsi',
                subOption: "RSI Momentum Tracker",
                stocks: ["Tata Motors", "Reliance Industries", "HDFC Bank"]
              },
              {
                id: 'g2',
                label: "Volume Surge & Anomaly Detector",
                description: "Detect institutional block order flow",
                queryType: 'volume',
                subOption: "Volume Surge Detector",
                stocks: ["Tata Motors", "HDFC Bank"]
              },
              {
                id: 'g3',
                label: "Reliance Fundamental Growth Drivers",
                description: "Retail expansion, green capex & telecom ARPU",
                queryType: 'drivers',
                subOption: "Growth Drivers",
                stocks: ["Reliance Industries"]
              }
            ]
          };
        }
      }

      setConversations(prev =>
        prev.map(c => {
          if (c.id === activeChatId) {
            const cleanMsgs = c.messages.filter(m => m.id !== thinkingMsgId);
            return {
              ...c,
              updatedAt: Date.now(),
              messages: [...cleanMsgs, responseMsg]
            };
          }
          return c;
        })
      );
    }, 1100);
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim()) return;
    const text = inputValue.trim();
    setInputValue("");
    triggerAssistantFlow(text);
  };

  return (
    <div className="min-h-screen flex text-[var(--text-primary)] font-sans bg-[#050608] selection:bg-white selection:text-black">
      {/* SIDEBAR NAVIGATION */}
      <Sidebar
        conversations={conversations}
        activeChatId={activeChatId}
        onSelectChat={(id) => setActiveChatId(id)}
        onNewChat={handleNewChat}
        onSaveChatToggle={handleSaveChatToggle}
        onRenameChat={handleRenameChat}
        onDeleteChat={handleDeleteChat}
        onClearAllChats={() => setIsClearAllModalOpen(true)}
        isOpenMobile={isOpenMobile}
        onCloseMobile={() => setIsOpenMobile(false)}
        isCollapsedDesktop={isCollapsedDesktop}
        onToggleCollapseDesktop={() => setIsCollapsedDesktop(!isCollapsedDesktop)}
      />

      {/* CLEAR ALL CONFIRMATION MODAL */}
      <ClearAllModal
        isOpen={isClearAllModalOpen}
        onClose={() => setIsClearAllModalOpen(false)}
        onConfirm={handleClearAllChats}
      />

      {/* MAIN WORKSPACE CANVAS AREA */}
      <div className={cn(
        "flex-1 flex flex-col min-w-0 transition-all duration-300 relative",
        isCollapsedDesktop ? "md:ml-16" : "md:ml-64"
      )}>
        {/* TOP WORKSPACE NAVBAR */}
        <header className="h-16 bg-[#08090d]/90 backdrop-blur-md border-b border-white/10 px-6 flex items-center justify-between sticky top-0 z-20">
          <div className="flex items-center gap-3 min-w-0">
            <button
              onClick={() => setIsOpenMobile(true)}
              className="p-2 rounded-xl hover:bg-white/10 text-zinc-400 hover:text-white md:hidden transition-colors"
            >
              <Menu className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2.5 min-w-0">
              <span className="text-[14px] font-bold text-white truncate">
                {activeConversation?.title || 'Research Session'}
              </span>

              {activeConversation?.isSaved && (
                <span className="inline-flex items-center gap-1.5 text-[11px] font-medium text-amber-400 bg-amber-500/10 px-2.5 py-0.5 rounded-full border border-amber-500/20 shrink-0">
                  <Bookmark className="w-3.5 h-3.5 fill-amber-400" /> Saved
                </span>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2.5 shrink-0">
            <button
              onClick={() => handleSaveChatToggle(activeChatId)}
              className={cn(
                "px-3.5 py-2 rounded-xl border transition-all text-[13px] font-medium flex items-center gap-2 min-h-[38px]",
                activeConversation?.isSaved
                  ? "bg-amber-500/10 text-amber-300 border-amber-500/30"
                  : "bg-white/5 border-white/10 text-zinc-300 hover:text-white hover:bg-white/10"
              )}
              title={activeConversation?.isSaved ? "Unpin research chat" : "Pin/Save research chat"}
            >
              <Bookmark className={cn("w-4 h-4", activeConversation?.isSaved && "fill-amber-400 text-amber-400")} />
              <span className="hidden sm:inline">{activeConversation?.isSaved ? 'Saved' : 'Save Chat'}</span>
            </button>

            <button
              onClick={handleNewChat}
              className="px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/15 border border-white/15 text-white text-[13px] font-semibold flex items-center gap-2 transition-colors min-h-[38px]"
            >
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">New Chat</span>
            </button>
          </div>
        </header>

        {/* WORKSPACE CONTENT AREA */}
        <main className="flex-1 w-full max-w-4xl mx-auto px-6 pt-8 pb-36 flex flex-col">
          {/* EMPTY STATE (NEW CONVERSATION LANDING) */}
          {activeConversation?.messages.length === 0 ? (
            <div className="flex-1 flex flex-col justify-center items-center py-8 my-auto max-w-2xl mx-auto text-center">
              <div className="w-12 h-12 rounded-2xl bg-[#0a0b0f] border border-white/15 flex items-center justify-center mb-4">
                <Sparkles className="w-5 h-5 text-white" />
              </div>

              <h1 className="text-2xl md:text-3xl font-bold text-white tracking-tight">
                Good Day, Trader.
              </h1>
              <p className="text-[14px] text-zinc-400 mt-2 max-w-md leading-relaxed">
                How can I assist your market momentum analysis and fundamental research today?
              </p>

              {/* STARTER PROMPTS GRID */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 w-full mt-8">
                {STARTER_PROMPTS.map((q) => (
                  <button
                    key={q.id}
                    onClick={() => triggerAssistantFlow(q.title, q.id as QueryType)}
                    className="group flex flex-col p-4 rounded-xl border border-white/10 bg-[#0a0b0f] hover:bg-[#111218] hover:border-white/20 transition-all text-left"
                  >
                    <div className="flex items-center justify-between mb-2.5">
                      <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center border border-white/10 shrink-0">
                        {q.icon}
                      </div>
                      <span className="text-[11px] font-medium tracking-wider text-zinc-300 bg-white/10 px-2.5 py-1 rounded-md border border-white/10">
                        {q.badge}
                      </span>
                    </div>
                    <span className="text-[13.5px] font-bold text-white group-hover:text-white transition-colors">
                      {q.title}
                    </span>
                    <span className="text-[12px] text-zinc-400 mt-1 line-clamp-1">
                      {q.subtitle}
                    </span>
                  </button>
                ))}
              </div>

              {/* POPULAR TICKERS OVERVIEW */}
              <div className="w-full mt-10">
                <div className="flex items-center justify-between mb-3 px-1">
                  <span className="text-[11px] font-bold text-zinc-500 uppercase tracking-wider">
                    Quick Stock Momentum Tickers
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {POPULAR_STOCKS.slice(0, 3).map((stock) => {
                    const isPositive = stock.changePercent >= 0;
                    return (
                      <button
                        key={stock.symbol}
                        onClick={() => triggerAssistantFlow(`Analyze RSI and volume for ${stock.name}`)}
                        className="flex items-center justify-between p-3.5 rounded-xl border border-white/10 bg-[#0a0b0f] hover:bg-[#111218] transition-all text-left group"
                      >
                        <div className="flex flex-col">
                          <span className="text-[12.5px] font-bold text-white">{stock.name}</span>
                          <div className="flex items-center gap-1.5 mt-1">
                            <span className="text-[11.5px] text-zinc-400">{stock.price}</span>
                            <span className={cn(
                              "text-[10.5px] font-semibold px-1.5 py-0.5 rounded-md border",
                              isPositive 
                                ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" 
                                : "bg-rose-500/10 text-rose-400 border-rose-500/20"
                            )}>
                              {stock.change}
                            </span>
                          </div>
                        </div>
                        <MiniSparkline data={stock.sparkline} isPositive={isPositive} />
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          ) : (
            /* ACTIVE CHAT MESSAGES THREAD */
            <div className="flex flex-col gap-6">
              {activeConversation?.messages.map((msg) => (
                <div key={msg.id} className="w-full flex flex-col">
                  {/* USER MESSAGE */}
                  {msg.sender === 'user' && (
                    <div className="flex justify-end my-1">
                      <div className="max-w-[85%] bg-[#141620] border border-white/10 rounded-2xl rounded-tr-sm px-4 py-3 text-[14px] text-white">
                        <p>{msg.text}</p>
                        <span className="text-[10px] text-zinc-500 mt-1.5 block text-right font-mono">
                          {msg.timestamp}
                        </span>
                      </div>
                    </div>
                  )}

                  {/* ASSISTANT MESSAGE */}
                  {msg.sender === 'assistant' && (
                    <div className="flex flex-col items-start my-1 w-full">
                      <div className="max-w-[100%] sm:max-w-[96%] bg-[#08090d] border border-white/10 rounded-2xl rounded-tl-sm p-5 text-[14px] text-white">
                        {/* Header line for Assistant */}
                        <div className="flex items-center justify-between gap-3 mb-3 pb-2.5 border-b border-white/10">
                          <div className="flex items-center gap-2">
                            <div className="w-5 h-5 rounded-full bg-white text-black font-extrabold text-[10px] flex items-center justify-center">
                              AI
                            </div>
                            <span className="text-[12.5px] font-bold text-white tracking-tight">FinAI Research</span>
                          </div>
                          <span className="text-[10px] text-zinc-500 font-mono">{msg.timestamp}</span>
                        </div>

                        {/* Thinking state */}
                        {msg.isThinking && (
                          <div className="flex items-center gap-2 py-2">
                            <span className="text-[13.5px] text-zinc-400">Synthesizing real-time market data...</span>
                            <ThinkingDots />
                          </div>
                        )}

                        {/* Message text */}
                        {msg.text && !msg.isThinking && (
                          <p className="text-[14px] text-zinc-200 leading-relaxed mb-3">
                            {msg.text}
                          </p>
                        )}

                        {/* Options buttons if any */}
                        {msg.type === 'options' && msg.options && (
                          <div className="grid grid-cols-1 gap-2.5 mt-3.5">
                            {msg.options.map((opt) => (
                              <button
                                key={opt.id}
                                onClick={() => triggerAssistantFlow(`Analyze ${opt.label}`, undefined, opt)}
                                className="group flex flex-col p-3.5 sm:p-4 rounded-xl border border-white/10 bg-[#0a0b0f] hover:bg-[#111218] transition-all text-left"
                              >
                                <div className="flex items-center justify-between mb-1">
                                  <span className="text-[13.5px] font-bold text-white flex items-center gap-2">
                                    {opt.label}
                                  </span>
                                  <ChevronRight className="w-4 h-4 text-zinc-500 group-hover:text-white transition-colors" />
                                </div>
                                {opt.description && (
                                  <span className="text-[12.5px] text-zinc-400">
                                    {opt.description}
                                  </span>
                                )}
                              </button>
                            ))}
                          </div>
                        )}

                        {/* Generative Workspace Component */}
                        {msg.type === 'workspace' && msg.workspaceData && (
                          <Workspace
                            queryType={msg.workspaceData.queryType}
                            subOption={msg.workspaceData.subOption}
                            selectedStocks={msg.workspaceData.selectedStocks}
                          />
                        )}
                      </div>
                    </div>
                  )}
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>
          )}
        </main>

        {/* STICKY BOTTOM CHAT INPUT BAR */}
        <footer className={cn(
          "fixed bottom-0 right-0 bg-[#050608]/90 backdrop-blur-xl border-t border-white/10 p-4 z-30 transition-all duration-300",
          isCollapsedDesktop ? "left-0 md:left-16" : "left-0 md:left-64"
        )}>
          <form onSubmit={handleFormSubmit} className="max-w-4xl mx-auto relative flex items-center bg-[#0a0b0f] border border-white/15 rounded-2xl p-2 focus-within:border-white/30 transition-colors">
            <div className="flex items-center gap-2 pl-2 shrink-0">
              <button
                type="button"
                className="w-9 h-9 rounded-xl flex items-center justify-center text-zinc-400 hover:text-white hover:bg-white/10 transition-colors"
                title="Attach research document or file"
              >
                <Paperclip className="w-4 h-4" />
              </button>
            </div>

            <input
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="Ask about a stock, compare companies, or explore a market trend..."
              className="w-full bg-transparent h-[44px] px-3 text-[14px] text-white placeholder:text-zinc-500 focus:outline-none"
            />

            <button
              type="submit"
              disabled={!inputValue.trim()}
              className="shrink-0 w-10 h-10 rounded-xl bg-white text-black hover:bg-zinc-200 transition-colors flex items-center justify-center disabled:opacity-20 disabled:pointer-events-none font-bold cursor-pointer"
              title="Send research query"
            >
              <ArrowUp className="w-4 h-4 stroke-[2.5]" />
            </button>
          </form>
        </footer>
      </div>
    </div>
  );
}
