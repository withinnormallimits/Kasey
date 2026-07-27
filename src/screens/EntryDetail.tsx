/**
 * Read-only entry detail.
 *
 * SPEC.md: "Tap an entry then read-only detail with Edit and Delete. Never tap
 * straight into a form." Tapping into an editable form means a parent glancing
 * at what happened can change it by accident.
 *
 * The audit lines at the bottom are the point of this screen once backdating
 * exists. "Added" is when it was logged, which can be days after "when it
 * happened". Without that line a backdated entry looks like a live one, and
 * the record stops being honest about itself.
 */

import React, { useState } from 'react';
import { Modal, Platform, Pressable, ScrollView, Text, View } from 'react-native';

import { analyse } from '../domain/analyse';
import { minutesLabel, relativeDayLabel, timeLabel } from '../domain/dates';
import { Entry, STAGES, isNothingHelped } from '../domain/types';
import { useApp } from '../state/AppState';
import { rampColor, radius, space } from '../theme/tokens';
import { Button, ConfirmSheet, Label } from '../ui/primitives';

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={{ marginBottom: space.xl }}>
      <Label style={{ marginBottom: 9 }}>{title}</Label>
      {children}
    </View>
  );
}

export function EntryDetail({
  entry,
  visible,
  onClose,
  onEdit,
}: {
  entry: Entry | null;
  visible: boolean;
  onClose: () => void;
  onEdit: (e: Entry) => void;
}) {
  const { palette: p, entries, removeEntry } = useApp();
  const [confirmDelete, setConfirmDelete] = useState(false);

  if (!entry) return null;

  const isGood = entry.kind === 'good';
  const stage = STAGES.find((s) => s.n === entry.stage);
  const nothing = entry.tools.some(isNothingHelped);
  const typical = analyse(entries).typical;

  const body = (
    <ScrollView
      style={{ flex: 1 }}
      contentContainerStyle={{ padding: space.lg, paddingBottom: 60 }}
    >
      <View style={{ maxWidth: 460, width: '100%', alignSelf: 'center' }}>
        <View
          style={{
            paddingTop: 10,
            paddingBottom: 20,
            borderBottomWidth: 1,
            borderBottomColor: p.line,
            marginBottom: space.xl,
          }}
        >
          <Text
            style={{
              fontSize: 11,
              letterSpacing: 1.2,
              textTransform: 'uppercase',
              color: p.ink3,
              marginBottom: 9,
              fontWeight: '600',
            }}
          >
            {`${relativeDayLabel(entry.at)}, ${timeLabel(entry.at)}`}
          </Text>
          <Text style={{ fontSize: 30, color: p.ink, lineHeight: 35 }}>
            {isGood ? 'A good day' : entry.trigger || 'Something happened'}
          </Text>
        </View>

        {isGood ? (
          <Section title="What you said">
            <Text style={{ fontSize: 16, color: entry.note ? p.ink : p.ink3, lineHeight: 24 }}>
              {entry.note || 'No note on this one.'}
            </Text>
          </Section>
        ) : (
          <>
            <Section title="How far it got">
              <Text style={{ fontSize: 16, color: p.ink, lineHeight: 24 }}>
                {stage ? `${stage.n}. ${stage.name}` : 'Not recorded'}
              </Text>
              {stage ? (
                <Text style={{ fontSize: 14, color: p.ink3, marginTop: 2 }}>{stage.ds}</Text>
              ) : null}
            </Section>

            <Section title="Back to baseline">
              <View
                style={{
                  backgroundColor: p.card,
                  borderWidth: 1,
                  borderColor: p.line,
                  borderRadius: radius.md,
                  padding: 16,
                }}
              >
                <Text
                  style={{
                    fontVariant: ['tabular-nums'],
                    fontSize: 30,
                    fontWeight: '600',
                    color: p.ink,
                  }}
                >
                  {minutesLabel(entry.minutes ?? 0)}
                </Text>
                <View
                  style={{
                    height: 7,
                    borderRadius: 4,
                    backgroundColor: p.track,
                    overflow: 'hidden',
                    marginTop: 12,
                  }}
                >
                  <View
                    style={{
                      height: '100%',
                      width: `${Math.min(100, ((entry.minutes ?? 0) / 120) * 100)}%`,
                      backgroundColor: rampColor(entry.minutes ?? 0, p),
                      borderRadius: 4,
                    }}
                  />
                </View>
                {typical > 0 ? (
                  <Text style={{ fontSize: 12.5, color: p.ink3, marginTop: 10 }}>
                    {(entry.minutes ?? 0) === typical
                      ? `The usual for them is ${minutesLabel(typical)} too.`
                      : `The usual for them is ${minutesLabel(typical)}.`}
                  </Text>
                ) : null}
              </View>
            </Section>

            <Section title="What came before">
              <Text style={{ fontSize: 16, color: entry.trigger ? p.ink : p.ink3, lineHeight: 24 }}>
                {entry.trigger || 'Nothing recorded'}
              </Text>
            </Section>

            <Section title="What helped">
              {entry.tools.length ? (
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
                  {entry.tools.map((t) => (
                    <View
                      key={t}
                      style={{
                        backgroundColor: isNothingHelped(t) ? p.warnSoft : p.deepSoft,
                        borderRadius: radius.pill,
                        paddingVertical: 8,
                        paddingHorizontal: 14,
                      }}
                    >
                      <Text
                        style={{
                          color: isNothingHelped(t) ? p.onWarnSoft : p.onDeepSoft,
                          fontSize: 14,
                        }}
                      >
                        {t}
                      </Text>
                    </View>
                  ))}
                </View>
              ) : (
                <Text style={{ fontSize: 16, color: p.ink3 }}>Nothing recorded</Text>
              )}
              {nothing ? (
                <Text style={{ fontSize: 12.5, color: p.ink3, marginTop: 10, lineHeight: 19 }}>
                  Keeping them safe and waiting it out is enough. That is not a failure.
                </Text>
              ) : null}
            </Section>

            {entry.behaviors.length ? (
              <Section title="What it looked like">
                <Text style={{ fontSize: 16, color: p.ink, lineHeight: 24 }}>
                  {entry.behaviors.join(', ')}
                </Text>
              </Section>
            ) : null}

            <Section title="Where">
              <Text style={{ fontSize: 16, color: p.ink }}>{entry.source || 'Home'}</Text>
            </Section>

            {entry.note ? (
              <Section title="Note">
                <Text style={{ fontSize: 16, color: p.ink, lineHeight: 24 }}>{entry.note}</Text>
              </Section>
            ) : null}

            {entry.flagged ? (
              <Section title="Flagged">
                <Text style={{ fontSize: 16, color: p.ink }}>Raise this one with the doctor.</Text>
              </Section>
            ) : null}
          </>
        )}

        {/*
          The audit trail. "Added" is when this was logged, which is not the
          same as when it happened once backdating exists.
        */}
        <View style={{ borderTopWidth: 1, borderTopColor: p.line, paddingTop: 14 }}>
          <Text
            style={{ fontVariant: ['tabular-nums'], fontSize: 11, color: p.ink3, lineHeight: 20 }}
          >
            {`Added ${relativeDayLabel(entry.created_at)}, ${timeLabel(entry.created_at)}`}
          </Text>
          {entry.updated_at ? (
            <Text
              style={{ fontVariant: ['tabular-nums'], fontSize: 11, color: p.ink3, lineHeight: 20 }}
            >
              {`Edited ${relativeDayLabel(entry.updated_at)}, ${timeLabel(entry.updated_at)}`}
            </Text>
          ) : null}
        </View>

        <View style={{ flexDirection: 'row', gap: 9, marginTop: space.xxl }}>
          <Button
            label={isGood ? 'Add a note' : 'Edit'}
            onPress={() => onEdit(entry)}
            style={{ flex: 1 }}
          />
          <Button
            label="Delete"
            tone="danger"
            onPress={() => setConfirmDelete(true)}
            style={{ flex: 1 }}
          />
        </View>
      </View>
    </ScrollView>
  );

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <View style={{ flex: 1, backgroundColor: p.paper }}>
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
          <Text style={{ fontSize: 15, color: p.ink3 }}>
            {isGood ? 'Good day' : entry.source || 'Home'}
          </Text>
          <Pressable
            onPress={onClose}
            accessibilityRole="button"
            accessibilityLabel="Close"
            style={{ minHeight: 48, minWidth: 48, justifyContent: 'center', alignItems: 'flex-end' }}
          >
            <Text style={{ color: p.deep, fontWeight: '600', fontSize: 15 }}>Close</Text>
          </Pressable>
        </View>
        {body}
      </View>

      <ConfirmSheet
        visible={confirmDelete}
        message={
          isGood
            ? 'Delete this good day? It will stop counting towards the days you have logged.'
            : 'Delete this entry? It will be removed from the pages you hand people, and there is no undo.'
        }
        confirmLabel="Delete it"
        cancelLabel="Keep it"
        destructive
        onCancel={() => setConfirmDelete(false)}
        onConfirm={() => {
          setConfirmDelete(false);
          void removeEntry(entry.id);
          onClose();
        }}
      />
    </Modal>
  );
}
