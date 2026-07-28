/**
 * Shared interface pieces.
 *
 * Two rules are enforced here rather than left to each screen:
 * - Every touch target is at least TAP (48px).
 * - Meaning is never carried by colour alone. Anything that uses colour to say
 *   something also carries a label, a shape, or a number.
 *
 * There is no window.confirm equivalent anywhere in this app. Confirmation is
 * an in-app sheet, never a native modal.
 */

import React from 'react';
import {
  ActivityIndicator,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TextStyle,
  View,
  ViewStyle,
} from 'react-native';

import { Palette, TAP, radius, space } from '../theme/tokens';
import { usePalette } from '../state/AppState';

/* ---------------------------------------------------------------- text --- */

export function Title({ children, style }: { children: React.ReactNode; style?: TextStyle }) {
  const p = usePalette();
  return (
    <Text style={[{ fontSize: 25, color: p.ink, letterSpacing: -0.3, lineHeight: 30 }, style]}>
      {children}
    </Text>
  );
}

export function Body({
  children,
  muted,
  style,
}: {
  children: React.ReactNode;
  muted?: boolean;
  style?: TextStyle;
}) {
  const p = usePalette();
  return (
    <Text style={[{ fontSize: 15, lineHeight: 22, color: muted ? p.ink3 : p.ink2 }, style]}>
      {children}
    </Text>
  );
}

export function Label({ children, style }: { children: React.ReactNode; style?: TextStyle }) {
  const p = usePalette();
  return (
    <Text
      style={[
        {
          fontSize: 10.5,
          letterSpacing: 1.4,
          textTransform: 'uppercase',
          color: p.ink3,
          fontWeight: '600',
        },
        style,
      ]}
    >
      {children}
    </Text>
  );
}

export function Mono({ children, style }: { children: React.ReactNode; style?: TextStyle }) {
  const p = usePalette();
  return (
    <Text style={[{ fontVariant: ['tabular-nums'], fontSize: 12, color: p.ink3 }, style]}>
      {children}
    </Text>
  );
}

/* -------------------------------------------------------------- surface --- */

export function Card({
  children,
  style,
}: {
  children: React.ReactNode;
  style?: ViewStyle;
}) {
  const p = usePalette();
  return (
    <View
      style={[
        {
          backgroundColor: p.card,
          borderWidth: 1,
          borderColor: p.line,
          borderRadius: radius.md,
          padding: space.lg,
        },
        style,
      ]}
    >
      {children}
    </View>
  );
}

/* -------------------------------------------------------------- buttons --- */

type ButtonTone = 'primary' | 'good' | 'quiet' | 'danger';

export function Button({
  label,
  onPress,
  tone = 'primary',
  disabled,
  busy,
  style,
  accessibilityHint,
}: {
  label: string;
  onPress: () => void;
  tone?: ButtonTone;
  disabled?: boolean;
  busy?: boolean;
  style?: ViewStyle;
  accessibilityHint?: string;
}) {
  const p = usePalette();
  const tones: Record<ButtonTone, { bg: string; fg: string; border: string }> = {
    primary: { bg: p.deep, fg: p.onDeep, border: p.deep },
    good: { bg: p.card, fg: p.good, border: p.good },
    quiet: { bg: p.card, fg: p.ink2, border: p.edge },
    danger: { bg: p.card, fg: p.warn, border: p.edge },
  };
  const t = tones[tone];

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityHint={accessibilityHint}
      accessibilityState={{ disabled: !!disabled, busy: !!busy }}
      disabled={disabled || busy}
      onPress={onPress}
      style={({ pressed }) => [
        {
          minHeight: 56,
          borderRadius: radius.md,
          backgroundColor: t.bg,
          borderWidth: tone === 'primary' ? 0 : 1.5,
          borderColor: t.border,
          alignItems: 'center',
          justifyContent: 'center',
          paddingHorizontal: space.lg,
          opacity: disabled ? 0.5 : pressed ? 0.9 : 1,
        },
        style,
      ]}
    >
      {busy ? (
        <ActivityIndicator color={t.fg} />
      ) : (
        <Text style={{ color: t.fg, fontWeight: '600', fontSize: 15.5 }}>{label}</Text>
      )}
    </Pressable>
  );
}

/** Selectable chip. Selection is shown by fill AND by the pressed state a
 *  screen reader announces, never by colour alone. */
export function Chip({
  label,
  selected,
  onPress,
  tone = 'default',
}: {
  label: string;
  selected: boolean;
  onPress: () => void;
  tone?: 'default' | 'warn';
}) {
  const p = usePalette();
  const bg = selected ? (tone === 'warn' ? p.warn : p.deep) : p.card;
  const fg = selected ? p.onDeep : p.ink2;
  const border = selected ? (tone === 'warn' ? p.warn : p.deep) : p.edge;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected }}
      accessibilityLabel={label}
      onPress={onPress}
      style={{
        minHeight: 44,
        paddingHorizontal: 15,
        borderRadius: radius.pill,
        borderWidth: 1,
        borderColor: border,
        backgroundColor: bg,
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Text style={{ color: fg, fontSize: 14, fontWeight: selected ? '600' : '400' }}>
        {selected ? `✓ ${label}` : label}
      </Text>
    </Pressable>
  );
}

export function Field({
  label,
  value,
  onChangeText,
  placeholder,
  multiline,
  hint,
  keyboardType,
  hideLabel,
}: {
  label: string;
  value: string;
  onChangeText: (v: string) => void;
  placeholder?: string;
  multiline?: boolean;
  hint?: string;
  keyboardType?: 'default' | 'number-pad';
  /**
   * Keeps the label for screen readers but does not draw it. Used where the
   * question is already the visible heading, as in onboarding, so a sighted
   * parent does not read the same sentence twice while a screen reader user
   * still gets the field labelled.
   */
  hideLabel?: boolean;
}) {
  const p = usePalette();
  return (
    <View style={{ marginBottom: space.xl }}>
      {hideLabel ? null : (
        <Text style={{ fontSize: 13, fontWeight: '600', color: p.ink2, marginBottom: 8 }}>
          {label}
          {hint ? <Text style={{ fontWeight: '400', color: p.ink3 }}>{`  ${hint}`}</Text> : null}
        </Text>
      )}
      <TextInput
        accessibilityLabel={label}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={p.ink3}
        multiline={multiline}
        keyboardType={keyboardType}
        style={{
          backgroundColor: p.card,
          borderWidth: 1,
          borderColor: p.edge,
          borderRadius: 10,
          padding: 13,
          minHeight: multiline ? 80 : TAP,
          color: p.ink,
          // 16px stops iOS zooming the whole page on focus
          fontSize: 16,
          textAlignVertical: multiline ? 'top' : 'center',
        }}
      />
    </View>
  );
}

/* ------------------------------------------------------------- feedback --- */

export function Banner({
  children,
  tone = 'info',
}: {
  children: React.ReactNode;
  tone?: 'info' | 'good' | 'warn';
}) {
  const p = usePalette();
  const map = {
    info: { bg: p.deepSoft, fg: p.onDeepSoft },
    good: { bg: p.goodSoft, fg: p.onGoodSoft },
    warn: { bg: p.warnSoft, fg: p.onWarnSoft },
  } as const;
  const t = map[tone];
  return (
    <View style={{ backgroundColor: t.bg, borderRadius: 10, padding: 13, marginBottom: space.lg }}>
      <Text style={{ color: t.fg, fontSize: 13, lineHeight: 19 }}>{children}</Text>
    </View>
  );
}

/**
 * In-app confirmation. Never window.confirm, alert, or prompt.
 * Destructive actions get the warn tone; everything else stays neutral.
 */
export function ConfirmSheet({
  visible,
  message,
  confirmLabel,
  cancelLabel = 'Keep it',
  destructive,
  onConfirm,
  onCancel,
}: {
  visible: boolean;
  message: string;
  confirmLabel: string;
  cancelLabel?: string;
  destructive?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  const p = usePalette();
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>
      <Pressable
        accessibilityLabel="Dismiss"
        onPress={onCancel}
        style={{ flex: 1, backgroundColor: 'rgba(10,16,15,0.55)', justifyContent: 'flex-end' }}
      >
        <Pressable
          onPress={() => undefined}
          style={{
            backgroundColor: p.paper,
            borderTopLeftRadius: radius.lg,
            borderTopRightRadius: radius.lg,
            padding: space.xl,
            paddingBottom: space.xxl,
          }}
        >
          <Text style={{ fontSize: 16.5, lineHeight: 24, color: p.ink, marginBottom: space.xl }}>
            {message}
          </Text>
          <View style={{ flexDirection: 'row', gap: 9 }}>
            <Button label={cancelLabel} tone="quiet" onPress={onCancel} style={{ flex: 1 }} />
            <Button
              label={confirmLabel}
              tone={destructive ? 'danger' : 'primary'}
              onPress={onConfirm}
              style={{ flex: 1 }}
            />
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

/** Transient message with an optional undo. Undo is why good days are safe. */
export function Toast({
  message,
  actionLabel,
  onAction,
}: {
  message: string;
  actionLabel?: string;
  onAction?: () => void;
}) {
  const p = usePalette();
  return (
    <View
      accessibilityLiveRegion="polite"
      style={{
        position: 'absolute',
        left: space.lg,
        right: space.lg,
        bottom: 96,
        backgroundColor: p.ink,
        borderRadius: 24,
        paddingVertical: 12,
        paddingHorizontal: 18,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 14,
      }}
    >
      <Text style={{ color: p.paper, fontSize: 13.5, flex: 1 }}>{message}</Text>
      {actionLabel && onAction ? (
        <Pressable onPress={onAction} accessibilityRole="button" style={{ minHeight: 32, justifyContent: 'center' }}>
          <Text style={{ color: p.deep === p.ink ? p.paper : '#8FD6B4', fontWeight: '700' }}>
            {actionLabel}
          </Text>
        </Pressable>
      ) : null}
    </View>
  );
}

export function Screen({ children }: { children: React.ReactNode }) {
  const p = usePalette();
  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: p.paper }}
      contentContainerStyle={{ padding: space.lg, paddingBottom: 180 }}
      keyboardShouldPersistTaps="handled"
    >
      <View style={{ maxWidth: 460, width: '100%', alignSelf: 'center' }}>{children}</View>
    </ScrollView>
  );
}

export const sheetStyles = StyleSheet.create({
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: 7 },
});

export { TAP, space, radius };
export type { Palette };
