import React from "react"

interface SparklineProps {
  data: number[]
  width?: number
  height?: number
  positiveColor?: string
  negativeColor?: string
  strokeWidth?: number
}

export const Sparkline: React.FC<SparklineProps> = ({
  data,
  width = 120,
  height = 40,
  positiveColor = "#10b981", // Emerald-500
  negativeColor = "#ef4444", // Red-500
  strokeWidth = 2,
}) => {
  if (!data || data.length < 2) return null

  const min = Math.min(...data)
  const max = Math.max(...data)
  const range = max - min === 0 ? 1 : max - min

  // Map data values to SVG coordinates
  const points = data.map((val, index) => {
    const x = (index / (data.length - 1)) * width
    const y = height - ((val - min) / range) * height
    return { x, y }
  })

  // Build SVG path
  const pathData = points
    .map((p, i) => `${i === 0 ? "M" : "L"} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`)
    .join(" ")

  // Check if overall change is positive or negative
  const isPositive = data[data.length - 1] >= data[0]
  const color = isPositive ? positiveColor : negativeColor

  // Area path
  const areaPathData = `${pathData} L ${width} ${height} L 0 ${height} Z`

  // Create a safe ID without parentheses to avoid breaking CSS url() parsing
  const safeColorId = color.replace(/[^a-zA-Z0-9]/g, "")

  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} className="overflow-visible">
      <defs>
        <linearGradient id={`gradient-${safeColorId}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.15" />
          <stop offset="100%" stopColor={color} stopOpacity="0.0" />
        </linearGradient>
      </defs>
      {/* Area under the sparkline */}
      <path d={areaPathData} fill={`url(#gradient-${safeColorId})`} />
      {/* Sparkline stroke */}
      <path
        d={pathData}
        fill="none"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}
