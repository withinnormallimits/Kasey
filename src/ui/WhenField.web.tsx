/**
 * "When it happened" for web.
 *
 * Uses real date and time inputs, exactly as the prototype does. The native
 * file next to this one uses the platform pickers. Metro picks the right one.
 */

import React from 'react';
import { Text, View } from 'react-native';

import { fromDateAndTime, toDateInput, toLocalISO, toTimeInput } from '../domain/dates';
import { usePalette } from '../state/AppState';
import { TAP, space } from '../theme/tokens';

export function WhenField({
  value,
  onChange,
}: {
  value: string;
  onChange: (iso: string) => void;
}) {
  const p = usePalette();
  const d = new Date(value);

  const inputStyle = {
    backgroundColor: p.card,
    border: `1px solid ${p.edge}`,
    borderRadius: 10,
    padding: 13,
    minHeight: TAP,
    color: p.ink,
    fontSize: 16,
    width: '100%',
    boxSizing: 'border-box' as const,
    fontFamily: 'inherit',
  };

  const commit = (dateStr: string, timeStr: string) => {
    const next = fromDateAndTime(dateStr, timeStr);
    if (next) onChange(toLocalISO(next));
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
        <View style={{ flex: 1 }}>
          {React.createElement('input', {
            type: 'date',
            'aria-label': 'Date',
            value: toDateInput(d),
            max: toDateInput(new Date()),
            onChange: (e: { target: { value: string } }) =>
              commit(e.target.value, toTimeInput(d)),
            style: inputStyle,
          })}
        </View>
        <View style={{ flex: 1 }}>
          {React.createElement('input', {
            type: 'time',
            'aria-label': 'Time',
            value: toTimeInput(d),
            onChange: (e: { target: { value: string } }) =>
              commit(toDateInput(d), e.target.value),
            style: inputStyle,
          })}
        </View>
      </View>
    </View>
  );
}
