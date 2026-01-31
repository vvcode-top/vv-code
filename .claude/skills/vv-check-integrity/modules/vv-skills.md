# VV Skills 系统

**模块ID**: vv-skills
**关键性**: ⚠️ Critical
**描述**: Skills 功能集成 - Slash command 菜单中显示和执行 skills

---

## 后端集成

### Controller 方法
📁 `src/core/controller/index.ts`

**getAvailableSkillsMetadata 方法**:
```typescript
public async getAvailableSkillsMetadata(): Promise<import("@/shared/skills").SkillMetadata[]>
```

**必须包含的逻辑**:
- 若存在 `skillsEnabled` 且显式为 `false`，返回空（兼容旧版本）
- 否则默认启用 Skills
- 调用 `discoverSkills(cwd)` 发现 skills
- 调用 `getAvailableSkills()` 解析 skills
- 根据 toggle 状态过滤
- 错误处理使用 `Logger.error()`

**检查方法**:
```bash
grep -q "getAvailableSkillsMetadata" src/core/controller/index.ts
grep -q "discoverSkills" src/core/controller/index.ts
```

---

### 状态推送
📁 `src/core/controller/index.ts` 的 `getStateToPostToWebview()` 方法

**必须包含**:
```typescript
// 调用方法
const availableSkills = await this.getAvailableSkillsMetadata()

// 返回对象中包含
return {
    availableSkills,  // ← 必须
}
```

**检查方法**:
```bash
grep -A 100 "return {" src/core/controller/index.ts | grep -q "availableSkills"
```

---

## 前端集成

### ChatTextArea 组件
📁 `webview-ui/src/components/chat/ChatTextArea.tsx`

**必须传递 availableSkills 到**:
1. `validateSlashCommand()` - 2 处调用
2. `getMatchingSlashCommands()` - 3 处调用
3. `<SlashCommandMenu>` - props

**检查方法**:
```bash
# validateSlashCommand 调用（应该 ≥2）
grep -A 6 "validateSlashCommand" webview-ui/src/components/chat/ChatTextArea.tsx | grep -c "availableSkills"

# getMatchingSlashCommands 调用（应该 ≥3）
grep -A 6 "getMatchingSlashCommands" webview-ui/src/components/chat/ChatTextArea.tsx | grep -c "availableSkills"

# SlashCommandMenu props
grep -A 5 "<SlashCommandMenu" webview-ui/src/components/chat/ChatTextArea.tsx | grep -q "availableSkills"
```

---

### SlashCommandMenu 组件
📁 `webview-ui/src/components/chat/SlashCommandMenu.tsx`

**必须包含**:
- Props 中定义 `availableSkills?: any[]`
- 传递给 `getMatchingSlashCommands()`
- 过滤并渲染 Skills 分组

**检查方法**:
```bash
grep -q "availableSkills.*any" webview-ui/src/components/chat/SlashCommandMenu.tsx
grep "type === \"skill\"" webview-ui/src/components/chat/SlashCommandMenu.tsx
```

---

### 工具函数
📁 `webview-ui/src/utils/slash-commands.ts`

**必须包含 availableSkills 参数的函数**:
1. `getSkillCommands(availableSkills?: any[])`
2. `getMatchingSlashCommands(..., availableSkills?: any[])`
3. `validateSlashCommand(..., availableSkills?: any[])`

**检查方法**:
```bash
grep "export function getSkillCommands" webview-ui/src/utils/slash-commands.ts
grep "availableSkills" webview-ui/src/utils/slash-commands.ts | wc -l  # 应该 ≥6
```

---

## 快速检查清单

运行以下命令验证所有集成点：

```bash
# 1. Controller 方法
grep -q "getAvailableSkillsMetadata" src/core/controller/index.ts && echo "✅" || echo "❌"

# 2. 状态推送
grep -A 100 "return {" src/core/controller/index.ts | grep -q "availableSkills" && echo "✅" || echo "❌"

# 3. ChatTextArea validateSlashCommand（≥2）
COUNT=$(grep -A 6 "validateSlashCommand" webview-ui/src/components/chat/ChatTextArea.tsx | grep -c "availableSkills")
[ $COUNT -ge 2 ] && echo "✅ ($COUNT/2)" || echo "❌ ($COUNT/2)"

# 4. ChatTextArea getMatchingSlashCommands（≥3）
COUNT=$(grep -A 6 "getMatchingSlashCommands" webview-ui/src/components/chat/ChatTextArea.tsx | grep -c "availableSkills")
[ $COUNT -ge 3 ] && echo "✅ ($COUNT/3)" || echo "❌ ($COUNT/3)"

# 5. Slash command 工具函数
grep "getSkillCommands" webview-ui/src/utils/slash-commands.ts && echo "✅" || echo "❌"
```

---

## 常见问题

### Skills 不显示
**原因**: `availableSkills` 未传递给相关函数
**检查**: 运行上面的快速检查清单

### Skills 不显示（新版本）
**原因**: `skillsEnabled` 已移除或不再作为默认开关；需检查 Skills 元数据获取与前端传递链路
**修复**: 确认 `getAvailableSkillsMetadata` 返回值与前端 `availableSkills` 透传

---

## 依赖关系

- 依赖 Skills 发现系统 (`discoverSkills`, `getAvailableSkills`)
- 依赖 ExtensionState (前后端同步)
- 被 Slash Command 系统使用
