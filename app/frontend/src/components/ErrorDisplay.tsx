import React from "react"
import { WarningCircle, ArrowsClockwise } from "@phosphor-icons/react"

interface ErrorDisplayProps {
  title: string
  reason: string
  action: string
  onRetry: () => void
  retryLoading?: boolean
}

export const ErrorDisplay: React.FC<ErrorDisplayProps> = ({
  title,
  reason,
  action,
  onRetry,
  retryLoading = false,
}) => {
  return (
    <div className="flex flex-col items-center justify-center py-8 px-6 text-center bg-card border border-border rounded-2xl gap-4 max-w-md mx-auto my-6 shadow-sm">
      <div className="p-3 bg-destructive/10 text-destructive rounded-full">
        <WarningCircle size={40} className="text-destructive/40 mb-4" weight="regular" />
      </div>
      <div>
        <h3 className="text-base font-bold text-foreground">{title}</h3>
        <p className="text-xs text-text-muted mt-2 leading-relaxed">
          {reason}
        </p>
        {action && (
          <p className="text-[11px] text-text-muted/85 mt-2 bg-accent/40 px-3 py-1.5 rounded-lg border border-border">
            <span className="font-bold text-foreground block mb-0.5">Suggested Action:</span>
            {action}
          </p>
        )}
      </div>
      <button
        onClick={onRetry}
        disabled={retryLoading}
        className="btn btn-primary btn-md px-6 font-bold gap-2 mt-2"
      >
        <ArrowsClockwise size={16} className={`${retryLoading ? 'animate-spin' : ''}`} weight="regular" />
        Retry Action
      </button>
    </div>
  )
}
