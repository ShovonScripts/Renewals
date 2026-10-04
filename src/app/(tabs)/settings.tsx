import { StyleSheet, View, ScrollView, Pressable, TextInput, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import Ionicons from '@expo/vector-icons/Ionicons';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Card } from '@/components/Card';
import { Button } from '@/components/Button';
import { useStore } from '@/store/store';
import { useT } from '@/i18n';
import { sendTestNotificationAsync } from '@/services/notifications';

export default function SettingsScreen() {
  const { t } = useT();
  const settings = useStore((state) => state.settings);
  const updateSettings = useStore((state) => state.updateSettings);

  const handleTestNotification = async () => {
    await sendTestNotificationAsync();
    Alert.alert('Test Notification', t('help.testSent'));
  };

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <ScrollView contentContainerStyle={styles.content}>
          <ThemedText type="smallBold" style={styles.sectionHeader}>{t('settings.theme')}</ThemedText>
          <Card style={styles.card}>
            <View style={styles.row}>
              {(['system', 'light', 'dark'] as const).map((th) => (
                <Pressable
                  key={th}
                  style={[styles.optionBtn, settings.theme === th && styles.optionBtnActive]}
                  onPress={() => updateSettings({ theme: th })}
                >
                  <ThemedText style={[styles.optionText, settings.theme === th && styles.optionTextActive]}>
                    {t(`settings.theme${th.charAt(0).toUpperCase() + th.slice(1)}` as any)}
                  </ThemedText>
                </Pressable>
              ))}
            </View>
          </Card>

          <ThemedText type="smallBold" style={styles.sectionHeader}>{t('settings.currencyCode')}</ThemedText>
          <Card style={styles.card}>
            <View style={styles.currencyRow}>
              <TextInput
                style={styles.input}
                value={settings.currencyCode}
                onChangeText={(val) => updateSettings({ currencyCode: val })}
                maxLength={6}
              />
              <TextInput
                style={styles.inputSymbol}
                value={settings.currencySymbol}
                onChangeText={(val) => updateSettings({ currencySymbol: val })}
                maxLength={4}
              />
            </View>
          </Card>

          <ThemedText type="smallBold" style={styles.sectionHeader}>Navigation & Tools</ThemedText>
          <Card style={styles.card}>
            <Pressable style={styles.navRow} onPress={() => router.push('/backup')}>
              <Ionicons name="cloud-download-outline" size={22} color="#007AFF" />
              <ThemedText style={styles.navText}>{t('settings.backup')}</ThemedText>
              <Ionicons name="chevron-forward" size={18} color="#888" />
            </Pressable>
            <View style={styles.divider} />
            <Pressable style={styles.navRow} onPress={() => router.push('/help-reminders')}>
              <Ionicons name="help-circle-outline" size={22} color="#007AFF" />
              <ThemedText style={styles.navText}>{t('settings.helpReminders')}</ThemedText>
              <Ionicons name="chevron-forward" size={18} color="#888" />
            </Pressable>
          </Card>

          {__DEV__ ? (
            <>
              <ThemedText type="smallBold" style={styles.sectionHeader}>Developer</ThemedText>
              <Card style={styles.card}>
                <Button title={t('settings.testNotification')} variant="secondary" onPress={handleTestNotification} />
              </Card>
            </>
          ) : null}
        </ScrollView>
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  safeArea: { flex: 1 },
  content: { padding: 16, paddingBottom: 40 },
  sectionHeader: { marginBottom: 8, marginTop: 12, opacity: 0.7, textTransform: 'uppercase', fontSize: 12 },
  card: { padding: 12 },
  row: { flexDirection: 'row', justifyContent: 'space-between' },
  optionBtn: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 8,
    marginHorizontal: 4,
    backgroundColor: '#f0f0f0',
  },
  optionBtnActive: {
    backgroundColor: '#007AFF',
  },
  optionText: { fontSize: 14, fontWeight: '600', color: '#333' },
  optionTextActive: { color: '#fff' },
  currencyRow: { flexDirection: 'row', alignItems: 'center' },
  input: {
    flex: 2,
    height: 40,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    paddingHorizontal: 12,
    marginRight: 8,
    fontSize: 16,
  },
  inputSymbol: {
    flex: 1,
    height: 40,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    paddingHorizontal: 12,
    fontSize: 16,
    textAlign: 'center',
  },
  navRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
  },
  navText: { flex: 1, marginLeft: 12, fontSize: 16, fontWeight: '500' },
  divider: { height: 1, backgroundColor: '#eee', marginVertical: 4 },
});
