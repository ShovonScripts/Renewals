import { Pressable, StyleSheet, type PressableProps } from 'react-native';
import { ThemedText } from './themed-text';
import { useTheme } from '@/hooks/use-theme';
import { Spacing } from '@/constants/theme';

export type ChipProps = PressableProps & {
  label: string;
  selected?: boolean;
  color?: string;
};

export function Chip({ label, selected = false, color, style, ...rest }: ChipProps) {
  const theme = useTheme();

  return (
    <Pressable
      style={({ pressed }) => [
        styles.chip,
        {
          backgroundColor: selected ? (color || theme.text) : theme.backgroundElement,
          borderColor: color || theme.backgroundSelected,
          opacity: pressed ? 0.8 : 1,
        },
        style,
      ] as any}
      {...rest}
    >
      <ThemedText
        style={[
          styles.text,
          { color: selected ? (color ? '#FFFFFF' : theme.background) : theme.text },
        ]}
      >
        {label}
      </ThemedText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  chip: {
    paddingHorizontal: Spacing.two,
    paddingVertical: Spacing.one,
    borderRadius: 16,
    borderWidth: 1,
    margin: 4,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 36,
  },
  text: {
    fontSize: 14,
    fontWeight: '500',
  },
});
