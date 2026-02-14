# 余额显示系统

**模块ID**: vv-balance  
**关键性**: ⚠️ Critical  
**描述**: 在VSCode状态栏显示用户余额，支持自动刷新和手动刷新

---

## 核心组件

### VvBalanceStatusBar
📁 `src/hosts/vscode/VvBalanceStatusBar.ts`

单例模式的状态栏管理类，负责在VSCode底部状态栏显示用户余额和选中代码提示。

**必须包含的方法和类**:
- `class VvBalanceStatusBar` - 状态栏管理类
- `getInstance` - 获取单例实例
- `initialize` - 初始化状态栏（在extension.ts中调用）
- `updateDisplay` - 更新显示内容（余额、选中代码等）
- `refreshBalance` - 刷新余额（手动或自动触发）

---

## 扩展注册

📁 `src/extension.ts`

扩展激活时必须初始化状态栏并注册刷新命令。

**必须导入**:
- `const { VvBalanceStatusBar } = await import("./hosts/vscode/VvBalanceStatusBar")`

**必须初始化**（关键！）:
```typescript
const balanceStatusBar = VvBalanceStatusBar.getInstance()
balanceStatusBar.initialize(context)  // ⚠️ 必须调用 initialize
```

**必须注册刷新命令**:
```typescript
context.subscriptions.push(
    vscode.commands.registerCommand("vvcode.refreshBalance", async () => {
        await balanceStatusBar.refreshBalance()
    }),
)
```

**检查方法**:
```bash
# 检查是否调用 initialize
grep -A 2 "VvBalanceStatusBar.getInstance()" src/extension.ts | grep "initialize(context)"

# 检查是否注册命令
grep "vvcode.refreshBalance" src/extension.ts
```

---

## 功能说明

### 显示内容

状态栏会显示以下信息：
- **用户余额** - 实时显示当前账户余额
- **选中代码提示** - 当选中代码时，显示选中的字符数和行数
- **刷新状态** - 显示刷新图标，点击可手动刷新

### 自动刷新

- 登录成功后自动刷新
- 切换分组后自动刷新
- 定期自动刷新（可配置间隔）

### 手动刷新

用户可以通过以下方式手动刷新：
- 点击状态栏的刷新图标
- 执行命令 `vvcode.refreshBalance`
- 通过命令面板触发

---

## 集成流程

```
extension.ts (activate)
    ↓
VvBalanceStatusBar.getInstance()
    ↓
initialize(context)
    ↓
创建状态栏项
    ↓
注册事件监听（选中代码、认证状态变化）
    ↓
开始显示余额
```

---

## 依赖关系

- **依赖 VvAuthService** - 获取用户信息和余额
- **监听认证状态** - 登录/登出时更新显示
- **监听编辑器选择** - 选中代码时更新提示
