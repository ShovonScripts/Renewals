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
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 1 },
          shadowOpacity: 0.05,
          shadowRadius: 3,
          elevation: 2,
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
    borderRadius: 14,
    padding: Spacing.three,
    borderWidth: 1,
    marginVertical: Spacing.one,
  },
});
