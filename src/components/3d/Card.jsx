import { useFrame, useLoader, useThree } from "@react-three/fiber"
import { useMemo, useRef, useState } from "react"
import * as THREE from "three"

const CARD_WIDTH = 1.58
const CARD_HEIGHT = 2.1
const CARD_RATIO = CARD_WIDTH / CARD_HEIGHT

const lerp = (from, to, amount) => from + (to - from) * amount

function createRoundedAlphaMap() {
  const canvas = document.createElement("canvas")
  canvas.width = 256
  canvas.height = 256
  const context = canvas.getContext("2d")
  const radius = 15
  context.beginPath()
  context.moveTo(radius, 0)
  context.lineTo(256 - radius, 0)
  context.quadraticCurveTo(256, 0, 256, radius)
  context.lineTo(256, 256 - radius)
  context.quadraticCurveTo(256, 256, 256 - radius, 256)
  context.lineTo(radius, 256)
  context.quadraticCurveTo(0, 256, 0, 256 - radius)
  context.lineTo(0, radius)
  context.quadraticCurveTo(0, 0, radius, 0)
  context.closePath()
  context.fillStyle = "#ffffff"
  context.fill()
  const texture = new THREE.CanvasTexture(canvas)
  texture.needsUpdate = true
  return texture
}

function configureCoverTexture(sourceTexture, anisotropy) {
  sourceTexture.colorSpace = THREE.SRGBColorSpace
  const texture = sourceTexture.clone()
  texture.image = sourceTexture.image
  texture.colorSpace = THREE.SRGBColorSpace
  texture.generateMipmaps = true
  texture.minFilter = THREE.LinearMipmapLinearFilter
  texture.magFilter = THREE.LinearFilter
  texture.wrapS = THREE.ClampToEdgeWrapping
  texture.wrapT = THREE.ClampToEdgeWrapping
  texture.anisotropy = anisotropy

  const imageAspect = texture.image.width / texture.image.height
  if (imageAspect > CARD_RATIO) {
    const visibleWidth = CARD_RATIO / imageAspect
    texture.repeat.set(visibleWidth, 1)
    texture.offset.set((1 - visibleWidth) / 2, 0)
  } else {
    const visibleHeight = imageAspect / CARD_RATIO
    texture.repeat.set(1, visibleHeight)
    texture.offset.set(0, (1 - visibleHeight) / 2)
  }
  texture.needsUpdate = true
  return texture
}

export default function Card({ index, image, transform, isFocused, onClick }) {
  const groupRef = useRef()
  const [hovered, setHovered] = useState(false)
  const { gl } = useThree()
  const sourceTexture = useLoader(THREE.TextureLoader, image.path)
  const anisotropy = gl.capabilities.getMaxAnisotropy()
  const imageGeometry = useMemo(() => new THREE.PlaneGeometry(CARD_WIDTH, CARD_HEIGHT), [])
  const cornerAlphaMap = useMemo(createRoundedAlphaMap, [])
  const coverTexture = useMemo(
    () => configureCoverTexture(sourceTexture, anisotropy),
    [anisotropy, sourceTexture],
  )
  useFrame((_, delta) => {
    if (!groupRef.current) return
    const motionEase = 1 - Math.exp(-delta * 6)
    const rotationEase = 1 - Math.exp(-delta * 3.2)
    const isActive = hovered || isFocused
    const baseScale = transform.scale * (hovered ? 1.1 : 1)
    const targetZ = transform.position[2] + (isActive ? 1.2 : 0)
    const floatingY = transform.position[1] + Math.sin(_.clock.elapsedTime * 1.5 + index * 0.5) * 0.08
    groupRef.current.position.x = lerp(groupRef.current.position.x, transform.position[0], motionEase)
    groupRef.current.position.y = lerp(groupRef.current.position.y, floatingY, motionEase)
    groupRef.current.position.z = lerp(groupRef.current.position.z, targetZ, motionEase)
    groupRef.current.rotation.x = lerp(groupRef.current.rotation.x, transform.rotation[0], rotationEase)
    groupRef.current.rotation.y = lerp(groupRef.current.rotation.y, transform.rotation[1], rotationEase)
    groupRef.current.rotation.z = lerp(groupRef.current.rotation.z, transform.rotation[2], rotationEase)
    groupRef.current.scale.setScalar(lerp(groupRef.current.scale.x, baseScale, motionEase))
    const baseRenderOrder = isActive
      ? 9999
      : Math.floor(1000 + groupRef.current.position.z * 10)
    groupRef.current.renderOrder = baseRenderOrder

    groupRef.current.children.forEach((child, layerIndex) => {
      child.renderOrder = baseRenderOrder + layerIndex
    })
  })

  return (
    <group
      ref={groupRef}
      position={transform.position}
      rotation={transform.rotation}
      scale={transform.scale}
      renderOrder={isFocused ? 9999 : Math.floor(1000 + transform.position[2] * 10)}
      onPointerEnter={(event) => {
        event.stopPropagation()
        setHovered(true)
        document.body.style.cursor = "pointer"
      }}
      onPointerLeave={() => {
        setHovered(false)
        document.body.style.cursor = "default"
      }}
      onPointerDown={(event) => event.stopPropagation()}
      onPointerMove={(event) => event.stopPropagation()}
      onPointerUp={(event) => event.stopPropagation()}
      onClick={(event) => {
        event.stopPropagation()
        onClick?.()
      }}
    >
      <mesh geometry={imageGeometry} renderOrder={1}>
        <meshStandardMaterial
          map={coverTexture}
          alphaMap={cornerAlphaMap}
          color="#ffffff"
          emissive="#000000"
          emissiveIntensity={0}
          roughness={0.2}
          metalness={0}
          side={THREE.FrontSide}
          transparent
          opacity={1}
          depthTest
          depthWrite
          alphaTest={0.5}
          polygonOffset
          polygonOffsetFactor={-1}
        />
      </mesh>
    </group>
  )
}
