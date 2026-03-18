// 设置页面：API配置 + 测试连接 + 一键清除数据
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
} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {RootStackParamList} from '../navigation/AppNavigator';
import Colors from '../theme/colors';
import useSettingsStore from '../store/useSettingsStore';
import {testConnection} from '../services/llmClient';
import ConfirmModal from '../components/ConfirmModal';

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'Settings'>;
};

// 预设模型选项
const MODEL_OPTIONS = [
  {label: 'Claude Sonnet（推荐）', value: 'claude-sonnet-4-20250514'},
  {label: 'DeepSeek Chat', value: 'deepseek-chat'},
  {label: '自定义', value: 'custom'},
];

const SettingsScreen: React.FC<Props> = ({navigation}) => {
  const insets = useSafeAreaInsets();
  const config = useSettingsStore(s => s.config);
  const setConfig = useSettingsStore(s => s.setConfig);
  const loadConfig = useSettingsStore(s => s.loadConfig);
  const clearAll = useSettingsStore(s => s.clearAll);

  const [baseUrl, setBaseUrl] = useState(config.baseUrl);
  const [apiKey, setApiKey] = useState(config.apiKey);
  const [selectedModel, setSelectedModel] = useState('claude-sonnet-4-20250514');
  const [customModel, setCustomModel] = useState('');
  const [showKey, setShowKey] = useState(false);
  const [testing, setTesting] = useState(false);
  const [showClearModal, setShowClearModal] = useState(false);

  useEffect(() => {
    loadConfig();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    // 初始化模型选择
    const preset = MODEL_OPTIONS.find(o => o.value === config.model);
    if (preset) {
      setSelectedModel(config.model);
    } else {
      setSelectedModel('custom');
      setCustomModel(config.model);
    }
    setBaseUrl(config.baseUrl);
    setApiKey(config.apiKey);
  }, [config]);

  // 安卓返回键正常返回上一页
  useEffect(() => {
    const handler = BackHandler.addEventListener('hardwareBackPress', () => {
      navigation.goBack();
      return true;
    });
    return () => handler.remove();
  }, [navigation]);

  const getEffectiveModel = () => {
    return selectedModel === 'custom' ? customModel : selectedModel;
  };

  // 保存配置
  const handleSave = () => {
    const model = getEffectiveModel();
    if (!model) {
      ToastAndroid.show('请填写模型名称', ToastAndroid.SHORT);
      return;
    }
    setConfig({baseUrl: baseUrl.trim(), apiKey: apiKey.trim(), model});
    ToastAndroid.show('配置已保存', ToastAndroid.SHORT);
  };

  // 测试连接
  const handleTest = async () => {
    if (!apiKey.trim()) {
      ToastAndroid.show('请先填写 API Key', ToastAndroid.SHORT);
      return;
    }
    setTesting(true);
    try {
      await testConnection({
        baseUrl: baseUrl.trim(),
        apiKey: apiKey.trim(),
        model: getEffectiveModel(),
      });
      ToastAndroid.show('连接成功！', ToastAndroid.SHORT);
    } catch (err: any) {
      ToastAndroid.show(err.message || '连接失败', ToastAndroid.LONG);
    } finally {
      setTesting(false);
    }
  };

  // 清除所有数据
  const handleClearAll = async () => {
    setShowClearModal(false);
    await clearAll();
    ToastAndroid.show('已清除所有本地数据', ToastAndroid.SHORT);
  };

  return (
    <View style={styles.wrapper}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.bgPrimary} />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} activeOpacity={0.7} style={styles.backButton}>
          <Text style={styles.backText}>‹ 返回</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>设置</Text>
        <View style={{width: 60}} />
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.content, {paddingBottom: insets.bottom + 32}]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled">

        {/* API 配置卡片 */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>API 配置</Text>

          {/* 接口地址 */}
          <Text style={styles.label}>接口地址</Text>
          <TextInput
            style={styles.input}
            value={baseUrl}
            onChangeText={setBaseUrl}
            placeholder="https://api.anthropic.com/v1/messages"
            placeholderTextColor={Colors.textMuted}
            autoCapitalize="none"
            autoCorrect={false}
          />

          {/* API 密钥 */}
          <Text style={styles.label}>API 密钥</Text>
          <View style={styles.passwordRow}>
            <TextInput
              style={[styles.input, {flex: 1, marginBottom: 0}]}
              value={apiKey}
              onChangeText={setApiKey}
              placeholder="sk-..."
              placeholderTextColor={Colors.textMuted}
              secureTextEntry={!showKey}
              autoCapitalize="none"
              autoCorrect={false}
            />
            <TouchableOpacity onPress={() => setShowKey(!showKey)} style={styles.eyeButton} activeOpacity={0.7}>
              <Text style={styles.eyeText}>{showKey ? '🙈' : '👁️'}</Text>
            </TouchableOpacity>
          </View>

          {/* 模型选择 */}
          <Text style={styles.label}>模型</Text>
          {MODEL_OPTIONS.map(option => (
            <TouchableOpacity
              key={option.value}
              style={[styles.modelOption, selectedModel === option.value && styles.modelOptionSelected]}
              onPress={() => setSelectedModel(option.value)}
              activeOpacity={0.8}>
              <View style={[styles.radio, selectedModel === option.value && styles.radioSelected]} />
              <Text style={[styles.modelText, selectedModel === option.value && styles.modelTextSelected]}>
                {option.label}
              </Text>
            </TouchableOpacity>
          ))}
          {selectedModel === 'custom' && (
            <TextInput
              style={[styles.input, {marginTop: 8}]}
              value={customModel}
              onChangeText={setCustomModel}
              placeholder="输入自定义模型名称"
              placeholderTextColor={Colors.textMuted}
              autoCapitalize="none"
            />
          )}

          {/* 操作按钮 */}
          <View style={styles.configButtons}>
            <TouchableOpacity
              style={[styles.testButton, testing && styles.buttonDisabled]}
              onPress={handleTest}
              disabled={testing}
              activeOpacity={0.8}>
              <Text style={styles.testButtonText}>
                {testing ? '测试中...' : '🔌 测试连接'}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.saveButton}
              onPress={handleSave}
              activeOpacity={0.8}>
              <Text style={styles.saveButtonText}>保存</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* 隐私安全卡片 */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>隐私安全</Text>
          <Text style={styles.privacyText}>
            本应用不收集任何个人信息，聊天数据仅存储在您的设备本地。分析功能通过在线 AI 接口实时处理，不做云端留存。
          </Text>
          <TouchableOpacity
            style={styles.dangerButton}
            onPress={() => setShowClearModal(true)}
            activeOpacity={0.8}>
            <Text style={styles.dangerButtonText}>一键清除所有本地数据</Text>
          </TouchableOpacity>
        </View>

        {/* 关于卡片 */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>关于</Text>
          <Text style={styles.aboutVersion}>v1.0.0</Text>
          <Text style={styles.aboutSlogan}>让每一句话都充满暧昧张力</Text>
        </View>
      </ScrollView>

      {/* 清除确认弹窗 */}
      <ConfirmModal
        visible={showClearModal}
        title="清除所有数据"
        message="这将删除所有历史记录和 API 配置，操作不可撤销。确认继续吗？"
        confirmText="确认清除"
        onConfirm={handleClearAll}
        onCancel={() => setShowClearModal(false)}
      />
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
  card: {
    backgroundColor: Colors.bgCard,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.textPrimary,
    marginBottom: 14,
  },
  label: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginBottom: 6,
    marginTop: 12,
  },
  input: {
    backgroundColor: Colors.bgInput,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: Colors.textPrimary,
    fontSize: 14,
    marginBottom: 4,
  },
  passwordRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  eyeButton: {
    padding: 10,
  },
  eyeText: {
    fontSize: 18,
  },
  modelOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.border,
    marginTop: 6,
  },
  modelOptionSelected: {
    borderColor: Colors.accentPurple,
    backgroundColor: `${Colors.accentPurple}22`,
  },
  radio: {
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: Colors.textMuted,
    marginRight: 10,
  },
  radioSelected: {
    borderColor: Colors.accentPurple,
    backgroundColor: Colors.accentPurple,
  },
  modelText: {
    color: Colors.textSecondary,
    fontSize: 14,
  },
  modelTextSelected: {
    color: Colors.textPrimary,
    fontWeight: '600',
  },
  configButtons: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 16,
  },
  testButton: {
    flex: 1,
    backgroundColor: Colors.bgElevated,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  testButtonText: {
    color: Colors.textSecondary,
    fontSize: 14,
    fontWeight: '600',
  },
  saveButton: {
    flex: 1,
    backgroundColor: Colors.accentPurple,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  saveButtonText: {
    color: Colors.textPrimary,
    fontSize: 14,
    fontWeight: 'bold',
  },
  privacyText: {
    fontSize: 13,
    color: Colors.textSecondary,
    lineHeight: 20,
    marginBottom: 16,
  },
  dangerButton: {
    backgroundColor: `${Colors.textDanger}22`,
    borderWidth: 1,
    borderColor: Colors.textDanger,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  dangerButtonText: {
    color: Colors.textDanger,
    fontSize: 14,
    fontWeight: '600',
  },
  aboutVersion: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginBottom: 4,
  },
  aboutSlogan: {
    fontSize: 13,
    color: Colors.textMuted,
  },
});

export default SettingsScreen;
