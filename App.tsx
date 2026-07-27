/**
 * Kasey. Because you can't hold it all.
 *
 * Tab shell, the two-button dock, and the one question asked after a new
 * episode is saved.
 */

import { StatusBar } from 'expo-status-bar';
import React, { useState } from 'react';
import { ActivityIndicator, Pressable, Text, View } from 'react-native';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';

import { Draft, Entry } from './src/domain/types';
import { EntryDetail } from './src/screens/EntryDetail';
import { EntrySheet, draftFromEntry, emptyDraft } from './src/screens/EntrySheet';
import { LogScreen } from './src/screens/LogScreen';
import { Onboarding } from './src/screens/Onboarding';
import { PagesScreen } from './src/screens/PagesScreen';
import { SetupScreen } from './src/screens/SetupScreen';
import { AppStateProvider, useApp } from './src/state/AppState';
import { space } from './src/theme/tokens';
import { Button, ConfirmSheet, Screen, Toast } from './src/ui/primitives';

type Tab = 'log' | 'pages' | 'setup';

function Shell() {
  const {
    ready,
    settings,
    palette: p,
    theme,
    markGoodDay,
    goodDayToday,
    episodesToday,
    removeEntry,
  } = useApp();
  const insets = useSafeAreaInsets();

  const [tab, setTab] = useState<Tab>('log');
  const [sheetOpen, setSheetOpen] = useState(false);
  const [sheetDraft, setSheetDraft] = useState<Draft | null>(null);
  const [detail, setDetail] = useState<Entry | null>(null);
  const [toast, setToast] = useState<{ msg: string; undo?: () => void } | null>(null);
  const [askRestOfDay, setAskRestOfDay] = useState(false);

  if (!ready) {
    return (
      <View
        style={{ flex: 1, backgroundColor: p.paper, alignItems: 'center', justifyContent: 'center' }}
      >
        <ActivityIndicator color={p.deep} />
      </View>
    );
  }

  if (!settings.onboarded) {
    return (
      <Onboarding
        onDone={(goToPage) => {
          if (goToPage) setTab('pages');
        }}
      />
    );
  }

  const showToast = (msg: string, undo?: () => void) => {
    setToast({ msg, undo });
    setTimeout(() => setToast(null), 5000);
  };

  const onGoodDay = async () => {
    const created = await markGoodDay();
    if (created) {
      // undo is why a one-tap verdict is safe to offer
      showToast('Marked a good day', () => {
        void removeEntry(created.id);
        setToast(null);
      });
    } else {
      showToast('Already marked good today');
    }
  };

  const goodLabel = goodDayToday
    ? 'Day marked good'
    : episodesToday.length > 0
      ? 'Still a good day'
      : 'Good day';

  const tabs: Array<{ k: Tab; label: string }> = [
    { k: 'log', label: 'Log' },
    { k: 'pages', label: 'Pages' },
    { k: 'setup', label: 'Setup' },
  ];

  return (
    <View style={{ flex: 1, backgroundColor: p.paper }}>
      <StatusBar style={theme === 'dark' ? 'light' : 'dark'} />

      <View
        style={{
          paddingTop: insets.top + 12,
          paddingHorizontal: space.lg,
          paddingBottom: 12,
          borderBottomWidth: 1,
          borderBottomColor: p.line,
        }}
      >
        <Text style={{ fontSize: 25, color: p.ink }}>
          {tab === 'log' ? settings.childName.trim() || 'Log' : tab === 'pages' ? 'Pages' : 'Setup'}
        </Text>
      </View>

      <Screen>
        {/* Never tap straight into a form. A tap opens the read-only view. */}
        {tab === 'log' ? <LogScreen onOpenEntry={(e: Entry) => setDetail(e)} /> : null}
        {tab === 'pages' ? <PagesScreen /> : null}
        {tab === 'setup' ? <SetupScreen /> : null}
      </Screen>

      {tab === 'log' ? (
        <View
          style={{
            position: 'absolute',
            left: space.lg,
            right: space.lg,
            bottom: insets.bottom + 72,
            flexDirection: 'row',
            gap: 9,
            maxWidth: 460,
            alignSelf: 'center',
            width: '100%',
          }}
        >
          <Button
            label={goodLabel}
            tone="good"
            onPress={() => void onGoodDay()}
            style={{ flex: 1 }}
            accessibilityHint="Marks today as a good day. You can undo it."
          />
          <Button
            label="Something happened"
            onPress={() => {
              setSheetDraft(emptyDraft());
              setSheetOpen(true);
            }}
            style={{ flex: 1.25 }}
          />
        </View>
      ) : null}

      <View
        style={{
          flexDirection: 'row',
          borderTopWidth: 1,
          borderTopColor: p.line,
          backgroundColor: p.paper,
          paddingBottom: insets.bottom,
        }}
      >
        {tabs.map((t) => {
          const on = tab === t.k;
          return (
            <Pressable
              key={t.k}
              onPress={() => setTab(t.k)}
              accessibilityRole="tab"
              accessibilityState={{ selected: on }}
              style={{ flex: 1, minHeight: 48, alignItems: 'center', justifyContent: 'center' }}
            >
              <Text style={{ fontSize: 12, fontWeight: '600', color: on ? p.deep : p.ink3 }}>
                {t.label}
              </Text>
            </Pressable>
          );
        })}
      </View>

      <EntryDetail
        entry={detail}
        visible={!!detail}
        onClose={() => setDetail(null)}
        onEdit={(e) => {
          setDetail(null);
          if (e.kind === 'good') return;
          setSheetDraft(draftFromEntry(e));
          setSheetOpen(true);
        }}
      />

      <EntrySheet
        visible={sheetOpen}
        initial={sheetDraft}
        onClose={() => setSheetOpen(false)}
        onSaved={(_saved, wasNew) => {
          if (wasNew && !goodDayToday) setAskRestOfDay(true);
          else showToast('Saved');
        }}
      />

      {/*
        Asked once, right after a new episode is saved. This is the moment the
        parent actually knows the answer, and it teaches the two-concept model
        by doing rather than by explaining: a rough half hour and a decent day
        can both be true.
      */}
      <ConfirmSheet
        visible={askRestOfDay}
        message="How was the rest of the day?"
        confirmLabel="Fine, actually"
        cancelLabel="Rough too"
        onCancel={() => setAskRestOfDay(false)}
        onConfirm={() => {
          setAskRestOfDay(false);
          void markGoodDay();
        }}
      />

      {toast ? (
        <Toast
          message={toast.msg}
          actionLabel={toast.undo ? 'Undo' : undefined}
          onAction={toast.undo}
        />
      ) : null}
    </View>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <AppStateProvider>
        <Shell />
      </AppStateProvider>
    </SafeAreaProvider>
  );
}
