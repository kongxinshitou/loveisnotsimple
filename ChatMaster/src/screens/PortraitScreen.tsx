// 女方人物画像分析页面（V0.2 新增）
import React, {useState, useEffect} from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  StatusBar,
  BackHandler,
  ToastAndroid,
} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {RouteProp} from '@react-navigation/native';
import {RootStackParamList} from '../navigation/AppNavigator';
import Colors from '../theme/colors';
import useSessionStore from '../store/useSessionStore';
import useSettingsStore from '../store/useSettingsStore';
import {FemalePortrait} from '../types';
import {buildPortraitPrompt} from '../services/promptBuilder';
import {callLlmApi} from '../services/llmClient';
import {parsePortraitResult} from '../services/responseParser';
import LoadingOverlay from '../components/LoadingOverlay';

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'Portrait'>;
  route: RouteProp<RootStackParamList, 'Portrait'>;
};

// 画像维度展示卡片
interface PortraitDimensionProps {
  emoji: string;
  title: string;
  content: string;
  color: string;
}

const PortraitDimension: React.FC<PortraitDimensionProps> = ({emoji, title, content, color}) => {
  if (!content) {return null;}
  return (
    <View style={[styles.dimensionCard, {borderLeftColor: color}]}>
      <Text style={styles.dimensionTitle}>{emoji} {title}</Text>
      <Text style={styles.dimensionContent}>{content}</Text>
    </View>
  );
};

const PortraitScreen: React.FC<Props> = ({navigation, route}) => {
  const insets = useSafeAreaInsets();
  const {sessionId} = route.params;

  const sessions = useSessionStore(s => s.sessions);
  const updatePortrait = useSessionStore(s => s.updatePortrait);
  const config = useSettingsStore(s => s.config);

  const session = sessions.find(s => s.id === sessionId);
  const [chatText, setChatText] = useState('');
  const [loading, setLoading] = useState(false);

  // 初始化：如果会话有最新记录，预填充聊天文本
  useEffect(() => {
    if (session?.entries && session.entries.length > 0) {
      setChatText(session.entries[0].fullChat);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 安卓返回键
  useEffect(() => {
    const handler = BackHandler.addEventListener('hardwareBackPress', () => {
      navigation.goBack();
      return true;
    });
    return () => handler.remove();
  }, [navigation]);

  const handleGenerate = async () => {
    if (!chatText.trim()) {
      ToastAndroid.show('请先粘贴聊天记录', ToastAndroid.SHORT);
      return;
    }
    if (!config.apiKey) {
      ToastAndroid.show('请先在设置中配置 API Key', ToastAndroid.SHORT);
      return;
    }
    setLoading(true);
    try {
      const prompt = buildPortraitPrompt(chatText, session?.femaleProfile);
      const rawText = await callLlmApi(config, prompt);
      const portrait = parsePortraitResult(rawText);
      await updatePortrait(sessionId, portrait);
      ToastAndroid.show('画像分析完成', ToastAndroid.SHORT);
    } catch (err: any) {
      ToastAndroid.show(err.message || '分析失败，请重试', ToastAndroid.LONG);
    } finally {
      setLoading(false);
    }
  };

  const portrait: FemalePortrait | undefined = session?.femalePortrait;

  if (!session) {
    return (
      <View style={styles.wrapper}>
        <Text style={{color: Colors.textPrimary, padding: 20}}>会话不存在</Text>
      </View>
    );
  }

  return (
    <View style={styles.wrapper}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.bgPrimary} />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} activeOpacity={0.7} style={styles.backButton}>
          <Text style={styles.backText}>‹ 返回</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>人物画像</Text>
        <View style={styles.backButton} />
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.content, {paddingBottom: insets.bottom + 32}]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}>

        {/* 说明 */}
        <View style={styles.tipCard}>
          <Text style={styles.tipText}>
            🧠 基于聊天记录，AI 将深度分析她的性格、兴趣度和攻略策略
          </Text>
        </View>

        {/* 聊天记录输入 */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>聊天记录（用于分析）</Text>
          <TextInput
            style={styles.input}
            multiline
            placeholder="粘贴与她的聊天记录..."
            placeholderTextColor={Colors.textMuted}
            value={chatText}
            onChangeText={setChatText}
            textAlignVertical="top"
          />
        </View>

        {/* 生成按钮 */}
        <TouchableOpacity
          style={[styles.generateBtn, (!chatText.trim() || loading) && styles.generateBtnDisabled]}
          onPress={handleGenerate}
          activeOpacity={0.85}
          disabled={!chatText.trim() || loading}>
          <Text style={styles.generateBtnText}>
            {portrait ? '🔄 重新分析' : '🔍 开始画像分析'}
          </Text>
        </TouchableOpacity>

        {/* 画像结果 */}
        {portrait && (
          <View style={styles.portraitSection}>
            <Text style={styles.portraitHeading}>
              💗 {session.name || '她'} 的人物画像
            </Text>

            {/* 降级：无结构化数据时显示原始文本 */}
            {!portrait.personalityType && !portrait.interestLevel ? (
              <View style={styles.card}>
                <Text style={styles.rawText}>{portrait.rawText}</Text>
              </View>
            ) : (
              <>
                <PortraitDimension
                  emoji="🧬"
                  title="性格类型"
                  content={portrait.personalityType}
                  color={Colors.accentPurple}
                />
                <PortraitDimension
                  emoji="❤️"
                  title="对你的兴趣度"
                  content={portrait.interestLevel}
                  color={Colors.accentPink}
                />
                <PortraitDimension
                  emoji="💬"
                  title="沟通风格"
                  content={portrait.communicationStyle}
                  color={Colors.accentGold}
                />
                <PortraitDimension
                  emoji="🌡️"
                  title="当前情感状态"
                  content={portrait.emotionalState}
                  color={Colors.accentGreen}
                />
                <PortraitDimension
                  emoji="🎯"
                  title="攻略弱点"
                  content={portrait.weaknesses}
                  color={Colors.chipFlirty}
                />
                {portrait.strategies.length > 0 && (
                  <View style={[styles.dimensionCard, {borderLeftColor: Colors.accentGold}]}>
                    <Text style={styles.dimensionTitle}>🗺️ 攻略策略</Text>
                    {portrait.strategies.map((s, i) => (
                      <Text key={i} style={styles.strategyItem}>
                        {i + 1}. {s}
                      </Text>
                    ))}
                  </View>
                )}
              </>
            )}
          </View>
        )}
      </ScrollView>

      {loading && <LoadingOverlay />}
    </View>
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
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: Colors.bgPrimary,
  },
  backButton: {
    width: 60,
  },
  backText: {
    color: Colors.accentPink,
    fontSize: 16,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.textPrimary,
  },
  scroll: {
    flex: 1,
  },
  content: {
    padding: 16,
  },
  tipCard: {
    backgroundColor: Colors.accentPurple + '1A',
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    borderLeftWidth: 3,
    borderLeftColor: Colors.accentPurple,
  },
  tipText: {
    fontSize: 13,
    color: Colors.textSecondary,
    lineHeight: 20,
  },
  card: {
    backgroundColor: Colors.bgCard,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 13,
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
    minHeight: 120,
    lineHeight: 22,
  },
  generateBtn: {
    backgroundColor: Colors.accentPurple,
    borderRadius: 27,
    paddingVertical: 16,
    alignItems: 'center',
    marginBottom: 20,
  },
  generateBtnDisabled: {
    opacity: 0.5,
  },
  generateBtnText: {
    color: Colors.textPrimary,
    fontSize: 16,
    fontWeight: '700',
  },
  portraitSection: {
    marginTop: 4,
  },
  portraitHeading: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: 12,
  },
  dimensionCard: {
    backgroundColor: Colors.bgCard,
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    borderLeftWidth: 3,
  },
  dimensionTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.textSecondary,
    marginBottom: 8,
  },
  dimensionContent: {
    fontSize: 14,
    color: Colors.textPrimary,
    lineHeight: 22,
  },
  strategyItem: {
    fontSize: 14,
    color: Colors.textPrimary,
    lineHeight: 24,
    marginBottom: 2,
  },
  rawText: {
    fontSize: 14,
    color: Colors.textSecondary,
    lineHeight: 22,
  },
});

export default PortraitScreen;
