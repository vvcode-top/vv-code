# VVCode 认证实现文档

## 认证流程

```
用户点击登录
    ↓
生成 PKCE 参数（state, code_verifier, code_challenge）
保存到 GlobalState（立即持久化）
    ↓
打开浏览器：https://vvcode.top/oauth/vscode/login?state=xxx&code_challenge=xxx&redirect_uri=xxx
    ↓
用户在浏览器完成登录
    ↓
后端重定向：vscode://PiuQiuPiaQia.vvcode/vv-callback?code=xxx&state=xxx
    ↓
VSCode URI Handler 接收回调
    ↓
验证 state 参数（CSRF 防护）
    ↓
POST /api/oauth/vscode/token（form-urlencoded 格式）
    ↓
获取 access_token，存储到 Secrets
    ↓
GET /api/user/self（需要 Authorization + New-Api-User 头）
    ↓
清理临时数据，广播状态更新
    ↓
登录完成
```

---

## API 协议

### 1. Token 交换

**POST /api/oauth/vscode/token**

Content-Type: `application/x-www-form-urlencoded`

```
code=AUTH_CODE&code_verifier=64字符随机字符串&state=32字符随机字符串
```

响应：
```json
{
  "access_token": "eyJhbG...",
  "user_id": 12345,
  "username": "zhangao",
  "display_name": "张三",
  "role": 1,
  "expires_in": 3600
}
```

### 2. 获取用户信息

**GET /api/user/self**

Headers:
- `Authorization: Bearer {access_token}`
- `New-Api-User: {user_id}`

响应：
```json
{
  "data": {
    "id": 12345,
    "username": "zhangao",
    "email": "zhangao@example.com",
    "avatar_url": "https://...",
    "created_time": 1703001234,
    "quota": 10000,
    "used_quota": 2345,
    "role": 1
  }
}
```

---

## 关键实现细节

### 存储策略

| 数据 | 存储位置 | 原因 |
|------|----------|------|
| state, code_verifier | GlobalState | 临时数据，需要跨扩展重载保持 |
| access_token, user_id | Secrets | 敏感数据，安全存储 |
| user_info, user_config | GlobalState | 用户信息，需要同步到 webview |

### 防重复处理

```typescript
private _processingAuthCallback: boolean = false
private _lastProcessedCode: string | null = null
```

浏览器可能多次触发回调，通过标记防止重复处理同一授权码。

### 立即持久化

```typescript
await controller.stateManager.flushPendingState()
```

StateManager 默认 500ms 防抖，认证流程需要立即持久化以防止数据丢失。

---

## 文件结构

```
src/services/auth/vv/
├── VvAuthService.ts          # 认证服务（单例）
└── providers/
    └── VvAuthProvider.ts     # API 客户端

src/shared/
├── vv-crypto.ts              # PKCE 工具函数
└── storage/state-keys.ts     # 类型定义（VVUserInfo, VVUserConfig）

webview-ui/src/
├── hooks/useVvAuth.ts        # 认证 Hook
└── components/
    ├── onboarding/VvUsageGuideView.tsx
    └── settings/VvAccountInfoCard.tsx
```

---

## 开发环境

自动检测开发环境，使用本地 API：

```
API: http://127.0.0.1:5173/api
登录页: http://127.0.0.1:5173/oauth/vscode/login
```

触发条件：设置 `VV_API_BASE_URL` 环境变量。

回调 URI（固定）：`vscode://PiuQiuPiaQia.vvcode/vv-callback`

---

**最后更新**: 2025-12-20
