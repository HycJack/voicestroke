# VoiceStroke

语音输入汉字，自动演示笔顺动画。

## 功能特性

- 🎤 **语音识别**：说出中文词语，自动识别并提取汉字
- ✍️ **笔顺演示**：播放汉字书写动画，展示标准笔顺
- 📝 **逐笔练习**：单步播放每一笔，方便学习临摹
- ⭐ **收藏功能**：收藏常用汉字，快速访问
- 🔊 **速度调节**：支持 0.5x - 3x 播放速度
- 📱 **响应式设计**：适配桌面和移动端

## 技术栈

- React 18 + TypeScript
- Vite
- Tailwind CSS 4
- [HanziWriter](https://chanind.github.io/hanzi-writer/) - 汉字笔顺动画库

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

## 部署

项目配置了 GitHub Actions，推送到 `main` 分支后自动部署到 GitHub Pages。

访问地址：https://hycjack.github.io/voicestroke.github.io/

## 使用方法

1. 点击麦克风按钮开始语音输入
2. 说出中文词语（如"你好"）
3. 点击识别出的汉字查看笔顺动画
4. 切换"逐笔练习"模式逐笔学习
5. 点击星标收藏常用汉字

## 浏览器支持

- Chrome（推荐，语音识别支持最佳）
- Edge
- Safari（部分功能受限）

## License

MIT
