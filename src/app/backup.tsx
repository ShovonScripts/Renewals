import { StyleSheet, View, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { useStore } from '@/store/store';
import { useT } from '@/i18n';
import { exportBackup, importBackup } from '@/services/backup';

export default function BackupScreen() {
  const { t } = useT();
  const items = useStore((state) => state.items);
  const settings = useStore((state) => state.settings);
  const updateSettings = useStore((state) => state.updateSettings);

  const handleExport = async () => {
    const success = await exportBackup(items, settings);
    if (success) {
      Alert.alert('Success', t('backup.successExport'));
    } else {
      Alert.alert('Error', 'Export failed');
    }
  };

  const handleImport = async () => {
    const result = await importBackup();
    if (!result.ok) {
      if (result.error !== 'Cancelled') {
        Alert.alert('Error', result.error || t('backup.invalid'));
      }
      return;
    }

    const importedItems = result.items || [];
    const importedSettings = result.settings || {};

    Alert.alert(
      'Import Backup',
      `Found ${importedItems.length} items. Do you want to replace existing items or merge?`,
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: 'Replace',
          style: 'destructive',
          onPress: () => {
            useStore.setState({ items: importedItems });
            if (Object.keys(importedSettings).length > 0) {
              updateSettings(importedSettings);
            }
            Alert.alert('Success', t('backup.successImport', { count: importedItems.length }));
          },
        },
        {
          text: 'Merge',
          onPress: () => {
            const existingIds = new Set(items.map((i) => i.id));
            const newItems = importedItems.filter((i) => !existingIds.has(i.id));
            useStore.setState({ items: [...items, ...newItems] });
            if (Object.keys(importedSettings).length > 0) {
              updateSettings(importedSettings);
            }
            Alert.alert('Success', t('backup.successImport', { count: newItems.length }));
          },
        },
      ]
    );
  };

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea} edges={['bottom']}>
        <View style={styles.content}>
          <Card style={styles.card}>
            <ThemedText style={styles.note}>{t('backup.note')}</ThemedText>
          </Card>

          <Button title={t('backup.export')} onPress={handleExport} style={styles.btn} />
          <Button title={t('backup.import')} variant="secondary" onPress={handleImport} style={styles.btn} />
        </View>
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  safeArea: { flex: 1 },
  content: { padding: 16 },
  card: { padding: 16, marginBottom: 24, backgroundColor: '#FFF3E0', borderColor: '#FFE0B2' },
  note: { color: '#E65100', fontSize: 14, fontWeight: '500' },
  btn: { marginBottom: 12 },
})
