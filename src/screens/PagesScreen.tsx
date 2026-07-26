/**
 * The generated pages, and the button that hands one to somebody.
 *
 * This screen is the product. Everything else feeds it.
 */

import React, { useMemo, useState } from 'react';
import { Platform, Pressable, Text, View } from 'react-native';
import { WebView } from 'react-native-webview';

import { useApp } from '../state/AppState';
import { PageKind, pageHtml } from '../pages/generate';
import { ShareError, sharePage } from '../pages/share';
import { radius, space } from '../theme/tokens';
import { Banner, Body, Button, Label } from '../ui/primitives';

/**
 * On web there is no WebView, so the same HTML goes into an iframe. Both
 * render the identical document, which matters: what a parent proofreads has
 * to be exactly what the teacher receives.
 */
function PagePreview({ html }: { html: string }) {
  const { palette: p } = useApp();

  if (Platform.OS === 'web') {
    return (
      <View
        style={{
          borderWidth: 1,
          borderColor: p.line,
          borderRadius: radius.sm,
          overflow: 'hidden',
          height: 620,
          backgroundColor: '#FFFFFF',
        }}
      >
        {React.createElement('iframe', {
          srcDoc: html,
          title: 'Page preview',
          style: { width: '100%', height: '100%', border: 'none' },
        })}
      </View>
    );
  }

  return (
    <View
      style={{
        borderWidth: 1,
        borderColor: p.line,
        borderRadius: radius.sm,
        overflow: 'hidden',
        height: 620,
        backgroundColor: '#FFFFFF',
      }}
    >
      <WebView originWhitelist={['*']} source={{ html }} style={{ flex: 1 }} />
    </View>
  );
}

export function PagesScreen() {
  const { settings, entries, changes, palette: p } = useApp();
  const [kind, setKind] = useState<PageKind>('sitter');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const html = useMemo(
    () => pageHtml(kind, settings, entries, changes),
    [kind, settings, entries, changes],
  );

  const onShare = async () => {
    setBusy(true);
    setError(null);
    try {
      const outcome = await sharePage(kind, settings, entries, changes);
      if (outcome === 'unavailable') {
        setError('Sharing is not available on this device. You can still print the page.');
      }
    } catch (e) {
      setError(
        e instanceof ShareError ? e.message : 'Something went wrong building the PDF. Try again.',
      );
    } finally {
      setBusy(false);
    }
  };

  const segments: Array<{ k: PageKind; label: string }> = [
    { k: 'sitter', label: 'Sitters and teachers' },
    { k: 'doctor', label: 'Doctor' },
  ];

  return (
    <View>
      <View
        style={{
          flexDirection: 'row',
          backgroundColor: p.line2,
          borderRadius: 10,
          padding: 3,
          gap: 2,
          marginBottom: space.lg,
        }}
      >
        {segments.map((s) => {
          const on = kind === s.k;
          return (
            <Pressable
              key={s.k}
              onPress={() => setKind(s.k)}
              accessibilityRole="button"
              accessibilityState={{ selected: on }}
              style={{
                flex: 1,
                minHeight: 44,
                borderRadius: 8,
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: on ? p.card : 'transparent',
              }}
            >
              <Text
                style={{
                  fontSize: 12.5,
                  fontWeight: '600',
                  color: on ? p.deep : p.ink3,
                  textAlign: 'center',
                }}
              >
                {s.label}
              </Text>
            </Pressable>
          );
        })}
      </View>

      {!settings.loves && !settings.proudOf && !settings.laughs && kind === 'sitter' ? (
        <Banner tone="info">
          Add what they love, what they are proud of, and what makes them laugh in Setup. Those
          three lines go at the top of this page, and they are the part a sitter needs first.
        </Banner>
      ) : null}

      {error ? <Banner tone="warn">{error}</Banner> : null}

      <PagePreview html={html} />

      <View style={{ marginTop: space.lg }}>
        <Button
          label={kind === 'sitter' ? 'Send this to someone' : 'Send this to the doctor'}
          onPress={onShare}
          busy={busy}
          accessibilityHint="Builds a PDF and opens the share sheet"
        />
        <Text
          style={{
            fontSize: 12,
            color: p.ink3,
            textAlign: 'center',
            marginTop: 10,
            lineHeight: 17,
          }}
        >
          The PDF is built on this device. Nothing is uploaded, and nothing leaves the phone until
          you pick who gets it.
        </Text>
      </View>
    </View>
  );
}
