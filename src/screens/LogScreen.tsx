/**
 * The log.
 *
 * The summary strip at the top exists because of a specific research finding:
 * the generated report cannot be the only payoff. Most abandonment happens in
 * the first week, and a report needs accumulated data, so an app that gives
 * nothing back until there is "enough" dies before its own feature ships.
 * The strip is the cheap, always-current answer to "was any of this worth it".
 *
 * The verdict for a day renders ABOVE that day's episodes, indented beneath
 * it. The nesting states the relationship: a rough half hour does not cancel a
 * decent day.
 */

import React, { useMemo, useState } from 'react';
import { Platform, Pressable, Text, View } from 'react-native';

import { analyse, lastNDays } from '../domain/analyse';
import { dateKey, minutesLabel, relativeDayLabel, timeLabel } from '../domain/dates';
import { Entry, STAGES, Stage } from '../domain/types';
import { useApp } from '../state/AppState';
import { rampColor, radius, space } from '../theme/tokens';
import { Body, Card, Label, Mono, Title } from '../ui/primitives';

function StatBlock({ n, caption }: { n: string; caption: string }) {
  const { palette: p } = useApp();
  return (
    <View style={{ flex: 1, minWidth: 0 }}>
      <Text
        style={{
          fontVariant: ['tabular-nums'],
          fontSize: 21,
          fontWeight: '600',
          color: p.ink,
          letterSpacing: -0.4,
        }}
      >
        {n}
      </Text>
      <Text style={{ fontSize: 11.5, color: p.ink3, marginTop: 5, lineHeight: 15 }}>{caption}</Text>
    </View>
  );
}

function SummaryStrip() {
  const { entries, palette: p } = useApp();
  const recent = useMemo(() => lastNDays(entries, 30), [entries]);
  const a = useMemo(() => analyse(recent), [recent]);

  if (entries.length === 0) return null;

  return (
    <Card style={{ marginBottom: space.lg }}>
      <Label style={{ marginBottom: 10 }}>Last 30 days</Label>
      <View style={{ flexDirection: 'row', gap: 16 }}>
        <StatBlock n={String(a.allDays)} caption={a.allDays === 1 ? 'day logged' : 'days logged'} />
        <StatBlock
          n={String(a.hardDays)}
          caption={a.hardDays === 1 ? 'day with an episode' : 'days with an episode'}
        />
        <StatBlock
          n={a.episodes ? minutesLabel(a.typical) : '--'}
          caption="typical time to settle"
        />
      </View>

      {a.episodes > 0 ? (
        <>
          <View
            style={{
              height: 6,
              borderRadius: 3,
              backgroundColor: p.goodSoft,
              overflow: 'hidden',
              marginTop: 14,
              flexDirection: 'row',
            }}
          >
            <View
              style={{
                width: `${a.allDays ? (a.clearDays / a.allDays) * 100 : 0}%`,
                backgroundColor: p.good,
              }}
            />
            <View
              style={{
                width: `${a.allDays ? (a.hardDays / a.allDays) * 100 : 0}%`,
                backgroundColor: p.deep,
              }}
            />
          </View>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 6 }}>
            <Mono>{`${a.clearDays} clear`}</Mono>
            <Mono>{`${a.hardDays} with an episode`}</Mono>
          </View>
        </>
      ) : null}

      {a.caughtEarly > 0 ? (
        <Text style={{ fontSize: 12.5, color: p.good, marginTop: 12, fontWeight: '600' }}>
          {`Caught early ${a.caughtEarly} ${a.caughtEarly === 1 ? 'time' : 'times'}. That is the one worth counting.`}
        </Text>
      ) : null}
    </Card>
  );
}

function EpisodeRow({ e, onPress }: { e: Entry; onPress: () => void }) {
  const { palette: p } = useApp();
  const stage = STAGES.find((s) => s.n === e.stage);
  const nothing = e.tools.some((t) => /^nothing/i.test(t));

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${e.trigger ?? 'Something happened'}, ${
        stage ? stage.name : ''
      }, back to baseline in ${minutesLabel(e.minutes ?? 0)}`}
      style={{
        backgroundColor: p.card,
        borderWidth: 1,
        borderColor: p.line,
        borderRadius: radius.md,
        padding: 13,
        marginBottom: 9,
        minHeight: 48,
      }}
    >
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: 10 }}>
        <Text style={{ fontWeight: '600', fontSize: 15, color: p.ink, flex: 1 }}>
          {e.trigger ?? 'Something happened'}
        </Text>
        <Mono>{timeLabel(e.at)}</Mono>
      </View>

      {stage ? (
        <Text style={{ fontSize: 13, color: p.ink2, marginTop: 3, marginBottom: 10 }}>
          {`${stage.n}. ${stage.name}`}
        </Text>
      ) : null}

      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 9 }}>
        <View
          style={{
            height: 7,
            borderRadius: 4,
            flex: 1,
            backgroundColor: p.track,
            overflow: 'hidden',
          }}
        >
          <View
            style={{
              height: '100%',
              width: `${Math.min(100, ((e.minutes ?? 0) / 120) * 100)}%`,
              backgroundColor: rampColor(e.minutes ?? 0, p),
              borderRadius: 4,
            }}
          />
        </View>
        <Mono style={{ fontWeight: '600', color: p.ink2, minWidth: 52, textAlign: 'right' }}>
          {minutesLabel(e.minutes ?? 0)}
        </Mono>
      </View>

      {e.tools.length > 0 ? (
        <Text
          style={{ fontSize: 12, color: nothing ? p.warn : p.deep, marginTop: 8 }}
        >
          {nothing ? 'Nothing we tried helped' : `Helped: ${e.tools.join(', ')}`}
        </Text>
      ) : null}

      {e.note ? (
        <Text style={{ fontSize: 12.5, color: p.ink3, marginTop: 8, fontStyle: 'italic' }}>
          {e.note}
        </Text>
      ) : null}
    </Pressable>
  );
}

function GoodDayRow({ e, hasBelow, onPress }: { e: Entry; hasBelow: boolean; onPress: () => void }) {
  const { palette: p } = useApp();
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`A good day${e.note ? `. ${e.note}` : ''}`}
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: 11,
        backgroundColor: p.goodSoft,
        borderWidth: 1,
        borderColor: p.line,
        borderTopLeftRadius: 10,
        borderTopRightRadius: 10,
        borderBottomLeftRadius: hasBelow ? 4 : 10,
        borderBottomRightRadius: hasBelow ? 4 : 10,
        padding: 12,
        marginBottom: hasBelow ? 5 : 9,
        minHeight: 48,
      }}
    >
      <Text style={{ color: p.onGoodSoft, fontSize: 16 }}>✓</Text>
      <Text style={{ fontSize: 14.5, fontWeight: '600', color: p.onGoodSoft, flex: 1 }}>
        {e.note ? `A good day. ${e.note}` : 'A good day'}
      </Text>
      <Mono style={{ color: p.onGoodSoft }}>{timeLabel(e.at)}</Mono>
    </Pressable>
  );
}

export function LogScreen({ onOpenEntry }: { onOpenEntry: (e: Entry) => void }) {
  const { entries, settings, palette: p } = useApp();

  const days = useMemo(() => {
    const map = new Map<string, { good: Entry | null; episodes: Entry[] }>();
    for (const e of entries) {
      const k = dateKey(e.at);
      if (!map.has(k)) map.set(k, { good: null, episodes: [] });
      const bucket = map.get(k)!;
      if (e.kind === 'good') bucket.good = e;
      else bucket.episodes.push(e);
    }
    return [...map.entries()].sort((a, b) => b[0].localeCompare(a[0]));
  }, [entries]);

  const name = settings.childName.trim();

  if (entries.length === 0) {
    return (
      <View style={{ paddingTop: 60, paddingHorizontal: space.lg, alignItems: 'center' }}>
        <Title style={{ textAlign: 'center', marginBottom: 8 }}>
          {name ? `Nothing logged for ${name} yet` : 'Nothing logged yet'}
        </Title>
        <Body muted style={{ textAlign: 'center', maxWidth: 300 }}>
          Log a hard moment once it is over, or mark a good day. Both are worth recording, and a
          record made only of hard moments makes any child look worse than they are.
        </Body>
      </View>
    );
  }

  return (
    <View>
      <SummaryStrip />
      {days.map(([key, bucket]) => {
        const label = relativeDayLabel(`${key}T12:00:00`);
        return (
          <View key={key} style={{ marginBottom: 14 }}>
            <Label style={{ marginBottom: 9 }}>{label}</Label>
            {bucket.good ? (
              <GoodDayRow
                e={bucket.good}
                hasBelow={bucket.episodes.length > 0}
                onPress={() => onOpenEntry(bucket.good!)}
              />
            ) : null}
            <View
              style={
                bucket.good
                  ? { borderLeftWidth: 2, borderLeftColor: p.goodSoft, paddingLeft: 9 }
                  : undefined
              }
            >
              {bucket.episodes.map((e) => (
                <EpisodeRow key={e.id} e={e} onPress={() => onOpenEntry(e)} />
              ))}
            </View>
          </View>
        );
      })}
    </View>
  );
}
