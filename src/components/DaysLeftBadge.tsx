import { StyleSheet, View } from 'react-native';
import { ThemedText } from './themed-text';
import { useT } from '@/i18n';

export interface DaysLeftBadgeProps {
  daysLeft: number;
}

export function DaysLeftBadge({ daysLeft }: DaysLeftBadgeProps) {
  const { t } = useT();

  let text = '';
  let bgColor = '#E0E0E0';
  let textColor = '#000000';

  if (daysLeft < 0) {
    const abs = Math.abs(daysLeft);
    text = abs === 1 ? t('common.overdueDay') : t('common.overdueDays', { count: abs });
    bgColor = '#FEE2E2';
    textColor = '#991B1B';
  } else if (daysLeft === 0) {
    text = t('common.today');
    bgColor = '#FEF3C7';
    textColor = '#92400E';
  } else if (daysLeft <= 7) {
    text = daysLeft === 1 ? t('common.dayLeft') : t('common.daysLeft', { count: daysLeft });
    bgColor = '#FEF9C3';
    textColor = '#854D0E';
  } else {
    text = t('common.daysLeft', { count: daysLeft });
    bgColor = '#DCFCE7';
    textColor = '#166534';
  }

  return (
    <View style={[styles.badge, { backgroundColor: bgColor }]}>
      <ThemedText style={[styles.text, { color: textColor }]}>{text}</ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  text: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
});
