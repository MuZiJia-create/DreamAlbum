import { useEffect, useRef } from "react"
import {
  Clock,
  Mesh,
  OrthographicCamera,
  PlaneGeometry,
  Scene,
  ShaderMaterial,
  Vector2,
  Vector3,
  WebGLRenderer,
} from "three"

const vertexShader = `
precision highp float;
void main() {
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`

const fragmentShader = `
precision highp float;

uniform float iTime;
uniform vec3 iResolution;
uniform float animationSpeed;
uniform bool enableTop;
uniform bool enableMiddle;
uniform bool enableBottom;
uniform int topLineCount;
uniform int middleLineCount;
uniform int bottomLineCount;
uniform float topLineDistance;
uniform float middleLineDistance;
uniform float bottomLineDistance;
uniform vec3 topWavePosition;
uniform vec3 middleWavePosition;
uniform vec3 bottomWavePosition;
uniform vec2 iMouse;
uniform bool interactive;
uniform float bendRadius;
uniform float bendStrength;
uniform float bendInfluence;
uniform bool parallax;
uniform vec2 parallaxOffset;
uniform vec3 lineGradient[8];
uniform int lineGradientCount;

mat2 rotate(float angle) {
  return mat2(cos(angle), sin(angle), -sin(angle), cos(angle));
}

vec3 getLineColor(float value) {
  if (lineGradientCount == 1) return lineGradient[0] * 0.5;
  float scaled = clamp(value, 0.0, 0.9999) * float(lineGradientCount - 1);
  int index = int(floor(scaled));
  float mixAmount = fract(scaled);
  int nextIndex = min(index + 1, lineGradientCount - 1);
  return mix(lineGradient[index], lineGradient[nextIndex], mixAmount) * 0.5;
}

float wave(vec2 uv, float offset, vec2 screenUv, vec2 mouseUv) {
  float time = iTime * animationSpeed;
  float amplitude = sin(offset + time * 0.2) * 0.3;
  float y = sin(uv.x + offset + time * 0.1) * amplitude;

  if (interactive) {
    vec2 distanceToMouse = screenUv - mouseUv;
    float influence = exp(-dot(distanceToMouse, distanceToMouse) * bendRadius);
    y += (mouseUv.y - screenUv.y) * influence * bendStrength * bendInfluence;
  }

  return 0.0175 / max(abs(uv.y - y) + 0.01, 1e-3) + 0.01;
}

void main() {
  vec2 baseUv = (2.0 * gl_FragCoord.xy - iResolution.xy) / iResolution.y;
  baseUv.y *= -1.0;
  if (parallax) baseUv += parallaxOffset;

  vec2 mouseUv = vec2(0.0);
  if (interactive) {
    mouseUv = (2.0 * iMouse - iResolution.xy) / iResolution.y;
    mouseUv.y *= -1.0;
  }

  vec3 color = vec3(0.0);

  if (enableBottom) {
    for (int i = 0; i < bottomLineCount; ++i) {
      float index = float(i);
      float angle = bottomWavePosition.z * log(length(baseUv) + 1.0);
      vec2 rotatedUv = baseUv * rotate(angle);
      color += getLineColor(index / max(float(bottomLineCount - 1), 1.0)) * wave(
        rotatedUv + vec2(bottomLineDistance * index + bottomWavePosition.x, bottomWavePosition.y),
        1.5 + 0.2 * index,
        baseUv,
        mouseUv
      ) * 0.2;
    }
  }

  if (enableMiddle) {
    for (int i = 0; i < middleLineCount; ++i) {
      float index = float(i);
      float angle = middleWavePosition.z * log(length(baseUv) + 1.0);
      vec2 rotatedUv = baseUv * rotate(angle);
      color += getLineColor(index / max(float(middleLineCount - 1), 1.0)) * wave(
        rotatedUv + vec2(middleLineDistance * index + middleWavePosition.x, middleWavePosition.y),
        2.0 + 0.15 * index,
        baseUv,
        mouseUv
      );
    }
  }

  if (enableTop) {
    for (int i = 0; i < topLineCount; ++i) {
      float index = float(i);
      float angle = topWavePosition.z * log(length(baseUv) + 1.0);
      vec2 rotatedUv = baseUv * rotate(angle);
      rotatedUv.x *= -1.0;
      color += getLineColor(index / max(float(topLineCount - 1), 1.0)) * wave(
        rotatedUv + vec2(topLineDistance * index + topWavePosition.x, topWavePosition.y),
        1.0 + 0.2 * index,
        baseUv,
        mouseUv
      ) * 0.1;
    }
  }

  gl_FragColor = vec4(color, 1.0);
}
`

const maxGradientStops = 8

const hexToVector = (hex) => {
  const value = hex.replace("#", "")
  const normalized = value.length === 3
    ? value.split("").map((character) => character + character).join("")
    : value
  return new Vector3(
    parseInt(normalized.slice(0, 2), 16) / 255,
    parseInt(normalized.slice(2, 4), 16) / 255,
    parseInt(normalized.slice(4, 6), 16) / 255,
  )
}

export default function FloatingLines({
  linesGradient,
  enabledWaves = ["top", "middle", "bottom"],
  lineCount = [6, 7, 5],
  lineDistance = [5, 6, 7],
  animationSpeed = 0.75,
  interactive = true,
  bendRadius = 5,
  bendStrength = -0.42,
  mouseDamping = 0.05,
  parallax = true,
  parallaxStrength = 0.16,
  mixBlendMode = "screen",
}) {
  const containerRef = useRef(null)
  const targetMouseRef = useRef(new Vector2(-1000, -1000))
  const currentMouseRef = useRef(new Vector2(-1000, -1000))
  const targetInfluenceRef = useRef(0)
  const currentInfluenceRef = useRef(0)
  const targetParallaxRef = useRef(new Vector2())
  const currentParallaxRef = useRef(new Vector2())

  useEffect(() => {
    const container = containerRef.current
    if (!container) return undefined

    const getValue = (values, waveType, fallback) => {
      if (typeof values === "number") return values
      const index = enabledWaves.indexOf(waveType)
      return index === -1 ? 0 : values[index] ?? fallback
    }
    const topEnabled = enabledWaves.includes("top")
    const middleEnabled = enabledWaves.includes("middle")
    const bottomEnabled = enabledWaves.includes("bottom")
    const scene = new Scene()
    const camera = new OrthographicCamera(-1, 1, 1, -1, 0, 1)
    camera.position.z = 1
    const renderer = new WebGLRenderer({ antialias: true, alpha: false })
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2))
    renderer.domElement.style.width = "100%"
    renderer.domElement.style.height = "100%"
    container.appendChild(renderer.domElement)

    const gradientStops = (linesGradient ?? ["#ffd1dc", "#c7ceea", "#fbe7c6"]).slice(0, maxGradientStops)
    const uniforms = {
      iTime: { value: 0 },
      iResolution: { value: new Vector3(1, 1, 1) },
      animationSpeed: { value: animationSpeed },
      enableTop: { value: topEnabled },
      enableMiddle: { value: middleEnabled },
      enableBottom: { value: bottomEnabled },
      topLineCount: { value: topEnabled ? getValue(lineCount, "top", 6) : 0 },
      middleLineCount: { value: middleEnabled ? getValue(lineCount, "middle", 6) : 0 },
      bottomLineCount: { value: bottomEnabled ? getValue(lineCount, "bottom", 6) : 0 },
      topLineDistance: { value: topEnabled ? getValue(lineDistance, "top", 5) * 0.01 : 0.01 },
      middleLineDistance: { value: middleEnabled ? getValue(lineDistance, "middle", 5) * 0.01 : 0.01 },
      bottomLineDistance: { value: bottomEnabled ? getValue(lineDistance, "bottom", 5) * 0.01 : 0.01 },
      topWavePosition: { value: new Vector3(10, 0.5, -0.4) },
      middleWavePosition: { value: new Vector3(5, 0, 0.2) },
      bottomWavePosition: { value: new Vector3(2, -0.7, 0.4) },
      iMouse: { value: new Vector2(-1000, -1000) },
      interactive: { value: interactive },
      bendRadius: { value: bendRadius },
      bendStrength: { value: bendStrength },
      bendInfluence: { value: 0 },
      parallax: { value: parallax },
      parallaxOffset: { value: new Vector2() },
      lineGradient: { value: Array.from({ length: maxGradientStops }, () => new Vector3(1, 1, 1)) },
      lineGradientCount: { value: gradientStops.length },
    }
    gradientStops.forEach((hex, index) => uniforms.lineGradient.value[index].copy(hexToVector(hex)))

    const geometry = new PlaneGeometry(2, 2)
    const material = new ShaderMaterial({ uniforms, vertexShader, fragmentShader })
    scene.add(new Mesh(geometry, material))
    const clock = new Clock()
    let active = true
    let frameId = 0

    const resize = () => {
      const width = container.clientWidth || 1
      const height = container.clientHeight || 1
      renderer.setSize(width, height, false)
      uniforms.iResolution.value.set(renderer.domElement.width, renderer.domElement.height, 1)
    }
    resize()
    const resizeObserver = new ResizeObserver(resize)
    resizeObserver.observe(container)

    const handlePointerMove = (event) => {
      const rect = renderer.domElement.getBoundingClientRect()
      const x = event.clientX - rect.left
      const y = event.clientY - rect.top
      const pixelRatio = renderer.getPixelRatio()
      targetMouseRef.current.set(x * pixelRatio, (rect.height - y) * pixelRatio)
      targetInfluenceRef.current = 1
      if (parallax) {
        targetParallaxRef.current.set(
          ((x - rect.width * 0.5) / rect.width) * parallaxStrength,
          -((y - rect.height * 0.5) / rect.height) * parallaxStrength,
        )
      }
    }
    const handlePointerLeave = () => { targetInfluenceRef.current = 0 }
    if (interactive) {
      window.addEventListener("pointermove", handlePointerMove, { passive: true })
      window.addEventListener("blur", handlePointerLeave)
    }

    const render = () => {
      if (!active) return
      uniforms.iTime.value = clock.getElapsedTime()
      if (interactive) {
        currentMouseRef.current.lerp(targetMouseRef.current, mouseDamping)
        uniforms.iMouse.value.copy(currentMouseRef.current)
        currentInfluenceRef.current += (targetInfluenceRef.current - currentInfluenceRef.current) * mouseDamping
        uniforms.bendInfluence.value = currentInfluenceRef.current
      }
      if (parallax) {
        currentParallaxRef.current.lerp(targetParallaxRef.current, mouseDamping)
        uniforms.parallaxOffset.value.copy(currentParallaxRef.current)
      }
      renderer.render(scene, camera)
      frameId = requestAnimationFrame(render)
    }
    render()

    return () => {
      active = false
      cancelAnimationFrame(frameId)
      resizeObserver.disconnect()
      if (interactive) {
        window.removeEventListener("pointermove", handlePointerMove)
        window.removeEventListener("blur", handlePointerLeave)
      }
      geometry.dispose()
      material.dispose()
      renderer.dispose()
      renderer.forceContextLoss()
      renderer.domElement.remove()
    }
  }, [animationSpeed, bendRadius, bendStrength, enabledWaves, interactive, lineCount, lineDistance, linesGradient, mouseDamping, parallax, parallaxStrength])

  return <div ref={containerRef} className="floating-lines-container" style={{ mixBlendMode }} />
}
