import { StyleSheet, View, FlatList, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Card } from '@/components/Card';
import { EmptyState } from '@/components/EmptyState';
import { DaysLeftBadge } from '@/components/DaysLeftBadge';
import { CategoryIcon } from '@/components/CategoryIcon';
import { useStore } from '@/store/store';
import { useT } from '@/i18n';
import { subscriptionTotals, activeSubscriptions } from '@/domain/totals';
import { daysLeft } from '@/domain/dates';

export default function SubscriptionsScreen() {
  const { t, formatDate } = useT();
  const items = useStore((state) => state.items);
  const settings = useStore((state) => state.settings);

  const subs = activeSubscriptions(items);
  const totals = subscriptionTotals(items);

  const formatAmount = (val: number) => {
    const rounded = val.toFixed(2);
    return `${settings.currencySymbol} ${rounded}`;
  };

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <Card style={styles.summaryCard}>
          <View style={styles.summaryRow}>
            <View style={styles.summaryItem}>
              <ThemedText type="small" themeColor="textSecondary">{t('subscriptions.monthlyTotal')}</ThemedText>
              <ThemedText type="subtitle" style={styles.amountText}>{formatAmount(totals.monthly)}</ThemedText>
            </View>
            <View style={styles.summaryItem}>
              <ThemedText type="small" themeColor="textSecondary">{t('subscriptions.yearlyTotal')}</ThemedText>
              <ThemedText type="subtitle" style={styles.amountText}>{formatAmount(totals.yearly)}</ThemedText>
            </View>
          </View>
        </Card>

        {subs.length === 0 ? (
          <EmptyState
            icon="repeat-outline"
            title={t('subscriptions.empty')}
            subtitle={t('subscriptions.emptySubtitle')}
          />
        ) : (
          <FlatList
            data={subs}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.listContent}
            renderItem={({ item }) => {
              const dLeft = daysLeft(item.expiresOn) ?? 0;
              const costStr = item.amount !== null ? formatAmount(item.amount) : '';
              const cycleStr = t(`billing.${item.billingCycle}` as any);

              return (
                <Pressable onPress={() => router.push(`/item/${item.id}`)}>
                  <Card style={styles.card}>
                    <CategoryIcon category={item.category} size={22} />
                    <View style={styles.cardInfo}>
                      <ThemedText type="smallBold" numberOfLines={1}>{item.title}</ThemedText>
                      <ThemedText type="small" themeColor="textSecondary">
                        {costStr} ({cycleStr}) • {formatDate(item.expiresOn)}
                      </ThemedText>
                    </View>
                    <DaysLeftBadge daysLeft={dLeft} />
                  </Card>
                </Pressable>
              );
            }}
          />
        )}
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  safeArea: { flex: 1 },
  summaryCard: {
    margin: 16,
    padding: 16,
    borderRadius: 12,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  summaryItem: {
    flex: 1,
    alignItems: 'center',
  },
  amountText: {
    fontSize: 22,
    marginTop: 4,
  },
  listContent: { paddingHorizontal: 16, paddingBottom: 24 },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  cardInfo: {
    flex: 1,
    marginHorizontal: 12,
  },
});
