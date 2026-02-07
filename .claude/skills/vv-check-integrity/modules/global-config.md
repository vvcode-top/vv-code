# VVCode 全局资源配置

**配置ID**: global-config  
**描述**: VVCode 二次开发相关的文档、资源文件和技能清单

---

## 文档资源

以下文档描述了VVCode的二次开发实现细节：

- 📄 `CHANGELOG.md` - VVCode 变更日志（应保持 VVCode 格式）
- 📄 `docs/VV_AUTH_IMPLEMENTATION.md` - VV认证系统实现文档
- 📄 `docs/VV_GROUP_POLICY.md` - VV分组策略说明
- 📄 `.clinerules/fork-development.md` - 二次开发指南

---

## 资源文件

VVCode相关的静态资源：

- 🖼️ `assets/qq.jpg` - QQ群二维码图片

---

## Skills 技能

VVCode专用的AI技能脚本（当前以 Claude skills 形式管理）：

- 🔧 `.claude/skills/vv-merge-cline/SKILL.md` - 合并上游Cline代码的自动化技能
- 🔧 `.claude/skills/vv-release/SKILL.md` - VVCode快速发布流程技能

---

## 用途说明

### 文档用途

**Vv_Auth_Implementation.md**
- 详细描述认证系统的架构设计
- OAuth2 PKCE流程说明
- URI模式和本地回环模式的实现细节

**CHANGELOG.md**
- 记录 VVCode 版本变更
- 必须保持 `# VVCode Changelog` 头部与 VVCode 版本格式

**Vv_Group_Policy.md**
- 分组策略的设计理念
- 三种分组（discount/daily/performance）的区别
- 分组切换和Token管理机制

**.clinerules/fork-development.md**
- 二次开发的最佳实践
- 如何保持与上游Cline的同步
- 命名规范和代码组织建议

### 资源用途

**assets/qq.jpg**
- 用于社区交流
- 显示在设置页面或文档中
- 引导用户加入QQ群获取支持

### Skills用途

**vv-merge-cline (SKILL.md)**
- 自动化合并上游Cline代码
- 智能冲突解决策略
- 合并后自动验证构建

**vv-release (SKILL.md)**
- 快速发布新版本
- 自动更新版本号
- 构建和打包流程自动化

---

## 完整性检查

必须存在的文件：

- ✅ `CHANGELOG.md` - VVCode 变更日志（并保持 VVCode 格式）
- ✅ `docs/VV_AUTH_IMPLEMENTATION.md` - 认证系统文档
- ✅ `docs/VV_GROUP_POLICY.md` - 分组策略文档
- ✅ `.clinerules/fork-development.md` - 二次开发指南
- ✅ `assets/qq.jpg` - QQ群二维码
- ✅ `.claude/skills/vv-merge-cline/SKILL.md` - 合并上游Cline代码的自动化技能
- ✅ `.claude/skills/vv-release/SKILL.md` - VVCode快速发布流程技能

---

## 品牌通知检查

### 更新完成与欢迎通知文案（必须是 VVCode）
📁 `src/common.ts`

**要求**:
- 更新完成提示应包含 `VVCode has been updated to v${currentVersion}`
- 欢迎提示应包含 `Welcome to VVCode v${currentVersion}`

**检查命令**:
```bash
grep "VVCode has been updated to v" src/common.ts
grep "Welcome to VVCode v" src/common.ts
```

如果缺失任何文件，可能影响：
- 开发者理解VVCode架构
- 用户获取帮助和支持
- 自动化工作流程执行
