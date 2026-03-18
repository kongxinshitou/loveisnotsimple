// 风格标签单选组
import React from 'react';
import {View, StyleSheet} from 'react-native';
import StyleChip from './StyleChip';
import {ReplyStyle} from '../types';

const STYLE_KEYS: ReplyStyle[] = ['flirty', 'humor', 'affectionate', 'high_value'];

interface Props {
  selected: ReplyStyle;
  onSelect: (style: ReplyStyle) => void;
}

const StyleChipGroup: React.FC<Props> = ({selected, onSelect}) => {
  return (
    <View style={styles.container}>
      {STYLE_KEYS.map(key => (
        <StyleChip
          key={key}
          styleKey={key}
          selected={selected === key}
          onPress={onSelect}
        />
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 8,
  },
});

export default StyleChipGroup;
