# 二次开发指南 (Fork Development Guide)

本项目是基于 Cline 的二次开发版本。**核心原则：尽量减少对原代码的破坏性修改，保持与上游的兼容性。**

## 安全的定制位置（低侵入性）

**1. 品牌化修改（Brand Customization）**
- `package.json` - name, displayName, description, publisher, repository
- `assets/icons/` - 替换图标文件（icon.png, icon.svg）
- `webview-ui/src/` - UI 组件的样式和文案
- `README.md`, `README.vvcode.md` - 文档
- 不要修改：核心逻辑、API 接口、工具定义

**2. 添加新的 API Provider（推荐方式）**
- 在 `src/api/providers/` 下创建新文件（如 `oca.ts`）
- 参考 `anthropic.ts` 或 `openrouter.ts` 的结构
- 在 `src/api/index.ts` 中注册新 provider
- 在 `webview-ui/src/components/settings/providers/` 添加设置 UI
- **不要修改**现有 provider 的核心逻辑

**3. 扩展配置项**
- 在 `src/shared/` 中添加新的类型定义
- 通过 Controller 的 state management 添加新配置
- 在 webview settings 中添加 UI
- 使用 VSCode 的 globalState 或 secrets 存储

**4. 添加自定义工具**
- 在 `src/core/prompts/system-prompt/tools/` 创建新工具定义
- 在 `src/core/task/tools/handlers/` 实现工具处理器
- 按照"Adding Tools to System Prompt"部分的步骤操作
- 保持现有工具不变

**5. 自定义 Slash Commands**
- 在 `src/core/slash-commands/index.ts` 添加新命令
- 在 `webview-ui/src/utils/slash-commands.ts` 添加自动完成
- 不要删除原有命令（可以禁用）

## 避免的修改（高侵入性）

❌ **不要修改这些核心文件**：
- `src/core/task/index.ts` - 任务执行核心
- `src/core/controller/index.ts` - 状态管理核心
- `src/core/webview/index.ts` - WebView 提供者
- `proto/` 文件 - 除非添加新功能，不要修改现有定义
- `src/core/prompts/system-prompt/components/` - 共享的系统提示组件

❌ **避免直接修改的地方**：
- 现有 API provider 的实现细节
- 核心工具的执行逻辑
- gRPC 消息处理流程
- 检查点（checkpoint）系统
- 终端管理和浏览器会话逻辑

## 推荐的扩展模式

**模式 1：包装器模式（Wrapper Pattern）**
```typescript
// 不要直接修改原有函数
// ❌ 修改 src/api/providers/anthropic.ts

// ✅ 创建包装器
export class CustomAnthropicHandler extends AnthropicHandler {
  async createMessage(params) {
    // 添加自定义逻辑
    const customParams = this.preprocessParams(params)
    return super.createMessage(customParams)
  }
}
```

**模式 2：配置驱动（Configuration-Driven）**
```typescript
// ✅ 通过配置控制行为
const config = {
  customFeature: true,
  providerOverrides: {
    'anthropic': CustomAnthropicHandler
  }
}
```

**模式 3：插件式扩展（Plugin-Style）**
```typescript
// ✅ 在现有扩展点添加功能
// src/core/controller/ui/customFeature.ts
export async function customFeature(controller: Controller, request: CustomRequest) {
  // 新功能实现
}
```

## 保持同步的策略

**1. 使用专用 Skill 自动化合并（推荐）**

我们创建了专用的 `vv-merge-upstream` skill 来自动化上游合并流程：

```
使用方式：直接告诉 AI "合并 Cline 上游最新代码" 或 "同步上游更新"
```

这个 skill 会自动执行：
- ✅ 检查和设置上游仓库
- ✅ 创建合并分支
- ✅ 智能处理冲突（保留 VVCode 定制）
- ✅ 运行验证和测试
- ✅ 提交并推送更改

**2. 手动 Git 管理上游同步**
```bash
# 添加上游仓库
git remote add upstream https://github.com/cline/cline.git

# 获取上游更新
git fetch upstream

# 查看差异
git diff upstream/main

# 选择性合并（谨慎）
git cherry-pick <commit-hash>
```

**2. 文件标记系统**
在修改的文件顶部添加注释：
```typescript
// VVCode Customization: Added custom API provider support
// Original: Cline v2.x
// Modified: 2025-01-xx
```

**3. 分离定制代码和命名规范**

**命名规范（强制）：**
- ✅ **所有二次开发新增的组件/文件必须以 `vv` 或 `Vv` 开头**（避免全大写在某些系统上出错）
  - React 组件：`VvWelcomeView.tsx`, `VvCustomButton.tsx`
  - 工具函数：`vvUtils.ts`, `vvHelper.ts`
  - 样式文件：`vv-styles.css`
  - API 文件：`vv-api.ts`
  - 服务类：`VvAuthService.ts`, `VvAuthProvider.ts`
- ✅ **修改现有文件时，在文件顶部添加注释标记**：
  ```typescript
  // VVCode Customization: [简短说明修改内容]
  // Original: Cline v2.x
  // Modified: YYYY-MM-DD
  ```
- ❌ **不要修改现有文件名**（除非是 README.md → README.vvcode.md 这种情况）

**文件组织：**
- 将自定义代码尽量放在独立的文件中
- 新增的独立模块放在：
  - `src/exports/vv-*` - 导出的自定义功能
  - `src/integrations/vv-*` - 第三方服务集成
  - `webview-ui/src/components/vv-*` - 自定义 UI 组件
- 避免分散在原有目录结构中

## 开发工作流

**必须的命令**：
```bash
# 安装依赖（首次或更新依赖后）
npm run install:all

# 生成 Protobuf 类型（修改 proto 文件后必须运行）
npm run protos

# 开发模式（带热重载）
npm run dev

# 或者分步执行
npm run watch        # 监听文件变化

# 类型检查
npm run check-types

# 代码格式化
npm run format:fix

# 运行测试
npm test

# 构建生产版本
npm run package
```

**调试技巧**：
- 按 F5 启动调试（会打开新的 VSCode 窗口）
- 查看输出面板的 "Cline" 日志
- 使用 Chrome DevTools 调试 webview（Help → Toggle Developer Tools）
- 在扩展代码中使用 `console.log` 会输出到调试控制台

## 常见二开场景

**场景 1：添加自定义 API Provider**
1. 在 `src/api/providers/custom-provider.ts` 创建 handler
2. 实现 `ApiHandler` 接口
3. 在 `src/api/index.ts` 注册
4. 在 `webview-ui/src/components/settings/` 添加设置 UI
5. 更新相关类型定义

**场景 2：修改 UI 主题/样式**
1. 修改 `webview-ui/src/` 下的 React 组件
2. 更新 TailwindCSS 配置 `webview-ui/tailwind.config.mjs`
3. 修改颜色变量在 CSS 中的定义
4. 不需要修改核心逻辑

**场景 3：添加自定义设置项**
1. 在 `src/shared/ExtensionMessage.ts` 添加类型
2. 在 Controller 中添加状态管理
3. 在 webview settings 中添加 UI 控件
4. 通过 globalState 持久化

**场景 4：集成第三方服务**
1. 在 `src/integrations/` 创建集成模块
2. 使用 `@/shared/net` 的 fetch 或 axios（支持代理）
3. 通过 MCP 或自定义 tool 暴露功能
4. 在设置中添加配置选项

## 网络请求注意事项

**必须使用代理支持的网络工具**（参见 `.clinerules/network.md`）：
```typescript
// ✅ 正确：使用代理支持的 fetch
import { fetch } from '@/shared/net'
const response = await fetch('https://api.example.com')

// ✅ 正确：使用 axios 时添加代理配置
import { getAxiosSettings } from '@/shared/net'
const response = await axios.get(url, {
  ...getAxiosSettings()
})

// ❌ 错误：直接使用全局 fetch（在 JetBrains/CLI 环境下不支持代理）
const response = await fetch('https://api.example.com')
```

## 测试二开功能

**单元测试**：
```bash
npm run test:unit
```

**E2E 测试**：
```bash
npm run test:e2e        # 完整测试
npm run test:e2e:ui     # 交互式调试
```

**手动测试清单**：
- [ ] API 调用是否正常
- [ ] UI 是否正确显示
- [ ] 配置是否正确保存和加载
- [ ] 是否支持代理环境
- [ ] 错误处理是否完善
- [ ] 与原有功能是否兼容
