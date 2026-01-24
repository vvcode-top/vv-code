# VVCode 上游合并待完成事项

## 当前状态
- **分支**: `merge-cline-20260124-235843`
- **已完成**: 合并 3 个 upstream commits (2026-01-17)
- **已恢复**: 后端 VV 定制 (extension.ts, registry.ts, state-keys.ts)
- **已恢复**: 部分 webview 定制 (ExtensionStateContext.tsx, proto/cline/ui.proto)

## 剩余编译错误

### 1. App.tsx - hideAnnouncement prop
**错误**:
```
src/App.tsx:82:5 - error TS2322: Type '{ hideAnnouncement: () => void; isHidden: boolean; showAnnouncement: boolean; showHistoryView: () => void; }' is not assignable to type 'IntrinsicAttributes & ChatViewProps'.
  Property 'hideAnnouncement' does not exist on type 'IntrinsicAttributes & ChatViewProps'.
```

**修复方法**: 从 main 分支恢复 App.tsx 中 hideAnnouncement 的传递方式

### 2. ChatView.tsx - VvGroupConfig 类型和其他 props
**错误**:
```typescript
// VvGroupConfig 缺少数组方法
src/components/chat/ChatView.tsx:51:43 - error TS2339: Property 'some' does not exist on type 'VvGroupConfig'.
// hideAnnouncement prop 未定义
src/components/chat/ChatView.tsx - Missing prop definition
```

**修复方法**:
1. 在 ChatView.tsx 的 Props interface 中添加 `hideAnnouncement?: () => void`
2. 确认 VvGroupConfig 类型正确（应该是数组类型）

### 3. VvGroupSelector.tsx - VvGroupConfig 数组方法
**错误**:
```
src/components/chat/VvGroupSelector.tsx - Property 'find/some/map/length' does not exist on type 'VvGroupConfig'.
```

**问题原因**: `state-keys.ts` 中定义 `VvGroupConfig` 为 `VvGroupItem[]`，但 proto 生成的类型可能不同

**修复方法**: 检查 proto 生成的 VvGroupConfig 类型，确保是数组

### 4. WelcomeView.tsx - VvGroupConfig 数组方法
**错误**:
```
src/components/welcome/WelcomeView.tsx:25:35 - error TS2339: Property 'some' does not exist on type 'VvGroupConfig'.
```

**修复方法**: 同 VvGroupSelector.tsx

## 修复步骤建议

### 步骤 1: 检查 proto 生成的类型
```bash
grep -A 5 "VvGroupConfig" src/shared/proto/cline/state.ts
```

如果 proto 生成的不是数组，需要在 `state-keys.ts` 中调整类型定义，使其与 proto 一致。

### 步骤 2: 从 main 分支恢复 hideAnnouncement 相关代码
```bash
# 查看 main 分支的实现
git show main:webview-ui/src/App.tsx | grep -A 10 "hideAnnouncement"
git show main:webview-ui/src/components/chat/ChatView.tsx | grep -A 5 "interface.*Props"
```

### 步骤 3: 修复所有文件后重新编译
```bash
npm run build:webview
```

## 预期完成时间
- 类型修复: 15-30 分钟
- hideAnnouncement 修复: 10-15 分钟
- 编译验证: 5-10 分钟
- **总计**: 约 30-60 分钟

## 注意事项
1. 所有 VV 相关组件都需要正确处理 VvGroupConfig 作为数组
2. hideAnnouncement 功能可能在上游合并中被修改，需要确认最新实现
3. 修复后记得运行 `npm run check-types` 确保没有其他类型错误

## 合并完成后
```bash
# 推送分支
git push origin merge-cline-20260124-235843

# 测试功能
npm run dev

# 合并到 main
git checkout main
git merge merge-cline-20260124-235843
git push origin main
```
