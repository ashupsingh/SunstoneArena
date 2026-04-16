import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, FlatList, TouchableOpacity, Image, Alert, TextInput, Modal, ScrollView, Platform, KeyboardAvoidingView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import { apiClient } from '../../config/api';
import * as Linking from 'expo-linking';
import * as ImagePicker from 'expo-image-picker';
import { useAuth } from '../../context/AuthContext';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { useRouter } from 'expo-router';
import { getSavedEventIds, toggleSavedEvent } from '../../lib/savedEvents';

type EventReactionState = Record<string, { liked: boolean; applauded: boolean; saved: boolean; likes: number; applauds: number }>;

export default function EventsScreen() {
  const { colors } = useTheme();
  const { user } = useAuth();
  const router = useRouter();
  const isTeacher = user?.role === 'teacher' || user?.role === 'superadmin';
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [events, setEvents] = useState<any[]>([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [uploadingPoster, setUploadingPoster] = useState(false);
  const [creating, setCreating] = useState(false);
  const [eventForm, setEventForm] = useState({ title: '', description: '', locationName: '', mapUrl: '', flyerUrl: '' });
  const [editingEventId, setEditingEventId] = useState<string | null>(null);
  const [posterPreview, setPosterPreview] = useState<string | null>(null);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [startAtDate, setStartAtDate] = useState<Date | null>(null);
  const [showDateTimePicker, setShowDateTimePicker] = useState(false);
  const [pickerMode, setPickerMode] = useState<'date' | 'time'>('date');
  const [reactionState, setReactionState] = useState<EventReactionState>({});

  const fetchEvents = async () => {
    try {
      const [eventsResponse, savedEventIds] = await Promise.all([
        apiClient.get('/events'),
        getSavedEventIds(user?._id),
      ]);
      const { data } = eventsResponse;
      const list = Array.isArray(data) ? data : [];
      const savedIds = new Set(savedEventIds);
      setEvents(list);
      setReactionState((prev) => {
        const next = { ...prev };
        list.forEach((event: any, index: number) => {
          if (!next[event._id]) {
            next[event._id] = {
              liked: false,
              applauded: false,
              saved: savedIds.has(event._id),
              likes: 18 + (index % 5) * 7,
              applauds: 4 + (index % 4) * 3,
            };
          } else {
            next[event._id] = {
              ...next[event._id],
              saved: savedIds.has(event._id),
            };
          }
        });
        return next;
      });
    } catch (_error) {
      setEvents([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, [user?._id]);

  const resetEventForm = () => {
    setEventForm({ title: '', description: '', locationName: '', mapUrl: '', flyerUrl: '' });
    setStartAtDate(null);
    setFormErrors({});
    setEditingEventId(null);
  };

  const validateEventForm = () => {
    const errors: Record<string, string> = {};
    if (!eventForm.title.trim()) errors.title = 'Event title is required.';
    if (!eventForm.description.trim()) errors.description = 'Description is required.';
    if (!eventForm.locationName.trim()) errors.locationName = 'Venue is required.';
    if (!startAtDate) errors.startAt = 'Select event date and time.';
    if (eventForm.mapUrl.trim() && !/^https?:\/\//i.test(eventForm.mapUrl.trim())) {
      errors.mapUrl = 'Map URL must start with http:// or https://';
    }
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const createEvent = async () => {
    if (!validateEventForm()) {
      Alert.alert('Validation', 'Please fix highlighted fields before publishing.');
      return;
    }

    setCreating(true);
    try {
      const payload = {
        ...eventForm,
        startAt: startAtDate ? startAtDate.toISOString() : undefined,
      };

      if (editingEventId) {
        await apiClient.put(`/events/${editingEventId}`, payload);
      } else {
        await apiClient.post('/events', payload);
      }
      resetEventForm();
      await fetchEvents();
      setShowCreateModal(false);
      Alert.alert('Success', editingEventId ? 'Event updated successfully.' : 'Event created successfully.');
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.message || 'Failed to create event');
    } finally {
      setCreating(false);
    }
  };

  const toggleRegistration = async (event: any) => {
    try {
      if (event.isRegistered) {
        await apiClient.delete(`/events/${event._id}/register`);
        Alert.alert('Updated', 'You have unregistered from this event.');
      } else {
        await apiClient.post(`/events/${event._id}/register`);
        Alert.alert('Success', 'Registered for event.');
      }
      fetchEvents();
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.message || 'Action failed');
    }
  };

  const onEditEvent = (event: any) => {
    setEventForm({
      title: event.title || '',
      description: event.description || '',
      locationName: event.locationName || '',
      mapUrl: event.mapUrl || '',
      flyerUrl: event.flyerUrl || '',
    });
    setStartAtDate(event.startAt ? new Date(event.startAt) : null);
    setFormErrors({});
    setEditingEventId(event._id);
    setShowCreateModal(true);
  };

  const onDeleteEvent = (eventId: string) => {
    Alert.alert('Delete Event', 'Are you sure you want to delete this event?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await apiClient.delete(`/events/${eventId}`);
            fetchEvents();
          } catch (error: any) {
            Alert.alert('Error', error.response?.data?.message || 'Delete failed');
          }
        },
      },
    ]);
  };

  const onRequestGlobal = async (eventId: string) => {
    try {
      const { data } = await apiClient.post(`/events/${eventId}/request-global`);
      Alert.alert('Submitted', data?.message || 'Approval request sent');
      fetchEvents();
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.message || 'Request failed');
    }
  };

  const openDatePicker = () => {
    setPickerMode('date');
    setShowDateTimePicker(true);
  };

  const openTimePicker = () => {
    setPickerMode('time');
    setShowDateTimePicker(true);
  };

  const handleDateTimeChange = (event: DateTimePickerEvent, selectedDate?: Date) => {
    if (event.type === 'dismissed') {
      setShowDateTimePicker(false);
      return;
    }

    const picked = selectedDate || new Date();

    if (pickerMode === 'date') {
      const base = startAtDate || new Date();
      const merged = new Date(picked);
      merged.setHours(base.getHours(), base.getMinutes(), 0, 0);
      setStartAtDate(merged);

      if (Platform.OS === 'android') {
        setPickerMode('time');
        setShowDateTimePicker(true);
      }
    } else {
      const base = startAtDate || new Date();
      const merged = new Date(base);
      merged.setHours(picked.getHours(), picked.getMinutes(), 0, 0);
      setStartAtDate(merged);
    }

    setFormErrors((prev) => ({ ...prev, startAt: '' }));
    if (Platform.OS === 'android') setShowDateTimePicker(false);
  };

  const renderFieldError = (key: string) => {
    if (!formErrors[key]) return null;
    return <Text style={styles.errorText}>{formErrors[key]}</Text>;
  };

  const pickAndUploadPoster = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Permission needed', 'Allow gallery access to upload a poster.');
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
      setUploadingPoster(true);
      const file = result.assets[0];
      const ext = file.uri.split('.').pop() || 'jpg';
      const formData = new FormData();
      formData.append('image', {
        uri: file.uri,
        name: `event-poster-${Date.now()}.${ext}`,
        type: file.mimeType || `image/${ext}`,
      } as any);

      const { data } = await apiClient.post('/events/flyer-upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      setEventForm((prev) => ({ ...prev, flyerUrl: data.flyerUrl || '' }));
      Alert.alert('Uploaded', 'Poster uploaded successfully.');
    } catch (error: any) {
      Alert.alert('Upload failed', error.response?.data?.message || 'Unable to upload poster.');
    } finally {
      setUploadingPoster(false);
    }
  };

  const toggleReaction = (eventId: string, type: 'like' | 'applaud') => {
    setReactionState((prev) => {
      const current = prev[eventId] || { liked: false, applauded: false, saved: false, likes: 0, applauds: 0 };

      if (type === 'like') {
        const liked = !current.liked;
        return {
          ...prev,
          [eventId]: {
            ...current,
            liked,
            likes: liked ? current.likes + 1 : Math.max(0, current.likes - 1),
          },
        };
      }

      if (type === 'applaud') {
        const applauded = !current.applauded;
        return {
          ...prev,
          [eventId]: {
            ...current,
            applauded,
            applauds: applauded ? current.applauds + 1 : Math.max(0, current.applauds - 1),
          },
        };
      }

      return prev;
    });
  };

  const onToggleSaved = async (event: any) => {
    try {
      const result = await toggleSavedEvent(user?._id, event._id);
      setReactionState((prev) => ({
        ...prev,
        [event._id]: {
          ...(prev[event._id] || { liked: false, applauded: false, saved: false, likes: 0, applauds: 0 }),
          saved: result.saved,
        },
      }));
      Alert.alert(result.saved ? 'Saved' : 'Removed', result.saved ? 'Event added to your saved list.' : 'Event removed from saved events.');
    } catch (_error) {
      Alert.alert('Error', 'Unable to update saved events right now.');
    }
  };

  const getPosterUrl = (item: any) => {
    if (item.flyerUrl) return item.flyerUrl;
    return `https://picsum.photos/seed/${item._id || item.title}/900/900`;
  };

  if (loading) {
    return (
      <View style={[styles.centered, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.fixedHeader, { backgroundColor: colors.background }]}>
        <View style={styles.headerRow}>
          <View style={{ flex: 1 }}>
            <Text style={[styles.title, { color: colors.text }]}>Events</Text>
            <Text style={[styles.subtitle, { color: colors.textSecondary }]}>A richer campus feed with live posts, posters and reactions.</Text>
          </View>
          {isTeacher ? (
            <TouchableOpacity
              onPress={() => {
                resetEventForm();
                setShowCreateModal(true);
              }}
              style={[styles.plusBtn, { backgroundColor: colors.primary }]}>
              <Ionicons name="add" size={24} color="#fff" />
            </TouchableOpacity>
          ) : null}
        </View>
      </View>

      <FlatList
        data={events}
        keyExtractor={(item) => item._id}
        refreshing={refreshing}
        onRefresh={() => {
          setRefreshing(true);
          fetchEvents();
        }}
        contentContainerStyle={styles.feedContent}
        ListEmptyComponent={<Text style={[styles.emptyText, { color: colors.textSecondary }]}>No upcoming events yet.</Text>}
        renderItem={({ item }) => {
          const reactions = reactionState[item._id] || { liked: false, applauded: false, saved: false, likes: 0, applauds: 0 };
          const hostName = item.createdBy?.name || 'Campus updates';
          const posterUrl = getPosterUrl(item);
          const avatarUrl = `https://api.dicebear.com/9.x/initials/png?seed=${encodeURIComponent(hostName)}`;

          return (
            <View style={[styles.postCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <View style={styles.postHeader}>
                <View style={styles.authorRow}>
                  <Image source={{ uri: avatarUrl }} style={styles.avatar} />
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.authorName, { color: colors.text }]}>{hostName}</Text>
                    <Text style={[styles.authorMeta, { color: colors.textSecondary }]}>{item.locationName || 'Campus'}{item.startAt ? ` | ${new Date(item.startAt).toLocaleDateString()}` : ''}</Text>
                  </View>
                </View>
                {isTeacher && (String(item.createdBy?._id || item.createdBy) === String(user?._id)) ? (
                  <TouchableOpacity onPress={() => onEditEvent(item)}>
                    <Ionicons name="ellipsis-horizontal" size={18} color={colors.textSecondary} />
                  </TouchableOpacity>
                ) : null}
              </View>

              <TouchableOpacity activeOpacity={0.92} onPress={() => setPosterPreview(posterUrl)}>
                <Image source={{ uri: posterUrl }} style={styles.postImage} />
              </TouchableOpacity>

              <View style={styles.reactionActions}>
                <View style={styles.reactionLeft}>
                  <TouchableOpacity onPress={() => toggleReaction(item._id, 'like')} style={styles.reactionIconBtn}>
                    <Ionicons name={reactions.liked ? 'heart' : 'heart-outline'} size={23} color={reactions.liked ? '#ef4444' : colors.text} />
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => toggleReaction(item._id, 'applaud')} style={styles.reactionIconBtn}>
                    <Ionicons name={reactions.applauded ? 'sparkles' : 'sparkles-outline'} size={21} color={reactions.applauded ? colors.primary : colors.text} />
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => Alert.alert('Coming soon', 'Event discussions will be available soon.')} style={styles.reactionIconBtn}>
                    <Ionicons name="chatbubble-outline" size={21} color={colors.text} />
                  </TouchableOpacity>
                </View>
                <TouchableOpacity onPress={() => onToggleSaved(item)}>
                  <Ionicons name={reactions.saved ? 'bookmark' : 'bookmark-outline'} size={22} color={reactions.saved ? colors.primary : colors.text} />
                </TouchableOpacity>
              </View>

              <Text style={[styles.reactionCount, { color: colors.text }]}>
                {reactions.likes} likes | {reactions.applauds} applauds
              </Text>

              <TouchableOpacity onPress={() => router.push({ pathname: '/event/[id]', params: { id: item._id } })} activeOpacity={0.85}>
                <Text style={[styles.postTitle, { color: colors.text }]}>{item.title}</Text>
              </TouchableOpacity>
              <Text style={[styles.postCaption, { color: colors.textSecondary }]}>{item.description}</Text>

              <View style={styles.postMetaRow}>
                <View style={[styles.metaChip, { backgroundColor: colors.background, borderColor: colors.border }]}>
                  <Ionicons name="location-outline" size={14} color={colors.primary} />
                  <Text style={[styles.metaChipText, { color: colors.text }]}>{item.locationName || 'Campus'}</Text>
                </View>
                {item.startAt ? (
                  <View style={[styles.metaChip, { backgroundColor: colors.background, borderColor: colors.border }]}>
                    <Ionicons name="time-outline" size={14} color={colors.primary} />
                    <Text style={[styles.metaChipText, { color: colors.text }]}>{new Date(item.startAt).toLocaleString()}</Text>
                  </View>
                ) : null}
              </View>

              <View style={styles.ctaRow}>
                <TouchableOpacity style={[styles.ctaBtn, { backgroundColor: item.isRegistered ? '#1d4ed8' : colors.primary }]} onPress={() => toggleRegistration(item)}>
                  <Text style={styles.ctaBtnText}>{item.isRegistered ? 'Registered' : 'Register now'}</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.secondaryBtn, { backgroundColor: colors.background, borderColor: colors.border }]}
                  onPress={() => {
                    if (!item.mapUrl) {
                      Alert.alert('Map unavailable', 'No map URL for this event');
                      return;
                    }
                    Linking.openURL(item.mapUrl);
                  }}>
                  <Text style={[styles.secondaryBtnText, { color: colors.text }]}>Open map</Text>
                </TouchableOpacity>
              </View>

              {isTeacher && (String(item.createdBy?._id || item.createdBy) === String(user?._id)) ? (
                <View style={styles.teacherActionsRow}>
                  <TouchableOpacity onPress={() => onEditEvent(item)} style={[styles.outlineBtn, { borderColor: colors.border }]}>
                    <Text style={{ color: colors.text, fontWeight: '700' }}>Edit</Text>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => onDeleteEvent(item._id)} style={[styles.outlineBtn, { borderColor: '#ef4444' }]}>
                    <Text style={{ color: '#ef4444', fontWeight: '700' }}>Delete</Text>
                  </TouchableOpacity>
                  {item.visibilityScope !== 'all' || item.approvalStatus !== 'approved' ? (
                    <TouchableOpacity
                      onPress={() => onRequestGlobal(item._id)}
                      disabled={item.approvalStatus === 'pending'}
                      style={[styles.outlineBtn, { borderColor: item.approvalStatus === 'pending' ? colors.border : colors.primary }]}>
                      <Text style={{ color: item.approvalStatus === 'pending' ? colors.textSecondary : colors.primary, fontWeight: '700' }}>
                        {item.approvalStatus === 'pending' ? 'Pending Admin' : 'Request All Dept'}
                      </Text>
                    </TouchableOpacity>
                  ) : null}
                </View>
              ) : null}
            </View>
          );
        }}
      />

      <Modal
        visible={showCreateModal}
        transparent
        animationType="slide"
        onRequestClose={() => {
          setShowCreateModal(false);
          setShowDateTimePicker(false);
        }}>
        <KeyboardAvoidingView
          style={styles.modalOverlay}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 24 : 0}
        >
          <View style={[styles.modalCard, { backgroundColor: colors.background, borderColor: colors.border }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>{editingEventId ? 'Edit Event' : 'Create Event'}</Text>
              <TouchableOpacity
                onPress={() => {
                  setShowCreateModal(false);
                  setShowDateTimePicker(false);
                }}>
                <Ionicons name="close" size={22} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>

            <ScrollView
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
              contentContainerStyle={styles.modalScrollContent}
            >
              {Object.keys(formErrors).length > 0 ? (
                <View style={[styles.warningBox, { backgroundColor: colors.errorBg, borderColor: colors.error }]}>
                  <Ionicons name="warning-outline" size={16} color={colors.error} />
                  <Text style={[styles.warningText, { color: colors.error }]}>Please fix highlighted fields before publishing.</Text>
                </View>
              ) : null}

              <TextInput
                placeholder="Event title"
                placeholderTextColor={colors.textSecondary}
                value={eventForm.title}
                onChangeText={(value) => {
                  setEventForm({ ...eventForm, title: value });
                  if (formErrors.title) setFormErrors((prev) => ({ ...prev, title: '' }));
                }}
                style={[styles.input, { borderColor: formErrors.title ? colors.error : colors.border, color: colors.text }]}
              />
              {renderFieldError('title')}

              <TextInput
                placeholder="Describe the event"
                placeholderTextColor={colors.textSecondary}
                value={eventForm.description}
                onChangeText={(value) => {
                  setEventForm({ ...eventForm, description: value });
                  if (formErrors.description) setFormErrors((prev) => ({ ...prev, description: '' }));
                }}
                style={[styles.input, styles.textarea, { borderColor: formErrors.description ? colors.error : colors.border, color: colors.text }]}
                multiline
              />
              {renderFieldError('description')}

              <TextInput
                placeholder="Venue"
                placeholderTextColor={colors.textSecondary}
                value={eventForm.locationName}
                onChangeText={(value) => {
                  setEventForm({ ...eventForm, locationName: value });
                  if (formErrors.locationName) setFormErrors((prev) => ({ ...prev, locationName: '' }));
                }}
                style={[styles.input, { borderColor: formErrors.locationName ? colors.error : colors.border, color: colors.text }]}
              />
              {renderFieldError('locationName')}

              <View style={styles.dateTimeRow}>
                <TouchableOpacity onPress={openDatePicker} style={[styles.dateTimeBtn, { borderColor: formErrors.startAt ? colors.error : colors.border, backgroundColor: colors.surface }]}>
                  <Ionicons name="calendar-outline" size={16} color={colors.primary} />
                  <Text style={[styles.dateTimeBtnText, { color: colors.text }]}>Select Date</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={openTimePicker} style={[styles.dateTimeBtn, { borderColor: formErrors.startAt ? colors.error : colors.border, backgroundColor: colors.surface }]}>
                  <Ionicons name="time-outline" size={16} color={colors.primary} />
                  <Text style={[styles.dateTimeBtnText, { color: colors.text }]}>Select Time</Text>
                </TouchableOpacity>
              </View>

              <Text style={[styles.selectedDateLabel, { color: colors.textSecondary }]}>
                {startAtDate ? `Starts: ${startAtDate.toLocaleString()}` : 'No date and time selected'}
              </Text>
              {renderFieldError('startAt')}

              {showDateTimePicker ? (
                <DateTimePicker
                  value={startAtDate || new Date()}
                  mode={pickerMode}
                  display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                  onChange={handleDateTimeChange}
                  minimumDate={new Date()}
                />
              ) : null}

              <TextInput
                placeholder="Google Maps URL"
                placeholderTextColor={colors.textSecondary}
                value={eventForm.mapUrl}
                onChangeText={(value) => {
                  setEventForm({ ...eventForm, mapUrl: value });
                  if (formErrors.mapUrl) setFormErrors((prev) => ({ ...prev, mapUrl: '' }));
                }}
                style={[styles.input, { borderColor: formErrors.mapUrl ? colors.error : colors.border, color: colors.text }]}
              />
              {renderFieldError('mapUrl')}

              <TouchableOpacity onPress={pickAndUploadPoster} style={[styles.posterUploadBtn, { borderColor: colors.border, backgroundColor: colors.surface }]} disabled={uploadingPoster}>
                <Ionicons name="image-outline" size={18} color={colors.primary} />
                <Text style={{ color: colors.text, fontWeight: '700', marginLeft: 8 }}>
                  {uploadingPoster ? 'Uploading poster...' : eventForm.flyerUrl ? 'Replace Poster' : 'Upload Poster'}
                </Text>
              </TouchableOpacity>

              {eventForm.flyerUrl ? <Image source={{ uri: eventForm.flyerUrl }} style={styles.posterPreview} /> : null}

              <TouchableOpacity style={[styles.publishBtn, { backgroundColor: colors.primary }]} disabled={creating || uploadingPoster} onPress={createEvent}>
                <Text style={styles.publishBtnText}>{creating ? 'Saving...' : editingEventId ? 'Save Changes' : 'Publish Event'}</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      <Modal visible={!!posterPreview} transparent animationType="fade" onRequestClose={() => setPosterPreview(null)}>
        <View style={styles.posterModalOverlay}>
          <TouchableOpacity style={styles.posterCloseBtn} onPress={() => setPosterPreview(null)}>
            <Ionicons name="close" size={28} color="#fff" />
          </TouchableOpacity>
          {posterPreview ? <Image source={{ uri: posterPreview }} style={styles.posterFull} resizeMode="contain" /> : null}
          {posterPreview ? (
            <TouchableOpacity style={[styles.downloadBtn, { backgroundColor: colors.primary }]} onPress={() => Linking.openURL(posterPreview)}>
              <Ionicons name="download-outline" size={18} color="#fff" />
              <Text style={styles.downloadBtnText}>Download Poster</Text>
            </TouchableOpacity>
          ) : null}
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  fixedHeader: { paddingHorizontal: 16, paddingTop: 52, paddingBottom: 14 },
  feedContent: { paddingHorizontal: 16, paddingTop: 8, paddingBottom: 26 },
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
  title: { fontSize: 34, fontWeight: '800' },
  subtitle: { fontSize: 14, lineHeight: 21, marginTop: 6 },
  plusBtn: { width: 46, height: 46, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  emptyText: { textAlign: 'center', marginTop: 24, fontSize: 14 },
  postCard: {
    borderWidth: 1,
    borderRadius: 26,
    padding: 14,
    marginBottom: 16,
  },
  postHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12, gap: 12 },
  authorRow: { flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 },
  avatar: { width: 42, height: 42, borderRadius: 21 },
  authorName: { fontSize: 15, fontWeight: '800' },
  authorMeta: { fontSize: 12, marginTop: 3 },
  postImage: { width: '100%', height: 290, borderRadius: 20, marginBottom: 12 },
  reactionActions: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 },
  reactionLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  reactionIconBtn: { paddingVertical: 2 },
  reactionCount: { fontSize: 13, fontWeight: '700', marginBottom: 8 },
  postTitle: { fontSize: 22, fontWeight: '800', marginBottom: 6 },
  postCaption: { fontSize: 14, lineHeight: 21, marginBottom: 12 },
  postMetaRow: { gap: 8, marginBottom: 14 },
  metaChip: {
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 9,
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
  },
  metaChipText: { fontSize: 12, fontWeight: '700', marginLeft: 8 },
  ctaRow: { flexDirection: 'row', gap: 10 },
  ctaBtn: {
    flex: 1,
    borderRadius: 16,
    paddingVertical: 14,
    alignItems: 'center',
  },
  ctaBtnText: { color: '#fff', fontWeight: '800', fontSize: 14 },
  secondaryBtn: {
    flex: 1,
    borderRadius: 16,
    borderWidth: 1,
    paddingVertical: 14,
    alignItems: 'center',
  },
  secondaryBtnText: { fontWeight: '800', fontSize: 14 },
  teacherActionsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 14 },
  outlineBtn: { borderWidth: 1, borderRadius: 12, paddingHorizontal: 12, paddingVertical: 9 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.42)', justifyContent: 'flex-end' },
  modalCard: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderWidth: 1,
    borderBottomWidth: 0,
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 20,
    maxHeight: '84%',
  },
  modalHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 },
  modalTitle: { fontSize: 22, fontWeight: '800' },
  modalScrollContent: { paddingBottom: 12 },
  warningBox: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 9,
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  warningText: { fontSize: 12, fontWeight: '700', flex: 1 },
  input: { borderWidth: 1, borderRadius: 14, paddingHorizontal: 12, paddingVertical: 11, marginBottom: 8, fontSize: 15 },
  textarea: { minHeight: 100, textAlignVertical: 'top' },
  errorText: { color: '#ef4444', fontSize: 12, marginTop: -2, marginBottom: 8, marginLeft: 2 },
  dateTimeRow: { flexDirection: 'row', gap: 8, marginBottom: 8 },
  dateTimeBtn: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  dateTimeBtnText: { fontSize: 13, fontWeight: '700' },
  selectedDateLabel: { fontSize: 13, marginBottom: 8 },
  posterUploadBtn: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  posterPreview: { width: '100%', height: 220, borderRadius: 14, marginTop: 10 },
  publishBtn: { borderRadius: 14, paddingVertical: 14, alignItems: 'center', marginTop: 14 },
  publishBtnText: { color: '#fff', fontWeight: '800', fontSize: 15 },
  posterModalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.96)', alignItems: 'center', justifyContent: 'center' },
  posterCloseBtn: { position: 'absolute', top: 56, right: 22, zIndex: 10 },
  posterFull: { width: '100%', height: '85%' },
  downloadBtn: {
    position: 'absolute',
    bottom: 34,
    minHeight: 48,
    paddingHorizontal: 18,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  downloadBtnText: { color: '#fff', fontSize: 14, fontWeight: '800' },
});
