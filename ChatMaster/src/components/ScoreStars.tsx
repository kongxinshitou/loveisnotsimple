// 星级评分组件（1-5星）
import React from 'react';
import {View, Text, StyleSheet} from 'react-native';
import Colors from '../theme/colors';

interface Props {
  score: number; // 1-5
}

const ScoreStars: React.FC<Props> = ({score}) => {
  return (
    <View style={styles.container}>
      {[1, 2, 3, 4, 5].map(i => (
        <Text key={i} style={[styles.star, i <= score ? styles.filled : styles.empty]}>
          ★
        </Text>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
  },
  star: {
    fontSize: 16,
    marginRight: 1,
  },
  filled: {
    color: Colors.accentGold,
  },
  empty: {
    color: Colors.textMuted,
  },
});

export default ScoreStars;
