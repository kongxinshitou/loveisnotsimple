// 对话分析摘要卡片
import React from 'react';
import {View, Text, StyleSheet} from 'react-native';
import Colors from '../theme/colors';

interface Props {
  analysis: string;
}

const AnalysisHeader: React.FC<Props> = ({analysis}) => {
  return (
    <View style={styles.card}>
      <Text style={styles.title}>📊 对话分析</Text>
      <View style={styles.divider} />
      <Text style={styles.content}>{analysis}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.bgCard,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.textPrimary,
    marginBottom: 10,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.divider,
    marginBottom: 10,
  },
  content: {
    fontSize: 14,
    color: Colors.textSecondary,
    lineHeight: 22,
  },
});

export default AnalysisHeader;
