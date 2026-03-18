// 历史列表项（可展开/收起完整分析结果）
import React, {useState} from 'react';
import {View, Text, StyleSheet, TouchableOpacity} from 'react-native';
import Colors from '../theme/colors';
import {HistoryEntry} from '../types';
import {STYLE_CONFIG} from './StyleChip';
import SuggestionCard from './SuggestionCard';
import AnalysisHeader from './AnalysisHeader';

interface Props {
  entry: HistoryEntry;
}

const HistoryItem: React.FC<Props> = ({entry}) => {
  const [expanded, setExpanded] = useState(false);
  const styleInfo = STYLE_CONFIG[entry.style];
  const date = new Date(entry.createdAt).toLocaleDateString('zh-CN', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.header} onPress={() => setExpanded(!expanded)} activeOpacity={0.8}>
        <View style={styles.headerLeft}>
          <View style={[styles.styleTag, {borderColor: styleInfo.color}]}>
            <Text style={[styles.styleTagText, {color: styleInfo.color}]}>
              {styleInfo.emoji} {styleInfo.label}
            </Text>
          </View>
          <Text style={styles.date}>{date}</Text>
        </View>
        <Text style={styles.arrow}>{expanded ? '▲' : '▼'}</Text>
      </TouchableOpacity>
      <Text style={styles.preview} numberOfLines={expanded ? undefined : 2}>
        {entry.chatPreview}
      </Text>
      {expanded && (
        <View style={styles.detail}>
          <View style={styles.divider} />
          {entry.result.overallAnalysis ? (
            <AnalysisHeader analysis={entry.result.overallAnalysis} />
          ) : null}
          {entry.result.suggestions.map(s => (
            <SuggestionCard key={s.index} suggestion={s} index={s.index - 1} />
          ))}
          {entry.result.suggestions.length === 0 && entry.result.rawText ? (
            <Text style={styles.rawText}>{entry.result.rawText}</Text>
          ) : null}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
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
    marginBottom: 8,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  styleTag: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  styleTagText: {
    fontSize: 12,
    fontWeight: '600',
  },
  date: {
    fontSize: 12,
    color: Colors.textMuted,
  },
  arrow: {
    color: Colors.textMuted,
    fontSize: 12,
  },
  preview: {
    fontSize: 13,
    color: Colors.textSecondary,
    lineHeight: 20,
  },
  detail: {
    marginTop: 12,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.divider,
    marginBottom: 12,
  },
  rawText: {
    fontSize: 14,
    color: Colors.textSecondary,
    lineHeight: 22,
  },
});

export default HistoryItem;
