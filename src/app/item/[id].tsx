/* eslint-disable import/no-unresolved */
import { StyleSheet, View, ScrollView, Alert, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, router } from 'expo-router';
import Ionicons from '@expo/vector-icons/Ionicons';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { DaysLeftBadge } from '@/components/DaysLeftBadge';
import { CategoryIcon } from '@/components/CategoryIcon';
import { useStore } from '@/store/store';
import { useT } from '@/i18n';
import { CATEGORIES } from '@/constants/categories';
import { daysLeft } from '@/domain/dates';
import { resolveAttachmentUri, deleteAllItemAttachments } from '@/services/attachments';

export default function ItemDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { t, formatDate } = useT();
  const items = useStore((state) => state.items);
  const remove = useStore((state) => state.remove);
  const archive = useStore((state) => state.archive);
  const restore = useStore((state) => state.restore);

  const item = items.find((i) => i.id === id);

  if (!item) {
    return (
      <ThemedView style={styles.container}>
        <SafeAreaView style={styles.safeArea}>
          <ThemedText>Item not found</ThemedText>
        </SafeAreaView>
      </ThemedView>
    );
  }

  const dLeft = daysLeft(item.expiresOn) ?? 0;
  const categoryMeta = CATEGORIES[item.category] || CATEGORIES.other;

  const handleDelete = () => {
    Alert.alert('Delete', t('detail.deleteConfirm'), [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('common.delete'),
        style: 'destructive',
        onPress: async () => {
          await deleteAllItemAttachments(item.attachments);
          remove(item.id);
          router.back();
        },
      },
    ]);
  };

  const handleToggleArchive = () => {
    if (item.status === 'active') {
      archive(item.id);
    } else {
      restore(item.id);
    }
  };

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea} edges={['bottom']}>
        <ScrollView contentContainerStyle={styles.content}>
          <View style={styles.headerRow}>
            <CategoryIcon category={item.category} size={32} />
            <View style={styles.headerInfo}>
              <ThemedText type="subtitle" numberOfLines={2}>{item.title}</ThemedText>
              <ThemedText type="small" themeColor="textSecondary">
                {t(categoryMeta.labelKey as any)}
              </ThemedText>
            </View>
          </View>

          <Card style={styles.card}>
            <View style={styles.row}>
              <ThemedText style={styles.label}>Expiry Date</ThemedText>
              <ThemedText type="smallBold">{formatDate(item.expiresOn)}</ThemedText>
            </View>
            <View style={styles.badgeRow}>
              <DaysLeftBadge daysLeft={dLeft} />
            </View>

            {item.amount !== null ? (
              <View style={[styles.row, { marginTop: 12 }]}>
                <ThemedText style={styles.label}>Cost</ThemedText>
                <ThemedText type="smallBold">{item.amount} ({t(`billing.${item.billingCycle}` as any)})</ThemedText>
              </View>
            ) : null}

            {item.notes ? (
              <View style={[styles.row, { marginTop: 12, flexDirection: 'column', alignItems: 'flex-start' }]}>
                <ThemedText style={styles.label}>{t('common.notes')}</ThemedText>
                <ThemedText style={{ marginTop: 4 }}>{item.notes}</ThemedText>
              </View>
            ) : null}
          </Card>

          {item.attachments.length > 0 ? (
            <Card style={styles.card}>
              <ThemedText type="smallBold" style={{ marginBottom: 8 }}>Photos</ThemedText>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                {item.attachments.map((att) => (
                  <Image
                    key={att.id}
                    source={{ uri: resolveAttachmentUri(att.path) }}
                    style={styles.attachmentThumb}
                  />
                ))}
              </ScrollView>
            </Card>
          ) : null}

          {item.history.length > 0 ? (
            <Card style={styles.card}>
              <ThemedText type="smallBold" style={{ marginBottom: 8 }}>{t('detail.history')}</ThemedText>
              {item.history.map((ev) => (
                <View key={ev.id} style={styles.historyRow}>
                  <Ionicons name="checkmark-circle-outline" size={16} color="#2E7D32" />
                  <ThemedText type="small" style={{ marginLeft: 8 }}>
                    {formatDate(ev.previousExpiresOn)} → {formatDate(ev.newExpiresOn)}
                  </ThemedText>
                </View>
              ))}
            </Card>
          ) : null}

          <View style={styles.actions}>
            <Button
              title={t('common.renew')}
              onPress={() => router.push(`/renew/${item.id}`)}
              style={styles.actionBtn}
            />
            <Button
              title={t('common.edit')}
              variant="secondary"
              onPress={() => router.push(`/item/${item.id}/edit`)}
              style={styles.actionBtn}
            />
            <Button
              title={item.status === 'active' ? t('common.archive') : t('common.restore')}
              variant="secondary"
              onPress={handleToggleArchive}
              style={styles.actionBtn}
            />
            <Button
              title={t('common.delete')}
              variant="danger"
              onPress={handleDelete}
              style={styles.actionBtn}
            />
          </View>
        </ScrollView>
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  safeArea: { flex: 1 },
  content: { padding: 16, paddingBottom: 40 },
  headerRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  headerInfo: { flex: 1, marginLeft: 12 },
  card: { padding: 16, marginBottom: 12 },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  label: { fontSize: 14, opacity: 0.7 },
  badgeRow: { marginTop: 12 },
  attachmentThumb: {
    width: 80,
    height: 80,
    borderRadius: 8,
    marginRight: 8,
    backgroundColor: '#eee',
  },
  historyRow: { flexDirection: 'row', alignItems: 'center', marginVertical: 4 },
  actions: { marginTop: 16 },
  actionBtn: { marginBottom: 8 },
});
