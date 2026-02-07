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
- `group.type` - 分组类型（discount/daily/performance）
- `vvSelectedGroupType` - 优先使用用户选中的分组
- `vvGroupConfig` - 使用后端下发的动态分组列表

---

## 核心数据结构（动态分组）

分组配置从后端下发，需包含 provider/baseUrl 等字段：

📁 `src/shared/storage/state-keys.ts`

**必须包含**:
- `export type VvGroupType = "discount" | "daily" | "performance"`
- `export interface VvGroupItem` 包含字段：
  - `type`, `name`, `defaultModelId`
  - `apiProvider` - 由后端下发（会做归一化）
  - `apiBaseUrl?` - 可选自定义端点
  - `apiKey` - 分组专用密钥（可能为空字符串）
  - `isDefault`
- `vvGroupConfig` - `VvGroupConfig | undefined`
- `vvSelectedGroupType` - `VvGroupType | undefined`

📁 `src/shared/vv-config.ts`

**必须包含**:
- `normalizeVvBackendBaseUrl` - 归一化 VV_API_BASE_URL / group apiBaseUrl（兼容带 /api）
- `normalizeVvGroupApiProvider` - 归一化分组 apiProvider（alias → ApiProvider）

---

## Controller层

位于 `src/core/controller/vvAccount/` 目录：

- **vvRefreshGroupConfig.ts** - 刷新分组配置
- **vvSwitchGroup.ts** - 切换分组

📌 **动态分组集成要求**:
- `vvSwitchGroup.ts` 必须在切换后 **重建** `controller.task.api`（`buildApiHandler`）
- `vvRefreshGroupConfig.ts` 必须调用 `postStateToWebview()` 推送最新 `vvGroupConfig`

---

## 集成点

### VvWelcomeView
📁 `webview-ui/src/components/onboarding/VvWelcomeView.tsx`

欢迎页面需要调用刷新分组配置。

**必须包含**:
- `vvRefreshGroupConfig` - 刷新分组配置的调用

### VvAuthService
📁 `src/services/auth/vv/VvAuthService.ts`

**必须包含**:
- `switchGroup(groupType: string)` - 切换分组并持久化 `vvSelectedGroupType`
- `refreshGroupConfig()` - 拉取分组并自动应用默认/用户选择
- `applyGroupConfig(group)` - 动态写入 provider/model/baseUrl/apiKey
  - `stateManager.setRemoteConfigField("planModeApiProvider", ...)`（防止 remoteConfigCache 覆盖）
  - `stateManager.setTaskSettingsBatch(...)`（活跃任务保持一致）
- `getProviderModelSettings()` - 根据 `apiProvider` 写入不同的 baseUrl/modelId/key 字段

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

### 动态 provider/baseUrl 策略

分组会下发：
- `apiProvider`：可能是别名（如 `claude`），需要在后端映射阶段/应用阶段做归一化
- `apiBaseUrl`：可能为空，应用时需 fallback 到 `VV_API_BASE_URL`

**检查方法（建议）**:
```bash
# provider/baseUrl 归一化工具
grep "normalizeVvBackendBaseUrl" src/shared/vv-config.ts
grep "normalizeVvGroupApiProvider" src/shared/vv-config.ts

# provider 映射位置
grep "normalizeVvGroupApiProvider" src/services/auth/vv/providers/VvAuthProvider.ts

# 应用分组时同步 remoteConfigCache/taskStateCache
grep "setRemoteConfigField(\"planModeApiProvider\"" src/services/auth/vv/VvAuthService.ts
grep "setTaskSettingsBatch" src/services/auth/vv/VvAuthService.ts
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
