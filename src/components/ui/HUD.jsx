import { Maximize2, Pause, Play, Volume2, X } from "lucide-react"
import { useEffect, useMemo, useState } from "react"

const stages = [
  { at: 0, name: "ARRIVAL", chinese: "\u82b1\u57df\u521d\u89c1", poem: ["\u8f7b\u89e6\uff0c\u5e8f\u7ae0\u7531\u6b64\u5f00\u59cb"] },
  { at: 0.12, name: "CROSS", chinese: "\u4ea4\u9519\u661f\u7a79", poem: ["\u547d\u8fd0\u4ea4\u9519\u76f8\u9047\u518d\u4ea4\u9519", "\u6f2b\u6f2b\u957f\u6cb3\u6211\u4eec\u4ece\u672a\u771f\u6b63\u8d70\u6563"] },
  { at: 0.32, name: "HERO", chinese: "\u7e41\u82b1\u4e4b\u5fc3", poem: ["\u4e16\u754c\u518d\u5927\u4e5f\u4e0d\u8fc7", "\u4f60\u4e00\u56de\u5934\u7684\u8ddd\u79bb"] },
  { at: 0.52, name: "DEPART", chinese: "\u6c38\u6052\u5f52\u9014", poem: ["\u6240\u6709\u7684\u5076\u7136", "\u90fd\u662f\u547d\u4e2d\u6ce8\u5b9a\u7684\u5fc5\u7136"] },
  { at: 0.72, name: "WAVE", chinese: "\u6f6e\u6c50\u82b1\u5eca", poem: ["\u4e07\u5343\u661f\u8fb0\u91cc", "\u6211\u53ea\u8ba4\u5f97\u4f60\u7684\u5149\u8292"] },
  { at: 0.86, name: "FINALE", chinese: "\u7ec8\u7ae0\u82b1\u8bed", poem: ["\u4f60\u662f\u6240\u6709\u65b9\u5411\u91cc", "\u552f\u4e00\u7684\u76ee\u7684\u5730"] },
]

const findStage = (progress) => [...stages].reverse().find((stage) => progress >= stage.at) ?? stages[0]
const controlStyle = { border: 0, background: "transparent", color: "inherit", cursor: "pointer", display: "grid", placeItems: "center" }

function PoemOverlay({ stage }) {
  const [layers, setLayers] = useState(() => [{ id: stage.name, poem: stage.poem, state: "entering" }])

  useEffect(() => {
    setLayers((current) => {
      if (current.some((layer) => layer.id === stage.name)) return current
      return [
        ...current.map((layer) => ({ ...layer, state: "leaving" })),
        { id: stage.name, poem: stage.poem, state: "entering" },
      ]
    })
    const timer = window.setTimeout(() => {
      setLayers((current) => current.filter((layer) => layer.id === stage.name))
    }, 800)
    return () => window.clearTimeout(timer)
  }, [stage])

  return (
    <div className="poem-wrap">
      {layers.map((layer) => (
        <p key={layer.id} className={`poem-layer is-${layer.state}`}>
          {layer.poem.map((line) => <span key={line}>{line}</span>)}
        </p>
      ))}
    </div>
  )
}

export default function HUD({ progress = 0, onProgressChange }) {
  const [isPlaying, setIsPlaying] = useState(false)
  const stage = useMemo(() => findStage(progress), [progress])
  const percent = Math.round(progress * 100)

  return (
    <div className="hud" aria-live="polite">
      <header className="hud-header">
        <div className="brand-block">
          <button className="close-button" style={controlStyle} aria-label="\u5173\u95ed\u76f8\u518c"><X size={17} strokeWidth={1.3} /></button>
          <div><h1>WXY</h1><p>ETERNAL BLOSSOMS · HUA HAI JI YI</p></div>
        </div>
        <div className="stage-label"><p>VALLEY: {stage.name} / {stage.chinese}</p><span>{percent}%</span></div>
      </header>
      <PoemOverlay stage={stage} />
      <footer className="hud-footer">
        <div className="media-control">
          <button style={controlStyle} onClick={() => setIsPlaying((playing) => !playing)} aria-label={isPlaying ? "\u6682\u505c" : "\u64ad\u653e"}>{isPlaying ? <Pause size={15} fill="currentColor" /> : <Play size={15} fill="currentColor" />}</button>
          <Volume2 size={14} strokeWidth={1.35} />
          <span className="time">{String(Math.floor(progress * 47 / 60)).padStart(2, "0")}:{String(Math.floor(progress * 47 % 60)).padStart(2, "0")} / 00:47</span>
          <button className="timeline" aria-label="\u76f8\u518c\u8fdb\u5ea6" onClick={(event) => { const bounds = event.currentTarget.getBoundingClientRect(); onProgressChange?.(Math.min(1, Math.max(0, (event.clientX - bounds.left) / bounds.width))) }}><span style={{ width: `${percent}%` }} /></button>
        </div>
        <p className="gesture-hint">DRAG TO MOVE · CLICK A CARD TO REVEAL</p>
        <div className="hud-actions">
          <button style={controlStyle} className="max-button" aria-label="\u5168\u5c4f"><Maximize2 size={15} strokeWidth={1.25} /></button>
        </div>
      </footer>
    </div>
  )
}
