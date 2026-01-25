# VV分组管理系统

**模块ID**: vv-group  
**关键性**: ⚠️ Critical  
**描述**: 处理用户分组切换、分组配置管理等功能

---

## 前端组件

### VvGroupSelector
📁 `webview-ui/src/components/chat/VvGroupSelector.tsx`

分组切换选择器组件，允许用户在不同分组间切换。

**必须包含**:
- `VvGroupSelector` - 组件名称
- `vvSwitchGroup` - 调用分组切换RPC
- `groupType` - 分组类型（discount/daily/performance）

---

## Controller层

位于 `src/core/controller/vvAccount/` 目录：

- **vvRefreshGroupConfig.ts** - 刷新分组配置
- **vvSwitchGroup.ts** - 切换分组

---

## 集成点

### VvWelcomeView
📁 `webview-ui/src/components/onboarding/VvWelcomeView.tsx`

欢迎页面需要调用刷新分组配置。

**必须包含**:
- `vvRefreshGroupConfig` - 刷新分组配置的调用

---

## 功能说明

### 支持的分组类型

1. **discount（经济型）**
   - 低成本模型
   - 适合日常开发

2. **daily（日常型）**
   - 平衡性能和成本
   - 推荐使用

3. **performance（性能型）**
   - 高性能模型
   - 适合复杂任务

### 切换流程

```
用户选择分组
    ↓
VvGroupSelector (UI)
    ↓
vvSwitchGroup (Controller)
    ↓
VvAuthService.switchGroup
    ↓
更新全局状态
    ↓
刷新UI显示
    ↓
更新余额状态栏
```

### 分组配置内容

每个分组包含：
- **模型配置** - 该分组使用的AI模型
- **Token配置** - 分组专用的API Token
- **限制配置** - 请求频率、上下文长度等限制

---

## 依赖关系

- **依赖 VvAuthService** - 执行分组切换逻辑
- **依赖 StateManager** - 保存选中的分组类型
- **通知 VvBalanceStatusBar** - 切换后刷新余额显示
- **通知 VvCompletionProvider** - 切换后使用新的模型配置
