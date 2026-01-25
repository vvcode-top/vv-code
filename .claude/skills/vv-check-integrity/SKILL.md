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

```
检查 VVCode 功能完整性          # 全面检查所有模块
验证 vv-auth 模块               # 检查特定模块
检查认证系统是否完整             # 按功能描述检查
```

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

### Step 1: 选择检查模块

根据用户需求确定检查范围：
- 全面检查：所有模块
- 特定模块：用户指定的模块（如 vv-auth）
- 功能相关：根据功能描述匹配模块（如"认证" → vv-auth）

### Step 2: 读取模块清单

从 `modules/` 目录读取对应的 `.md` 文件，获取：
- 模块ID和描述
- 关键性级别
- 必需的文件列表
- 必需的代码元素（类、方法、变量等）

### Step 3: 文件存在性检查

对清单中列出的每个文件：

```bash
# 检查文件是否存在
if [ -f "文件路径" ]; then
    echo "✅ 文件存在: 文件路径"
else
    echo "❌ 文件缺失: 文件路径"
fi
```

### Step 4: 代码元素检查

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

### Step 5: 生成检查报告

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

### Step 6: 总结和建议

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
