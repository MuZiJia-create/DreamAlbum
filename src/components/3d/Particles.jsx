import { useFrame } from "@react-three/fiber"
import { useMemo, useRef } from "react"
import * as THREE from "three"

const FEATHER_SVG = "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAxMDAgMTAwIj48cGF0aCBkPSJNNTAgNSBDIDY1IDI1LCA3NSA1MCwgNTAgOTUgQyA0NSA3MCwgMzAgNDAsIDUwIDUgWiIgZmlsbD0id2hpdGUiIG9wYWNpdHk9IjAuODUiLz48cGF0aCBkPSJNNTAgNSBRIDUyIDUwIDUwIDk1IiBzdHJva2U9InJnYmEoMjU1LDI1NSwyNTUsMC41KSIgc3Ryb2tlLXdpZHRoPSIxLjUiLz48L3N2Zz4="

export default function Particles() {
  const count = 90
  const meshRef = useRef(null)
  const texture = useMemo(() => {
    const loadedTexture = new THREE.TextureLoader().load(FEATHER_SVG)
    loadedTexture.colorSpace = THREE.SRGBColorSpace
    loadedTexture.minFilter = THREE.LinearFilter
    loadedTexture.magFilter = THREE.LinearFilter
    loadedTexture.wrapS = THREE.ClampToEdgeWrapping
    loadedTexture.wrapT = THREE.ClampToEdgeWrapping
    loadedTexture.needsUpdate = true
    return loadedTexture
  }, [])

  const particles = useMemo(() => {
    const values = []
    for (let index = 0; index < count; index += 1) {
      values.push({
        x: (Math.random() - 0.5) * 18,
        y: (Math.random() - 0.5) * 14,
        z: (Math.random() - 0.5) * 10 - 2,
        speedY: 0.005 + Math.random() * 0.008,
        swaySpeed: 0.5 + Math.random() * 1.5,
        rotSpeed: (Math.random() - 0.5) * 0.02,
        scale: 0.15 + Math.random() * 0.25,
        color: new THREE.Color().setHSL(0.9 + Math.random() * 0.15, 0.8, 0.85),
      })
    }
    return values
  }, [count])

  const dummy = useMemo(() => new THREE.Object3D(), [])

  useFrame((state) => {
    const mesh = meshRef.current
    if (!mesh) return
    const time = state.clock.getElapsedTime()

    particles.forEach((particle, index) => {
      particle.y -= particle.speedY
      particle.x += Math.sin(time * particle.swaySpeed + index) * 0.006
      if (particle.y < -7) particle.y = 7

      dummy.position.set(particle.x, particle.y, particle.z)
      dummy.rotation.set(
        Math.sin(time * 0.5 + index) * 0.5,
        Math.cos(time * 0.3 + index) * 0.5,
        time * particle.rotSpeed,
      )
      dummy.scale.setScalar(particle.scale)
      dummy.updateMatrix()
      mesh.setMatrixAt(index, dummy.matrix)
      mesh.setColorAt(index, particle.color)
    })

    mesh.instanceMatrix.needsUpdate = true
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true
  })

  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, count]} renderOrder={0}>
      <planeGeometry args={[1, 1]} />
      <meshBasicMaterial map={texture} transparent depthWrite={false} blending={THREE.AdditiveBlending} side={THREE.DoubleSide} toneMapped={false} />
    </instancedMesh>
  )
}
