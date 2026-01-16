import { Palette } from 'lucide-react'

export function AppHeader() {
  return (
    <header className="flex items-center justify-between px-8 py-4">
      <div className="flex items-center gap-2">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
          <Palette className="h-4 w-4 text-surface" />
        </div>
        <span className="text-lg font-semibold text-primary">Sketchforge NG</span>
      </div>

      <div className="flex items-center gap-4">
        <span className="text-sm text-muted">简体中文</span>
        {/* <button className="flex h-8 w-8 items-center justify-center rounded-full border border-border">
          <span className="text-xs">🔔</span>
        </button> */}
        {/* <button className="flex items-center gap-2 rounded-full bg-accent px-4 py-1.5 text-sm font-medium text-surface">
          升级
          <span className="flex items-center gap-1 rounded-full bg-surface/20 px-2 py-0.5 text-xs">
            ⚡ 100
          </span>
        </button>
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-accent text-sm font-medium text-surface">
          U
        </div> */}
      </div>
    </header>
  )
}
