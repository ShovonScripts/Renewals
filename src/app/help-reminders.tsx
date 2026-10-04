import { useState, useEffect } from 'react';
import { StyleSheet, ScrollView, Alert, Linking } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Notifications from 'expo-notifications';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { useT } from '@/i18n';
import { sendTestNotificationAsync } from '@/services/notifications';

export default function HelpRemindersScreen() {
  const { t } = useT();
  const [permissionStatus, setPermissionStatus] = useState<string>('loading');

  useEffect(() => {
    async function checkPerm() {
      const { status } = await Notifications.getPermissionsAsync();
      setPermissionStatus(status);
    }
    checkPerm();
  }, []);

  const handleOpenSettings = async () => {
    await Linking.openSettings();
  };

  const handleTestNotification = async () => {
    await sendTestNotificationAsync();
    Alert.alert('Test Notification', t('help.testSent'));
  };

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea} edges={['bottom']}>
        <ScrollView contentContainerStyle={styles.content}>
          <Card style={styles.card}>
            <ThemedText type="smallBold" style={{ marginBottom: 4 }}>
              {t('help.permissionStatus', { status: permissionStatus })}
            </ThemedText>
            {permissionStatus !== 'granted' ? (
              <Button title={t('help.openSettings')} onPress={handleOpenSettings} style={{ marginTop: 8 }} />
            ) : null}
          </Card>

          <Card style={styles.card}>
            <ThemedText style={styles.body}>{t('help.batteryNote')}</ThemedText>
          </Card>

          <Button title={t('settings.testNotification')} variant="secondary" onPress={handleTestNotification} style={styles.btn} />
        </ScrollView>
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  safeArea: { flex: 1 },
  content: { padding: 16 },
  card: { padding: 16, marginBottom: 16 },
  body: { fontSize: 15, lineHeight: 22 },
  btn: { marginTop: 8 },
});
