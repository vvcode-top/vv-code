# VV认证系统

**模块ID**: vv-auth  
**关键性**: ⚠️ Critical  
**描述**: 处理用户登录、登出、Token管理、分组切换等认证相关功能

---

## 核心服务

### VvAuthService
📁 `src/services/auth/vv/VvAuthService.ts`

负责管理整个认证流程的核心服务类。

**必须包含的方法和类**:
- `class VvAuthService` - 主服务类
- `getUserInfo` - 获取用户信息
- `refreshUserInfo` - 刷新用户信息和余额
- `createAuthRequest` - 创建URI模式认证请求
- `createFallbackAuthRequest` - 创建本地回环认证请求
- `handleAuthCallback` - 处理认证回调
- `handleDeauth` - 处理登出
- `switchGroup` - 切换分组（discount/daily/performance）
- `refreshGroupConfig` - 刷新分组配置
- `resetAndRefreshConfig` - 重置并刷新配置
- `getSystemStatus` - 获取系统状态和公告

### 动态分组 provider 映射（重要）

📁 `src/services/auth/vv/VvAuthService.ts`

当 VV 后端下发分组配置时，需要根据 `apiProvider` 生成不同的配置字段（写入 secrets/globalState）。

**必须包含**:
- `getProviderModelSettings()` - 根据 `apiProvider` 写入不同的 baseUrl/modelId/key 字段

**必须支持 provider: openai-codex**:
- `case "openai-codex"` 分支存在
- 必须写入：
  - `openAiApiKey`（来自分组 `apiKey`，用于自定义端点场景）
  - `openAiBaseUrl`（来自分组 `apiBaseUrl`，并归一化）
  - `planModeApiModelId` / `actModeApiModelId`（来自 `defaultModelId`）
- 默认 Codex 端点仍使用 OAuth；仅在配置了自定义 `openAiBaseUrl` 时使用 `openAiApiKey`

### VvAuthProvider
📁 `src/services/auth/vv/providers/VvAuthProvider.ts`

与VV后端API交互的提供者类。

**必须包含的方法和类**:
- `class VvAuthProvider` - API交互类
- `exchangeCodeForToken` - 用授权码换取Token
- `getUserInfo` - 从API获取用户信息
- `getUserConfig` - 获取用户配置
- `getGroupTokens` - 获取分组Tokens
- `initGroupTokens` - 初始化分组Tokens
- `logout` - 登出操作
- `getSystemStatus` - 获取系统状态

---

## 工具和辅助模块

### 加密工具
📁 `src/shared/vv-crypto.ts`

OAuth2 PKCE流程需要的加密工具函数。

**必须包含**:
- `generateCodeVerifier` - 生成code_verifier
- `generateCodeChallenge` - 生成code_challenge
- `generateState` - 生成state参数
- `generateRandomString` - 生成随机字符串

### URI Handler
📁 `src/services/uri/SharedUriHandler.ts`

处理 `vscode://扩展ID/vv-callback` 格式的URI回调。

**必须包含**:
- `class SharedUriHandler`
- `handleUri` - URI处理方法

**必须包含路由处理**（关键！）:
```typescript
case "/vv-callback": {
    Logger.log("SharedUriHandler: VVCode Auth callback received")

    const code = query.get("code")
    const state = query.get("state")

    if (code && state) {
        await visibleWebview.controller.handleVVAuthCallback(code, state)
        return true
    }
    // ...
}

case "/init-complete": {
    Logger.log("SharedUriHandler: VVCode init-complete callback received")
    await visibleWebview.controller.handleVVInitComplete()
    return true
}
```

**检查方法**:
```bash
# 检查是否有 /vv-callback 路由
grep -A 10 'case "/vv-callback"' src/services/uri/SharedUriHandler.ts | grep "handleVVAuthCallback"

# 检查是否有 /init-complete 路由
grep -A 5 'case "/init-complete"' src/services/uri/SharedUriHandler.ts | grep "handleVVInitComplete"
```

### HTTP认证处理器
📁 `src/hosts/external/AuthHandler.ts`

备用登录方式：本地HTTP服务器（`http://127.0.0.1:48801-48811/vv-callback`）。

**必须包含**:
- `class AuthHandler`
- `getCallbackUrl` - 获取回调URL
- `handleRequest` - 处理HTTP请求
- `http.createServer` - 创建HTTP服务器

---

## UI组件

### 余额状态栏
📁 `src/hosts/vscode/VvBalanceStatusBar.ts`

VSCode状态栏显示余额和选中代码提示。

**必须包含**:
- `class VvBalanceStatusBar`
- `updateDisplay` - 更新显示内容
- `refreshBalance` - 刷新余额
- `updateSelectionState` - 更新选中状态

### 代码补全提供器
📁 `src/hosts/vscode/completion/VvCompletionProvider.ts`

使用VV Token的内联代码补全功能。

**必须包含**:
- `class VvCompletionProvider`
- `provideInlineCompletionItems` - 提供补全建议
- `vvGroupConfig` - 使用分组配置

---

## Controller层

所有controller文件都位于 `src/core/controller/vvAccount/` 目录下：

- **vvAccountLoginClicked.ts** - 处理用户点击登录按钮（URI模式）
- **vvAccountFallbackLogin.ts** - 处理备用登录（本地回环模式）
- **vvAccountLogoutClicked.ts** - 处理用户点击登出按钮
- **vvSubscribeToAuthStatusUpdate.ts** - 订阅认证状态更新（流式响应）
- **vvGetUserConfig.ts** - 获取用户配置
- **vvRefreshUserInfo.ts** - 刷新用户信息和余额
- **vvRefreshGroupConfig.ts** - 刷新分组配置
- **vvResetAndRefreshConfig.ts** - 重置并刷新配置（清除缓存）
- **vvSwitchGroup.ts** - 切换分组（discount/daily/performance）
- **vvGetSystemStatus.ts** - 获取系统状态和公告

### Controller集成
📁 `src/core/controller/index.ts`

**必须包含的字段和初始化**:
- `vvAuthService: VvAuthService` - VvAuthService 字段声明（在类定义中）
- `import { VvAuthService }` - 导入 VvAuthService
- `this.vvAuthService = VvAuthService.initialize(this)` - 在构造函数中初始化（关键！）

**必须包含的回调方法**（关键！）:
```typescript
async handleVVAuthCallback(code: string, state: string) {
    await this.vvAuthService.handleAuthCallback(code, state)
    this.stateManager.setGlobalState("welcomeViewCompleted", true)
    await this.postStateToWebview()
    // 显示成功消息
}

async handleVVInitComplete() {
    await this.vvAuthService.refreshGroupConfig()
    await this.postStateToWebview()
    // 显示成功消息
}
```

**检查方法**:
```bash
# 检查 VvAuthService 初始化
grep "VvAuthService.initialize" src/core/controller/index.ts

# 检查 handleVVAuthCallback 方法
grep -A 5 "async handleVVAuthCallback" src/core/controller/index.ts

# 检查 handleVVInitComplete 方法
grep -A 5 "async handleVVInitComplete" src/core/controller/index.ts
```

**必须在 getStateToPostToWebview() 返回对象中包含**:
- `vvGroupConfig` - 分组配置
- `vvNeedsWebInit` - Web初始化标记
- `vvSelectedGroupType` - 选中的分组类型

**检查方法**:
```bash
# 检查状态读取
grep "vvGroupConfig.*getGlobalStateKey" src/core/controller/index.ts

# 检查状态返回
grep -A 100 "return {" src/core/controller/index.ts | grep "vvGroupConfig"
```

### 登出清理（必须清除用户数据）
📁 `src/services/auth/vv/VvAuthService.ts`

**必须包含的清理逻辑**:
- `controller.clearTask()` - 清空当前任务与聊天
- `taskHistory` 重置为空数组
- `vvGroupConfig` 重置为空数组
- `vvNeedsWebInit` 重置为 `false`

**检查方法**:
```bash
grep "clearTask" src/services/auth/vv/VvAuthService.ts
grep "taskHistory\".*, \\[]" src/services/auth/vv/VvAuthService.ts
grep "vvGroupConfig\".*, \\[]" src/services/auth/vv/VvAuthService.ts
grep "vvNeedsWebInit\".*, false" src/services/auth/vv/VvAuthService.ts
```

---

## Protobuf定义

📁 `proto/cline/vv_account.proto`

定义认证相关的gRPC服务和消息类型。

**必须包含**:
- `service VvAccountService` - gRPC服务定义
- `message VvAuthState` - 认证状态
- `message VvUserInfo` - 用户信息
- `message VvUserConfig` - 用户配置
- `message VvGroupConfig` - 分组配置
- `message VvSystemStatus` - 系统状态
- `rpc vvAccountLoginClicked` - 登录RPC
- `rpc vvAccountFallbackLogin` - 备用登录RPC
- `rpc vvSubscribeToAuthStatusUpdate` - 订阅状态更新

---

## 状态管理

📁 `src/shared/storage/state-keys.ts`

定义认证系统使用的状态键。

**GlobalState键**:
- `vvUserInfo` - 用户信息
- `vvUserConfig` - 用户配置
- `vvGroupConfig` - 分组配置
- `vvSelectedGroupType` - 当前选中的分组类型
- `vvNeedsWebInit` - Web初始化标记
- `vv:authState` - 认证状态
- `vv:codeVerifier` - OAuth2 code_verifier

**Secrets键** (敏感信息):
- `vv:accessToken` - 访问令牌
- `vv:refreshToken` - 刷新令牌
- `vv:userId` - 用户ID

---

## 前端Hooks

📁 `webview-ui/src/hooks/useVvAuth.ts`

React Hook，提供认证相关的状态和方法。

**必须导出**:
- `useVvAuth` - Hook函数
- `login` - 登录方法
- `fallbackLogin` - 备用登录方法
- `logout` - 登出方法
- `user` - 用户状态
- `isAuthenticated` - 是否已认证
- `isLoggingIn` - 是否正在登录

---

## 前端组件

所有组件都位于 `webview-ui/src/components/` 目录下：

- **settings/VvAccountInfoCard.tsx** - 设置页面的账户信息卡片
- **onboarding/VvUsageGuideView.tsx** - 使用指南页面
- **onboarding/VvWelcomeView.tsx** - 欢迎页面（登录/已登录状态）
- **chat/VvGroupSelector.tsx** - 分组切换选择器
- **settings/VvSettingsView.tsx** - VV设置页面主视图

---

## gRPC客户端

📁 `webview-ui/src/services/grpc-client.ts` (自动生成)

**必须包含**:
- `export class VvAccountServiceClient` - 前端gRPC客户端

---

## 扩展注册

📁 `src/extension.ts`

扩展激活时必须注册的组件。

**必须包含**:
- `registerUriHandler` - 注册URI处理器
- `handleUri` - URI处理逻辑
- `VvBalanceStatusBar` - 状态栏初始化
- `VvCompletionProvider` - 补全提供器注册

---

## 功能流程说明

### URI模式登录
1. 用户点击登录 → `vvAccountLoginClicked.ts`
2. 打开浏览器进行OAuth认证
3. 回调 `vscode://扩展ID/vv-callback`
4. `SharedUriHandler` 接收URI → 转发给 `Controller`
5. `VvAuthService.createAuthRequest` 处理

**涉及文件**:
- `src/extension.ts` (registerUriHandler)
- `src/services/uri/SharedUriHandler.ts` (/vv-callback)
- `src/core/controller/vvAccount/vvAccountLoginClicked.ts`
- `src/services/auth/vv/VvAuthService.ts` (createAuthRequest)

### 本地回环登录
1. 用户点击备用登录 → `vvAccountFallbackLogin.ts`
2. 启动本地HTTP服务器（端口 48801-48811）
3. 打开浏览器进行OAuth认证
4. 回调 `http://127.0.0.1:端口/vv-callback`
5. `AuthHandler` 接收请求 → 转发给 `SharedUriHandler` → 转发给 `Controller`
6. `VvAuthService.createFallbackAuthRequest` 处理

**涉及文件**:
- `src/hosts/external/AuthHandler.ts`
- `src/core/controller/vvAccount/vvAccountFallbackLogin.ts`
- `src/services/auth/vv/VvAuthService.ts` (createFallbackAuthRequest)

### Token管理
- Token存储使用 **VSCode Secrets API** 确保安全
- `VvAuthProvider.exchangeCodeForToken` 负责Token交换
- `StateManager` 管理Token状态

**涉及文件**:
- `src/shared/storage/state-keys.ts` (secrets定义)
- `src/services/auth/vv/VvAuthProvider.ts` (exchangeCodeForToken)
- `src/core/controller/index.ts` (StateManager)

### 分组切换
支持三种分组类型：`discount`（经济）、`daily`（日常）、`performance`（性能）

**涉及文件**:
- `src/services/auth/vv/VvAuthService.ts` (switchGroup, applyGroupConfig)
- `src/core/controller/vvAccount/vvSwitchGroup.ts`
- `webview-ui/src/components/chat/VvGroupSelector.tsx`

### 状态栏
自动显示余额并刷新，支持显示选中代码提示。

**涉及文件**:
- `src/hosts/vscode/VvBalanceStatusBar.ts`
- `src/extension.ts` (初始化)

### 代码补全
使用VV分组Token进行智能代码补全。

**涉及文件**:
- `src/hosts/vscode/completion/VvCompletionProvider.ts`
- `src/extension.ts` (registerInlineCompletionItemProvider)
