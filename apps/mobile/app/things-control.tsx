import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useTheme } from '../context/ThemeContext';

const initialRooms = [
  { id: 'cse-a-204', label: 'CSE Lecture Hall A-204', lightsOn: true, fansOn: true, lastSync: '2m ago' },
  { id: 'ece-b-103', label: 'ECE Lecture Hall B-103', lightsOn: false, fansOn: true, lastSync: 'Just now' },
  { id: 'mba-l-12', label: 'MBA Smart Room L-12', lightsOn: true, fansOn: false, lastSync: '5m ago' },
];

export default function ThingsControlScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const [rooms, setRooms] = useState(initialRooms);

  const toggleRoom = (roomId: string, key: 'lightsOn' | 'fansOn') => {
    setRooms((prev) =>
      prev.map((room) => (room.id === roomId ? { ...room, [key]: !room[key], lastSync: 'Just now' } : room))
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.headerRow}>
        <TouchableOpacity onPress={() => router.back()} style={[styles.iconBtn, { borderColor: colors.border, backgroundColor: colors.surface }]}>
          <Ionicons name="arrow-back" size={18} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: colors.text }]}>Things Control</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {rooms.map((room) => (
          <View key={room.id} style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={styles.cardHead}>
              <Text style={[styles.roomTitle, { color: colors.text }]}>{room.label}</Text>
              <Text style={[styles.syncText, { color: colors.textSecondary }]}>{room.lastSync}</Text>
            </View>

            <View style={styles.pillsRow}>
              <View style={[styles.statePill, { backgroundColor: room.lightsOn ? colors.primaryBg : colors.background, borderColor: colors.border }]}>
                <Text style={[styles.statePillText, { color: room.lightsOn ? colors.primary : colors.textSecondary }]}>{room.lightsOn ? 'Lights On' : 'Lights Off'}</Text>
              </View>
              <View style={[styles.statePill, { backgroundColor: room.fansOn ? colors.primaryBg : colors.background, borderColor: colors.border }]}>
                <Text style={[styles.statePillText, { color: room.fansOn ? colors.primary : colors.textSecondary }]}>{room.fansOn ? 'Fans On' : 'Fans Off'}</Text>
              </View>
            </View>

            <View style={styles.buttonsRow}>
              <TouchableOpacity onPress={() => toggleRoom(room.id, 'lightsOn')} style={[styles.actionBtn, { backgroundColor: colors.primary }]}>
                <Text style={styles.actionBtnText}>{room.lightsOn ? 'Turn lights off' : 'Turn lights on'}</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => toggleRoom(room.id, 'fansOn')} style={[styles.secondaryBtn, { backgroundColor: colors.background, borderColor: colors.border }]}>
                <Text style={[styles.secondaryBtnText, { color: colors.text }]}>{room.fansOn ? 'Turn fans off' : 'Turn fans on'}</Text>
              </TouchableOpacity>
            </View>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  headerRow: {
    paddingHorizontal: 18,
    paddingTop: 56,
    paddingBottom: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: { fontSize: 24, fontWeight: '800' },
  content: { paddingHorizontal: 18, paddingBottom: 24 },
  card: {
    borderWidth: 1,
    borderRadius: 22,
    padding: 16,
    marginBottom: 12,
  },
  cardHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginBottom: 14 },
  roomTitle: { fontSize: 18, fontWeight: '800', flex: 1 },
  syncText: { fontSize: 12 },
  pillsRow: { flexDirection: 'row', gap: 8, marginBottom: 14 },
  statePill: {
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  statePillText: { fontSize: 11, fontWeight: '800' },
  buttonsRow: { flexDirection: 'row', gap: 10 },
  actionBtn: {
    flex: 1,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
  },
  actionBtnText: { color: '#fff', fontWeight: '800', fontSize: 13 },
  secondaryBtn: {
    flex: 1,
    borderRadius: 14,
    borderWidth: 1,
    paddingVertical: 14,
    alignItems: 'center',
  },
  secondaryBtnText: { fontWeight: '800', fontSize: 13 },
});
