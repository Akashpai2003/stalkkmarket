import { X } from "@phosphor-icons/react";
import { Chatbot } from "./Chatbot";

interface ResearchWorkspaceProps {
  onClose: () => void;
  selectedSymbol: string | null;
  onSelectSymbol: (symbol: string | null) => void;
}

export function ResearchWorkspace({ onClose, selectedSymbol, onSelectSymbol }: ResearchWorkspaceProps) {
  return (
    <div className="h-full flex flex-col bg-background overflow-hidden">
      {/* Header bar */}
      <div className="h-13 border-b border-border flex items-center justify-between px-5 shrink-0 bg-background z-10">
        <div className="flex items-center gap-3">
          <div className="ai-organic-blob w-6 h-6 shrink-0" />
          <div className="flex items-center gap-2.5">
            <span className="text-[14px] font-medium text-foreground tracking-tight">
              AI Research Assistant
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Quick keyboard hint */}
          <span className="text-[10px] text-text-muted/40 hidden md:inline font-mono">
            Esc to close
          </span>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-lg flex items-center justify-center text-text-muted hover:text-foreground hover:bg-accent transition-colors cursor-pointer"
            title="Close workspace"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Chatbot - fills remaining space */}
      <div className="flex-1 min-h-0 overflow-hidden">
        <Chatbot
          selectedSymbol={selectedSymbol}
          onSelectSymbol={onSelectSymbol}
          isExpanded={true}
        />
      </div>
    </div>
  );
}
