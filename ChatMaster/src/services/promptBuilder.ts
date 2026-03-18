// Prompt 构建 - 产品核心，严格按照规范实现
import {ReplyStyle, CharacterProfile} from '../types';

// System Prompt（原样，一字不改）
export const SYSTEM_PROMPT = `你是一位顶级两性沟通专家和情话大师，专门帮助男性在与女性的聊天中展现最大魅力。你精通：
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
5. 懂得适可而止，不过度纠缠`;

// 四种风格映射
const STYLE_MAP: Record<ReplyStyle, {label: string; description: string}> = {
  flirty: {
    label: '挑逗',
    description: '大胆挑逗、充满性张力的暧昧风格，善用双关语和暗示，让女生脸红心跳',
  },
  humor: {
    label: '幽默',
    description: '轻松幽默、机智风趣的聊天风格，用笑点化解尴尬，在欢笑中拉近距离',
  },
  affectionate: {
    label: '深情',
    description: '温柔深情但不舔，用走心的表达触动她的内心，展现成熟男人的细腻',
  },
  high_value: {
    label: '高价值',
    description: '不经意间展现高价值的聊天风格，忙碌感、生活丰富、有选择权，让她主动追逐',
  },
};

// 构建人设信息片段（有内容才插入）
function buildProfileSection(
  maleProfile?: CharacterProfile,
  femaleProfile?: CharacterProfile,
): string {
  let section = '';

  const hasProfile = (p?: CharacterProfile) =>
    p && (p.name || p.age || p.personality || p.background || p.interests || p.notes);

  if (hasProfile(maleProfile)) {
    section += '\n## 男方人设\n';
    if (maleProfile!.name) {section += `- 昵称：${maleProfile!.name}\n`;}
    if (maleProfile!.age) {section += `- 年龄：${maleProfile!.age}\n`;}
    if (maleProfile!.personality) {section += `- 性格：${maleProfile!.personality}\n`;}
    if (maleProfile!.background) {section += `- 职业/背景：${maleProfile!.background}\n`;}
    if (maleProfile!.interests) {section += `- 兴趣爱好：${maleProfile!.interests}\n`;}
    if (maleProfile!.notes) {section += `- 备注：${maleProfile!.notes}\n`;}
  }

  if (hasProfile(femaleProfile)) {
    section += '\n## 女方人设\n';
    if (femaleProfile!.name) {section += `- 昵称：${femaleProfile!.name}\n`;}
    if (femaleProfile!.age) {section += `- 年龄：${femaleProfile!.age}\n`;}
    if (femaleProfile!.personality) {section += `- 性格：${femaleProfile!.personality}\n`;}
    if (femaleProfile!.background) {section += `- 职业/背景：${femaleProfile!.background}\n`;}
    if (femaleProfile!.interests) {section += `- 兴趣爱好：${femaleProfile!.interests}\n`;}
    if (femaleProfile!.notes) {section += `- 备注：${femaleProfile!.notes}\n`;}
  }

  return section;
}

// 构建 User Prompt（V0.2 新增人设参数）
export function buildUserPrompt(
  chatContent: string,
  style: ReplyStyle,
  maleProfile?: CharacterProfile,
  femaleProfile?: CharacterProfile,
): string {
  const {label, description} = STYLE_MAP[style];
  const profileSection = buildProfileSection(maleProfile, femaleProfile);

  return `请分析以下聊天记录，并给出回复建议。${profileSection}
## 聊天记录
${chatContent}

## 要求
1. 先用2-3句话简要分析当前对话状态（她的兴趣度、对话温度、关键转折点）
2. 然后生成5条回复建议，风格偏向：${label}
3. 每条建议请严格按以下格式输出（方便程序解析，请勿修改格式标记）：

### 建议1
- 回复内容：{具体的回复文字}
- 风格标签：{如：幽默/挑逗/深情/高价值/推拉}
- 吸引力评分：{1-5}星
- 策略解析：{为什么这条回复有效，用了什么技巧}

### 建议2
...（以此类推到建议5）

## 风格说明
本次生成偏向「${label}」风格：${description}

## 额外规则
- 回复必须自然、口语化，像真人发微信一样
- 绝对不要出现"亲爱的"、"宝贝"等油腻称呼（除非对话已经非常亲密）
- 适当使用emoji但不要过多（最多1-2个）
- 如果聊天记录中有冷场迹象，优先建议如何破冰重启话题${profileSection ? '\n- 请结合以上人设信息定制回复，体现男方特点并针对女方性格投其所好' : ''}
- 请用中文回复`;
}

// 构建女方人物画像分析 Prompt（V0.2 新增）
export function buildPortraitPrompt(
  chatContent: string,
  femaleProfile?: CharacterProfile,
): string {
  let knownInfo = '';
  const hasProfile =
    femaleProfile &&
    (femaleProfile.name ||
      femaleProfile.age ||
      femaleProfile.personality ||
      femaleProfile.background ||
      femaleProfile.interests ||
      femaleProfile.notes);

  if (hasProfile) {
    knownInfo = '\n## 已知信息\n';
    if (femaleProfile!.name) {knownInfo += `- 昵称：${femaleProfile!.name}\n`;}
    if (femaleProfile!.age) {knownInfo += `- 年龄：${femaleProfile!.age}\n`;}
    if (femaleProfile!.personality) {knownInfo += `- 性格：${femaleProfile!.personality}\n`;}
    if (femaleProfile!.background) {knownInfo += `- 职业/背景：${femaleProfile!.background}\n`;}
    if (femaleProfile!.interests) {knownInfo += `- 兴趣：${femaleProfile!.interests}\n`;}
    if (femaleProfile!.notes) {knownInfo += `- 其他：${femaleProfile!.notes}\n`;}
  }

  return `请根据以下聊天记录，对女方进行深度人物画像分析。${knownInfo}
## 聊天记录
${chatContent}

## 分析要求
请严格按以下格式输出各维度分析（方便程序解析，请勿修改标题格式）：

### 性格类型
{MBTI倾向或通俗性格描述，如：外向活泼型、内敛思考型、情绪化感性型等，结合聊天证据说明}

### 对男方兴趣度
{高/中/低，以及在聊天中的具体表现依据}

### 沟通风格
{她的沟通特点：主动还是被动、话多还是简短、喜欢玩笑还是认真等}

### 当前情感状态
{从聊天判断她目前的心理状态，对这段关系的态度和期待}

### 攻略弱点
{她最容易被哪类表达打动，性格软肋和喜好}

### 攻略策略
1. {第一条具体策略}
2. {第二条具体策略}
3. {第三条具体策略}

请用中文回复，分析要有聊天内容作为依据，不要空泛。`;
}

// 获取风格标签（UI显示用）
export function getStyleLabel(style: ReplyStyle): string {
  return STYLE_MAP[style].label;
}
