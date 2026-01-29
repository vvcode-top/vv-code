# VV界面自定义

**模块ID**: vv-ui-customization
**关键性**: ⚠️ Critical
**描述**: VVCode界面自定义功能（TaskHeader默认状态、VV组件、路由集成）

---

## 核心检查点

### 1. TaskHeader 默认折叠状态
📁 `webview-ui/src/context/ExtensionStateContext.tsx`

**必须正确配置**:
```typescript
const [expandTaskHeader, setExpandTaskHeader] = useState(false)  // 必须是 false
```

**检查命令**:
```bash
grep "expandTaskHeader.*useState(false)" webview-ui/src/context/ExtensionStateContext.tsx
```

---

### 2. VV状态管理
📁 `webview-ui/src/context/ExtensionStateContext.tsx`

**必须包含的状态和方法**:
- `showVVSettings: boolean` - VV设置页面显示状态
- `expandTaskHeader: boolean` - 任务头折叠状态
- `navigateToVVSettings()` - 打开VV设置方法
- `hideVVSettings()` - 关闭VV设置方法
- `setExpandTaskHeader()` - 控制任务头折叠方法

**检查命令**:
```bash
grep "showVVSettings.*boolean" webview-ui/src/context/ExtensionStateContext.tsx
grep "expandTaskHeader.*boolean" webview-ui/src/context/ExtensionStateContext.tsx
grep "navigateToVVSettings" webview-ui/src/context/ExtensionStateContext.tsx
```

---

### 3. VV自定义组件文件

**必须存在的文件**:
- `webview-ui/src/components/settings/VvSettingsView.tsx` - VV设置页面
- `webview-ui/src/components/settings/VvAccountInfoCard.tsx` - 账户信息卡片
- `webview-ui/src/components/settings/VvCompletionSettings.tsx` - 补全设置
- `webview-ui/src/components/chat/VvGroupSelector.tsx` - 分组选择器

**检查命令**:
```bash
test -f webview-ui/src/components/settings/VvSettingsView.tsx && echo "✅" || echo "❌"
test -f webview-ui/src/components/chat/VvGroupSelector.tsx && echo "✅" || echo "❌"
```

---

### 4. App.tsx 路由集成
📁 `webview-ui/src/App.tsx`

**必须包含**:
- `import ... from './components/settings/VvSettingsView'` - 导入VV设置组件
- `{showVVSettings && <VvSettingsView />}` - 条件渲染VV设置页面

**检查命令**:
```bash
grep "import.*VvSettingsView" webview-ui/src/App.tsx
grep "showVVSettings.*VvSettingsView" webview-ui/src/App.tsx
```

---

### 5. App.tsx 新用户默认进入 VV 欢迎页
📁 `webview-ui/src/App.tsx`

**风险点（不应存在）**:
- `showWelcome` 分支
- `OnboardingView` 导入或渲染
- `WelcomeView` 导入或渲染

**检查命令**:
```bash
! grep -q "showWelcome" webview-ui/src/App.tsx
! grep -q "OnboardingView" webview-ui/src/App.tsx
! grep -q "WelcomeView" webview-ui/src/App.tsx
```

---

### 6. Navbar 自定义
📁 `webview-ui/src/components/menu/Navbar.tsx`

**必须包含**:
- `navigateToVVSettings` 方法调用
- VVCode Customization 标记注释

**检查命令**:
```bash
grep "navigateToVVSettings" webview-ui/src/components/menu/Navbar.tsx
grep "VVCode Customization" webview-ui/src/components/menu/Navbar.tsx
```

---

## 合并上游高风险文件

以下文件在合并时容易被覆盖，需要特别注意：

1. **ExtensionStateContext.tsx** - 检查 `expandTaskHeader` 默认值、VV状态定义
2. **App.tsx** - 检查 VV路由和导入
3. **Navbar.tsx** - 检查 VV按钮和导航逻辑

**合并后快速验证**:
```bash
grep -q "expandTaskHeader.*useState(false)" webview-ui/src/context/ExtensionStateContext.tsx && echo "✅" || echo "❌"
grep -q "showVVSettings.*VvSettingsView" webview-ui/src/App.tsx && echo "✅" || echo "❌"
```

---

## 依赖关系

- **依赖**: ExtensionStateContext, React Context
- **被使用**: TaskHeader, VvSettingsView, Navbar
