# Cline 开发指令：情话大师（ChatMaster）Android App

## 项目概述

请使用 **Android Studio + Java 8** 开发一个名为"情话大师（ChatMaster）"的 Android 原生应用。这是一个帮助男性用户优化与女性聊天回复的工具App，核心逻辑是：用户粘贴聊天记录 → 调用 LLM API 分析 → 返回多条高质量回复建议。

**技术栈硬性要求：**
- 语言：Java 8（不要用 Kotlin）
- 最低 SDK：API 24 (Android 7.0)
- 目标 SDK：API 34
- 构建工具：Gradle（Groovy DSL，不要用 kts）
- 网络库：OkHttp3
- JSON 解析：Gson
- 本地存储：SharedPreferences + SQLite（Room 可选）
- UI：Material Design 3（MaterialComponents 主题）
- 不使用任何 Jetpack Compose，全部用传统 XML 布局

---

## 项目结构

```
com.chatmaster.app/
├── activity/
│   ├── SplashActivity.java          // 启动页（隐私声明 + 简介）
│   ├── MainActivity.java            // 主界面（聊天导入 + 分析）
│   ├── HistoryActivity.java         // 本地历史记录列表
│   └── SettingsActivity.java        // 设置页（API配置、清除数据）
├── adapter/
│   ├── SuggestionAdapter.java       // 回复建议列表适配器
│   └── HistoryAdapter.java          // 历史记录列表适配器
├── model/
│   ├── ChatMessage.java             // 单条聊天消息（角色+内容）
│   ├── Suggestion.java              // AI回复建议（内容+标签+评分）
│   ├── AnalysisResult.java          // 一次完整分析结果
│   └── ConversationHistory.java     // 历史记录条目
├── network/
│   ├── LLMApiClient.java           // LLM API 调用封装
│   ├── ApiConfig.java              // API 配置（baseUrl, apiKey, model）
│   └── PromptBuilder.java          // Prompt 模板构建器（核心）
├── db/
│   ├── AppDatabase.java            // SQLite 数据库 Helper
│   └── HistoryDao.java             // 历史记录 CRUD
├── util/
│   ├── ChatParser.java             // 聊天记录解析器（识别双方角色）
│   ├── ClipboardHelper.java        // 剪贴板读取工具
│   └── PrivacyManager.java         // 一键清除所有数据
└── ChatMasterApp.java              // Application 类
```

---

## 各页面详细需求

### 1. SplashActivity（启动页）

- 全屏深色背景，居中显示 App 名称"情话大师"和一行 Slogan："让每一句话都充满暧昧张力"
- 下方显示隐私声明摘要文字（白色小字）：
  > "本应用不收集任何个人信息，聊天数据仅存储在您的设备本地。分析功能通过在线 AI 接口实时处理，不做云端留存。"
- 底部一个按钮"开始使用"，点击后跳转 MainActivity
- 使用 SharedPreferences 记录是否首次启动，非首次启动时自动跳过（延迟1秒直接进 MainActivity）

### 2. MainActivity（核心主界面）

这是 App 最重要的页面，布局从上到下依次为：

#### 2.1 顶部 Toolbar
- 标题"情话大师"
- 右侧两个图标按钮：历史记录（跳转 HistoryActivity）、设置（跳转 SettingsActivity）

#### 2.2 聊天输入区域
- 一个大的 `TextInputEditText`（多行，带 hint："粘贴你和她的聊天记录..."），高度至少150dp
- 输入框下方一行操作：
  - 左侧按钮"从剪贴板粘贴"（一键读取剪贴板内容填入）
  - 右侧按钮"清空"

#### 2.3 风格选择区域
- 一行横向排列的 `Chip` 组（单选 ChipGroup），选项为：
  - 🔥 挑逗（默认选中）
  - 😏 幽默
  - 💗 深情
  - 👑 高价值
- 每个 Chip 使用不同的颜色主题

#### 2.4 分析按钮
- 一个醒目的大按钮"✨ 获取骚气回复"，Material Button，圆角，渐变色背景（红→紫）
- 点击后：
  1. 校验输入不为空
  2. 显示加载动画（用 ProgressBar + "AI正在为你生成最强回复..."文字）
  3. 调用 LLM API
  4. 成功后在下方展示结果

#### 2.5 结果展示区域（初始隐藏，分析完成后显示）
- 顶部一个"对话分析"卡片（CardView），显示 AI 对当前聊天的简要分析（2-3句话）
- 下方是 RecyclerView，每个 item 是一个建议卡片，包含：
  - 建议序号（如 #1、#2）
  - 建议的回复文本（大字加粗）
  - 标签行（如"性感🔥"、"幽默😏"、"推动升级⬆️"）
  - 吸引力评分（5星制，用自定义 View 或简单 TextView 表示如 ★★★★☆）
  - 一行点评文字（AI 解释为什么这条回复有效）
  - 右下角"复制"按钮（点击复制该条建议到剪贴板，Toast 提示"已复制"）
- 结果底部一个按钮"保存到本地"（将本次分析结果存入 SQLite）

---

### 3. HistoryActivity（历史记录）

- Toolbar 标题"历史记录"，带返回箭头
- RecyclerView 列表，每个 item 显示：
  - 时间戳
  - 聊天片段前30字预览
  - 风格标签
- 点击某条记录，弹出 BottomSheetDialog 展示完整的分析结果
- Toolbar 右侧"清空全部"按钮，弹出确认对话框后删除所有记录

### 4. SettingsActivity（设置页）

- **API 配置区域（CardView）**：
  - API Base URL 输入框（默认值 `https://api.anthropic.com/v1/messages`）
  - API Key 输入框（密码模式，带显示/隐藏切换）
  - 模型选择下拉框（Spinner），预设选项：
    - `claude-sonnet-4-20250514`（默认）
    - `deepseek-chat`
    - `自定义`（选择后弹出输入框）
  - "测试连接"按钮（发送一个简单请求验证 API 可用）
- **隐私安全区域（CardView）**：
  - "一键清除所有本地数据"红色按钮，二次确认后清除 SharedPreferences + SQLite 全部数据
  - 说明文字"清除后所有聊天记录与分析历史将永久删除，不可恢复"
- **关于区域**：
  - 版本号 v1.0.0
  - 简短说明文字

---

## 网络层实现细节

### LLMApiClient.java

使用 OkHttp3 实现，需要支持两种 API 格式：

#### Anthropic Claude 格式：
```java
// POST https://api.anthropic.com/v1/messages
// Headers:
//   x-api-key: {apiKey}
//   anthropic-version: 2023-06-01
//   content-type: application/json
// Body:
{
  "model": "claude-sonnet-4-20250514",
  "max_tokens": 2048,
  "messages": [
    {"role": "user", "content": "{构建好的prompt}"}
  ]
}
```

#### OpenAI 兼容格式（DeepSeek 等）：
```java
// POST {baseUrl}/chat/completions
// Headers:
//   Authorization: Bearer {apiKey}
//   content-type: application/json
// Body:
{
  "model": "deepseek-chat",
  "messages": [
    {"role": "system", "content": "{system prompt}"},
    {"role": "user", "content": "{用户prompt}"}
  ],
  "max_tokens": 2048,
  "temperature": 0.9
}
```

**关键实现要求：**
- 根据 baseUrl 自动判断使用哪种格式（包含 `anthropic` 则用 Claude 格式，否则用 OpenAI 格式）
- 异步请求，使用 OkHttp 的 `enqueue` 方法
- 通过回调接口返回结果到 UI 线程（使用 `runOnUiThread`）
- 超时设置：连接30秒，读取60秒
- 错误处理：网络错误、API 错误、JSON 解析错误都要有明确的中文错误提示

### PromptBuilder.java（最核心的文件）

这是整个产品的灵魂。请实现以下 prompt 构建逻辑：

```java
public class PromptBuilder {

    /**
     * 构建发送给 LLM 的完整 prompt
     * @param chatContent 用户粘贴的原始聊天记录
     * @param style 选择的风格：flirty / humor / affectionate / high_value
     * @return 完整的 prompt 字符串
     */
    public static String buildAnalysisPrompt(String chatContent, String style) {
        // 实现如下
    }

    // System Prompt（用于 OpenAI 兼容格式）
    public static String getSystemPrompt() {
        return "你是一位顶级两性沟通专家和情话大师..."  // 见下方完整内容
    }
}
```

**System Prompt 完整内容（请原样写入代码）：**

```
你是一位顶级两性沟通专家和情话大师，专门帮助男性在与女性的聊天中展现最大魅力。你精通：
- 推拉技巧（Push-Pull）：在吸引和疏离间制造张力
- 幽默调情：用轻松有趣的方式制造暧昧氛围
- DHV（展示高价值）：不经意间展现自身吸引力
- 框架控制：始终保持男性主导的对话框架
- 情绪价值提供：让女生在对话中感受到愉悦和心动

你的回复风格特点：
1. 永远不做舔狗——不过度讨好、不卑微、不跪舔
2. 自信但不自大，骚气但不低俗
3. 善用暧昧暗示，让女生自己"想歪"
4. 适时展现脆弱面，增加真实感
5. 懂得适可而止，不过度纠缠
```

**User Prompt 模板（根据风格动态拼接）：**

```
请分析以下聊天记录，并给出回复建议。

## 聊天记录
{chatContent}

## 要求
1. 先用2-3句话简要分析当前对话状态（她的兴趣度、对话温度、关键转折点）
2. 然后生成5条回复建议，风格偏向：{styleDescription}
3. 每条建议请按以下格式输出：

### 建议{N}
- 回复内容：{具体的回复文字}
- 风格标签：{如：幽默/挑逗/深情/高价值/推拉}
- 吸引力评分：{1-5星}
- 策略解析：{为什么这条回复有效，用了什么技巧}

## 风格说明
{styleDescription详细说明}

## 额外规则
- 回复必须自然、口语化，像真人发微信一样
- 绝对不要出现"亲爱的"、"宝贝"等油腻称呼（除非对话已经非常亲密）
- 适当使用emoji但不要过多（最多1-2个）
- 如果聊天记录中有冷场迹象，优先建议如何破冰重启话题
- 请用中文回复
```

**风格描述映射：**
- `flirty`（挑逗）："大胆挑逗、充满性张力的暧昧风格，善用双关语和暗示，让女生脸红心跳"
- `humor`（幽默）："轻松幽默、机智风趣的聊天风格，用笑点化解尴尬，在欢笑中拉近距离"
- `affectionate`（深情）："温柔深情但不舔，用走心的表达触动她的内心，展现成熟男人的细腻"
- `high_value`（高价值）："不经意间展现高价值的聊天风格，忙碌感、生活丰富、有选择权，让她主动追逐"

### ChatParser.java

解析用户粘贴的聊天记录，需要支持常见的微信/QQ复制格式：

```
常见格式1（微信）：
张三 2024/01/15 20:30
你好呀
李四 2024/01/15 20:31
嗨～

常见格式2：
张三：你好呀
李四：嗨～

常见格式3（时间戳格式）：
[20:30] 张三: 你好呀
[20:31] 李四: 嗨～
```

解析逻辑：
- 识别出对话中的两个角色名
- 让用户确认哪个是自己（弹出简单选择对话框）
- 将角色标记为"我"和"她"
- 如果无法识别格式，就原样保留，在 prompt 中说明"以下是原始聊天内容，请自行分辨双方角色"

---

## LLM 返回结果解析

AI 返回的是自然语言文本，需要用正则解析。在 `AnalysisResult` 中实现解析方法：

```java
public class AnalysisResult {
    private String overallAnalysis;     // 总体分析
    private List<Suggestion> suggestions; // 建议列表

    /**
     * 从 LLM 返回的原始文本中解析结果
     * 如果正则解析失败，就把整段文本作为 overallAnalysis 展示
     * 不要因为解析失败就不显示内容
     */
    public static AnalysisResult parseFromLLMResponse(String rawText) {
        // 用正则匹配 "### 建议{N}" 分段
        // 匹配 "回复内容：" "风格标签：" "吸引力评分：" "策略解析："
        // 容错处理：匹配不到就降级为纯文本展示
    }
}
```

---

## UI 设计规范

### 整体风格
- **暗色主题为主**（Dark Theme），营造私密高级感
- 主色调：深紫 `#1A1A2E` 作为背景
- 强调色：渐变红紫 `#E94560` → `#8B5CF6`
- 卡片背景：`#16213E` 或 `#0F3460`
- 文字颜色：主文字 `#FFFFFF`，次要文字 `#A0AEC0`
- 圆角统一 16dp

### 字体大小
- 标题：20sp bold
- 回复建议正文：16sp
- 标签/点评：13sp
- 评分星星：16sp

### 动画
- 分析按钮点击后有一个简单的脉冲动画
- 结果卡片使用 `ItemAnimator` 做淡入效果
- 加载时用一个自定义 loading 动画（3个点循环跳动即可）

---

## SQLite 数据库设计

```sql
CREATE TABLE analysis_history (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    chat_preview TEXT NOT NULL,         -- 聊天记录前50字
    full_chat TEXT NOT NULL,            -- 完整聊天记录
    style TEXT NOT NULL,                -- 选择的风格
    analysis_text TEXT NOT NULL,        -- 总体分析
    suggestions_json TEXT NOT NULL,     -- 建议列表的 JSON 序列化
    created_at INTEGER NOT NULL         -- 时间戳
);
```

---

## 关键实现注意事项

1. **不要用 Kotlin**，全部 Java 8 实现
2. **不要用 Jetpack Compose**，全部 XML 布局
3. **不要用 Retrofit**，用 OkHttp3 直接实现就好，项目简单不需要 Retrofit
4. **Gradle 用 Groovy DSL**（build.gradle 不要用 .kts）
5. **AndroidManifest 只需要声明 INTERNET 权限**
6. **所有字符串硬编码在代码中即可**，不需要做 strings.xml 国际化（这是中文 App）
7. **不需要单元测试**，能跑起来就行
8. **API Key 存储在 SharedPreferences 中**，用户在设置页手动输入
9. **错误提示全部用中文**
10. **compileSdk 和 targetSdk 用 34**

## 依赖列表（build.gradle）

```groovy
dependencies {
    implementation 'androidx.appcompat:appcompat:1.6.1'
    implementation 'com.google.android.material:material:1.11.0'
    implementation 'androidx.constraintlayout:constraintlayout:2.1.4'
    implementation 'com.squareup.okhttp3:okhttp:4.12.0'
    implementation 'com.google.code.gson:gson:2.10.1'
}
```

---

## 开发顺序（请严格按此顺序实现）

### Phase 1：项目骨架
1. 创建 Android 项目，配置 build.gradle 和依赖
2. 创建所有 Activity、Model、工具类的空壳
3. 配置 AndroidManifest（声明所有 Activity + INTERNET 权限）
4. 创建暗色主题 styles.xml

### Phase 2：核心网络层
5. 实现 ApiConfig（SharedPreferences 读写 API 配置）
6. 实现 PromptBuilder（完整的 prompt 模板）
7. 实现 LLMApiClient（OkHttp 异步请求，支持双格式）
8. 实现 AnalysisResult 解析逻辑

### Phase 3：主界面
9. 实现 MainActivity 布局（XML）
10. 实现聊天输入、风格选择、发送分析的完整流程
11. 实现 SuggestionAdapter 和结果展示
12. 实现复制到剪贴板功能

### Phase 4：辅助页面
13. 实现 SplashActivity（启动页 + 首次引导）
14. 实现 SettingsActivity（API 配置 + 数据清除）
15. 实现 SQLite 数据库和历史记录功能
16. 实现 HistoryActivity

### Phase 5：打磨
17. 添加加载动画
18. 错误处理和边界情况
19. UI 细节调整

---

## 最终交付要求

- 项目可以直接在 Android Studio 中 Build 成功
- 用户安装后首先看到启动页，点击进入主界面
- 在设置中配置 API Key 后，粘贴聊天记录即可获得分析
- 所有功能可正常使用，无崩溃
- 代码结构清晰，每个文件都有必要的中文注释

请现在开始按顺序实现，每完成一个 Phase 后告诉我进度。
