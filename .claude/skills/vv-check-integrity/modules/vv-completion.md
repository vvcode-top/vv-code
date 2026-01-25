# 代码补全系统

**模块ID**: vv-completion  
**关键性**: ⚠️ Critical  
**描述**: 提供FIM模型的智能代码补全功能，支持流式生成、多种过滤策略

---

## 核心组件

### VvCompletionProvider
📁 `src/hosts/vscode/completion/VvCompletionProvider.ts`

VSCode内联代码补全提供器，实现 `InlineCompletionItemProvider` 接口。

**必须包含的方法和类**:
- `class VvCompletionProvider` - 补全提供器主类
- `provideInlineCompletionItems` - 提供补全建议
- `acceptCompletion` - 接受补全（用于统计和日志）

### VvCompletionStreamer
📁 `src/hosts/vscode/completion/vvCompletionStreamer.ts`

负责流式生成补全内容，支持实时过滤和处理。

**必须包含**:
- `class VvCompletionStreamer` - 流式处理类
- `streamCompletionWithFilters` - 带过滤器的流式补全
- `streamFim` - FIM模型流式请求

### 模板管理
📁 `src/hosts/vscode/completion/vvAutocompleteTemplate.ts`

管理不同模型的FIM提示模板（prefix、suffix格式）。

**必须包含**:
- `getTemplateForModel` - 获取模型对应的模板
- `AutocompleteTemplate` - 模板接口/类型

### 辅助变量
📁 `src/hosts/vscode/completion/vvHelperVars.ts`

准备补全所需的上下文变量（修剪后的前缀、后缀等）。

**必须包含**:
- `class VvHelperVars` - 辅助变量类
- `create` - 创建辅助变量实例
- `prunedPrefix` - 修剪后的前缀
- `prunedSuffix` - 修剪后的后缀

---

## 补全处理

### 单行补全处理
📁 `src/hosts/vscode/completion/processSingleLineCompletion.ts`

处理单行补全的特殊逻辑（截断、格式化等）。

**必须包含**:
- `processSingleLineCompletion` - 处理函数
- `SingleLineCompletionResult` - 结果类型

### 多行补全判断
📁 `src/hosts/vscode/completion/multiline.ts`

判断何时应该使用多行补全模式。

**必须包含**:
- `shouldCompleteMultiline` - 判断函数
- `MultilineCompletionMode` - 多行模式类型

---

## 过滤系统

### 预过滤
📁 `src/hosts/vscode/completion/prefiltering.ts`

在请求补全之前判断是否应该跳过（节省请求）。

**必须包含**:
- `shouldSkipCompletion` - 判断是否跳过补全

### 后处理过滤
📁 `src/hosts/vscode/completion/filters.ts`

对生成的补全内容进行后处理和清理。

**必须包含**:
- `postprocessCompletion` - 后处理函数
- `isBlank` - 判断是否为空
- `removeBackticks` - 移除反引号

---

## 流式过滤器

位于 `src/hosts/vscode/completion/streamFilters/` 目录：

- **VvStreamTransformPipeline.ts** - 流式转换管道
- **charStream.ts** - 字符级流处理
- **lineStream.ts** - 行级流处理

这些过滤器在流式生成过程中实时处理补全内容。

---

## Controller层

位于 `src/core/controller/vvCompletion/` 目录：

- **vvUpdateCompletionSettings.ts** - 更新补全设置
- **vvGetCompletionSettings.ts** - 获取补全设置

---

## Protobuf定义

📁 `proto/cline/vv_completion.proto`

定义补全相关的gRPC服务和消息类型。

**必须包含**:
- `service VvCompletionService` - gRPC服务定义
- `message VvCompletionSettings` - 补全设置消息

---

## 扩展注册

📁 `src/extension.ts`

扩展激活时必须注册补全提供器和相关命令。

**必须包含**:
- `VvCompletionProvider` - 导入补全提供器
- `registerInlineCompletionItemProvider` - 注册补全提供器
- `vv.acceptCompletion` - 注册接受补全命令

---

## 功能说明

### FIM 模型支持

FIM (Fill-In-the-Middle) 模型需要特殊的提示格式：
- **Prefix** - 光标前的代码
- **Suffix** - 光标后的代码
- **Middle** - 模型需要生成的部分

不同模型有不同的提示模板（Qwen、DeepSeek、CodeLlama等）。

### 补全流程

```
触发补全请求
    ↓
prefiltering (是否跳过?)
    ↓
VvHelperVars (准备上下文)
    ↓
判断单行/多行模式
    ↓
VvCompletionStreamer (流式生成)
    ↓
流式过滤器 (实时处理)
    ↓
postprocessCompletion (后处理)
    ↓
显示补全建议
    ↓
用户接受 → acceptCompletion (统计)
```

### 过滤策略

1. **预过滤**：
   - 在注释中跳过
   - 在字符串中跳过（可配置）
   - 输入速度过快时跳过

2. **流式过滤**：
   - 字符级过滤（非法字符）
   - 行级过滤（重复行、无效行）

3. **后处理**：
   - 移除多余的反引号
   - 修剪空白
   - 单行补全截断

### 配置选项

- 启用/禁用补全
- 选择FIM模型
- 单行/多行模式
- 延迟时间
- 过滤策略开关

---

## 依赖关系

- **依赖 VvAuthService** - 获取分组Token
- **依赖 VvGroupConfig** - 使用分组配置的模型
- **使用 VSCode API** - `InlineCompletionItemProvider`
