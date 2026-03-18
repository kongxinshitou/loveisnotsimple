// 会话列表页面：管理多个聊天对象会话（V0.2 新增）
import React, {useEffect, useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  StatusBar,
  BackHandler,
  Modal,
  Alert,
} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {RootStackParamList} from '../navigation/AppNavigator';
import Colors from '../theme/colors';
import useSessionStore from '../store/useSessionStore';
import useSettingsStore from '../store/useSettingsStore';
import {Session} from '../types';
import ConfirmModal from '../components/ConfirmModal';

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'SessionList'>;
};

const SessionListScreen: React.FC<Props> = ({navigation}) => {
  const insets = useSafeAreaInsets();
  const sessions = useSessionStore(s => s.sessions);
  const loadSessions = useSessionStore(s => s.loadSessions);
  const createSession = useSessionStore(s => s.createSession);
  const deleteSession = useSessionStore(s => s.deleteSession);
  const setCurrentSession = useSessionStore(s => s.setCurrentSession);
  const loadConfig = useSettingsStore(s => s.loadConfig);

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newName, setNewName] = useState('');
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);

  useEffect(() => {
    loadSessions();
    loadConfig();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 安卓返回键：退出 App
  useEffect(() => {
    const handler = BackHandler.addEventListener('hardwareBackPress', () => {
      BackHandler.exitApp();
      return true;
    });
    return () => handler.remove();
  }, []);

  // 创建新会话并跳转
  const handleCreate = () => {
    const name = newName.trim() || '新会话';
    const session = createSession(name);
    setNewName('');
    setShowCreateModal(false);
    navigation.navigate('Home', {sessionId: session.id});
  };

  // 进入会话
  const handleEnterSession = (session: Session) => {
    setCurrentSession(session.id);
    navigation.navigate('Home', {sessionId: session.id});
  };

  // 删除会话（长按触发）
  const handleLongPress = (sessionId: string) => {
    setDeleteTarget(sessionId);
  };

  const handleConfirmDelete = async () => {
    if (deleteTarget) {
      await deleteSession(deleteTarget);
      setDeleteTarget(null);
    }
  };

  // 格式化时间
  const formatTime = (ts: number) => {
    const d = new Date(ts);
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - d.getTime()) / 86400000);
    if (diffDays === 0) {
      return `今天 ${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`;
    } else if (diffDays === 1) {
      return '昨天';
    } else if (diffDays < 7) {
      return `${diffDays}天前`;
    }
    return `${d.getMonth() + 1}/${d.getDate()}`;
  };

  const renderSession = ({item}: {item: Session}) => (
    <TouchableOpacity
      style={styles.sessionCard}
      onPress={() => handleEnterSession(item)}
      onLongPress={() => handleLongPress(item.id)}
      activeOpacity={0.75}>
      {/* 会话头像（用名字首字） */}
      <View style={styles.avatar}>
        <Text style={styles.avatarText}>
          {item.femaleProfile.name ? item.femaleProfile.name.slice(0, 1) : item.name.slice(0, 1)}
        </Text>
      </View>

      <View style={styles.sessionInfo}>
        <View style={styles.sessionRow}>
          <Text style={styles.sessionName}>{item.name}</Text>
          <Text style={styles.sessionTime}>{formatTime(item.updatedAt)}</Text>
        </View>
        <View style={styles.sessionRow}>
          <Text style={styles.sessionPreview} numberOfLines={1}>
            {item.entries.length > 0
              ? item.entries[0].chatPreview
              : '还没有分析记录'}
          </Text>
          <View style={styles.badgeRow}>
            {item.femalePortrait && (
              <View style={styles.portraitBadge}>
                <Text style={styles.portraitBadgeText}>画像</Text>
              </View>
            )}
            {item.entries.length > 0 && (
              <Text style={styles.countText}>{item.entries.length}条</Text>
            )}
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.wrapper}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.bgPrimary} />

      {/* Header */}
      <View style={[styles.header, {paddingTop: insets.top > 0 ? insets.top : 12}]}>
        <View>
          <Text style={styles.headerTitle}>情话大师</Text>
          <Text style={styles.headerSub}>选择或新建一个聊天对象</Text>
        </View>
        <TouchableOpacity
          onPress={() => navigation.navigate('Settings')}
          style={styles.settingsBtn}
          activeOpacity={0.7}>
          <Text style={styles.settingsIcon}>⚙️</Text>
        </TouchableOpacity>
      </View>

      {/* 会话列表 */}
      {sessions.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyIcon}>💬</Text>
          <Text style={styles.emptyTitle}>还没有聊天对象</Text>
          <Text style={styles.emptyDesc}>点击右下角 + 按钮新建一个吧</Text>
        </View>
      ) : (
        <FlatList<Session>
          data={sessions}
          keyExtractor={item => item.id}
          renderItem={renderSession}
          contentContainerStyle={[
            styles.listContent,
            {paddingBottom: insets.bottom + 80},
          ]}
          showsVerticalScrollIndicator={false}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
        />
      )}

      {/* 新建会话 FAB */}
      <TouchableOpacity
        style={[styles.fab, {bottom: insets.bottom + 24}]}
        onPress={() => setShowCreateModal(true)}
        activeOpacity={0.85}>
        <Text style={styles.fabText}>+</Text>
      </TouchableOpacity>

      {/* 新建会话弹窗 */}
      <Modal
        visible={showCreateModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowCreateModal(false)}>
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowCreateModal(false)}>
          <TouchableOpacity
            style={styles.createModal}
            activeOpacity={1}
            onPress={() => {}}>
            <Text style={styles.createModalTitle}>新建聊天对象</Text>
            <Text style={styles.createModalLabel}>她叫什么？</Text>
            <TextInput
              style={styles.createModalInput}
              placeholder="输入昵称，如：小红、晓晓..."
              placeholderTextColor={Colors.textMuted}
              value={newName}
              onChangeText={setNewName}
              maxLength={20}
              autoFocus
              returnKeyType="done"
              onSubmitEditing={handleCreate}
            />
            <View style={styles.createModalActions}>
              <TouchableOpacity
                style={styles.cancelBtn}
                onPress={() => {
                  setNewName('');
                  setShowCreateModal(false);
                }}
                activeOpacity={0.8}>
                <Text style={styles.cancelBtnText}>取消</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.confirmBtn}
                onPress={handleCreate}
                activeOpacity={0.8}>
                <Text style={styles.confirmBtnText}>开始聊天</Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>

      {/* 删除确认弹窗 */}
      <ConfirmModal
        visible={!!deleteTarget}
        title="删除会话"
        message="确认删除该会话及其所有历史记录？操作不可撤销。"
        confirmText="删除"
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeleteTarget(null)}
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
    paddingHorizontal: 20,
    paddingBottom: 16,
    backgroundColor: Colors.bgPrimary,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: Colors.textPrimary,
  },
  headerSub: {
    fontSize: 12,
    color: Colors.textMuted,
    marginTop: 2,
  },
  settingsBtn: {
    padding: 4,
  },
  settingsIcon: {
    fontSize: 22,
  },
  listContent: {
    paddingTop: 8,
  },
  sessionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: Colors.bgSecondary,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.accentPink,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  avatarText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.textPrimary,
  },
  sessionInfo: {
    flex: 1,
  },
  sessionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  sessionName: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  sessionTime: {
    fontSize: 12,
    color: Colors.textMuted,
  },
  sessionPreview: {
    fontSize: 13,
    color: Colors.textSecondary,
    flex: 1,
    marginRight: 8,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  portraitBadge: {
    backgroundColor: Colors.accentPurple + '33',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  portraitBadgeText: {
    fontSize: 10,
    color: Colors.accentPurple,
    fontWeight: '600',
  },
  countText: {
    fontSize: 12,
    color: Colors.textMuted,
  },
  separator: {
    height: 1,
    backgroundColor: Colors.divider,
    marginLeft: 76,
  },
  empty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  emptyIcon: {
    fontSize: 56,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.textSecondary,
    marginBottom: 8,
  },
  emptyDesc: {
    fontSize: 14,
    color: Colors.textMuted,
    textAlign: 'center',
  },
  fab: {
    position: 'absolute',
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.accentPink,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 6,
    shadowColor: Colors.accentPink,
    shadowOffset: {width: 0, height: 3},
    shadowOpacity: 0.4,
    shadowRadius: 6,
  },
  fabText: {
    fontSize: 28,
    color: Colors.textPrimary,
    fontWeight: '300',
    lineHeight: 32,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  createModal: {
    backgroundColor: Colors.bgCard,
    borderRadius: 20,
    padding: 24,
    width: '100%',
  },
  createModalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.textPrimary,
    marginBottom: 16,
    textAlign: 'center',
  },
  createModalLabel: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginBottom: 8,
  },
  createModalInput: {
    backgroundColor: Colors.bgInput,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    color: Colors.textPrimary,
    marginBottom: 20,
  },
  createModalActions: {
    flexDirection: 'row',
    gap: 12,
  },
  cancelBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
  },
  cancelBtnText: {
    color: Colors.textSecondary,
    fontSize: 15,
  },
  confirmBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: Colors.accentPink,
    alignItems: 'center',
  },
  confirmBtnText: {
    color: Colors.textPrimary,
    fontSize: 15,
    fontWeight: '600',
  },
});

export default SessionListScreen;
