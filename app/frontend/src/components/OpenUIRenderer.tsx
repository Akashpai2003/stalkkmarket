import React, { useState, useEffect } from "react"
import {
  ResponsiveContainer,
  AreaChart as RechartsAreaChart,
  Area,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
} from "recharts"
import { AreaChart } from "./AreaChart"

// ====================================================
// Markdown Parser Logic (copied from Chatbot.tsx)
// ====================================================
const parseCodeInline = (text: string) => {
  const codeParts = text.split(/(\`.*?\`)/g)
  return codeParts.map((part, index) => {
    if (part.startsWith("`") && part.endsWith("`")) {
      return (
        <code 
          key={index} 
          className="px-1 py-0.5 bg-neutral-900 border border-border/80 text-[14px] font-mono rounded text-foreground font-medium"
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
        <strong key={index} className="font-medium text-foreground">
          {parseCodeInline(part.slice(2, -2))}
        </strong>
      )
    }
    return parseCodeInline(part)
  })
}

function generateVolumeData(_symbol: string, days: number = 90) {
  const now = Date.now();
  const dayMs = 86400000;
  return Array.from({ length: days }, (_, i) => {
    const t = now - (days - 1 - i) * dayMs;
    const vol = Math.floor(2500000 + Math.sin(i / 5) * 1200000 + Math.random() * 800000);
    return {
      time: new Date(t).toLocaleDateString([], { month: "short", day: "numeric" }),
      volume: vol
    };
  });
}

export const renderMarkdown = (text: string) => {
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
          className="bg-neutral-900/60 border border-border/80 rounded-xl p-3 my-1 overflow-x-auto text-[14px] font-mono text-foreground shadow-sm leading-normal"
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

    const flushList = (key: string | number) => {
      if (listItems.length > 0) {
        elements.push(
          <ul key={`ul-${key}`} className="list-disc pl-5 my-1.5 flex flex-col gap-1 text-[15px] leading-relaxed">
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
          <div key={`table-container-${key}`} className="overflow-x-auto my-2 border border-border/60 rounded-xl shadow-sm bg-card">
            <table className="min-w-full divide-y divide-border/40 text-[14.5px] text-left leading-normal">
              {headers.length > 0 && (
                <thead className="bg-accent/40 font-medium">
                  <tr>
                    {headers.map((h, i) => (
                      <th key={i} className="px-3 py-2 border-b border-border/40 font-medium text-text-muted">{parseInlineMarkdown(h)}</th>
                    ))}
                  </tr>
                </thead>
              )}
              <tbody className="divide-y divide-border/20">
                {bodyRows.map((row, ri) => (
                  <tr key={ri} className="hover:bg-accent/10">
                    {row.map((cell, ci) => (
                      <td key={ci} className="px-3 py-2 text-foreground">{parseInlineMarkdown(cell)}</td>
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
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i]
      const trimmed = line.trim()
      
      if (trimmed.startsWith("|")) {
        flushList(i)
        inTable = true
        const cells = line.split("|").map(c => c.trim()).filter((_, idx, arr) => idx > 0 && idx < arr.length - 1)
        tableRows.push(cells)
        continue
      } else if (inTable) {
        flushTable(i)
      }
      
      if (trimmed.startsWith("### ")) {
        flushList(i)
        elements.push(<h3 key={i} className="text-[15px] font-medium text-foreground mt-3.5 mb-1.5 leading-snug">{parseInlineMarkdown(trimmed.slice(4))}</h3>)
      } else if (trimmed.startsWith("#### ")) {
        flushList(i)
        elements.push(<h4 key={i} className="text-[14px] font-medium text-foreground mt-3 mb-1 leading-snug">{parseInlineMarkdown(trimmed.slice(5))}</h4>)
      } else if (trimmed.startsWith("## ")) {
        flushList(i)
        elements.push(<h2 key={i} className="text-[16px] font-medium text-foreground mt-4 mb-2 leading-snug">{parseInlineMarkdown(trimmed.slice(3))}</h2>)
      } else if (trimmed.startsWith("- ") || trimmed.startsWith("* ")) {
        listItems.push(<li key={`li-${i}`} className="leading-relaxed text-text-muted mt-0.5 text-[15px]">{parseInlineMarkdown(trimmed.slice(2))}</li>)
      } else if (trimmed === "") {
        flushList(i)
        elements.push(<div key={`br-${i}`} className="h-1.5" />)
      } else {
        flushList(i)
        elements.push(<p key={i} className="my-1.5 leading-relaxed text-text-muted text-[15px]">{parseInlineMarkdown(line)}</p>)
      }
    }
    
    flushList("end")
    flushTable("end")
    
    return <React.Fragment key={index}>{elements}</React.Fragment>
  })
}

// ====================================================
// OpenUI Lang Parser Implementation
// ====================================================

function unescapeString(val: string): string {
  return val
    .replace(/\\n/g, "\n")
    .replace(/\\t/g, "\t")
    .replace(/\\"/g, '"')
    .replace(/\\'/g, "'")
    .replace(/\\\\/g, "\\");
}

function extractStatements(code: string): { id: string, exprStr: string }[] {
  const statements: { id: string, exprStr: string }[] = [];
  let cleanCode = code;
  const blockMatch = code.match(/```(?:openui)?\s*(.*?)\s*```/s);
  if (blockMatch) {
    cleanCode = blockMatch[1];
  }

  let currentStatement = "";
  let inQuote = false;
  let quoteChar = "";
  let depthRound = 0;
  let depthSquare = 0;
  let depthCurly = 0;
  
  for (let i = 0; i < cleanCode.length; i++) {
    const char = cleanCode[i];
    
    // Handle escape character inside strings
    if (inQuote && char === '\\') {
      currentStatement += char;
      if (i + 1 < cleanCode.length) {
        currentStatement += cleanCode[i + 1];
        i++;
      }
      continue;
    }
    
    // Handle quotes
    if (char === '"' || char === "'" || char === "`") {
      if (inQuote) {
        if (char === quoteChar) {
          inQuote = false;
        }
      } else {
        inQuote = true;
        quoteChar = char;
      }
      currentStatement += char;
      continue;
    }
    
    // Handle comments (only if not inside a string)
    if (!inQuote && (char === '#' || (char === '/' && cleanCode[i + 1] === '/'))) {
      // Skip until end of line
      while (i < cleanCode.length && cleanCode[i] !== '\n') {
        i++;
      }
      // Add statement if any was being accumulated and depths are 0
      if (currentStatement.trim() && depthRound === 0 && depthSquare === 0 && depthCurly === 0) {
        addStatement(currentStatement);
        currentStatement = "";
      }
      continue;
    }
    
    // Handle brackets (only if not inside a string)
    if (!inQuote) {
      if (char === '(') depthRound++;
      else if (char === ')') depthRound--;
      else if (char === '[') depthSquare++;
      else if (char === ']') depthSquare--;
      else if (char === '{') depthCurly++;
      else if (char === '}') depthCurly--;
    }
    
    // Check for statement boundary: newline when all brackets are closed and not in string
    if (char === '\n' && !inQuote && depthRound === 0 && depthSquare === 0 && depthCurly === 0) {
      if (currentStatement.trim()) {
        addStatement(currentStatement);
        currentStatement = "";
      }
    } else {
      currentStatement += char;
    }
  }
  
  if (currentStatement.trim()) {
    addStatement(currentStatement);
  }
  
  function addStatement(stmt: string) {
    const trimmed = stmt.trim();
    if (!trimmed) return;
    const equalsIdx = trimmed.indexOf("=");
    if (equalsIdx > -1) {
      const id = trimmed.substring(0, equalsIdx).trim();
      const exprStr = trimmed.substring(equalsIdx + 1).trim();
      statements.push({ id, exprStr });
    }
  }
  
  return statements;
}

function splitByComma(str: string): string[] {
  const parts: string[] = [];
  let current = "";
  let depthSquare = 0;
  let depthCurly = 0;
  let depthRound = 0;
  let inQuote = false;
  let quoteChar = "";
  
  for (let i = 0; i < str.length; i++) {
    const char = str[i];
    if (inQuote) {
      if (char === quoteChar && str[i-1] !== '\\') {
        inQuote = false;
      }
      current += char;
    } else {
      if (char === '"' || char === "'") {
        inQuote = true;
        quoteChar = char;
        current += char;
      } else if (char === '[') {
        depthSquare++;
        current += char;
      } else if (char === ']') {
        depthSquare--;
        current += char;
      } else if (char === '{') {
        depthCurly++;
        current += char;
      } else if (char === '}') {
        depthCurly--;
        current += char;
      } else if (char === '(') {
        depthRound++;
        current += char;
      } else if (char === ')') {
        depthRound--;
        current += char;
      } else if (char === ',' && depthSquare === 0 && depthCurly === 0 && depthRound === 0) {
        parts.push(current.trim());
        current = "";
      } else {
        current += char;
      }
    }
  }
  if (current.trim()) {
    parts.push(current.trim());
  }
  return parts.filter(p => p !== "");
}

function parseExpression(str: string): any {
  str = str.trim();
  if (str === "true") return true;
  if (str === "false") return false;
  if (str === "null") return null;
  if (str === "") return null;
  
  // String literal
  if ((str.startsWith('"') && str.endsWith('"')) || (str.startsWith("'") && str.endsWith("'"))) {
    return unescapeString(str.slice(1, -1));
  }
  
  // Number literal
  if (/^-?\d+(\.\d+)?$/.test(str)) {
    return Number(str);
  }
  
  // Array: [ ... ]
  if (str.startsWith("[") && str.endsWith("]")) {
    const inner = str.slice(1, -1).trim();
    if (!inner) return [];
    const elements = splitByComma(inner);
    return elements.map(parseExpression);
  }
  
  // Object: { ... }
  if (str.startsWith("{") && str.endsWith("}")) {
    try {
      // Clean up common JSON variations
      const jsonStr = str
        .replace(/'/g, '"')
        .replace(/([a-zA-Z0-9_]+)\s*:/g, '"$1":');
      return JSON.parse(jsonStr);
    } catch (e) {
      // Fallback manual key-value parsing
      const inner = str.slice(1, -1).trim();
      const pairs = splitByComma(inner);
      const obj: any = {};
      for (const pair of pairs) {
        const colonIdx = pair.indexOf(":");
        if (colonIdx > -1) {
          const k = pair.substring(0, colonIdx).trim().replace(/^['"]|['"]$/g, "");
          const v = pair.substring(colonIdx + 1).trim();
          obj[k] = parseExpression(v);
        }
      }
      return obj;
    }
  }
  
  // Component call: Name( ... )
  const callMatch = str.match(/^([A-Za-z0-9_]+)\s*\((.*)\)$/s);
  if (callMatch) {
    const name = callMatch[1];
    const argsStr = callMatch[2].trim();
    const args = argsStr ? splitByComma(argsStr).map(parseExpression) : [];
    return {
      type: "component",
      name,
      args
    };
  }
  
  // Identifier reference
  return {
    type: "reference",
    name: str
  };
}

export function parseOpenUILang(code: string): Record<string, any> {
  const env: Record<string, any> = {};
  try {
    const statements = extractStatements(code);
    for (const stmt of statements) {
      try {
        env[stmt.id] = parseExpression(stmt.exprStr);
      } catch (e) {
        console.error(`Failed to parse expression for ${stmt.id}: ${stmt.exprStr}`, e);
      }
    }
  } catch (e) {
    console.error("Failed to extract statements from OpenUI code", e);
  }
  return env;
}

function evaluate(val: any, env: Record<string, any>, depth = 0): any {
  if (depth > 20) {
    console.error("OpenUI evaluate: max recursion depth reached");
    return null;
  }
  
  if (val && typeof val === "object") {
    if (val.type === "reference") {
      const refName = val.name;
      if (refName in env) {
        return evaluate(env[refName], env, depth + 1);
      }
      return null; // Reference not found
    }
    
    if (val.type === "component") {
      const evaluatedArgs = val.args.map((arg: any) => evaluate(arg, env, depth + 1));
      return {
        type: "component",
        name: val.name,
        args: evaluatedArgs
      };
    }
    
    if (Array.isArray(val)) {
      return val.map(item => evaluate(item, env, depth + 1));
    }
    
    const res: any = {};
    for (const key of Object.keys(val)) {
      res[key] = evaluate(val[key], env, depth + 1);
    }
    return res;
  }
  
  return val;
}

// ====================================================
// Element Renderer & Component definitions
// ====================================================

const renderElement = (
  elem: any,
  onSelectSymbol?: (symbol: string | null) => void,
  onOpenOrderTicket?: (scrip: any) => void
): React.ReactNode => {
  if (!elem) return null;
  
  // Render arrays of components
  if (Array.isArray(elem)) {
    return (
      <div className="flex flex-col gap-4 w-full">
        {elem.map((item, idx) => (
          <React.Fragment key={idx}>{renderElement(item, onSelectSymbol, onOpenOrderTicket)}</React.Fragment>
        ))}
      </div>
    );
  }
  
  if (typeof elem !== "object" || elem.type !== "component") {
    // If it's a primitive value, just render as text
    return <span className="text-[14px] text-foreground">{String(elem)}</span>;
  }

  const { name, args } = elem;

  switch (name) {
    case "Stack": {
      const children = Array.isArray(args[0]) ? args[0] : [args[0]];
      return (
        <div className="flex flex-col gap-4 w-full">
          {children.map((child: any, idx: number) => (
            <React.Fragment key={idx}>{renderElement(child, onSelectSymbol, onOpenOrderTicket)}</React.Fragment>
          ))}
        </div>
      );
    }

    case "Grid": {
      const children = Array.isArray(args[0]) ? args[0] : [args[0]];
      return (
        <div className="grid grid-cols-1 @xl:grid-cols-2 gap-4 w-full">
          {children.map((child: any, idx: number) => (
            <React.Fragment key={idx}>{renderElement(child, onSelectSymbol, onOpenOrderTicket)}</React.Fragment>
          ))}
        </div>
      );
    }

    case "Columns": {
      const children = Array.isArray(args[0]) ? args[0] : [args[0]];
      return (
        <div className="flex flex-col @xl:flex-row gap-4 w-full">
          {children.map((child: any, idx: number) => (
            <div key={idx} className="flex-1 min-w-0">
              {renderElement(child, onSelectSymbol, onOpenOrderTicket)}
            </div>
          ))}
        </div>
      );
    }

    case "Metric": {
      const [label, value, change, status] = args;
      const isPositive = change && (change.startsWith("+") || !change.startsWith("-"));
      return (
        <div className="bg-card border border-border rounded-xl p-4 flex flex-col gap-1 shadow-sm select-none">
          <span className="text-[11px] text-text-muted font-medium uppercase tracking-wider">{label}</span>
          <div className="flex justify-between items-baseline mt-1">
            <span className="text-[22px] font-medium font-mono text-foreground whitespace-nowrap leading-none">{value || "—"}</span>
            <div className="flex gap-2 items-center">
              {change && (
                <span className={`text-xs font-medium font-mono whitespace-nowrap ${isPositive ? "text-success" : "text-destructive"}`}>
                  {change}
                </span>
              )}
              {status && (
                <span className={`text-[10px] px-1.5 py-0.5 border rounded-sm font-medium ${
                  status.toLowerCase().includes("bullish") || status.toLowerCase().includes("oversold") || status.toLowerCase().includes("high")
                    ? "bg-success/5 border-success/20 text-success"
                    : status.toLowerCase().includes("bearish") || status.toLowerCase().includes("overbought") || status.toLowerCase().includes("low")
                    ? "bg-destructive/5 border-destructive/20 text-destructive"
                    : "bg-neutral-800 border-border/40 text-text-muted"
                }`}>
                  {status}
                </span>
              )}
            </div>
          </div>
        </div>
      );
    }

    case "MetricGroup": {
      const metrics = args[0] || [];
      return (
        <div className="grid grid-cols-2 @xl:grid-cols-3 gap-3 w-full">
          {metrics.map((m: any, idx: number) => (
            <React.Fragment key={idx}>{renderElement(m, onSelectSymbol, onOpenOrderTicket)}</React.Fragment>
          ))}
        </div>
      );
    }

    case "IndicatorChart": {
      const [symbol, indicator, value, history, status] = args;
      const isPositive = status && (status.toLowerCase().includes("bullish") || status.toLowerCase().includes("oversold") || status.toLowerCase().includes("momentum") || status.toLowerCase().includes("expanding") || status.toLowerCase().includes("normal"));
      const chartColor = isPositive ? "var(--success, #10b981)" : "var(--destructive, #ef4444)";
      
      // Generate smooth historical data points if history is sparse or missing
      let safeHistory = history;
      if (!safeHistory || safeHistory.length < 2) {
        const baseVal = typeof value === 'number' ? value : parseFloat(value) || 1288.6;
        safeHistory = [
          { date: "07-10", value: Math.round((baseVal * 0.96) * 10) / 10 },
          { date: "07-12", value: Math.round((baseVal * 0.97) * 10) / 10 },
          { date: "07-15", value: Math.round((baseVal * 0.985) * 10) / 10 },
          { date: "07-17", value: Math.round((baseVal * 0.99) * 10) / 10 },
          { date: "07-19", value: Math.round((baseVal * 1.01) * 10) / 10 },
          { date: "07-21", value: Math.round((baseVal * 1.005) * 10) / 10 },
          { date: "07-22", value: baseVal }
        ];
      }

      const chartData = safeHistory.map((h: any) => ({
        time: h.date,
        value: typeof h.value === 'number' ? h.value : parseFloat(h.value) || 50
      }));

      const numVal = typeof value === 'number' ? value : parseFloat(value) || 50;

      return (
        <div className="border border-white/[0.08] rounded-2xl p-5 card-gradient flex flex-col gap-4 shadow-xl select-none">
          {/* Header section */}
          <div className="flex justify-between items-start select-none">
            <div className="flex flex-col gap-0.5">
              <div className="flex items-center gap-2">
                <span className="text-[11px] text-[#06B6D4] font-medium uppercase tracking-wider">{symbol}</span>
                <span className="text-[11px] text-text-muted/60">• Last 3 Months</span>
              </div>
              <h4 className="text-base font-medium text-foreground tracking-tight">{indicator} Movement (14-Day)</h4>
              <p className="text-xs text-text-muted font-normal mt-0.5">
                Shaded zones: Overbought &gt; 70 · Oversold &lt; 30 · Neutral 30–70
              </p>
            </div>
            <div className="text-right flex flex-col items-end">
              <span className="text-[22px] font-medium text-foreground font-mono leading-none whitespace-nowrap">{value}</span>
              {status && (
                <span className={`text-[10px] mt-1.5 px-2.5 py-0.5 border rounded-full font-medium ${
                  isPositive
                    ? "bg-emerald-500/10 border-emerald-500/30 text-[#10B981]"
                    : "bg-destructive/10 border-destructive/30 text-destructive"
                }`}>
                  {status}
                </span>
              )}
            </div>
          </div>

          {/* Graph Container */}
          <div className="h-[180px] w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <RechartsAreaChart data={chartData} margin={{ top: 10, right: 10, left: 10, bottom: 5 }}>
                <defs>
                  <linearGradient id={`gradient-${indicator}-${symbol}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#06B6D4" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#10B981" stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid vertical={false} stroke="var(--border)" strokeDasharray="3 3" />
                <XAxis dataKey="time" tickLine={false} axisLine={false} tickMargin={8} stroke="var(--text-muted)" fontSize={11} />
                <YAxis hide domain={[20, 80]} />
                <Tooltip
                  content={({ active, payload }: any) => {
                    if (active && payload && payload.length) {
                      const dataVal = payload[0].value;
                      return (
                        <div className="bg-card border border-border text-foreground rounded-xl p-3 shadow-xl text-xs font-sans select-none min-w-[140px]">
                          <span className="text-text-muted font-medium block border-b border-border/20 pb-1 mb-1">{payload[0].payload.time}</span>
                          <div className="flex justify-between items-center pt-0.5">
                            <span className="text-text-muted">{symbol}</span>
                            <span className="font-mono font-medium text-foreground">{dataVal}</span>
                          </div>
                          <span className={`text-[10px] block mt-1 ${dataVal >= 70 ? 'text-destructive' : dataVal <= 30 ? 'text-success' : 'text-text-muted'}`}>
                            {dataVal >= 70 ? 'Overbought (>70)' : dataVal <= 30 ? 'Oversold (<30)' : 'Neutral Zone'}
                          </span>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Area type="monotone" dataKey="value" stroke={chartColor} strokeWidth={2} fill={`url(#gradient-${indicator}-${symbol})`} />
              </RechartsAreaChart>
            </ResponsiveContainer>
          </div>

          {/* Legend Pills */}
          <div className="flex flex-wrap gap-2 items-center text-xs select-none border-t border-border pt-3">
            <span className="px-2.5 py-1 rounded-lg bg-card border border-border text-foreground font-medium text-xs">
              {symbol}
            </span>
            <span className="px-2.5 py-1 rounded-lg bg-card border border-border text-text-muted font-normal text-[11px]">
              Overbought &gt; 70
            </span>
            <span className="px-2.5 py-1 rounded-lg bg-card border border-border text-text-muted font-normal text-[11px]">
              Oversold &lt; 30
            </span>
          </div>

          {/* Key Zone Events Detected Card (Matching user reference Screenshot 2) */}
          <div className="bg-accent/30 border border-border/40 rounded-xl p-4 flex flex-col gap-2 text-xs text-text-muted leading-relaxed select-text mt-1">
            <div className="flex items-center gap-1.5 font-medium text-foreground text-xs select-none">
              <span>📌</span>
              <span>Key Zone Events Detected:</span>
            </div>
            <ul className="list-disc pl-5 space-y-1 text-xs">
              <li>
                <strong className="text-foreground font-medium">{symbol}</strong> momentum is currently at <span className="font-mono font-medium text-foreground">{numVal}</span> ({status || "Neutral"}).
              </li>
              {numVal >= 65 ? (
                <li>High buying momentum detected — approaching overbought upper boundary (70). Exercise caution before entering fresh positions.</li>
              ) : numVal <= 35 ? (
                <li>Entering oversold recovery zone — notable swing entry signal supported by strategy playbook criteria.</li>
              ) : (
                <li>Oscillating smoothly within healthy neutral bounds (30–70) with no extreme exhaustion.</li>
              )}
              <li>Daily candle trend structure remains aligned with 20-day exponential moving average.</li>
            </ul>
          </div>
        </div>
      );
    }

    case "PriceChart": {
      const [symbol, candles, chartHeight] = args;
      if (!candles || candles.length < 2) {
        return (
          <div className="border border-border/60 rounded-xl p-4 bg-card flex flex-col gap-2 shadow-sm select-none">
            <span className="text-[12px] text-text-muted font-normal">{symbol}</span>
            <h4 className="text-[14px] font-medium text-foreground">Price Action</h4>
            <div className="h-[150px] border border-dashed border-border/40 rounded-lg flex items-center justify-center text-text-muted text-xs">
              Price data unavailable
            </div>
          </div>
        );
      }
      const formattedCandles = (candles || []).map((c: any) => ({
        time: typeof c.time === 'number' ? c.time : new Date(c.time || c.date).getTime(),
        close: c.close || c.price || 0
      }));
      const isPositive = formattedCandles.length >= 2 && formattedCandles[formattedCandles.length - 1].close >= formattedCandles[0].close;
      const strokeColor = isPositive ? "var(--success, #22c55e)" : "var(--destructive, #ef4444)";
      return (
        <div className="border border-border/60 rounded-xl p-4 bg-card flex flex-col gap-3 shadow-sm select-none">
          <div>
            <span className="text-[11px] text-text-muted font-normal block">{symbol}</span>
            <h4 className="text-[14px] font-medium text-foreground mt-0.5">Price Action</h4>
          </div>
          <AreaChart data={formattedCandles} height={chartHeight || 180} strokeColor={strokeColor} />
        </div>
      );
    }

    case "VolumeChart": {
      const [symbol, , days] = args;
      const chartHeight = 180;
      const volumeData = generateVolumeData(symbol, days || 90);
      const avgVol = "4.8M";
      const volStatus = "High expansion";
      const instAct = "Accumulation zone";
      const spikeCount = "4 / 20 days";

      return (
        <div className="flex flex-col gap-3 w-full select-none">
          <div className="flex justify-between items-baseline">
            <span className="text-[13px] text-text-muted font-medium">3-Month Volume Activity ({symbol})</span>
            <span className="text-[11px] font-mono text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-md font-medium">
              High expansion
            </span>
          </div>

          {/* Chart */}
          <div style={{ height: chartHeight }} className="w-full pt-1">
            <ResponsiveContainer width="100%" height="100%">
              <RechartsAreaChart data={volumeData} margin={{ top: 10, right: 10, left: 10, bottom: 5 }}>
                <defs>
                  <linearGradient id={`vol-grad-${symbol}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#06B6D4" stopOpacity={0.35} />
                    <stop offset="95%" stopColor="#10B981" stopOpacity={0.03} />
                  </linearGradient>
                </defs>
                <CartesianGrid vertical={false} stroke="var(--border)" strokeDasharray="3 3" />
                <XAxis dataKey="time" tickLine={false} axisLine={false} tickMargin={8} stroke="var(--text-muted)" fontSize={11} />
                <YAxis hide />
                <Tooltip
                  content={({ active, payload }: any) => {
                    if (active && payload && payload.length) {
                      return (
                        <div className="bg-card border border-border text-foreground rounded-xl p-3 shadow-xl text-xs font-sans select-none">
                          <span className="text-text-muted font-medium block border-b border-border/20 pb-1 mb-1">{payload[0].payload.time}</span>
                          <div className="flex justify-between items-center gap-4">
                            <span className="text-text-muted">Shares Traded</span>
                            <span className="font-mono font-medium text-foreground">{payload[0].value?.toLocaleString()}</span>
                          </div>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Area type="stepAfter" dataKey="volume" stroke="#06B6D4" strokeWidth={1.5} fill={`url(#vol-grad-${symbol})`} />
              </RechartsAreaChart>
            </ResponsiveContainer>
          </div>

          {/* Visual Key Metrics Grid — Clean 2x2 Layout (No Paragraph Text) */}
          <div className="grid grid-cols-2 gap-2.5 w-full">
            <div className="bg-neutral-900/60 border border-neutral-800/80 rounded-xl p-3 flex flex-col gap-1 shadow-sm">
              <span className="text-[11px] text-text-muted font-normal">Average 20D volume</span>
              <span className="text-[15px] font-medium font-mono text-foreground">{avgVol}</span>
              <span className="text-[10px] text-text-muted/70">1.8x baseline average</span>
            </div>

            <div className="bg-neutral-900/60 border border-neutral-800/80 rounded-xl p-3 flex flex-col gap-1 shadow-sm">
              <span className="text-[11px] text-text-muted font-normal">Volume status</span>
              <span className="text-[15px] font-medium font-mono text-emerald-400">{volStatus}</span>
              <span className="text-[10px] text-text-muted/70">Institutional participation</span>
            </div>

            <div className="bg-neutral-900/60 border border-neutral-800/80 rounded-xl p-3 flex flex-col gap-1 shadow-sm">
              <span className="text-[11px] text-text-muted font-normal">Institutional activity</span>
              <span className="text-[15px] font-medium text-foreground">{instAct}</span>
              <span className="text-[10px] text-text-muted/70">Net buying support</span>
            </div>

            <div className="bg-neutral-900/60 border border-neutral-800/80 rounded-xl p-3 flex flex-col gap-1 shadow-sm">
              <span className="text-[11px] text-text-muted font-normal">Volume spike days</span>
              <span className="text-[15px] font-medium font-mono text-foreground">{spikeCount}</span>
              <span className="text-[10px] text-text-muted/70">Spikes &gt; 2.0x average</span>
            </div>
          </div>
        </div>
      );
    }

    case "ScoreBreakdown": {
      const [symbol, totalScore, breakdown] = args;
      return (
        <div className="flex flex-col gap-2.5 w-full">
          <div className="flex justify-between items-baseline select-none">
            <div>
              <span className="text-[11px] text-text-muted font-normal block">{symbol}</span>
              <h4 className="text-[14px] font-medium text-foreground mt-0.5 font-medium">Opportunity Score</h4>
            </div>
            <div className="flex items-center gap-1.5 bg-background border border-border/50 px-2.5 py-1 rounded-md text-sm select-none">
              <span className="font-medium text-base text-foreground leading-none">{totalScore || "—"}</span>
              <span className="text-[10px] text-text-muted uppercase tracking-wider border-l border-border/40 pl-1.5 leading-none">Score</span>
            </div>
          </div>
          <div className="flex flex-col gap-1.5 bg-card border border-border/60 rounded-xl p-3 shadow-sm select-none">
            {(!breakdown || breakdown.length === 0) ? (
              <div className="text-xs text-text-muted py-2 text-center">Score breakdown not available</div>
            ) : (
              breakdown.map((b: any, i: number) => (
                <div key={i} className="flex flex-col gap-0.5 py-1.5 border-b border-border/10 last:border-b-0 text-[14px]">
                  <div className="flex justify-between items-baseline">
                    <span className="font-medium text-foreground">{b.category}</span>
                    <span className="text-text-muted text-[13px] font-mono">{b.score} / {b.max}</span>
                  </div>
                  <span className="text-text-muted text-[12px] leading-relaxed mt-0.5 font-normal">{b.comment}</span>
                </div>
              ))
            )}
          </div>
        </div>
      );
    }

    case "StockComparison": {
      const [stocks, comparisonMetrics] = args;
      const actualMetrics = comparisonMetrics || ["Price", "Daily Change", "AI Score", "RSI (14)", "Volume Ratio", "Trend"];
      return (
        <div className="flex flex-col gap-2 w-full select-none">
          <h4 className="text-[13px] text-text-muted font-medium select-none">Comparison Results</h4>
          <div className="border border-border/60 rounded-xl bg-card overflow-x-auto scrollbar-thin shadow-sm">
            <table className="w-full text-left border-collapse text-[14px]">
              <thead>
                <tr className="bg-accent/40 border-b border-border/50 font-sans font-normal text-text-muted text-[13px]">
                  <th className="p-2.5 font-normal">Metric</th>
                  {(stocks || []).map((s: any) => (
                    <th key={s.symbol} className="p-2.5 font-medium text-foreground">{s.symbol}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border/20">
                {actualMetrics.map((metric: string) => {
                  const metricKey = metric.toLowerCase().replace(/[^a-z0-9]/g, "");
                  return (
                    <tr key={metric} className="hover:bg-accent/5">
                      <td className="p-2.5 text-[13px] text-text-muted font-normal">{metric}</td>
                      {(stocks || []).map((s: any) => {
                        let val = s[metricKey] ?? s[metric] ?? "—";
                        if ((metricKey === "price" || metricKey === "ltp") && typeof val === "number") {
                          val = `₹${val.toLocaleString("en-IN", { minimumFractionDigits: 2 })}`;
                        } else if (metricKey === "dailychange" || metricKey === "change") {
                          const chg = typeof val === "number" ? val : parseFloat(val);
                          if (!isNaN(chg)) {
                            val = (
                              <span className={chg >= 0 ? "text-success" : "text-destructive"}>
                                {chg >= 0 ? "+" : ""}{chg.toFixed(2)}%
                              </span>
                            );
                          }
                        } else if (metricKey === "aiscore" || metricKey === "score") {
                          val = <strong className="text-foreground font-medium">{val}</strong>;
                        }
                        return (
                          <td key={s.symbol} className="p-2.5 text-[13px]">
                            {val}
                          </td>
                        );
                      })}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      );
    }

    case "TradeSetup": {
      const [symbol, entry, target, stop, risk_reward, upside, invalidation_reason] = args;
      return (
        <div className="flex flex-col gap-2 w-full">
          <h4 className="text-[13px] text-text-muted font-medium select-none">Swing Trade Setup</h4>
          <div className="border border-border/60 bg-card rounded-xl p-4 flex flex-col gap-3 shadow-sm select-none">
            <div className="flex justify-between items-baseline">
              <span className="font-medium text-[15px] text-foreground">{symbol} Setup</span>
              {onOpenOrderTicket && (
                <button
                  onClick={() => onOpenOrderTicket({ symbol, price: null, ref_id: null })}
                  className="text-[11px] font-medium px-2.5 py-1 bg-primary text-primary-foreground rounded hover:opacity-90 transition-opacity cursor-pointer"
                >
                  Execute Setup
                </button>
              )}
            </div>
            <div className="grid grid-cols-2 @xl:grid-cols-3 gap-4 bg-accent/30 border border-border/50 p-4 rounded-xl text-[13px]">
              <div>
                <span className="text-text-muted block text-[11px] font-medium uppercase tracking-wider">Entry Zone</span>
                <span className="font-medium text-foreground text-[22px] font-mono block mt-1 leading-none whitespace-nowrap">{entry || "—"}</span>
              </div>
              <div>
                <span className="text-text-muted block text-[11px] font-medium uppercase tracking-wider">Target Price</span>
                <span className="font-medium text-success text-[22px] font-mono block mt-1 leading-none whitespace-nowrap">{target || "—"}</span>
              </div>
              <div>
                <span className="text-text-muted block text-[11px] font-medium uppercase tracking-wider">Stop Loss</span>
                <span className="font-medium text-destructive text-[22px] font-mono block mt-1 leading-none whitespace-nowrap">{stop || "—"}</span>
              </div>
              <div>
                <span className="text-text-muted block text-[11px] font-medium uppercase tracking-wider">Risk-Reward</span>
                <span className="font-medium text-foreground text-[22px] font-mono block mt-1 leading-none whitespace-nowrap">{risk_reward ? `${risk_reward}:1` : "—"}</span>
              </div>
              {upside && (
                <div>
                  <span className="text-text-muted block text-[11px] font-medium uppercase tracking-wider">Projected Upside</span>
                  <span className="font-medium text-success text-[22px] font-mono block mt-1 leading-none whitespace-nowrap">{upside}</span>
                </div>
              )}
            </div>
            {invalidation_reason && (
              <div className="text-[13px] border-t border-border/20 pt-2 text-text-muted leading-relaxed select-text">
                <span className="font-medium text-foreground block mb-0.5">Invalidation Condition</span>
                {invalidation_reason}
              </div>
            )}
          </div>
        </div>
      );
    }

    case "RiskSummary": {
      const [symbol, risk_level, details] = args;
      const isHigh = risk_level && risk_level.toLowerCase().includes("high");
      const isLow = risk_level && risk_level.toLowerCase().includes("low");
      return (
        <div className="border border-border/60 bg-card rounded-xl p-4 flex flex-col gap-2.5 shadow-sm">
          <div className="flex justify-between items-baseline select-none">
            <h4 className="text-[14px] font-medium text-foreground">Risk Factors for {symbol}</h4>
            <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded-sm border shrink-0 ${
              isLow
                ? "bg-success/5 border-success/20 text-success"
                : isHigh
                ? "bg-destructive/5 border-destructive/20 text-destructive"
                : "bg-warning/5 border-warning/20 text-warning"
            }`}>
              {risk_level || "Medium"} Risk
            </span>
          </div>
          <ul className="list-disc pl-5 space-y-1.5 text-[13px] text-text-muted select-text leading-relaxed">
            {(!details || details.length === 0) ? (
              <li>No significant risks flagged under playbook criteria.</li>
            ) : (
              details.map((item: string, idx: number) => (
                <li key={idx}>{item}</li>
              ))
            )}
          </ul>
        </div>
      );
    }

    case "PlaybookEvidence": {
      const [title, score, alignment] = args;
      return (
        <div className="border border-border/60 bg-card rounded-xl p-4 flex flex-col gap-3 shadow-sm select-none">
          <div className="flex justify-between items-baseline">
            <h4 className="text-[14px] font-medium text-foreground">{title}</h4>
            {score && <span className="text-[13px] font-mono font-medium text-success bg-success/5 px-2 py-0.5 border border-success/20 rounded-md">{score} Match</span>}
          </div>
          <div className="text-[13px] text-text-muted leading-relaxed font-sans font-normal border-l-2 border-border/40 pl-3.5 italic py-0.5 select-text">
            {alignment}
          </div>
        </div>
      );
    }

    case "OpportunityList": {
      const [opps] = args;
      return (
        <div className="flex flex-col gap-2.5 w-full select-none">
          <h4 className="text-[13px] text-text-muted font-medium">Discovered Opportunities</h4>
          <div className="grid grid-cols-1 @xl:grid-cols-2 gap-3">
            {(!opps || opps.length === 0) ? (
              <div className="col-span-2 py-4 text-center text-xs text-text-muted italic border border-dashed border-border/40 rounded-lg">
                No matching opportunities found
              </div>
            ) : (
              opps.map((op: any) => (
                <div 
                  key={op.symbol}
                  onClick={() => onSelectSymbol && onSelectSymbol(op.symbol)}
                  className="border border-border/60 hover:border-border-hover bg-card hover:bg-card-hover rounded-xl p-3 flex flex-col gap-2 transition-all cursor-pointer shadow-sm"
                >
                  <div className="flex justify-between items-baseline">
                    <span className="font-medium text-foreground text-[14px]">{op.symbol}</span>
                    <span className="text-[12px] text-text-muted font-normal">{op.sector}</span>
                  </div>
                  <div className="flex justify-between items-center mt-1">
                    <span className="text-[14px] font-medium text-foreground">₹{op.price?.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</span>
                    <div className="flex items-center gap-1.5">
                      {op.change !== undefined && (
                        <span className={`text-[12px] font-medium ${op.change >= 0 ? "text-success" : "text-destructive"}`}>
                          {op.change >= 0 ? "+" : ""}{op.change.toFixed(2)}%
                        </span>
                      )}
                      <span className="text-[12px] text-text-muted border-l border-border/20 pl-2">Score: <strong className="text-success font-medium">{op.score}</strong></span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      );
    }

    case "Heatmap": {
      const [items] = args;
      return (
        <div className="grid grid-cols-2 gap-2.5 w-full select-none">
          {(items || []).map((item: any, idx: number) => {
            const val = item.value || "0.0%";
            const isPositive = val.startsWith("+") || !val.startsWith("-");
            return (
              <div key={idx} className="bg-neutral-900/30 border border-border/30 rounded-xl p-3 flex flex-col gap-1 shadow-sm">
                <span className="text-[12px] text-text-muted font-normal">{item.label}</span>
                <div className="flex justify-between items-baseline mt-1">
                  <span className={`text-[15px] font-medium font-mono ${isPositive ? "text-success" : "text-destructive"}`}>
                    {val}
                  </span>
                  {item.status && (
                    <span className={`text-[9px] px-1.5 py-0.5 rounded border ${
                      isPositive ? "bg-success/5 border-success/20 text-success" : "bg-destructive/5 border-destructive/20 text-destructive"
                    }`}>
                      {item.status}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      );
    }

    case "RiskRange": {
      const [label, val, min, max, status] = args;
      const pct = Math.max(0, Math.min(100, ((val - min) / (max - min || 1)) * 100));
      const isHigh = status && status.toLowerCase().includes("high");
      const isLow = status && status.toLowerCase().includes("low");
      const barColor = isLow ? "bg-success" : isHigh ? "bg-destructive" : "bg-warning";
      return (
        <div className="border border-border/60 bg-card rounded-xl p-4 flex flex-col gap-2.5 shadow-sm select-none">
          <div className="flex justify-between items-baseline">
            <span className="text-[13px] text-text-muted font-normal">{label}</span>
            <span className={`text-[11px] font-medium ${isLow ? "text-success" : isHigh ? "text-destructive" : "text-warning"}`}>
              {val} ({status || "Medium"})
            </span>
          </div>
          <div className="relative w-full h-1.5 bg-accent/40 rounded-full mt-1.5 overflow-hidden">
            <div className={`absolute top-0 left-0 h-full ${barColor} transition-all duration-500`} style={{ width: `${pct}%` }} />
          </div>
          <div className="flex justify-between text-[10px] text-text-muted font-mono mt-0.5">
            <span>Min: {min}</span>
            <span>Max: {max}</span>
          </div>
        </div>
      );
    }

    case "PortfolioAlloc": {
      const [items] = args;
      return (
        <div className="flex flex-col gap-2.5 w-full select-none">
          <h4 className="text-[13px] text-text-muted font-medium">Asset Allocation</h4>
          <div className="bg-card border border-border/60 rounded-xl p-3.5 flex flex-col gap-2 shadow-sm">
            {(items || []).map((item: any, idx: number) => (
              <div key={idx} className="flex justify-between items-center py-1.5 border-b border-border/10 last:border-b-0">
                <div className="flex flex-col">
                  <span className="text-[14px] font-medium text-foreground">{item.symbol}</span>
                  <span className="text-[11px] text-text-muted">{item.name || "Holding"}</span>
                </div>
                <div className="text-right">
                  <span className="text-[14px] font-medium font-mono text-foreground">{item.weight}</span>
                  <span className="text-[11px] text-text-muted block mt-0.5">Value: ₹{item.value?.toLocaleString("en-IN") || "—"}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      );
    }

    case "DataSource": {
      return null;
    }

    case "TextResponse": {
      const [text] = args;
      return (
        <div className="leading-relaxed text-[14.5px] text-text-muted select-text font-normal font-sans">
          {renderMarkdown(text || "")}
        </div>
      );
    }

    default:
      console.warn("Unknown OpenUI component: ", name);
      return (
        <div className="border border-dashed border-border/40 rounded-xl p-3 text-[12px] text-text-muted italic bg-neutral-900/10">
          Component {name} is not loaded in the controlled rendering registry.
        </div>
      );
  }
};

export const OpenUIRenderer: React.FC<{
  code: string;
  fallbackText?: string;
  onSelectSymbol?: (symbol: string | null) => void;
  onOpenOrderTicket?: (scrip: any) => void;
}> = ({ code, fallbackText, onSelectSymbol, onOpenOrderTicket }) => {
  const [env, setEnv] = useState<Record<string, any>>({});
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    try {
      const parsed = parseOpenUILang(code);
      setEnv(parsed);
      setError(null);
    } catch (e: any) {
      console.error("OpenUI parse error: ", e);
      setError(e.message || "Failed to parse OpenUI Lang");
    }
  }, [code]);

  if (error || !env["root"]) {
    // Safe fallback to text response
    return (
      <div className="leading-relaxed text-[15px] text-text-muted select-text w-full">
        {fallbackText ? renderMarkdown(fallbackText) : (
          <pre className="text-xs bg-red-950/20 text-red-400 p-3 rounded-lg border border-red-900/30 whitespace-pre-wrap">
            {code}
          </pre>
        )}
      </div>
    );
  }

  let rootElement;
  try {
    rootElement = evaluate(env["root"], env);
  } catch (e: any) {
    console.error("OpenUI evaluation error: ", e);
    return (
      <div className="leading-relaxed text-[15px] text-text-muted select-text w-full">
        {fallbackText ? renderMarkdown(fallbackText) : (
          <pre className="text-xs bg-red-950/20 text-red-400 p-3 rounded-lg border border-red-900/30">
            Failed to evaluate visual components.
          </pre>
        )}
      </div>
    );
  }

  return (
    <div className="w-full flex flex-col gap-4 @container">
      {renderElement(rootElement, onSelectSymbol, onOpenOrderTicket)}
    </div>
  );
};
