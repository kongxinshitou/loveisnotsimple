// 加载遮罩（三点跳动动画）
import React, {useEffect, useRef} from 'react';
import {View, Text, StyleSheet, Animated} from 'react-native';
import Colors from '../theme/colors';

const LoadingOverlay: React.FC = () => {
  // 三个圆点各自的 translateY（分开声明，遵守 React hooks 规则）
  const dot0 = useRef(new Animated.Value(0)).current;
  const dot1 = useRef(new Animated.Value(0)).current;
  const dot2 = useRef(new Animated.Value(0)).current;
  const dots = [dot0, dot1, dot2];

  useEffect(() => {
    // 每个圆点：上升 200ms → 下落 200ms → 等待 → 循环
    // 三点总循环周期均为 900ms，初始 delay 制造波浪感
    const animations = dots.map((dot, i) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(i * 150),
          Animated.timing(dot, {
            toValue: -12,
            duration: 200,
            useNativeDriver: true,
          }),
          Animated.timing(dot, {
            toValue: 0,
            duration: 200,
            useNativeDriver: true,
          }),
          Animated.delay((2 - i) * 150 + 200),
        ]),
      ),
    );

    const parallel = Animated.parallel(animations);
    parallel.start();

    return () => {
      parallel.stop();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <View style={styles.overlay}>
      <View style={styles.container}>
        <View style={styles.dotsContainer}>
          {dots.map((dot, i) => (
            <Animated.View
              key={i}
              style={[styles.dot, {transform: [{translateY: dot}]}]}
            />
          ))}
        </View>
        <Text style={styles.text}>AI 正在为你生成最强回复...</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(13, 13, 26, 0.85)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 999,
  },
  container: {
    alignItems: 'center',
    backgroundColor: Colors.bgCard,
    padding: 32,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  dotsContainer: {
    flexDirection: 'row',
    marginBottom: 16,
    height: 40,
    alignItems: 'center',
  },
  dot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: Colors.accentPink,
    marginHorizontal: 6,
  },
  text: {
    color: Colors.textSecondary,
    fontSize: 14,
    textAlign: 'center',
  },
});

export default LoadingOverlay;
