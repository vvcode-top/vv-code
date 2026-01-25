---
name: vv-check-integrity
description: 检查 VVCode 定制功能的完整性。验证核心模块（认证、设置、余额、补全等）的文件是否存在、代码是否完整。用于合并上游后验证或日常完整性检查。使用方式：告诉 AI "检查 VVCode 功能完整性" 或 "验证 vv-auth 模块"。
---

# VVCode 功能完整性检查 (vv-check-integrity)

用于验证 VVCode 定制功能的完整性，确保所有核心模块的文件存在且代码完整。

## 使用场景

1. **合并上游后验证** - 确保合并没有破坏 VVCode 定制功能
2. **日常完整性检查** - 定期验证代码库状态
3. **问题诊断** - 某个功能异常时，检查相关模块是否完整
4. **新人上手** - 了解 VVCode 的核心模块结构

## 使用方式

**优先使用快速检查** → 失败时才用详细检查：

```bash
# 1. 快速检查（2-3 秒）
.claude/skills/vv-check-integrity/quick-check.sh

# 2. 如果失败，调用 AI 做详细诊断
检查 VVCode 功能完整性
```

**使用场景：**

| 场景 | 使用工具 |
|------|---------|
| 合并后验证 | `quick-check.sh` |
| 开发中自测 | `quick-check.sh` |
| CI/CD 集成 | `quick-check.sh` |
| 问题诊断 | `vv-check-integrity` skill |
| 理解架构 | `vv-check-integrity` skill |

## 核心模块清单

所有模块检查清单位于 `modules/` 目录：

| 模块文件 | 功能描述 | 关键性 |
|---------|---------|--------|
| `vv-auth.md` | VV认证系统 - 登录、登出、Token管理 | ⚠️ Critical |
| `vv-settings.md` | VV设置页面 - 用户信息、余额、补全设置 | ⚠️ Critical |
| `vv-balance.md` | 余额系统 - 状态栏、余额刷新 | ⚠️ Critical |
| `vv-group.md` | 分组系统 - 分组切换、配置管理 | ⚠️ Critical |
| `vv-completion.md` | 代码补全 - 智能补全提供器 | ⚠️ Critical |
| `vv-state.md` | 状态管理 - GlobalState 键定义 | ⚠️ Critical |
| `global-config.md` | 全局配置 - 品牌、网络、构建配置 | ⚠️ Critical |

## 检查流程

### 自动化流程（推荐）

当调用 `vv-check-integrity` skill 时，AI 会自动执行以下流程：

```bash
# Step 1: 先运行快速检查（快速失败）
.claude/skills/vv-check-integrity/quick-check.sh

# Step 2: 如果快速检查通过
if [ $? -eq 0 ]; then
    echo "✅ 快速检查通过！关键集成点完整。"
    # 可选：是否继续详细检查？
    询问用户："快速检查已通过，是否需要详细的完整性验证？"
else
    echo "❌ 快速检查失败，开始详细诊断..."
    # 进入详细检查流程（Step 3-6）
fi
```

### Step 1: 快速检查（新增）

使用 bash 脚本快速验证关键集成点：

```bash
.claude/skills/vv-check-integrity/quick-check.sh
```

**检查内容**：
- VvAuthService 初始化
- URI 回调路由（`/vv-callback`, `/init-complete`）
- Controller 回调方法
- 状态推送配置
- VV Settings 按钮注册
- 余额状态栏初始化
- 核心服务文件存在性

**结果判断**：
- ✅ 全部通过 → 询问是否需要详细检查
- ❌ 有失败 → 自动进入详细检查流程

### Step 2: 选择检查模块

根据用户需求或快速检查失败的结果，确定检查范围：
- 全面检查：所有模块
- 特定模块：用户指定的模块（如 vv-auth）
- 问题相关：根据快速检查失败的项目，选择相关模块

### Step 3: 读取模块清单

从 `modules/` 目录读取对应的 `.md` 文件，获取：
- 模块ID和描述
- 关键性级别
- 必需的文件列表
- 必需的代码元素（类、方法、变量等）

### Step 4: 文件存在性检查

对清单中列出的每个文件：

```bash
# 检查文件是否存在
if [ -f "文件路径" ]; then
    echo "✅ 文件存在: 文件路径"
else
    echo "❌ 文件缺失: 文件路径"
fi
```

### Step 5: 代码元素检查

对每个文件，检查必需的代码元素：

```bash
# 使用 Grep 工具检查关键代码是否存在
# 例如检查 VvAuthService 类
```

**检查规则**：
- **类/接口定义** - 使用 `class ClassName` 或 `interface InterfaceName` 搜索
- **方法定义** - 搜索方法名（注意 public/private/async 前缀）
- **变量/常量** - 搜索 `const/let/var 变量名`
- **导入/导出** - 检查 `import/export` 语句
- **Proto定义** - 检查 `service/rpc/message` 关键字

⚠️ **命名格式注意**：Proto 文件使用 `snake_case`（如 `vv_inline_completion_enabled`），TypeScript 使用 `camelCase`（如 `vvInlineCompletionEnabled`）。检查时必须使用正确的格式，否则会误报缺失。

### Step 6: 生成检查报告

为每个模块生成检查结果：

```
📋 模块检查报告: vv-auth (VV认证系统)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

✅ 文件完整性: 15/15 个文件存在
✅ 代码元素: 42/42 个元素存在

详细结果:
  ✅ src/services/auth/vv/VvAuthService.ts
     ✅ class VvAuthService
     ✅ getUserInfo
     ✅ refreshUserInfo
     ✅ createAuthRequest
     ...

  ✅ src/services/auth/vv/providers/VvAuthProvider.ts
     ✅ class VvAuthProvider
     ✅ exchangeCodeForToken
     ...

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

如果有缺失：

```
❌ 文件完整性: 13/15 个文件存在
❌ 代码元素: 38/42 个元素存在

问题列表:
  ❌ src/core/controller/vvAccount/vvRefreshUserInfo.ts - 文件缺失
  ❌ src/services/auth/vv/VvAuthService.ts
     ❌ refreshGroupConfig 方法缺失

建议:
  1. 检查是否被合并冲突删除
  2. 从备份或历史提交恢复
  3. 参考模块清单重新实现
```

### Step 7: 总结和建议

生成总体报告：

```
🎯 VVCode 功能完整性检查结果
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

检查时间: 2026-01-25 19:30:00
检查范围: 全部模块 (7个)

总体状态: ⚠️ 发现问题

模块状态:
  ✅ vv-settings (完整)
  ✅ vv-balance (完整)
  ✅ vv-group (完整)
  ✅ vv-completion (完整)
  ✅ vv-state (完整)
  ✅ global-config (完整)
  ❌ vv-auth (2个问题)

建议操作:
  1. 优先修复 Critical 模块的问题
  2. 从 git history 恢复缺失文件
  3. 修复后重新运行检查

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

## 工具使用

检查过程中使用以下工具：

1. **Read** - 读取模块清单文件和源代码文件
2. **Grep** - 搜索代码元素（类、方法、变量等）
3. **Bash** - 检查文件存在性（`test -f`）
4. **Glob** - 查找匹配的文件模式

## 检查优先级

按关键性级别排序：

1. **⚠️ Critical** - 影响核心功能，必须立即修复
   - vv-auth, vv-settings, vv-balance, vv-group, vv-completion, vv-state, global-config

## 重要说明：命名格式差异

### Proto 和 TypeScript 命名转换

VVCode 中存在两种命名格式，**检查时必须注意**：

**Proto 文件（.proto）使用 snake_case：**
```protobuf
// proto/cline/state.proto
optional bool vv_inline_completion_enabled = 174;
optional string vv_inline_completion_provider = 175;
optional string vv_inline_completion_model_id = 176;
optional int32 vv_inline_completion_debounce_ms = 177;
optional bool vv_inline_completion_use_group_api_key = 178;
```

**TypeScript 文件（.ts）使用 camelCase：**
```typescript
// src/shared/storage/state-keys.ts
vvInlineCompletionEnabled: { default: false as boolean },
vvInlineCompletionProvider: { default: "anthropic" as string },
vvInlineCompletionModelId: { default: "claude-3-5-sonnet-20241022" as string },
vvInlineCompletionDebounceMs: { default: 300 as number },
vvInlineCompletionUseGroupApiKey: { default: false as boolean },
```

### 命名转换规则

1. **Proto → TypeScript**: `snake_case` → `camelCase`
   - `vv_inline_completion_enabled` → `vvInlineCompletionEnabled`
   - `vv_user_info` → `vvUserInfo`
   
2. **字段映射**: 通过 `scripts/generate-state-proto.mjs` 自动生成

### 检查注意事项

❌ **错误检查方式**：
```bash
# 在 TypeScript 文件中搜索 snake_case（会误报缺失）
grep "vv_inline_completion_enabled" src/shared/storage/state-keys.ts
```

✅ **正确检查方式**：
```bash
# 在 TypeScript 文件中搜索 camelCase
grep "vvInlineCompletionEnabled" src/shared/storage/state-keys.ts

# 在 Proto 文件中搜索 snake_case
grep "vv_inline_completion_enabled" proto/cline/state.proto
```

### 验证方法

检查字段是否完整时，应该：
1. 在 Proto 文件中搜索 `snake_case` 格式
2. 在 TypeScript 文件中搜索 `camelCase` 格式
3. 确认两者数量和类型一致

**示例验证脚本**：
```bash
# 统计 Proto 中的 VV 字段数量
grep -c "vv_inline_completion" proto/cline/state.proto
# 输出: 5

# 统计 TypeScript 中的 VV 字段数量
grep -c "vvInlineCompletion" src/shared/storage/state-keys.ts
# 输出: 5

# 两者相等则完整 ✅
```

## 常见问题

### 文件缺失

**原因**：
- 合并冲突时选择了 `--theirs` 但忘记恢复
- 手动删除或重命名
- Git 操作失误

**修复**：
```bash
# 查看文件历史
git log --all --full-history -- "文件路径"

# 从历史提交恢复
git show <commit-hash>:"文件路径" > "文件路径"
```

### 代码元素缺失

**原因**：
- 重构时删除或重命名
- 合并冲突解决不当
- 上游代码覆盖

**修复**：
1. 参考模块清单重新实现
2. 从备份恢复
3. 查看 git diff 找出丢失位置

### Proto 定义缺失

**原因**：
- `proto/*.proto` 文件合并冲突
- 忘记运行 `npm run protos`

**修复**：
```bash
# 检查 proto 文件
git diff HEAD~1 proto/

# 重新生成
npm run protos
```

## 自动修复

某些问题可以自动修复：

```bash
# Proto 定义缺失 → 重新生成
npm run protos

# 类型检查失败 → 运行类型检查
npm run check-types

# 编译失败 → 重新编译
npm run compile
```

## 与 vv-merge-cline 集成

`vv-merge-cline` 在合并完成后应该自动调用本 skill 进行验证：

```
合并完成 → 运行 vv-check-integrity → 发现问题 → 自动修复 → 重新检查
```

这确保每次合并后 VVCode 功能完整。
