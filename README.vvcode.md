# VVCode

> **基于 [Cline](https://github.com/cline/cline) 的 AI 编程助手**

VVCode 是一个强大的 VSCode 扩展，提供 AI 驱动的自主编码能力。它可以在您的 IDE 中直接创建/编辑文件、运行命令、使用浏览器等，每一步都需要您的许可。

## ⚠️ 重要声明

本项目是基于 [Cline](https://github.com/cline/cline) (原名 Claude Dev) 进行修改的版本。

**原项目信息：**
- 原项目名称：Cline
- 版权所有：© 2025 Cline Bot Inc.
- 许可证：Apache License 2.0
- 原项目地址：https://github.com/cline/cline

根据 Apache 2.0 许可证，本项目：
- ✅ 保留了原始的 LICENSE 文件和版权声明
- ✅ 在修改的基础上创建了新的品牌标识
- ✅ 明确标注为基于 Cline 的派生作品
- ❌ 不声称与 Cline Bot Inc. 有任何官方关联

## 🎯 核心功能

### 1. **多 AI 模型支持**
- 支持 Anthropic Claude、OpenAI、Google Gemini、AWS Bedrock 等
- 支持 OpenRouter、Ollama、LM Studio 等平台
- 实时追踪 Token 使用和成本

### 2. **强大的工具集**
- **文件操作**：创建、编辑文件，实时差异对比
- **终端集成**：执行命令、运行脚本、管理进程
- **浏览器自动化**：UI 测试和调试
- **MCP 集成**：通过 Model Context Protocol 扩展功能

### 3. **智能代码助手**
- 分析项目结构和源代码
- 监控编译错误和 Linter 警告
- 自动上下文管理
- Plan/Act 双模式工作流

### 4. **安全可控**
- 所有操作需要用户批准
- 基于 Git 的检查点系统
- 完整的操作历史记录
- 可随时回滚更改

## 📦 安装

### 前提条件
- Node.js 20.x 或更高版本
- VSCode 1.84.0 或更高版本

### 从源码构建

```bash
# 克隆仓库
git clone https://github.com/PiuQiuPiaQia/vv-code.git
cd vv-code

# 安装依赖
npm run install:all

# 构建项目
npm run package

# 本地安装
code --install-extension vvcode-1.0.0.vsix
```

## 🚀 快速开始

1. 在 VSCode 中打开 VVCode 侧边栏
2. 配置您的 AI API 密钥（设置 → API 配置）
3. 开始您的第一个任务！

### 示例任务

```
创建一个 React 组件用于显示用户信息卡片
```

```
帮我修复这个项目中的所有 TypeScript 错误
```

```
编写单元测试覆盖 src/utils 目录下的所有函数
```

## 🔧 开发

```bash
# 开发模式（支持热重载）
npm run dev

# 运行测试
npm test

# 代码格式化
npm run format:fix

# 类型检查
npm run check-types
```

## 📝 与原项目的主要差异

1. **品牌标识**：更换为 VVCode 品牌
2. **发布者信息**：使用独立的发布者账号
3. **仓库地址**：指向新的 GitHub 仓库
4. **版本号**：从 1.0.0 开始

核心功能和代码逻辑保持与原项目一致。

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

在贡献之前，请：
1. 阅读原项目的 [贡献指南](https://github.com/cline/cline/blob/main/CONTRIBUTING.md)
2. 确保代码符合项目的编码规范
3. 添加必要的测试用例
4. 更新相关文档

## 📄 许可证

本项目采用 **Apache License 2.0** 许可证 - 详见 [LICENSE](LICENSE) 文件。

### 归属声明

本项目基于 Cline 进行修改，Cline 的版权归 Cline Bot Inc. 所有。

原项目声明：
```
Copyright 2025 Cline Bot Inc.

Licensed under the Apache License, Version 2.0
```

本项目的修改部分：
```
Copyright 2025 [Your Name]

Licensed under the Apache License, Version 2.0
```

根据 Apache 2.0 许可证第 6 条，本项目不使用 Cline 的商标、服务标志或产品名称。

## 🔗 相关链接

- 原项目 Cline：https://github.com/cline/cline
- Cline 官网：https://cline.bot
- Apache 2.0 许可证：https://www.apache.org/licenses/LICENSE-2.0

## ⚖️ 商标声明

"Cline" 是 Cline Bot Inc. 的商标。本项目 "VVCode" 是一个独立的派生作品，与 Cline Bot Inc. 没有官方关联、认可或赞助关系。

---

**致谢**：感谢 Cline 团队创建了如此优秀的开源项目！🙏
