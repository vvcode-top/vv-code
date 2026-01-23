---
name: vv-merge-upstream
description: Merge latest code from Cline upstream repository. Use when the user asks to sync with Cline, merge upstream changes, or update from the original Cline repository. Handles upstream setup, branch creation, conflict resolution with VVCode customizations preserved.
---

# VVCode Merge Upstream

这个 skill 帮助你从 Cline 上游仓库合并最新代码，同时保留 VVCode 的品牌定制和新增功能。

## 前置检查

### 1. 确认当前在正确的仓库

```bash
git remote -v
```

确认 `origin` 指向 `vvcode-top/vv-code`。

### 2. 检查工作目录状态

```bash
git status
```

如果有未提交的更改：
- 询问用户是否先提交这些更改
- 或者使用 `git stash` 临时保存
- 确保工作目录干净后再继续

### 3. 获取当前分支

```bash
git branch --show-current
```

建议从 `main` 分支开始操作，如果不在 `main` 分支，询问用户是否切换。

## 第一步：检查和设置上游仓库

### 1. 检查是否已配置上游

```bash
git remote -v | grep upstream
```

### 2. 如果没有上游，添加 Cline 上游仓库

```bash
git remote add upstream https://github.com/cline/cline.git
```

### 3. 验证上游配置

```bash
git remote -v
```

应该看到：
- `origin` -> vvcode-top/vv-code
- `upstream` -> cline/cline

### 4. 获取上游最新代码

```bash
git fetch upstream
```

这会拉取上游的所有分支和标签，但不会合并。

## 第二步：查看上游更新

### 1. 查看上游 main 分支的最新提交

```bash
git log HEAD..upstream/main --oneline --no-decorate | head -20
```

### 2. 查看文件变更统计

```bash
git diff HEAD..upstream/main --stat
```

### 3. 向用户展示更新摘要

分析上面的输出，向用户说明：
- 有多少个新提交
- 哪些文件会被修改
- 是否有重要的功能更新或 breaking changes

询问用户是否继续合并。

## 第三步：创建合并分支

### 1. 创建新的合并分支

基于当前 main 分支创建一个新分支，命名格式：`merge-upstream-YYYYMMDD`

```bash
git checkout -b merge-upstream-$(date +%Y%m%d)
```

### 2. 确认分支创建成功

```bash
git branch --show-current
```

## 第四步：合并上游代码

### 1. 尝试合并上游 main 分支

```bash
git merge upstream/main --no-ff -m "Merge upstream/main into vvcode"
```

使用 `--no-ff` 保留合并历史。

### 2. 检查合并状态

```bash
git status
```

**如果合并成功**（没有冲突）：
- 跳到"第六步：验证和推送"

**如果有冲突**（出现 "CONFLICT" 消息）：
- 继续到"第五步：解决冲突"

## 第五步：解决冲突

### 1. 列出所有冲突文件

```bash
git status | grep "both modified"
```

### 2. 对每个冲突文件进行分析

对于每个冲突文件，使用 `read_file` 查看冲突内容：

```bash
# 查看冲突文件
cat path/to/conflicted/file
```

### 3. 冲突解决策略

根据 `.clinerules/fork-development.md` 的指导原则：

#### 优先保留的 VVCode 定制（必须保留）：

1. **品牌化文件**：
   - `package.json` - name, displayName, publisher, repository
   - `README.md`, `README.vvcode.md`
   - `assets/icons/` - 图标文件
   - 所有 `vv*` 或 `Vv*` 开头的文件

2. **VVCode 新增功能**：
   - `src/exports/vv-*` - 导出的自定义功能
   - `src/integrations/vv-*` - 第三方服务集成
   - `webview-ui/src/components/vv-*` - 自定义 UI 组件
   - 所有在文件顶部有 `// VVCode Customization:` 注释的修改

3. **VVCode 特有的 API Provider**：
   - 自定义的 API provider 配置
   - VVCode 特有的设置项

#### 可以接受上游的更新：

1. **核心逻辑文件**（如果没有 VVCode 定制）：
   - `src/core/task/index.ts`
   - `src/core/controller/index.ts`
   - `src/core/webview/index.ts`
   - `proto/` 文件（除非有 VVCode 扩展）

2. **依赖更新**：
   - `package-lock.json`
   - `yarn.lock`

3. **测试和构建配置**：
   - 测试文件
   - CI/CD 配置（根据情况）

### 4. 解决单个冲突文件

对于每个冲突文件：

a. **读取冲突内容**：
```bash
cat path/to/file
```

b. **分析冲突标记**：
```
<<<<<<< HEAD
VVCode 的代码
=======
Cline 上游的代码
>>>>>>> upstream/main
```

c. **决策流程**：

- **如果是 VVCode 品牌文件**：保留 HEAD（VVCode）版本
- **如果是 VVCode 新增功能**：保留 HEAD 版本
- **如果是核心文件且 VVCode 没有定制**：接受上游版本
- **如果不确定**：使用 `ask_followup_question` 询问用户

d. **编辑文件解决冲突**：

使用 `replace_in_file` 工具修改文件，删除冲突标记并保留正确的代码。

e. **标记文件为已解决**：
```bash
git add path/to/file
```

### 5. 常见冲突文件的处理建议

#### `package.json`
- 保留 VVCode 的 name, displayName, publisher, repository
- 接受上游的 dependencies 和 devDependencies 更新
- 合并 scripts 部分（保留 VVCode 特有的脚本）

#### `README.md`
- 保留 VVCode 的品牌说明
- 可以接受上游的功能描述更新（如果不冲突）

#### `src/shared/api.ts`
- 保留 VVCode 的自定义 API provider
- 接受上游的新增 provider 和模型

#### `webview-ui/` 下的文件
- 保留所有 `Vv*` 开头的组件
- 如果是现有组件的修改，需要仔细判断

### 6. 批量检查是否所有冲突已解决

```bash
git status
```

确保没有 "Unmerged paths" 的文件。

## 第六步：验证和测试

### 1. 重新生成 Protobuf 类型（如果 proto 文件有变化）

```bash
npm run protos
```

### 2. 安装可能的新依赖

```bash
npm run install:all
```

### 3. 进行类型检查

```bash
npm run check-types
```

如果有类型错误：
- 分析错误原因
- 可能是 VVCode 的定制代码需要适配新的类型
- 修复错误或询问用户

### 4. 构建测试

```bash
npm run compile
```

### 5. 运行单元测试（可选）

```bash
npm run test:unit
```

## 第七步：提交合并

### 1. 查看所有更改

```bash
git status
git diff --cached --stat
```

### 2. 提交合并（如果有冲突解决）

```bash
git commit -m "Merge upstream/main with conflict resolution

- Resolved conflicts in: [list key files]
- Preserved VVCode branding and custom features
- Updated dependencies from upstream"
```

如果没有冲突，合并已经自动提交了。

### 3. 本地测试完成

**重要提示：合并流程在本地完成，不会自动推送到远程。**

向用户说明：
> ✅ 上游代码合并完成！所有更改已在本地提交。
> 
> 📋 下一步建议：
> 1. 在本地充分测试合并后的代码
> 2. 运行开发服务器验证功能：`npm run dev`
> 3. 测试主要功能是否正常工作
> 4. 确认 VVCode 的品牌和自定义功能都正常
> 
> ⚠️ 测试通过后，你可以手动推送：
> ```bash
> git push origin HEAD
> ```
> 
> 或创建 Pull Request 进行代码审查：
> ```bash
> gh pr create --title "Merge upstream Cline updates [$(date +%Y-%m-%d)]" \
>   --body "合并来自 cline/cline 的最新更新" \
>   --base main
> ```

## 错误处理

### 常见问题

1. **没有安装 git**：
   - 提示用户安装 git

2. **上游仓库 URL 错误**：
   - 确保使用 `https://github.com/cline/cline.git`

3. **合并冲突太多**：
   - 建议用户考虑部分合并
   - 或者先在测试分支上尝试

4. **类型检查失败**：
   - VVCode 的定制代码可能需要适配新的上游接口
   - 需要手动修复适配

5. **测试失败**：
   - 检查是否是 VVCode 特有功能的测试
   - 或者是上游更新导致的破坏性变更

## 总结清单

完成合并前，确认：
- [ ] 工作目录干净（或已保存）
- [ ] 上游仓库已配置
- [ ] 已获取上游最新代码
- [ ] 创建了合并分支
- [ ] 所有冲突已解决
- [ ] VVCode 品牌和自定义功能已保留
- [ ] Protobuf 类型已重新生成（如需要）
- [ ] 依赖已安装
- [ ] 类型检查通过
- [ ] 代码可以编译
- [ ] 更改已提交并推送

## 最后的建议

- **保持小步合并**：定期同步上游可以减少冲突
- **记录定制内容**：在 `.clinerules/` 中记录所有 VVCode 的定制
- **使用命名规范**：所有 VVCode 新增文件以 `vv` 或 `Vv` 开头
- **测试彻底**：合并后务必测试主要功能
