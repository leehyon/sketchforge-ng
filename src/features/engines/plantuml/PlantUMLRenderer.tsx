import React, { useEffect, useState, forwardRef, useImperativeHandle } from 'react'
import plantumlEncoder from 'plantuml-encoder'
import { cn } from '@/lib/utils'
import { SourceCodePanel } from '@/components/ui/SourceCodePanel'
import { useEditorStore } from '@/stores/editorStore'

interface PlantUMLRendererProps {
  code: string
  className?: string
}

export interface PlantUMLRendererRef {
  exportAsSvg: () => void
  exportAsPng: () => void
  exportAsSource: () => void
  showSourceCode: () => void
  hideSourceCode: () => void
  toggleSourceCode: () => void
}

// Public PlantUML server base (SVG output)
const PLANTUML_SVG_SERVER = 'https://www.plantuml.com/plantuml/svg/'

export const PlantUMLRenderer = forwardRef<PlantUMLRendererRef, PlantUMLRendererProps>(function PlantUMLRenderer({ code, className }, ref) {
  const [svg, setSvg] = useState<string>('')
  const [error, setError] = useState<string | null>(null)
  const [showCodePanel, setShowCodePanel] = useState(false)
  const { setContent } = useEditorStore()

  useEffect(() => {
    if (!code.trim()) {
      setSvg('')
      setError(null)
      return
    }

    const encoded = plantumlEncoder.encode(code)
    const url = `${PLANTUML_SVG_SERVER}${encoded}`

    let cancelled = false

    fetch(url, { method: 'GET' })
      .then(async res => {
        if (!res.ok) throw new Error(`Server returned ${res.status}`)
        const text = await res.text()
        if (!cancelled) {
          setSvg(text)
          setError(null)
        }
      })
      .catch(err => {
        if (!cancelled) setError(err.message || 'Failed to render PlantUML')
      })

    return () => { cancelled = true }
  }, [code])

  const exportAsSvg = () => {
    if (!svg) return
    const blob = new Blob([svg], { type: 'image/svg+xml' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `diagram-${Date.now()}.svg`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  const exportAsPng = async () => {
    if (!svg) return
    const parser = new DOMParser()
    const doc = parser.parseFromString(svg, 'image/svg+xml')
    const svgEl = doc.querySelector('svg')
    if (!svgEl) return

    const svgData = new XMLSerializer().serializeToString(svgEl)
    const svgBase64 = btoa(unescape(encodeURIComponent(svgData)))
    const dataUrl = `data:image/svg+xml;base64,${svgBase64}`

    const img = new Image()
    img.onload = () => {
      const canvas = document.createElement('canvas')
      canvas.width = img.width
      canvas.height = img.height
      const ctx = canvas.getContext('2d')
      if (!ctx) return
      ctx.fillStyle = 'white'
      ctx.fillRect(0, 0, canvas.width, canvas.height)
      ctx.drawImage(img, 0, 0)
      const link = document.createElement('a')
      link.download = `diagram-${Date.now()}.png`
      link.href = canvas.toDataURL('image/png')
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    }
    img.onerror = (e) => console.error('Failed to load SVG for PNG export', e)
    img.src = dataUrl
  }

  const exportAsSource = () => {
    if (!code) return
    const blob = new Blob([code], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `diagram-${Date.now()}.puml`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  useImperativeHandle(ref, () => ({
    exportAsSvg,
    exportAsPng,
    exportAsSource,
    showSourceCode: () => setShowCodePanel(true),
    hideSourceCode: () => setShowCodePanel(false),
    toggleSourceCode: () => setShowCodePanel(prev => !prev),
  }), [exportAsSvg, exportAsPng, exportAsSource])

  const handleApplyCode = (newCode: string) => {
    if (newCode.trim() && newCode !== code) {
      setContent(newCode)
    }
  }

  if (!code.trim()) {
    return (
      <div className={cn('flex h-full items-center justify-center text-muted', className)}>
        <div className="text-center">
          <p className="text-sm">No diagram yet</p>
          <p className="mt-1 text-xs">Use AI to generate one</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className={cn('flex h-full items-center justify-center p-4', className)}>
        <div className="max-w-md border border-red-300 bg-red-50 p-4">
          <p className="font-medium text-red-800">Render Error</p>
          <p className="mt-1 text-sm text-red-600">{error}</p>
        </div>
      </div>
    )
  }

  return (
    <div className={cn('relative flex h-full flex-col', className)}>
      <div className="flex-1 overflow-auto p-6">
        <div className="flex w-full h-full items-center justify-center">
          <div style={{ display: 'inline-block' }} dangerouslySetInnerHTML={{ __html: svg }} />
        </div>
      </div>

      {showCodePanel && (
        <SourceCodePanel
          code={code}
          language="text"
          title="PlantUML 源码"
          onApply={handleApplyCode}
          onClose={() => setShowCodePanel(false)}
        />
      )}
    </div>
  )
})
