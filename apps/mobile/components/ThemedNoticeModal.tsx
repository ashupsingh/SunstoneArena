import React from 'react';
import { Modal, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';

type Props = {
  visible: boolean;
  title: string;
  message: string;
  onClose: () => void;
  buttonLabel?: string;
  tone?: 'info' | 'error' | 'success';
};

export default function ThemedNoticeModal({
  visible,
  title,
  message,
  onClose,
  buttonLabel = 'OK',
  tone = 'info',
}: Props) {
  const { colors } = useTheme();
  const iconName = tone === 'error' ? 'alert-circle-outline' : tone === 'success' ? 'checkmark-circle-outline' : 'information-circle-outline';
  const accent = tone === 'error' ? colors.error : tone === 'success' ? '#22c55e' : colors.primary;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={[styles.iconWrap, { backgroundColor: colors.background }]}>
            <Ionicons name={iconName} size={22} color={accent} />
          </View>
          <Text style={[styles.title, { color: colors.text }]}>{title}</Text>
          <Text style={[styles.message, { color: colors.textSecondary }]}>{message}</Text>
          <TouchableOpacity style={[styles.button, { backgroundColor: accent }]} onPress={onClose}>
            <Text style={styles.buttonText}>{buttonLabel}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(2,6,23,0.72)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  card: {
    width: '100%',
    borderWidth: 1,
    borderRadius: 24,
    padding: 22,
  },
  iconWrap: {
    width: 48,
    height: 48,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  title: { fontSize: 24, fontWeight: '800', marginBottom: 8 },
  message: { fontSize: 15, lineHeight: 23 },
  button: {
    marginTop: 22,
    minHeight: 48,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: { color: '#fff', fontSize: 15, fontWeight: '800' },
});
