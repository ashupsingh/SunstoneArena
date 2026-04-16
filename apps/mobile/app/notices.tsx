import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, RefreshControl, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useTheme } from '../context/ThemeContext';
import { apiClient } from '../config/api';

export default function NoticesScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadNotices = async () => {
    try {
      const { data } = await apiClient.get('/notifications');
      setNotifications(Array.isArray(data) ? data : []);
    } catch (_error) {
      setNotifications([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadNotices();
  }, []);

  const announcements = useMemo(() => notifications.filter((item) => item.type === 'announcement'), [notifications]);

  const reactNotice = async (id: string, reaction: 'heart' | 'thumbsUp') => {
    try {
      await apiClient.post(`/notifications/${id}/react`, { reaction });
      loadNotices();
    } catch (_error) {
      // no-op
    }
  };

  const markRead = async (id: string) => {
    try {
      await apiClient.put(`/notifications/${id}/read`);
      loadNotices();
    } catch (_error) {
      // no-op
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.headerRow}>
        <TouchableOpacity onPress={() => router.back()} style={[styles.backBtn, { borderColor: colors.border, backgroundColor: colors.surface }]}>
          <Ionicons name="arrow-back" size={18} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: colors.text }]}>Notices</Text>
        <TouchableOpacity onPress={() => { setRefreshing(true); loadNotices(); }} style={[styles.backBtn, { borderColor: colors.border, backgroundColor: colors.surface }]}>
          <Ionicons name="refresh" size={18} color={colors.primary} />
        </TouchableOpacity>
      </View>

      <ScrollView
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); loadNotices(); }} tintColor={colors.primary} />}
        contentContainerStyle={styles.content}>
        {loading ? (
          <ActivityIndicator color={colors.primary} size="large" />
        ) : announcements.length === 0 ? (
          <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>No notices yet.</Text>
          </View>
        ) : (
          announcements.map((notice) => (
            <TouchableOpacity key={notice._id} onPress={() => markRead(notice._id)} style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <View style={styles.cardHead}>
                <Text style={[styles.noticeTitle, { color: colors.text }]}>{notice.title}</Text>
                {!notice.isRead ? <View style={[styles.unreadDot, { backgroundColor: colors.primary }]} /> : null}
              </View>
              <Text style={[styles.noticeMessage, { color: colors.textSecondary }]}>{notice.message}</Text>
              {notice.attachmentUrl ? <Image source={{ uri: notice.attachmentUrl }} style={styles.noticeImage} /> : null}
              <View style={styles.reactionRow}>
                <TouchableOpacity style={styles.reactionBtn} onPress={() => reactNotice(notice._id, 'heart')}>
                  <Ionicons name="heart" size={16} color={notice.reactions?.myHeart ? '#ef4444' : colors.textSecondary} />
                  <Text style={{ color: colors.textSecondary, marginLeft: 4 }}>{notice.reactions?.heartCount || 0}</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.reactionBtn} onPress={() => reactNotice(notice._id, 'thumbsUp')}>
                  <Ionicons name="thumbs-up" size={16} color={notice.reactions?.myThumbsUp ? colors.primary : colors.textSecondary} />
                  <Text style={{ color: colors.textSecondary, marginLeft: 4 }}>{notice.reactions?.thumbsUpCount || 0}</Text>
                </TouchableOpacity>
              </View>
            </TouchableOpacity>
          ))
        )}
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
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: { fontSize: 24, fontWeight: '800' },
  content: { paddingHorizontal: 18, paddingBottom: 36 },
  card: {
    borderWidth: 1,
    borderRadius: 20,
    padding: 16,
    marginBottom: 12,
  },
  cardHead: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    marginBottom: 8,
  },
  noticeTitle: { fontSize: 18, fontWeight: '800', flex: 1 },
  unreadDot: { width: 10, height: 10, borderRadius: 5 },
  noticeMessage: { fontSize: 14, lineHeight: 21 },
  noticeImage: {
    width: '100%',
    height: 170,
    borderRadius: 14,
    marginTop: 12,
  },
  reactionRow: { flexDirection: 'row', gap: 14, marginTop: 14 },
  reactionBtn: { flexDirection: 'row', alignItems: 'center' },
  emptyText: { fontSize: 14, textAlign: 'center' },
});
