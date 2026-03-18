// 导航栈配置（V0.2 新增多会话路由）
import React, {useEffect, useState} from 'react';
import {NavigationContainer} from '@react-navigation/native';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {SafeAreaProvider} from 'react-native-safe-area-context';

import SplashScreen from '../screens/SplashScreen';
import SessionListScreen from '../screens/SessionListScreen';
import HomeScreen from '../screens/HomeScreen';
import HistoryScreen from '../screens/HistoryScreen';
import SettingsScreen from '../screens/SettingsScreen';
import ProfileEditScreen from '../screens/ProfileEditScreen';
import PortraitScreen from '../screens/PortraitScreen';
import Colors from '../theme/colors';

// 路由参数类型
export type RootStackParamList = {
  Splash: undefined;
  SessionList: undefined;
  Home: {sessionId: string};
  History: {sessionId: string};
  Settings: undefined;
  ProfileEdit: {sessionId: string};
  Portrait: {sessionId: string};
};

const Stack = createNativeStackNavigator<RootStackParamList>();

const AppNavigator: React.FC = () => {
  const [initialRoute, setInitialRoute] = useState<'Splash' | 'SessionList' | null>(null);

  useEffect(() => {
    // 判断是否首次启动
    const checkFirstLaunch = async () => {
      try {
        const hasLaunched = await AsyncStorage.getItem('hasLaunched');
        setInitialRoute(hasLaunched ? 'SessionList' : 'Splash');
      } catch {
        setInitialRoute('SessionList');
      }
    };
    checkFirstLaunch();
  }, []);

  if (!initialRoute) {
    return null;
  }

  return (
    <SafeAreaProvider>
      <NavigationContainer>
        <Stack.Navigator
          initialRouteName={initialRoute}
          screenOptions={{
            headerShown: false,
            contentStyle: {backgroundColor: Colors.bgSecondary},
          }}>
          <Stack.Screen name="Splash" component={SplashScreen} />
          <Stack.Screen name="SessionList" component={SessionListScreen} />
          <Stack.Screen name="Home" component={HomeScreen} />
          <Stack.Screen name="History" component={HistoryScreen} />
          <Stack.Screen name="Settings" component={SettingsScreen} />
          <Stack.Screen name="ProfileEdit" component={ProfileEditScreen} />
          <Stack.Screen name="Portrait" component={PortraitScreen} />
        </Stack.Navigator>
      </NavigationContainer>
    </SafeAreaProvider>
  );
};

export default AppNavigator;
