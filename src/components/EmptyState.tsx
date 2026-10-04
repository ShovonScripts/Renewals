/* eslint-disable import/no-unresolved */
import { StyleSheet, View } from 'react-native';
import { ThemedText } from './themed-text';
import { Button } from './Button';
import { useTheme } from '@/hooks/use-theme';
import { Spacing } from '@/constants/theme';
import Ionicons from '@expo/vector-icons/Ionicons';

export interface EmptyStateProps {
  title: string;
  subtitle?: string;
  actionTitle?: string;
  onAction?: () => void;
  icon?: keyof typeof Ionicons.glyphMap;
}

export function EmptyState({ title, subtitle, actionTitle, onAction, icon = 'folder-open-outline' }: EmptyStateProps) {
  const theme = useTheme();

  return (
    <View style={styles.container}>
      <Ionicons name={icon} size={64} color={theme.textSecondary} style={styles.icon} />
      <ThemedText type="subtitle" style={styles.title}>{title}</ThemedText>
      {subtitle ? <ThemedText type="small" themeColor="textSecondary" style={styles.subtitle}>{subtitle}</ThemedText> : null}
      {actionTitle && onAction ? (
        <Button title={actionTitle} onPress={onAction} style={styles.button} />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.four,
  },
  icon: {
    marginBottom: Spacing.two,
  },
  title: {
    textAlign: 'center',
    marginBottom: Spacing.one,
    fontSize: 20,
  },
  subtitle: {
    textAlign: 'center',
    marginBottom: Spacing.three,
  },
  button: {
    marginTop: Spacing.two,
  },
});
