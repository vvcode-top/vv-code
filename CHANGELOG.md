# VVCode Changelog

## [1.2.2] - 2026-01-15

### Added
- 支持公告功能

## [1.2.0] - 2026-01-13

### Changed
- 合并上游 Cline v3.49.0

## [1.1.5] - 2025-01-11

### Fixed
- 修复登录后偶发显示"创建分组以开始使用"的时序问题
- 修复重启后分组配置未及时同步到 WebView 的问题

### Changed
- 优化分组配置加载逻辑，WebView 主动请求刷新而非依赖定时器

## [1.1.4] - 2025-01-10

### Added
- 新增备用登录功能（本地回环），解决部分 Windows 用户无法通过 URI Handler 完成登录的问题

### Fixed
- 修复初始化登录时拉取 token 的问题

## [1.1.3] - 2025-01-10

### Changed
- 优化 read_file 工具名称显示

## [1.1.1] - 2025-12-31

### Changed
- 增加代码行内补全功能（beta），需手动开启

### Fixed
- 刷新分组后，保持原有的分组选择

## [1.0.11] - 2025-12-28

### Changed
- 强化选中代码到输入框的交互

## [1.0.10] - 2025-12-26

### Changed
- 重构认证回调 URL 生成逻辑，使用 HostProvider 动态获取

## [1.0.9] - 2025-12-26

### Changed
- 更新欢迎页面公告内容
- 同步上游 Cline v3.46.0 更新

### Fixed
- 修复 vite base path 配置

## [1.0.7] - 2025-12-24

### Fixed
- 修复打包后插件无法获取分组配置的问题
- 修复环境检测逻辑，确保生产环境使用正确的 API 地址

### Changed
- 优化欢迎页面 Logo 样式
- 简化快速开始页面设计
- 更新活动栏图标
- 更新版本提示消息名称为 VVCode

## [1.0.6] - 2025-12-22

### Changed
- 更新系统提示词配置
- 优化各模型变体的agent角色定义
- 更新README文档
- 更新语言配置

## [1.0.2] - 2024-12-22

### Fixed
- 重新登录时重置 API 配置，确保使用最新服务器配置
- 设置 anthropicBaseUrl 默认值为 vvcode.top，解决 baseUrl 未生效问题

## [1.0.1] - 2024-12-21

### Fixed
- 将 vvcode.top API 请求改为 HTTPS

### Changed
- 更新 biome 配置和修复生产环境构建

## [1.0.0] - 2024-12-20

### Added
- VVCode 账户认证系统（OAuth2 + PKCE）
- 分组切换功能，支持多个 API 配置组
- 自动配置 API Key 和 Base URL
- 欢迎页面和设置页面集成

### Changed
- 基于 Cline 3.45.0 进行二次开发
- 品牌标识更换为 VVCode
- 默认 API 地址指向 vvcode.top

---

