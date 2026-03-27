import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Switch, Image, ActivityIndicator, Alert } from 'react-native';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { apiClient } from '../../config/api';
import { useRouter } from 'expo-router';

export default function ProfileScreen() {
  const { user, signOut, updateUser } = useAuth();
  const { theme, toggleTheme, colors } = useTheme();
  const router = useRouter();
  const [uploadingPhoto, setUploadingPhoto] = React.useState(false);
  const [registeredEvents, setRegisteredEvents] = React.useState<any[]>([]);
  const [notificationsEnabled, setNotificationsEnabled] = React.useState(true);
  const [compactModeEnabled, setCompactModeEnabled] = React.useState(false);
  const departmentLabel = user?.departmentName || (typeof user?.department === 'object' ? user?.department?.name : undefined);
  
  const isDark = theme === 'dark';

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
      quality: 0.8,
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
      Alert.alert('Success', 'Profile photo updated successfully.');
    } catch (error: any) {
      Alert.alert('Upload failed', error?.response?.data?.message || 'Could not upload profile image right now.');
    } finally {
      setUploadingPhoto(false);
    }
  };

  React.useEffect(() => {
    const fetchData = async () => {
      try {
        const { data: eventData } = await apiClient.get('/events/registered/mine');
        setRegisteredEvents(Array.isArray(eventData) ? eventData : []);
      } catch (_e) {
        setRegisteredEvents([]);
      }
    };

    fetchData();
  }, []);

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]} contentContainerStyle={styles.contentContainer}>
      
      {/* HEADER AVATAR SECTION */}
      <View style={styles.header}>
        <TouchableOpacity
          disabled={uploadingPhoto}
          onPress={pickAndUploadPhoto}
          style={[styles.avatarPlaceholder, { backgroundColor: colors.surface, borderColor: colors.border }]}
        >
          {user?.profilePicture ? (
            <Image source={{ uri: user.profilePicture }} style={styles.avatarImage} />
          ) : (
            <Text style={[styles.avatarText, { color: colors.primary }]}>{user?.name?.charAt(0) || 'U'}</Text>
          )}
          {uploadingPhoto ? (
            <View style={styles.avatarOverlay}>
              <ActivityIndicator color="#fff" />
            </View>
          ) : (
            <View style={[styles.cameraBadge, { backgroundColor: colors.primary }]}>
              <Ionicons name="camera" size={14} color="#fff" />
            </View>
          )}
        </TouchableOpacity>
        <Text style={[styles.name, { color: colors.text }]}>{user?.name}</Text>
        <Text style={[styles.email, { color: colors.textSecondary }]}>{user?.email}</Text>
        <Text style={[styles.photoHint, { color: colors.textSecondary }]}>Tap avatar to change photo</Text>
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
          <Text style={[styles.identityLabel, { color: colors.textSecondary }]}>Events</Text>
          <Text style={[styles.identityValue, { color: colors.text }]}>{registeredEvents.length}</Text>
        </View>
      </View>

      <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>Quick Access</Text>
      <View style={[styles.section, { backgroundColor: colors.surface, borderColor: colors.border }]}> 
        <TouchableOpacity style={styles.actionRow} onPress={() => router.push('/attendance')}>
          <View style={styles.actionTitleWrap}>
            <Ionicons name="stats-chart-outline" size={18} color={colors.primary} style={{ marginRight: 8 }} />
            <Text style={[styles.infoLabel, { color: colors.text }]}>Attendance</Text>
          </View>
          <Ionicons name="chevron-forward" size={16} color={colors.textSecondary} />
        </TouchableOpacity>

        <TouchableOpacity style={[styles.actionRow, { borderTopWidth: 1, borderTopColor: colors.border }]} onPress={() => router.push('/(tabs)/events')}>
          <View style={styles.actionTitleWrap}>
            <Ionicons name="ticket-outline" size={18} color={colors.primary} style={{ marginRight: 8 }} />
            <Text style={[styles.infoLabel, { color: colors.text }]}>Registered Events</Text>
          </View>
          <View style={styles.actionRightWrap}>
            <Text style={[styles.actionCount, { color: colors.textSecondary }]}>{registeredEvents.length}</Text>
            <Ionicons name="chevron-forward" size={16} color={colors.textSecondary} />
          </View>
        </TouchableOpacity>

        <TouchableOpacity style={[styles.actionRow, { borderTopWidth: 1, borderTopColor: colors.border }]} onPress={() => router.push('/(tabs)')}>
          <View style={styles.actionTitleWrap}>
            <Ionicons name="notifications-outline" size={18} color={colors.primary} style={{ marginRight: 8 }} />
            <Text style={[styles.infoLabel, { color: colors.text }]}>Department Notices</Text>
          </View>
          <Ionicons name="chevron-forward" size={16} color={colors.textSecondary} />
        </TouchableOpacity>

        <TouchableOpacity style={[styles.actionRow, { borderTopWidth: 1, borderTopColor: colors.border }]} onPress={() => router.push('/(tabs)/two')}>
          <View style={styles.actionTitleWrap}>
            <Ionicons name="bus-outline" size={18} color={colors.primary} style={{ marginRight: 8 }} />
            <Text style={[styles.infoLabel, { color: colors.text }]}>Transport Services</Text>
          </View>
          <Ionicons name="chevron-forward" size={16} color={colors.textSecondary} />
        </TouchableOpacity>
      </View>

      <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>Account Details</Text>
      
      <View style={[styles.section, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <View style={styles.infoRow}>
          <View style={styles.infoTitleContainer}>
            <Ionicons name="person-circle-outline" size={20} color={colors.textSecondary} style={{ marginRight: 8 }} />
            <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>Role</Text>
          </View>
          <Text style={[styles.infoValue, { color: colors.text }]}>{user?.role}</Text>
        </View>
        {user?.enrollmentNumber && (
          <View style={[styles.infoRow, { borderTopWidth: 1, borderTopColor: colors.border }]}>
            <View style={styles.infoTitleContainer}>
              <Ionicons name="id-card-outline" size={20} color={colors.textSecondary} style={{ marginRight: 8 }} />
              <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>Enrollment No.</Text>
            </View>
            <Text style={[styles.infoValue, { color: colors.text }]}>{user.enrollmentNumber}</Text>
          </View>
        )}
        {departmentLabel ? (
          <View style={[styles.infoRow, { borderTopWidth: 1, borderTopColor: colors.border }]}> 
            <View style={styles.infoTitleContainer}>
              <Ionicons name="school-outline" size={20} color={colors.textSecondary} style={{ marginRight: 8 }} />
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
            <Ionicons name={isDark ? "moon-outline" : "sunny-outline"} size={20} color={colors.textSecondary} style={{ marginRight: 8 }} />
            <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>Dark Theme</Text>
          </View>
          <Switch
            value={isDark}
            onValueChange={toggleTheme}
            trackColor={{ false: colors.border, true: colors.primary }}
            thumbColor={'#ffffff'}
          />
        </View>

        <View style={[styles.infoRow, { borderTopWidth: 1, borderTopColor: colors.border }]}> 
          <View style={styles.infoTitleContainer}>
            <Ionicons name="notifications-outline" size={20} color={colors.textSecondary} style={{ marginRight: 8 }} />
            <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>In-App Alerts</Text>
          </View>
          <Switch
            value={notificationsEnabled}
            onValueChange={setNotificationsEnabled}
            trackColor={{ false: colors.border, true: colors.primary }}
            thumbColor={'#ffffff'}
          />
        </View>

        <View style={[styles.infoRow, { borderTopWidth: 1, borderTopColor: colors.border }]}> 
          <View style={styles.infoTitleContainer}>
            <Ionicons name="grid-outline" size={20} color={colors.textSecondary} style={{ marginRight: 8 }} />
            <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>Compact Mode</Text>
          </View>
          <Switch
            value={compactModeEnabled}
            onValueChange={setCompactModeEnabled}
            trackColor={{ false: colors.border, true: colors.primary }}
            thumbColor={'#ffffff'}
          />
        </View>
      </View>

      <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>Support & Security</Text>
      <View style={[styles.section, { backgroundColor: colors.surface, borderColor: colors.border }]}> 
        <TouchableOpacity style={styles.actionRow} onPress={() => Alert.alert('Support', 'Support chat will be added in next update.')}> 
          <View style={styles.actionTitleWrap}>
            <Ionicons name="help-circle-outline" size={18} color={colors.primary} style={{ marginRight: 8 }} />
            <Text style={[styles.infoLabel, { color: colors.text }]}>Help & Support</Text>
          </View>
          <Ionicons name="chevron-forward" size={16} color={colors.textSecondary} />
        </TouchableOpacity>

        <TouchableOpacity style={[styles.actionRow, { borderTopWidth: 1, borderTopColor: colors.border }]} onPress={() => Alert.alert('Privacy', 'Privacy controls will be available soon.')}> 
          <View style={styles.actionTitleWrap}>
            <Ionicons name="lock-closed-outline" size={18} color={colors.primary} style={{ marginRight: 8 }} />
            <Text style={[styles.infoLabel, { color: colors.text }]}>Privacy & Data</Text>
          </View>
          <Ionicons name="chevron-forward" size={16} color={colors.textSecondary} />
        </TouchableOpacity>

        <View style={[styles.actionRow, { borderTopWidth: 1, borderTopColor: colors.border }]}> 
          <View style={styles.actionTitleWrap}>
            <Ionicons name="information-circle-outline" size={18} color={colors.primary} style={{ marginRight: 8 }} />
            <Text style={[styles.infoLabel, { color: colors.text }]}>App Version</Text>
          </View>
          <Text style={[styles.actionCount, { color: colors.textSecondary }]}>v1.0.0</Text>
        </View>
      </View>

      <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>Registered Events</Text>
      <View style={[styles.section, { backgroundColor: colors.surface, borderColor: colors.border }]}> 
        {registeredEvents.length === 0 ? (
          <Text style={{ color: colors.textSecondary }}>No event registrations yet.</Text>
        ) : (
          registeredEvents.slice(0, 10).map((e: any) => (
            <View key={e._id} style={styles.listItem}>
              <Text style={[styles.listTitle, { color: colors.text }]}>{e.title}</Text>
              <Text style={{ color: colors.textSecondary }}>{e.locationName}</Text>
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

    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 24, paddingTop: 60 },
  contentContainer: { paddingBottom: 130 },
  header: { alignItems: 'center', marginBottom: 40 },
  avatarPlaceholder: {
    width: 96, height: 96, borderRadius: 48,
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 16,
    borderWidth: 1,
    overflow: 'hidden',
  },
  avatarImage: { width: '100%', height: '100%' },
  avatarText: { fontSize: 36, fontWeight: '700' },
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
  cameraBadge: {
    position: 'absolute',
    right: 2,
    bottom: 2,
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  name: { fontSize: 24, fontWeight: 'bold', marginBottom: 4 },
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
    marginBottom: 32,
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
  actionTitleWrap: { flexDirection: 'row', alignItems: 'center' },
  actionRightWrap: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  actionCount: { fontSize: 13, fontWeight: '600' },
  listItem: { paddingVertical: 10, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: '#334155' },
  listTitle: { fontSize: 15, fontWeight: '700', marginBottom: 4 },
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
  logoutTextWrap: {
    flex: 1,
    marginLeft: 10,
  },
  logoutButtonText: { fontSize: 16, fontWeight: '700' },
  logoutSubText: { fontSize: 12, marginTop: 2 },
});
