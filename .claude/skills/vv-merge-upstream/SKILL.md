---
name: vv-merge-upstream
description: Incrementally merge code from Cline upstream repository day by day. Use when the user asks to sync with Cline, merge upstream changes, or update from the original Cline repository. Handles upstream setup, incremental merging, conflict resolution with VVCode customizations preserved.
---

# VVCode Incremental Merge Upstream

这个 skill 帮助你从 Cline 上游仓库**增量合并**最新代码，按天分批处理，同时保留 VVCode 的品牌定制和新增功能。

## 核心策略：按天增量合并

**为什么按天合并？**
- ✅ 每次合并的 commits 数量少，冲突更容易处理
- ✅ 可以在每一步验证编译和功能
- ✅ 出问题时容易定位和回滚
- ✅ 避免一次性合并导致的大量冲突

**工作流程**：
1. 获取上游最近 N 天的 commits
2. 按天分组
3. 逐天合并，每次合并后验证
4. 自动保护 VVCode 关键文件
5. 智能恢复 VVCode 定制

## VVCode 关键文件清单

在合并过程中，这些文件需要**特别保护**：

```bash
# 核心定制文件（VVCode 定制较多，需要手动合并）
PROTECTED_FILES=(
  "src/shared/storage/state-keys.ts"     # VVCode 类型定义
  "src/extension.ts"                      # 扩展初始化
  "src/registry.ts"                       # 按钮注册
  "webview-ui/src/App.tsx"                # UI 入口
  "webview-ui/src/context/ExtensionStateContext.tsx"  # 状态管理
)

# VVCode 特有文件（保留所有更改）
VV_PATTERNS=(
  "src/services/auth/vv/"                 # VV 认证服务
  "src/hosts/vscode/Vv*.ts"              # VV Host 组件
  "src/core/controller/vv*/"             # VV Controller
  "webview-ui/src/components/onboarding/VvWelcomeView.tsx"
)

# 品牌文件（完全保留 VVCode 版本）
BRAND_FILES=(
  "package.json"
  "README.md"
  "README.vvcode.md"
  "assets/icons/"
)
```

## 前置检查

### 1. 确认环境

```bash
# 检查仓库
git remote -v

# 检查工作目录
git status

# 获取当前分支
git branch --show-current
```

如果有未提交的更改，询问用户是否：
- 提交这些更改
- 使用 `git stash` 保存
- 取消合并操作

建议从 `main` 分支开始。

### 2. 设置上游仓库

```bash
# 检查上游
git remote -v | grep upstream

# 如果没有，添加上游
git remote add upstream https://github.com/cline/cline.git

# 获取上游最新代码
git fetch upstream
```

## 增量合并流程

### 第一步：分析上游更新

#### 1. 获取上次合并的时间点

```bash
# 查找最近的上游合并 commit
git log --grep="Merge upstream" --oneline -1
```

如果找到了上次合并的 commit，记录其 hash。

#### 2. 按天统计上游新增 commits

```bash
# 获取上游在过去 N 天的 commits，按天分组
for days in {1..30}; do
  count=$(git log HEAD..upstream/main \
    --since="$days days ago" \
    --until="$((days-1)) days ago" \
    --oneline | wc -l)
  
  if [ $count -gt 0 ]; then
    echo "Day -$days: $count commits"
    git log HEAD..upstream/main \
      --since="$days days ago" \
      --until="$((days-1)) days ago" \
      --oneline --no-decorate | head -5
  fi
done
```

#### 3. 向用户展示合并计划

基于上面的分析，向用户展示：
```
📊 上游更新分析：
- 总共有 X 天的更新未合并
- 共 Y 个新 commits
- 建议分 X 次合并（每次一天）

合并计划：
Day -1: 5 commits  (最近一天)
Day -2: 3 commits
Day -3: 8 commits
...

是否开始增量合并？
```

询问用户：
- 是否继续
- 是否要调整合并粒度（例如每次合并 2-3 天）

### 第二步：创建合并分支

```bash
# 创建新分支
git checkout -b merge-upstream-incremental-$(date +%Y%m%d)

# 确认分支
git branch --show-current
```

### 第三步：逐天合并

对于每一天的 commits：

#### 1. 找到该天的最后一个 commit

```bash
# 获取 N 天前的最后一个 commit hash
TARGET_COMMIT=$(git log upstream/main \
  --since="$N days ago" \
  --until="$((N-1)) days ago" \
  --pretty=format:"%H" | tail -1)
```

#### 2. 尝试合并到该 commit

```bash
echo "📦 合并 Day -$N 的更新..."
git merge $TARGET_COMMIT --no-ff -m "Merge upstream commits from Day -$N"
```

#### 3. 检查合并状态

```bash
git status
```

**情况 A：无冲突**
- ✅ 合并成功
- 继续到"验证步骤"

**情况 B：有冲突**
- ⚠️ 进入"冲突处理流程"

### 第四步：智能冲突处理

#### 1. 分析冲突文件

```bash
# 列出冲突文件
CONFLICT_FILES=$(git diff --name-only --diff-filter=U)
```

#### 2. 自动处理策略

对每个冲突文件：

**A. 检查是否是 VVCode 特有文件**
```bash
if [[ $file == src/services/auth/vv/* ]] || \
   [[ $file == *Vv*.ts ]] || \
   [[ $file == webview-ui/src/components/vv-* ]]; then
  # VVCode 特有文件，完全保留我们的版本
  git checkout --ours $file
  git add $file
  echo "✅ $file: 保留 VVCode 版本"
fi
```

**B. 检查是否是品牌文件**
```bash
if [[ $file == "package.json" ]] || \
   [[ $file == "README.md" ]] || \
   [[ $file == assets/icons/* ]]; then
  # 品牌文件，保留 VVCode 版本
  git checkout --ours $file
  git add $file
  echo "✅ $file: 保留 VVCode 品牌"
fi
```

**C. 检查是否是关键定制文件**
```bash
if [[ $file == "src/shared/storage/state-keys.ts" ]] || \
   [[ $file == "src/extension.ts" ]] || \
   [[ $file == "src/registry.ts" ]] || \
   [[ $file == "webview-ui/src/App.tsx" ]] || \
   [[ $file == "webview-ui/src/context/ExtensionStateContext.tsx" ]]; then
  # 关键文件，需要智能合并
  echo "⚠️ $file: 需要智能合并（VVCode 有重要定制）"
  
  # 策略：先接受上游版本，然后立即恢复 VVCode 定制
  git checkout --theirs $file
  
  # 标记需要立即恢复 VVCode 定制
  echo $file >> .vvcode-restore-current-day
fi
```

**D. 其他文件**
```bash
# 核心文件且 VVCode 没有定制，接受上游版本
git checkout --theirs $file
git add $file
echo "✅ $file: 接受上游版本"
```

#### 3. 立即恢复 VVCode 定制（关键！）

**如果有关键文件冲突，必须立即恢复 VVCode 定制：**

```bash
if [ -f .vvcode-restore-current-day ]; then
  echo "🔄 立即恢复 VVCode 定制..."
  
  # 获取合并前的版本（HEAD~1）
  while read file; do
    echo "处理: $file"
    
    # 获取旧版本内容
    git show HEAD~1:$file > /tmp/old-$(basename $file)
    
    echo "⚠️ 需要恢复 $file 中的 VVCode 定制"
    echo "   旧版本已保存到 /tmp/old-$(basename $file)"
    
    # 根据文件类型给出具体提示
    case $file in
      "src/shared/storage/state-keys.ts")
        echo "   需恢复: VvUserInfo, VvUserConfig, VvGroupConfig 等类型"
        echo "   需恢复: 所有 vv* 开头的字段"
        ;;
      "src/extension.ts")
        echo "   需恢复: VV Balance Status Bar 初始化"
        echo "   需恢复: VV Completion Provider 注册"
        ;;
      "src/registry.ts")
        echo "   需恢复: VVSettingsButton 注册"
        ;;
      "webview-ui/src/App.tsx")
        echo "   需恢复: VVCode UI 组件导入和使用"
        ;;
      "webview-ui/src/context/ExtensionStateContext.tsx")
        echo "   需恢复: VVCode 状态字段 (vv* 开头)"
        ;;
    esac
  done < .vvcode-restore-current-day
  
  echo ""
  echo "🛑 现在需要手动恢复 VVCode 定制："
  echo "1. 使用 replace_in_file 工具对比旧版本和新版本"
  echo "2. 将 VVCode 特有的代码添加回去"
  echo "3. 保持上游的新功能,只添加 VVCode 的额外功能"
  echo "4. 恢复完成后继续执行"
  echo ""
  
  # 等待恢复完成
  # 清理标记文件将在恢复完成并验证通过后删除
fi
```

**恢复原则**：
- ✅ 保留上游的所有新功能和改进
- ✅ 添加 VVCode 的额外类型、字段、组件
- ✅ 不覆盖上游的核心逻辑
- ✅ 确保 VVCode 功能完整性

#### 4. 检查是否所有冲突已解决

```bash
git status
```

如果仍有未解决的冲突,询问用户如何处理。

#### 5. 暂存已解决的冲突文件

```bash
# 暂存所有已解决的文件(包括恢复了VVCode定制的文件)
git add .
```

#### 6. 提交合并

```bash
git commit -m "Merge upstream Day -$N commits

Auto-resolved conflicts:
- VVCode特有文件: 保留本地版本
- 品牌文件: 保留VVCode品牌
- 关键定制文件: 接受上游更新并立即恢复VVCode定制
- 其他核心文件: 接受上游更新

VVCode功能已在本次提交中完整恢复。"

# 清理标记文件
rm -f .vvcode-restore-current-day
```

### 第五步：验证每次合并

在每天的合并完成后：

#### 1. 重新生成 Protobuf（如果需要）

```bash
if git diff HEAD~1 --name-only | grep -q "proto/"; then
  echo "🔄 检测到 proto 文件变更，重新生成..."
  npm run protos
fi
```

#### 2. 快速类型检查

```bash
npm run check-types
```

如果类型检查失败：
- 🛑 停止合并流程
- 📝 记录当前位置
- 🔧 需要修复类型错误后才能继续

#### 3. 编译检查

```bash
npm run compile
```

如果编译失败：
- 🛑 停止合并流程
- 需要修复后继续

#### 4. 检测重大变更并请求用户验证

```bash
# 统计本次合并的变更规模
CHANGED_LINES=$(git diff HEAD~1 --stat | tail -1 | awk '{print $4, $6}')
INSERTIONS=$(echo $CHANGED_LINES | awk '{print $1}')
DELETIONS=$(echo $CHANGED_LINES | awk '{print $2}')
TOTAL_CHANGES=$((INSERTIONS + DELETIONS))

# 检查是否有关键文件被修改
HAS_KEY_FILE_CHANGES=$(git diff HEAD~1 --name-only | grep -E "(state-keys|extension\.ts|registry\.ts|App\.tsx|ExtensionStateContext)" || echo "")

# 检查是否有 proto 文件变更
HAS_PROTO_CHANGES=$(git diff HEAD~1 --name-only | grep "proto/" || echo "")

# 判断是否需要用户验证
NEED_USER_VERIFICATION=false

if [ $TOTAL_CHANGES -gt 100 ]; then
  NEED_USER_VERIFICATION=true
  REASON="检测到重大变更（$TOTAL_CHANGES 行变更）"
fi

if [ ! -z "$HAS_KEY_FILE_CHANGES" ]; then
  NEED_USER_VERIFICATION=true
  REASON="检测到关键文件变更并已恢复VVCode定制"
fi

if [ ! -z "$HAS_PROTO_CHANGES" ]; then
  NEED_USER_VERIFICATION=true
  REASON="检测到 Proto 文件结构变更"
fi

# 如果需要验证，停下来请求用户测试
if [ "$NEED_USER_VERIFICATION" = true ]; then
  echo ""
  echo "⚠️ $REASON"
  echo ""
  echo "🛑 需要用户验证 - 请执行以下测试："
  echo ""
  echo "1. 运行开发模式:"
  echo "   在 VSCode 中按 F5 启动调试模式"
  echo "   这会打开一个新的扩展开发主机窗口"
  echo ""
  echo "2. 测试 VVCode 核心功能:"
  echo "   ✓ VV Balance Status Bar 显示正常"
  echo "   ✓ VV Settings 按钮可点击"
  echo "   ✓ VV 认证流程正常"
  echo "   ✓ VV 代码补全功能正常"
  echo "   ✓ VVCode 品牌元素显示正常"
  echo ""
  echo "3. 测试上游新功能是否正常工作"
  echo ""
  echo "4. 检查控制台是否有错误"
  echo ""
  echo "📋 验证完成后："
  echo "   ✅ 如果一切正常 - 输入 'continue' 继续下一天的合并"
  echo "   ❌ 如果有问题 - 输入 'abort' 停止合并"
  echo "   🔧 如果需要修复 - 手动修复后输入 'continue'"
  echo ""
  
  # 等待用户反馈
  # 在实际执行时，这里会暂停并等待用户响应
fi
```

**如果验证通过**：
- ✅ 继续下一天的合并
- 或者如果是最后一天，进入最终验证步骤

**如果发现问题**：
- 🔧 修复问题
- 🔄 重新运行类型检查和编译
- ✅ 确认无误后继续

### 第六步：最终检查（备用恢复流程）

**注意：在新流程中，VVCode 定制应该已经在每天合并时立即恢复了。**

但如果由于某种原因有遗漏，可以检查是否有 `.vvcode-restore-needed` 文件：

#### 1. 读取需要恢复的文件列表

```bash
cat .vvcode-restore-needed
```

#### 2. 对每个文件恢复 VVCode 定制

**示例：恢复 state-keys.ts 的 VVCode 类型**

```bash
# 获取合并前的版本（包含 VVCode 定制）
OLD_COMMIT=$(git log --grep="Merge upstream" -2 --pretty=format:"%H" | tail -1)

# 提取 VVCode 类型定义部分
git show $OLD_COMMIT:src/shared/storage/state-keys.ts > /tmp/old-state-keys.ts
```

然后使用 `replace_in_file` 工具将 VVCode 的类型定义添加回去：
- VvUserInfo
- VvUserConfig  
- VvGroupConfig
- VvGroupType
- VvGroupItem
- 所有 `vv*` 开头的字段

#### 3. 恢复 extension.ts 的 VVCode 初始化

```bash
git show $OLD_COMMIT:src/extension.ts > /tmp/old-extension.ts
```

恢复：
- VV Balance Status Bar 初始化
- VV Completion Provider 注册
- 中文 UI 文本

#### 4. 恢复 registry.ts 的按钮定义

```bash
git show $OLD_COMMIT:src/registry.ts > /tmp/old-registry.ts
```

恢复：
- VVSettingsButton
- 移除的 Settings/Account 按钮注释

#### 5. 恢复 webview 文件

对于 `App.tsx` 和 `ExtensionStateContext.tsx`，执行类似的恢复操作。

#### 6. 验证恢复结果

```bash
# 检查类型
npm run check-types

# 编译
npm run compile
```

如果有错误，继续修复直到通过。

#### 7. 提交恢复的更改

```bash
git add .
git commit -m "chore: restore VVCode customizations after upstream merge

Restored VVCode customizations in:
- src/shared/storage/state-keys.ts (VVCode types)
- src/extension.ts (VV components initialization)
- src/registry.ts (VV Settings button)
- webview-ui/ (VVCode UI customizations)

All VVCode features preserved while keeping upstream updates."

# 清理临时文件
rm -f .vvcode-restore-needed
```

### 第七步：最终验证

#### 1. 完整类型检查

```bash
npm run check-types
```

#### 2. 完整编译

```bash
npm run compile
```

#### 3. 运行测试（可选）

```bash
npm run test:unit
```

#### 4. 本地运行验证

```bash
# 在 VSCode 中按 F5 启动调试模式
# 这会打开一个新的扩展开发主机窗口
```

提示用户测试：
- VVCode 品牌显示正常
- VV Balance Status Bar 功能正常
- VV Settings 按钮工作正常
- VV 代码补全功能正常
- 上游新功能也能正常使用

## 完成和推送

### 1. 查看合并历史

```bash
git log --oneline --graph -20
```

应该看到：
- 多个"Merge upstream Day -N commits"
- 可能有"restore VVCode customizations"

### 2. 统计信息

```bash
# 查看文件变更统计
git diff origin/main --stat

# 查看新增 commits 数量
git log origin/main..HEAD --oneline | wc -l
```

### 3. 向用户报告

```
✅ 增量合并完成！

📊 合并统计：
- 合并了 X 天的更新
- 共 Y 个 commits
- Z 个文件被修改
- VVCode 所有定制功能已恢复

✅ 验证通过：
- TypeScript 类型检查: 通过
- 编译: 成功
- 本地运行: 正常

📋 下一步：
1. 在本地充分测试功能
2. 确认 VVCode 品牌和特有功能正常
3. 测试上游新功能

⚠️ 测试通过后可以推送：
```bash
git push origin HEAD
```

或创建 Pull Request：
```bash
gh pr create \
  --title "Incremental merge: Cline upstream (Day -X to Day -1)" \
  --body "增量合并 X 天的上游更新，共 Y 个 commits"
```
```

## 增量合并的优势

### 与一次性合并对比

| 特性 | 一次性合并 | 增量合并（按天） |
|------|-----------|----------------|
| 冲突数量 | 很多 | 少量 |
| 冲突复杂度 | 高 | 低 |
| 定位问题 | 困难 | 容易 |
| 回滚成本 | 高 | 低 |
| 验证粒度 | 粗 | 细 |
| 处理时间 | 长 | 可分段 |

### 实际效果

**一次性合并**（旧方案）：
- 685 个文件冲突
- 使用 `--theirs` 策略
- 导致 103 个编译错误
- 需要手动恢复所有 VVCode 定制

**增量合并**（新方案）：
- 每天可能只有 5-10 个文件冲突
- 自动保护 VVCode 关键文件
- 每步验证编译
- 智能恢复 VVCode 定制
- 出问题立即发现并修复

## 错误恢复

### 如果某一天的合并出现问题

```bash
# 回滚到上一次成功的合并
git reset --hard HEAD~1

# 或者回滚到合并前
git reset --hard origin/main

# 重新开始合并
# 可以跳过有问题的那一天，或者调整策略
```

### 如果 VVCode 定制恢复不完整

```bash
# 查看合并前的完整状态
git show origin/main:src/shared/storage/state-keys.ts

# 手动补充缺失的定制
# 使用 replace_in_file 工具
```

## 定期合并建议

**推荐频率**：
- 🟢 **理想**：每周合并一次（1-7 天的更新）
- 🟡 **可接受**：每月合并一次（1-30 天的更新）
- 🔴 **不推荐**：超过 2 个月不合并（冲突会很多）

**自动化建议**：
- 可以设置 GitHub Actions 定期运行此 skill
- 自动创建合并 PR
- 人工审查后合并

## 总结清单

完成增量合并前，确认：
- [ ] 工作目录干净
- [ ] 上游仓库已配置
- [ ] 创建了合并分支
- [ ] 按天逐步合并
- [ ] 每步都验证编译
- [ ] VVCode 关键文件已保护
- [ ] VVCode 定制已恢复
- [ ] 最终类型检查通过
- [ ] 最终编译成功
- [ ] 本地测试通过
- [ ] 准备推送或创建 PR

## 文件命名和组织

确保所有 VVCode 新增文件遵循命名规范：
- 文件名以 `vv` 或 `Vv` 开头
- 在文件顶部添加 `// VVCode Customization:` 注释
- 尽量将代码放在独立模块中
- 避免对核心文件做过多侵入性修改

这样在未来的合并中，自动化工具可以更容易识别和保护 VVCode 的定制内容。
