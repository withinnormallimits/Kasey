/**
 * Setup.
 *
 * The four strengths fields at the top are the ones that feed the sitter page,
 * so they come before anything administrative.
 *
 * Backup is here and it is a requirement, not a feature: a lost phone must not
 * destroy months of a child's medical history. That is the accepted cost of
 * staying local-first, and this screen is where we pay it.
 */

import React, { useState } from 'react';
import { Pressable, Text, View } from 'react-native';

import { exportBackup } from '../db/database';
import { ShareError, shareBackup } from '../pages/share';
import { useApp } from '../state/AppState';
import { ThemeMode } from '../theme/tokens';
import { space } from '../theme/tokens';
import { Banner, Button, ConfirmSheet, Field, Label } from '../ui/primitives';

export function SetupScreen() {
  const { settings, saveSettings, entries, eraseAll, palette: p } = useApp();
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [confirmErase, setConfirmErase] = useState(false);

  const set = (patch: Parameters<typeof saveSettings>[0]) => void saveSettings(patch);

  const onBackup = async () => {
    setBusy(true);
    setError(null);
    setMessage(null);
    try {
      const backup = await exportBackup();
      const outcome = await shareBackup(JSON.stringify(backup, null, 2), settings);
      if (outcome === 'unavailable') setError('Sharing is not available on this device.');
      else setMessage('Backup created. Keep it somewhere that is not this phone.');
    } catch (e) {
      setError(e instanceof ShareError ? e.message : 'Could not build the backup.');
    } finally {
      setBusy(false);
    }
  };

  const themes: Array<{ k: ThemeMode; label: string }> = [
    { k: 'auto', label: 'Match my phone' },
    { k: 'light', label: 'Light' },
    { k: 'dark', label: 'Dark' },
  ];

  return (
    <View>
      {message ? <Banner tone="good">{message}</Banner> : null}
      {error ? <Banner tone="warn">{error}</Banner> : null}

      <Label style={{ marginBottom: 12 }}>What goes at the top of the page</Label>
      <Field
        label="What do you call them?"
        value={settings.childName}
        onChangeText={(v) => set({ childName: v })}
        placeholder="Avi"
      />
      <Field
        label="Age"
        value={settings.childAge}
        onChangeText={(v) => set({ childAge: v })}
        placeholder="8"
      />
      <Field
        label="What do they love?"
        value={settings.loves}
        onChangeText={(v) => set({ loves: v })}
        placeholder="Trains, anything with a map, his dog Rocket"
        multiline
      />
      <Field
        label="What are they proud of?"
        value={settings.proudOf}
        onChangeText={(v) => set({ proudOf: v })}
        multiline
      />
      <Field
        label="What makes them laugh?"
        value={settings.laughs}
        onChangeText={(v) => set({ laughs: v })}
        multiline
      />

      <Label style={{ marginBottom: 12, marginTop: space.sm }}>What people need to know</Label>
      <Field
        label="Always true about them"
        value={settings.alwaysTrue}
        onChangeText={(v) => set({ alwaysTrue: v })}
        multiline
        hint="the things that do not change"
      />
      <Field
        label="How they communicate"
        value={settings.communication}
        onChangeText={(v) => set({ communication: v })}
        multiline
      />
      <Field
        label="Please don't"
        value={settings.pleaseDont}
        onChangeText={(v) => set({ pleaseDont: v })}
        multiline
        hint="what makes it worse"
      />
      <Field
        label="Worth knowing"
        value={settings.worthKnowing}
        onChangeText={(v) => set({ worthKnowing: v })}
        multiline
      />
      <Field
        label="Who to call"
        value={settings.contact}
        onChangeText={(v) => set({ contact: v })}
        placeholder="Jen, 555 0100"
      />

      <Label style={{ marginBottom: 12, marginTop: space.sm }}>Appearance</Label>
      <View style={{ flexDirection: 'row', gap: 8, marginBottom: space.xl }}>
        {themes.map((t) => {
          const on = settings.theme === t.k;
          return (
            <Pressable
              key={t.k}
              onPress={() => set({ theme: t.k })}
              accessibilityRole="button"
              accessibilityState={{ selected: on }}
              style={{
                flex: 1,
                minHeight: 48,
                borderRadius: 10,
                borderWidth: 1.5,
                borderColor: on ? p.deep : p.edge,
                backgroundColor: on ? p.deep : p.card,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Text
                style={{
                  color: on ? p.onDeep : p.ink2,
                  fontWeight: '600',
                  fontSize: 13,
                  textAlign: 'center',
                }}
              >
                {on ? `✓ ${t.label}` : t.label}
              </Text>
            </Pressable>
          );
        })}
      </View>

      <Label style={{ marginBottom: 12 }}>Your data</Label>
      <Banner tone="info">
        Everything lives on this phone. There is no account and no cloud copy, which means nobody
        else can read it, and also that losing this phone loses everything. Take a backup.
      </Banner>
      <Button
        label={`Back up ${entries.length} ${entries.length === 1 ? 'entry' : 'entries'}`}
        onPress={onBackup}
        busy={busy}
        tone="quiet"
      />

      <View style={{ marginTop: space.xxl, marginBottom: space.xxl }}>
        <Button label="Erase everything" tone="danger" onPress={() => setConfirmErase(true)} />
      </View>

      <ConfirmSheet
        visible={confirmErase}
        message={`This deletes all ${entries.length} entries and everything about ${
          settings.childName.trim() || 'your child'
        }, permanently, from this phone. There is no cloud copy to restore from.`}
        confirmLabel="Erase it all"
        cancelLabel="Keep it"
        destructive
        onCancel={() => setConfirmErase(false)}
        onConfirm={() => {
          setConfirmErase(false);
          void eraseAll();
        }}
      />
    </View>
  );
}
