# Claude Code 开发指令：情话大师（ChatMaster）Flutter App

---

## 【你的角色】

你是一名资深 Flutter 工程师，精通 Dart、Flutter Material 3、Riverpod 状态管理和本地数据持久化。请严格按照本文档要求，在当前工作目录中从零搭建"情话大师（ChatMaster）"Flutter App，目标平台为 **Android**（兼容 iOS 结构但不强制测试）。

**工作方式**：每完成一个 Step，输出该 Step 创建/修改的文件列表，并等待我确认后继续下一步。遇到任何不确定的地方，先问我再动手。

---

## 【硬性技术约束 - 必须遵守】

| 项目 | 要求 |
|------|------|
| 框架 | Flutter（最新稳定版） |
| 语言 | Dart（null safety 开启） |
| 状态管理 | **Riverpod 2.x**（`flutter_riverpod`） |
| 本地数据库 | **Isar** 或 **sqflite + sqflite_ffi**（二选一，优先 Isar） |
| 路由 | **go_router** |
| UI 规范 | Material Design 3（`useMaterial3: true`） |
| 联网 | **严格禁止**，不添加任何网络请求代码，不申请 INTERNET 权限 |
| 目标平台 | Android（minSdkVersion 21） |
| 代码风格 | 每个文件不超过 300 行，超长则拆分 |

---

## 【依赖清单 pubspec.yaml】

```yaml
name: chat_master
description: 情话大师 - 纯离线聊天能力提升助手
version: 1.0.0+1

environment:
  sdk: '>=3.0.0 <4.0.0'

dependencies:
  flutter:
    sdk: flutter

  # 状态管理
  flutter_riverpod: ^2.4.9
  riverpod_annotation: ^2.3.3

  # 本地数据库
  isar: ^3.1.0
  isar_flutter_libs: ^3.1.0
  path_provider: ^2.1.2

  # 路由
  go_router: ^13.2.0

  # UI 组件
  fl_chart: ^0.66.2          # 折线趋势图
  google_fonts: ^6.1.0        # 字体
  flutter_animate: ^4.5.0    # 动画

  # 工具
  shared_preferences: ^2.2.2  # 主题设置持久化
  uuid: ^4.3.3                # 生成唯一 ID
  intl: ^0.19.0               # 日期格式化

dev_dependencies:
  flutter_test:
    sdk: flutter
  flutter_lints: ^3.0.0
  build_runner: ^2.4.8
  isar_generator: ^3.1.0
  riverpod_generator: ^2.3.9
  custom_lint: ^0.6.4
  riverpod_lint: ^2.3.7
```

---

## 【项目目录结构】

请严格按照以下结构创建所有文件：

```
lib/
├── main.dart                          # App 入口
├── app.dart                           # MaterialApp + 主题配置
├── router.dart                        # go_router 路由配置
│
├── core/
│   ├── theme/
│   │   ├── app_theme.dart             # 亮色/暗色主题定义
│   │   └── app_colors.dart            # 颜色常量
│   └── utils/
│       ├── date_formatter.dart        # 日期格式化工具
│       └── score_color.dart           # 分数对应颜色工具
│
├── data/
│   ├── models/
│   │   ├── analysis_record.dart       # Isar 实体：分析记录
│   │   ├── analysis_record.g.dart     # (自动生成)
│   │   ├── mistake_item.dart          # Isar 实体：错题本条目
│   │   └── mistake_item.g.dart        # (自动生成)
│   ├── repositories/
│   │   ├── analysis_repository.dart   # 分析记录 CRUD
│   │   └── mistake_repository.dart    # 错题本 CRUD
│   └── local/
│       └── database_provider.dart     # Isar 数据库初始化 Provider
│
├── engine/
│   ├── analysis_engine.dart           # 本地分析核心引擎
│   ├── rules_loader.dart              # 从 assets 加载 JSON 规则库
│   └── models/
│       ├── analysis_result.dart       # 分析结果数据类
│       ├── chat_message.dart          # 单条消息数据类
│       └── suggestion_item.dart       # 回复建议数据类
│
├── features/
│   ├── analysis/
│   │   ├── analysis_page.dart         # 聊天分析页面
│   │   ├── analysis_provider.dart     # 分析页 Riverpod Provider
│   │   └── widgets/
│   │       ├── emotion_card.dart      # 女生情绪展示卡片
│   │       ├── score_ring.dart        # 吸引力分圆环
│   │       ├── highlight_chips.dart   # 亮点 Chip 列表
│   │       ├── danger_chips.dart      # 雷区 Chip 列表
│   │       └── suggestion_list.dart   # 回复建议列表
│   │
│   ├── review/
│   │   ├── review_page.dart           # 复盘列表页
│   │   ├── review_detail_page.dart    # 复盘详情页
│   │   ├── review_provider.dart       # 复盘页 Provider
│   │   └── widgets/
│   │       ├── record_list_item.dart  # 历史记录列表 Item
│   │       └── trend_chart.dart       # 折线趋势图
│   │
│   ├── mistake/
│   │   ├── mistake_page.dart          # 错题本页面
│   │   ├── mistake_provider.dart      # 错题本 Provider
│   │   └── widgets/
│   │       └── mistake_list_item.dart # 错题条目 Item
│   │
│   └── settings/
│       ├── settings_page.dart         # 设置页面
│       └── settings_provider.dart     # 主题设置 Provider
│
assets/
└── rules.json                         # 本地规则库（话术建议 + 关键词）
```

---

## 【模块一：assets/rules.json 内容】

在 `assets/rules.json` 中写入以下完整内容（同时在 `pubspec.yaml` 的 flutter.assets 中注册）：

```json
{
  "low_value_keywords": [
    "随便", "都行", "你说吧", "无所谓", "算了", "不用了", "哦", "嗯嗯",
    "好的好的", "我不知道", "看你", "你决定", "挺好的", "还行吧", "没事", "算了算了"
  ],
  "high_value_keywords": [
    "哈哈", "你这个人", "我刚好", "说起来", "我有个想法", "你知道吗",
    "这让我想到", "我最近", "有意思", "对了", "说真的", "你不一样", "我猜你"
  ],
  "positive_emotion_keywords": ["哈哈", "嘻嘻", "好呀", "太好了", "真的吗", "!", "！", "好期待", "想", "😊", "❤"],
  "cold_emotion_keywords": ["哦", "嗯", "好", "知道了", "行", "随便", "算了", "没关系", "…", "。。。"],
  "suggestions": {
    "humor": [
      "哈，说起来我今天遇到一件特别离谱的事，你猜猜是什么？",
      "你这么说让我突然想起一个很蠢的段子，要听吗？",
      "算了算了，我承认，你比我想象的还要有趣。",
      "好家伙，你这话让我一时语塞，给你满分。",
      "我本来想装高冷的，结果你这一句话让我直接破功。",
      "行，你赢了这一局，但下一局我不客气。",
      "你这人说话怎么这么有意思，我要记下来研究研究。",
      "感觉和你聊天要准备好笑肌，不然要拉伤。",
      "好，这个话题我接了，但我先声明我可能会偏题。",
      "你是专门训练过说这种话的吗，还是天生的？",
      "行吧，你这个理由我勉强接受，但我保留追究权。",
      "我突然觉得和你聊天是一项需要技术含量的运动。",
      "你知道吗，我刚刚差点被你这话噎住。",
      "好了好了，你说什么都有道理，我举手投降。",
      "哎，你这么说我突然有种被看穿的感觉。"
    ],
    "flirty": [
      "说真的，你这样说话让我很难不多想一点。",
      "你知道你笑起来的时候特别有感染力吗？",
      "我刚才看到你发的这句话，想了好一会儿才回。",
      "你这个人，总是能在意想不到的地方戳到我。",
      "和你聊天会上瘾，这是一个警告，也是一个事实。",
      "不知道为什么，你发来的消息我总是第一眼就想点开。",
      "你这句话让我觉得，今天剩下的时间都有点期待了。",
      "说起来，你有没有发现我们聊天好像总有说不完的话？",
      "你今天这个状态，特别让人想多聊几句。",
      "我在想，如果是面对面说这句话，会是什么感觉。",
      "你有一种让人不自觉想靠近的气质，不知道你发现了吗。",
      "我承认，你发的这个让我多回看了两遍。",
      "和你说话的时候，时间过得特别快，是个危险信号。",
      "你说这句话的语气，让我脑补了好几个版本。",
      "我本来想保持点距离感的，结果被你这话瞬间打破。"
    ],
    "sincere": [
      "说真的，你刚才说的那个点让我挺有感触的。",
      "我觉得你理解这件事的角度挺特别的，和大多数人不一样。",
      "你有没有想过，你其实比自己认为的更有意思？",
      "我挺喜欢和你聊这类话题，感觉很真实。",
      "这件事我没有和很多人说过，你是少数我觉得值得分享的人。",
      "你刚才那句话，让我觉得你是一个挺细腻的人。",
      "说起来，我记得你之前提到过这个，你果然是认真想过的。",
      "和你聊天让我觉得有种被好好听见的感觉。",
      "你对这件事的看法，让我重新想了一遍我自己的判断。",
      "我很少遇到能聊这种话题的人，你是其中之一。",
      "你身上有一种让人觉得踏实的感觉，很难得。",
      "我注意到你说话的时候总是很真诚，这让人很放松。",
      "谢谢你今天分享了这些，我觉得了解了你更多一点。",
      "你说的这个我完全能理解，因为我有过类似的感受。",
      "其实我一直想说，和你聊天是我最近比较期待的事情之一。"
    ],
    "high_value": [
      "我最近在做一件挺有意思的事，改天有机会和你讲。",
      "这让我想到上次我去的那个地方，体验完全不一样。",
      "说起来，我对这件事有自己的判断，你想听听吗？",
      "我一般不太随便给建议，但你这个情况我可以说两句。",
      "我刚从一个很不错的地方回来，有种说不清的感觉。",
      "你有没有试过从另一个角度去看这件事？我觉得会不一样。",
      "我做决定的时候一般不太纠结，这件事我想清楚了。",
      "你说的这个我恰好有点了解，但我的经历可能更特别一点。",
      "我不太喜欢凑热闹，所以我的选择一般和大多数人不一样。",
      "这件事其实没那么复杂，我来给你拆解一下。",
      "我身边很多人不理解这个，但我觉得值得认真对待。",
      "说起来，我对自己的时间管理挺严格的，但和你聊是例外。",
      "我有一个一直想做但还没做的计划，你这句话突然让我想起来了。",
      "其实我在这方面踩过不少坑，所以现在反而看得比较清。",
      "你问到这个正好，我刚好有不同寻常的看法。"
    ]
  },
  "danger_zone_tips": {
    "随便": "「随便」会让对方觉得你没主见，建议换成「我觉得XX更好，你觉得呢」",
    "都行": "「都行」显得被动，建议用「我倾向于XX」来引导",
    "哦": "单字「哦」让对方感到被敷衍，建议加上回应内容或提问",
    "嗯嗯": "「嗯嗯」是话题终结符，建议加上感受或相关联想",
    "好的好的": "重复词显得敷衍，建议换成有实质内容的回应",
    "无所谓": "「无所谓」传递冷漠信号，建议表达真实想法",
    "算了": "「算了」让对方觉得你在消极回避，建议换成积极替代方案"
  },
  "improvement_templates": [
    "回复中「{keyword}」类表达偏被动，建议展示更多主见",
    "对话中提问较少，建议在回复后加一个开放式问题",
    "回复较短，信息量不足，建议加入个人感受或经历",
    "「{keyword}」等敷衍表达易让对方失去兴趣，建议替换",
    "表达偏单向输出，建议多引导对方分享制造互动",
    "对话节奏偏慢，建议在回复中埋下悬念让对方想继续",
    "用语较正式，建议适当加入轻松幽默的表达",
    "缺少对对方话语的呼应，建议先肯定对方再展开自己观点"
  ]
}
```

---

## 【模块二：数据模型（Isar 实体）】

### `data/models/analysis_record.dart`
```dart
import 'package:isar/isar.dart';
part 'analysis_record.g.dart';

@collection
class AnalysisRecord {
  Id id = Isar.autoIncrement;
  late String rawChatContent;
  late String myKeyword;
  late String herKeyword;
  late int attractionScore;       // 0-100
  late String emotionResult;      // "POSITIVE" | "NEUTRAL" | "COLD"
  late List<String> highlights;   // 亮点话术列表
  late List<String> dangerKeywords; // 雷区关键词
  late List<String> dangerTips;   // 雷区改进建议
  late List<String> suggestions;  // 回复建议（格式："风格|内容"）
  late List<String> improvements; // 3大改进点
  late DateTime createdAt;
  bool savedToMistakeBook = false;
}
```

### `data/models/mistake_item.dart`
```dart
import 'package:isar/isar.dart';
part 'mistake_item.g.dart';

@collection
class MistakeItem {
  Id id = Isar.autoIncrement;
  late int analysisRecordId;
  late String snippet;      // 雷区话术摘要
  late String suggestion;   // 改进建议
  late DateTime addedAt;
}
```

---

## 【模块三：本地分析引擎】

### `engine/models/chat_message.dart`
```dart
enum MessageRole { mine, hers, unknown }

class ChatMessage {
  final String content;
  final MessageRole role;
  const ChatMessage({required this.content, required this.role});
}
```

### `engine/models/suggestion_item.dart`
```dart
enum SuggestionStyle { humor, flirty, sincere, highValue }

class SuggestionItem {
  final SuggestionStyle style;
  final String content;
  const SuggestionItem({required this.style, required this.content});

  String get styleLabel {
    switch (style) {
      case SuggestionStyle.humor: return '🎭 幽默风';
      case SuggestionStyle.flirty: return '💕 暧昧风';
      case SuggestionStyle.sincere: return '💬 真诚风';
      case SuggestionStyle.highValue: return '💎 高价值感';
    }
  }
}
```

### `engine/models/analysis_result.dart`
```dart
import 'suggestion_item.dart';

enum EmotionType { positive, neutral, cold }

class AnalysisResult {
  final int attractionScore;
  final EmotionType emotion;
  final List<String> highlights;
  final List<String> dangerKeywords;
  final List<String> dangerTips;
  final List<SuggestionItem> suggestions;
  final List<String> improvements;

  const AnalysisResult({
    required this.attractionScore,
    required this.emotion,
    required this.highlights,
    required this.dangerKeywords,
    required this.dangerTips,
    required this.suggestions,
    required this.improvements,
  });

  String get emotionLabel {
    switch (emotion) {
      case EmotionType.positive: return '😊 积极';
      case EmotionType.neutral: return '😐 中性';
      case EmotionType.cold: return '❄️ 冷淡';
    }
  }
}
```

### `engine/rules_loader.dart`
- 通过 `rootBundle.loadString('assets/rules.json')` 加载
- 解析为 Map，提供 getter 方法供 AnalysisEngine 调用
- 单例模式，App 启动时初始化一次

### `engine/analysis_engine.dart`

实现以下 5 个核心方法（全部同步执行，外层用 `compute` 放到 isolate 避免卡主线程）：

**① `List<ChatMessage> parseChatMessages(String raw, String myKeyword, String herKeyword)`**
- 按 `\n` 拆分文本
- 每行若包含 myKeyword → `MessageRole.mine`
- 每行若包含 herKeyword → `MessageRole.hers`
- 空行或无法识别的行 → 追加到上一条消息
- 过滤掉空内容

**② `int calcAttractionScore(List<ChatMessage> messages, List<String> lowKws, List<String> highKws)`**
- 初始 50 分
- 遍历 `role == mine` 的消息：每命中 lowKws 中一个词 -3，每命中 highKws 中一个词 +4
- 若 mine 消息平均字数 < 5，-10
- 若 mine 消息中含问号 `？?` 超过 2 条，+5
- clamp(0, 100)

**③ `EmotionType analyzeHerEmotion(List<ChatMessage> messages, List<String> positiveKws, List<String> coldKws)`**
- 取最后 5 条 `role == hers` 的消息拼接
- 分别统计 positiveKws 和 coldKws 命中次数
- positive > cold → `EmotionType.positive`
- cold > positive → `EmotionType.cold`
- 否则 → `EmotionType.neutral`

**④ `(List<String>, List<String>, List<String>) extractDangers(List<ChatMessage> messages, List<String> lowKws, Map<String, String> tips)`**
- 返回 (亮点原句列表最多3条, 雷区关键词列表最多5条, 对应改进建议列表)
- 亮点：mine 消息中含 highKws 的原句
- 雷区：mine 消息中含 lowKws 的关键词 + 对应 tips

**⑤ `AnalysisResult analyze(String rawText, String myKeyword, String herKeyword, Map rulesJson)`**
- 调用以上所有方法
- 随机从 4 种风格各取 1-2 条建议，共 4-5 条
- 从 improvement_templates 随机取 3 条，将 `{keyword}` 替换为实际找到的雷区词
- 返回完整 `AnalysisResult`

---

## 【模块四：页面实现要求】

### 4.1 主框架（`app.dart` + `router.dart`）

- `app.dart`：`ConsumerWidget`，从 Provider 读取 `themeMode`，传给 `MaterialApp.router`
- `router.dart`：使用 `go_router` 配置以下路由：
  - `/` → 主 Shell（底部导航栏）
  - `/analysis` → AnalysisPage（Tab 0）
  - `/review` → ReviewPage（Tab 1）
  - `/review/:id` → ReviewDetailPage
  - `/mistake` → MistakePage（Tab 2）
  - `/settings` → SettingsPage（Tab 3）
- 底部导航使用 `NavigationBar`（Material 3），4 个 Tab：分析 / 复盘 / 错题本 / 设置

### 4.2 AnalysisPage（分析页）

**布局（SingleChildScrollView）**：
1. 顶部说明卡片：文字"粘贴与她的聊天，本地 AI 立即分析"
2. 两个 `TextFormField`：「你的昵称/关键字」和「她的昵称/关键字」（行内并排）
3. 大文本输入框：`maxLines: 12`，hint 文字"在此粘贴聊天记录..."，`maxLength: 3000`
4. "开始分析"按钮：`FilledButton`，宽度占满，点击后触发分析
5. 分析加载时显示 `CircularProgressIndicator` + 文字"分析中..."
6. 分析完成后以动画展示结果区域：
   - `EmotionCard`：显示情绪 emoji + 描述文字，背景色随情绪变化
   - `ScoreRing`：自定义 `CustomPainter` 绘制圆环进度条，中间显示分数数字
   - `HighlightChips`：绿色 `FilterChip` 列表，展示亮点话术
   - `DangerChips`：红色 `FilterChip`，点击展开改进建议 tooltip
   - `SuggestionList`：每条建议一个 `Card`，顶部显示风格标签，右上角复制按钮（`Clipboard.setData`）
   - "加入错题本"按钮：`OutlinedButton`，保存当前分析到错题本

**Provider（`analysis_provider.dart`）**：
```dart
// 使用 AsyncNotifier
class AnalysisNotifier extends AsyncNotifier<AnalysisResult?> {
  Future<void> analyze(String rawText, String myKw, String herKw) async {
    state = const AsyncLoading();
    state = await AsyncValue.guard(() => compute(_runAnalysis, params));
  }
}
```

### 4.3 ReviewPage（复盘页）

**布局**：
1. 顶部 `TrendChart`：`fl_chart` 折线图，展示近 7 次吸引力分，有数据时显示，无数据时显示占位提示
2. `ListView.builder`：显示所有历史分析记录，按 `createdAt` 倒序
3. 每条 `RecordListItem` 显示：
   - 日期时间（`intl` 格式化为"MM月dd日 HH:mm"）
   - 吸引力分（带颜色：≥70 绿 / 40-69 橙 / <40 红）
   - 情绪 emoji
   - 右箭头
4. 点击跳转 `/review/:id`

**ReviewDetailPage**：
- 展示 `AnalysisRecord` 完整内容
- "AI 复盘总结"Card：显示 3 大改进点（`improvements` 字段）
- "加入错题本"按钮（已加入则显示"✓ 已加入"并禁用）
- 底部危险区："删除本次记录"（红色文字按钮，二次确认）

### 4.4 MistakePage（错题本）

**布局**：
- `ListView.builder` 展示所有 `MistakeItem`
- 每条 `MistakeListItem` 显示：雷区摘要、改进建议、加入日期
- 使用 `Dismissible` Widget 实现左滑删除，删除后显示 `SnackBar`（带 Undo 撤销）
- 空状态：居中显示图标 + "还没有错题，去分析一段聊天吧～"

### 4.5 SettingsPage（设置页）

布局（`ListView`）：
1. Section 标题"外观"
   - `SwitchListTile`：深色模式开关，切换后立即更新主题 + 写入 `SharedPreferences`
2. Section 标题"隐私"
   - `ListTile`：一键清空所有数据（红色文字），点击弹出 `AlertDialog` 二次确认，确认后清空 Isar 所有 collection 数据
3. Section 标题"关于"
   - `ListTile`：隐私说明——"所有数据仅存储在本机，不联网，不上传，随时可清除"
   - `ListTile`：App 版本号 v1.0.0

---

## 【模块五：主题配置】

### `core/theme/app_colors.dart`
```dart
class AppColors {
  static const Color primary = Color(0xFF6750A4);       // Material 3 默认 primary
  static const Color highlight = Color(0xFF4CAF50);     // 亮点绿
  static const Color danger = Color(0xFFF44336);        // 雷区红
  static const Color scoreHigh = Color(0xFF4CAF50);     // 高分 ≥70
  static const Color scoreMid = Color(0xFFFF9800);      // 中分 40-69
  static const Color scoreLow = Color(0xFFF44336);      // 低分 <40
  static const Color emotionPositive = Color(0xFFE8F5E9);
  static const Color emotionNeutral = Color(0xFFF5F5F5);
  static const Color emotionCold = Color(0xFFE3F2FD);
}
```

### `core/theme/app_theme.dart`
- 提供 `lightTheme` 和 `darkTheme`
- 均使用 `ColorScheme.fromSeed(seedColor: AppColors.primary)`
- `useMaterial3: true`
- 自定义 `cardTheme`：圆角 16px

---

## 【开发顺序（严格按此顺序执行）】

```
Step 1:  项目初始化 & pubspec.yaml 配置
Step 2:  assets/rules.json 创建
Step 3:  core/ 下主题和工具类
Step 4:  data/models/ Isar 实体创建 + 运行 build_runner 生成 .g.dart
Step 5:  data/repositories/ 数据库 Provider 和 Repository
Step 6:  engine/ 数据类 + RulesLoader + AnalysisEngine
Step 7:  router.dart + 主 Shell（底部导航框架）
Step 8:  features/analysis/ 全部文件（页面 + Provider + 子 Widget）
Step 9:  features/review/ 全部文件
Step 10: features/mistake/ 全部文件
Step 11: features/settings/ 全部文件
Step 12: main.dart 整合 + ProviderScope 包裹
Step 13: 整体检查：flutter analyze 无 error，flutter run 可正常启动
```

**每完成一个 Step，列出本步骤创建/修改的文件清单，等待我回复"继续"后再进行下一步。**

---

## 【质量验收 Checklist】

完成后请逐项确认：

- [ ] `flutter analyze` 输出 0 errors
- [ ] `flutter build apk --debug` 编译成功，无报错
- [ ] App 冷启动后底部导航正常显示 4 个 Tab
- [ ] 在分析页粘贴聊天内容 + 填写关键字后点击"开始分析"，5 秒内显示结果
- [ ] 分析结果包含：情绪状态、0-100 分圆环、亮点 Chip、雷区 Chip、≥4 条建议
- [ ] 每条建议的"复制"按钮可正常复制到剪贴板
- [ ] 复盘页折线图在有 ≥2 条记录后正确显示
- [ ] 错题本左滑删除 + SnackBar Undo 功能正常
- [ ] 设置页深色模式开关切换后全局主题立即变更
- [ ] 设置页"清空所有数据"确认后 Isar 数据库清空，复盘和错题本页面更新为空状态
- [ ] 全程无 INTERNET 权限，断网/飞行模式下功能完全正常
- [ ] 无 `dart:io` 的网络相关 import，无 `http`、`dio` 等网络库

---

## 【常见坑提示（提前规避）】

1. **Isar build_runner**：修改 Entity 后必须重新运行 `flutter pub run build_runner build --delete-conflicting-outputs`
2. **compute 传参限制**：`compute` 只能传可序列化的数据（Map/List/String/int），不能直接传自定义对象，分析参数需包装成 Map
3. **fl_chart 空数据保护**：数据列表为空时不渲染 `LineChart`，改为显示 `Center(child: Text('暂无数据'))`
4. **go_router ShellRoute**：底部导航使用 `ShellRoute`，子路由 push 时不会重置底部 Tab 状态
5. **Riverpod ConsumerWidget**：所有需要读取 Provider 的 Widget 继承 `ConsumerWidget`，使用 `ref.watch` 而非 `ref.read` 来响应状态变化
6. **Isar 在主 isolate 初始化**：在 `main.dart` 中 await 完成 Isar 初始化再 `runApp`
7. **深色模式**：`EmotionCard` 背景色在暗色模式下需调整，避免纯白背景

---

**现在请开始 Step 1：项目初始化 & pubspec.yaml 配置。**
