import React, { useEffect, useMemo, useRef, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, RefreshControl, TextInput, Alert, Modal, Image } from 'react-native';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { apiClient } from '../../config/api';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';

export default function HomeScreen() {
  const { user } = useAuth();
  const { colors } = useTheme();
  const router = useRouter();
  const isTeacher = user?.role === 'teacher';
  const [notifications, setNotifications] = useState<any[]>([]);
  const [registeredEventsCount, setRegisteredEventsCount] = useState(0);
  const [attendanceValue, setAttendanceValue] = useState(0);
  const [liveZonesCount, setLiveZonesCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [noticeTitle, setNoticeTitle] = useState('');
  const [noticeMessage, setNoticeMessage] = useState('');
  const [noticeAttachmentUrl, setNoticeAttachmentUrl] = useState('');
  const [posting, setPosting] = useState(false);
  const [uploadingAttachment, setUploadingAttachment] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showNotificationPopup, setShowNotificationPopup] = useState(false);
  const [popupNotifications, setPopupNotifications] = useState<any[]>([]);
  const [attachmentPreview, setAttachmentPreview] = useState<string | null>(null);
  const popupTimerRef = useRef<any>(null);
  const rootScrollRef = useRef<ScrollView | null>(null);
  const noticesSectionY = useRef(0);
  const previousAnnouncementCount = useRef(0);
  const initialLoadDone = useRef(false);

  const fetchNotifications = async (isBackground = false) => {
    try {
      const [notificationsRes, registeredEventsRes, attendanceRes, crowdRes] = await Promise.all([
        apiClient.get('/notifications'),
        apiClient.get('/events/registered/mine').catch(() => ({ data: [] })),
        apiClient.get('/schedules/attendance/history').catch(() => ({ data: null })),
        apiClient.get('/crowd/status').catch(() => ({ data: [] })),
      ]);

      const list = Array.isArray(notificationsRes.data) ? notificationsRes.data : [];
      const announcementCount = list.filter((n) => n.type === 'announcement').length;
      if (isBackground && initialLoadDone.current && announcementCount > previousAnnouncementCount.current) {
        Alert.alert('New update', 'A new department update was posted.');
      }
      previousAnnouncementCount.current = announcementCount;
      initialLoadDone.current = true;
      setNotifications(list);
      setUnreadCount(list.filter((n) => !n.isRead).length);

      const now = Date.now();
      const recentForPopup = list.filter((n) => {
        const created = new Date(n.createdAt || now).getTime();
        return now - created <= 24 * 60 * 60 * 1000;
      }).slice(0, 6);
      setPopupNotifications(recentForPopup);
      setRegisteredEventsCount(Array.isArray(registeredEventsRes.data) ? registeredEventsRes.data.length : 0);

      const attendanceSummary = attendanceRes.data?.summary || {};
      const nextAttendanceValue = isTeacher
        ? Number(attendanceSummary.averageAttendancePercentage ?? 0)
        : Number(attendanceSummary.attendancePercentage ?? 0);
      setAttendanceValue(Number.isFinite(nextAttendanceValue) ? Math.round(nextAttendanceValue) : 0);
      setLiveZonesCount(Array.isArray(crowdRes.data) ? crowdRes.data.length : 0);
    } catch (_error) {
      setNotifications([]);
      setRegisteredEventsCount(0);
      setAttendanceValue(0);
      setLiveZonesCount(0);
    } finally {
      if (!isBackground) setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchNotifications(false);
    const timer = setInterval(() => fetchNotifications(true), 25000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    return () => {
      if (popupTimerRef.current) clearTimeout(popupTimerRef.current);
    };
  }, []);

  const announcements = useMemo(
    () => notifications.filter((n) => n.type === 'announcement').slice(0, 10),
    [notifications]
  );
  const recentNotice = announcements[0] || null;

  const todayLabel = useMemo(
    () =>
      new Date().toLocaleDateString(undefined, {
        weekday: 'long',
        month: 'short',
        day: 'numeric',
      }),
    []
  );

  const exploreCards = useMemo(() => {
      const cards: Array<{
        key: string;
        title: string;
        subtitle: string;
        icon: any;
        action: () => void;
      }> = [
      {
        key: 'transport',
        title: 'Transport Hub',
        subtitle: 'Shuttle loops and city routes',
        icon: 'bus-outline' as const,
        action: () => router.push('/(tabs)/two'),
      },
      {
        key: 'campus',
        title: 'Campus Live',
        subtitle: 'Crowd updates and live zones',
        icon: 'navigate-outline' as const,
        action: () => router.push('/(tabs)/campus'),
      },
      {
        key: 'notices',
        title: 'All Notices',
        subtitle: 'Open the full notice board',
        icon: 'reader-outline' as const,
        action: () => router.push('/notices'),
      },
      {
        key: 'leadership',
        title: 'Leadership Desk',
        subtitle: 'See if HODs and Deans are in office',
        icon: 'briefcase-outline' as const,
        action: () => router.push('/leadership'),
      },
      {
        key: 'essentials',
        title: 'Essentials',
        subtitle: 'Nearby stores and student support spots',
        icon: 'storefront-outline' as const,
        action: () => router.push('/essentials'),
      },
    ];

    if (isTeacher) {
      cards.splice(2, 0, {
        key: 'students',
        title: 'Students',
        subtitle: 'Department roster and status',
        icon: 'people-outline' as const,
        action: () => router.push('/(tabs)/students'),
      });
      cards.push({
        key: 'things-control',
        title: 'Things Control',
        subtitle: 'Open smart room controls',
        icon: 'hardware-chip-outline' as const,
        action: () => router.push('/things-control'),
      });
    }

    return cards;
  }, [isTeacher, router]);

  const reactNotice = async (id: string, reaction: 'heart' | 'thumbsUp') => {
    try {
      await apiClient.post(`/notifications/${id}/react`, { reaction });
      fetchNotifications();
    } catch (_error) {
      // no-op
    }
  };

  const markRead = async (id: string) => {
    try {
      await apiClient.put(`/notifications/${id}/read`);
      fetchNotifications();
    } catch (_error) {
      // no-op
    }
  };

  const markAllRead = async () => {
    try {
      await apiClient.put('/notifications/read-all');
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setPopupNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch (_error) {
      // no-op
    }
  };

  const openNotificationPopup = () => {
    setShowNotificationPopup(true);
    if (unreadCount > 0) {
      markAllRead();
    }
    if (popupTimerRef.current) clearTimeout(popupTimerRef.current);
    popupTimerRef.current = setTimeout(() => {
      setPopupNotifications([]);
      setShowNotificationPopup(false);
    }, 20000);
  };

  const pickAndUploadNoticeAttachment = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Permission needed', 'Allow gallery access to attach a flyer.');
      return;
    }

    const mediaTypes = (ImagePicker as any).MediaType?.Images ?? (ImagePicker as any).MediaTypeOptions.Images;
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes,
      allowsEditing: true,
      aspect: [4, 5],
      quality: 0.9,
    });

    if (result.canceled || !result.assets?.[0]) return;

    try {
      setUploadingAttachment(true);
      const file = result.assets[0];
      const ext = file.uri.split('.').pop() || 'jpg';
      const formData = new FormData();
      formData.append('image', {
        uri: file.uri,
        name: `notice-flyer-${Date.now()}.${ext}`,
        type: file.mimeType || `image/${ext}`,
      } as any);

      const { data } = await apiClient.post('/events/flyer-upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      setNoticeAttachmentUrl(data.flyerUrl || '');
      Alert.alert('Uploaded', 'Attachment added to notice.');
    } catch (error: any) {
      Alert.alert('Upload failed', error.response?.data?.message || 'Unable to upload attachment.');
    } finally {
      setUploadingAttachment(false);
    }
  };

  const postNotice = async () => {
    if (!noticeTitle.trim() || !noticeMessage.trim()) {
      Alert.alert('Validation', 'Title and message are required');
      return;
    }

    setPosting(true);
    try {
      await apiClient.post('/teacher/announce', { title: noticeTitle, message: noticeMessage, attachmentUrl: noticeAttachmentUrl || undefined });
      setNoticeTitle('');
      setNoticeMessage('');
      setNoticeAttachmentUrl('');
      await fetchNotifications();
      Alert.alert('Success', 'Notice posted');
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.message || 'Failed to post notice');
    } finally {
      setPosting(false);
    }
  };

  return (
    <ScrollView
      ref={rootScrollRef}
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchNotifications(false); }} tintColor={colors.primary} />}
    >
      <View style={[styles.heroCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <View style={[styles.heroGlow, { backgroundColor: colors.primaryBg }]} />
        <View style={styles.header}>
          <View style={{ flex: 1 }}>
            <Text style={[styles.eyebrow, { color: colors.textSecondary }]}>{todayLabel}</Text>
            <Text style={[styles.greeting, { color: colors.text }]}>Hello, {user?.name || 'User'}</Text>
            <Text style={[styles.roleText, { color: colors.primary }]}>{isTeacher ? 'Teacher Dashboard' : 'Student Dashboard'}</Text>
          </View>
          <TouchableOpacity onPress={openNotificationPopup} style={[styles.notifyBtn, { backgroundColor: colors.background, borderColor: colors.border }]}> 
            <Ionicons name="notifications-outline" size={22} color={colors.primary} />
            {unreadCount > 0 ? (
              <View style={[styles.badge, { backgroundColor: '#ef4444' }]}>
                <Text style={styles.badgeText}>{unreadCount > 9 ? '9+' : unreadCount}</Text>
              </View>
            ) : null}
          </TouchableOpacity>
        </View>
        <View style={styles.heroStatsRow}>
          <View style={[styles.heroStatCard, { backgroundColor: colors.background, borderColor: colors.border }]}>
            <Text style={[styles.heroStatValue, { color: colors.text }]}>{attendanceValue}%</Text>
            <Text style={[styles.heroStatLabel, { color: colors.textSecondary }]}>Attendance</Text>
          </View>
          <View style={[styles.heroStatCard, { backgroundColor: colors.background, borderColor: colors.border }]}>
            <Text style={[styles.heroStatValue, { color: colors.text }]}>{registeredEventsCount}</Text>
            <Text style={[styles.heroStatLabel, { color: colors.textSecondary }]}>Registered Events</Text>
          </View>
          <View style={[styles.heroStatCard, { backgroundColor: colors.background, borderColor: colors.border }]}>
            <Text style={[styles.heroStatValue, { color: colors.text }]}>4</Text>
            <Text style={[styles.heroStatLabel, { color: colors.textSecondary }]}>Leadership Slots</Text>
          </View>
        </View>
      </View>

      <Modal
        visible={showNotificationPopup}
        transparent
        animationType="fade"
        onRequestClose={() => {
          setShowNotificationPopup(false);
          setPopupNotifications([]);
        }}
      >
        <View style={styles.popupOverlay}>
          <View style={[styles.popupCard, { backgroundColor: colors.surface, borderColor: colors.border }]}> 
            <View style={styles.popupHeader}>
              <Text style={[styles.popupTitle, { color: colors.text }]}>Notifications</Text>
              <TouchableOpacity onPress={() => {
                setShowNotificationPopup(false);
                setPopupNotifications([]);
              }}>
                <Ionicons name="close" size={22} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>
            {popupNotifications.length === 0 ? (
              <Text style={{ color: colors.textSecondary }}>No active notifications.</Text>
            ) : (
              <ScrollView style={styles.popupList} showsVerticalScrollIndicator={false}>
                {popupNotifications.map((n) => (
                  <TouchableOpacity
                    key={n._id}
                    onPress={() => markRead(n._id)}
                    style={[styles.popupItem, !n.isRead && { borderLeftWidth: 3, borderLeftColor: colors.primary }]}
                  >
                    <Text numberOfLines={2} style={[styles.popupItemTitle, { color: colors.text }]}>{n.title}</Text>
                    <Text numberOfLines={2} style={{ color: colors.textSecondary }}>{n.message}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>

      <View style={styles.section}>
        <Text style={[styles.sectionTitle, styles.standaloneSectionTitle, { color: colors.text }]}>Main Actions</Text>
        <View style={styles.quickGrid}>
          <TouchableOpacity onPress={() => router.push('/(tabs)/schedule')} style={[styles.quickCard, { backgroundColor: colors.surface, borderColor: colors.border }]}> 
            <Ionicons name="calendar-outline" size={20} color={colors.primary} />
            <Text style={[styles.quickTitle, { color: colors.text }]}>Schedule</Text>
            <Text style={[styles.quickSub, { color: colors.textSecondary }]}>{isTeacher ? 'Manage classes' : 'View your day'}</Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={() => router.push('/(tabs)/events')} style={[styles.quickCard, { backgroundColor: colors.surface, borderColor: colors.border }]}> 
            <Ionicons name="sparkles-outline" size={20} color={colors.primary} />
            <Text style={[styles.quickTitle, { color: colors.text }]}>Events</Text>
            <Text style={[styles.quickSub, { color: colors.textSecondary }]}>Register or view map</Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={() => router.push('/(tabs)/profile')} style={[styles.quickCard, { backgroundColor: colors.surface, borderColor: colors.border }]}> 
            <Ionicons name="person-outline" size={20} color={colors.primary} />
            <Text style={[styles.quickTitle, { color: colors.text }]}>Profile</Text>
            <Text style={[styles.quickSub, { color: colors.textSecondary }]}>Account details and activity</Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={() => router.push('/attendance')} style={[styles.quickCard, { backgroundColor: colors.surface, borderColor: colors.border }]}> 
            <Ionicons name="stats-chart-outline" size={20} color={colors.primary} />
            <Text style={[styles.quickTitle, { color: colors.text }]}>Attendance</Text>
            <Text style={[styles.quickSub, { color: colors.textSecondary }]}>Track classes and attendance summary</Text>
          </TouchableOpacity>

        </View>
      </View>

      <View
        style={styles.section}
        onLayout={(event) => {
          noticesSectionY.current = event.nativeEvent.layout.y;
        }}
      >
        <View style={styles.noticeCardHeader}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Recent Notice</Text>
          <TouchableOpacity onPress={() => router.push('/notices')}>
            <Text style={[styles.seeMoreText, { color: colors.primary }]}>See more</Text>
          </TouchableOpacity>
        </View>
        {loading ? (
          <ActivityIndicator color={colors.primary} />
        ) : !recentNotice ? (
          <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Text style={[styles.cardText, { color: colors.textSecondary }]}>No notices yet.</Text>
          </View>
        ) : (
          <TouchableOpacity key={recentNotice._id} onPress={() => markRead(recentNotice._id)} style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Text style={[styles.noticeTitle, { color: colors.text }]}>{recentNotice.title}</Text>
            <Text numberOfLines={3} style={[styles.cardText, { color: colors.textSecondary }]}>{recentNotice.message}</Text>
            {recentNotice.attachmentUrl ? (
              <TouchableOpacity activeOpacity={0.9} onPress={() => setAttachmentPreview(recentNotice.attachmentUrl)} style={styles.noticeAttachmentWrap}>
                <Image source={{ uri: recentNotice.attachmentUrl }} style={styles.noticeAttachment} />
              </TouchableOpacity>
            ) : null}
            <View style={styles.reactionRow}>
              <TouchableOpacity style={styles.reactionBtn} onPress={() => reactNotice(recentNotice._id, 'heart')}>
                <Ionicons name="heart" size={16} color={recentNotice.reactions?.myHeart ? '#ef4444' : colors.textSecondary} />
                <Text style={{ color: colors.textSecondary, marginLeft: 4 }}>{recentNotice.reactions?.heartCount || 0}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.reactionBtn} onPress={() => reactNotice(recentNotice._id, 'thumbsUp')}>
                <Ionicons name="thumbs-up" size={16} color={recentNotice.reactions?.myThumbsUp ? colors.primary : colors.textSecondary} />
                <Text style={{ color: colors.textSecondary, marginLeft: 4 }}>{recentNotice.reactions?.thumbsUpCount || 0}</Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.section}>
        <Text style={[styles.sectionTitle, styles.standaloneSectionTitle, { color: colors.text }]}>Explore From Home</Text>
        <View style={styles.quickGrid}>
          {exploreCards.map((card) => (
            <TouchableOpacity key={card.key} onPress={card.action} style={[styles.quickCard, styles.featureCard, { backgroundColor: colors.surface, borderColor: colors.border }]}> 
              <View style={[styles.featureIconWrap, { backgroundColor: colors.primaryBg }]}>
                <Ionicons name={card.icon} size={20} color={colors.primary} />
              </View>
              <Text style={[styles.quickTitle, { color: colors.text }]}>{card.title}</Text>
              <Text style={[styles.quickSub, { color: colors.textSecondary }]}>{card.subtitle}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {isTeacher && (
        <View style={styles.section}>
          <View style={styles.noticeCardHeader}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Post Notice</Text>
            <Text style={[styles.seeMoreText, { color: colors.textSecondary }]}>Faculty tool</Text>
          </View>
          <View style={[styles.card, styles.noticeComposerCard, { backgroundColor: colors.surface, borderColor: colors.border }]}> 
            <TextInput
              value={noticeTitle}
              onChangeText={setNoticeTitle}
              placeholder="Notice title"
              placeholderTextColor={colors.textSecondary}
              style={[styles.input, styles.noticeComposerInput, { borderColor: colors.border, color: colors.text, backgroundColor: colors.background }]}
            />
            <TextInput
              value={noticeMessage}
              onChangeText={setNoticeMessage}
              placeholder="Message for your department"
              placeholderTextColor={colors.textSecondary}
              multiline
              style={[styles.input, styles.textarea, styles.noticeComposerInput, { borderColor: colors.border, color: colors.text, backgroundColor: colors.background }]}
            />
            <TouchableOpacity
              onPress={pickAndUploadNoticeAttachment}
              disabled={uploadingAttachment}
              style={[styles.attachmentBtn, { borderColor: colors.border, backgroundColor: colors.primaryBg }]}
            >
              <Ionicons name="image-outline" size={16} color={colors.primary} />
              <Text style={{ color: colors.text, fontWeight: '700', marginLeft: 8 }}>
                {uploadingAttachment ? 'Uploading attachment...' : noticeAttachmentUrl ? 'Replace Attachment' : 'Attach Flyer / Poster'}
              </Text>
            </TouchableOpacity>

            {noticeAttachmentUrl ? (
              <TouchableOpacity activeOpacity={0.9} onPress={() => setAttachmentPreview(noticeAttachmentUrl)}>
                <Image source={{ uri: noticeAttachmentUrl }} style={styles.attachmentPreview} />
              </TouchableOpacity>
            ) : null}

            <TouchableOpacity disabled={posting} onPress={postNotice} style={[styles.postBtn, styles.noticeComposerBtn, { backgroundColor: colors.primary }]}> 
              {posting ? <ActivityIndicator color="#fff" /> : <Text style={styles.postBtnText}>Publish Notice</Text>}
            </TouchableOpacity>
          </View>
        </View>
      )}

      <View style={[styles.footerNote, { borderColor: colors.border }]}>
        <Text style={[styles.footerNoteText, { color: colors.textSecondary }]}>Made with love ❤️ by SyntaxError Team</Text>
      </View>

      <Modal visible={!!attachmentPreview} transparent animationType="fade" onRequestClose={() => setAttachmentPreview(null)}>
        <View style={styles.previewOverlay}>
          <TouchableOpacity style={styles.previewClose} onPress={() => setAttachmentPreview(null)}>
            <Ionicons name="close" size={28} color="#fff" />
          </TouchableOpacity>
          {attachmentPreview ? <Image source={{ uri: attachmentPreview }} style={styles.previewImage} resizeMode="contain" /> : null}
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { paddingHorizontal: 20, paddingTop: 52, paddingBottom: 88 },
  heroCard: {
    borderWidth: 1,
    borderRadius: 28,
    padding: 22,
    marginBottom: 32,
    overflow: 'hidden',
  },
  heroGlow: {
    position: 'absolute',
    width: 200,
    height: 200,
    borderRadius: 999,
    top: -90,
    right: -50,
    opacity: 0.5,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 22,
  },
  eyebrow: { fontSize: 12, fontWeight: '700', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 8 },
  greeting: { fontSize: 28, fontWeight: '800' },
  roleText: { fontSize: 16, fontWeight: '500', marginTop: 4 },
  notifyBtn: {
    width: 54, height: 54, borderRadius: 18,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1,
  },
  heroStatsRow: { flexDirection: 'row', gap: 10 },
  heroStatCard: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 18,
    paddingVertical: 14,
    paddingHorizontal: 12,
  },
  heroStatValue: { fontSize: 22, fontWeight: '800' },
  heroStatLabel: { fontSize: 12, marginTop: 4, fontWeight: '600' },
  badge: {
    position: 'absolute',
    top: -4,
    right: -4,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  badgeText: { color: '#fff', fontSize: 10, fontWeight: '700' },
  section: { marginBottom: 32 },
  sectionHeaderRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginBottom: 16 },
  sectionTitle: { fontSize: 20, fontWeight: '800' },
  standaloneSectionTitle: { marginBottom: 16 },
  sectionCaption: { fontSize: 12, fontWeight: '600', maxWidth: 150, textAlign: 'right' },
  noticeCardHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 },
  seeMoreText: { fontSize: 13, fontWeight: '700' },
  card: {
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
  },
  noticeComposerCard: {
    borderRadius: 26,
    padding: 18,
  },
  cardText: { fontSize: 15, lineHeight: 22 },
  quickGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  quickCard: {
    width: '48%',
    borderWidth: 1,
    borderRadius: 20,
    padding: 16,
    minHeight: 124,
    justifyContent: 'space-between',
  },
  featureCard: {
    minHeight: 134,
  },
  featureIconWrap: {
    width: 42,
    height: 42,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickTitle: { fontSize: 16, fontWeight: '700', marginTop: 8 },
  quickSub: { fontSize: 12, marginTop: 4 },
  storePhone: { fontSize: 12, fontWeight: '700', marginTop: 6 },
  noticeBoardSub: { fontSize: 13, lineHeight: 19, marginBottom: 12 },
  input: { borderWidth: 1, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, marginBottom: 10 },
  noticeComposerInput: { borderRadius: 14 },
  textarea: { minHeight: 92, textAlignVertical: 'top' },
  attachmentBtn: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 11,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  attachmentPreview: {
    width: '100%',
    height: 170,
    borderRadius: 10,
    marginBottom: 10,
  },
  postBtn: { borderRadius: 10, paddingVertical: 12, alignItems: 'center' },
  noticeComposerBtn: { borderRadius: 16, marginTop: 6 },
  postBtnText: { color: '#fff', fontWeight: '700' },
  noticeTitle: { fontSize: 16, fontWeight: '700', marginBottom: 6 },
  noticeAttachmentWrap: { marginTop: 10 },
  noticeAttachment: { width: '100%', height: 150, borderRadius: 10 },
  reactionRow: { flexDirection: 'row', marginTop: 10, gap: 12 },
  reactionBtn: { flexDirection: 'row', alignItems: 'center' },
  thingsHead: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  thingsStatusRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 10,
  },
  statusPill: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
  },
  statusPillText: {
    fontSize: 11,
    fontWeight: '700',
  },
  thingsActionRow: {
    flexDirection: 'row',
    gap: 8,
  },
  thingActionBtn: {
    flex: 1,
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  thingActionText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
  },
  footerNote: {
    marginTop: 4,
    marginBottom: 0,
    alignItems: 'center',
  },
  footerNoteText: {
    textAlign: 'center',
    fontSize: 13,
    fontWeight: '600',
  },
  popupOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.35)',
    justifyContent: 'flex-start',
    paddingTop: 104,
    paddingHorizontal: 24,
  },
  popupCard: {
    borderWidth: 1,
    borderRadius: 14,
    padding: 14,
    maxHeight: 430,
    overflow: 'hidden',
  },
  popupList: { maxHeight: 350 },
  popupHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  popupTitle: { fontSize: 18, fontWeight: '800' },
  popupItem: {
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#334155',
    marginBottom: 4,
  },
  popupItemTitle: { fontSize: 15, fontWeight: '700', marginBottom: 4 },
  previewOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.95)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  previewClose: {
    position: 'absolute',
    top: 56,
    right: 24,
    zIndex: 10,
  },
  previewImage: {
    width: '100%',
    height: '82%',
  },
});
