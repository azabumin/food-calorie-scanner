import { StyleSheet, Text, View } from 'react-native';

import { COLORS, RADIUS, SPACING } from '../constants/theme';
import type { Strings } from '../lib/i18n';

type Props = {
  daysLeft: number;
  t: Strings;
};

export default function TrialBanner({ daysLeft, t }: Props) {
  return (
    <View style={styles.banner}>
      <Text style={styles.text}>{t.trial.daysLeft(daysLeft)}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    backgroundColor: COLORS.chipBg,
    borderRadius: RADIUS.pill,
    paddingVertical: SPACING.xs,
    paddingHorizontal: SPACING.md,
    alignSelf: 'center',
  },
  text: {
    color: COLORS.primaryDark,
    fontWeight: '700',
    fontSize: 12,
  },
});
