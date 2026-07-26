# Dream Album Agent Rules

## 核心原则

后续所有代码重构与开发必须遵循高品质视觉效果优先原则，禁止使用为了规避依赖、降低实现难度或快速通过构建而产生的低质量简易替代方案。

## 1. 粒子与视觉贴图

- 禁止使用简单 Canvas 2D 几何图形，例如 `ellipse()`、`bezierCurveTo()`、`rect()`，硬绘羽毛、花瓣、光斑、发光图案等复杂视觉贴图。
- 粒子贴图必须使用高精度透明 SVG Base64 Data-URI、高清透明 PNG 或 Three.js Custom Shader GLSL。
- 贴图必须具备自然透明渐变、羽化边缘、绒毛细节和真实透光层次。
- 粒子材质必须根据场景职责正确配置 `transparent`、`depthWrite`、`depthTest` 与 `blending`，不得用简单降低透明度掩盖渲染问题。

## 2. 动画与状态转换

- 禁止排版切换、文字更新或交互状态使用瞬间硬切。
- 所有进场、退场和状态变化必须使用 GSAP、Framer Motion `AnimatePresence` 或 Three.js `useFrame` Lerp 补间。
- 中央文字切换必须包含 Blur、Glow 和 Opacity 渐变过程，并保证退场与进场时序连续。
- 3D 卡片阵型切换必须同时平滑插值位置、旋转、缩放与深度，不得只修改位置数据。

## 3. 材质、色彩与光照

- 禁止使用全白 `emissive` 或过高光照强行提升图片亮度。
- 图片贴图必须正确设置 `THREE.SRGBColorSpace` 和 `needsUpdate`，保持原图色彩、饱和度与对比度。
- 照片材质优先使用 `color: "#ffffff"`、`metalness: 0`、`roughness: 0.2`，禁止用灰色或粉色基色污染贴图。
- 必须通过合理的 `ambientLight`、方向光和 Tone Mapping 还原画面，不得用白色雾膜、强发光或过曝反射处理亮度问题。

## 4. 深度、层级与穿模

- 遇到 Z-Clipping、半透明黑边或层级错乱时，必须修复根因，不得隐藏元素或整体降低透明度规避问题。
- 3D 阵型必须使用明确的物理 Z 轴错位和动态深度计算，确保交叉轨道与转场路径不会共面穿插。
- 需要时必须显式设置 `renderOrder`，并为粒子和透明层正确配置 `depthWrite: false`、`depthTest` 与 `THREE.AdditiveBlending`。
- 卡片内部的图片、Alpha Mask、透明层必须有明确的深度顺序，避免 Z-Fighting 和透明排序错误。

## 5. 交付与验证

- 修改前先阅读现有组件、材质、动画和交互链路，优先修复根因。
- 不得为了减少代码量删除实际需求、视觉层级或交互状态。
- 每次视觉重构后必须运行生产构建，并检查关键资源是否可加载、动画是否连续、材质是否产生异常白斑或黑边。
- 代码必须保持可维护性，复杂的数学布局、深度排序和动画逻辑应保留必要的上下文说明。
