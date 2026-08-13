import { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
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
import SummaryCard from '../components/SummaryCard';
import { COLORS, RADIUS, SPACING } from '../constants/theme';
import { AnalyzeError, analyzeFoodPhoto, getCoachAdvice } from '../lib/api';
import { loadGoalCalories, loadTodayLog, saveGoalCalories, saveTodayLog } from '../lib/storage';
import type { AnalysisResult, CoachAdvice, DietStatus, MealEntry } from '../types';

const NEAR_GOAL_RATIO = 0.9;
const DINNER_HOUR = 18;

export default function HomeScreen() {
  const [hydrated, setHydrated] = useState(false);
  const [goal, setGoal] = useState(1800);
  const [meals, setMeals] = useState<MealEntry[]>([]);

  const [imageUri, setImageUri] = useState<string | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [coachAdvice, setCoachAdvice] = useState<CoachAdvice | null>(null);
  const [coachLoading, setCoachLoading] = useState(false);
  const [coachError, setCoachError] = useState<string | null>(null);

  // Load persisted goal + today's log once on mount. The save effects below
  // are gated on `hydrated` so they can't fire with the empty initial state
  // and clobber what's already in storage before this finishes.
  useEffect(() => {
    (async () => {
      const [loadedGoal, loadedMeals] = await Promise.all([loadGoalCalories(), loadTodayLog()]);
      setGoal(loadedGoal);
      setMeals(loadedMeals);
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
        throw new Error('이미지를 처리할 수 없습니다.');
      }
      const analysis = await analyzeFoodPhoto(manipulated.base64, 'image/jpeg');
      setResult(analysis);
    } catch (e) {
      setErrorMsg(e instanceof AnalyzeError ? e.message : '이미지를 분석하는 중 문제가 발생했습니다.');
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
        setErrorMsg(
          source === 'camera'
            ? '카메라 권한이 필요합니다. 브라우저 또는 기기 설정에서 권한을 허용해 주세요.'
            : '사진 접근 권한이 필요합니다. 브라우저 또는 기기 설정에서 권한을 허용해 주세요.'
        );
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
      setErrorMsg('사진을 불러오는 중 문제가 발생했습니다.');
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
      });
      setCoachAdvice(advice);
    } catch (e) {
      setCoachError(
        e instanceof AnalyzeError ? e.message : '코치 조언을 받아오는 중 문제가 발생했습니다.'
      );
    } finally {
      setCoachLoading(false);
    }
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>오늘의 다이어트 다이어리</Text>
      <Text style={styles.subtitle}>
        사진 한 장으로 칼로리와 영양을 기록하고, AI 코치의 저녁 식사 조언까지 받아보세요.
      </Text>

      {!imageUri && (
        <>
          <SummaryCard
            goal={goal}
            onGoalChange={setGoal}
            consumed={consumed}
            remaining={remaining}
            status={status}
            overWarning={overWarning}
          />

          <View style={styles.addCard}>
            <TouchableOpacity style={styles.primaryButton} onPress={() => handlePick('camera')}>
              <Text style={styles.primaryButtonText}>사진으로 식사 기록하기</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.secondaryButton} onPress={() => handlePick('library')}>
              <Text style={styles.secondaryButtonText}>갤러리에서 선택</Text>
            </TouchableOpacity>
            <Text style={styles.helperText}>
              * AI가 추정한 칼로리·영양이며, 실제 조리법과 양에 따라 오차가 있을 수 있습니다.
            </Text>
          </View>

          <MealList meals={meals} onDelete={deleteMeal} />
          <NutritionBalance nutrients={nutrientTotals} />
          <CoachCard
            advice={coachAdvice}
            loading={coachLoading}
            errorMsg={coachError}
            onRequest={requestCoachAdvice}
          />
        </>
      )}

      {imageUri && (
        <View style={styles.resultCard}>
          <Image source={{ uri: imageUri }} style={styles.preview} resizeMode="cover" />

          {analyzing && (
            <View style={styles.centerBlock}>
              <ActivityIndicator color={COLORS.primary} size="large" />
              <Text style={styles.loadingText}>사진을 분석하고 있어요...</Text>
            </View>
          )}

          {!analyzing && errorMsg && (
            <View style={styles.centerBlock}>
              <Text style={styles.errorText}>{errorMsg}</Text>
              <TouchableOpacity style={styles.primaryButton} onPress={() => analyze(imageUri)}>
                <Text style={styles.primaryButtonText}>다시 시도</Text>
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
                <Text style={styles.totalLabel}>총 칼로리</Text>
                <Text style={styles.totalValue}>{result.totalCalories} kcal</Text>
              </View>

              <Text style={styles.macroLine}>
                단백질 {Math.round(result.nutrients.protein)}g · 지방 {Math.round(result.nutrients.fat)}g
                · 탄수화물 {Math.round(result.nutrients.carbs)}g
              </Text>

              {!!result.confidenceNote && (
                <Text style={styles.confidenceNote}>{result.confidenceNote}</Text>
              )}

              <TouchableOpacity style={styles.primaryButton} onPress={confirmAddMeal}>
                <Text style={styles.primaryButtonText}>오늘 식사 기록에 추가하기</Text>
              </TouchableOpacity>
            </View>
          )}

          <TouchableOpacity style={styles.secondaryButton} onPress={cancelPick}>
            <Text style={styles.secondaryButtonText}>다른 사진으로 다시 분석하기</Text>
          </TouchableOpacity>
        </View>
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
