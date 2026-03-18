// 历史记录页面：展示指定会话的历史分析（V0.2 按会话过滤）
import React, {useState, useEffect} from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  StatusBar,
  BackHandler,
} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {RouteProp} from '@react-navigation/native';
import {RootStackParamList} from '../navigation/AppNavigator';
import Colors from '../theme/colors';
import useSessionStore from '../store/useSessionStore';
import {HistoryEntry} from '../types';
import HistoryItem from '../components/HistoryItem';
import ConfirmModal from '../components/ConfirmModal';

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'History'>;
  route: RouteProp<RootStackParamList, 'History'>;
};

const HistoryScreen: React.FC<Props> = ({navigation, route}) => {
  const insets = useSafeAreaInsets();
  const {sessionId} = route.params;

  const sessions = useSessionStore(s => s.sessions);
  const updateSession = useSessionStore(s => s.updateSession);
  const [showClearModal, setShowClearModal] = useState(false);

  const session = sessions.find(s => s.id === sessionId);
  const entries: HistoryEntry[] = session?.entries ?? [];

  // 安卓返回键正常返回上一页
  useEffect(() => {
    const handler = BackHandler.addEventListener('hardwareBackPress', () => {
      navigation.goBack();
      return true;
    });
    return () => handler.remove();
  }, [navigation]);

  const handleClearAll = async () => {
    setShowClearModal(false);
    // 清空该会话的历史记录（保留会话及人设）
    await updateSession(sessionId, {entries: []} as any);
  };

  return (
    <View style={styles.wrapper}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.bgPrimary} />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} activeOpacity={0.7} style={styles.backButton}>
          <Text style={styles.backText}>‹ 返回</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
          {session?.name ? `${session.name} · ` : ''}历史记录
        </Text>
        <TouchableOpacity
          onPress={() => setShowClearModal(true)}
          activeOpacity={0.7}
          style={styles.clearButton}
          disabled={entries.length === 0}>
          <Text style={[styles.clearText, entries.length === 0 && styles.clearTextDisabled]}>
            清空全部
          </Text>
        </TouchableOpacity>
      </View>

      {/* 历史列表 */}
      {entries.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyText}>还没有分析记录{'\n'}去首页试试吧 ✨</Text>
        </View>
      ) : (
        <FlatList<HistoryEntry>
          data={entries}
          keyExtractor={item => item.id}
          renderItem={({item}) => <HistoryItem entry={item} />}
          contentContainerStyle={[styles.listContent, {paddingBottom: insets.bottom + 16}]}
          showsVerticalScrollIndicator={false}
        />
      )}

      {/* 清空确认弹窗 */}
      <ConfirmModal
        visible={showClearModal}
        title="清空历史记录"
        message="确认清空该会话的所有历史记录？操作不可撤销。"
        confirmText="确认清空"
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
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.textPrimary,
    flex: 1,
    textAlign: 'center',
  },
  clearButton: {
    width: 60,
    alignItems: 'flex-end',
  },
  clearText: {
    color: Colors.textDanger,
    fontSize: 13,
  },
  clearTextDisabled: {
    color: Colors.textMuted,
  },
  listContent: {
    padding: 16,
  },
  empty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    color: Colors.textMuted,
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 28,
  },
});

export default HistoryScreen;
