import React, { useState, useRef, useEffect } from "react"
import { CaretDown } from "@phosphor-icons/react"

interface Option {
  value: string
  label: string
}

interface CustomDropdownProps {
  value: string
  onChange: (value: string) => void
  options: (string | Option)[]
  className?: string
  align?: "left" | "right"
}

export const CustomDropdown: React.FC<CustomDropdownProps> = ({
  value,
  onChange,
  options,
  className = "",
  align = "left"
}) => {
  const [isOpen, setIsOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  const normalizedOptions = options.map((opt) =>
    typeof opt === "string" ? { value: opt, label: opt } : opt
  )

  const selectedOption = normalizedOptions.find((opt) => opt.value === value) || normalizedOptions[0]

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  return (
    <div ref={containerRef} className={`relative inline-block text-left min-w-[165px] ${className}`}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-between w-full h-8.5 px-3.5 text-xs bg-neutral-900/80 hover:bg-neutral-800 border border-neutral-700/60 hover:border-neutral-500 text-foreground hover:text-white rounded-lg transition-all cursor-pointer select-none outline-none focus:outline-none focus:ring-0 shadow-xs"
      >
        <span className="truncate mr-2 font-medium">{selectedOption?.label}</span>
        <CaretDown size={14} className="text-text-muted shrink-0" weight="regular" />
      </button>

      {isOpen && (
        <div
          className={`absolute ${align === "right" ? "right-0" : "left-0"} mt-1.5 w-full min-w-[165px] z-50 bg-[#181A20] border border-neutral-700/70 rounded-lg shadow-2xl py-1 overflow-hidden max-h-60 overflow-y-auto custom-scrollbar`}
        >
          {normalizedOptions.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => {
                onChange(opt.value)
                setIsOpen(false)
              }}
              className={`w-full px-3.5 py-2 text-left text-xs transition-colors cursor-pointer select-none border-none outline-none ${
                opt.value === value
                  ? "bg-white/15 text-white font-medium"
                  : "text-text-muted hover:text-white hover:bg-white/10"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
