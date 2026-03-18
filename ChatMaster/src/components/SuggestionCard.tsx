// 回复建议卡片（含入场动画 + 复制按钮）
import React, {useEffect, useRef} from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  TouchableOpacity,
  ToastAndroid,
} from 'react-native';
import Clipboard from '@react-native-clipboard/clipboard';
import Colors from '../theme/colors';
import {Suggestion} from '../types';
import ScoreStars from './ScoreStars';

interface Props {
  suggestion: Suggestion;
  index: number; // 用于入场动画延迟
}

const SuggestionCard: React.FC<Props> = ({suggestion, index}) => {
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(30)).current;

  // 入场动画：fadeIn + translateY(30→0)，挂载时执行一次
  useEffect(() => {
    const anim = Animated.parallel([
      Animated.timing(opacity, {
        toValue: 1,
        duration: 400,
        delay: index * 150,
        useNativeDriver: true,
      }),
      Animated.timing(translateY, {
        toValue: 0,
        duration: 400,
        delay: index * 150,
        useNativeDriver: true,
      }),
    ]);
    anim.start();
    return () => anim.stop();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleCopy = () => {
    Clipboard.setString(suggestion.replyText);
    ToastAndroid.show('已复制到剪贴板', ToastAndroid.SHORT);
  };

  return (
    <Animated.View style={[styles.card, {opacity, transform: [{translateY}]}]}>
      {/* 卡片头部：序号 + 评分 */}
      <View style={styles.header}>
        <Text style={styles.index}>#{suggestion.index}</Text>
        <ScoreStars score={suggestion.score} />
      </View>
      <View style={styles.divider} />
      {/* 回复内容 */}
      <Text style={styles.replyText}>{suggestion.replyText}</Text>
      {/* 风格标签 */}
      {suggestion.styleTags.length > 0 && (
        <View style={styles.tagsContainer}>
          {suggestion.styleTags.map((tag, i) => (
            <View key={i} style={styles.tag}>
              <Text style={styles.tagText}>{tag}</Text>
            </View>
          ))}
        </View>
      )}
      {/* 策略解析 */}
      {suggestion.analysis ? (
        <Text style={styles.analysis}>策略：{suggestion.analysis}</Text>
      ) : null}
      {/* 复制按钮 */}
      <TouchableOpacity style={styles.copyButton} onPress={handleCopy} activeOpacity={0.8}>
        <Text style={styles.copyText}>📋 复制</Text>
      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.bgCard,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  index: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.accentPink,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.divider,
    marginBottom: 12,
  },
  replyText: {
    fontSize: 16,
    color: Colors.textPrimary,
    fontWeight: '600',
    lineHeight: 24,
    marginBottom: 10,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 10,
  },
  tag: {
    backgroundColor: `${Colors.accentPurple}33`,
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
    marginRight: 6,
    marginBottom: 4,
  },
  tagText: {
    fontSize: 12,
    color: Colors.accentPurple,
  },
  analysis: {
    fontSize: 13,
    color: Colors.textSecondary,
    lineHeight: 20,
    marginBottom: 12,
  },
  copyButton: {
    alignSelf: 'flex-end',
    backgroundColor: Colors.bgElevated,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 12,
  },
  copyText: {
    fontSize: 13,
    color: Colors.textSecondary,
  },
});

export default SuggestionCard;
