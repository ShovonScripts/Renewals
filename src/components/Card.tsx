import { StyleSheet, View, type ViewProps } from 'react-native';
import { useTheme } from '@/hooks/use-theme';
import { Spacing } from '@/constants/theme';

export type CardProps = ViewProps & {
  variant?: 'default' | 'element';
};

export function Card({ style, variant = 'default', children, ...rest }: CardProps) {
  const theme = useTheme();

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: variant === 'element' ? theme.backgroundElement : theme.background,
          borderColor: theme.backgroundSelected,
        },
        style,
      ]}
      {...rest}
    >
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 12,
    padding: Spacing.three,
    borderWidth: 1,
    marginVertical: Spacing.one,
  },
});
