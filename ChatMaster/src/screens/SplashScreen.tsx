// 首次启动引导页
import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  StatusBar,
  TouchableOpacity,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {RootStackParamList} from '../navigation/AppNavigator';
import Colors from '../theme/colors';

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'Splash'>;
};

const SplashScreen: React.FC<Props> = ({navigation}) => {
  const handleStart = async () => {
    try {
      await AsyncStorage.setItem('hasLaunched', 'true');
    } catch {}
    navigation.replace('SessionList');
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.bgPrimary} />
      <View style={styles.iconContainer}>
        <Text style={styles.iconText}>💬</Text>
      </View>
      <Text style={styles.title}>情话大师</Text>
      <Text style={styles.slogan}>让每一句话都充满暧昧张力</Text>
      <Text style={styles.privacy}>
        本应用不收集任何个人信息，聊天数据仅存储在您的设备本地。{'\n'}
        分析功能通过在线 AI 接口实时处理，不做云端留存。
      </Text>
      <TouchableOpacity style={styles.button} onPress={handleStart} activeOpacity={0.85}>
        <Text style={styles.buttonText}>开始使用</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.bgPrimary,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  iconContainer: {
    width: 96,
    height: 96,
    borderRadius: 24,
    backgroundColor: Colors.accentPink,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  iconText: {
    fontSize: 48,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: Colors.textPrimary,
    marginBottom: 8,
  },
  slogan: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginBottom: 48,
  },
  privacy: {
    fontSize: 12,
    color: Colors.textMuted,
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 48,
  },
  button: {
    backgroundColor: Colors.accentPink,
    paddingHorizontal: 48,
    paddingVertical: 16,
    borderRadius: 27,
    width: '100%',
    alignItems: 'center',
  },
  buttonText: {
    color: Colors.textPrimary,
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default SplashScreen;
