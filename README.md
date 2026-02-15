# 衣橱管家 (Outfit Mate) 👗✨

**衣橱管家** 是一款专为追求时尚与秩序的用户设计的 AI 智能衣橱管理与穿搭助手。通过深度集成的 AI 技术，它能帮助你轻松记录每一件单品，自动分类归档，并提供专业的穿搭建议。

![iOS Premium Design](https://img.shields.io/badge/UI-iOS_Premium-blue)
![Next.js](https://img.shields.io/badge/Framework-Next.js_16-black)
![AI Powered](https://img.shields.io/badge/AI-Volcengine_Doubao-orange)

## 🌟 核心特性

- **🤖 AI 智能识图**：集成豆包大模型，拍照或上传即可自动识别单品类别、材质、颜色及适用季节，告别繁琐的手动输入。
- **📱 极致 iOS 美学**：采用最新的苹果设计语言，包含灵动岛风格圆角、半透明毛玻璃效果（Glassmorphism）以及丝滑的微交互动画。
- **☁️ 云端同步与备份**：基于 Supabase 构建，支持多端数据实时同步，确保你的衣橱数据永不丢失。
- **💰 闲鱼一键转卖**：自带 “回血” 神器，AI 会根据衣物特征为你生成极具吸引力的闲鱼转卖文案。
- **📤 社交分享**：支持 Web Share API，一键将你的今日穿搭或心爱单品分享给好友。
- **📦 跨平台支持**：支持 PWA，并已集成 Capacitor，可随时打包为 Android/iOS 原生应用。

## 🛠️ 技术栈

- **前端框架**：[Next.js 16 (App Router)](https://nextjs.org/)
- **后端服务**：[Supabase](https://supabase.com/) (Database & Storage)
- **人工智能**：[火山引擎 (Volcengine) 豆包大模型](https://www.volcengine.com/)
- **端侧打包**：[Capacitor](https://capacitorjs.com/)
- **样式方案**：Vanilla CSS (模块化)

## 🚀 快速开始

### 1. 克隆项目
```bash
git clone https://github.com/fialhomarlene845-dev/outfit-mate-app-new.git
cd outfit-mate-app-new
```

### 2. 安装依赖
```bash
npm install
```

### 3. 环境配置
在项目根目录创建 `.env.local` 文件，并配置以下变量：
```env
# 火山引擎 AI 配置
VOLC_API_KEY=你的API密钥
VOLC_ENDPOINT_ID=你的推理终端ID

# Supabase 配置
NEXT_PUBLIC_SUPABASE_URL=你的Supabase项目地址
NEXT_PUBLIC_SUPABASE_ANON_KEY=你的匿名密钥
```

### 4. 启动开发服务器
```bash
npm run dev
```
打开 [http://localhost:3000](http://localhost:3000) 即可访问。

## 📸 界面预览

- **首页**：瀑布流展示所有单品，支持搜索与多维过滤。
- **拍摄页**：沉浸式拍摄识别界面，支持 AI 实时解构服装款式。
- **设置页**：可自定义 AI 管家的 “性格” 与生成规则。

## 📄 开源协议

本项目遵循 MIT 协议。
