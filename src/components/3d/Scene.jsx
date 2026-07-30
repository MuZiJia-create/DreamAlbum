import { useMemo, useRef } from "react"
import { Bloom, EffectComposer, Vignette } from "@react-three/postprocessing"
import Card from "./Card"

const PHASES = [0, 0.12, 0.32, 0.52, 0.72, 0.86, 1]

const clamp = (value) => Math.min(1, Math.max(0, value))
const smooth = (value) => {
  const t = clamp(value)
  return t * t * (3 - 2 * t)
}
const interpolate = (a, b, t) => a + (b - a) * t
const transform = (a, b, t) => ({
  position: a.position.map((value, index) => interpolate(value, b.position[index], t)),
  rotation: a.rotation.map((value, index) => interpolate(value, b.rotation[index], t)),
  scale: interpolate(a.scale, b.scale, t),
})

function crossTransform(index, total) {
  if (index === 0) return { position: [0, 0, 1.05], rotation: [0, 0, 0], scale: 1.24 }

  const arm = (index - 1) % 4
  const layer = Math.floor((index - 1) / 4) + 1
  const spacing = total <= 5 ? 1.62 : 1.1
  const distance = layer * spacing
  const depth = -layer * 0.56
  const tilt = 0.22 + layer * 0.035

  if (arm === 0) return { position: [distance, 0, depth], rotation: [0, -tilt, 0], scale: 0.82 }
  if (arm === 1) return { position: [-distance, 0, depth], rotation: [0, tilt, 0], scale: 0.82 }
  if (arm === 2) return { position: [0, distance * 0.78, depth + 0.2], rotation: [-tilt, 0, 0], scale: 0.8 }
  return { position: [0, -distance * 0.78, depth + 0.2], rotation: [tilt, 0, 0], scale: 0.8 }
}

function heroTransform(index, total) {
  if (index === 0) return { position: [0, -0.02, 1.34], rotation: [0, 0, 0], scale: total <= 5 ? 1.58 : 1.45 }
  const amount = Math.max(total - 1, 1)
  const angle = Math.PI * 0.18 + (index - 1) / amount * Math.PI * 1.64
  const radius = total <= 5 ? 2.92 : 3.25
  return {
    position: [Math.cos(angle) * radius, Math.sin(angle) * radius * 0.73, -0.6 - Math.abs(Math.cos(angle)) * 0.7],
    rotation: [Math.sin(angle) * 0.2, -Math.cos(angle) * 0.44, Math.sin(angle) * 0.08],
    scale: total <= 5 ? 0.8 : 0.66,
  }
}

function wreathTransform(index, total) {
  const angle = Math.PI / 2 + index / Math.max(total, 1) * Math.PI * 2
  const radius = total <= 5 ? 2.68 : 3.22
  return {
    position: [Math.cos(angle) * radius, Math.sin(angle) * radius * 0.78, -0.8 + Math.sin(angle * 2) * 0.45],
    rotation: [Math.sin(angle) * 0.28, -Math.cos(angle) * 0.38, Math.sin(angle) * 0.17],
    scale: total <= 5 ? 0.98 : 0.73,
  }
}

function waveTransform(index, total) {
  const normalized = total <= 1 ? 0 : index / (total - 1) - 0.5
  const x = normalized * (total <= 5 ? 7.3 : Math.min(total, 18) * 0.67)
  const wave = Math.sin(normalized * Math.PI * 1.25)
  return {
    position: [x, wave * 0.88 - 0.12, -Math.abs(normalized) * 1.9 + wave * 0.25],
    rotation: [0.04, -normalized * 0.98, -wave * 0.18],
    scale: total <= 5 ? 1.02 : 0.78,
  }
}

function gridTransform(index, total) {
  const columns = Math.max(2, Math.ceil(Math.sqrt(total * 1.45)))
  const rows = Math.ceil(total / columns)
  const column = index % columns
  const row = Math.floor(index / columns)
  const centeredX = column - (columns - 1) / 2
  const centeredY = row - (rows - 1) / 2
  return {
    position: [centeredX * 1.55, -centeredY * 1.84, -Math.abs(centeredX) * 0.18 - row * 0.08],
    rotation: [0, -centeredX * 0.075, 0],
    scale: total <= 5 ? 1.16 : 0.82,
  }
}

function arrivalTransform(index, total, seed) {
  const destination = crossTransform(index, total)
  return {
    position: [seed.x, seed.y, -10 - seed.z],
    rotation: [seed.rx, seed.ry, seed.rz],
    scale: 0.25 + destination.scale * 0.25,
  }
}

function finaleTransform(index, total, seed) {
  const orbit = wreathTransform(index, total)
  return {
    position: [orbit.position[0] * 1.5 + seed.x * 0.22, orbit.position[1] * 1.5 + seed.y * 0.18, -8 - seed.z * 0.25],
    rotation: [seed.rx, seed.ry, seed.rz],
    scale: 0.3,
  }
}

function getTransform(index, total, progress, seed) {
  const layouts = [
    arrivalTransform(index, total, seed),
    crossTransform(index, total),
    heroTransform(index, total),
    wreathTransform(index, total),
    waveTransform(index, total),
    gridTransform(index, total),
    finaleTransform(index, total, seed),
  ]
  const phase = PHASES.findIndex((value, index) => progress >= value && progress < PHASES[index + 1])
  const segment = phase === -1 ? PHASES.length - 2 : phase
  const local = smooth((progress - PHASES[segment]) / (PHASES[segment + 1] - PHASES[segment]))
  const result = transform(layouts[segment], layouts[segment + 1], local)
  const transitionArc = Math.sin(local * Math.PI)
  const rotationDirection = index % 2 === 0 ? 1 : -1
  const transitionDepthStep = Math.min(0.38, 7.2 / Math.max(total - 1, 1))
  const transitionDepth = (index - (total - 1) / 2) * transitionArc * transitionDepthStep
  const transitionTurn = (segment + local) * Math.PI * 2 * rotationDirection
  return {
    ...result,
    position: [result.position[0], result.position[1], result.position[2] + index * 0.08 + transitionDepth],
    rotation: [
      result.rotation[0],
      result.rotation[1],
      result.rotation[2] + transitionTurn,
    ],
  }
}

function getFocusTransform(index, transform) {
  if (index === transform.index) return { position: [0, 0, 2.05], rotation: [0, 0, 0], scale: 1.78 }
  return {
    position: [transform.position[0] * 1.28, transform.position[1] * 1.28, transform.position[2] - 2.1],
    rotation: transform.rotation,
    scale: transform.scale * 0.58,
  }
}

function BackgroundDragSurface({ progress, onProgressChange }) {
  const dragRef = useRef(null)

  return (
    <mesh
      position={[0, 0, -20]}
      onPointerDown={(event) => {
        event.stopPropagation()
        dragRef.current = { startX: event.clientX, startY: event.clientY, progress }
        event.target.setPointerCapture?.(event.pointerId)
      }}
      onPointerMove={(event) => {
        if (!dragRef.current) return
        event.stopPropagation()
        const horizontal = (dragRef.current.startX - event.clientX) / window.innerWidth
        const vertical = (dragRef.current.startY - event.clientY) / window.innerHeight
        onProgressChange?.(clamp(dragRef.current.progress + horizontal * 0.82 + vertical * 0.3))
      }}
      onPointerUp={(event) => {
        if (!dragRef.current) return
        event.stopPropagation()
        dragRef.current = null
        event.target.releasePointerCapture?.(event.pointerId)
      }}
      onPointerCancel={() => { dragRef.current = null }}
    >
      <planeGeometry args={[60, 36]} />
      <meshBasicMaterial transparent opacity={0} depthWrite={false} />
    </mesh>
  )
}

export default function Scene({ images = [], progress = 0, focusedIndex = null, onProgressChange, onCardClick }) {
  const seeds = useMemo(() => images.map((_, index) => ({
    x: (Math.sin(index * 41.7) * 0.5 + 0.5) * 11 - 5.5,
    y: (Math.cos(index * 19.3) * 0.5 + 0.5) * 7 - 3.5,
    z: (Math.sin(index * 9.7) * 0.5 + 0.5) * 5,
    rx: Math.sin(index * 3.1) * 0.8,
    ry: Math.cos(index * 1.7) * 0.85,
    rz: Math.sin(index * 2.3) * 0.45,
  })), [images])

  return (
    <>
      <fog attach="fog" args={["#09050d", 9, 22]} />
      <group>
        <BackgroundDragSurface progress={progress} onProgressChange={onProgressChange} />
        <ambientLight color="#ffffff" intensity={2.5} />
        <directionalLight position={[-4, 5, 7]} color="#fff8f5" intensity={0.7} />
        {images.map((image, index) => {
          const baseTransform = getTransform(index, images.length, progress, seeds[index])
          const cardTransform = focusedIndex === null
            ? baseTransform
            : getFocusTransform(index, { ...baseTransform, index: focusedIndex })
          return (
            <Card
              key={image.path}
              index={index}
              image={image}
              transform={cardTransform}
              isFocused={focusedIndex === index}
              onClick={() => onCardClick?.({ ...image, index, total: images.length })}
            />
          )
        })}
      </group>
      <EffectComposer multisampling={0}>
        <Bloom intensity={0.5} luminanceThreshold={0.92} luminanceSmoothing={0.86} mipmapBlur />
        <Vignette eskil={false} offset={0.18} darkness={0.52} />
      </EffectComposer>
    </>
  )
}
