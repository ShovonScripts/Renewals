import { Pressable, StyleSheet, type PressableProps } from 'react-native';
import { ThemedText } from './themed-text';
import { useTheme } from '@/hooks/use-theme';
import { Spacing } from '@/constants/theme';

export type ButtonProps = PressableProps & {
  title: string;
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  fullWidth?: boolean;
};

export function Button({ title, variant = 'primary', fullWidth = false, style, disabled, ...rest }: ButtonProps) {
  const theme = useTheme();

  const getBackgroundColor = () => {
    if (disabled) return theme.backgroundSelected;
    if (variant === 'primary') return theme.text;
    if (variant === 'secondary') return theme.backgroundElement;
    if (variant === 'danger') return '#D32F2F';
    return 'transparent';
  };

  const getTextColor = () => {
    if (disabled) return theme.textSecondary;
    if (variant === 'primary') return theme.background;
    if (variant === 'secondary' || variant === 'ghost') return theme.text;
    if (variant === 'danger') return '#FFFFFF';
    return theme.text;
  };

  return (
    <Pressable
      style={({ pressed }) => [
        styles.button,
        {
          backgroundColor: getBackgroundColor(),
          opacity: pressed ? 0.8 : 1,
          width: fullWidth ? '100%' : 'auto',
        },
        style,
      ] as any}
      disabled={disabled}
      {...rest}
    >
      <ThemedText style={[styles.text, { color: getTextColor() }]}>{title}</ThemedText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    paddingVertical: Spacing.two,
    paddingHorizontal: Spacing.three,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: Spacing.half,
    minHeight: 44,
  },
  text: {
    fontWeight: '600',
    fontSize: 16,
  },
});
