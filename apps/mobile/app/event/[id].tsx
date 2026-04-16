import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Image, Alert, ScrollView } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import { apiClient } from '../../config/api';
import * as Linking from 'expo-linking';

export default function EventDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { colors } = useTheme();
  const [loading, setLoading] = useState(true);
  const [eventItem, setEventItem] = useState<any>(null);

  const loadEvent = async () => {
    try {
      const { data } = await apiClient.get('/events');
      const list = Array.isArray(data) ? data : [];
      setEventItem(list.find((item) => String(item._id) === String(id)) || null);
    } catch (_error) {
      setEventItem(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadEvent();
  }, [id]);

  const posterUrl = useMemo(() => {
    if (eventItem?.flyerUrl) return eventItem.flyerUrl;
    return `https://picsum.photos/seed/${id}/900/900`;
  }, [eventItem, id]);

  const toggleRegistration = async () => {
    if (!eventItem?._id) return;
    try {
      if (eventItem.isRegistered) {
        await apiClient.delete(`/events/${eventItem._id}/register`);
      } else {
        await apiClient.post(`/events/${eventItem._id}/register`);
      }
      await loadEvent();
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.message || 'Action failed');
    }
  };

  if (loading) {
    return (
      <View style={[styles.centered, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (!eventItem) {
    return (
      <View style={[styles.centered, { backgroundColor: colors.background }]}>
        <Text style={{ color: colors.textSecondary }}>Event not found.</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.headerRow}>
        <TouchableOpacity onPress={() => router.back()} style={[styles.iconBtn, { borderColor: colors.border, backgroundColor: colors.surface }]}>
          <Ionicons name="arrow-back" size={18} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Event</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <Image source={{ uri: posterUrl }} style={styles.poster} />
        <Text style={[styles.title, { color: colors.text }]}>{eventItem.title}</Text>
        <Text style={[styles.description, { color: colors.textSecondary }]}>{eventItem.description}</Text>

        <View style={styles.metaGroup}>
          <View style={[styles.metaChip, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Ionicons name="location-outline" size={15} color={colors.primary} />
            <Text style={[styles.metaText, { color: colors.text }]}>{eventItem.locationName || 'Campus'}</Text>
          </View>
          {eventItem.startAt ? (
            <View style={[styles.metaChip, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <Ionicons name="time-outline" size={15} color={colors.primary} />
              <Text style={[styles.metaText, { color: colors.text }]}>{new Date(eventItem.startAt).toLocaleString()}</Text>
            </View>
          ) : null}
        </View>

        <View style={styles.buttonsRow}>
          <TouchableOpacity onPress={toggleRegistration} style={[styles.primaryBtn, { backgroundColor: eventItem.isRegistered ? '#1d4ed8' : colors.primary }]}>
            <Text style={styles.primaryBtnText}>{eventItem.isRegistered ? 'Unregister' : 'Register'}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => {
              if (!eventItem.mapUrl) {
                Alert.alert('Map unavailable', 'No map URL for this event');
                return;
              }
              Linking.openURL(eventItem.mapUrl);
            }}
            style={[styles.secondaryBtn, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Text style={[styles.secondaryBtnText, { color: colors.text }]}>Open map</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center' },
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
  headerTitle: { fontSize: 22, fontWeight: '800' },
  content: { paddingHorizontal: 18, paddingBottom: 24 },
  poster: { width: '100%', height: 260, borderRadius: 22, marginBottom: 18 },
  title: { fontSize: 28, fontWeight: '800', marginBottom: 8 },
  description: { fontSize: 15, lineHeight: 23, marginBottom: 18 },
  metaGroup: { gap: 10, marginBottom: 20 },
  metaChip: {
    borderWidth: 1,
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
  },
  metaText: { fontSize: 13, fontWeight: '700', marginLeft: 8, flex: 1 },
  buttonsRow: { flexDirection: 'row', gap: 10 },
  primaryBtn: {
    flex: 1,
    borderRadius: 16,
    paddingVertical: 14,
    alignItems: 'center',
  },
  primaryBtnText: { color: '#fff', fontWeight: '800' },
  secondaryBtn: {
    flex: 1,
    borderRadius: 16,
    borderWidth: 1,
    paddingVertical: 14,
    alignItems: 'center',
  },
  secondaryBtnText: { fontWeight: '800' },
});
