// 单个风格标签组件
import React, {useRef} from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  Animated,
  ViewStyle,
} from 'react-native';
import Colors from '../theme/colors';
import {ReplyStyle} from '../types';

// 风格配置
export const STYLE_CONFIG: Record<ReplyStyle, {emoji: string; label: string; color: string}> = {
  flirty: {emoji: '🔥', label: '挑逗', color: Colors.chipFlirty},
  humor: {emoji: '😏', label: '幽默', color: Colors.chipHumor},
  affectionate: {emoji: '💗', label: '深情', color: Colors.chipAffectionate},
  high_value: {emoji: '👑', label: '高价值', color: Colors.chipHighValue},
};

interface Props {
  styleKey: ReplyStyle;
  selected: boolean;
  onPress: (key: ReplyStyle) => void;
  style?: ViewStyle;
}

const StyleChip: React.FC<Props> = ({styleKey, selected, onPress, style}) => {
  const scale = useRef(new Animated.Value(1)).current;
  const {emoji, label, color} = STYLE_CONFIG[styleKey];

  const handlePressIn = () => {
    Animated.spring(scale, {toValue: 1.05, useNativeDriver: true}).start();
  };

  const handlePressOut = () => {
    Animated.spring(scale, {toValue: 1, useNativeDriver: true}).start();
  };

  return (
    <Animated.View style={[{transform: [{scale}]}, style]}>
      <TouchableOpacity
        style={[
          styles.chip,
          selected
            ? {backgroundColor: color, borderColor: color}
            : {borderColor: color},
        ]}
        onPress={() => onPress(styleKey)}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        activeOpacity={1}>
        <Text style={[styles.text, selected ? styles.textSelected : {color}]}>
          {emoji} {label}
        </Text>
      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1.5,
    marginRight: 8,
    marginBottom: 8,
  },
  text: {
    fontSize: 13,
    fontWeight: '600',
  },
  textSelected: {
    color: Colors.textPrimary,
  },
});

export default StyleChip;
