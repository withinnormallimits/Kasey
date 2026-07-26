/**
 * First run.
 *
 * The point is that a real, printable page exists before a single episode is
 * logged. Time to first value is the retention lever: most people in this
 * category quit long before log-based value could accrue, so the app has to
 * be worth something in the first session.
 *
 * Four questions, all about who the child is. None about what goes wrong.
 */

import React, { useState } from 'react';
import { Platform, Pressable, ScrollView, Text, View } from 'react-native';

import { useApp } from '../state/AppState';
import { Settings } from '../domain/types';
import { paperDoc, radius, space } from '../theme/tokens';
import { Banner, Button, Field } from '../ui/primitives';

interface Question {
  key: keyof Pick<Settings, 'childName' | 'loves' | 'proudOf' | 'laughs'>;
  label: string;
  placeholder: string;
  hint: string;
}

const QUESTIONS: Question[] = [
  { key: 'childName', label: 'What do you call them?', placeholder: 'Avi', hint: 'first name is fine' },
  {
    key: 'loves',
    label: 'What do they love?',
    placeholder: 'Trains, anything with a map, his dog Rocket',
    hint: 'the thing they would talk about all day',
  },
  {
    key: 'proudOf',
    label: 'What are they proud of?',
    placeholder: 'Reading chapter books on his own',
    hint: '',
  },
  {
    key: 'laughs',
    label: 'What makes them laugh?',
    placeholder: 'Silly voices and terrible knock-knock jokes',
    hint: '',
  },
];

export function Onboarding({ onDone }: { onDone: (goToPage: boolean) => void }) {
  const { settings, saveSettings, palette: p } = useApp();
  const [step, setStep] = useState(0);
  const [local, setLocal] = useState({
    childName: settings.childName,
    loves: settings.loves,
    proudOf: settings.proudOf,
    laughs: settings.laughs,
  });

  const finish = async (goToPage: boolean) => {
    await saveSettings({ ...local, onboarded: true });
    onDone(goToPage);
  };

  const advance = () => {
    if (step > QUESTIONS.length) void finish(true);
    else setStep(step + 1);
  };

  const name = local.childName.trim() || 'Your child';

  return (
    <View style={{ flex: 1, backgroundColor: p.paper }}>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{
          padding: space.xl,
          paddingTop: Platform.OS === 'ios' ? 70 : 40,
        }}
        keyboardShouldPersistTaps="handled"
      >
        <View style={{ maxWidth: 460, width: '100%', alignSelf: 'center' }}>
          {step === 0 ? (
            <>
              <Text style={{ fontSize: 29, fontWeight: '600', color: p.ink, marginBottom: 12 }}>
                Before you log anything
              </Text>
              <Text style={{ fontSize: 18.5, lineHeight: 28, color: p.ink2, marginBottom: 24 }}>
                Four short questions and you will have a page you can hand a sitter tonight. No
                episodes required.
              </Text>
              <Banner tone="good">
                Most apps in this category give you nothing until you have logged for weeks. This
                one starts with who your child is, because that is the part a sitter actually needs
                first.
              </Banner>
            </>
          ) : null}

          {step > 0 && step <= QUESTIONS.length
            ? (() => {
                const q = QUESTIONS[step - 1];
                return (
                  <>
                    <Text
                      style={{
                        fontSize: 10,
                        letterSpacing: 1.8,
                        textTransform: 'uppercase',
                        color: p.deep,
                        marginBottom: 14,
                        fontWeight: '600',
                      }}
                    >
                      {`Question ${step} of ${QUESTIONS.length}`}
                    </Text>
                    <Text style={{ fontSize: 29, fontWeight: '600', color: p.ink, marginBottom: 12 }}>
                      {q.label}
                    </Text>
                    {q.hint ? (
                      <Text style={{ fontSize: 18, lineHeight: 26, color: p.ink2, marginBottom: 20 }}>
                        {q.hint}
                      </Text>
                    ) : null}
                    <Field
                      label={q.label}
                      value={local[q.key]}
                      onChangeText={(v) => setLocal({ ...local, [q.key]: v })}
                      placeholder={q.placeholder}
                    />
                    {step > 1 ? (
                      <Text style={{ fontSize: 13.5, color: p.ink3, lineHeight: 21 }}>
                        This goes at the top of the page you hand people. A sitter who can start a
                        conversation about trains prevents more hard moments than one who only knows
                        the warning signs.
                      </Text>
                    ) : null}
                  </>
                );
              })()
            : null}

          {step > QUESTIONS.length ? (
            <>
              <Text
                style={{
                  fontSize: 10,
                  letterSpacing: 1.8,
                  textTransform: 'uppercase',
                  color: p.deep,
                  marginBottom: 14,
                  fontWeight: '600',
                }}
              >
                Ready
              </Text>
              <Text style={{ fontSize: 29, fontWeight: '600', color: p.ink, marginBottom: 12 }}>
                That is a real page.
              </Text>
              <Text style={{ fontSize: 18.5, lineHeight: 28, color: p.ink2, marginBottom: 24 }}>
                You can print it or hand it over tonight. It fills itself in further every time you
                log something.
              </Text>

              {/* the payoff, rendered in the document's own colours */}
              <View
                style={{
                  backgroundColor: paperDoc.bg,
                  borderWidth: 1,
                  borderColor: paperDoc.border,
                  borderRadius: radius.sm,
                  padding: 18,
                }}
              >
                <Text style={{ fontSize: 21, color: paperDoc.ink, marginBottom: 2 }}>{name}</Text>
                <Text style={{ fontSize: 12, color: paperDoc.ink3, marginBottom: 13 }}>
                  {`For teachers, sitters, and anyone caring for ${name}`}
                </Text>
                <Text
                  style={{
                    fontSize: 9.5,
                    letterSpacing: 1.4,
                    textTransform: 'uppercase',
                    color: paperDoc.onGoodSoft,
                    fontWeight: '600',
                    marginBottom: 6,
                  }}
                >
                  Start here
                </Text>
                {local.loves ? (
                  <Text style={{ fontSize: 14, color: paperDoc.ink2, lineHeight: 21 }}>
                    {`Loves: ${local.loves}`}
                  </Text>
                ) : null}
                {local.proudOf ? (
                  <Text style={{ fontSize: 14, color: paperDoc.ink2, lineHeight: 21 }}>
                    {`Proud of: ${local.proudOf}`}
                  </Text>
                ) : null}
                {local.laughs ? (
                  <Text style={{ fontSize: 14, color: paperDoc.ink2, lineHeight: 21 }}>
                    {`Makes them laugh: ${local.laughs}`}
                  </Text>
                ) : null}
                {!local.loves && !local.proudOf && !local.laughs ? (
                  <Text style={{ fontSize: 14, color: paperDoc.ink2, lineHeight: 21 }}>
                    Add a few lines in Setup and they will appear here.
                  </Text>
                ) : null}
              </View>

              <Text style={{ fontSize: 13.5, color: p.ink3, lineHeight: 21, marginTop: 18 }}>
                What comes before, what helps, and how long they usually take to settle get added
                automatically as you log. Nothing here needs rewriting by hand.
              </Text>
            </>
          ) : null}
        </View>
      </ScrollView>

      <View
        style={{
          padding: space.xl,
          paddingBottom: Platform.OS === 'ios' ? 40 : space.xl,
          borderTopWidth: 1,
          borderTopColor: p.line,
        }}
      >
        <View style={{ maxWidth: 460, width: '100%', alignSelf: 'center' }}>
          <Button
            label={
              step === 0
                ? 'Start'
                : step > QUESTIONS.length
                  ? 'Open my page'
                  : step === QUESTIONS.length
                    ? 'See my page'
                    : 'Next'
            }
            onPress={advance}
          />
          {step <= QUESTIONS.length ? (
            <Pressable
              onPress={() => void finish(false)}
              accessibilityRole="button"
              style={{ minHeight: 44, alignItems: 'center', justifyContent: 'center', marginTop: 8 }}
            >
              <Text style={{ color: p.ink3, fontSize: 14 }}>Skip for now</Text>
            </Pressable>
          ) : null}
        </View>
      </View>
    </View>
  );
}
