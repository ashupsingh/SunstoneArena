import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { useRouter } from 'expo-router';
import { useTheme } from '../context/ThemeContext';
import { apiClient } from '../config/api';
import { useAuth } from '../context/AuthContext';
import { getSavedEventIds, removeSavedEvent } from '../lib/savedEvents';

export default function SavedEventsScreen() {
  const { colors } = useTheme();
  const { user } = useAuth();
  const router = useRouter();
  const [savedEvents, setSavedEvents] = React.useState<any[]>([]);

  const loadSavedEvents = React.useCallback(async () => {
    try {
      const [savedIds, eventsResponse] = await Promise.all([
        getSavedEventIds(user?._id),
        apiClient.get('/events').catch(() => ({ data: [] })),
      ]);
      const list = Array.isArray(eventsResponse.data) ? eventsResponse.data : [];
      const lookup = new Map(list.map((item: any) => [item._id, item]));
      setSavedEvents(savedIds.map((id) => lookup.get(id)).filter(Boolean));
    } catch (_error) {
      setSavedEvents([]);
    }
  }, [user?._id]);

  useFocusEffect(
    React.useCallback(() => {
      loadSavedEvents();
    }, [loadSavedEvents])
  );

  const unsave = async (eventId: string) => {
    await removeSavedEvent(user?._id, eventId);
    await loadSavedEvents();
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]} contentContainerStyle={styles.content}>
      <TouchableOpacity onPress={() => router.back()} style={styles.backRow}>
        <Ionicons name="chevron-back" size={18} color={colors.textSecondary} />
        <Text style={[styles.backText, { color: colors.textSecondary }]}>Back</Text>
      </TouchableOpacity>

      <Text style={[styles.title, { color: colors.text }]}>Saved Events</Text>
      <Text style={[styles.subtitle, { color: colors.textSecondary }]}>Every event you bookmark from the feed shows up here for quick access later.</Text>

      {savedEvents.length === 0 ? (
        <View style={[styles.emptyCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[styles.emptyText, { color: colors.textSecondary }]}>No saved events yet. Tap the bookmark icon on any event post to keep it here.</Text>
        </View>
      ) : (
        savedEvents.map((event: any) => (
          <View key={event._id} style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <TouchableOpacity onPress={() => router.push({ pathname: '/event/[id]', params: { id: event._id } })} activeOpacity={0.88}>
              <Image source={{ uri: event.flyerUrl || `https://picsum.photos/seed/${event._id}/900/900` }} style={styles.poster} />
              <Text style={[styles.cardTitle, { color: colors.text }]}>{event.title}</Text>
              <Text style={[styles.cardMeta, { color: colors.textSecondary }]}>{event.locationName || 'Campus'}{event.startAt ? ` | ${new Date(event.startAt).toLocaleDateString()}` : ''}</Text>
              <Text numberOfLines={3} style={[styles.cardBody, { color: colors.textSecondary }]}>{event.description}</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => unsave(event._id)} style={[styles.unsaveBtn, { backgroundColor: colors.background, borderColor: colors.border }]}>
              <Ionicons name="bookmark" size={16} color={colors.primary} />
              <Text style={[styles.unsaveText, { color: colors.text }]}>Remove from saved</Text>
            </TouchableOpacity>
          </View>
        ))
      )}

      <Text style={[styles.footerText, { color: colors.textSecondary }]}>Made with love ❤️ by SyntaxError Team</Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { paddingHorizontal: 20, paddingTop: 54, paddingBottom: 96 },
  backRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 18 },
  backText: { fontSize: 14, fontWeight: '600', marginLeft: 4 },
  title: { fontSize: 34, fontWeight: '800', marginBottom: 10 },
  subtitle: { fontSize: 16, lineHeight: 24, marginBottom: 24 },
  emptyCard: {
    borderWidth: 1,
    borderRadius: 22,
    padding: 20,
  },
  emptyText: { fontSize: 15, lineHeight: 22 },
  card: {
    borderWidth: 1,
    borderRadius: 22,
    padding: 14,
    marginBottom: 14,
  },
  poster: { width: '100%', height: 220, borderRadius: 18, marginBottom: 12 },
  cardTitle: { fontSize: 20, fontWeight: '800', marginBottom: 6 },
  cardMeta: { fontSize: 13, marginBottom: 8 },
  cardBody: { fontSize: 14, lineHeight: 21 },
  unsaveBtn: {
    marginTop: 14,
    minHeight: 46,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  unsaveText: { fontSize: 14, fontWeight: '700' },
  footerText: { textAlign: 'center', marginTop: 12, fontSize: 13, fontWeight: '600' },
});
