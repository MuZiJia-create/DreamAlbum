import { X } from "lucide-react"

const notes = [
  "\u6709\u4e9b\u7b11\u5bb9\u503c\u5f97\u88ab\u6c38\u8fdc\u73cd\u85cf\uff0c\u6709\u4e9b\u77ac\u95f4\u503c\u5f97\u88ab\u53cd\u590d\u56de\u5473\u3002",
  "\u98ce\u8d77\u7684\u65f6\u5019\uff0c\u6240\u6709\u7684\u601d\u5ff5\u90fd\u5316\u4f5c\u6f2b\u5929\u82b1\u74e3\u3002",
  "\u5728\u6c38\u6052\u7684\u661f\u7a7a\u4e0b\uff0c\u8bb8\u4e0b\u4e0d\u53d8\u7684\u8bfa\u8a00\u3002",
]

export default function Modal({ card, onClose }) {
  if (!card) return null
  return (
    <div className="detail-overlay" onClick={onClose}>
      <aside className="detail-panel" onClick={(event) => event.stopPropagation()}>
        <button className="detail-close" onClick={onClose} aria-label="\u5173\u95ed\u8be6\u60c5"><X size={18} strokeWidth={1.35} /></button>
        <div className="detail-image"><img src={card.path} alt={card.title} /></div>
        <p className="detail-kicker">ETERNAL BLOSSOMS · MEMORY {String(card.title).toUpperCase()}</p>
        <h2>{card.title}</h2>
        <div className="detail-rule" />
        <p className="detail-copy">{notes[card.index % notes.length]}</p>
        <p className="detail-index">{String((card.index ?? 0) + 1).padStart(2, "0")} / {String(card.total ?? 1).padStart(2, "0")}</p>
      </aside>
    </div>
  )
}
