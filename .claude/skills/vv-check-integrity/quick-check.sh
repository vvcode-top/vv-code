#!/bin/bash

# VVCode 功能完整性快速检查脚本
# 用于快速验证关键集成点是否存在

echo "🔍 VVCode 功能完整性快速检查"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

ERRORS=0

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 检查函数
check_exists() {
    local pattern="$1"
    local file="$2"
    local description="$3"

    if grep -q "$pattern" "$file" 2>/dev/null; then
        echo -e "${GREEN}✅${NC} $description"
        return 0
    else
        echo -e "${RED}❌${NC} $description"
        ERRORS=$((ERRORS + 1))
        return 1
    fi
}

# 1. VvAuthService 初始化检查
echo "📦 1. VvAuthService 初始化"
check_exists "import { VvAuthService }" "src/core/controller/index.ts" "  - VvAuthService 导入"
check_exists "vvAuthService.*VvAuthService" "src/core/controller/index.ts" "  - vvAuthService 字段声明"
check_exists "VvAuthService.initialize(this)" "src/core/controller/index.ts" "  - VvAuthService.initialize 调用"
echo ""

# 1.5 登出清理检查
echo "🧹 1.5 登出清理"
check_exists "clearTask" "src/services/auth/vv/VvAuthService.ts" "  - 登出时清空任务"
check_exists "taskHistory\\\".*, \\[\\]" "src/services/auth/vv/VvAuthService.ts" "  - 登出时清空 taskHistory"
check_exists "vvGroupConfig\\\".*, \\[\\]" "src/services/auth/vv/VvAuthService.ts" "  - 登出时清空 vvGroupConfig"
check_exists "vvNeedsWebInit\\\".*, false" "src/services/auth/vv/VvAuthService.ts" "  - 登出时重置 vvNeedsWebInit"
echo ""

# 2. URI 回调路由检查
echo "🌐 2. URI 回调路由"
check_exists 'case "/vv-callback"' "src/services/uri/SharedUriHandler.ts" "  - /vv-callback 路由"
check_exists "handleVVAuthCallback" "src/services/uri/SharedUriHandler.ts" "  - handleVVAuthCallback 调用"
check_exists 'case "/init-complete"' "src/services/uri/SharedUriHandler.ts" "  - /init-complete 路由"
check_exists "handleVVInitComplete" "src/services/uri/SharedUriHandler.ts" "  - handleVVInitComplete 调用"
echo ""

# 3. Controller 回调方法检查
echo "🎯 3. Controller 回调方法"
check_exists "async handleVVAuthCallback" "src/core/controller/index.ts" "  - handleVVAuthCallback 方法"
check_exists "async handleVVInitComplete" "src/core/controller/index.ts" "  - handleVVInitComplete 方法"
echo ""

# 4. 状态推送检查
echo "📊 4. 状态推送到 WebView"
check_exists "vvGroupConfig.*getGlobalStateKey" "src/core/controller/index.ts" "  - vvGroupConfig 读取"
check_exists "vvNeedsWebInit.*getGlobalStateKey" "src/core/controller/index.ts" "  - vvNeedsWebInit 读取"
check_exists "vvSelectedGroupType.*getGlobalStateKey" "src/core/controller/index.ts" "  - vvSelectedGroupType 读取"

# 检查返回对象中是否包含这些字段（更宽松的检查）
if grep -A 100 "return {" "src/core/controller/index.ts" | grep -q "vvGroupConfig"; then
    echo -e "${GREEN}✅${NC}   - vvGroupConfig 在返回对象中"
else
    echo -e "${RED}❌${NC}   - vvGroupConfig 在返回对象中"
    ERRORS=$((ERRORS + 1))
fi
echo ""

# 4.5 动态分组关键路径检查
echo "🧩 4.5 动态分组关键路径"
check_exists "vvGroupConfig:.*VvGroupConfig" "src/shared/storage/state-keys.ts" "  - state-keys.ts: vvGroupConfig 类型"
check_exists "vvSelectedGroupType:.*VvGroupType" "src/shared/storage/state-keys.ts" "  - state-keys.ts: vvSelectedGroupType 类型"
check_exists "export type VvGroupType" "src/shared/storage/state-keys.ts" "  - state-keys.ts: VvGroupType 定义"
check_exists "export interface VvGroupItem" "src/shared/storage/state-keys.ts" "  - state-keys.ts: VvGroupItem 定义"
check_exists "normalizeVvBackendBaseUrl" "src/shared/vv-config.ts" "  - vv-config.ts: normalizeVvBackendBaseUrl"
check_exists "normalizeVvGroupApiProvider" "src/shared/vv-config.ts" "  - vv-config.ts: normalizeVvGroupApiProvider"
check_exists "setRemoteConfigField.*planModeApiProvider" "src/services/auth/vv/VvAuthService.ts" "  - VvAuthService: 同步 remoteConfigCache"
check_exists "setTaskSettingsBatch" "src/services/auth/vv/VvAuthService.ts" "  - VvAuthService: 同步 taskStateCache"
check_exists "getGroupTokens(" "src/services/auth/vv/providers/VvAuthProvider.ts" "  - VvAuthProvider: getGroupTokens"
check_exists "initGroupTokens(" "src/services/auth/vv/providers/VvAuthProvider.ts" "  - VvAuthProvider: initGroupTokens"
echo ""

# 5. VV Settings 按钮检查
echo "⚙️  5. VV Settings 按钮"
check_exists "sendVVSettingsButtonClickedEvent" "src/extension.ts" "  - sendVVSettingsButtonClickedEvent 导入"
check_exists "commands.VVSettingsButton" "src/extension.ts" "  - VVSettingsButton 命令注册"
echo ""

# 6. VvBalanceStatusBar 初始化检查
echo "💰 6. 余额状态栏"
check_exists "VvBalanceStatusBar" "src/extension.ts" "  - VvBalanceStatusBar 导入"
check_exists "initialize(context)" "src/extension.ts" "  - balanceStatusBar.initialize 调用"
check_exists "vvcode.refreshBalance" "src/extension.ts" "  - refreshBalance 命令注册"
echo ""

# 7. Skills 功能检查
echo "🔧 7. Skills 功能"
check_exists "getAvailableSkillsMetadata" "src/core/controller/index.ts" "  - getAvailableSkillsMetadata 方法"
if grep -A 100 "return {" "src/core/controller/index.ts" | grep -q "availableSkills"; then
    echo -e "${GREEN}✅${NC}   - availableSkills 在状态中"
else
    echo -e "${RED}❌${NC}   - availableSkills 在状态中"
    ERRORS=$((ERRORS + 1))
fi
COUNT=$(grep -A 6 "validateSlashCommand" "webview-ui/src/components/chat/ChatTextArea.tsx" 2>/dev/null | grep -c "availableSkills" || echo 0)
if [ "$COUNT" -ge 2 ]; then
    echo -e "${GREEN}✅${NC}   - 前端集成 ($COUNT/2)"
else
    echo -e "${RED}❌${NC}   - 前端集成 ($COUNT/2)"
    ERRORS=$((ERRORS + 1))
fi
echo ""

# 8. UI 自定义检查
echo "🎨 8. UI 自定义"
check_exists "expandTaskHeader.*useState(false)" "webview-ui/src/context/ExtensionStateContext.tsx" "  - TaskHeader 默认折叠状态"
check_exists "codicon-fold-up" "webview-ui/src/components/chat/auto-approve-menu/AutoApproveBar.tsx" "  - Auto-Approve 浮动折叠按钮"
check_exists "absolute top-0 right-0" "webview-ui/src/components/chat/auto-approve-menu/AutoApproveBar.tsx" "  - Auto-Approve 浮动定位"
check_exists "showVVSettings.*boolean" "webview-ui/src/context/ExtensionStateContext.tsx" "  - showVVSettings 状态定义"
check_exists "navigateToVVSettings" "webview-ui/src/context/ExtensionStateContext.tsx" "  - navigateToVVSettings 方法"
check_exists "showVVSettings.*VvSettingsView" "webview-ui/src/App.tsx" "  - VV设置路由集成"
check_exists "useVvAuth" "webview-ui/src/components/chat/ChatView.tsx" "  - ChatView 登录态判断"
check_exists "isAuthenticated" "webview-ui/src/components/chat/ChatView.tsx" "  - ChatView 使用 isAuthenticated"
check_exists "vvNeedsWebInit" "webview-ui/src/components/chat/ChatView.tsx" "  - ChatView 检查 vvNeedsWebInit"
if ! grep -q "showWelcome" "webview-ui/src/App.tsx" 2>/dev/null; then
    echo -e "${GREEN}✅${NC}   - App.tsx 无 showWelcome 分支"
else
    echo -e "${RED}❌${NC}   - App.tsx 仍存在 showWelcome 分支"
    ERRORS=$((ERRORS + 1))
fi
if ! grep -q "OnboardingView" "webview-ui/src/App.tsx" 2>/dev/null; then
    echo -e "${GREEN}✅${NC}   - App.tsx 无 OnboardingView"
else
    echo -e "${RED}❌${NC}   - App.tsx 仍导入/渲染 OnboardingView"
    ERRORS=$((ERRORS + 1))
fi
if ! grep -q "WelcomeView" "webview-ui/src/App.tsx" 2>/dev/null; then
    echo -e "${GREEN}✅${NC}   - App.tsx 无 WelcomeView"
else
    echo -e "${RED}❌${NC}   - App.tsx 仍导入/渲染 WelcomeView"
    ERRORS=$((ERRORS + 1))
fi
echo ""

# 9. 更新完成与欢迎通知文案
echo "🔔 9. 更新完成与欢迎通知文案"
check_exists "VVCode has been updated to v" "src/common.ts" "  - 更新完成提示使用 VVCode 品牌"
check_exists "Welcome to VVCode v" "src/common.ts" "  - 欢迎提示使用 VVCode 品牌"
echo ""

# 10. VV自定义组件文件
echo "📁 10. VV自定义组件文件"
ui_files_to_check=(
    "webview-ui/src/components/settings/VvSettingsView.tsx"
    "webview-ui/src/components/settings/VvAccountInfoCard.tsx"
    "webview-ui/src/components/settings/VvCompletionSettings.tsx"
    "webview-ui/src/components/chat/VvGroupSelector.tsx"
)

for file in "${ui_files_to_check[@]}"; do
    if [ -f "$file" ]; then
        echo -e "${GREEN}✅${NC}   - $file"
    else
        echo -e "${RED}❌${NC}   - $file"
        ERRORS=$((ERRORS + 1))
    fi
done
echo ""

# 11. 核心服务文件存在性检查
echo "📁 11. 核心服务文件"
files_to_check=(
    "src/services/auth/vv/VvAuthService.ts"
    "src/services/auth/vv/providers/VvAuthProvider.ts"
    "src/hosts/vscode/VvBalanceStatusBar.ts"
    "src/hosts/vscode/completion/VvCompletionProvider.ts"
    "proto/cline/vv_account.proto"
)

for file in "${files_to_check[@]}"; do
    if [ -f "$file" ]; then
        echo -e "${GREEN}✅${NC}   - $file"
    else
        echo -e "${RED}❌${NC}   - $file"
        ERRORS=$((ERRORS + 1))
    fi
done
echo ""

# 总结
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
if [ $ERRORS -eq 0 ]; then
    echo -e "${GREEN}✅ 所有检查通过！VVCode 功能完整。${NC}"
    exit 0
else
    echo -e "${RED}❌ 发现 $ERRORS 个问题。请修复后重新检查。${NC}"
    echo ""
    echo "💡 修复建议："
    echo "   1. 运行 'vv-check-integrity' skill 获取详细诊断"
    echo "   2. 查看 .claude/skills/vv-check-integrity/modules/ 中的模块清单"
    echo "   3. 从 git history 恢复缺失的代码"
    exit 1
fi
