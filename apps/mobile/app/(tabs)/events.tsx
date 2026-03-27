import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, FlatList, TouchableOpacity, Image, Alert, TextInput, Modal, ScrollView, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import { apiClient } from '../../config/api';
import * as Linking from 'expo-linking';
import * as ImagePicker from 'expo-image-picker';
import { useAuth } from '../../context/AuthContext';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';

export default function EventsScreen() {
  const { colors } = useTheme();
  const { user } = useAuth();
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

  const fetchEvents = async () => {
    try {
      const { data } = await apiClient.get('/events');
      setEvents(Array.isArray(data) ? data : []);
    } catch (_error) {
      setEvents([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, []);

  const register = async (eventId: string) => {
    try {
      await apiClient.post(`/events/${eventId}/register`);
      Alert.alert('Success', 'Registered for event');
      fetchEvents();
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.message || 'Registration failed');
    }
  };

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

  if (loading) {
    return (
      <View style={[styles.centered, { backgroundColor: colors.background }]}> 
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}> 
      <View style={styles.headerRow}>
        <View style={{ flex: 1 }}>
          <Text style={[styles.title, { color: colors.text }]}>Events</Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>Explore campus events and register instantly.</Text>
        </View>
        {isTeacher ? (
          <TouchableOpacity
            onPress={() => {
              resetEventForm();
              setShowCreateModal(true);
            }}
            style={[styles.plusBtn, { backgroundColor: colors.primary }]}
          >
            <Ionicons name="add" size={24} color="#fff" />
          </TouchableOpacity>
        ) : null}
      </View>

      {!isTeacher ? (
        <View style={[styles.infoStrip, { backgroundColor: colors.primaryBg, borderColor: colors.border }]}> 
          <Ionicons name="information-circle-outline" size={18} color={colors.primary} />
          <Text style={[styles.infoText, { color: colors.text }]}>Events are posted by teachers and admin. You can register or unregister from available events below.</Text>
        </View>
      ) : null}

      <FlatList
        data={events}
        keyExtractor={(item) => item._id}
        refreshing={refreshing}
        onRefresh={() => {
          setRefreshing(true);
          fetchEvents();
        }}
        contentContainerStyle={{ paddingBottom: 30 }}
        ListEmptyComponent={<Text style={[styles.emptyText, { color: colors.textSecondary }]}>No upcoming events yet.</Text>}
        renderItem={({ item }) => (
          <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}> 
            {item.flyerUrl ? (
              <TouchableOpacity activeOpacity={0.9} onPress={() => setPosterPreview(item.flyerUrl)}>
                <Image source={{ uri: item.flyerUrl }} style={styles.flyer} />
              </TouchableOpacity>
            ) : null}
            <Text style={[styles.eventTitle, { color: colors.text }]}>{item.title}</Text>
            <Text style={{ color: colors.textSecondary, marginBottom: 8 }}>{item.description}</Text>
            <Text style={{ color: colors.textSecondary, marginBottom: 12 }}>Location: {item.locationName}</Text>

            {item.startAt ? (
              <Text style={{ color: colors.textSecondary, marginBottom: 12 }}>
                Starts: {new Date(item.startAt).toLocaleString()}
              </Text>
            ) : null}

            <View style={styles.actionsRow}>
              <TouchableOpacity style={[styles.btn, { backgroundColor: item.isRegistered ? '#2563eb' : colors.primary }]} onPress={() => toggleRegistration(item)}>
                <Text style={styles.btnText}>{item.isRegistered ? 'Unregister' : 'Register'}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.btn, { backgroundColor: colors.border }]}
                onPress={() => {
                  if (!item.mapUrl) {
                    Alert.alert('Map unavailable', 'No map URL for this event');
                    return;
                  }
                  Linking.openURL(item.mapUrl);
                }}
              >
                <Text style={[styles.btnText, { color: colors.text }]}>Open Map</Text>
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
                    style={[
                      styles.outlineBtn,
                      { borderColor: item.approvalStatus === 'pending' ? colors.border : colors.primary },
                    ]}
                  >
                    <Text style={{ color: item.approvalStatus === 'pending' ? colors.textSecondary : colors.primary, fontWeight: '700' }}>
                      {item.approvalStatus === 'pending' ? 'Pending Admin' : 'Request All Dept'}
                    </Text>
                  </TouchableOpacity>
                ) : null}
              </View>
            ) : null}
          </View>
        )}
      />

      <Modal
        visible={showCreateModal}
        transparent
        animationType="slide"
        onRequestClose={() => {
          setShowCreateModal(false);
          setShowDateTimePicker(false);
        }}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalCard, { backgroundColor: colors.background, borderColor: colors.border }]}> 
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>{editingEventId ? 'Edit Event' : 'Create Event'}</Text>
              <TouchableOpacity onPress={() => {
                setShowCreateModal(false);
                setShowDateTimePicker(false);
              }}>
                <Ionicons name="close" size={22} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
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
                onChangeText={(v) => {
                  setEventForm({ ...eventForm, title: v });
                  if (formErrors.title) setFormErrors((prev) => ({ ...prev, title: '' }));
                }}
                style={[styles.input, { borderColor: formErrors.title ? colors.error : colors.border, color: colors.text }]}
              />
              {renderFieldError('title')}

              <TextInput
                placeholder="Describe the event"
                placeholderTextColor={colors.textSecondary}
                value={eventForm.description}
                onChangeText={(v) => {
                  setEventForm({ ...eventForm, description: v });
                  if (formErrors.description) setFormErrors((prev) => ({ ...prev, description: '' }));
                }}
                style={[styles.input, { borderColor: formErrors.description ? colors.error : colors.border, color: colors.text }]}
                multiline
              />
              {renderFieldError('description')}

              <TextInput
                placeholder="Venue (e.g. K Block Auditorium)"
                placeholderTextColor={colors.textSecondary}
                value={eventForm.locationName}
                onChangeText={(v) => {
                  setEventForm({ ...eventForm, locationName: v });
                  if (formErrors.locationName) setFormErrors((prev) => ({ ...prev, locationName: '' }));
                }}
                style={[styles.input, { borderColor: formErrors.locationName ? colors.error : colors.border, color: colors.text }]}
              />
              {renderFieldError('locationName')}

              <View style={styles.dateTimeRow}>
                <TouchableOpacity
                  onPress={openDatePicker}
                  style={[styles.dateTimeBtn, { borderColor: formErrors.startAt ? colors.error : colors.border, backgroundColor: colors.surface }]}
                >
                  <Ionicons name="calendar-outline" size={16} color={colors.primary} />
                  <Text style={[styles.dateTimeBtnText, { color: colors.text }]}>Select Date</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={openTimePicker}
                  style={[styles.dateTimeBtn, { borderColor: formErrors.startAt ? colors.error : colors.border, backgroundColor: colors.surface }]}
                >
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
                placeholder="Google Maps URL (optional)"
                placeholderTextColor={colors.textSecondary}
                value={eventForm.mapUrl}
                onChangeText={(v) => {
                  setEventForm({ ...eventForm, mapUrl: v });
                  if (formErrors.mapUrl) setFormErrors((prev) => ({ ...prev, mapUrl: '' }));
                }}
                style={[styles.input, { borderColor: formErrors.mapUrl ? colors.error : colors.border, color: colors.text }]}
              />
              {renderFieldError('mapUrl')}

              <TouchableOpacity
                onPress={pickAndUploadPoster}
                style={[styles.posterUploadBtn, { borderColor: colors.border, backgroundColor: colors.surface }]}
                disabled={uploadingPoster}
              >
                <Ionicons name="image-outline" size={18} color={colors.primary} />
                <Text style={{ color: colors.text, fontWeight: '700', marginLeft: 8 }}>
                  {uploadingPoster ? 'Uploading poster...' : eventForm.flyerUrl ? 'Replace Poster' : 'Upload Poster'}
                </Text>
              </TouchableOpacity>

              {eventForm.flyerUrl ? <Image source={{ uri: eventForm.flyerUrl }} style={styles.posterPreview} /> : null}

              <TouchableOpacity style={[styles.btn, { backgroundColor: colors.primary, marginTop: 14 }]} disabled={creating || uploadingPoster} onPress={createEvent}>
                <Text style={styles.btnText}>{creating ? 'Saving...' : editingEventId ? 'Save Changes' : 'Publish Event'}</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>

      <Modal visible={!!posterPreview} transparent animationType="fade" onRequestClose={() => setPosterPreview(null)}>
        <View style={styles.posterModalOverlay}>
          <TouchableOpacity style={styles.posterCloseBtn} onPress={() => setPosterPreview(null)}>
            <Ionicons name="close" size={28} color="#fff" />
          </TouchableOpacity>
          {posterPreview ? <Image source={{ uri: posterPreview }} style={styles.posterFull} resizeMode="contain" /> : null}
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingHorizontal: 18, paddingTop: 56 },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14, gap: 12 },
  plusBtn: { width: 44, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: 34, fontWeight: '800', letterSpacing: 0.2 },
  subtitle: { fontSize: 14, marginTop: 6, lineHeight: 20 },
  emptyText: { textAlign: 'center', marginTop: 24 },
  card: { borderWidth: 1, borderRadius: 16, padding: 14, marginBottom: 12 },
  infoStrip: {
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  infoText: { fontSize: 13, lineHeight: 18, flex: 1 },
  flyer: { width: '100%', height: 170, borderRadius: 12, marginBottom: 10 },
  eventTitle: { fontSize: 18, fontWeight: '700', marginBottom: 4 },
  input: { borderWidth: 1, borderRadius: 12, paddingHorizontal: 12, paddingVertical: 11, marginBottom: 8, fontSize: 15 },
  actionsRow: { flexDirection: 'row', gap: 8 },
  btn: { flex: 1, borderRadius: 12, paddingVertical: 12, alignItems: 'center' },
  btnText: { color: '#fff', fontWeight: '700' },
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
  warningBox: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 9,
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  warningText: { fontSize: 12, fontWeight: '700', flex: 1 },
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
  posterPreview: { width: '100%', height: 190, borderRadius: 12, marginTop: 10 },
  teacherActionsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 10 },
  outlineBtn: { borderWidth: 1, borderRadius: 10, paddingHorizontal: 10, paddingVertical: 8 },
  posterModalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.96)', alignItems: 'center', justifyContent: 'center' },
  posterCloseBtn: { position: 'absolute', top: 56, right: 22, zIndex: 10 },
  posterFull: { width: '100%', height: '85%' },
});
