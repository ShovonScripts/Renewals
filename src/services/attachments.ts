import * as FileSystem from 'expo-file-system/legacy';
import type { Attachment } from '@/types';

export async function saveAttachment(itemId: string, sourceUri: string): Promise<Attachment> {
  const attachmentsDir = `${FileSystem.documentDirectory}attachments/${itemId}/`;
  const dirInfo = await FileSystem.getInfoAsync(attachmentsDir);
  if (!dirInfo.exists) {
    await FileSystem.makeDirectoryAsync(attachmentsDir, { intermediates: true });
  }

  const filename = `img_${Date.now()}_${Math.random().toString(36).substring(2, 6)}.jpg`;
  const destPath = `attachments/${itemId}/${filename}`;
  const destUri = `${FileSystem.documentDirectory}${destPath}`;

  await FileSystem.copyAsync({
    from: sourceUri,
    to: destUri,
  });

  return {
    id: `att_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    path: destPath,
    createdAt: new Date().toISOString(),
  };
}

export async function deleteAttachmentFile(attachment: Attachment): Promise<void> {
  try {
    const fileUri = `${FileSystem.documentDirectory}${attachment.path}`;
    const info = await FileSystem.getInfoAsync(fileUri);
    if (info.exists) {
      await FileSystem.deleteAsync(fileUri, { idempotent: true });
    }
  } catch (error) {
    console.warn('Failed to delete attachment file:', error);
  }
}

export async function deleteAllItemAttachments(attachments: Attachment[]): Promise<void> {
  for (const att of attachments) {
    await deleteAttachmentFile(att);
  }
}

export function resolveAttachmentUri(relativePath: string): string {
  return `${FileSystem.documentDirectory}${relativePath}`;
}
