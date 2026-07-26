# AGENTS.md — Dream Album AI开发规范

## 项目概述
- **名称**：Dream Album — 暗黑浪漫 3D 交互卡片画廊
- **技术栈**：React 18 + Vite 6 + Three.js (R3F) + Tailwind CSS
- **运行命令**：`npm run dev` (http://localhost:5173)
- **关键依赖**：@react-three/fiber, @react-three/drei, @react-three/postprocessing, lucide-react

---

## 开发流程规范 (AI-Assisted Development Workflow)

### Phase 1：需求分析 & 架构设计
1. 在 `AI_GUIDE.md` 中填写项目描述，包含：项目概述、核心功能、技术栈、UI参考
2. AI 先读取并理解 `AI_GUIDE.md`，输出技术方案确认
3. 确认后 AI 提供分阶段开发计划 (Roadmap)

### Phase 2：环境搭建
- 使用 Vite + React 作为项目脚手架
- 安装依赖：`npm install`
- 确认开发服务器正常启动：`npm run dev`

### Phase 3：模块化开发
- **原则**：每个组件单一职责，可独立测试
- **文件结构**：`src/components/3d/` (3D组件) + `src/components/ui/` (UI组件)
- **数据流**：状态统一在 `App.jsx` 管理，通过 props 下传
- **图片资源**：放入 `public/pictures/` 目录，通过绝对路径引用

### Phase 4：迭代优化
- 每次只修改一个关注点 (Single Concern)
- 保持代码风格一致：无分号 JSX、压缩风格、单引号
- 提交前验证：`npm run dev` 无报错
---

## Coding Standards

### File Naming
- React components: `PascalCase.jsx` (e.g. `Card.jsx`, `HUD.jsx`)
- Utility functions: `camelCase.js`
- Static assets: `kebab-case`

### Component Conventions
- Use `export default function` to export components
- Props with destructured defaults: `{title="", progress=0}`
- Inline styles using style objects, not CSS files
- Use `className` not `class` attribute

### Three.js / R3F Conventions
- Cache heavy ops in `useMemo`, avoid recomputation in `useFrame`
- Load textures with `useLoader(THREE.TextureLoader, url)`
- Chinese file paths MUST be UTF-8 encoded; filenames with `&` need special handling
- Particles MUST set `depthWrite: false` + `blending: THREE.AdditiveBlending`
- Use `EffectComposer` wrapping `Bloom` for post-processing
- Set `toneMapped: false` on emissive/glow materials to preserve HDR bloom

### Encoding Rules
- **All files MUST be saved with UTF-8 encoding**
- Write Chinese characters directly, not as Unicode escape sequences
- On Windows PowerShell, use Python intermediary scripts to write Chinese content
- Verify encoding: `python -c "print(open('file.jsx',encoding='utf-8').read()[:200])"`

---

## Troubleshooting Quick Reference

### Chinese Mojibake (Garbled Text)
1. Confirm file is saved as UTF-8 (not GBK/GB2312)
2. Use Python to verify: `python -c "open('f','r',encoding='utf-8').read()"`
3. Never pipe Chinese through PowerShell `python -c "..."` directly

### Image Loading Failures
1. Verify file exists in `public/pictures/`
2. Paths must start with `/` (relative to public directory)
3. Filenames containing `&` may need URL encoding to `%26` in React
4. Always provide fallback URLs (picsum/unsplash) to prevent blank cards

### Particles Blocking View
- Particle size should be 0.3-0.6 (NOT > 1.0)
- Must set `depthWrite: false` on pointsMaterial
- Use `AdditiveBlending` to create glow, not opaque blobs
- Total count: 250-400 (NOT 800+)
- Scatter Z range: -15 to +5, X/Y: +/- 15-20

### Performance Checklist
- Particles use `PointsMaterial` (single draw call), NOT individual Meshes
- Cache geometries and textures with `useMemo`
- Minimize per-frame calculations in `useFrame`
- Bloom intensity <= 1.0, luminanceThreshold >= 0.15
- Test on target GPU: RTX 3070 should maintain 60fps