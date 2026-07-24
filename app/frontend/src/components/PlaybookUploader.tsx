import React, { useState, useEffect } from "react"
import { CloudArrowUp, FileText, CheckCircle, Warning, Spinner, Globe, LinkSimple, Calendar, Database, CaretDown, CaretUp } from "@phosphor-icons/react"

interface PlaybookUploaderProps {
  onUploadSuccess: () => void
}

interface KnowledgeSource {
  source_id: string
  name: string
  type: "PDF" | "URL"
  status: "Indexed" | "Pending" | "Failed"
  last_indexed: string
  chunks_count: number
  summary: string
}

export const PlaybookUploader: React.FC<PlaybookUploaderProps> = ({ onUploadSuccess }) => {
  const [dragActive, setDragActive] = useState<boolean>(false)
  const [uploading, setUploading] = useState<boolean>(false)
  const [urlInput, setUrlInput] = useState<string>("")
  const [urlIngesting, setUrlIngesting] = useState<boolean>(false)
  const [successMsg, setSuccessMsg] = useState<string | null>(null)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [sources, setSources] = useState<KnowledgeSource[]>([])
  const [chunksCount, setChunksCount] = useState<number>(0)
  const [expandedSourceId, setExpandedSourceId] = useState<string | null>(null)

  const fetchPlaybooksList = async () => {
    try {
      const response = await fetch("/api/playbook/list")
      const data = await response.json()
      setSources(data.sources || [])
      setChunksCount(data.chunks_count || 0)
    } catch (e) {
      console.error("Failed to load playbooks list", e)
    }
  }

  useEffect(() => {
    fetchPlaybooksList()
  }, [])

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true)
    } else if (e.type === "dragleave") {
      setDragActive(false)
    }
  }

  const uploadFile = async (file: File) => {
    setUploading(true)
    setErrorMsg(null)
    setSuccessMsg(null)

    const formData = new FormData()
    formData.append("file", file)

    try {
      const response = await fetch("/api/playbook/upload", {
        method: "POST",
        body: formData,
      })
      const data = await response.json()
      if (data.success) {
        setSuccessMsg(`Uploaded and parsed '${file.name}' into ${data.chunks_count} strategy rules!`)
        fetchPlaybooksList()
        onUploadSuccess()
      } else {
        setErrorMsg(data.message || "Failed to parse document")
      }
    } catch (e) {
      setErrorMsg("Failed to upload document to backend uploader")
    } finally {
      setUploading(false)
    }
  }

  const handleURLIngest = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!urlInput.trim()) return

    setUrlIngesting(true)
    setErrorMsg(null)
    setSuccessMsg(null)

    try {
      const response = await fetch("/api/playbook/upload-url", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: urlInput }),
      })
      const data = await response.json()
      if (data.success) {
        setSuccessMsg(`Crawled and indexed URL successfully! Chunked into ${data.chunks_count} rules.`)
        setUrlInput("")
        fetchPlaybooksList()
        onUploadSuccess()
      } else {
        setErrorMsg(data.message || "Failed to index web page")
      }
    } catch (e) {
      setErrorMsg("Failed to ingest URL. Check your internet connection or URL structure.")
    } finally {
      setUrlIngesting(false)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      uploadFile(e.dataTransfer.files[0])
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault()
    if (e.target.files && e.target.files[0]) {
      uploadFile(e.target.files[0])
    }
  }

  const toggleExpand = (id: string) => {
    setExpandedSourceId(expandedSourceId === id ? null : id)
  }

  return (
    <div className="w-full max-w-5xl px-4">
      {/* Page Header */}
      <div className="mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-foreground">Playbook Strategy Training</h1>
          <p className="text-xs text-text-muted mt-1 leading-relaxed">
            Train the AI brain on custom strategies by uploading playbooks or pasting website analysis URLs. Stalk Market indexes them as semantic contexts.
          </p>
        </div>
        <div className="flex items-center gap-2.5 bg-card border border-border px-3.5 py-2 rounded-xl text-xs shrink-0 self-start md:self-center shadow-sm">
          <Database className="h-4 w-4 text-text-muted" />
          <span className="text-text-muted font-medium">Knowledge Base:</span>
          <span className="font-bold text-foreground font-mono bg-accent px-2 py-0.5 rounded-sm border border-border">
            {chunksCount} Embeddings
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Input Forms (span 5) */}
        <div className="lg:col-span-5 flex flex-col gap-6">
          {/* Card 1: Document Upload */}
          <div className="bg-card border border-border rounded-2xl p-5 shadow-sm">
            <h2 className="text-xs font-bold text-foreground mb-1 uppercase tracking-wider">Strategy File Ingestion</h2>
            <p className="text-[11px] text-text-muted mb-4 leading-relaxed">Upload a training playbook in PDF or TXT format to index core swing trading rules.</p>
            
            <div
              onDragEnter={handleDrag}
              onDragOver={handleDrag}
              onDragLeave={handleDrag}
              onDrop={handleDrop}
              className={`relative border border-dashed rounded-2xl p-6 text-center flex flex-col items-center justify-center transition-colors ${
                dragActive 
                  ? "border-foreground bg-accent/40" 
                  : "border-border bg-background/20 hover:border-text-muted"
              }`}
            >
              <input
                type="file"
                id="playbook-input"
                onChange={handleChange}
                accept=".pdf,.txt"
                className="hidden"
              />
              
              {uploading ? (
                <div className="flex flex-col items-center gap-2.5 py-2">
                  <Spinner size={28} className="text-foreground animate-spin" weight="regular" />
                  <span className="text-xs text-text-muted font-medium">Parsing and embedding playbook...</span>
                </div>
              ) : (
                <label htmlFor="playbook-input" className="cursor-pointer flex flex-col items-center w-full">
                  <CloudArrowUp size={32} className="text-text-muted hover:text-foreground transition-colors mb-2" weight="regular" />
                  <span className="text-xs text-foreground font-bold block">Drag & drop playbook file</span>
                  <span className="text-[10px] text-text-muted mt-1 block">Supports PDF & TXT (Max 15MB)</span>
                </label>
              )}
            </div>
          </div>

          {/* Card 2: URL Crawler */}
          <div className="bg-card border border-border rounded-2xl p-5 shadow-sm">
            <h2 className="text-xs font-bold text-foreground mb-1 uppercase tracking-wider">Web Strategy Ingestion</h2>
            <p className="text-[11px] text-text-muted mb-4 leading-relaxed">Paste a research article, blog link, or technical guide to crawl, extract, and chunk rules.</p>
            
            <form onSubmit={handleURLIngest} className="flex flex-col gap-3">
              <div className="relative">
                <Globe size={16} className="absolute left-3 top-3 text-text-muted" weight="regular" />
                <input
                  type="url"
                  placeholder="https://example.com/swing-trading-setup"
                  value={urlInput}
                  onChange={(e) => setUrlInput(e.target.value)}
                  required
                  disabled={urlIngesting}
                  className="input-md pl-9 text-xs"
                />
              </div>
              <button
                type="submit"
                disabled={urlIngesting || !urlInput.trim()}
                className="btn btn-primary btn-md w-full font-bold cursor-pointer"
              >
                {urlIngesting ? (
                  <>
                    <Spinner size={16} className="mr-1.5 animate-spin" weight="regular" />
                    Crawling Web Page...
                  </>
                ) : (
                  <>
                    <LinkSimple size={16} weight="regular" />
                    Crawl & Ingest URL
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Feedback Messages */}
          {successMsg && (
            <div className="p-3.5 bg-accent border border-border text-foreground rounded-2xl text-xs flex items-start gap-2.5 shadow-sm">
              <CheckCircle className="h-4.5 w-4.5 text-success shrink-0 mt-0.5" />
              <span className="leading-relaxed">{successMsg}</span>
            </div>
          )}

          {errorMsg && (
            <div className="p-3.5 bg-destructive/10 border border-destructive/25 text-destructive rounded-2xl text-xs flex items-start gap-2.5 shadow-sm">
              <Warning size={18} className="shrink-0 mt-0.5" weight="regular" />
              <span className="leading-relaxed">{errorMsg}</span>
            </div>
          )}
        </div>

        {/* Right Column: Indexed Knowledge Sources (span 7) */}
        <div className="lg:col-span-7 bg-card border border-border rounded-2xl p-5 shadow-sm min-h-[420px] flex flex-col">
          <div className="flex items-center justify-between border-b border-border pb-3 mb-4">
            <div>
              <h2 className="text-xs font-bold text-foreground uppercase tracking-wider">Knowledge Sources</h2>
              <span className="text-[10px] text-text-muted mt-0.5 block">Dynamic lists of user strategy modules in the vector store</span>
            </div>
            <span className="text-[10px] font-mono font-bold text-text-muted">
              {sources.length} Total Sources
            </span>
          </div>

          {sources.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-6 text-text-muted gap-3">
              <Database className="h-8 w-8 text-text-muted/60" />
              <div>
                <p className="font-bold text-foreground text-xs">No Strategy Sources Found</p>
                <p className="text-[11px] mt-1 max-w-[280px]">Your knowledge database is currently empty. Upload files or index URLs on the left to train the AI trading assistant.</p>
              </div>
            </div>
          ) : (
            <div className="flex flex-col gap-3 max-h-[500px] overflow-y-auto pr-1">
              {sources.map((src) => {
                const isExpanded = expandedSourceId === src.source_id
                return (
                  <div 
                    key={src.source_id} 
                    className="border border-border rounded-2xl bg-background/30 hover:border-text-muted/60 transition-all shadow-sm"
                  >
                    <div 
                      onClick={() => toggleExpand(src.source_id)}
                      className="p-3.5 flex items-center justify-between gap-3 cursor-pointer"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="p-2 rounded-xl bg-accent text-primary">
                          {src.type === 'PDF' ? <FileText className="h-4 w-4" /> : <Globe className="h-4 w-4" />}
                        </div>
                        <div className="min-w-0">
                          <span className="text-xs font-bold text-foreground block truncate max-w-[220px] sm:max-w-[320px]">
                            {src.name}
                          </span>
                          <div className="flex items-center gap-2 mt-1 flex-wrap">
                            <span className="text-[9px] font-mono font-bold uppercase text-text-muted bg-accent border border-border px-1.5 py-0.25 rounded-sm">
                              {src.type}
                            </span>
                            <span className="text-[9px] text-text-muted flex items-center gap-1">
                              <Calendar className="h-3 w-3" /> {src.last_indexed.split(" ")[0]}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        {/* Status badge */}
                        <span 
                          className={`text-[9px] font-bold px-2 py-0.5 rounded-sm border ${
                            src.status === "Indexed" 
                              ? "bg-success/10 border-success/20 text-success" 
                              : src.status === "Pending" 
                              ? "bg-warning/10 border-warning/20 text-warning animate-pulse" 
                              : "bg-destructive/10 border-destructive/20 text-destructive"
                          }`}
                        >
                          {src.status}
                        </span>
                        
                        {isExpanded ? <CaretUp size={16} className="text-text-muted" weight="regular" /> : <CaretDown size={16} className="text-text-muted" weight="regular" />}
                      </div>
                    </div>

                    {isExpanded && (
                      <div className="px-4 pb-4 pt-1 border-t border-border/60 bg-accent/20 rounded-b-2xl text-[11px] leading-relaxed">
                        <div className="grid grid-cols-2 gap-2 text-text-muted border-b border-border/40 pb-2 mb-2 font-mono text-[9px]">
                          <div>Chunks: <span className="font-bold text-foreground">{src.chunks_count}</span></div>
                          <div>Indexed: <span className="font-bold text-foreground">{src.last_indexed}</span></div>
                        </div>
                        <div className="text-foreground">
                          <strong className="text-[10px] text-text-muted block uppercase tracking-wider mb-1">Source Summary</strong>
                          {src.summary || "No summary details generated for this knowledge source yet."}
                        </div>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
