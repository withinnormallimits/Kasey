/**
 * "When it happened" for iOS and Android.
 *
 * Same two controls as the web file next to this one, a date and a time,
 * side by side. React Native has no date input, so each opens the platform
 * picker. Both carry an accessibility label matching the web aria-label.
 */

import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import React, { useState } from 'react';
import { Platform, Pressable, Text, View } from 'react-native';

import { toLocalISO } from '../domain/dates';
import { usePalette } from '../state/AppState';
import { TAP, space } from '../theme/tokens';

type Mode = 'date' | 'time' | null;

export function WhenField({
  value,
  onChange,
}: {
  value: string;
  onChange: (iso: string) => void;
}) {
  const p = usePalette();
  const [mode, setMode] = useState<Mode>(null);
  const d = new Date(value);

  const dateLabel = d.toLocaleDateString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });
  const timeLabel = d.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });

  const onPicked = (event: DateTimePickerEvent, picked?: Date) => {
    // Android fires with type 'dismissed' when the parent cancels. Changing
    // nothing on dismiss is what keeps backdating correctable rather than
    // destructive.
    if (Platform.OS === 'android') setMode(null);
    if (event.type === 'dismissed' || !picked) return;

    const next = new Date(d);
    if (mode === 'date') {
      next.setFullYear(picked.getFullYear(), picked.getMonth(), picked.getDate());
    } else {
      next.setHours(picked.getHours(), picked.getMinutes(), 0, 0);
    }
    onChange(toLocalISO(next));
  };

  const box = {
    flex: 1,
    minHeight: TAP,
    backgroundColor: p.card,
    borderWidth: 1,
    borderColor: p.edge,
    borderRadius: 10,
    paddingHorizontal: 13,
    justifyContent: 'center' as const,
  };

  return (
    <View style={{ marginBottom: space.xl }}>
      <Text style={{ fontSize: 13, fontWeight: '600', color: p.ink2, marginBottom: 8 }}>
        When it happened{' '}
        <Text style={{ fontWeight: '400', color: p.ink3 }}>
          change this if you&apos;re logging it later
        </Text>
      </Text>

      <View style={{ flexDirection: 'row', gap: 8 }}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Date"
          accessibilityValue={{ text: dateLabel }}
          onPress={() => setMode('date')}
          style={box}
        >
          <Text style={{ color: p.ink, fontSize: 16 }}>{dateLabel}</Text>
        </Pressable>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Time"
          accessibilityValue={{ text: timeLabel }}
          onPress={() => setMode('time')}
          style={box}
        >
          <Text style={{ color: p.ink, fontSize: 16 }}>{timeLabel}</Text>
        </Pressable>
      </View>

      {mode ? (
        <DateTimePicker
          value={d}
          mode={mode}
          // an episode cannot have happened in the future
          maximumDate={mode === 'date' ? new Date() : undefined}
          onChange={onPicked}
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
        />
      ) : null}

      {Platform.OS === 'ios' && mode ? (
        <Pressable
          accessibilityRole="button"
          onPress={() => setMode(null)}
          style={{ minHeight: TAP, alignItems: 'center', justifyContent: 'center' }}
        >
          <Text style={{ color: p.deep, fontWeight: '600', fontSize: 15 }}>Done</Text>
        </Pressable>
      ) : null}
    </View>
  );
}
