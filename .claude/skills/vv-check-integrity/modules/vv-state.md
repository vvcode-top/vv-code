# VV状态管理

**模块ID**: vv-state  
**关键性**: ⚠️ Critical  
**描述**: 管理VV相关的全局状态和配置

---

## 状态键定义

### GlobalState 配置键
📁 `src/shared/storage/state-keys.ts`

定义VV相关的全局状态存储键（存储在VSCode的globalState中）。

**必须包含的配置键**:
- `vvInlineCompletionEnabled` - 内联补全开关（布尔值）
- `vvInlineCompletionProvider` - 补全提供者（如"qwen"）
- `vvInlineCompletionModelId` - 补全模型ID（如"qwen2.5-coder"）
- `vvInlineCompletionDebounceMs` - 防抖延迟（毫秒）
- `vvInlineCompletionUseGroupApiKey` - 是否使用分组API密钥（布尔值）

---

## 前端状态管理

### ExtensionStateContext
📁 `webview-ui/src/context/ExtensionStateContext.tsx`

React Context，管理前端的VV状态。

**必须包含的状态和方法**:
- `showVVSettings` - VV设置页面显示状态（布尔值）
- `navigateToVVSettings` - 导航到VV设置的方法
- `hideVVSettings` - 隐藏VV设置的方法

---

## 状态类型说明

### 补全相关状态

**vvInlineCompletionEnabled**
- 类型：`boolean`
- 默认值：`false`
- 说明：全局开关，控制是否启用VV内联代码补全

**vvInlineCompletionProvider**
- 类型：`string`
- 可选值：`"qwen"`, `"deepseek"`, `"codellama"` 等
- 说明：选择使用的FIM模型提供者

**vvInlineCompletionModelId**
- 类型：`string`
- 示例：`"qwen2.5-coder:7b"`, `"deepseek-coder:6.7b"`
- 说明：具体的模型ID

**vvInlineCompletionDebounceMs**
- 类型：`number`
- 默认值：`300`
- 说明：用户停止输入后等待多久才触发补全请求（毫秒）

**vvInlineCompletionUseGroupApiKey**
- 类型：`boolean`
- 默认值：`true`
- 说明：是否使用VV分组的API密钥（而非自定义密钥）

### UI相关状态

**showVVSettings**
- 类型：`boolean`
- 默认值：`false`
- 说明：控制VV设置页面的显示/隐藏

---

## 状态持久化

### 后端存储

所有配置键存储在 **VSCode Global State** 中：
```typescript
// 保存
context.globalState.update('vvInlineCompletionEnabled', true)

// 读取
const enabled = context.globalState.get<boolean>('vvInlineCompletionEnabled')
```

通过 `StateManager` 统一管理。

### 前端同步

前端通过 gRPC 订阅后端状态变化：
1. 后端状态更新 → `StateManager.setGlobalState()`
2. 触发状态同步事件
3. 前端接收更新 → `ExtensionStateContext` 更新
4. React组件重新渲染

---

## 状态流转

### 补全设置更新流程

```
用户修改设置（前端）
    ↓
调用 vvUpdateCompletionSettings (gRPC)
    ↓
Controller 处理请求
    ↓
StateManager.setGlobalState() 保存
    ↓
触发状态变更事件
    ↓
前端接收更新
    ↓
VvCompletionProvider 应用新配置
```

### VV设置页面显示流程

```
用户点击VV设置按钮
    ↓
sendVVSettingsButtonClickedEvent
    ↓
前端接收事件
    ↓
setShowVVSettings(true)
    ↓
App.tsx 渲染 VvSettingsView
```

---

## 依赖关系

- **依赖 StateManager** - 后端状态管理和持久化
- **依赖 ExtensionStateContext** - 前端状态管理
- **被 VvCompletionProvider 使用** - 读取补全配置
- **被 VvSettingsView 使用** - 显示和修改配置
