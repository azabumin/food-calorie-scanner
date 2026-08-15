import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { COLORS, RADIUS, SPACING } from '../constants/theme';
import type { Strings } from '../lib/i18n';

type Props = {
  t: Strings;
  title?: string;
  body?: string;
  onClose: () => void;
};

export default function PremiumComingSoon({ t, title, body, onClose }: Props) {
  return (
    <View style={styles.backdrop}>
      <TouchableOpacity style={StyleSheet.absoluteFill} activeOpacity={1} onPress={onClose} />
      <View style={styles.card}>
        {!!title && <Text style={styles.lockedTitle}>{title}</Text>}
        {!!body && <Text style={styles.lockedBody}>{body}</Text>}
        <Text style={styles.title}>{t.premium.comingSoonTitle}</Text>
        <Text style={styles.body}>{t.premium.comingSoonBody}</Text>
        <TouchableOpacity style={styles.closeButton} onPress={onClose}>
          <Text style={styles.closeButtonText}>{t.cancel}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  backdrop: {
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
  card: {
    backgroundColor: COLORS.card,
    borderRadius: RADIUS.lg,
    padding: SPACING.lg,
    width: '100%',
    maxWidth: 360,
    gap: SPACING.xs,
  },
  lockedTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: COLORS.primaryDark,
  },
  lockedBody: {
    fontSize: 13,
    color: COLORS.textMuted,
    lineHeight: 19,
    marginBottom: SPACING.sm,
  },
  title: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.text,
    marginTop: SPACING.xs,
  },
  body: {
    fontSize: 14,
    color: COLORS.textMuted,
    lineHeight: 20,
  },
  closeButton: {
    backgroundColor: COLORS.chipBg,
    borderRadius: RADIUS.pill,
    paddingVertical: SPACING.md,
    alignItems: 'center',
    marginTop: SPACING.md,
  },
  closeButtonText: {
    color: COLORS.primaryDark,
    fontWeight: '700',
    fontSize: 15,
  },
});
