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
    bgColor = '#FFCDD2';
    textColor = '#B71C1C';
  } else if (daysLeft === 0) {
    text = t('common.today');
    bgColor = '#FFE0B2';
    textColor = '#E65100';
  } else if (daysLeft <= 7) {
    text = daysLeft === 1 ? t('common.dayLeft') : t('common.daysLeft', { count: daysLeft });
    bgColor = '#FFF9C4';
    textColor = '#F57F17';
  } else {
    text = t('common.daysLeft', { count: daysLeft });
    bgColor = '#E8F5E9';
    textColor = '#2E7D32';
  }

  return (
    <View style={[styles.badge, { backgroundColor: bgColor }]}>
      <ThemedText style={[styles.text, { color: textColor }]}>{text}</ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    alignSelf: 'flex-start',
  },
  text: {
    fontSize: 12,
    fontWeight: '700',
  },
});
