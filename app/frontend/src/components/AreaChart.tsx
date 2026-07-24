import React from "react"
import {
  ResponsiveContainer,
  AreaChart as RechartsAreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts"

interface ChartDataPoint {
  time: number
  close: number
}

interface AreaChartProps {
  data: ChartDataPoint[]
  height?: number
  strokeColor?: string
  fillColor?: string
}

export const AreaChart: React.FC<AreaChartProps> = ({
  data,
  height = 200,
  strokeColor = "#737373", // default to design.md text-muted
}) => {
  if (!data || data.length < 2) {
    return (
      <div
        style={{ height }}
        className="flex items-center justify-center text-text-muted text-xs border border-dashed border-border rounded-xl"
      >
        No chart data available
      </div>
    )
  }

  // Determine gradient ID dynamically to avoid clashes, sanitizing to avoid parentheses in css url()
  const gradientId = `chart-gradient-${strokeColor.replace(/[^a-zA-Z0-9]/g, "")}`

  // Format timestamps on X-Axis
  const formatXAxis = (time: number) => {
    const d = new Date(time)
    return d.toLocaleDateString([], { month: "short", day: "numeric" })
  }

  // Custom Tooltip component matching shadcn/ui chart tooltip styles
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const point = payload[0].payload as ChartDataPoint
      const formattedTime = new Date(point.time).toLocaleDateString([], {
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
      return (
        <div className="bg-card border border-border text-foreground rounded-xl p-3 shadow-md flex flex-col gap-1 text-xs select-none">
          <span className="text-text-muted font-medium">{formattedTime}</span>
          <div className="flex items-center gap-1.5 pt-0.5">
            <span
              className="h-2 w-2 rounded-full"
              style={{ backgroundColor: strokeColor }}
            />
            <span className="font-semibold text-foreground">
              Price: <span className="font-medium">₹{point.close.toFixed(2)}</span>
            </span>
          </div>
        </div>
      )
    }
    return null
  }

  return (
    <div style={{ width: "100%", height }} className="overflow-visible select-none pt-2">
      <ResponsiveContainer width="100%" height="100%">
        <RechartsAreaChart
          data={data}
          margin={{
            top: 5,
            right: 5,
            left: 5,
            bottom: 5,
          }}
        >
          <defs>
            <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={strokeColor} stopOpacity={0.25} />
              <stop offset="95%" stopColor={strokeColor} stopOpacity={0.0} />
            </linearGradient>
          </defs>
          <CartesianGrid
            vertical={false}
            stroke="var(--border)"
            strokeDasharray="3 3"
          />
          <XAxis
            dataKey="time"
            tickLine={false}
            axisLine={false}
            tickMargin={8}
            tickFormatter={formatXAxis}
            stroke="var(--text-muted)"
            fontSize={11}
          />
          <YAxis
            domain={["dataMin - 1", "dataMax + 1"]}
            hide={true}
          />
          <Tooltip
            content={<CustomTooltip />}
            cursor={{
              stroke: "var(--text-muted)",
              strokeWidth: 1,
              strokeDasharray: "4 4",
            }}
          />
          <Area
            type="monotone"
            dataKey="close"
            stroke={strokeColor}
            strokeWidth={2}
            fill={`url(#${gradientId})`}
            activeDot={{
              r: 4,
              stroke: "var(--background)",
              strokeWidth: 2,
              fill: strokeColor,
            }}
          />
        </RechartsAreaChart>
      </ResponsiveContainer>
    </div>
  )
}
