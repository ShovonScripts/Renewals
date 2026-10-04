import { useEffect, useState } from 'react';
import { StyleSheet, View, FlatList, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import Ionicons from '@expo/vector-icons/Ionicons';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Card } from '@/components/Card';
import { EmptyState } from '@/components/EmptyState';
import { DaysLeftBadge } from '@/components/DaysLeftBadge';
import { CategoryIcon } from '@/components/CategoryIcon';
import { useStore } from '@/store/store';
import { useT } from '@/i18n';
import { groupItems } from '@/domain/buckets';
import { daysLeft } from '@/domain/dates';

export default function UpcomingScreen() {
  const { t, formatDate } = useT();
  const items = useStore((state) => state.items);
  const settings = useStore((state) => state.settings);
  const [showPermissionBanner, setShowPermissionBanner] = useState(false);

  useEffect(() => {
    if (!settings.hasCompletedOnboarding) {
      router.replace('/onboarding');
      return;
    }

    async function checkPermission() {
      try {
        // eslint-disable-next-line @typescript-eslint/no-require-imports
        const Notifications = require('expo-notifications');
        const { status } = await Notifications.getPermissionsAsync();
        if (status !== 'granted') {
          setShowPermissionBanner(true);
        }
      } catch {
        // Notifications not available in Expo Go
      }
    }
    checkPermission();
  }, [settings.hasCompletedOnboarding]);

  const activeItems = items.filter((i) => i.status === 'active');
  const groups = groupItems(activeItems);
  const overdueCount = activeItems.filter((i) => (daysLeft(i.expiresOn) ?? 0) < 0).length;

  const bucketTitles: Record<string, string> = {
    overdue: t('bucket.overdue'),
    today: t('bucket.today'),
    week: t('bucket.next7'),
    month: t('bucket.next30'),
    later: t('bucket.later'),
  };

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        {showPermissionBanner ? (
          <Pressable style={styles.banner} onPress={() => router.push('/help-reminders')}>
            <Ionicons name="notifications-off-outline" size={20} color="#991B1B" style={styles.bannerIcon} />
            <ThemedText style={styles.bannerText}>{t('home.permissionBanner')}</ThemedText>
            <Ionicons name="chevron-forward" size={16} color="#991B1B" />
          </Pressable>
        ) : null}

        {activeItems.length === 0 ? (
          <EmptyState
            icon="calendar-outline"
            title={t('home.emptyTitle')}
            subtitle={t('home.emptySubtitle')}
            actionTitle={t('common.add')}
            onAction={() => router.push('/item/new')}
          />
        ) : (
          <FlatList
            data={groups}
            keyExtractor={(group) => group.bucket}
            contentContainerStyle={styles.listContent}
            ListHeaderComponent={
              <Card style={styles.heroCard}>
                <View style={styles.heroRow}>
                  <View>
                    <ThemedText type="small" themeColor="textSecondary">Overview</ThemedText>
                    <ThemedText type="subtitle" style={styles.heroTitle}>
                      {activeItems.length} {activeItems.length === 1 ? 'Item Tracked' : 'Items Tracked'}
                    </ThemedText>
                  </View>
                  {overdueCount > 0 ? (
                    <View style={styles.heroBadge}>
                      <ThemedText style={styles.heroBadgeText}>{overdueCount} Overdue</ThemedText>
                    </View>
                  ) : (
                    <View style={[styles.heroBadge, { backgroundColor: '#DCFCE7' }]}>
                      <ThemedText style={[styles.heroBadgeText, { color: '#166534' }]}>All Clear</ThemedText>
                    </View>
                  )}
                </View>
              </Card>
            }
            renderItem={({ item: group }) => (
              <View style={styles.section}>
                <ThemedText type="smallBold" style={styles.sectionTitle}>
                  {bucketTitles[group.bucket]}
                </ThemedText>
                {group.items.map((item) => {
                  const dLeft = daysLeft(item.expiresOn) ?? 0;
                  return (
                    <Pressable key={item.id} onPress={() => router.push(`/item/${item.id}`)}>
                      <Card style={styles.card}>
                        <CategoryIcon category={item.category} size={22} />
                        <View style={styles.cardInfo}>
                          <ThemedText type="smallBold" numberOfLines={1}>
                            {item.title}
                          </ThemedText>
                          <ThemedText type="small" themeColor="textSecondary">
                            {formatDate(item.expiresOn)}
                          </ThemedText>
                        </View>
                        <DaysLeftBadge daysLeft={dLeft} />
                      </Card>
                    </Pressable>
                  );
                })}
              </View>
            )}
          />
        )}

        <Pressable style={styles.fab} onPress={() => router.push('/item/new')}>
          <Ionicons name="add" size={28} color="#FFFFFF" />
        </Pressable>
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  safeArea: { flex: 1 },
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEE2E2',
    padding: 12,
    marginHorizontal: 16,
    marginTop: 8,
    borderRadius: 10,
  },
  bannerIcon: { marginRight: 8 },
  bannerText: { flex: 1, color: '#991B1B', fontSize: 13, fontWeight: '600' },
  heroCard: {
    marginHorizontal: 0,
    marginBottom: 20,
    padding: 18,
    backgroundColor: '#F0F9FF',
    borderColor: '#BAE6FD',
  },
  heroRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  heroTitle: {
    fontSize: 24,
    marginTop: 2,
    color: '#0369A1',
  },
  heroBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: '#FEE2E2',
  },
  heroBadgeText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#991B1B',
  },
  listContent: { padding: 16, paddingBottom: 80 },
  section: { marginBottom: 16 },
  sectionTitle: { marginBottom: 8, opacity: 0.7, textTransform: 'uppercase', fontSize: 12, letterSpacing: 0.5 },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  cardInfo: {
    flex: 1,
    marginHorizontal: 12,
  },
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#0284C7',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 4.65,
  },
});
