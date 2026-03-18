// 主界面：输入聊天记录 → 选择风格 → 调用 API → 展示结果（V0.2 支持会话上下文）
import React, {useState, useEffect} from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  ToastAndroid,
  StatusBar,
  BackHandler,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {RouteProp} from '@react-navigation/native';
import {RootStackParamList} from '../navigation/AppNavigator';
import Colors from '../theme/colors';
import {ReplyStyle, AnalysisResult, HistoryEntry} from '../types';
import {buildUserPrompt} from '../services/promptBuilder';
import {callLlmApi} from '../services/llmClient';
import {parseResponse} from '../services/responseParser';
import {readClipboard} from '../utils/clipboard';
import useSettingsStore from '../store/useSettingsStore';
import useSessionStore from '../store/useSessionStore';
import StyleChipGroup from '../components/StyleChipGroup';
import GradientButton from '../components/GradientButton';
import LoadingOverlay from '../components/LoadingOverlay';
import AnalysisHeader from '../components/AnalysisHeader';
import SuggestionCard from '../components/SuggestionCard';

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'Home'>;
  route: RouteProp<RootStackParamList, 'Home'>;
};

const HomeScreen: React.FC<Props> = ({navigation, route}) => {
  const insets = useSafeAreaInsets();
  const {sessionId} = route.params;

  const [chatText, setChatText] = useState('');
  const [selectedStyle, setSelectedStyle] = useState<ReplyStyle>('flirty');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);

  const config = useSettingsStore(s => s.config);
  const sessions = useSessionStore(s => s.sessions);
  const addEntryToSession = useSessionStore(s => s.addEntryToSession);

  const session = sessions.find(s => s.id === sessionId);

  // 检查人设是否已填写（有任意字段即视为已填）
  const hasProfile =
    session &&
    (session.maleProfile.name ||
      session.maleProfile.personality ||
      session.femaleProfile.name ||
      session.femaleProfile.personality);

  // 安卓返回键：返回会话列表
  useEffect(() => {
    const handler = BackHandler.addEventListener('hardwareBackPress', () => {
      navigation.goBack();
      return true;
    });
    return () => handler.remove();
  }, [navigation]);

  // 从剪贴板粘贴
  const handlePaste = async () => {
    const text = await readClipboard();
    if (text) {
      setChatText(text);
    } else {
      ToastAndroid.show('剪贴板为空', ToastAndroid.SHORT);
    }
  };

  // 调用 API 获取分析结果
  const handleAnalyze = async () => {
    if (!chatText.trim()) {
      ToastAndroid.show('请先粘贴聊天记录', ToastAndroid.SHORT);
      return;
    }
    if (!config.apiKey) {
      ToastAndroid.show('请先在设置中配置 API Key', ToastAndroid.SHORT);
      return;
    }

    setLoading(true);
    setResult(null);

    try {
      // V0.2：传入会话人设信息
      const userPrompt = buildUserPrompt(
        chatText,
        selectedStyle,
        session?.maleProfile,
        session?.femaleProfile,
      );
      const rawText = await callLlmApi(config, userPrompt);
      const parsed = parseResponse(rawText);
      setResult(parsed);
    } catch (err: any) {
      ToastAndroid.show(err.message || 'API 调用失败，请重试', ToastAndroid.LONG);
    } finally {
      setLoading(false);
    }
  };

  // 保存到会话历史记录
  const handleSave = async () => {
    if (!result) {return;}
    const entry: HistoryEntry = {
      id: Date.now().toString(),
      chatPreview: chatText.slice(0, 50),
      fullChat: chatText,
      style: selectedStyle,
      result,
      createdAt: Date.now(),
    };
    await addEntryToSession(sessionId, entry);
    ToastAndroid.show('已保存到历史记录', ToastAndroid.SHORT);
  };

  return (
    <KeyboardAvoidingView
      style={styles.wrapper}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.bgPrimary} />

      {/* 自定义 Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} activeOpacity={0.7} style={styles.backButton}>
          <Text style={styles.backText}>‹</Text>
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>
            {session?.name || '情话大师'}
          </Text>
          {hasProfile && (
            <Text style={styles.headerSub}>人设已启用 ✓</Text>
          )}
        </View>
        <View style={styles.headerActions}>
          {/* 人设编辑入口 */}
          <TouchableOpacity
            onPress={() => navigation.navigate('ProfileEdit', {sessionId})}
            style={styles.iconButton}
            activeOpacity={0.7}>
            <Text style={styles.iconText}>👤</Text>
          </TouchableOpacity>
          {/* 画像分析入口 */}
          <TouchableOpacity
            onPress={() => navigation.navigate('Portrait', {sessionId})}
            style={styles.iconButton}
            activeOpacity={0.7}>
            <Text style={styles.iconText}>🧠</Text>
          </TouchableOpacity>
          {/* 历史记录 */}
          <TouchableOpacity
            onPress={() => navigation.navigate('History', {sessionId})}
            style={styles.iconButton}
            activeOpacity={0.7}>
            <Text style={styles.iconText}>📋</Text>
          </TouchableOpacity>
          {/* 设置 */}
          <TouchableOpacity
            onPress={() => navigation.navigate('Settings')}
            style={styles.iconButton}
            activeOpacity={0.7}>
            <Text style={styles.iconText}>⚙️</Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.content, {paddingBottom: insets.bottom + 32}]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}>

        {/* 人设提示（未填写时显示引导） */}
        {!hasProfile && (
          <TouchableOpacity
            style={styles.profileHint}
            onPress={() => navigation.navigate('ProfileEdit', {sessionId})}
            activeOpacity={0.8}>
            <Text style={styles.profileHintText}>
              👤 填写人设信息，让 AI 更精准地定制回复 →
            </Text>
          </TouchableOpacity>
        )}

        {/* 输入卡片 */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>聊天记录</Text>
          <TextInput
            style={styles.input}
            multiline
            placeholder="将你和她的微信/QQ聊天记录粘贴到这里..."
            placeholderTextColor={Colors.textMuted}
            value={chatText}
            onChangeText={setChatText}
            textAlignVertical="top"
          />
          <View style={styles.inputActions}>
            <TouchableOpacity onPress={handlePaste} activeOpacity={0.8}>
              <Text style={styles.actionText}>📎 从剪贴板粘贴</Text>
            </TouchableOpacity>
            {chatText.length > 0 && (
              <TouchableOpacity onPress={() => setChatText('')} activeOpacity={0.8}>
                <Text style={[styles.actionText, {color: Colors.textDanger}]}>清空</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* 风格选择 */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>选择风格</Text>
          <StyleChipGroup selected={selectedStyle} onSelect={setSelectedStyle} />
        </View>

        {/* 分析按钮 */}
        <GradientButton
          title="✨ 获取骚气回复"
          onPress={handleAnalyze}
          disabled={!chatText.trim() || loading}
          style={styles.analyzeButton}
        />

        {/* 结果区域 */}
        {result && (
          <View style={styles.resultSection}>
            {result.overallAnalysis ? (
              <AnalysisHeader analysis={result.overallAnalysis} />
            ) : null}
            {result.suggestions.map((s, i) => (
              <SuggestionCard key={s.index} suggestion={s} index={i} />
            ))}
            {/* 降级：无建议时展示原文 */}
            {result.suggestions.length === 0 && result.rawText ? (
              <View style={styles.card}>
                <Text style={styles.rawText}>{result.rawText}</Text>
              </View>
            ) : null}
            {/* 操作按钮 */}
            <View style={styles.resultActions}>
              <TouchableOpacity
                style={styles.secondaryButton}
                onPress={handleSave}
                activeOpacity={0.8}>
                <Text style={styles.secondaryButtonText}>💾 保存到本地</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.secondaryButton}
                onPress={handleAnalyze}
                activeOpacity={0.8}>
                <Text style={styles.secondaryButtonText}>🔄 重新生成</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </ScrollView>

      {/* 加载遮罩 */}
      {loading && <LoadingOverlay />}
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
    backgroundColor: Colors.bgSecondary,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: Colors.bgPrimary,
  },
  backButton: {
    width: 32,
    alignItems: 'center',
  },
  backText: {
    color: Colors.accentPink,
    fontSize: 22,
    fontWeight: '300',
  },
  headerCenter: {
    flex: 1,
    marginLeft: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.textPrimary,
  },
  headerSub: {
    fontSize: 11,
    color: Colors.accentGreen,
    marginTop: 1,
  },
  headerActions: {
    flexDirection: 'row',
  },
  iconButton: {
    marginLeft: 8,
    padding: 4,
  },
  iconText: {
    fontSize: 18,
  },
  scroll: {
    flex: 1,
  },
  content: {
    padding: 16,
  },
  profileHint: {
    backgroundColor: Colors.accentPurple + '22',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: Colors.accentPurple + '44',
  },
  profileHintText: {
    fontSize: 13,
    color: Colors.accentPurple,
  },
  card: {
    backgroundColor: Colors.bgCard,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textSecondary,
    marginBottom: 10,
  },
  input: {
    backgroundColor: Colors.bgInput,
    borderRadius: 12,
    padding: 12,
    color: Colors.textPrimary,
    fontSize: 14,
    minHeight: 160,
    lineHeight: 22,
  },
  inputActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  actionText: {
    fontSize: 13,
    color: Colors.accentPurple,
  },
  analyzeButton: {
    marginBottom: 16,
  },
  resultSection: {
    marginTop: 4,
  },
  rawText: {
    fontSize: 14,
    color: Colors.textSecondary,
    lineHeight: 22,
  },
  resultActions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 8,
  },
  secondaryButton: {
    flex: 1,
    backgroundColor: Colors.bgCard,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  secondaryButtonText: {
    color: Colors.textSecondary,
    fontSize: 14,
    fontWeight: '600',
  },
});

export default HomeScreen;
