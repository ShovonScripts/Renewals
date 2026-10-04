import { useState } from 'react';
import { StyleSheet, View, TextInput, FlatList, Pressable, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Card } from '@/components/Card';
import { Chip } from '@/components/Chip';
import { EmptyState } from '@/components/EmptyState';
import { DaysLeftBadge } from '@/components/DaysLeftBadge';
import { CategoryIcon } from '@/components/CategoryIcon';
import { useStore } from '@/store/store';
import { useT } from '@/i18n';
import { CATEGORY_IDS, CATEGORIES } from '@/constants/categories';
import { daysLeft } from '@/domain/dates';
import type { CategoryId, ItemStatus } from '@/types';

export default function AllItemsScreen() {
  const { t, formatDate } = useT();
  const items = useStore((state) => state.items);

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<CategoryId | 'all'>('all');
  const [statusFilter, setStatusFilter] = useState<ItemStatus>('active');

  const filteredItems = items.filter((item) => {
    if (item.status !== statusFilter) return false;
    if (selectedCategory !== 'all' && item.category !== selectedCategory) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchTitle = item.title.toLowerCase().includes(q);
      const matchNotes = item.notes.toLowerCase().includes(q);
      if (!matchTitle && !matchNotes) return false;
    }
    return true;
  });

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <View style={styles.header}>
          <TextInput
            style={styles.searchInput}
            placeholder={t('common.search')}
            placeholderTextColor="#888"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>

        <View style={styles.statusToggle}>
          <Pressable
            style={[styles.toggleBtn, statusFilter === 'active' && styles.toggleBtnActive]}
            onPress={() => setStatusFilter('active')}
          >
            <ThemedText style={[styles.toggleText, statusFilter === 'active' && styles.toggleTextActive]}>
              {t('status.active')}
            </ThemedText>
          </Pressable>
          <Pressable
            style={[styles.toggleBtn, statusFilter === 'archived' && styles.toggleBtnActive]}
            onPress={() => setStatusFilter('archived')}
          >
            <ThemedText style={[styles.toggleText, statusFilter === 'archived' && styles.toggleTextActive]}>
              {t('status.archived')}
            </ThemedText>
          </Pressable>
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipsScroll}>
          <Chip
            label="All"
            selected={selectedCategory === 'all'}
            onPress={() => setSelectedCategory('all')}
          />
          {CATEGORY_IDS.map((catId) => (
            <Chip
              key={catId}
              label={t(CATEGORIES[catId].labelKey as any)}
              selected={selectedCategory === catId}
              onPress={() => setSelectedCategory(catId)}
            />
          ))}
        </ScrollView>

        {filteredItems.length === 0 ? (
          <EmptyState
            icon="search-outline"
            title={t('all.empty')}
          />
        ) : (
          <FlatList
            data={filteredItems}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.listContent}
            renderItem={({ item }) => {
              const dLeft = daysLeft(item.expiresOn) ?? 0;
              return (
                <Pressable onPress={() => router.push(`/item/${item.id}`)}>
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
  header: { paddingHorizontal: 16, paddingTop: 8, paddingBottom: 8 },
  searchInput: {
    height: 44,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    paddingHorizontal: 12,
    fontSize: 16,
    color: '#000',
    backgroundColor: '#fff',
  },
  statusToggle: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  toggleBtn: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  toggleBtnActive: {
    borderBottomColor: '#007AFF',
  },
  toggleText: { fontSize: 14, fontWeight: '600', opacity: 0.6 },
  toggleTextActive: { opacity: 1, color: '#007AFF' },
  chipsScroll: { paddingHorizontal: 16, maxHeight: 50, marginBottom: 8 },
  listContent: { padding: 16 },
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
