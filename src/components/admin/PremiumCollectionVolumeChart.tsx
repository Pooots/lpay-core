import { useId, useMemo, useState } from 'react'
import type { DashboardVolumePoint } from '@/types/dashboard'
import { cn } from '@/lib/utils'

type ChartPoint = DashboardVolumePoint & { x: number; y: number }

function niceMax(value: number): number {
  if (value <= 0) return 1
  const magnitude = 10 ** Math.floor(Math.log10(value))
  const normalized = value / magnitude
  const nice =
    normalized <= 1 ? 1 : normalized <= 2 ? 2 : normalized <= 5 ? 5 : 10
  return nice * magnitude
}

function formatAxisValue(value: number): string {
  if (value >= 1_000_000) return `₱${(value / 1_000_000).toFixed(1)}M`
  if (value >= 1_000) return `₱${(value / 1_000).toFixed(value >= 10_000 ? 0 : 1)}k`
  return `₱${value.toFixed(value % 1 === 0 ? 0 : 0)}`
}

function formatTooltipValue(value: number): string {
  return `₱${value.toLocaleString('en-PH', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`
}

/** Catmull-Rom spline → cubic Bezier for a smooth premium curve. */
function smoothCurvePath(points: Array<{ x: number; y: number }>): string {
  if (points.length === 0) return ''
  if (points.length === 1) {
    return `M ${points[0].x.toFixed(2)} ${points[0].y.toFixed(2)}`
  }
  if (points.length === 2) {
    return `M ${points[0].x.toFixed(2)} ${points[0].y.toFixed(2)} L ${points[1].x.toFixed(2)} ${points[1].y.toFixed(2)}`
  }

  let d = `M ${points[0].x.toFixed(2)} ${points[0].y.toFixed(2)}`

  for (let i = 0; i < points.length - 1; i += 1) {
    const p0 = points[i - 1] ?? points[i]
    const p1 = points[i]
    const p2 = points[i + 1]
    const p3 = points[i + 2] ?? p2

    const cp1x = p1.x + (p2.x - p0.x) / 6
    const cp1y = p1.y + (p2.y - p0.y) / 6
    const cp2x = p2.x - (p3.x - p1.x) / 6
    const cp2y = p2.y - (p3.y - p1.y) / 6

    d += ` C ${cp1x.toFixed(2)} ${cp1y.toFixed(2)}, ${cp2x.toFixed(2)} ${cp2y.toFixed(2)}, ${p2.x.toFixed(2)} ${p2.y.toFixed(2)}`
  }

  return d
}

export function PremiumCollectionVolumeChart({
  points,
  className,
}: {
  points: DashboardVolumePoint[]
  className?: string
}) {
  const uid = useId().replace(/:/g, '')
  const [activeKey, setActiveKey] = useState<string | null>(null)

  const width = 720
  const height = 260
  const padLeft = 48
  const padRight = 12
  const padTop = 18
  const padBottom = 32

  const chart = useMemo(() => {
    const data =
      points.length > 0
        ? points
        : [{ key: 'empty', label: '—', value: 0 }]
    const rawMax = Math.max(...data.map((p) => p.value), 0)
    const max = niceMax(rawMax)
    const plotW = width - padLeft - padRight
    const plotH = height - padTop - padBottom
    const step = data.length > 1 ? plotW / (data.length - 1) : 0

    const coords: ChartPoint[] = data.map((point, index) => {
      const x = padLeft + index * step
      const y = padTop + plotH - (point.value / max) * plotH
      return { ...point, x, y }
    })

    const line = smoothCurvePath(coords)
    const baseline = height - padBottom
    const area =
      coords.length > 0
        ? `${line} L ${coords.at(-1)!.x.toFixed(2)} ${baseline} L ${coords[0]!.x.toFixed(2)} ${baseline} Z`
        : ''

    const ticks = [0, 0.25, 0.5, 0.75, 1].map((t) => ({
      ratio: t,
      value: max * (1 - t),
      y: padTop + plotH * t,
    }))

    const labelEvery = Math.max(1, Math.ceil(data.length / 8))

    return { data, max, coords, line, area, ticks, labelEvery, baseline }
  }, [points])

  const active = chart.coords.find((p) => p.key === activeKey) ?? null

  return (
    <div className={cn('relative w-full min-w-0', className)}>
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="block h-auto w-full"
        preserveAspectRatio="xMidYMid meet"
        role="img"
        aria-label="Collection volume chart"
      >
        <defs>
          <linearGradient id={`fill-${uid}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#4B1D6E" stopOpacity="0.34" />
            <stop offset="55%" stopColor="#7B4AA3" stopOpacity="0.12" />
            <stop offset="100%" stopColor="#C9A227" stopOpacity="0.02" />
          </linearGradient>
          <linearGradient id={`stroke-${uid}`} x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#5A2A82" />
            <stop offset="55%" stopColor="#4B1D6E" />
            <stop offset="100%" stopColor="#C9A227" />
          </linearGradient>
          <filter
            id={`glow-${uid}`}
            x="-20%"
            y="-20%"
            width="140%"
            height="140%"
          >
            <feGaussianBlur stdDeviation="2.4" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          <filter id={`soft-${uid}`} x="-10%" y="-10%" width="120%" height="120%">
            <feDropShadow
              dx="0"
              dy="4"
              stdDeviation="6"
              floodColor="#4B1D6E"
              floodOpacity="0.18"
            />
          </filter>
        </defs>

        {/* Plot backdrop */}
        <rect
          x={padLeft}
          y={padTop}
          width={width - padLeft - padRight}
          height={height - padTop - padBottom}
          rx="14"
          fill="#fbf8fd"
          stroke="#efe6f8"
        />

        {/* Grid + Y labels */}
        {chart.ticks.map((tick) => (
          <g key={tick.ratio}>
            <line
              x1={padLeft}
              x2={width - padRight}
              y1={tick.y}
              y2={tick.y}
              stroke={tick.ratio === 1 ? '#e4d7f0' : '#eadff4'}
              strokeWidth={tick.ratio === 1 ? 1.25 : 1}
              strokeDasharray={tick.ratio === 1 ? undefined : '3 7'}
            />
            <text
              x={padLeft - 10}
              y={tick.y + 3}
              textAnchor="end"
              className="fill-[#8a7a9a]"
              style={{ fontSize: 10, fontWeight: 600 }}
            >
              {formatAxisValue(tick.value)}
            </text>
          </g>
        ))}

        {/* Soft area + glowing curve */}
        <path
          d={chart.area}
          fill={`url(#fill-${uid})`}
          filter={`url(#soft-${uid})`}
        />
        <path
          d={chart.line}
          fill="none"
          stroke={`url(#stroke-${uid})`}
          strokeWidth="3.25"
          strokeLinecap="round"
          strokeLinejoin="round"
          filter={`url(#glow-${uid})`}
        />

        {/* Points */}
        {chart.coords.map((point) => {
          const isActive = activeKey === point.key
          const showDot = point.value > 0 || isActive || chart.coords.length <= 14
          if (!showDot && chart.coords.length > 20) return null

          return (
            <g
              key={point.key}
              onMouseEnter={() => setActiveKey(point.key)}
              onMouseLeave={() => setActiveKey(null)}
              className="cursor-pointer"
            >
              <circle
                cx={point.x}
                cy={point.y}
                r={isActive ? 16 : 10}
                fill="#4B1D6E"
                opacity={isActive ? 0.12 : 0}
              />
              {(point.value > 0 || isActive) && (
                <>
                  <circle
                    cx={point.x}
                    cy={point.y}
                    r={isActive ? 5.5 : 4}
                    fill="#fff"
                    stroke="#4B1D6E"
                    strokeWidth="2"
                  />
                  <circle
                    cx={point.x}
                    cy={point.y}
                    r={isActive ? 2.8 : 2.2}
                    fill="#C9A227"
                  />
                </>
              )}
              {/* Hit area */}
              <circle
                cx={point.x}
                cy={point.y}
                r="12"
                fill="transparent"
              />
            </g>
          )
        })}

        {/* X labels */}
        {chart.coords.map((point, index) => {
          if (
            !(
              index % chart.labelEvery === 0 ||
              index === chart.coords.length - 1
            )
          ) {
            return null
          }
          return (
            <text
              key={`label-${point.key}`}
              x={point.x}
              y={height - 12}
              textAnchor="middle"
              className="fill-[#8a7a9a]"
              style={{ fontSize: 10, fontWeight: 600 }}
            >
              {point.label}
            </text>
          )
        })}
      </svg>

      {active ? (
        <div
          className="pointer-events-none absolute top-3 left-1/2 z-10 -translate-x-1/2 rounded-xl border border-primary/15 bg-white/95 px-3 py-2 shadow-[0_12px_30px_-16px_rgb(75_29_110_/_0.55)] backdrop-blur-sm"
          role="status"
        >
          <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-primary/70">
            {active.label}
          </p>
          <p className="mt-0.5 text-sm font-bold text-foreground">
            {formatTooltipValue(active.value)}
          </p>
        </div>
      ) : null}
    </div>
  )
}
