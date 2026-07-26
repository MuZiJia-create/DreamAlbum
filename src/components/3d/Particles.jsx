import { useFrame, useLoader } from "@react-three/fiber"
import { useMemo, useRef } from "react"
import * as THREE from "three"

const PARTICLE_COUNT = 96
const PASTEL_COLORS = ["#ffd1dc", "#fbe7c6", "#c7ceea", "#f4c2e7"]
const SAKURA_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 160 160"><defs><radialGradient id="p" cx="50%" cy="42%" r="60%"><stop offset="0" stop-color="#fff" stop-opacity=".96"/><stop offset=".48" stop-color="#fff" stop-opacity=".7"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></radialGradient><filter id="s"><feGaussianBlur stdDeviation=".7"/></filter></defs><g filter="url(#s)" fill="url(#p)"><path d="M80 78C51 28 17 28 19 55c2 25 29 34 57 26Z"/><path d="M82 78c50-28 76-5 62 19-13 21-39 12-62-12Z"/><path d="M82 80c24 50-4 76-27 61-20-13-10-39 21-61Z"/><path d="M79 81c-48 29-75 4-61-20 13-21 39-10 61 12Z"/><path d="M79 79c-17-54 14-74 35-53 18 17 2 40-32 53Z"/><circle cx="80" cy="80" r="12" fill="#fff" fill-opacity=".84"/></g></svg>`
const SAKURA_TEXTURE_URI = `data:image/svg+xml;base64,${btoa(SAKURA_SVG)}`

const randomBetween = (minimum, maximum) => minimum + Math.random() * (maximum - minimum)

function SakuraParticle({ index, texture }) {
  const meshRef = useRef()
  const materialRef = useRef()
  const data = useMemo(() => ({
    x: randomBetween(-12, 12),
    y: randomBetween(-10, 12),
    z: randomBetween(-5, 1.5),
    scale: randomBetween(0.28, 0.58),
    speed: randomBetween(0.003, 0.009),
    phase: randomBetween(0, Math.PI * 2),
    color: PASTEL_COLORS[index % PASTEL_COLORS.length],
  }), [index])

  useFrame((state, delta) => {
    const mesh = meshRef.current
    if (!mesh) return
    const time = state.clock.elapsedTime
    mesh.position.y -= data.speed * delta * 60
    mesh.position.x += Math.sin(time + index) * 0.01 * delta * 60
    mesh.position.z += Math.sin(time * 0.5 + data.phase) * 0.0015 * delta * 60
    mesh.rotation.z += Math.sin(time * 0.6 + index) * 0.004 * delta * 60
    mesh.rotation.x = Math.sin(time * 0.35 + data.phase) * 0.18
    if (materialRef.current) materialRef.current.opacity = 0.32 + Math.sin(time * 0.9 + data.phase) * 0.1
    if (mesh.position.y < -11) mesh.position.set(randomBetween(-12, 12), 12 + Math.random() * 3, randomBetween(-5, 1.5))
  })

  return (
    <mesh ref={meshRef} position={[data.x, data.y, data.z]} scale={data.scale} rotation={[0, 0, data.phase]} renderOrder={0}>
      <planeGeometry args={[1, 1]} />
      <meshBasicMaterial ref={materialRef} map={texture} color={data.color} transparent opacity={0.38} depthWrite={false} depthTest blending={THREE.AdditiveBlending} side={THREE.DoubleSide} toneMapped={false} />
    </mesh>
  )
}

export default function Particles() {
  const sakuraTexture = useLoader(THREE.TextureLoader, SAKURA_TEXTURE_URI)
  const texture = useMemo(() => {
    sakuraTexture.colorSpace = THREE.SRGBColorSpace
    sakuraTexture.minFilter = THREE.LinearFilter
    sakuraTexture.magFilter = THREE.LinearFilter
    sakuraTexture.needsUpdate = true
    return sakuraTexture
  }, [sakuraTexture])

  return (
    <group renderOrder={0}>
      {Array.from({ length: PARTICLE_COUNT }, (_, index) => <SakuraParticle key={index} index={index} texture={texture} />)}
    </group>
  )
}
