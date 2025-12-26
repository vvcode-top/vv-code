# VVCode

VVCode 是一个强大的 VSCode AI 编程助手，提供自主编码能力。它可以在您的 IDE 中直接创建/编辑文件、运行命令、使用浏览器等，每一步都需要您的许可。

### 加入交流群

QQ群：302736266

## 核心功能

### 多分组支持
- 支持创建多个工作分组，不同场景灵活切换
- 每个分组独立配置，互不干扰
- 分组间快速切换，提升工作效率
- 实时追踪使用情况和成本

### 强大的工具集
- **文件操作**：创建、编辑文件，实时差异对比
- **终端集成**：执行命令、运行脚本、管理进程
- **浏览器自动化**：UI 测试和调试
- **MCP 集成**：通过 Model Context Protocol 扩展功能

### 智能代码助手
- 分析项目结构和源代码
- 监控编译错误和 Linter 警告
- 自动上下文管理
- Plan/Act 双模式工作流

### 安全可控
- 所有操作需要用户批准
- 基于 Git 的检查点系统
- 完整的操作历史记录
- 可随时回滚更改

## 安装

### 从 VSIX 安装
1. 下载最新的 `.vsix` 文件
2. 在 VSCode 中：扩展 → ... → 从 VSIX 安装

### 从源码构建

```bash
git clone https://github.com/vvcode-top/vv-code.git
cd vv-code
npm run install:all
npm run package
npx vsce package --no-dependencies
```

## 快速开始

1. 在 VSCode 中打开 VVCode 侧边栏
2. 使用 VVCode 账号登录（自动配置 API）
3. 开始您的第一个任务！

## 许可证

本项目采用 Apache License 2.0 许可证。

本项目基于 [Cline](https://github.com/cline/cline) 开发，原项目版权归 Cline Bot Inc. 所有。

## 链接

- 官网：https://vvcode.top
