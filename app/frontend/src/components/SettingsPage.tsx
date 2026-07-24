import React, { useState, useEffect } from "react"
import { Shield, ArrowsClockwise, ComputerTower, Key, Database, SignOut, Radio, Warning, Spinner, BookOpen, Globe, CheckCircle } from "@phosphor-icons/react"

interface SettingsPageProps {
  onToggleMockMode: () => void
  onClearCredentials: () => void
  playbookStats?: { files: string[], chunks_count: number, sources?: any[] }
  onOpenUploader?: () => void
  onOpenSyncModal?: () => void
}

interface YFinanceHealth {
  status: "healthy" | "unhealthy" | "rate_limited" | "unknown"
  last_check: string | null
  error: string | null
  consecutive_failures: number
}

interface EndpointValidation {
  success: boolean
  endpoints: {
    funds: "OK" | "FAILED" | "UNKNOWN"
    holdings: "OK" | "FAILED" | "UNKNOWN"
    positions: "OK" | "FAILED" | "UNKNOWN"
  }
  errors?: string[]
}

interface ProviderStats {
  name: string
  status: string
  last_success: string | null
  last_failure: string | null
  request_count: number
  rate_limited: boolean
}

interface SettingsStats {
  yfinance: YFinanceHealth
  providers?: Record<string, ProviderStats>
  nubra: {
    authenticated: boolean
    mock_mode: boolean
    phone: string | null
    device_id: string
    validation: EndpointValidation
  }
  knowledge_base: {
    total_sources: number
    total_chunks: number
    pdf_count: number
    url_count: number
  }
}

export const SettingsPage: React.FC<SettingsPageProps> = ({ onToggleMockMode, onClearCredentials, playbookStats, onOpenUploader, onOpenSyncModal }) => {
  const [stats, setStats] = useState<SettingsStats | null>(null)
  const [loading, setLoading] = useState<boolean>(true)
  const [refreshing, setRefreshing] = useState<boolean>(false)

  const [backendUrl, setBackendUrl] = useState(() => localStorage.getItem("stalk_market_backend_url") || "")
  const [testStatus, setTestStatus] = useState<"idle" | "testing" | "success" | "failed">("idle")
  const [testError, setTestError] = useState<string | null>(null)

  const handleSaveBackendUrl = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value
    setBackendUrl(val)
    localStorage.setItem("stalk_market_backend_url", val.trim())
    setTestStatus("idle")
    setTestError(null)
  }

  const handleTestConnection = async () => {
    setTestStatus("testing")
    setTestError(null)
    const targetUrl = (backendUrl.trim() || "http://127.0.0.1:8000").replace(/\/$/, "") + "/api/auth/status"
    try {
      const response = await fetch(targetUrl, {
        headers: { 'Bypass-Tunnel-Reminder': 'true' }
      })
      if (response.ok) {
        setTestStatus("success")
      } else {
        throw new Error(`HTTP ${response.status}`)
      }
    } catch (e: any) {
      setTestStatus("failed")
      setTestError(e.message || "Failed to connect to backend server")
    }
  }

  const fetchSettingsStats = async () => {
    try {
      const response = await fetch("/api/settings/stats")
      const data = await response.json()
      setStats(data)
    } catch (e) {
      console.error("Failed to load settings stats", e)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => {
    fetchSettingsStats()
  }, [])

  const handleRefresh = () => {
    setRefreshing(true)
    fetchSettingsStats()
  }

  const handleToggleMock = async () => {
    if (!stats) return
    onToggleMockMode()
    // Optimistic state update locally
    setStats(prev => {
      if (!prev) return null
      return {
        ...prev,
        nubra: {
          ...prev.nubra,
          mock_mode: !prev.nubra.mock_mode
        }
      }
    })
    // Re-fetch in a brief moment to get updated backend state
    setTimeout(fetchSettingsStats, 400)
  }

  const handleResetSession = async () => {
    if (confirm("Are you sure you want to clear credentials and reset session?")) {
      onClearCredentials()
      setTimeout(fetchSettingsStats, 400)
    }
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[300px] text-text-muted gap-2">
        <Spinner size={32} className="animate-spin text-foreground" weight="regular" />
        <span className="text-xs">Loading system configurations...</span>
      </div>
    )
  }

  const yf = stats?.yfinance
  const nb = stats?.nubra
  const kb = stats?.knowledge_base

  return (
    <div className="w-full max-w-5xl px-4">
      {/* Page Header */}
      <div className="mb-6 flex items-center justify-between border-b border-border pb-4">
        <div>
          <h1 className="text-xl font-bold text-foreground">Workspace Settings</h1>
          <p className="text-xs text-text-muted mt-1">
            Monitor API gateways, connection states, and check database statistics.
          </p>
        </div>
        <button
          onClick={handleRefresh}
          disabled={refreshing}
          className="btn btn-secondary btn-sm gap-1.5"
        >
          <ArrowsClockwise size={14} className={`${refreshing ? "animate-spin text-primary" : ""}`} weight="regular" />
          Refresh Status
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Left Column: API Gateways */}
        <div className="flex flex-col gap-6">
          {/* Card 1: Yahoo Finance Gateway */}
          <div className="bg-card border border-border rounded-2xl p-5 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-accent rounded-xl text-primary">
                  <ComputerTower size={16} weight="regular" />
                </div>
                <div>
                  <h2 className="text-xs font-bold text-foreground uppercase tracking-wider">Yahoo Finance Gateway</h2>
                  <span className="text-[10px] text-text-muted block mt-0.5">Live quotes and historical charts feed</span>
                </div>
              </div>

              {/* Status Badge */}
              <span
                className={`text-[9px] font-bold px-2 py-0.5 rounded-sm border flex items-center gap-1 ${
                  yf?.status === "healthy"
                    ? "bg-success/10 border-success/20 text-success"
                    : yf?.status === "rate_limited"
                    ? "bg-warning/10 border-warning/20 text-warning"
                    : "bg-destructive/10 border-destructive/20 text-destructive"
                }`}
              >
                <Radio size={10} className={`${yf?.status === "healthy" ? "animate-pulse" : ""}`} weight="regular" />
                {yf?.status === "healthy"
                  ? "Healthy"
                  : yf?.status === "rate_limited"
                  ? "Rate Limited (Mock Fallback)"
                  : "Unhealthy"}
              </span>
            </div>

            <div className="flex flex-col gap-2 font-mono text-[11px] bg-background/30 border border-border/60 rounded-xl p-3 mb-3">
              <div className="flex justify-between">
                <span className="text-text-muted">Last Checked:</span>
                <span className="text-foreground font-bold">{yf?.last_check || "Never"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-text-muted">Gateway Status:</span>
                <span className="text-foreground font-bold">{yf?.status === "healthy" ? "Online" : "Circuit Breaker Active"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-text-muted">Consecutive Failures:</span>
                <span className="text-foreground font-bold">{yf?.consecutive_failures}</span>
              </div>
            </div>

            {yf?.error && (
              <div className="p-3 bg-destructive/5 border border-destructive/20 text-destructive rounded-xl text-[10px] leading-relaxed flex gap-2">
                <Warning size={16} className="shrink-0 mt-0.5" weight="regular" />
                <span>{yf.error}</span>
              </div>
            )}
          </div>

          {/* Card 1.5: Market Data Providers */}
          {stats?.providers && (
            <div className="bg-card border border-border rounded-2xl p-5 shadow-sm">
              <div className="flex items-center gap-2.5 border-b border-border pb-3 mb-4">
                <div className="p-2 bg-accent rounded-xl text-primary">
                  <ComputerTower size={16} weight="regular" />
                </div>
                <div>
                  <h2 className="text-xs font-bold text-foreground uppercase tracking-wider">Market Data Providers</h2>
                  <span className="text-[10px] text-text-muted block mt-0.5">Multi-tier provider status & statistics</span>
                </div>
              </div>
              
              <div className="flex flex-col gap-3">
                {Object.entries(stats.providers).map(([key, provider]: [string, any]) => (
                  <div key={key} className="border border-border/60 rounded-xl p-3 bg-background/30 flex flex-col gap-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-foreground">{provider.name}</span>
                      <span
                        className={`text-[9px] font-bold px-2 py-0.5 rounded-sm border ${
                          provider.status === "Healthy"
                            ? "bg-success/10 border-success/20 text-success"
                            : provider.status.includes("Rate Limited") || provider.rate_limited
                            ? "bg-warning/10 border-warning/20 text-warning"
                            : "bg-destructive/10 border-destructive/20 text-destructive"
                        }`}
                      >
                        {provider.status}
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 font-mono text-[10px] text-text-muted leading-relaxed">
                      <div className="flex justify-between">
                        <span>Last Success:</span>
                        <span className="text-foreground font-semibold">{provider.last_success || "Never"}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Last Failure:</span>
                        <span className="text-foreground font-semibold">{provider.last_failure || "None"}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Requests:</span>
                        <span className="text-foreground font-semibold">{provider.request_count}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Rate Limited:</span>
                        <span className="text-foreground font-semibold">{provider.rate_limited ? "YES" : "NO"}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Card 1.8: Custom Backend Gateway */}
          <div className="bg-card border border-border rounded-2xl p-5 shadow-sm">
            <div className="flex items-center gap-2.5 border-b border-border pb-3 mb-4">
              <div className="p-2 bg-accent rounded-xl text-primary">
                <Globe size={16} weight="regular" />
              </div>
              <div>
                <h2 className="text-xs font-bold text-foreground uppercase tracking-wider">Custom Backend Gateway</h2>
                <span className="text-[10px] text-text-muted block mt-0.5">Route API queries to a hosted or local backend</span>
              </div>
            </div>

            <div className="flex flex-col gap-3">
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-bold text-text-muted uppercase tracking-wider">Backend API Base URL</label>
                <input
                  type="text"
                  value={backendUrl}
                  onChange={handleSaveBackendUrl}
                  placeholder="https://your-backend.onrender.com or http://localhost:8000"
                  className="bg-background border border-border/80 rounded-xl px-3 py-2 text-xs font-mono focus:outline-none focus:border-border text-foreground w-full"
                />
                <span className="text-[9px] text-text-muted leading-normal">
                  Leave empty to default to your locally running backend (`http://127.0.0.1:8000`).
                </span>
              </div>

              <div className="flex gap-2.5 mt-2">
                <button
                  onClick={handleTestConnection}
                  disabled={testStatus === "testing"}
                  className="btn btn-secondary btn-sm flex-1 font-semibold cursor-pointer"
                >
                  {testStatus === "testing" ? "Testing..." : "Test Connection"}
                </button>
                {testStatus === "success" && (
                  <div className="flex items-center gap-1.5 text-success text-[10px] font-medium px-2">
                    <CheckCircle size={18} className="text-success" weight="regular" />
                    <span>Connected</span>
                  </div>
                )}
                {testStatus === "failed" && (
                  <div className="flex items-center gap-1.5 text-destructive text-[10px] font-medium px-2">
                    <Warning size={18} weight="regular" />
                    <span>Failed</span>
                  </div>
                )}
              </div>

              {testError && (
                <div className="p-2 bg-destructive/5 border border-destructive/20 text-destructive rounded-xl text-[9px] font-mono leading-relaxed mt-1">
                  Error: {testError}
                </div>
              )}
            </div>
          </div>

          {/* Card 2: Nubra API Gateway */}
          <div className="bg-card border border-border rounded-2xl p-5 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-accent rounded-xl text-primary">
                  <Key size={16} weight="regular" />
                </div>
                <div>
                  <h2 className="text-xs font-bold text-foreground uppercase tracking-wider">Nubra Broker API Gateway</h2>
                  <span className="text-[10px] text-text-muted block mt-0.5">Live funds, holdings, and order placement</span>
                </div>
              </div>

              {/* Status Badge */}
              <span
                className={`text-[9px] font-bold px-2 py-0.5 rounded-sm border ${
                  nb?.authenticated
                    ? "bg-success/10 border-success/20 text-success"
                    : "bg-destructive/10 border-destructive/20 text-destructive"
                }`}
              >
                {nb?.authenticated ? "Synced" : "Disconnected"}
              </span>
            </div>

            <div className="flex flex-col gap-2 font-mono text-[11px] bg-background/30 border border-border/60 rounded-xl p-3 mb-4">
              <div className="flex justify-between">
                <span className="text-text-muted">Authentication:</span>
                <span className="text-foreground font-bold">{nb?.authenticated ? "Authorized Session" : "No Session"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-text-muted">Synced Phone:</span>
                <span className="text-foreground font-bold">{nb?.phone ? `+91 ${nb.phone.replace(/.(?=.{4})/g, '*')}` : "None"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-text-muted">API Mode:</span>
                <span className="text-foreground font-bold">{nb?.mock_mode ? "Sandbox (Mock Data)" : "UAT Live Brokerage"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-text-muted">Device Identifier:</span>
                <span className="text-foreground font-bold">{nb?.device_id}</span>
              </div>
            </div>

            {/* Endpoint validation status check list */}
            {nb?.authenticated && nb.validation && nb.validation.endpoints && (
              <div className="mb-4">
                <span className="text-[10px] font-bold text-text-muted uppercase tracking-wider mb-2 block">Endpoint Gateway Sync Check</span>
                <div className="grid grid-cols-3 gap-2">
                  {Object.entries(nb.validation.endpoints).map(([ep, status]) => (
                    <div
                      key={ep}
                      className={`border rounded-xl p-2 text-center flex flex-col items-center gap-1.5 shadow-sm ${
                        status === "OK"
                          ? "bg-success/5 border-success/20 text-success"
                          : status === "FAILED"
                          ? "bg-destructive/5 border-destructive/20 text-destructive"
                          : "bg-background border-border text-text-muted"
                      }`}
                    >
                      <span className="text-[9px] font-bold uppercase tracking-wider">{ep}</span>
                      <span className="text-[10px] font-bold font-mono">{status}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

             {/* Toggle and Clear Actions */}
            <div className="flex flex-col gap-3 border-t border-border pt-4">
              <div className="flex items-center justify-between text-xs">
                <div className="flex flex-col gap-0.5">
                  <span className="font-bold text-foreground">Toggle Mock Mode</span>
                  <span className="text-[10px] text-text-muted">Run the workspace with sandbox fallback datasets</span>
                </div>
                <button
                  onClick={handleToggleMock}
                  className={`w-9 h-5 rounded-full p-0.5 transition-colors cursor-pointer relative flex items-center ${
                    nb?.mock_mode ? 'bg-white' : 'bg-border'
                  }`}
                >
                  <div
                    className={`w-4 h-4 rounded-full transition-transform ${
                      nb?.mock_mode ? 'translate-x-4 bg-black' : 'translate-x-0 bg-card'
                    }`}
                  />
                </button>
              </div>

              <div className="flex flex-col gap-2 mt-2">
                <button
                  onClick={onOpenSyncModal}
                  className={`btn btn-md w-full font-semibold cursor-pointer flex items-center justify-center gap-1.5 ${
                    nb?.authenticated ? 'btn-secondary border-border' : 'btn-primary'
                  }`}
                >
                  <ArrowsClockwise size={16} weight="regular" />
                  {nb?.authenticated ? "Sync Live Brokerage" : "Sync Nubra Brokerage"}
                </button>
              </div>

              {nb?.authenticated && (
                <button
                  onClick={handleResetSession}
                  className="btn btn-secondary btn-md w-full text-destructive border-destructive/35 hover:bg-destructive/5 cursor-pointer font-bold mt-2"
                >
                  <SignOut size={16} className="mr-1.5" weight="regular" />
                  Clear Session & Disconnect
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Database Statistics */}
        <div className="flex flex-col gap-6">
          {/* Card 3: RAG Knowledge Base Database */}
          <div className="bg-card border border-border rounded-card p-4 flex flex-col justify-between h-full">
            <div>
              <div className="flex items-center gap-2.5 border-b border-border pb-3 mb-4">
                <div className="p-2 bg-accent rounded text-primary">
                  <Database size={16} weight="regular" />
                </div>
                <div>
                  <h2 className="text-xs font-bold text-foreground uppercase tracking-wider">Playbook Knowledge Base</h2>
                  <span className="text-[10px] text-text-muted block mt-0.5">Local vector DB chunk count and semantic sources</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-4">
                <div className="bg-background/40 border border-border rounded p-2 flex flex-col justify-center">
                  <span className="text-[9px] font-mono font-medium text-text-muted uppercase">Strategy Chunks</span>
                  <span className="text-base font-medium text-foreground mt-1 font-mono">{kb?.total_chunks || 0}</span>
                  <span className="text-[9px] text-text-muted mt-0.5">Embeddings stored</span>
                </div>
                <div className="bg-background/40 border border-border rounded p-2 flex flex-col justify-center">
                  <span className="text-[9px] font-mono font-medium text-text-muted uppercase">Knowledge Sources</span>
                  <span className="text-base font-medium text-foreground mt-1 font-mono">{kb?.total_sources || 0}</span>
                  <span className="text-[9px] text-text-muted mt-0.5">Total documents/URLs</span>
                </div>
              </div>

              <div className="flex flex-col gap-2 text-xs text-text-muted border-t border-border pt-3">
                <div className="flex justify-between items-center">
                  <span className="font-normal">Indexed PDF/TXT Files:</span>
                  <span className="font-medium text-foreground font-mono bg-accent px-1.5 py-0.2 rounded border border-border">
                    {kb?.pdf_count || 0}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="font-normal">Indexed Crawled URLs:</span>
                  <span className="font-medium text-foreground font-mono bg-accent px-1.5 py-0.2 rounded border border-border">
                    {kb?.url_count || 0}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="font-normal">Vector Dimension:</span>
                  <span className="font-medium text-foreground font-mono">768 (models/text-embedding-004)</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="font-normal">Storage Location:</span>
                  <span className="font-mono text-[10px] text-foreground">db/vector_store.json</span>
                </div>
              </div>

              {/* Research settings active knowledge list */}
              <div className="mt-4 border-t border-border pt-3">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-[10px] font-bold text-text-muted uppercase tracking-wider block">
                    Active Knowledge Sources ({playbookStats?.sources?.length || 0})
                  </span>
                  {onOpenUploader && (
                    <button 
                      onClick={onOpenUploader}
                      className="text-[9px] font-medium text-foreground hover:underline cursor-pointer"
                    >
                      + Add Source
                    </button>
                  )}
                </div>
                <div className="flex flex-col gap-1.5 max-h-48 overflow-y-auto pr-1">
                  {playbookStats?.sources && playbookStats.sources.length > 0 ? (
                    playbookStats.sources.map((src: any) => (
                      <div 
                        key={src.source_id}
                        className="p-2 flex items-center justify-between bg-background/25 border border-border/80 rounded"
                      >
                        <div className="flex items-center gap-2 truncate">
                          <BookOpen size={14} className="text-text-muted shrink-0" weight="regular" />
                          <span className="truncate text-foreground font-normal text-xs" title={src.name}>{src.name}</span>
                        </div>
                        <span className="text-[9px] font-mono font-medium bg-accent text-text-muted px-1 rounded border border-border shrink-0 ml-2">
                          {src.status || "Indexed"}
                        </span>
                      </div>
                    ))
                  ) : (
                    <span className="text-[10px] text-text-muted italic px-1 block mt-1">No playbook training files indexed. Upload PDFs or links in the Playbooks tab.</span>
                  )}
                </div>
              </div>
            </div>

            <div className="p-3 bg-accent border border-border/60 text-foreground rounded text-[10px] leading-relaxed flex gap-2.5 mt-4">
              <Shield size={18} className="text-foreground shrink-0 mt-0.5" weight="regular" />
              <span>
                All embeddings are generated using local/secured API integrations. Strategy guidelines are parsed and stored locally in your workspace cache directory.
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
