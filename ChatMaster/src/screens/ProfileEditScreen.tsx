// 人设编辑页面：为当前会话填写男方和女方的基本信息（V0.2 新增）
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
import useSessionStore, {DEFAULT_PROFILE} from '../store/useSessionStore';
import {CharacterProfile} from '../types';

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'ProfileEdit'>;
  route: RouteProp<RootStackParamList, 'ProfileEdit'>;
};

// 单个人设表单
interface ProfileFormProps {
  title: string;
  color: string;
  profile: CharacterProfile;
  onChange: (field: keyof CharacterProfile, value: string) => void;
}

const ProfileForm: React.FC<ProfileFormProps> = ({title, color, profile, onChange}) => {
  const fields: Array<{key: keyof CharacterProfile; label: string; placeholder: string}> = [
    {key: 'name', label: '昵称', placeholder: '叫什么名字？'},
    {key: 'age', label: '年龄', placeholder: '大概多大？'},
    {key: 'personality', label: '性格特点', placeholder: '如：活泼开朗、内敛安静...'},
    {key: 'background', label: '职业/背景', placeholder: '如：学生、设计师、在北京工作...'},
    {key: 'interests', label: '兴趣爱好', placeholder: '如：喜欢旅游、追剧、打游戏...'},
    {key: 'notes', label: '其他备注', placeholder: '其他希望 AI 了解的信息...'},
  ];

  return (
    <View style={styles.formCard}>
      <View style={[styles.formHeader, {borderLeftColor: color}]}>
        <Text style={[styles.formTitle, {color}]}>{title}</Text>
        <Text style={styles.formHint}>（选填，填写越详细，回复越精准）</Text>
      </View>
      {fields.map(({key, label, placeholder}) => (
        <View key={key} style={styles.fieldRow}>
          <Text style={styles.fieldLabel}>{label}</Text>
          <TextInput
            style={[
              styles.fieldInput,
              key === 'notes' || key === 'personality' ? styles.fieldInputMulti : null,
            ]}
            placeholder={placeholder}
            placeholderTextColor={Colors.textMuted}
            value={profile[key]}
            onChangeText={val => onChange(key, val)}
            multiline={key === 'notes' || key === 'personality'}
            numberOfLines={key === 'notes' || key === 'personality' ? 3 : 1}
            textAlignVertical={key === 'notes' || key === 'personality' ? 'top' : 'center'}
          />
        </View>
      ))}
    </View>
  );
};

const ProfileEditScreen: React.FC<Props> = ({navigation, route}) => {
  const insets = useSafeAreaInsets();
  const {sessionId} = route.params;
  const sessions = useSessionStore(s => s.sessions);
  const updateSession = useSessionStore(s => s.updateSession);

  const session = sessions.find(s => s.id === sessionId);

  const [maleProfile, setMaleProfile] = useState<CharacterProfile>(
    session?.maleProfile ?? {...DEFAULT_PROFILE},
  );
  const [femaleProfile, setFemaleProfile] = useState<CharacterProfile>(
    session?.femaleProfile ?? {...DEFAULT_PROFILE},
  );

  // 安卓返回键
  useEffect(() => {
    const handler = BackHandler.addEventListener('hardwareBackPress', () => {
      navigation.goBack();
      return true;
    });
    return () => handler.remove();
  }, [navigation]);

  const handleMaleChange = (field: keyof CharacterProfile, value: string) => {
    setMaleProfile(prev => ({...prev, [field]: value}));
  };

  const handleFemaleChange = (field: keyof CharacterProfile, value: string) => {
    setFemaleProfile(prev => ({...prev, [field]: value}));
  };

  const handleSave = async () => {
    await updateSession(sessionId, {maleProfile, femaleProfile});
    ToastAndroid.show('人设已保存', ToastAndroid.SHORT);
    navigation.goBack();
  };

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
        <Text style={styles.headerTitle}>人设编辑</Text>
        <TouchableOpacity onPress={handleSave} activeOpacity={0.7} style={styles.saveButton}>
          <Text style={styles.saveText}>保存</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.content, {paddingBottom: insets.bottom + 32}]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}>

        {/* 说明文字 */}
        <View style={styles.tipCard}>
          <Text style={styles.tipText}>
            💡 填写人设后，AI 将根据你的特点和她的性格定制更精准的回复策略
          </Text>
        </View>

        {/* 男方人设 */}
        <ProfileForm
          title="👤 我的信息（男方）"
          color={Colors.accentPurple}
          profile={maleProfile}
          onChange={handleMaleChange}
        />

        {/* 女方人设 */}
        <ProfileForm
          title={`💗 她的信息（${session.name}）`}
          color={Colors.accentPink}
          profile={femaleProfile}
          onChange={handleFemaleChange}
        />

        {/* 保存按钮 */}
        <TouchableOpacity style={styles.saveBtn} onPress={handleSave} activeOpacity={0.85}>
          <Text style={styles.saveBtnText}>💾 保存人设</Text>
        </TouchableOpacity>
      </ScrollView>
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
  saveButton: {
    width: 60,
    alignItems: 'flex-end',
  },
  saveText: {
    color: Colors.accentGreen,
    fontSize: 15,
    fontWeight: '600',
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
    marginBottom: 16,
    borderLeftWidth: 3,
    borderLeftColor: Colors.accentPurple,
  },
  tipText: {
    fontSize: 13,
    color: Colors.textSecondary,
    lineHeight: 20,
  },
  formCard: {
    backgroundColor: Colors.bgCard,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },
  formHeader: {
    borderLeftWidth: 3,
    paddingLeft: 10,
    marginBottom: 16,
  },
  formTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 2,
  },
  formHint: {
    fontSize: 11,
    color: Colors.textMuted,
  },
  fieldRow: {
    marginBottom: 12,
  },
  fieldLabel: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginBottom: 6,
    fontWeight: '500',
  },
  fieldInput: {
    backgroundColor: Colors.bgInput,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: Colors.textPrimary,
    minHeight: 42,
  },
  fieldInputMulti: {
    minHeight: 72,
    lineHeight: 20,
  },
  saveBtn: {
    backgroundColor: Colors.accentPink,
    borderRadius: 27,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  saveBtnText: {
    color: Colors.textPrimary,
    fontSize: 16,
    fontWeight: '700',
  },
});

export default ProfileEditScreen;
