import React, { useEffect, useMemo, useRef, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, RefreshControl, TextInput, Alert, Modal, Image } from 'react-native';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { apiClient } from '../../config/api';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';

const essentials = [
  { name: 'ADTU Stationery Hub', category: 'Stationery', contact: '+91 97065 11223', area: 'Near Main Gate' },
  { name: 'Panikhaiti Medical', category: 'Pharmacy', contact: '+91 97065 44581', area: 'Panikhaiti Bazar' },
  { name: 'Campus Cut Point', category: 'Barber Shop', contact: '+91 91010 22334', area: 'L Block Road' },
  { name: 'Fresh Basket Mini Mart', category: 'Grocery', contact: '+91 78965 12098', area: 'Khanapara Road' },
];

export default function HomeScreen() {
  const { user } = useAuth();
  const { colors } = useTheme();
  const router = useRouter();
  const isTeacher = user?.role === 'teacher';
  const [notifications, setNotifications] = useState<any[]>([]);
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
  const [thingsControls, setThingsControls] = useState([
    { id: 'cse-a-204', label: 'CSE Lecture Hall A-204', lightsOn: true, fansOn: true, lastSync: '2m ago' },
    { id: 'ece-b-103', label: 'ECE Lecture Hall B-103', lightsOn: false, fansOn: true, lastSync: 'Just now' },
    { id: 'mba-l-12', label: 'MBA Smart Room L-12', lightsOn: true, fansOn: false, lastSync: '5m ago' },
  ]);
  const popupTimerRef = useRef<any>(null);
  const rootScrollRef = useRef<ScrollView | null>(null);
  const noticesSectionY = useRef(0);
  const previousAnnouncementCount = useRef(0);
  const initialLoadDone = useRef(false);

  const fetchNotifications = async (isBackground = false) => {
    try {
      const { data } = await apiClient.get('/notifications');
      const list = Array.isArray(data) ? data : [];
      const announcementCount = list.filter((n) => n.type === 'announcement').length;
      if (isBackground && initialLoadDone.current && announcementCount > previousAnnouncementCount.current) {
        Alert.alert('New update', 'A new department update was posted.');
      }
      previousAnnouncementCount.current = announcementCount;
      initialLoadDone.current = true;
      setNotifications(list);
      setUnreadCount(list.filter((n) => !n.isRead).length);

      // Keep popup list time-bounded so old notifications auto-disappear from popup.
      const now = Date.now();
      const recentForPopup = list.filter((n) => {
        const created = new Date(n.createdAt || now).getTime();
        return now - created <= 24 * 60 * 60 * 1000;
      }).slice(0, 6);
      setPopupNotifications(recentForPopup);
    } catch (_error) {
      setNotifications([]);
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

  const toggleThingDevice = (roomId: string, key: 'lightsOn' | 'fansOn') => {
    setThingsControls((prev) =>
      prev.map((room) => {
        if (room.id !== roomId) return room;
        return {
          ...room,
          [key]: !room[key],
          lastSync: 'Just now',
        };
      })
    );
  };
  
  return (
    <ScrollView
      ref={rootScrollRef}
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchNotifications(false); }} tintColor={colors.primary} />}
    >
      <View style={styles.header}>
        <View>
          <Text style={[styles.greeting, { color: colors.text }]}>Hello, {user?.name || 'User'}</Text>
          <Text style={[styles.roleText, { color: colors.primary }]}>{isTeacher ? 'Teacher Dashboard' : 'Student Dashboard'}</Text>
        </View>
        <TouchableOpacity onPress={openNotificationPopup} style={[styles.notifyBtn, { backgroundColor: colors.surface, borderColor: colors.border }]}> 
          <Ionicons name="notifications-outline" size={22} color={colors.primary} />
          {unreadCount > 0 ? (
            <View style={[styles.badge, { backgroundColor: '#ef4444' }]}>
              <Text style={styles.badgeText}>{unreadCount > 9 ? '9+' : unreadCount}</Text>
            </View>
          ) : null}
        </TouchableOpacity>
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
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Quick Actions</Text>
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

          <TouchableOpacity onPress={() => router.push(isTeacher ? '/(tabs)/students' : '/(tabs)/campus')} style={[styles.quickCard, { backgroundColor: colors.surface, borderColor: colors.border }]}> 
            <Ionicons name={isTeacher ? 'people-outline' : 'business-outline'} size={20} color={colors.primary} />
            <Text style={[styles.quickTitle, { color: colors.text }]}>{isTeacher ? 'Students' : 'Campus Live'}</Text>
            <Text style={[styles.quickSub, { color: colors.textSecondary }]}>{isTeacher ? 'Department list' : 'Crowd updates'}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => rootScrollRef.current?.scrollTo({ y: Math.max(0, noticesSectionY.current - 14), animated: true })}
            style={[styles.quickCard, { backgroundColor: colors.surface, borderColor: colors.border }]}
          > 
            <Ionicons name="reader-outline" size={20} color={colors.primary} />
            <Text style={[styles.quickTitle, { color: colors.text }]}>Department Notices</Text>
            <Text style={[styles.quickSub, { color: colors.textSecondary }]}>Jump to notice board</Text>
          </TouchableOpacity>

        </View>
      </View>

      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Essentials Near ADTU</Text>
        <View style={styles.quickGrid}>
          {essentials.map((store) => (
            <View key={store.name} style={[styles.quickCard, { backgroundColor: colors.surface, borderColor: colors.border }]}> 
              <Text style={[styles.quickTitle, { color: colors.text }]}>{store.name}</Text>
              <Text style={[styles.quickSub, { color: colors.textSecondary }]}>{store.category}</Text>
              <Text style={[styles.quickSub, { color: colors.textSecondary }]}>{store.area}</Text>
              <Text style={[styles.storePhone, { color: colors.primary }]}>{store.contact}</Text>
            </View>
          ))}
        </View>
      </View>

      {isTeacher && (
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Post Notice</Text>
          <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}> 
            <TextInput
              value={noticeTitle}
              onChangeText={setNoticeTitle}
              placeholder="Notice title"
              placeholderTextColor={colors.textSecondary}
              style={[styles.input, { borderColor: colors.border, color: colors.text, backgroundColor: colors.background }]}
            />
            <TextInput
              value={noticeMessage}
              onChangeText={setNoticeMessage}
              placeholder="Message for your department"
              placeholderTextColor={colors.textSecondary}
              multiline
              style={[styles.input, styles.textarea, { borderColor: colors.border, color: colors.text, backgroundColor: colors.background }]}
            />
            <TouchableOpacity
              onPress={pickAndUploadNoticeAttachment}
              disabled={uploadingAttachment}
              style={[styles.attachmentBtn, { borderColor: colors.border, backgroundColor: colors.background }]}
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

            <TouchableOpacity disabled={posting} onPress={postNotice} style={[styles.postBtn, { backgroundColor: colors.primary }]}> 
              {posting ? <ActivityIndicator color="#fff" /> : <Text style={styles.postBtnText}>Publish Notice</Text>}
            </TouchableOpacity>
          </View>
        </View>
      )}

      {isTeacher && (
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Things Control (Dummy)</Text>
          <Text style={[styles.noticeBoardSub, { color: colors.textSecondary }]}>Check and control classroom lights and fans remotely. IoT device integration will be connected later.</Text>

          {thingsControls.map((room) => (
            <View key={room.id} style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border, marginBottom: 10 }]}> 
              <View style={styles.thingsHead}>
                <Text style={[styles.noticeTitle, { color: colors.text, flex: 1 }]}>{room.label}</Text>
                <Text style={{ color: colors.textSecondary, fontSize: 12 }}>Sync: {room.lastSync}</Text>
              </View>

              <View style={styles.thingsStatusRow}>
                <View style={[styles.statusPill, { backgroundColor: room.lightsOn ? '#fee2e2' : '#dcfce7' }]}>
                  <Text style={[styles.statusPillText, { color: room.lightsOn ? '#b91c1c' : '#15803d' }]}>Lights {room.lightsOn ? 'ON' : 'OFF'}</Text>
                </View>
                <View style={[styles.statusPill, { backgroundColor: room.fansOn ? '#fee2e2' : '#dcfce7' }]}>
                  <Text style={[styles.statusPillText, { color: room.fansOn ? '#b91c1c' : '#15803d' }]}>Fans {room.fansOn ? 'ON' : 'OFF'}</Text>
                </View>
              </View>

              <View style={styles.thingsActionRow}>
                <TouchableOpacity
                  onPress={() => toggleThingDevice(room.id, 'lightsOn')}
                  style={[styles.thingActionBtn, { backgroundColor: room.lightsOn ? '#ef4444' : '#16a34a' }]}
                >
                  <Text style={styles.thingActionText}>{room.lightsOn ? 'Turn Lights OFF' : 'Turn Lights ON'}</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => toggleThingDevice(room.id, 'fansOn')}
                  style={[styles.thingActionBtn, { backgroundColor: room.fansOn ? '#ef4444' : '#16a34a' }]}
                >
                  <Text style={styles.thingActionText}>{room.fansOn ? 'Turn Fans OFF' : 'Turn Fans ON'}</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))}
        </View>
      )}

      <View
        style={styles.section}
        onLayout={(event) => {
          noticesSectionY.current = event.nativeEvent.layout.y;
        }}
      >
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Department Notices</Text>
        <Text style={[styles.noticeBoardSub, { color: colors.textSecondary }]}>Notice board for your department updates, reactions, and shared posters.</Text>
        {loading ? (
          <ActivityIndicator color={colors.primary} />
        ) : announcements.length === 0 ? (
          <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}> 
            <Text style={[styles.cardText, { color: colors.textSecondary }]}>No notices yet.</Text>
          </View>
        ) : (
          announcements.map((n) => (
            <TouchableOpacity key={n._id} onPress={() => markRead(n._id)} style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}> 
              <Text style={[styles.noticeTitle, { color: colors.text }]}>{n.title}</Text>
              <Text style={[styles.cardText, { color: colors.textSecondary }]}>{n.message}</Text>
              {n.attachmentUrl ? (
                <TouchableOpacity activeOpacity={0.9} onPress={() => setAttachmentPreview(n.attachmentUrl)} style={styles.noticeAttachmentWrap}>
                  <Image source={{ uri: n.attachmentUrl }} style={styles.noticeAttachment} />
                </TouchableOpacity>
              ) : null}

              <View style={styles.reactionRow}>
                <TouchableOpacity style={styles.reactionBtn} onPress={() => reactNotice(n._id, 'heart')}>
                  <Ionicons name="heart" size={16} color={n.reactions?.myHeart ? '#ef4444' : colors.textSecondary} />
                  <Text style={{ color: colors.textSecondary, marginLeft: 4 }}>{n.reactions?.heartCount || 0}</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.reactionBtn} onPress={() => reactNotice(n._id, 'thumbsUp')}>
                  <Ionicons name="thumbs-up" size={16} color={n.reactions?.myThumbsUp ? colors.primary : colors.textSecondary} />
                  <Text style={{ color: colors.textSecondary, marginLeft: 4 }}>{n.reactions?.thumbsUpCount || 0}</Text>
                </TouchableOpacity>
              </View>
            </TouchableOpacity>
          ))
        )}

        <Text style={[styles.madeWithLove, { color: colors.textSecondary }]}>Made with love ❤️ by SyntaxError Team</Text>
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
  content: { paddingHorizontal: 24, paddingTop: 72, paddingBottom: 130 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 40,
  },
  greeting: { fontSize: 28, fontWeight: '800' },
  roleText: { fontSize: 16, fontWeight: '500', marginTop: 4 },
  notifyBtn: {
    width: 48, height: 48, borderRadius: 14,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1,
  },
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
  sectionTitle: { fontSize: 18, fontWeight: '600', marginBottom: 16 },
  card: {
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
  },
  cardText: { fontSize: 15, lineHeight: 22 },
  quickGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  quickCard: {
    width: '48%',
    borderWidth: 1,
    borderRadius: 14,
    padding: 14,
    minHeight: 110,
    justifyContent: 'space-between',
  },
  quickTitle: { fontSize: 16, fontWeight: '700', marginTop: 8 },
  quickSub: { fontSize: 12, marginTop: 4 },
  storePhone: { fontSize: 12, fontWeight: '700', marginTop: 6 },
  noticeBoardSub: { fontSize: 13, lineHeight: 19, marginBottom: 12 },
  input: { borderWidth: 1, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, marginBottom: 10 },
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
  madeWithLove: {
    marginTop: 12,
    textAlign: 'center',
    fontSize: 12,
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
