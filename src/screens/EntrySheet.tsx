/**
 * The entry form.
 *
 * Order matters and is not arbitrary. Stage comes first because it is one tap
 * and needs no typing. Everything past step 4 is behind "Add more detail",
 * because a parent at 11pm should be able to finish in four taps.
 *
 * The 60 second rule lives here. If a change adds a field, it has to say so
 * and justify it in seconds. That is the real currency.
 */

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Modal, Platform, Pressable, ScrollView, Text, View } from 'react-native';

import { useApp } from '../state/AppState';
import { nowISO, minutesLabel } from '../domain/dates';
import {
  Draft,
  Entry,
  NOTHING_HELPED,
  STAGES,
  Stage,
  isNothingHelped,
} from '../domain/types';
import { rampColor, radius, space } from '../theme/tokens';
import { Banner, Button, Chip, ConfirmSheet, Field, Label, sheetStyles } from '../ui/primitives';

const QUICK_MINUTES = [5, 10, 20, 30, 45, 60, 90];

function emptyDraft(): Draft {
  return {
    kind: 'episode',
    at: nowISO(),
    stage: 0,
    trigger: null,
    behaviors: [],
    tools: [],
    minutes: 20,
    source: 'Home',
    note: '',
    flagged: false,
    editingId: null,
  };
}

export function draftFromEntry(e: Entry): Draft {
  return {
    kind: e.kind,
    at: e.at,
    stage: (e.stage ?? 0) as Stage | 0,
    trigger: e.trigger,
    behaviors: e.behaviors,
    tools: e.tools,
    minutes: e.minutes ?? 20,
    source: e.source,
    note: e.note ?? '',
    flagged: e.flagged,
    editingId: e.id,
  };
}

export function EntrySheet({
  visible,
  initial,
  onClose,
  onSaved,
}: {
  visible: boolean;
  initial?: Draft | null;
  onClose: () => void;
  onSaved: (saved: Entry, wasNew: boolean) => void;
}) {
  const { palette: p, settings, addEntry, editEntry, draft, setDraft, discardDraft } = useApp();

  const [local, setLocal] = useState<Draft>(initial ?? draft ?? emptyDraft());
  const [showMore, setShowMore] = useState(false);
  const [confirmClose, setConfirmClose] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!visible) return;
    setLocal(initial ?? draft ?? emptyDraft());
    setShowMore(false);
  }, [visible, initial]); // eslint-disable-line react-hooks/exhaustive-deps

  const patch = useCallback(
    (d: Partial<Draft>) => {
      setLocal((prev) => {
        const next = { ...prev, ...d };
        setDraft(next);
        return next;
      });
    },
    [setDraft],
  );

  const dirty = useMemo(() => local.stage !== 0 || !!local.trigger || local.tools.length > 0, [local]);
  const canSave = local.stage !== 0;
  const isEditing = !!local.editingId;

  const toggleTool = (t: string) => {
    // "Nothing we tried helped" is exclusive. Selecting it clears the rest,
    // and selecting anything else clears it.
    if (isNothingHelped(t)) {
      patch({ tools: local.tools.some(isNothingHelped) ? [] : [t] });
      return;
    }
    const without = local.tools.filter((x) => !isNothingHelped(x));
    patch({
      tools: without.includes(t) ? without.filter((x) => x !== t) : [...without, t],
    });
  };

  const save = async () => {
    if (!canSave || saving) return;
    setSaving(true);
    try {
      const payload = {
        at: local.at,
        kind: 'episode' as const,
        stage: local.stage as Stage,
        trigger: local.trigger,
        behaviors: local.behaviors,
        tools: local.tools,
        minutes: local.minutes,
        source: local.source,
        note: local.note.trim() ? local.note.trim() : null,
        flagged: local.flagged,
      };

      let saved: Entry;
      if (local.editingId) {
        const existing: Entry = {
          ...payload,
          id: local.editingId,
          created_at: local.at,
          updated_at: null,
        };
        await editEntry(existing);
        saved = existing;
      } else {
        saved = await addEntry(payload);
      }
      await discardDraft();
      onSaved(saved, !local.editingId);
      onClose();
    } finally {
      setSaving(false);
    }
  };

  const attemptClose = () => {
    if (dirty && !isEditing) setConfirmClose(true);
    else onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={attemptClose}>
      <View style={{ flex: 1, backgroundColor: p.paper }}>
        {/* head */}
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            paddingHorizontal: space.lg,
            paddingVertical: 12,
            paddingTop: Platform.OS === 'ios' ? 54 : 14,
            borderBottomWidth: 1,
            borderBottomColor: p.line,
          }}
        >
          <Text style={{ fontSize: 21, color: p.ink }}>
            {isEditing ? 'Edit this' : 'Something happened'}
          </Text>
          <Pressable
            onPress={attemptClose}
            accessibilityRole="button"
            accessibilityLabel="Close"
            style={{ minHeight: 48, minWidth: 48, justifyContent: 'center', alignItems: 'flex-end' }}
          >
            <Text style={{ color: p.deep, fontWeight: '600', fontSize: 15 }}>Close</Text>
          </Pressable>
        </View>

        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{ padding: space.lg, paddingBottom: 40 }}
          keyboardShouldPersistTaps="handled"
        >
          <View style={{ maxWidth: 460, width: '100%', alignSelf: 'center' }}>
            {/* 1. stage. One tap, no typing, and it is the only required field. */}
            <View style={{ marginBottom: space.xl }}>
              <Label style={{ marginBottom: 9 }}>How far did it get</Label>
              <View style={{ gap: 8 }}>
                {STAGES.map((s) => {
                  const on = local.stage === s.n;
                  const bg = on ? (s.n === 1 ? p.good : s.n === 4 ? p.warn : p.deep) : p.card;
                  return (
                    <Pressable
                      key={s.n}
                      accessibilityRole="button"
                      accessibilityState={{ selected: on }}
                      accessibilityLabel={`${s.name}. ${s.ds}`}
                      onPress={() => patch({ stage: on ? 0 : s.n })}
                      style={{
                        flexDirection: 'row',
                        gap: 12,
                        alignItems: 'flex-start',
                        borderWidth: 1,
                        borderColor: on ? bg : p.edge,
                        backgroundColor: bg,
                        borderRadius: 11,
                        padding: 13,
                        minHeight: 56,
                      }}
                    >
                      <Text
                        style={{
                          fontVariant: ['tabular-nums'],
                          fontSize: 11,
                          fontWeight: '600',
                          color: on ? p.onDeep : p.ink3,
                          width: 14,
                          paddingTop: 3,
                        }}
                      >
                        {s.n}
                      </Text>
                      <View style={{ flex: 1 }}>
                        <Text
                          style={{ fontSize: 15, fontWeight: '600', color: on ? p.onDeep : p.ink }}
                        >
                          {on ? `✓ ${s.name}` : s.name}
                        </Text>
                        <Text
                          style={{
                            fontSize: 12.5,
                            color: on ? p.onDeep : p.ink3,
                            opacity: on ? 0.85 : 1,
                            marginTop: 2,
                          }}
                        >
                          {s.ds}
                        </Text>
                      </View>
                    </Pressable>
                  );
                })}
              </View>
            </View>

            {/* 2. what came before. Never "what caused it". */}
            <View style={{ marginBottom: space.xl }}>
              <Label style={{ marginBottom: 9 }}>What came before</Label>
              <View style={sheetStyles.row}>
                {settings.lib.triggers.map((t) => (
                  <Chip
                    key={t}
                    label={t}
                    selected={local.trigger === t}
                    onPress={() => patch({ trigger: local.trigger === t ? null : t })}
                  />
                ))}
              </View>
            </View>

            {/* 3. back to baseline */}
            <View style={{ marginBottom: space.xl }}>
              <Label style={{ marginBottom: 9 }}>Back to baseline</Label>
              <View
                style={{
                  backgroundColor: p.card,
                  borderWidth: 1,
                  borderColor: p.line,
                  borderRadius: 10,
                  padding: 15,
                }}
              >
                <Text
                  style={{
                    fontVariant: ['tabular-nums'],
                    fontSize: 28,
                    fontWeight: '600',
                    color: p.ink,
                  }}
                >
                  {minutesLabel(local.minutes)}
                </Text>
                <View
                  style={{
                    height: 7,
                    borderRadius: 4,
                    backgroundColor: p.track,
                    overflow: 'hidden',
                    marginVertical: 12,
                  }}
                >
                  <View
                    style={{
                      height: '100%',
                      width: `${Math.min(100, (local.minutes / 120) * 100)}%`,
                      backgroundColor: rampColor(local.minutes, p),
                      borderRadius: 4,
                    }}
                  />
                </View>
                <View style={sheetStyles.row}>
                  {QUICK_MINUTES.map((m) => (
                    <Chip
                      key={m}
                      label={minutesLabel(m)}
                      selected={local.minutes === m}
                      onPress={() => patch({ minutes: m })}
                    />
                  ))}
                </View>
              </View>
            </View>

            {/* 4. what helped */}
            <View style={{ marginBottom: space.xl }}>
              <Label style={{ marginBottom: 9 }}>What helped</Label>
              <View style={sheetStyles.row}>
                {settings.lib.tools.map((t) => (
                  <Chip
                    key={t}
                    label={t}
                    tone={isNothingHelped(t) ? 'warn' : 'default'}
                    selected={local.tools.includes(t)}
                    onPress={() => toggleTool(t)}
                  />
                ))}
              </View>
              {local.tools.some(isNothingHelped) ? (
                <View style={{ marginTop: 12 }}>
                  <Banner tone="warn">
                    Some of them do not settle with anything. Keeping them safe and waiting it out
                    is enough, and logging that is useful.
                  </Banner>
                </View>
              ) : null}
            </View>

            {/* everything below is optional and stays collapsed by default */}
            {!showMore ? (
              <Pressable
                onPress={() => setShowMore(true)}
                accessibilityRole="button"
                style={{
                  minHeight: 48,
                  borderWidth: 1,
                  borderColor: p.line,
                  borderStyle: 'dashed',
                  borderRadius: 11,
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: space.lg,
                }}
              >
                <Text style={{ color: p.deep, fontWeight: '600', fontSize: 14.5 }}>
                  Add more detail
                </Text>
              </Pressable>
            ) : (
              <View>
                <View style={{ marginBottom: space.xl }}>
                  <Label style={{ marginBottom: 9 }}>Where</Label>
                  <View style={sheetStyles.row}>
                    {settings.lib.sources.map((s) => (
                      <Chip
                        key={s}
                        label={s}
                        selected={local.source === s}
                        onPress={() => patch({ source: s })}
                      />
                    ))}
                  </View>
                </View>

                <View style={{ marginBottom: space.xl }}>
                  <Label style={{ marginBottom: 9 }}>What it looked like</Label>
                  <View style={sheetStyles.row}>
                    {settings.lib.behaviors.map((b) => (
                      <Chip
                        key={b}
                        label={b}
                        selected={local.behaviors.includes(b)}
                        onPress={() =>
                          patch({
                            behaviors: local.behaviors.includes(b)
                              ? local.behaviors.filter((x) => x !== b)
                              : [...local.behaviors, b],
                          })
                        }
                      />
                    ))}
                  </View>
                </View>

                <Field
                  label="Anything worth remembering"
                  value={local.note}
                  onChangeText={(v) => patch({ note: v })}
                  placeholder="One line is plenty"
                  multiline
                />

                <Pressable
                  onPress={() => patch({ flagged: !local.flagged })}
                  accessibilityRole="checkbox"
                  accessibilityState={{ checked: local.flagged }}
                  style={{
                    minHeight: 48,
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 10,
                    marginBottom: space.lg,
                  }}
                >
                  <Text style={{ fontSize: 18, color: local.flagged ? p.deep : p.ink3 }}>
                    {local.flagged ? '☑' : '☐'}
                  </Text>
                  <Text style={{ color: p.ink2, fontSize: 15 }}>Raise this one with the doctor</Text>
                </Pressable>
              </View>
            )}
          </View>
        </ScrollView>

        {/* save lives in a fixed bottom bar, inside the thumb zone */}
        <View
          style={{
            padding: space.lg,
            paddingBottom: Platform.OS === 'ios' ? 34 : space.lg,
            borderTopWidth: 1,
            borderTopColor: p.line,
            backgroundColor: p.paper,
          }}
        >
          <Button
            label={isEditing ? 'Save changes' : 'Save'}
            onPress={save}
            disabled={!canSave}
            busy={saving}
            accessibilityHint={canSave ? undefined : 'Pick how far it got first'}
          />
          <Text
            style={{
              fontVariant: ['tabular-nums'],
              fontSize: 10,
              color: p.ink3,
              textAlign: 'center',
              marginTop: 9,
            }}
          >
            {canSave ? 'Saved as you go' : 'One tap above is all this needs'}
          </Text>
        </View>
      </View>

      <ConfirmSheet
        visible={confirmClose}
        message="Leave this without saving? What you have picked so far will be kept as a draft."
        confirmLabel="Leave it"
        cancelLabel="Keep going"
        onCancel={() => setConfirmClose(false)}
        onConfirm={() => {
          setConfirmClose(false);
          onClose();
        }}
      />
    </Modal>
  );
}

export { emptyDraft };
