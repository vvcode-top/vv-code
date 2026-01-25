# VV设置页面

**模块ID**: vv-settings  
**关键性**: ⚠️ Critical  
**描述**: VV专属设置界面，显示用户信息、余额、补全设置等

---

## 前端组件

### VvSettingsView
📁 `webview-ui/src/components/settings/VvSettingsView.tsx`

VV设置页面的主视图组件。

**必须包含**:
- `VvSettingsView` - 组件名称
- `onDone` - 关闭设置页面的回调
- `formatQuota` - 格式化配额显示
- `handleRefresh` - 刷新用户信息

### VvAccountInfoCard
📁 `webview-ui/src/components/settings/VvAccountInfoCard.tsx`

显示账户信息和余额的卡片组件。

**必须包含**:
- `VvAccountInfoCard` - 组件名称
- `useVvAuth` - 使用认证Hook
- `quota` - 总配额
- `usedQuota` - 已使用配额

### VvWelcomeView
📁 `webview-ui/src/components/onboarding/VvWelcomeView.tsx`

欢迎页面（首次使用或未登录时显示）。

**必须包含**:
- `VvWelcomeView` - 组件名称

### VvUsageGuideView
📁 `webview-ui/src/components/onboarding/VvUsageGuideView.tsx`

使用指南页面。

**必须包含**:
- `VvUsageGuideView` - 组件名称

### VvCompletionSettings
📁 `webview-ui/src/components/settings/VvCompletionSettings.tsx`

代码补全设置子组件（简化版），只显示启用/禁用开关。

**必须包含**:
- `VvCompletionSettings` - 组件名称
- `vvGetCompletionSettings` - 获取补全设置RPC调用
- `vvUpdateCompletionSettings` - 更新补全设置RPC调用
- `enabled` - 补全开关状态

---

## Controller层

### 设置按钮点击订阅
📁 `src/core/controller/ui/subscribeToVvSettingsButtonClicked.ts`

处理VV设置按钮点击事件的流式订阅。

**必须包含**:
- `sendVVSettingsButtonClickedEvent` - 发送点击事件
- `subscribeToVvSettingsButtonClicked` - 订阅RPC方法

---

## Protobuf定义

📁 `proto/cline/ui.proto`

定义VV设置相关的UI事件。

**必须包含**:
- `subscribeToVvSettingsButtonClicked` - RPC方法定义
- `VV_SETTINGS_BUTTON_CLICKED` - 事件类型枚举

---

## 集成点

### 扩展注册
📁 `src/extension.ts`

注册VV设置按钮命令。

**必须导入**:
- `import { sendVVSettingsButtonClickedEvent } from "./core/controller/ui/subscribeToVvSettingsButtonClicked"`

**必须注册命令**:
```typescript
context.subscriptions.push(
    vscode.commands.registerCommand(commands.VVSettingsButton, () => {
        sendVVSettingsButtonClickedEvent()
    }),
)
```

**检查方法**:
```bash
# 检查是否导入
grep "sendVVSettingsButtonClickedEvent" src/extension.ts

# 检查是否注册命令
grep -A 3 "commands.VVSettingsButton" src/extension.ts | grep "sendVVSettingsButtonClickedEvent"
```

### 应用主组件
📁 `webview-ui/src/App.tsx`

在主应用中渲染VV设置页面。

**必须包含**:
- `import VvSettingsView` - 导入组件
- `showVVSettings` - 显示状态
- `<VvSettingsView` - 渲染组件

### 状态上下文
📁 `webview-ui/src/context/ExtensionStateContext.tsx`

管理VV设置页面的显示状态和导航。

**必须包含**:
- `showVVSettings` - 显示状态（布尔值）
- `setShowVVSettings` - 设置显示状态
- `navigateToVVSettings` - 导航到VV设置
- `hideVVSettings` - 隐藏VV设置

---

## 导航函数检查（重要）

📁 `webview-ui/src/context/ExtensionStateContext.tsx`

**所有导航函数都必须关闭VV设置页面**，避免页面重叠。

以下函数都必须包含 `setShowVVSettings(false)`：

- ✅ **navigateToMcp** - 导航到MCP页面
- ✅ **navigateToSettings** - 导航到常规设置
- ✅ **navigateToHistory** - 导航到历史记录
- ✅ **navigateToAccount** - 导航到账户页面
- ✅ **navigateToWorktrees** - 导航到工作树
- ✅ **navigateToChat** - 导航到聊天界面

**检查命令**:
```bash
# 确保每个导航函数都包含 setShowVVSettings(false)
grep -A 5 "navigateToMcp" ExtensionStateContext.tsx | grep "setShowVVSettings(false)"
grep -A 5 "navigateToSettings" ExtensionStateContext.tsx | grep "setShowVVSettings(false)"
# ... 其他导航函数
```

---

## 功能说明

### 页面结构

VV设置页面包含：
1. **账户信息卡片** - 用户名、余额、配额
2. **分组选择器** - 切换分组（discount/daily/performance）
3. **补全设置** - 开关、模型选择、过滤策略
4. **系统状态** - 公告、维护信息
5. **关闭按钮** - 返回主界面

### 显示逻辑

```
用户点击VV设置按钮
    ↓
extension.ts 发送事件
    ↓
subscribeToVvSettingsButtonClicked (流式订阅)
    ↓
前端接收事件
    ↓
setShowVVSettings(true)
    ↓
App.tsx 渲染 VvSettingsView
    ↓
用户点击关闭/导航到其他页面
    ↓
setShowVVSettings(false)
```

### 导航互斥

VV设置页面与其他页面互斥：
- 打开VV设置时，其他页面不显示
- 导航到其他页面时，VV设置自动关闭
- 通过 `setShowVVSettings(false)` 确保互斥

---

## 依赖关系

- **依赖 useVvAuth Hook** - 获取用户认证状态
- **依赖 VvAuthService** - 刷新用户信息
- **依赖 ExtensionStateContext** - 管理页面显示状态
- **集成 VvAccountInfoCard** - 显示账户信息
- **集成 VvGroupSelector** - 切换分组
