import { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';

import CoachCard from '../components/CoachCard';
import MealList from '../components/MealList';
import NutritionBalance from '../components/NutritionBalance';
import ProfileSetup from '../components/ProfileSetup';
import SummaryCard from '../components/SummaryCard';
import { COLORS, RADIUS, SPACING } from '../constants/theme';
import { AnalyzeError, analyzeFoodPhoto, getCoachAdvice } from '../lib/api';
import { detectDefaultLang, STRINGS } from '../lib/i18n';
import {
  loadGoalCalories,
  loadLang,
  loadProfile,
  loadTodayLog,
  saveGoalCalories,
  saveLang,
  saveProfile,
  saveTodayLog,
} from '../lib/storage';
import { calculateGoalCalories } from '../lib/tdee';
import { LANGUAGES } from '../types';
import type { AnalysisResult, CoachAdvice, DietStatus, Lang, MealEntry, UserProfile } from '../types';

const NEAR_GOAL_RATIO = 0.9;
const DINNER_HOUR = 18;

export default function HomeScreen() {
  const [hydrated, setHydrated] = useState(false);
  const [lang, setLang] = useState<Lang>('en');
  const [pickerOpen, setPickerOpen] = useState(false);
  const [goal, setGoal] = useState(1800);
  const [meals, setMeals] = useState<MealEntry[]>([]);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [editingProfile, setEditingProfile] = useState(false);

  const [imageUri, setImageUri] = useState<string | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [coachAdvice, setCoachAdvice] = useState<CoachAdvice | null>(null);
  const [coachLoading, setCoachLoading] = useState(false);
  const [coachError, setCoachError] = useState<string | null>(null);

  const t = STRINGS[lang];
  const currentLanguage = LANGUAGES.find((l) => l.code === lang) ?? LANGUAGES[0];

  // Load persisted goal + today's log + language once on mount. The save
  // effects below are gated on `hydrated` so they can't fire with the empty
  // initial state and clobber what's already in storage before this finishes.
  useEffect(() => {
    (async () => {
      const [loadedGoal, loadedMeals, loadedLang, loadedProfile] = await Promise.all([
        loadGoalCalories(),
        loadTodayLog(),
        loadLang(),
        loadProfile(),
      ]);
      setGoal(loadedGoal);
      setMeals(loadedMeals);
      setLang(loadedLang ?? detectDefaultLang());
      setProfile(loadedProfile);
      setHydrated(true);
    })();
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    saveGoalCalories(goal);
  }, [goal, hydrated]);

  useEffect(() => {
    if (!hydrated) return;
    saveTodayLog(meals);
  }, [meals, hydrated]);

  useEffect(() => {
    if (!hydrated) return;
    saveLang(lang);
  }, [lang, hydrated]);

  useEffect(() => {
    if (!hydrated || !profile) return;
    saveProfile(profile);
  }, [profile, hydrated]);

  // AI-generated content and error text are captured in whatever language was active
  // when they were fetched — they don't retroactively translate. Clear them on a
  // language switch instead of leaving old-language text sitting under new-language
  // labels. This now also covers an in-progress (not-yet-logged) photo analysis —
  // an earlier version deliberately left `result` alone to avoid discarding a
  // rate-limited analysis, but real usage showed that leftover-language text is the
  // more noticeable problem; already-logged meals are untouched since they're saved
  // history, not a live fetch, and are expected to keep the language they were
  // recorded in (like diary entries).
  useEffect(() => {
    setCoachAdvice(null);
    setCoachError(null);
    setErrorMsg(null);
    setResult(null);
  }, [lang]);

  const consumed = useMemo(() => meals.reduce((sum, m) => sum + m.totalCalories, 0), [meals]);
  const nutrientTotals = useMemo(
    () =>
      meals.reduce(
        (acc, m) => ({
          protein: acc.protein + m.nutrients.protein,
          fat: acc.fat + m.nutrients.fat,
          carbs: acc.carbs + m.nutrients.carbs,
        }),
        { protein: 0, fat: 0, carbs: 0 }
      ),
    [meals]
  );
  const remaining = goal - consumed;
  const status: DietStatus = useMemo(() => {
    if (consumed > goal) return 'over';
    if (goal > 0 && consumed / goal >= NEAR_GOAL_RATIO) return 'near';
    return 'ok';
  }, [consumed, goal]);
  const overWarning = status === 'over' && new Date().getHours() < DINNER_HOUR;

  async function analyze(uri: string) {
    setAnalyzing(true);
    setErrorMsg(null);
    setResult(null);
    try {
      const manipulated = await ImageManipulator.manipulateAsync(
        uri,
        [{ resize: { width: 1024 } }],
        { compress: 0.7, format: ImageManipulator.SaveFormat.JPEG, base64: true }
      );
      if (!manipulated.base64) {
        throw new Error(t.errors.imageProcessFailed);
      }
      const analysis = await analyzeFoodPhoto(manipulated.base64, 'image/jpeg', lang);
      setResult(analysis);
    } catch (e) {
      setErrorMsg(e instanceof AnalyzeError ? e.message : t.errors.analyzeGeneric);
    } finally {
      setAnalyzing(false);
    }
  }

  async function handlePick(source: 'camera' | 'library') {
    setErrorMsg(null);
    try {
      const permission =
        source === 'camera'
          ? await ImagePicker.requestCameraPermissionsAsync()
          : await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        setErrorMsg(source === 'camera' ? t.errors.cameraPermission : t.errors.libraryPermission);
        return;
      }

      const pickerResult =
        source === 'camera'
          ? await ImagePicker.launchCameraAsync({ mediaTypes: ['images'], quality: 1 })
          : await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 1 });

      if (pickerResult.canceled || !pickerResult.assets?.length) return;

      const uri = pickerResult.assets[0].uri;
      setImageUri(uri);
      setResult(null);
      await analyze(uri);
    } catch {
      setErrorMsg(t.errors.pickGeneric);
    }
  }

  function cancelPick() {
    setImageUri(null);
    setResult(null);
    setErrorMsg(null);
  }

  function confirmAddMeal() {
    if (!result) return;
    const entry: MealEntry = {
      ...result,
      id: `${Date.now()}`,
      time: new Date().toISOString(),
    };
    setMeals((prev) => [...prev, entry]);
    cancelPick();
  }

  function deleteMeal(id: string) {
    setMeals((prev) => prev.filter((m) => m.id !== id));
  }

  function handleProfileSubmit(newProfile: UserProfile) {
    setProfile(newProfile);
    setGoal(calculateGoalCalories(newProfile));
    setEditingProfile(false);
  }

  async function requestCoachAdvice() {
    setCoachLoading(true);
    setCoachError(null);
    try {
      const advice = await getCoachAdvice({
        goalCalories: goal,
        consumedCalories: consumed,
        remainingCalories: remaining,
        status,
        nutrients: nutrientTotals,
        meals: meals.map((m) => ({ dishName: m.dishName, calories: m.totalCalories })),
        lang,
        dietGoal: profile?.goalRate ?? 'maintain',
      });
      setCoachAdvice(advice);
    } catch (e) {
      setCoachError(e instanceof AnalyzeError ? e.message : t.errors.coachFailed);
    } finally {
      setCoachLoading(false);
    }
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <TouchableOpacity
        style={styles.langSwitch}
        onPress={() => setPickerOpen(true)}
        accessibilityRole="button"
        accessibilityLabel={t.chooseLanguage}
      >
        <Text style={styles.langSwitchText}>{currentLanguage.native} ▾</Text>
      </TouchableOpacity>

      {pickerOpen && (
        <View style={styles.modalBackdrop}>
          <TouchableOpacity
            style={StyleSheet.absoluteFill}
            activeOpacity={1}
            onPress={() => setPickerOpen(false)}
          />
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>{t.chooseLanguage}</Text>
            <FlatList
              data={LANGUAGES}
              keyExtractor={(item) => item.code}
              style={styles.modalList}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[styles.langOption, item.code === lang && styles.langOptionActive]}
                  onPress={() => {
                    setLang(item.code);
                    setPickerOpen(false);
                  }}
                >
                  <Text style={[styles.langOptionNative, item.code === lang && styles.langOptionActiveText]}>
                    {item.native}
                  </Text>
                  <Text style={styles.langOptionEnglish}>{item.english}</Text>
                </TouchableOpacity>
              )}
            />
          </View>
        </View>
      )}

      {hydrated && (!profile || editingProfile) && (
        <ProfileSetup
          t={t}
          initialProfile={profile ?? undefined}
          onSubmit={handleProfileSubmit}
          onCancel={profile ? () => setEditingProfile(false) : undefined}
        />
      )}

      {hydrated && profile && !editingProfile && (
        <>
          <Text style={styles.title}>{t.app.title}</Text>
          <Text style={styles.subtitle}>{t.app.subtitle}</Text>

          {!imageUri && (
            <>
              <SummaryCard
                goal={goal}
                onGoalChange={setGoal}
                consumed={consumed}
                remaining={remaining}
                status={status}
                overWarning={overWarning}
                t={t}
              />
              <TouchableOpacity style={styles.editProfileLink} onPress={() => setEditingProfile(true)}>
                <Text style={styles.editProfileLinkText}>{t.profile.editLink}</Text>
              </TouchableOpacity>

              <View style={styles.addCard}>
                <TouchableOpacity style={styles.primaryButton} onPress={() => handlePick('camera')}>
                  <Text style={styles.primaryButtonText}>{t.addCard.cameraButton}</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.secondaryButton} onPress={() => handlePick('library')}>
                  <Text style={styles.secondaryButtonText}>{t.addCard.galleryButton}</Text>
                </TouchableOpacity>
                <Text style={styles.helperText}>{t.addCard.helper}</Text>
              </View>

              <MealList meals={meals} onDelete={deleteMeal} lang={lang} t={t} />
              <NutritionBalance nutrients={nutrientTotals} t={t} />
              <CoachCard
                advice={coachAdvice}
                loading={coachLoading}
                errorMsg={coachError}
                onRequest={requestCoachAdvice}
                t={t}
              />
            </>
          )}

          {imageUri && (
            <View style={styles.resultCard}>
              <Image source={{ uri: imageUri }} style={styles.preview} resizeMode="cover" />

              {analyzing && (
                <View style={styles.centerBlock}>
                  <ActivityIndicator color={COLORS.primary} size="large" />
                  <Text style={styles.loadingText}>{t.result.analyzing}</Text>
                </View>
              )}

              {!analyzing && errorMsg && (
                <View style={styles.centerBlock}>
                  <Text style={styles.errorText}>{errorMsg}</Text>
                  <TouchableOpacity style={styles.primaryButton} onPress={() => analyze(imageUri)}>
                    <Text style={styles.primaryButtonText}>{t.result.retry}</Text>
                  </TouchableOpacity>
                </View>
              )}

              {!analyzing && !errorMsg && result && (
                <View style={styles.analysisBlock}>
                  <Text style={styles.dishName}>{result.dishName}</Text>

                  {result.items.map((item, index) => (
                    <View
                      key={`${item.name}-${index}`}
                      style={[styles.itemRow, index === 0 && styles.itemRowFirst]}
                    >
                      <View style={styles.itemInfo}>
                        <Text style={styles.itemName}>{item.name}</Text>
                        <Text style={styles.itemPortion}>{item.estimatedPortion}</Text>
                      </View>
                      <Text style={styles.itemCalories}>{item.calories} kcal</Text>
                    </View>
                  ))}

                  <View style={styles.totalRow}>
                    <Text style={styles.totalLabel}>{t.result.totalCalories}</Text>
                    <Text style={styles.totalValue}>{result.totalCalories} kcal</Text>
                  </View>

                  <Text style={styles.macroLine}>
                    {t.result.macroLine(
                      Math.round(result.nutrients.protein),
                      Math.round(result.nutrients.fat),
                      Math.round(result.nutrients.carbs)
                    )}
                  </Text>

                  {!!result.confidenceNote && (
                    <Text style={styles.confidenceNote}>{result.confidenceNote}</Text>
                  )}

                  <TouchableOpacity style={styles.primaryButton} onPress={confirmAddMeal}>
                    <Text style={styles.primaryButtonText}>{t.result.addToLog}</Text>
                  </TouchableOpacity>
                </View>
              )}

              <TouchableOpacity style={styles.secondaryButton} onPress={cancelPick}>
                <Text style={styles.secondaryButtonText}>{t.result.tryAnotherPhoto}</Text>
              </TouchableOpacity>
            </View>
          )}
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: COLORS.bg,
    padding: SPACING.lg,
    paddingTop: SPACING.xl,
    alignItems: 'stretch',
    maxWidth: 480,
    width: '100%',
    alignSelf: 'center',
    gap: SPACING.md,
  },
  langSwitch: {
    alignSelf: 'center',
    paddingVertical: SPACING.xs,
    paddingHorizontal: SPACING.md,
    borderRadius: RADIUS.pill,
    backgroundColor: COLORS.chipBg,
  },
  langSwitchText: {
    color: COLORS.primaryDark,
    fontWeight: '700',
    fontSize: 13,
  },
  modalBackdrop: {
    position: 'fixed' as 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 1000,
    backgroundColor: 'rgba(20,24,22,0.45)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.lg,
  },
  modalCard: {
    backgroundColor: COLORS.card,
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    width: '100%',
    maxWidth: 360,
    maxHeight: '80%',
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: COLORS.text,
    marginBottom: SPACING.sm,
    paddingHorizontal: SPACING.sm,
  },
  modalList: {
    flexGrow: 0,
  },
  langOption: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    paddingVertical: SPACING.sm + 2,
    paddingHorizontal: SPACING.sm,
    borderRadius: RADIUS.sm,
  },
  langOptionActive: {
    backgroundColor: COLORS.chipBg,
  },
  langOptionNative: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
  },
  langOptionActiveText: {
    color: COLORS.primaryDark,
    fontWeight: '800',
  },
  langOptionEnglish: {
    fontSize: 12,
    color: COLORS.textMuted,
  },
  title: {
    fontSize: 26,
    fontWeight: '800',
    color: COLORS.text,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    color: COLORS.textMuted,
    textAlign: 'center',
    marginTop: SPACING.xs,
    marginBottom: SPACING.xs,
  },
  editProfileLink: {
    alignSelf: 'center',
    paddingVertical: SPACING.xs,
  },
  editProfileLinkText: {
    color: COLORS.textMuted,
    fontSize: 12,
    fontWeight: '600',
    textDecorationLine: 'underline',
  },
  addCard: {
    backgroundColor: COLORS.card,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: SPACING.lg,
    gap: SPACING.sm,
  },
  primaryButton: {
    backgroundColor: COLORS.primary,
    borderRadius: RADIUS.pill,
    paddingVertical: SPACING.md,
    alignItems: 'center',
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 16,
  },
  secondaryButton: {
    backgroundColor: COLORS.chipBg,
    borderRadius: RADIUS.pill,
    paddingVertical: SPACING.md,
    alignItems: 'center',
    marginTop: SPACING.sm,
  },
  secondaryButtonText: {
    color: COLORS.primaryDark,
    fontWeight: '700',
    fontSize: 15,
  },
  helperText: {
    fontSize: 12,
    color: COLORS.textMuted,
    marginTop: SPACING.sm,
    textAlign: 'center',
  },
  resultCard: {
    backgroundColor: COLORS.card,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: SPACING.md,
    gap: SPACING.sm,
  },
  preview: {
    width: '100%',
    height: 260,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.chipBg,
  },
  centerBlock: {
    alignItems: 'center',
    paddingVertical: SPACING.lg,
    gap: SPACING.sm,
  },
  loadingText: {
    color: COLORS.textMuted,
    fontSize: 14,
  },
  errorText: {
    color: COLORS.danger,
    fontSize: 14,
    textAlign: 'center',
    marginBottom: SPACING.xs,
  },
  analysisBlock: {
    paddingTop: SPACING.sm,
    gap: SPACING.xs,
  },
  dishName: {
    fontSize: 20,
    fontWeight: '800',
    color: COLORS.text,
    marginBottom: SPACING.sm,
  },
  itemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: SPACING.sm,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  itemRowFirst: {
    borderTopWidth: 0,
  },
  itemInfo: {
    flexShrink: 1,
    paddingRight: SPACING.sm,
  },
  itemName: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.text,
  },
  itemPortion: {
    fontSize: 12,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  itemCalories: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.text,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: SPACING.sm,
    paddingTop: SPACING.sm,
    borderTopWidth: 2,
    borderTopColor: COLORS.primary,
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: '800',
    color: COLORS.primaryDark,
  },
  totalValue: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.primaryDark,
  },
  macroLine: {
    fontSize: 12,
    color: COLORS.textMuted,
  },
  confidenceNote: {
    fontSize: 12,
    color: COLORS.textMuted,
    lineHeight: 18,
  },
});
