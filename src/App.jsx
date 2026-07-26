import { Suspense, useCallback, useEffect, useRef, useState } from "react"
import { Canvas } from "@react-three/fiber"
import * as THREE from "three"
import Scene from "./components/3d/Scene"
import HUD from "./components/ui/HUD"
import Modal from "./components/ui/Modal"

const pictureModules = import.meta.glob("../pictures/*.{png,jpg,jpeg,webp}", {
  eager: true,
  query: "?url",
  import: "default",
})
const subtitleCycle = ["FIRST LIGHT", "CROSSING", "VIOLET", "BLOSSOM", "ETERNAL", "MOON DUST"]
const images = Object.entries(pictureModules)
  .sort(([left], [right]) => left.localeCompare(right, "zh-CN"))
  .map(([path], index) => ({
    path,
    title: `MEMORY ${String(index + 1).padStart(2, "0")}`,
    subtitle: subtitleCycle[index % subtitleCycle.length],
  }))

const clamp = (value) => Math.min(1, Math.max(0, value))

export default function App() {
  const [progress, setProgress] = useState(0)
  const [selectedCard, setSelectedCard] = useState(null)
  const [focusedIndex, setFocusedIndex] = useState(null)
  const focusTimer = useRef(null)

  useEffect(() => () => window.clearTimeout(focusTimer.current), [])

  const updateProgress = useCallback((change) => {
    setProgress((current) => clamp(current + change))
  }, [])

  const handleWheel = useCallback((event) => {
    event.preventDefault()
    updateProgress(event.deltaY * 0.00055)
  }, [updateProgress])

  const handleCardClick = useCallback((card) => {
    setFocusedIndex(card.index)
    focusTimer.current = window.setTimeout(() => setSelectedCard(card), 240)
  }, [])

  const closeDetails = useCallback(() => {
    window.clearTimeout(focusTimer.current)
    setSelectedCard(null)
    setFocusedIndex(null)
  }, [])

  return (
    <main
      className="album-app"
      onWheel={handleWheel}
    >
      <Canvas
        camera={{ position: [0, 0, 8.8], fov: 42 }}
        dpr={[1, 1.7]}
        gl={{
          antialias: true,
          alpha: false,
          powerPreference: "high-performance",
          toneMapping: THREE.NoToneMapping,
        }}
      >
        <Suspense fallback={null}>
          <Scene images={images} progress={progress} focusedIndex={focusedIndex} onProgressChange={setProgress} onCardClick={handleCardClick} />
        </Suspense>
      </Canvas>
      <HUD progress={progress} onProgressChange={setProgress} />
      <Modal card={selectedCard} onClose={closeDetails} />
    </main>
  )
}
