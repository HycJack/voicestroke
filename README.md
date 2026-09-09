# VoiceStroke

语音输入汉字，自动演示笔顺动画。

## 功能特性

- 🎤 **语音识别**：说出中文词语，自动识别并提取汉字
- ✍️ **笔顺演示**：播放汉字书写动画，展示标准笔顺
- 📝 **逐笔练习**：单步播放每一笔，方便学习临摹
- 🔊 **语音跟读**：每笔动画开始时用中文播报笔名（横/竖/撇/捺…），可一键开关
- 🖼️ **笔画列表**：展示所有笔画缩略图，点击跳转到指定笔画
- ⭐ **收藏功能**：收藏常用汉字，快速访问
- 🎚️ **速度调节**：支持 0.5x - 3x 播放速度
- 📱 **响应式设计**：适配桌面和移动端
- 🚀 **PWA 离线可用**：安装到主屏幕后，汉字数据本地缓存，弱网/离线可继续学习

## 技术栈

- React 18 + TypeScript
- Vite
- Tailwind CSS 4
- [HanziWriter](https://chanind.github.io/hanzi-writer/) - 汉字笔顺动画库
- Web Speech API（语音识别 + 笔名读音，纯本地发音，无需网络）

## 本地开发

```bash
# 安装依赖
npm install

# 启动开发服务器
npm run dev

# 构建生产版本
npm run build

# 预览生产版本
npm run preview
```

## PWA / 离线说明

- `public/manifest.webmanifest` 定义应用清单；`public/sw.js` 为 Service Worker
- 缓存策略：
  - App shell（首页/图标/清单）：安装时预缓存
  - hanzi-writer 字数据（cdn.jsdelivr.net）：stale-while-revalidate，**离线可回放已学过的字**
  - 同源 hash 资源、Google Fonts：缓存优先
- 首次完整访问后即可离线使用；SW 仅在**生产构建**注册（`npm run build` + `npm run preview` 或部署后生效）
- PWA 需要 HTTPS 或 localhost 安全上下文
- 部署路径前缀为 `/voicestroke/`（见 `vite.config.ts` 的 `base`）

## 布局与无障碍

- 画布区自适应滚动，笔画过多时笔画列表纵向滚动并自动定位当前笔
- 支持 `prefers-reduced-motion` 减动效
- 状态变化对屏幕阅读器播报（`aria-live`）；图标按钮均带 `aria-label`

## 部署

项目配置了 GitHub Actions，推送到 `main` 分支后自动部署到 GitHub Pages。

访问地址：https://hycjack.github.io/voicestroke.github.io/

## 使用方法

1. 点击麦克风按钮开始语音输入
2. 说出中文词语（如"你好"）
3. 点击识别出的汉字查看笔顺动画
4. 切换"逐笔练习"模式逐笔学习（可开启语音跟读按钮🔊）
5. 点击星标收藏常用汉字

## 浏览器支持

- Chrome（推荐，语音识别 + speechSynthesis 支持最佳）
- Edge
- Safari（部分语音功能受限；iOS 安装到主屏幕可获得 PWA 体验）

## License

MIT