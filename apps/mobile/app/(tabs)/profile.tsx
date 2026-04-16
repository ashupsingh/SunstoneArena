import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Switch, Image, ActivityIndicator, Alert, Modal } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { apiClient } from '../../config/api';
import { useRouter } from 'expo-router';
import { getSavedEventIds } from '../../lib/savedEvents';

export default function ProfileScreen() {
  const { user, signOut, updateUser } = useAuth();
  const { theme, toggleTheme, colors } = useTheme();
  const router = useRouter();
  const [uploadingPhoto, setUploadingPhoto] = React.useState(false);
  const [registeredEvents, setRegisteredEvents] = React.useState<any[]>([]);
  const [savedEventIds, setSavedEventIds] = React.useState<string[]>([]);
  const [notificationsEnabled, setNotificationsEnabled] = React.useState(true);
  const [compactModeEnabled, setCompactModeEnabled] = React.useState(false);
  const [showAvatarModal, setShowAvatarModal] = React.useState(false);
  const departmentLabel = user?.departmentName || (typeof user?.department === 'object' ? user?.department?.name : undefined);
  const isDark = theme === 'dark';

  const loadProfileData = React.useCallback(async () => {
    try {
      const [eventResponse, saved] = await Promise.all([
        apiClient.get('/events/registered/mine').catch(() => ({ data: [] })),
        getSavedEventIds(user?._id),
      ]);
      setRegisteredEvents(Array.isArray(eventResponse.data) ? eventResponse.data : []);
      setSavedEventIds(saved);
    } catch (_error) {
      setRegisteredEvents([]);
      setSavedEventIds([]);
    }
  }, [user?._id]);

  useFocusEffect(
    React.useCallback(() => {
      loadProfileData();
    }, [loadProfileData])
  );

  const pickAndUploadPhoto = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Permission required', 'Please allow photo library access to upload profile image.');
      return;
    }

    const imageMediaType =
      (ImagePicker as any).MediaType?.Images ??
      (ImagePicker as any).MediaTypeOptions?.Images;

    if (!imageMediaType) {
      Alert.alert('Unsupported version', 'Image picker media type is not available in this app build.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: imageMediaType,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.85,
    });

    if (result.canceled || !result.assets[0]?.uri) return;

    setUploadingPhoto(true);
    try {
      const asset = result.assets[0];
      const formData = new FormData();
      formData.append('image', {
        uri: asset.uri,
        name: `profile-${Date.now()}.jpg`,
        type: asset.mimeType || 'image/jpeg',
      } as any);

      const response = await apiClient.post('/auth/profile-photo', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      await updateUser({ profilePicture: response.data.profilePicture });
      setShowAvatarModal(false);
      Alert.alert('Success', 'Profile photo updated successfully.');
    } catch (error: any) {
      Alert.alert('Upload failed', error?.response?.data?.message || 'Could not upload profile image right now.');
    } finally {
      setUploadingPhoto(false);
    }
  };

  const removeAvatar = async () => {
    await updateUser({ profilePicture: '' });
    setShowAvatarModal(false);
    Alert.alert('Updated', 'Avatar removed from this device.');
  };

  const unregisterFromEvent = async (eventId: string) => {
    try {
      await apiClient.delete(`/events/${eventId}/register`);
      await loadProfileData();
      Alert.alert('Updated', 'Event removed from your registrations.');
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.message || 'Unable to remove event.');
    }
  };

  const openEvent = (eventId: string) => {
    router.push({ pathname: '/event/[id]', params: { id: eventId } });
  };

  return (
    <>
      <ScrollView style={[styles.container, { backgroundColor: colors.background }]} contentContainerStyle={styles.contentContainer}>
        <View style={styles.header}>
          <TouchableOpacity
            disabled={uploadingPhoto}
            onPress={() => setShowAvatarModal(true)}
            style={[styles.avatarPlaceholder, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            {user?.profilePicture ? (
              <Image source={{ uri: user.profilePicture }} style={styles.avatarImage} />
            ) : (
              <Text style={[styles.avatarText, { color: colors.primary }]}>{user?.name?.charAt(0) || 'U'}</Text>
            )}
            {uploadingPhoto ? (
              <View style={styles.avatarOverlay}>
                <ActivityIndicator color="#fff" />
              </View>
            ) : null}
          </TouchableOpacity>
          <View style={styles.avatarToolsRow}>
            <TouchableOpacity
              disabled={uploadingPhoto}
              onPress={pickAndUploadPhoto}
              style={[styles.avatarToolBtn, { backgroundColor: colors.primaryBg, borderColor: colors.border }]}>
              <Ionicons name="camera-outline" size={16} color={colors.primary} />
            </TouchableOpacity>
            <TouchableOpacity
              disabled={!user?.profilePicture}
              onPress={removeAvatar}
              style={[
                styles.avatarToolBtn,
                {
                  backgroundColor: colors.surface,
                  borderColor: colors.border,
                  opacity: user?.profilePicture ? 1 : 0.45,
                },
              ]}>
              <Ionicons name="trash-outline" size={16} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>
          <Text style={[styles.name, { color: colors.text }]}>{user?.name}</Text>
          <Text style={[styles.email, { color: colors.textSecondary }]}>{user?.email}</Text>
          <Text style={[styles.photoHint, { color: colors.textSecondary }]}>Tap avatar to preview full photo</Text>
          <View style={[styles.roleBadge, { backgroundColor: colors.primaryBg, borderColor: colors.border }]}>
            <Ionicons name="shield-checkmark-outline" size={14} color={colors.primary} />
            <Text style={[styles.roleBadgeText, { color: colors.primary }]}>{String(user?.role || 'user').toUpperCase()}</Text>
          </View>
        </View>

        <View style={[styles.identityCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={styles.identityItem}>
            <Text style={[styles.identityLabel, { color: colors.textSecondary }]}>Department</Text>
            <Text style={[styles.identityValue, { color: colors.text }]}>{departmentLabel || 'Not selected'}</Text>
          </View>
          <View style={[styles.identityDivider, { backgroundColor: colors.border }]} />
          <View style={styles.identityItem}>
            <Text style={[styles.identityLabel, { color: colors.textSecondary }]}>Enrollment</Text>
            <Text style={[styles.identityValue, { color: colors.text }]}>{user?.enrollmentNumber || '-'}</Text>
          </View>
          <View style={[styles.identityDivider, { backgroundColor: colors.border }]} />
          <View style={styles.identityItem}>
            <Text style={[styles.identityLabel, { color: colors.textSecondary }]}>Saved</Text>
            <Text style={[styles.identityValue, { color: colors.text }]}>{savedEventIds.length}</Text>
          </View>
        </View>

        <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>Quick Access</Text>
        <View style={[styles.section, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <TouchableOpacity style={styles.actionRow} onPress={() => router.push('/leadership')}>
            <View style={styles.actionTitleWrap}>
              <Ionicons name="briefcase-outline" size={18} color={colors.primary} style={styles.rowIcon} />
              <Text style={[styles.infoLabel, { color: colors.text }]}>Leadership Desk</Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color={colors.textSecondary} />
          </TouchableOpacity>

          <TouchableOpacity style={[styles.actionRow, styles.rowDivider, { borderTopColor: colors.border }]} onPress={() => router.push('/saved-events')}>
            <View style={styles.actionTitleWrap}>
              <Ionicons name="bookmark-outline" size={18} color={colors.primary} style={styles.rowIcon} />
              <Text style={[styles.infoLabel, { color: colors.text }]}>Saved Events</Text>
            </View>
            <View style={styles.actionRightWrap}>
              <Text style={[styles.actionCount, { color: colors.textSecondary }]}>{savedEventIds.length}</Text>
              <Ionicons name="chevron-forward" size={16} color={colors.textSecondary} />
            </View>
          </TouchableOpacity>
        </View>

        <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>Account Details</Text>
        <View style={[styles.section, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={styles.infoRow}>
            <View style={styles.infoTitleContainer}>
              <Ionicons name="person-circle-outline" size={20} color={colors.textSecondary} style={styles.rowIcon} />
              <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>Role</Text>
            </View>
            <Text style={[styles.infoValue, { color: colors.text }]}>{user?.role}</Text>
          </View>
          {user?.enrollmentNumber ? (
            <View style={[styles.infoRow, styles.rowDivider, { borderTopColor: colors.border }]}>
              <View style={styles.infoTitleContainer}>
                <Ionicons name="id-card-outline" size={20} color={colors.textSecondary} style={styles.rowIcon} />
                <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>Enrollment No.</Text>
              </View>
              <Text style={[styles.infoValue, { color: colors.text }]}>{user.enrollmentNumber}</Text>
            </View>
          ) : null}
          {departmentLabel ? (
            <View style={[styles.infoRow, styles.rowDivider, { borderTopColor: colors.border }]}>
              <View style={styles.infoTitleContainer}>
                <Ionicons name="school-outline" size={20} color={colors.textSecondary} style={styles.rowIcon} />
                <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>Department</Text>
              </View>
              <Text style={[styles.infoValue, { color: colors.text }]}>{departmentLabel}</Text>
            </View>
          ) : null}
        </View>

        <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>Preferences</Text>
        <View style={[styles.section, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={styles.infoRow}>
            <View style={styles.infoTitleContainer}>
              <Ionicons name={isDark ? 'moon-outline' : 'sunny-outline'} size={20} color={colors.textSecondary} style={styles.rowIcon} />
              <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>Dark Theme</Text>
            </View>
            <Switch
              value={isDark}
              onValueChange={toggleTheme}
              trackColor={{ false: colors.border, true: colors.primary }}
              thumbColor="#ffffff"
            />
          </View>

          <View style={[styles.infoRow, styles.rowDivider, { borderTopColor: colors.border }]}>
            <View style={styles.infoTitleContainer}>
              <Ionicons name="notifications-outline" size={20} color={colors.textSecondary} style={styles.rowIcon} />
              <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>In-App Alerts</Text>
            </View>
            <Switch
              value={notificationsEnabled}
              onValueChange={setNotificationsEnabled}
              trackColor={{ false: colors.border, true: colors.primary }}
              thumbColor="#ffffff"
            />
          </View>

          <View style={[styles.infoRow, styles.rowDivider, { borderTopColor: colors.border }]}>
            <View style={styles.infoTitleContainer}>
              <Ionicons name="grid-outline" size={20} color={colors.textSecondary} style={styles.rowIcon} />
              <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>Compact Mode</Text>
            </View>
            <Switch
              value={compactModeEnabled}
              onValueChange={setCompactModeEnabled}
              trackColor={{ false: colors.border, true: colors.primary }}
              thumbColor="#ffffff"
            />
          </View>
        </View>

        <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>Support & Security</Text>
        <View style={[styles.section, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <TouchableOpacity style={styles.actionRow} onPress={() => router.push('/help-support')}>
            <View style={styles.actionTitleWrap}>
              <Ionicons name="help-circle-outline" size={18} color={colors.primary} style={styles.rowIcon} />
              <Text style={[styles.infoLabel, { color: colors.text }]}>Help & Support</Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color={colors.textSecondary} />
          </TouchableOpacity>

          <TouchableOpacity style={[styles.actionRow, styles.rowDivider, { borderTopColor: colors.border }]} onPress={() => router.push('/privacy-data')}>
            <View style={styles.actionTitleWrap}>
              <Ionicons name="lock-closed-outline" size={18} color={colors.primary} style={styles.rowIcon} />
              <Text style={[styles.infoLabel, { color: colors.text }]}>Privacy & Data</Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color={colors.textSecondary} />
          </TouchableOpacity>

          <View style={[styles.actionRow, styles.rowDivider, { borderTopColor: colors.border }]}>
            <View style={styles.actionTitleWrap}>
              <Ionicons name="information-circle-outline" size={18} color={colors.primary} style={styles.rowIcon} />
              <Text style={[styles.infoLabel, { color: colors.text }]}>App Version</Text>
            </View>
            <Text style={[styles.actionCount, { color: colors.textSecondary }]}>v2.0.0</Text>
          </View>
        </View>

        <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>Registered Events</Text>
        <View style={[styles.section, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          {registeredEvents.length === 0 ? (
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>No event registrations yet.</Text>
          ) : (
            registeredEvents.slice(0, 10).map((event: any) => (
              <View key={event._id} style={styles.listItem}>
                <View style={styles.savedCardTop}>
                  <TouchableOpacity style={styles.itemContent} onPress={() => openEvent(event._id)}>
                    <Text style={[styles.listTitle, { color: colors.text }]}>{event.title}</Text>
                    <Text style={[styles.listMeta, { color: colors.textSecondary }]}>{event.locationName}</Text>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => unregisterFromEvent(event._id)} style={[styles.unregisterBtn, { borderColor: colors.border, backgroundColor: colors.background }]}>
                    <Ionicons name="trash-outline" size={16} color={colors.textSecondary} />
                  </TouchableOpacity>
                </View>
              </View>
            ))
          )}
        </View>

        <TouchableOpacity style={[styles.logoutButton, { backgroundColor: colors.surface, borderColor: colors.border }]} onPress={signOut}>
          <View style={[styles.logoutIconWrap, { backgroundColor: colors.errorBg, borderColor: colors.error }]}>
            <Ionicons name="log-out-outline" size={16} color={colors.error} />
          </View>
          <View style={styles.logoutTextWrap}>
            <Text style={[styles.logoutButtonText, { color: colors.text }]}>Log Out</Text>
            <Text style={[styles.logoutSubText, { color: colors.textSecondary }]}>Sign out from this device</Text>
          </View>
          <Ionicons name="chevron-forward" size={16} color={colors.textSecondary} />
        </TouchableOpacity>

        <View style={[styles.footerCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[styles.footerTitle, { color: colors.text }]}>Made with love ❤️ by SyntaxError Team</Text>
          <Text style={[styles.footerSubtext, { color: colors.textSecondary }]}>Version 2.0 brings saved events, cleaner profile tools and a sharper campus experience.</Text>
        </View>
      </ScrollView>

      <Modal visible={showAvatarModal} transparent animationType="fade" onRequestClose={() => setShowAvatarModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.avatarModalCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={styles.avatarModalHeader}>
              <Text style={[styles.avatarModalTitle, { color: colors.text }]}>Profile photo</Text>
              <TouchableOpacity onPress={() => setShowAvatarModal(false)}>
                <Ionicons name="close" size={22} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>

            <View style={[styles.avatarPreviewWrap, { backgroundColor: colors.background, borderColor: colors.border }]}>
              {user?.profilePicture ? (
                <Image source={{ uri: user.profilePicture }} style={styles.avatarPreviewImage} />
              ) : (
                <View style={[styles.avatarFallbackPreview, { backgroundColor: colors.primaryBg }]}>
                  <Text style={[styles.avatarPreviewLetter, { color: colors.primary }]}>{user?.name?.charAt(0) || 'U'}</Text>
                </View>
              )}
            </View>

            <View style={styles.avatarActionStack}>
              <TouchableOpacity onPress={pickAndUploadPhoto} disabled={uploadingPhoto} style={[styles.avatarActionBtn, { backgroundColor: colors.primary }]}>
                <Ionicons name="image-outline" size={18} color="#fff" />
                <Text style={styles.avatarActionText}>{uploadingPhoto ? 'Uploading...' : user?.profilePicture ? 'Change Avatar' : 'Add Avatar'}</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={removeAvatar}
                disabled={!user?.profilePicture}
                style={[
                  styles.avatarSecondaryBtn,
                  {
                    backgroundColor: colors.background,
                    borderColor: colors.border,
                    opacity: user?.profilePicture ? 1 : 0.5,
                  },
                ]}>
                <Ionicons name="trash-outline" size={18} color={colors.textSecondary} />
                <Text style={[styles.avatarSecondaryText, { color: colors.textSecondary }]}>Remove Avatar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 24, paddingTop: 60 },
  contentContainer: { paddingBottom: 88 },
  header: { alignItems: 'center', marginBottom: 34 },
  avatarPlaceholder: {
    width: 104,
    height: 104,
    borderRadius: 52,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    borderWidth: 1,
    overflow: 'hidden',
  },
  avatarImage: { width: '100%', height: '100%' },
  avatarText: { fontSize: 38, fontWeight: '700' },
  avatarOverlay: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.4)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarToolsRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 12,
  },
  avatarToolBtn: {
    width: 40,
    height: 40,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  name: { fontSize: 24, fontWeight: '800', marginBottom: 4 },
  email: { fontSize: 15 },
  photoHint: { fontSize: 12, marginTop: 8 },
  roleBadge: {
    marginTop: 10,
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  roleBadgeText: { fontSize: 11, fontWeight: '800', letterSpacing: 0.6 },
  identityCard: {
    borderWidth: 1,
    borderRadius: 16,
    marginBottom: 26,
    paddingVertical: 14,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  identityItem: { flex: 1, alignItems: 'center' },
  identityLabel: { fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.8 },
  identityValue: { fontSize: 14, fontWeight: '800', marginTop: 6, textAlign: 'center' },
  identityDivider: { width: 1, alignSelf: 'stretch' },
  sectionTitle: { fontSize: 13, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8, marginLeft: 4 },
  section: {
    borderRadius: 16,
    paddingHorizontal: 20,
    marginBottom: 28,
    borderWidth: 1,
  },
  infoRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 16 },
  infoTitleContainer: { flexDirection: 'row', alignItems: 'center' },
  infoLabel: { fontSize: 15, fontWeight: '500' },
  infoValue: { fontSize: 15, fontWeight: '600', textTransform: 'capitalize' },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 15,
  },
  rowDivider: { borderTopWidth: 1 },
  rowIcon: { marginRight: 8 },
  actionTitleWrap: { flexDirection: 'row', alignItems: 'center' },
  actionRightWrap: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  actionCount: { fontSize: 13, fontWeight: '600' },
  listItem: { paddingVertical: 12, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: '#334155' },
  savedCardTop: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  itemContent: { flex: 1 },
  listTitle: { fontSize: 15, fontWeight: '700', marginBottom: 4 },
  listMeta: { fontSize: 13 },
  emptyText: { fontSize: 14, lineHeight: 20, paddingVertical: 8 },
  unregisterBtn: {
    width: 38,
    height: 38,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  footerCard: {
    borderWidth: 1,
    borderRadius: 18,
    padding: 18,
    marginBottom: 8,
  },
  footerTitle: { fontSize: 15, fontWeight: '800', marginBottom: 6, textAlign: 'center' },
  footerSubtext: { fontSize: 13, lineHeight: 20, textAlign: 'center' },
  logoutButton: {
    minHeight: 64,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'space-between',
    flexDirection: 'row',
    paddingHorizontal: 14,
    marginBottom: 14,
  },
  logoutIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  logoutTextWrap: { flex: 1, marginLeft: 10 },
  logoutButtonText: { fontSize: 16, fontWeight: '700' },
  logoutSubText: { fontSize: 12, marginTop: 2 },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(2,6,23,0.72)',
    justifyContent: 'center',
    padding: 24,
  },
  avatarModalCard: {
    borderWidth: 1,
    borderRadius: 28,
    padding: 20,
  },
  avatarModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 18,
  },
  avatarModalTitle: { fontSize: 22, fontWeight: '800' },
  avatarPreviewWrap: {
    borderWidth: 1,
    borderRadius: 24,
    padding: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 18,
  },
  avatarPreviewImage: {
    width: 220,
    height: 220,
    borderRadius: 110,
  },
  avatarFallbackPreview: {
    width: 220,
    height: 220,
    borderRadius: 110,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarPreviewLetter: { fontSize: 80, fontWeight: '800' },
  avatarActionStack: { gap: 12 },
  avatarActionBtn: {
    minHeight: 52,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  avatarSecondaryBtn: {
    minHeight: 52,
    borderRadius: 18,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  avatarActionText: { color: '#fff', fontSize: 15, fontWeight: '800' },
  avatarSecondaryText: { fontSize: 15, fontWeight: '700' },
});
