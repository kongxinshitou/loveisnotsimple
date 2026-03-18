# CLAUDE.md — 情话大师（ChatMaster）React Native 项目规范

## 项目简介

情话大师（ChatMaster）是一款 Android 端 React Native 应用。用户粘贴与女生的聊天记录，选择风格，调用 LLM API 获取多条高质量回复建议（含评分和策略解析）。无账号体系、无云存储、仅与 LLM API 通信。

---

## 技术栈约束

- **React Native CLI**（`npx react-native init`），禁止 Expo
- **TypeScript**（.tsx / .ts）
- **状态管理**：Zustand
- **导航**：@react-navigation/native + @react-navigation/native-stack
- **网络**：内置 fetch（不装 axios）
- **本地存储**：@react-native-async-storage/async-storage
- **剪贴板**：@react-native-clipboard/clipboard
- **图标**：react-native-vector-icons（MaterialCommunityIcons）
- **动画**：React Native 内置 Animated API
- **UI**：全部手写 StyleSheet，不引入任何第三方 UI 组件库（禁止 Paper/NativeBase/Elements）
- **平台**：仅 Android（minSdkVersion 24，targetSdkVersion 34）
- **RN 版本**：0.74.x

---

## Java / Android 构建环境配置

本机系统 Java 为 JDK 11，但 React Native 0.74 要求 JDK 17 编译。**不要修改系统 JAVA_HOME**，直接使用 Android Studio 内置的 JBR（JetBrains Runtime，JDK 17）。

### 具体操作（阶段1 初始化项目时必须执行）

1. **确认 Android Studio JBR 路径**
   - Windows 默认路径：`C:\Program Files\Android\Android Studio\jbr`
   - macOS 默认路径：`/Applications/Android Studio.app/Contents/jbr/Contents/Home`
   - 验证方法：该目录下应有 `bin/java`，执行 `<路径>/bin/java -version` 应输出 17.x

2. **在项目 `android/gradle.properties` 中添加一行**（项目级配置，不污染系统环境）：
   ```properties
   # 使用 Android Studio 自带的 JDK 17，不依赖系统 JAVA_HOME
   org.gradle.java.home=C:\\Program Files\\Android\\Android Studio\\jbr
   ```
   > macOS 写法：`org.gradle.java.home=/Applications/Android Studio.app/Contents/jbr/Contents/Home`

3. **验证**：在 `android/` 目录下执行 `./gradlew --version`，确认输出的 JVM 版本为 17.x

### 注意事项
- **禁止**将 JAVA_HOME 改为 JDK 17，系统其他项目仍依赖 Java 11
- **禁止**在 `android/gradle.properties` 之外的地方（如 `local.properties`、环境变量）配置 JDK 路径
- 如果 Claude Code 执行 `npx react-native run-android` 报 Java 版本错误，首先检查上述配置是否生效

---

## 目录结构

```
src/
├── screens/
│   ├── SplashScreen.tsx          # 首次启动引导页
│   ├── HomeScreen.tsx            # 主界面（输入+风格选择+结果展示）
│   ├── HistoryScreen.tsx         # 历史记录
│   └── SettingsScreen.tsx        # API配置+隐私清除
├── components/
│   ├── SuggestionCard.tsx        # 回复建议卡片（含复制按钮）
│   ├── StyleChip.tsx             # 单个风格标签
│   ├── StyleChipGroup.tsx        # 风格标签单选组
│   ├── ScoreStars.tsx            # 星级评分（1-5星）
│   ├── LoadingOverlay.tsx        # 加载遮罩（三点跳动动画）
│   ├── AnalysisHeader.tsx        # 对话分析摘要卡片
│   ├── HistoryItem.tsx           # 历史列表项（可展开）
│   ├── GradientButton.tsx        # 主操作按钮（按压缩放动画）
│   └── ConfirmModal.tsx          # 二次确认弹窗
├── services/
│   ├── llmClient.ts             # LLM API 调用（支持 Anthropic + OpenAI 兼容格式）
│   ├── promptBuilder.ts         # Prompt 构建（产品核心）
│   └── responseParser.ts        # LLM 返回文本正则解析 + 降级
├── store/
│   ├── useSettingsStore.ts      # API 配置持久化
│   └── useHistoryStore.ts       # 历史记录持久化
├── utils/
│   ├── chatParser.ts            # 聊天记录格式识别
│   └── clipboard.ts             # 剪贴板读写
├── theme/
│   └── colors.ts                # 色值常量
├── types/
│   └── index.ts                 # 全部 TS 类型
├── navigation/
│   └── AppNavigator.tsx         # 导航栈配置
└── App.tsx
```

---

## 类型定义（src/types/index.ts）

```typescript
export interface ChatMessage {
  role: 'me' | 'her' | 'unknown';
  content: string;
  timestamp?: string;
}

export type ReplyStyle = 'flirty' | 'humor' | 'affectionate' | 'high_value';

export interface Suggestion {
  index: number;
  replyText: string;
  styleTags: string[];
  score: number;           // 1-5
  analysis: string;
}

export interface AnalysisResult {
  overallAnalysis: string;
  suggestions: Suggestion[];
  rawText: string;          // 降级展示用
}

export interface HistoryEntry {
  id: string;
  chatPreview: string;      // 前50字
  fullChat: string;
  style: ReplyStyle;
  result: AnalysisResult;
  createdAt: number;
}

export interface ApiConfig {
  baseUrl: string;
  apiKey: string;
  model: string;
}

export type ApiFormat = 'anthropic' | 'openai_compatible';
```

---

## 色值（src/theme/colors.ts）

```typescript
const Colors = {
  bgPrimary: '#0D0D1A',
  bgSecondary: '#1A1A2E',
  bgCard: '#16213E',
  bgInput: '#0F3460',
  bgElevated: '#1E2A4A',
  accentPink: '#E94560',
  accentPurple: '#8B5CF6',
  accentGold: '#F59E0B',
  accentGreen: '#10B981',
  textPrimary: '#FFFFFF',
  textSecondary: '#A0AEC0',
  textMuted: '#4A5568',
  textDanger: '#EF4444',
  chipFlirty: '#E94560',
  chipHumor: '#F59E0B',
  chipAffectionate: '#EC4899',
  chipHighValue: '#8B5CF6',
  border: '#2D3748',
  divider: '#1E293B',
} as const;
export default Colors;
```

---

## 核心服务层规范

### promptBuilder.ts — 产品灵魂，最重要的文件

**System Prompt（原样写入，一字不改）：**

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

**User Prompt 模板：**

```
请分析以下聊天记录，并给出回复建议。

## 聊天记录
{chatContent}

## 要求
1. 先用2-3句话简要分析当前对话状态（她的兴趣度、对话温度、关键转折点）
2. 然后生成5条回复建议，风格偏向：{styleLabel}
3. 每条建议请严格按以下格式输出（方便程序解析，请勿修改格式标记）：

### 建议1
- 回复内容：{具体的回复文字}
- 风格标签：{如：幽默/挑逗/深情/高价值/推拉}
- 吸引力评分：{1-5}星
- 策略解析：{为什么这条回复有效，用了什么技巧}

### 建议2
...（以此类推到建议5）

## 风格说明
本次生成偏向「{styleLabel}」风格：{styleDescription}

## 额外规则
- 回复必须自然、口语化，像真人发微信一样
- 绝对不要出现"亲爱的"、"宝贝"等油腻称呼（除非对话已经非常亲密）
- 适当使用emoji但不要过多（最多1-2个）
- 如果聊天记录中有冷场迹象，优先建议如何破冰重启话题
- 请用中文回复
```

**四种风格映射：**

| key | label | description |
|-----|-------|-------------|
| flirty | 挑逗 | 大胆挑逗、充满性张力的暧昧风格，善用双关语和暗示，让女生脸红心跳 |
| humor | 幽默 | 轻松幽默、机智风趣的聊天风格，用笑点化解尴尬，在欢笑中拉近距离 |
| affectionate | 深情 | 温柔深情但不舔，用走心的表达触动她的内心，展现成熟男人的细腻 |
| high_value | 高价值 | 不经意间展现高价值的聊天风格，忙碌感、生活丰富、有选择权，让她主动追逐 |

---

### llmClient.ts — 双格式 API 调用

**格式判断规则：** baseUrl 包含 `anthropic` → Anthropic 格式，否则 → OpenAI 兼容格式。

**Anthropic 格式：**
```
POST {baseUrl}
Headers: x-api-key: {key}, anthropic-version: 2023-06-01, Content-Type: application/json
Body: { model, max_tokens: 2048, messages: [{ role: "user", content: systemPrompt + "\n\n" + userPrompt }] }
响应取值: data.content[0].text
```

**OpenAI 兼容格式：**
```
POST {baseUrl}/chat/completions   （baseUrl末尾自动去斜杠再拼接）
Headers: Authorization: Bearer {key}, Content-Type: application/json
Body: { model, max_tokens: 2048, temperature: 0.9, messages: [{ role: "system", content: systemPrompt }, { role: "user", content: userPrompt }] }
响应取值: data.choices[0].message.content
```

**超时：** 60秒，用 AbortController 实现。
**错误处理：** 所有错误 throw 中文 Error message（超时→"请求超时，请检查网络连接"，HTTP错误→`API请求失败(${status}): ${body前200字}`，空响应→"API返回内容为空"）。

**测试连接函数：** 发送"你好，请回复连接成功"，不抛异常即成功。

---

### responseParser.ts — 解析 + 降级

**核心原则：无论如何都要给用户展示内容，绝不白屏。**

解析逻辑：
1. 以 `### 建议1` 为分界，之前的内容（去掉标题行）为 overallAnalysis
2. 用 `rawText.split(/###\s*建议\s*(\d+)/)` 分割建议块
3. 每个块内用正则 `-\\s*{字段名}[：:]\\s*(.+?)(?=\\n-\\s|\\n###|$)` 提取字段
4. 评分提取数字，范围外默认3星
5. 风格标签按 `/、,，` 分割

**降级策略：** 如果 suggestions 数组为空，将整个 rawText 写入 overallAnalysis 直接展示。

---

### chatParser.ts — 聊天记录格式识别

支持三种常见格式：
1. 微信格式：`张三 2024/01/15 20:30\n消息内容`
2. 简单格式：`张三：消息内容` 或 `张三: 消息内容`
3. 时间戳格式：`[20:30] 张三: 消息内容`

识别出两个参与者后，提供选择"哪个是我"。如果无法识别（匹配率<30%），在 prompt 开头加提示"以下是原始聊天内容，请自行分辨双方角色"，原样发送。

---

## Store 规范

### useSettingsStore（Zustand + AsyncStorage 持久化）

- 默认值：baseUrl `https://api.anthropic.com/v1/messages`，apiKey 空，model `claude-sonnet-4-20250514`
- setConfig 时自动 saveConfig 到 AsyncStorage
- loadConfig 在 App 启动时调用
- clearAll 清除 AsyncStorage 所有数据并重置默认值

### useHistoryStore（Zustand + AsyncStorage 持久化）

- entries: HistoryEntry[] 按时间倒序
- addEntry 时裁剪至最多50条
- clearHistory 清空并删除 AsyncStorage key

两个 store 的 AsyncStorage key 分别为 `chatmaster_settings` 和 `chatmaster_history`。所有 AsyncStorage 操作必须 try-catch。

---

## 页面规范

### SplashScreen
- 深色全屏，居中 App 图标（渐变圆角方块 + chat 图标）、名称"情话大师"（28sp bold 白色）、slogan"让每一句话都充满暧昧张力"（14sp textSecondary）
- 隐私声明小字（12sp textMuted）："本应用不收集任何个人信息，聊天数据仅存储在您的设备本地。分析功能通过在线 AI 接口实时处理，不做云端留存。"
- 底部 GradientButton"开始使用"，点击写入 `hasLaunched` 标记并 replace 导航到 Home
- 非首次启动跳过此页（AppNavigator 的 initialRouteName 根据标记决定）

### HomeScreen（最重要的页面）
- ScrollView，背景 bgSecondary
- **自定义 Header**：左"情话大师"(20sp bold)，右侧历史图标+设置图标
- **输入卡片**（bgCard 圆角16）：多行 TextInput（高度≥160，bgInput 圆角12，白色文字，placeholder"将你和她的微信/QQ聊天记录粘贴到这里..."），底部"📎 从剪贴板粘贴"和"清空"按钮
- **风格选择**：StyleChipGroup 单选，四个选项 🔥挑逗(默认) 😏幽默 💗深情 👑高价值，选中态背景填充+scale 1.05动画，未选中态边框样式
- **分析按钮**：GradientButton"✨ 获取骚气回复"，胶囊形（圆角27），accentPink 背景色，按压 scale 0.96 弹簧动画，输入为空时 disabled opacity 0.5
- **加载态**：LoadingOverlay 半透明遮罩，三个 accentPink 圆点依次跳动（Animated.loop，每点延迟150ms，translateY 0→-12→0，400ms），文字"AI 正在为你生成最强回复..."
- **结果区域**（初始隐藏）：AnalysisHeader 卡片（📊对话分析 + 正文），下方 map 渲染 SuggestionCard，底部"💾 保存到本地"+"🔄 重新生成"按钮

### SuggestionCard 布局
```
┌──────────────────────────────────┐
│ #1                      ★★★★☆  │ ← 序号(accentPink bold) + ScoreStars
│──────────────────────────────────│
│ "回复内容文字"                    │ ← 16sp 白色 fontWeight 600
│ [幽默] [推拉]                    │ ← 药丸标签（对应色 opacity 0.2 背景）
│ 策略：解析文字...                 │ ← 13sp textSecondary
│                        [📋复制]  │ ← Clipboard.setString + ToastAndroid
└──────────────────────────────────┘
```
入场动画：fadeIn + translateY(30→0)，duration 400，delay = index * 150ms。

### HistoryScreen
- 导航标题"历史记录"，右侧"清空全部"(textDanger)
- FlatList<HistoryEntry> 倒序，HistoryItem 显示风格标签+时间+预览（numberOfLines 2）
- 点击展开/收起完整分析结果
- 空态："还没有分析记录\n去首页试试吧 ✨"
- 清空操作需 ConfirmModal 二次确认

### SettingsScreen
- **API配置卡片**：接口地址输入框(默认anthropic)、API密钥输入框(secureTextEntry+眼睛切换)、模型三选一(claude-sonnet-4-20250514推荐/deepseek-chat/自定义输入)、测试连接按钮
- **隐私安全卡片**：说明文字+"一键清除所有本地数据"红色按钮，ConfirmModal 确认后 AsyncStorage.clear()
- **关于卡片**：v1.0.0 + slogan

---

## 通用规范

- 所有文字硬编码中文，不做 i18n
- 错误提示全部中文，用 ToastAndroid.show 展示
- StatusBar：barStyle="light-content" backgroundColor={Colors.bgPrimary}
- 安卓返回键：HomeScreen 按返回退出 App，其他页面正常返回
- 圆角统一 16dp（卡片），标签药丸 12dp，按钮 12dp（方形）或 27dp（胶囊）
- 字号：标题 20sp bold，正文 16sp，次要 14sp，标签/小字 12-13sp
- 所有文件写中文注释说明功能

---

## 依赖清单

```json
{
  "dependencies": {
    "react": "18.2.0",
    "react-native": "0.74.5",
    "@react-navigation/native": "^6.1.18",
    "@react-navigation/native-stack": "^6.11.0",
    "@react-native-async-storage/async-storage": "^1.23.1",
    "@react-native-clipboard/clipboard": "^1.14.1",
    "react-native-vector-icons": "^10.1.0",
    "react-native-screens": "^3.34.0",
    "react-native-safe-area-context": "^4.10.9",
    "zustand": "^4.5.5"
  },
  "devDependencies": {
    "@types/react": "^18.2.0",
    "typescript": "^5.4.0"
  }
}
```

---

## 任务执行计划

按以下顺序实施，每个阶段完成后确认可编译运行再进入下一阶段：

**阶段1 — 项目骨架**
1. `npx react-native init ChatMaster --template react-native-template-typescript` 初始化项目
2. **配置 JDK 17**：在 `android/gradle.properties` 中添加 `org.gradle.java.home` 指向 Android Studio JBR 路径（参见上方"Java / Android 构建环境配置"章节），然后在 `android/` 目录执行 `./gradlew --version` 验证 JVM 为 17.x
3. 安装全部依赖
4. 配置 react-native-vector-icons（android/app/build.gradle 添加字体）
5. 创建完整 src/ 目录结构和所有空文件
6. 实现 colors.ts、types/index.ts
7. 实现 AppNavigator + 四个页面空壳
8. 确认 `npx react-native run-android` 可启动

**阶段2 — 服务层**
8. 实现 promptBuilder.ts（完整 prompt 模板，一字不改照搬上方内容）
9. 实现 llmClient.ts（双格式 fetch + 错误处理 + 测试连接）
10. 实现 responseParser.ts（正则解析 + 降级处理）
11. 实现 chatParser.ts
12. 实现 useSettingsStore.ts + useHistoryStore.ts

**阶段3 — 组件库**
13. 实现 GradientButton（按压动画）
14. 实现 StyleChip + StyleChipGroup
15. 实现 ScoreStars
16. 实现 SuggestionCard（含入场动画 + 复制）
17. 实现 AnalysisHeader
18. 实现 LoadingOverlay（三点跳动）
19. 实现 ConfirmModal
20. 实现 HistoryItem

**阶段4 — 页面集成**
21. 实现 SplashScreen（引导页 + 首次启动判断）
22. 实现 HomeScreen（输入→API调用→结果展示完整流程）
23. 实现 SettingsScreen（API配置 + 测试 + 清除）
24. 实现 HistoryScreen（列表 + 展开 + 清空）

**阶段5 — 打磨**
25. 所有动画效果确认
26. 边界情况（空输入/无网络/API报错/解析失败）
27. 视觉走查：间距、字号、颜色统一性
28. 安卓返回键 + StatusBar 行为

---

## 验收标准

- [ ] `npx react-native run-android` 编译运行无报错
- [ ] 首次启动→引导页→点击进入主页；再次启动直接进主页
- [ ] 设置页配置 API Key 后，主页粘贴聊天记录+选风格+点击分析→正常返回结果
- [ ] 结果展示：分析摘要 + 5张建议卡片（含评分/标签/策略），有入场动画
- [ ] 复制按钮正常（ToastAndroid 提示）
- [ ] 保存到本地→历史页可见→点击展开详情
- [ ] 一键清除→确认弹窗→清除后历史为空、设置重置
- [ ] 加载中有三点跳动动画
- [ ] API 报错/超时/空输入等全部有中文 Toast 提示，无崩溃
- [ ] 所有文件有中文注释
