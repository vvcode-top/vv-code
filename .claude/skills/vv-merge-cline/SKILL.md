---
name: vv-merge-cline
description: 智能合并 Cline 上游代码到 VVCode。支持指定日期，根据冲突数量自动选择单 commit 或批量合并策略，确保每次合并后 VVCode 功能完整。使用方式：告诉 AI "合并上游代码" 或 "同步 Cline 到 2025-01-20"。
---

# VVCode 智能合并上游 (vv-merge-cline)

根据冲突情况自动选择合并策略，确保 VVCode 功能完整性。

## 使用方式

```
合并上游代码                    # 合并到今天
同步 Cline 到 2025-01-20        # 合并到指定日期
合并最近 5 个 commits           # 合并指定数量
```

## 执行流程

### Step 1: 环境检查

```bash
# 检查工作区状态
git status --porcelain

# 如果有未提交的更改，提示用户处理
# 选项: commit / stash / abort

# 确认当前分支
git branch --show-current

# 确保有 upstream
git remote -v | grep upstream || git remote add upstream https://github.com/cline/cline.git

# 拉取最新上游代码
git fetch upstream
```

### Step 2: 获取待合并 commits

```bash
# 获取当前 HEAD 到上游 main 的所有 commits
# 如果用户指定了日期（如 2025-01-20），则过滤到该日期
TARGET_DATE="${1:-$(date +%Y-%m-%d)}"  # 默认今天

# 获取所有待合并 commits（从旧到新排序）
git log HEAD..upstream/main --until="$TARGET_DATE 23:59:59" --reverse --oneline --no-decorate
```

**向用户展示：**
```
📋 待合并 commits (共 N 个，截止 YYYY-MM-DD):
  abc1234 feat: add new feature
  def5678 fix: resolve issue
  ...

是否开始合并？
```

### Step 3: 创建合并分支

```bash
git checkout -b merge-cline-$(date +%Y%m%d-%H%M%S)
```

### Step 4: 智能合并循环

对于每个待合并的 commit，执行以下逻辑：

```python
pending_commits = get_pending_commits()
batch = []

while pending_commits:
    commit = pending_commits.pop(0)
    batch.append(commit)
    
    # 预检冲突数量
    conflict_count = check_conflicts(batch[-1])  # cherry-pick --no-commit 检测
    
    if conflict_count == 0:
        # 无冲突，继续累积批次
        if len(pending_commits) > 0:
            continue
    
    if conflict_count <= 3:
        # 冲突少，尝试批量合并
        if len(batch) > 1:
            result = try_batch_merge(batch)
            if result == SUCCESS:
                batch = []
                continue
    
    # 冲突多或批量失败，单个 commit 合并
    for c in batch:
        single_merge(c)
        resolve_conflicts()
        restore_vvcode_customizations()
        verify_build()
    
    batch = []
```

#### 4.1 预检冲突

```bash
# 尝试 cherry-pick 但不提交，检查冲突数量
git cherry-pick --no-commit $COMMIT_HASH 2>&1

# 统计冲突文件数
CONFLICT_COUNT=$(git diff --name-only --diff-filter=U | wc -l)

# 回滚预检
git cherry-pick --abort 2>/dev/null || git reset --hard HEAD
```

#### 4.2 批量合并（冲突少时）

```bash
# 获取批次中最后一个 commit 的 hash
BATCH_END_COMMIT=$COMMIT_HASH

# 使用 merge 而不是 cherry-pick
git merge $BATCH_END_COMMIT --no-ff -m "Merge upstream: $(git log --oneline $BATCH_START..$BATCH_END | wc -l) commits"
```

#### 4.3 单 commit 合并（冲突多时）

```bash
git cherry-pick $COMMIT_HASH

# 如果有冲突
if [ $? -ne 0 ]; then
    # 进入冲突解决流程
fi
```

### Step 5: 冲突解决

当出现冲突时：

```bash
# 列出冲突文件
CONFLICTS=$(git diff --name-only --diff-filter=U)
```

**自动处理规则：**

| 文件类型 | 策略 | 原因 |
|---------|------|------|
| `**/vv-*`, `**/Vv*`, `src/services/auth/vv/*` | `--ours` | VVCode 特有文件 |
| `package.json`, `README.md`, `assets/icons/*` | `--ours` | 品牌文件 |
| `proto/*.proto` | `--theirs` + 恢复 VV 定义 | 保持上游 proto 结构 |
| 其他文件 | `--theirs` + 恢复 VV 代码 | 接受上游 + 恢复定制 |

```bash
for file in $CONFLICTS; do
    if [[ $file == *vv-* ]] || [[ $file == *Vv* ]] || [[ $file == src/services/auth/vv/* ]]; then
        git checkout --ours "$file"
        echo "✅ $file: 保留 VVCode 版本"
    elif [[ $file == "package.json" ]] || [[ $file == "README.md" ]] || [[ $file == assets/icons/* ]]; then
        git checkout --ours "$file"
        echo "✅ $file: 保留品牌版本"
    else
        git checkout --theirs "$file"
        echo "⚠️ $file: 接受上游版本，需恢复 VV 定制"
    fi
    git add "$file"
done
```

### Step 6: 恢复 VVCode 定制

**关键文件定制恢复检查清单：**

对于接受了上游版本的文件，需要检查并恢复 VVCode 定制：

#### `src/shared/storage/state-keys.ts`
恢复内容：
- `VvUserInfo`, `VvUserConfig`, `VvGroupConfig` 类型定义
- `GlobalState` 和 `Settings` 中的 `vv*` 字段

#### `src/extension.ts`
恢复内容：
- VV Balance Status Bar 初始化
- VV Completion Provider 注册

#### `src/registry.ts`
恢复内容：
- `VVSettingsButton` 注册
- 移除原 Settings/Account 按钮的代码

#### `webview-ui/src/App.tsx`
恢复内容：
- VVCode 组件导入
- VV 相关 UI 逻辑

#### `webview-ui/src/context/ExtensionStateContext.tsx`
恢复内容：
- VV 状态字段定义
- VV 相关处理逻辑

**恢复方法：**
```bash
# 获取合并前的 VVCode 版本
git show HEAD~1:$FILE > /tmp/vv-backup-$(basename $FILE)

# 使用 replace_in_file 工具将 VV 定制添加回当前文件
# 对比两个版本，找出 VV 特有的代码块
# 将这些代码块添加到新版本中
```

### Step 7: 编译验证

每次合并后必须验证：

```bash
# 0. VVCode 功能完整性快速检查（新增！）
.claude/skills/vv-check-integrity/quick-check.sh

# 如果快速检查失败，终止并报告问题
if [ $? -ne 0 ]; then
    echo "❌ VVCode 功能完整性检查失败！"
    echo "💡 请运行完整的 'vv-check-integrity' skill 获取详细诊断"
    exit 1
fi

# 1. 如果有 proto 变更，重新生成
if git diff HEAD~1 --name-only | grep -q "^proto/"; then
    npm run protos
fi

# 2. 类型检查
npm run check-types

# 3. 编译
npm run compile
```

**验证失败处理：**
- ❌ 快速检查失败 → 运行完整的 `vv-check-integrity` skill，定位缺失的集成点
- 🛑 类型检查/编译失败 → 立即停止
- 📝 记录错误信息
- 🔧 修复后重新验证

### Step 8: 用户验证（大改动时）

当满足以下条件时，暂停并请求用户验证：

```bash
# 计算变更规模
CHANGES=$(git diff HEAD~1 --stat | tail -1)
INSERTIONS=$(echo $CHANGES | grep -oE '[0-9]+ insertion' | grep -oE '[0-9]+' || echo 0)
DELETIONS=$(echo $CHANGES | grep -oE '[0-9]+ deletion' | grep -oE '[0-9]+' || echo 0)
TOTAL=$((INSERTIONS + DELETIONS))

# 检查关键文件
KEY_FILES_CHANGED=$(git diff HEAD~1 --name-only | grep -E "(extension\.ts|registry\.ts|state-keys\.ts|App\.tsx|ExtensionStateContext)" | wc -l)

# 需要用户验证的条件
if [ $TOTAL -gt 200 ] || [ $KEY_FILES_CHANGED -gt 0 ]; then
    echo "⚠️ 检测到重大变更，需要用户验证"
fi
```

**验证提示：**
```
🛑 需要手动验证 - 请测试以下功能：

1. 按 F5 启动调试模式
2. 检查 VV Balance Status Bar
3. 检查 VV Settings 按钮
4. 测试 VV 代码补全
5. 确认 VVCode 品牌显示

✅ 正常 → 输入 'continue'
❌ 有问题 → 描述问题，我来修复
```

### Step 9: 继续或完成

每个 commit 合并完成后：
- 如果还有待合并 commits → 回到 Step 4
- 如果全部完成 → 进入 Step 10

### Step 10: 最终验证和推送

```bash
# 完整验证
.claude/skills/vv-check-integrity/quick-check.sh  # 快速检查
npm run check-types                                 # 类型检查
npm run compile                                     # 编译验证

# 显示合并统计
echo "📊 合并统计："
git log origin/main..HEAD --oneline | wc -l
git diff origin/main --stat | tail -1

# 推送选项
echo "
✅ 合并完成！VVCode 功能完整性已验证。

下一步：
1. git push origin HEAD         # 推送到远程
2. gh pr create                 # 创建 PR
3. git checkout main && git merge HEAD  # 直接合并到 main
"
```

## VVCode 定制文件清单

### 必须保护的文件

| 文件路径 | 定制内容 |
|---------|---------|
| `src/services/auth/vv/*` | VV 认证服务 |
| `src/hosts/vscode/Vv*.ts` | VV Host 组件 |
| `src/core/controller/vv*/` | VV Controller |
| `webview-ui/src/components/vv-*` | VV UI 组件 |
| `webview-ui/src/components/onboarding/VvWelcomeView.tsx` | VV 欢迎页 |

### 需要恢复定制的文件

| 文件路径 | 需恢复的内容 |
|---------|-------------|
| `src/shared/storage/state-keys.ts` | VV 类型定义 |
| `src/extension.ts` | VV 组件初始化 |
| `src/registry.ts` | VV 按钮注册 |
| `webview-ui/src/App.tsx` | VV 组件集成 |
| `webview-ui/src/context/ExtensionStateContext.tsx` | VV 状态管理 |

## 错误恢复

```bash
# 回滚到上一个成功点
git reset --hard HEAD~1

# 完全重来
git checkout main
git branch -D merge-cline-*
```
