/* eslint-disable import/no-unresolved */
import { useState } from 'react';
import { StyleSheet, View, ScrollView, TextInput, Switch, Pressable, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, router } from 'expo-router';
import Ionicons from '@expo/vector-icons/Ionicons';
import * as ImagePicker from 'expo-image-picker';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { useStore } from '@/store/store';
import { useT } from '@/i18n';
import { CATEGORY_IDS, CATEGORIES } from '@/constants/categories';
import { parseDateOnly } from '@/domain/dates';
import { saveAttachment } from '@/services/attachments';
import type { CategoryId, BillingCycle } from '@/types';

export default function EditItemScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { t } = useT();
  const items = useStore((state) => state.items);
  const updateItem = useStore((state) => state.update);

  const item = items.find((i) => i.id === id);

  const [title, setTitle] = useState(item?.title ?? '');
  const [category, setCategory] = useState<CategoryId>(item?.category ?? 'passport');
  const [expiresOn, setExpiresOn] = useState(item?.expiresOn ?? '');
  const [reminderDaysStr, setReminderDaysStr] = useState(item?.reminderDays?.join(', ') ?? '');
  const [costsMoney, setCostsMoney] = useState(item?.amount !== null && item?.amount !== undefined);
  const [amount, setAmount] = useState(item?.amount ? String(item.amount) : '');
  const [billingCycle, setBillingCycle] = useState<BillingCycle>(item?.billingCycle ?? 'monthly');
  const [autoRenews, setAutoRenews] = useState(item?.autoRenews ?? false);
  const [notes, setNotes] = useState(item?.notes ?? '');
  const [attachments, setAttachments] = useState(item?.attachments ?? []);

  if (!item) {
    return (
      <ThemedView style={styles.container}>
        <SafeAreaView style={styles.safeArea}>
          <ThemedText>Item not found</ThemedText>
        </SafeAreaView>
      </ThemedView>
    );
  }

  const handlePickImage = async () => {
    if (attachments.length >= 3) {
      Alert.alert('Limit reached', 'Maximum 3 photos allowed.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.8,
    });
    if (!result.canceled && result.assets && result.assets.length > 0) {
      try {
        const att = await saveAttachment(item.id, result.assets[0].uri);
        setAttachments((prev) => [...prev, att]);
      } catch {
        Alert.alert('Error', 'Failed to save image');
      }
    }
  };

  const handleSave = () => {
    if (!title.trim()) {
      Alert.alert('Error', t('item.titleRequired'));
      return;
    }
    if (parseDateOnly(expiresOn) === null) {
      Alert.alert('Error', t('item.dateRequired'));
      return;
    }

    const reminderDays = reminderDaysStr
      .split(',')
      .map((s) => parseInt(s.trim(), 10))
      .filter((n) => !isNaN(n) && n >= 0);

    const parsedAmount = costsMoney && amount ? parseFloat(amount) : null;

    updateItem(item.id, {
      title: title.trim(),
      category,
      expiresOn: expiresOn.trim(),
      reminderDays: reminderDays.length > 0 ? reminderDays : item.reminderDays,
      amount: parsedAmount && parsedAmount > 0 ? parsedAmount : null,
      billingCycle: costsMoney ? billingCycle : 'none',
      autoRenews: costsMoney ? autoRenews : false,
      notes: notes.trim(),
      attachments,
    });

    router.back();
  };

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea} edges={['bottom']}>
        <ScrollView contentContainerStyle={styles.content}>
          <ThemedText type="smallBold" style={styles.label}>{t('item.titleLabel')}</ThemedText>
          <TextInput style={styles.input} value={title} onChangeText={setTitle} maxLength={60} />

          <ThemedText type="smallBold" style={styles.label}>{t('item.categoryLabel')}</ThemedText>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.catScroll}>
            {CATEGORY_IDS.map((catId) => {
              const meta = CATEGORIES[catId];
              const selected = category === catId;
              return (
                <Pressable
                  key={catId}
                  style={[styles.catChip, selected && { backgroundColor: meta.color }]}
                  onPress={() => setCategory(catId)}
                >
                  <Ionicons name={meta.icon} size={20} color={selected ? '#fff' : meta.color} />
                  <ThemedText style={[styles.catText, selected && styles.catTextSelected]}>
                    {t(meta.labelKey as any)}
                  </ThemedText>
                </Pressable>
              );
            })}
          </ScrollView>

          <ThemedText type="smallBold" style={styles.label}>{t('item.expiresOnLabel')}</ThemedText>
          <TextInput style={styles.input} value={expiresOn} onChangeText={setExpiresOn} maxLength={10} />

          <ThemedText type="smallBold" style={styles.label}>{t('item.reminderDaysLabel')}</ThemedText>
          <TextInput style={styles.input} value={reminderDaysStr} onChangeText={setReminderDaysStr} />

          <Card style={styles.switchCard}>
            <View style={styles.switchRow}>
              <ThemedText style={styles.switchLabel}>{t('item.costsMoney')}</ThemedText>
              <Switch value={costsMoney} onValueChange={setCostsMoney} />
            </View>
          </Card>

          {costsMoney ? (
            <>
              <ThemedText type="smallBold" style={styles.label}>{t('common.amount')}</ThemedText>
              <TextInput style={styles.input} keyboardType="numeric" value={amount} onChangeText={setAmount} />

              <ThemedText type="smallBold" style={styles.label}>{t('item.billingCycleLabel')}</ThemedText>
              <View style={styles.cycleRow}>
                {(['weekly', 'monthly', 'yearly'] as const).map((cycle) => (
                  <Pressable
                    key={cycle}
                    style={[styles.cycleBtn, billingCycle === cycle && styles.cycleBtnActive]}
                    onPress={() => setBillingCycle(cycle)}
                  >
                    <ThemedText style={[styles.cycleText, billingCycle === cycle && styles.cycleTextActive]}>
                      {t(`billing.${cycle}` as any)}
                    </ThemedText>
                  </Pressable>
                ))}
              </View>

              <Card style={styles.switchCard}>
                <View style={styles.switchRow}>
                  <ThemedText style={styles.switchLabel}>{t('item.autoRenewsLabel')}</ThemedText>
                  <Switch value={autoRenews} onValueChange={setAutoRenews} />
                </View>
              </Card>
            </>
          ) : null}

          <ThemedText type="smallBold" style={styles.label}>{t('common.notes')}</ThemedText>
          <TextInput style={[styles.input, styles.notesInput]} multiline value={notes} onChangeText={setNotes} maxLength={300} />

          <ThemedText type="smallBold" style={styles.label}>
            {t('item.attachmentsLabel')} ({attachments.length}/3)
          </ThemedText>
          <Button title="Add Photo" variant="secondary" onPress={handlePickImage} />

          <Button title={t('common.save')} onPress={handleSave} style={styles.saveBtn} />
        </ScrollView>
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  safeArea: { flex: 1 },
  content: { padding: 16, paddingBottom: 40 },
  label: { marginBottom: 6, marginTop: 12, fontSize: 13, opacity: 0.7, textTransform: 'uppercase' },
  input: {
    height: 44,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    paddingHorizontal: 12,
    fontSize: 16,
    backgroundColor: '#fff',
    color: '#000',
  },
  notesInput: {
    height: 80,
    paddingTop: 10,
    textAlignVertical: 'top',
  },
  catScroll: { maxHeight: 50, marginBottom: 8 },
  catChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#ccc',
    marginRight: 8,
    backgroundColor: '#f9f9f9',
  },
  catText: { marginLeft: 6, fontSize: 14, fontWeight: '500', color: '#333' },
  catTextSelected: { color: '#fff' },
  switchCard: { padding: 12, marginVertical: 8 },
  switchRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  switchLabel: { fontSize: 16, fontWeight: '600' },
  cycleRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  cycleBtn: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    marginHorizontal: 4,
  },
  cycleBtnActive: { backgroundColor: '#007AFF', borderColor: '#007AFF' },
  cycleText: { fontSize: 14, fontWeight: '600', color: '#333' },
  cycleTextActive: { color: '#fff' },
  saveBtn: { marginTop: 24 },
});
