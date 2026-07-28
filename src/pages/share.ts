/**
 * Turning a page into a PDF and handing it to someone.
 *
 * Until this works, the app cannot do the thing it is named for. Everything
 * else in the product is a promise this keeps.
 *
 * Nothing here uploads. expo-print renders locally, expo-sharing opens the
 * operating system share sheet, and the file lives in the app's own cache
 * directory. No bytes leave the device unless the parent picks a recipient.
 */

import { File, Paths } from 'expo-file-system';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { Platform } from 'react-native';

import { Change, Entry, Settings } from '../domain/types';
import { PageKind, pageFileName, pageHtml } from './generate';

export type ShareOutcome = 'shared' | 'printed' | 'unavailable' | 'dismissed';

export class ShareError extends Error {}

/**
 * Renders a page to PDF and opens the share sheet.
 *
 * On web there is no share sheet and no file system, so this falls back to the
 * browser print dialog, which can save a PDF. Different mechanism, same
 * outcome for the parent.
 */
export async function sharePage(
  kind: PageKind,
  settings: Settings,
  entries: Entry[],
  changes: Change[],
): Promise<ShareOutcome> {
  const html = pageHtml(kind, settings, entries, changes);

  if (Platform.OS === 'web') {
    await Print.printAsync({ html });
    return 'printed';
  }

  let uri: string;
  try {
    const result = await Print.printToFileAsync({ html, base64: false });
    uri = result.uri;
  } catch (e) {
    throw new ShareError(
      `Could not build the PDF. ${e instanceof Error ? e.message : 'Unknown problem.'}`,
    );
  }

  // Relocating the file is NOT cosmetic on Android, which is what the earlier
  // silent catch here got wrong.
  //
  // expo-print writes to cacheDir/Print/. expo-sharing then runs the path
  // through isAllowedToRead, which under Expo Go is scoped to this app's own
  // sandbox directory. cacheDir/Print/ sits outside that scope, so sharing is
  // refused with "Not allowed to read file under given URL". Moving the file
  // into Paths.cache is what brings it inside the readable scope. Swallowing a
  // failure here produced a PDF that could never be shared, and an error
  // message that pointed at the wrong step.
  //
  // The readable filename is a real benefit too: printToFileAsync generates a
  // random name, which arrives in a teacher's inbox as an unidentifiable
  // attachment.
  let relocated = false;
  let relocateError: unknown = null;
  try {
    const printed = new File(uri);
    const target = new File(Paths.cache, pageFileName(kind, settings));
    if (target.exists) target.delete();
    await printed.move(target);
    uri = printed.uri;
    relocated = true;
  } catch (e) {
    relocateError = e;
    // move can fail across storage boundaries. Copying leaves the original in
    // place but still lands a readable copy inside the shareable scope.
    try {
      const source = new File(uri);
      const target = new File(Paths.cache, pageFileName(kind, settings));
      if (target.exists) target.delete();
      await source.copy(target);
      uri = target.uri;
      relocated = true;
    } catch {
      // fall through with the original uri and let the share attempt report
    }
  }

  if (!(await Sharing.isAvailableAsync())) return 'unavailable';

  try {
    await Sharing.shareAsync(uri, {
      mimeType: 'application/pdf',
      dialogTitle:
        kind === 'sitter' ? 'Send this to a sitter or teacher' : 'Send this to the doctor',
      UTI: 'com.adobe.pdf',
    });
  } catch (e) {
    // Surface the real reason. The previous code let this escape as an
    // unrecognised error, so the screen reported a PDF build problem for what
    // is actually a file permission problem one step later.
    const detail = e instanceof Error ? e.message : 'Unknown problem.';
    const context =
      !relocated && relocateError instanceof Error
        ? ` The file could not be moved into shareable storage: ${relocateError.message}`
        : '';
    throw new ShareError(`${detail}${context}`);
  }

  return 'shared';
}

/** Opens the system print dialog without sharing. */
export async function printPage(
  kind: PageKind,
  settings: Settings,
  entries: Entry[],
  changes: Change[],
): Promise<void> {
  await Print.printAsync({ html: pageHtml(kind, settings, entries, changes) });
}

/* ------------------------------------------------------------------ *
 * Backup files
 *
 * A lost phone must not destroy months of a child's medical history.
 * ------------------------------------------------------------------ */

export function backupFileName(settings: Settings): string {
  const base = (settings.childName.trim() || 'kasey').toLowerCase().replace(/[^a-z0-9]+/g, '-');
  const d = new Date();
  const stamp = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(
    d.getDate(),
  ).padStart(2, '0')}`;
  return `${base}-kasey-backup-${stamp}.json`;
}

export async function shareBackup(json: string, settings: Settings): Promise<ShareOutcome> {
  if (Platform.OS === 'web') {
    throw new ShareError('Saving a backup from the browser is not supported yet.');
  }

  const target = new File(Paths.cache, backupFileName(settings));
  if (target.exists) target.delete();
  target.create();
  target.write(json);

  if (!(await Sharing.isAvailableAsync())) return 'unavailable';

  await Sharing.shareAsync(target.uri, {
    mimeType: 'application/json',
    dialogTitle: 'Save your Kasey backup somewhere safe',
    UTI: 'public.json',
  });
  return 'shared';
}
