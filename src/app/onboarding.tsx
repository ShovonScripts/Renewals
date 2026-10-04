/* eslint-disable import/no-unresolved */
import { useState } from 'react';
import { StyleSheet, View, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import Ionicons from '@expo/vector-icons/Ionicons';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Button } from '@/components/Button';
import { useStore } from '@/store/store';
import { useT } from '@/i18n';

export default function OnboardingScreen() {
  const { t } = useT();
  const updateSettings = useStore((state) => state.updateSettings);
  const [step, setStep] = useState(0);

  const slides = [
    {
      title: t('onboarding.slide1Title'),
      text: t('onboarding.slide1Text'),
      icon: 'calendar-outline',
    },
    {
      title: t('onboarding.slide2Title'),
      text: t('onboarding.slide2Text'),
      icon: 'shield-checkmark-outline',
    },
    {
      title: t('onboarding.slide3Title'),
      text: t('onboarding.slide3Text'),
      icon: 'notifications-outline',
    },
  ];

  const handleFinish = () => {
    updateSettings({ hasCompletedOnboarding: true });
    router.replace('/(tabs)');
  };

  const currentSlide = slides[step];

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.skipContainer}>
          {step < slides.length - 1 ? (
            <Pressable onPress={handleFinish}>
              <ThemedText style={styles.skipText}>{t('onboarding.skip')}</ThemedText>
            </Pressable>
          ) : null}
        </View>

        <View style={styles.slideContent}>
          <Ionicons name={currentSlide.icon as any} size={80} color="#007AFF" style={styles.icon} />
          <ThemedText type="subtitle" style={styles.title}>{currentSlide.title}</ThemedText>
          <ThemedText style={styles.text}>{currentSlide.text}</ThemedText>
        </View>

        <View style={styles.footer}>
          <View style={styles.dots}>
            {slides.map((_, i) => (
              <View
                key={i}
                style={[styles.dot, step === i && styles.dotActive]}
              />
            ))}
          </View>

          {step < slides.length - 1 ? (
            <Button title={t('onboarding.next')} onPress={() => setStep(step + 1)} fullWidth />
          ) : (
            <Button title={t('onboarding.getStarted')} onPress={handleFinish} fullWidth />
          )}
        </View>
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  safeArea: { flex: 1, justifyContent: 'space-between', padding: 24 },
  skipContainer: { alignItems: 'flex-end', height: 30 },
  skipText: { fontSize: 16, fontWeight: '600', color: '#007AFF' },
  slideContent: { alignItems: 'center', justifyContent: 'center', flex: 1 },
  icon: { marginBottom: 32 },
  title: { textAlign: 'center', marginBottom: 16 },
  text: { textAlign: 'center', fontSize: 16, opacity: 0.7, paddingHorizontal: 16 },
  footer: { marginBottom: 20 },
  dots: { flexDirection: 'row', justifyContent: 'center', marginBottom: 24 },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#ccc', marginHorizontal: 4 },
  dotActive: { width: 20, backgroundColor: '#007AFF' },
});
