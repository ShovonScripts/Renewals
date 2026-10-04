import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import * as DocumentPicker from 'expo-document-picker';
import { validateBackup, BACKUP_APP_ID, BACKUP_VERSION } from '@/domain/validate';
import type { RenewalItem, Settings } from '@/types';

export async function exportBackup(items: RenewalItem[], settings: Settings): Promise<boolean> {
  try {
    const payload = {
      app: BACKUP_APP_ID,
      backupVersion: BACKUP_VERSION,
      exportedAt: new Date().toISOString(),
      settings: {
        language: settings.language,
        currencyCode: settings.currencyCode,
        currencySymbol: settings.currencySymbol,
        notifyHour: settings.notifyHour,
        notifyMinute: settings.notifyMinute,
        defaultReminderDays: settings.defaultReminderDays,
        theme: settings.theme,
      },
      items,
    };

    const fileUri = `${FileSystem.cacheDirectory}renewals_backup_${Date.now()}.json`;
    await FileSystem.writeAsStringAsync(fileUri, JSON.stringify(payload, null, 2));

    if (!(await Sharing.isAvailableAsync())) {
      throw new Error('Sharing is not available on this device');
    }

    await Sharing.shareAsync(fileUri, {
      mimeType: 'application/json',
      dialogTitle: 'Export Renewals Backup',
      UTI: 'public.json',
    });

    return true;
  } catch (error) {
    console.error('Export backup failed:', error);
    return false;
  }
}

export interface ImportResult {
  ok: boolean;
  items?: RenewalItem[];
  settings?: Partial<Settings>;
  error?: string;
}

export async function importBackup(): Promise<ImportResult> {
  try {
    const result = await DocumentPicker.getDocumentAsync({
      type: ['application/json', '*/*'],
      copyToCacheDirectory: true,
    });

    if (result.canceled || !result.assets || result.assets.length === 0) {
      return { ok: false, error: 'Cancelled' };
    }

    const asset = result.assets[0];
    const content = await FileSystem.readAsStringAsync(asset.uri);
    const validation = validateBackup(content);

    if (!validation.ok) {
      return { ok: false, error: `Invalid backup file: ${validation.reason}` };
    }

    return {
      ok: true,
      items: validation.items,
      settings: validation.settings,
    };
  } catch (error) {
    console.error('Import backup failed:', error);
    return { ok: false, error: String(error) };
  }
}
