import { useState } from 'react';
import { StyleSheet, View, TextInput, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, router } from 'expo-router';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Button } from '@/components/Button';
import { useStore } from '@/store/store';
import { useT } from '@/i18n';
import { parseDateOnly, addDays, addMonths, toDateOnlyString } from '@/domain/dates';

export default function RenewModalScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { t } = useT();
  const items = useStore((state) => state.items);
  const markRenewed = useStore((state) => state.markRenewed);

  const item = items.find((i) => i.id === id);

  const suggestNextDate = () => {
    if (!item) return toDateOnlyString(new Date());
    const expiry = parseDateOnly(item.expiresOn) || new Date();
    if (item.billingCycle === 'weekly') {
      return toDateOnlyString(addDays(expiry, 7));
    }
    if (item.billingCycle === 'monthly') {
      return toDateOnlyString(addMonths(expiry, 1));
    }
    if (item.billingCycle === 'yearly') {
      return toDateOnlyString(addMonths(expiry, 12));
    }
    return toDateOnlyString(addMonths(expiry, 12));
  };

  const [newExpiry, setNewExpiry] = useState(suggestNextDate);
  const [amount, setAmount] = useState(item?.amount ? String(item.amount) : '');

  if (!item) {
    return (
      <ThemedView style={styles.container}>
        <SafeAreaView style={styles.safeArea}>
          <ThemedText>Item not found</ThemedText>
        </SafeAreaView>
      </ThemedView>
    );
  }

  const handleRenew = () => {
    if (parseDateOnly(newExpiry) === null) {
      Alert.alert('Error', t('item.dateRequired'));
      return;
    }

    const parsedAmount = amount ? parseFloat(amount) : null;
    markRenewed(item.id, {
      expiresOn: newExpiry.trim(),
      amount: parsedAmount && parsedAmount > 0 ? parsedAmount : null,
    });

    router.back();
  };

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea} edges={['bottom']}>
        <View style={styles.content}>
          <ThemedText type="smallBold" style={styles.label}>{t('renew.newExpiry')}</ThemedText>
          <TextInput
            style={styles.input}
            placeholder="YYYY-MM-DD"
            placeholderTextColor="#888"
            value={newExpiry}
            onChangeText={setNewExpiry}
            maxLength={10}
          />

          <ThemedText type="smallBold" style={styles.label}>{t('common.amount')}</ThemedText>
          <TextInput
            style={styles.input}
            placeholder="0.00"
            placeholderTextColor="#888"
            keyboardType="numeric"
            value={amount}
            onChangeText={setAmount}
          />

          <Button title={t('common.confirm')} onPress={handleRenew} style={styles.btn} />
        </View>
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  safeArea: { flex: 1 },
  content: { padding: 16 },
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
  btn: { marginTop: 24 },
});
