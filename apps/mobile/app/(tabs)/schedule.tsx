import React, { useEffect, useMemo, useRef, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, FlatList, TouchableOpacity, TextInput, Alert, Modal, ScrollView } from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import { Ionicons } from '@expo/vector-icons';
import { apiClient } from '../../config/api';
import { useAuth } from '../../context/AuthContext';
import { useRouter } from 'expo-router';
import { ensureBlePermissions, scanForTeacherBleSession, startTeacherBleAdvertising, stopTeacherBleAdvertising } from '../../lib/bleAttendance';

export default function ScheduleScreen() {
  const { colors } = useTheme();
  const { user } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [schedules, setSchedules] = useState<any[]>([]);
  const [profile, setProfile] = useState<any>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [showFormModal, setShowFormModal] = useState(false);
  const [showAttendanceModal, setShowAttendanceModal] = useState(false);
  const [selectedSchedule, setSelectedSchedule] = useState<any>(null);
  const [attendanceReport, setAttendanceReport] = useState<any>(null);
  const [attendanceLoading, setAttendanceLoading] = useState(false);
  const [attendanceSubmitting, setAttendanceSubmitting] = useState(false);
  const [autoScanning, setAutoScanning] = useState(false);
  const [bleDetected, setBleDetected] = useState(false);
  const attendanceScanStopRef = useRef<null | (() => Promise<void>)>(null);

  const [form, setForm] = useState({
    type: 'class',
    subject: '',
    dayOfWeek: 'Monday',
    startTime: '09:00',
    endTime: '10:00',
    room: '',
  });

  const isTeacher = user?.role === 'teacher';

  const fetchData = async () => {
    try {
      const profileRes = await apiClient.get('/auth/profile');
      setProfile(profileRes.data);

      if (isTeacher) {
        const { data } = await apiClient.get('/schedules/mine');
        setSchedules(Array.isArray(data) ? data : []);
      } else {
        const deptId = profileRes.data?.department?._id || profileRes.data?.department;
        if (!deptId) {
          setSchedules([]);
          return;
        }
        const { data } = await apiClient.get('/schedules', { params: { departmentId: deptId } });
        setSchedules(Array.isArray(data) ? data : []);
      }
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.message || 'Failed to load schedule');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    return () => {
      stopTeacherBleAdvertising().catch(() => undefined);
      if (attendanceScanStopRef.current) {
        attendanceScanStopRef.current().catch(() => undefined);
      }
    };
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  const clearForm = () => {
    setForm({ type: 'class', subject: '', dayOfWeek: 'Monday', startTime: '09:00', endTime: '10:00', room: '' });
    setEditingId(null);
    setShowFormModal(false);
  };

  const saveSchedule = async () => {
    if (!profile?.department?._id && !profile?.department) {
      Alert.alert('Error', 'Department not found in your profile');
      return;
    }

    if (!form.subject.trim()) {
      Alert.alert('Validation', 'Subject is required');
      return;
    }

    setSaving(true);
    try {
      const payload = {
        type: form.type as 'class' | 'lab',
        subject: form.subject,
        teacher: user?._id,
        department: profile?.department?._id || profile?.department,
        dayOfWeek: form.dayOfWeek,
        startTime: form.startTime,
        endTime: form.endTime,
        room: form.room || undefined,
      };

      if (editingId) {
        await apiClient.put(`/schedules/${editingId}`, payload);
      } else {
        await apiClient.post('/schedules', payload);
      }

      clearForm();
      await fetchData();
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.message || 'Failed to save schedule');
    } finally {
      setSaving(false);
    }
  };

  const startEdit = (item: any) => {
    setEditingId(item._id);
    setForm({
      type: item.type || 'class',
      subject: item.subject || '',
      dayOfWeek: item.dayOfWeek || 'Monday',
      startTime: item.startTime || '09:00',
      endTime: item.endTime || '10:00',
      room: item.room || '',
    });
    setShowFormModal(true);
  };

  const cancelSchedule = async (id: string) => {
    try {
      await apiClient.put(`/schedules/${id}/cancel`, { reason: 'Cancelled by teacher' });
      await fetchData();
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.message || 'Failed to cancel class');
    }
  };

  const deleteSchedule = async (id: string) => {
    try {
      await apiClient.delete(`/schedules/${id}`);
      await fetchData();
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.message || 'Failed to delete schedule');
    }
  };

  const openTeacherAttendance = async (schedule: any) => {
    try {
      setAttendanceLoading(true);
      setSelectedSchedule(schedule);
      const { data } = await apiClient.post(`/schedules/${schedule._id}/attendance/session/start`);
      setAttendanceReport(data);

      const hasPermission = await ensureBlePermissions();
      if (!hasPermission) {
        Alert.alert('Bluetooth Permission', 'Please allow bluetooth permissions to run auto attendance.');
      } else if (data?.bleServiceUuid) {
        await startTeacherBleAdvertising(data.bleServiceUuid, data?.bluetoothCode || '');
      }

      setShowAttendanceModal(true);
    } catch (error: any) {
      Alert.alert('Attendance', error.response?.data?.message || 'Failed to start attendance session');
    } finally {
      setAttendanceLoading(false);
    }
  };

  const stopStudentScan = async () => {
    if (!attendanceScanStopRef.current) return;
    await attendanceScanStopRef.current();
    attendanceScanStopRef.current = null;
  };

  const autoMarkFromBle = async (bleServiceUuid: string) => {
    if (!selectedSchedule?._id) return;
    try {
      setAttendanceSubmitting(true);
      const { data } = await apiClient.post(`/schedules/${selectedSchedule._id}/attendance/mark`, {
        bleServiceUuid,
      });
      if (data?.report) setAttendanceReport(data.report);
      setBleDetected(true);
      setAutoScanning(false);
      await stopStudentScan();
      Alert.alert('Attendance Marked', 'Nearby teacher bluetooth session found. You are marked present.');
    } catch (error: any) {
      Alert.alert('Attendance', error.response?.data?.message || 'Auto attendance marking failed');
      setAutoScanning(false);
    } finally {
      setAttendanceSubmitting(false);
    }
  };

  const startStudentAutoScan = async (report?: any) => {
    const bleServiceUuid = report?.bleServiceUuid || attendanceReport?.bleServiceUuid;
    if (!bleServiceUuid) {
      Alert.alert('Attendance', 'Teacher BLE session is not available yet.');
      return;
    }

    const hasPermission = await ensureBlePermissions();
    if (!hasPermission) {
      Alert.alert('Bluetooth Permission', 'Please allow bluetooth permissions to auto mark attendance.');
      return;
    }

    await stopStudentScan();
    setBleDetected(false);
    setAutoScanning(true);

    try {
      const stopFn = await scanForTeacherBleSession(bleServiceUuid, () => {
        autoMarkFromBle(bleServiceUuid).catch(() => undefined);
      });
      attendanceScanStopRef.current = stopFn;
    } catch (error: any) {
      setAutoScanning(false);
      Alert.alert('Attendance', error?.message || 'Unable to start BLE scan for attendance');
    }
  };

  const openStudentAttendance = async (schedule: any) => {
    try {
      setAttendanceLoading(true);
      setSelectedSchedule(schedule);
      const { data } = await apiClient.get(`/schedules/${schedule._id}/attendance/session/active`);
      setAttendanceReport(data);
      setShowAttendanceModal(true);
      await startStudentAutoScan(data);
    } catch (error: any) {
      Alert.alert('Attendance', error.response?.data?.message || 'Teacher has not started attendance yet.');
    } finally {
      setAttendanceLoading(false);
    }
  };

  const refreshAttendance = async () => {
    if (!selectedSchedule?._id) return;
    try {
      setAttendanceLoading(true);
      const { data } = await apiClient.get(`/schedules/${selectedSchedule._id}/attendance/session/active`);
      setAttendanceReport(data);
    } catch (error: any) {
      Alert.alert('Attendance', error.response?.data?.message || 'Unable to refresh attendance status');
    } finally {
      setAttendanceLoading(false);
    }
  };

  const manualMarkPresent = async (studentId: string) => {
    if (!selectedSchedule?._id) return;
    try {
      setAttendanceSubmitting(true);
      const { data } = await apiClient.put(`/schedules/${selectedSchedule._id}/attendance/manual`, {
        studentId,
        present: true,
        note: 'Marked present by teacher',
      });
      if (data?.report) {
        setAttendanceReport(data.report);
      }
    } catch (error: any) {
      Alert.alert('Attendance', error.response?.data?.message || 'Failed to manually mark student');
    } finally {
      setAttendanceSubmitting(false);
    }
  };

  const closeAttendanceSession = async () => {
    if (!selectedSchedule?._id) return;
    try {
      setAttendanceSubmitting(true);
      const { data } = await apiClient.post(`/schedules/${selectedSchedule._id}/attendance/session/close`);
      if (data?.report) {
        setAttendanceReport(data.report);
      }
      Alert.alert('Attendance Closed', 'Attendance session has been closed.');
      await stopTeacherBleAdvertising();
      setShowAttendanceModal(false);
    } catch (error: any) {
      Alert.alert('Attendance', error.response?.data?.message || 'Failed to close attendance session');
    } finally {
      setAttendanceSubmitting(false);
    }
  };

  const closeAttendanceModal = async () => {
    await stopStudentScan();
    if (isTeacher) {
      await stopTeacherBleAdvertising();
    }
    setAutoScanning(false);
    setBleDetected(false);
    setShowAttendanceModal(false);
  };

  const grouped = useMemo(() => {
    const map: Record<string, any[]> = {};
    schedules.forEach((s) => {
      const day = s.dayOfWeek || 'Other';
      if (!map[day]) map[day] = [];
      map[day].push(s);
    });
    return map;
  }, [schedules]);

  const dayOrder = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

  if (loading) {
    return (
      <View style={[styles.centered, { backgroundColor: colors.background }]}> 
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Text style={[styles.title, { color: colors.text }]}>{isTeacher ? 'Manage Schedule' : 'My Schedule'}</Text>

      <FlatList
        data={dayOrder.filter((d) => (grouped[d] || []).length > 0)}
        keyExtractor={(item) => item}
        onRefresh={onRefresh}
        refreshing={refreshing}
        contentContainerStyle={{ paddingBottom: isTeacher ? 110 : 36 }}
        ListEmptyComponent={<Text style={[styles.subtitle, { color: colors.textSecondary }]}>No schedules available.</Text>}
        renderItem={({ item: day }) => (
          <View style={styles.daySection}>
            <Text style={[styles.dayTitle, { color: colors.text }]}>{day}</Text>
            {(grouped[day] || []).map((s) => (
              <View key={s._id} style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}> 
                <View style={styles.cardTop}>
                  <Text style={[styles.subject, { color: colors.text }]}>{s.subject}</Text>
                  <Text style={[styles.badge, { color: colors.primary }]}>{String(s.type || 'class').toUpperCase()}</Text>
                </View>
                <Text style={{ color: colors.textSecondary }}>{s.startTime} - {s.endTime} {s.room ? `| ${s.room}` : ''}</Text>
                {s.isCancelled ? <Text style={{ color: colors.error, marginTop: 6, fontWeight: '700' }}>Cancelled</Text> : null}

                {!s.isCancelled ? (
                  <View style={styles.attendanceRow}>
                    {isTeacher ? (
                      <TouchableOpacity
                        onPress={() => router.push({ pathname: '/attendance-session', params: { scheduleId: s._id, subject: s.subject || 'Class' } })}
                        style={[styles.attendanceBtn, { backgroundColor: colors.primary }]}
                      >
                        <Ionicons name="bluetooth" size={16} color="#fff" />
                        <Text style={styles.attendanceBtnText}>Take Attendance</Text>
                      </TouchableOpacity>
                    ) : (
                      <TouchableOpacity
                        onPress={() => openStudentAttendance(s)}
                        style={[styles.attendanceBtn, { backgroundColor: '#0ea5e9' }]}
                      >
                        <Ionicons name="checkmark-circle-outline" size={16} color="#fff" />
                        <Text style={styles.attendanceBtnText}>Mark Attendance</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                ) : null}

                {isTeacher && (
                  <View style={styles.cardActions}>
                    <TouchableOpacity onPress={() => startEdit(s)}>
                      <Ionicons name="create-outline" size={20} color={colors.primary} />
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => cancelSchedule(s._id)}>
                      <Ionicons name="close-circle-outline" size={20} color={colors.error} />
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => deleteSchedule(s._id)}>
                      <Ionicons name="trash-outline" size={20} color={colors.error} />
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            ))}
          </View>
        )}
      />

      {isTeacher ? (
        <TouchableOpacity
          onPress={() => {
            if (!editingId) {
              setForm({ type: 'class', subject: '', dayOfWeek: 'Monday', startTime: '09:00', endTime: '10:00', room: '' });
            }
            setShowFormModal(true);
          }}
          style={[styles.fab, { backgroundColor: colors.primary }]}
        >
          <Ionicons name="add" size={28} color="#fff" />
        </TouchableOpacity>
      ) : null}

      <Modal visible={showFormModal} transparent animationType="slide" onRequestClose={() => setShowFormModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalCard, { backgroundColor: colors.surface, borderColor: colors.border }]}> 
            <View style={styles.modalHead}>
              <Text style={[styles.formTitle, { color: colors.text }]}>{editingId ? 'Edit Class' : 'Schedule Class'}</Text>
              <TouchableOpacity onPress={() => setShowFormModal(false)}>
                <Ionicons name="close" size={20} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              <TextInput
                value={form.subject}
                onChangeText={(subject) => setForm({ ...form, subject })}
                style={[styles.input, { borderColor: colors.border, color: colors.text, backgroundColor: colors.background }]}
                placeholder="Subject"
                placeholderTextColor={colors.textSecondary}
              />

              <View style={styles.row}>
                <TextInput
                  value={form.dayOfWeek}
                  onChangeText={(dayOfWeek) => setForm({ ...form, dayOfWeek })}
                  style={[styles.input, styles.half, { borderColor: colors.border, color: colors.text, backgroundColor: colors.background }]}
                  placeholder="Day"
                  placeholderTextColor={colors.textSecondary}
                />
                <TextInput
                  value={form.type}
                  onChangeText={(type) => setForm({ ...form, type })}
                  style={[styles.input, styles.half, { borderColor: colors.border, color: colors.text, backgroundColor: colors.background }]}
                  placeholder="class/lab"
                  placeholderTextColor={colors.textSecondary}
                />
              </View>

              <View style={styles.row}>
                <TextInput
                  value={form.startTime}
                  onChangeText={(startTime) => setForm({ ...form, startTime })}
                  style={[styles.input, styles.half, { borderColor: colors.border, color: colors.text, backgroundColor: colors.background }]}
                  placeholder="Start e.g 09:00"
                  placeholderTextColor={colors.textSecondary}
                />
                <TextInput
                  value={form.endTime}
                  onChangeText={(endTime) => setForm({ ...form, endTime })}
                  style={[styles.input, styles.half, { borderColor: colors.border, color: colors.text, backgroundColor: colors.background }]}
                  placeholder="End e.g 10:00"
                  placeholderTextColor={colors.textSecondary}
                />
              </View>

              <TextInput
                value={form.room}
                onChangeText={(room) => setForm({ ...form, room })}
                style={[styles.input, { borderColor: colors.border, color: colors.text, backgroundColor: colors.background }]}
                placeholder="Room (optional)"
                placeholderTextColor={colors.textSecondary}
              />

              <View style={styles.row}>
                <TouchableOpacity disabled={saving} onPress={saveSchedule} style={[styles.actionBtn, { backgroundColor: colors.primary }]}> 
                  {saving ? <ActivityIndicator color="#fff" /> : <Text style={styles.actionText}>{editingId ? 'Update' : 'Create'}</Text>}
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => {
                    setShowFormModal(false);
                    if (editingId) setEditingId(null);
                  }}
                  style={[styles.actionBtn, { backgroundColor: colors.border }]}
                > 
                  <Text style={[styles.actionText, { color: colors.text }]}>Close</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>

      <Modal visible={showAttendanceModal} transparent animationType="slide" onRequestClose={closeAttendanceModal}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalCard, { backgroundColor: colors.surface, borderColor: colors.border }]}> 
            <View style={styles.modalHead}>
              <Text style={[styles.formTitle, { color: colors.text }]}>Bluetooth Attendance</Text>
              <TouchableOpacity onPress={closeAttendanceModal}>
                <Ionicons name="close" size={20} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              <Text style={[styles.attendanceSubject, { color: colors.text }]}>{selectedSchedule?.subject || 'Class'}</Text>
              <Text style={[styles.attendanceHint, { color: colors.textSecondary }]}>Keep bluetooth on. Students connect to teacher session and attendance is marked automatically.</Text>

              <View style={[styles.attendanceStatsCard, { backgroundColor: colors.background, borderColor: colors.border }]}> 
                <View style={styles.attendanceStatCol}>
                  <Text style={[styles.attendanceStatValue, { color: colors.text }]}>{attendanceReport?.totalStudents || 0}</Text>
                  <Text style={[styles.attendanceStatLabel, { color: colors.textSecondary }]}>Registered</Text>
                </View>
                <View style={styles.attendanceStatCol}>
                  <Text style={[styles.attendanceStatValue, { color: '#059669' }]}>{attendanceReport?.presentCount || 0}</Text>
                  <Text style={[styles.attendanceStatLabel, { color: colors.textSecondary }]}>Present</Text>
                </View>
                <View style={styles.attendanceStatCol}>
                  <Text style={[styles.attendanceStatValue, { color: '#dc2626' }]}>{attendanceReport?.absentCount || 0}</Text>
                  <Text style={[styles.attendanceStatLabel, { color: colors.textSecondary }]}>Absent</Text>
                </View>
              </View>

              {isTeacher ? (
                <View style={[styles.codeCard, { borderColor: colors.border, backgroundColor: colors.background }]}> 
                  <Text style={[styles.codeTitle, { color: colors.textSecondary }]}>Teacher Bluetooth Code</Text>
                  <Text style={[styles.codeValue, { color: colors.primary }]}>{attendanceReport?.bluetoothCode || '------'}</Text>
                  <Text style={[styles.codeHint, { color: colors.textSecondary }]}>Teacher app is broadcasting BLE attendance session for auto detection.</Text>
                </View>
              ) : (
                <View style={[styles.codeCard, { borderColor: colors.border, backgroundColor: colors.background }]}> 
                  <Text style={[styles.codeTitle, { color: colors.textSecondary }]}>Auto BLE Attendance</Text>
                  <Text style={[styles.codeHint, { color: colors.textSecondary }]}>Scanning nearby teacher bluetooth session. Keep bluetooth on and stay near teacher device.</Text>
                  <View style={styles.scanStatusWrap}>
                    {autoScanning ? <ActivityIndicator color={colors.primary} /> : <Ionicons name="radio-outline" size={18} color={colors.primary} />}
                    <Text style={[styles.scanStatusText, { color: colors.text }]}>
                      {bleDetected ? 'Teacher session detected' : autoScanning ? 'Scanning for teacher device...' : 'Scan not active'}
                    </Text>
                  </View>
                  <TouchableOpacity
                    disabled={attendanceSubmitting}
                    onPress={() => startStudentAutoScan()}
                    style={[styles.actionBtn, { backgroundColor: '#0ea5e9' }]}
                  >
                    {attendanceSubmitting ? <ActivityIndicator color="#fff" /> : <Text style={styles.actionText}>Retry Auto Scan</Text>}
                  </TouchableOpacity>
                </View>
              )}

              <TouchableOpacity onPress={refreshAttendance} style={[styles.inlineRefresh, { borderColor: colors.border }]}> 
                {attendanceLoading ? <ActivityIndicator color={colors.primary} size="small" /> : <Ionicons name="refresh" size={16} color={colors.primary} />}
                <Text style={[styles.inlineRefreshText, { color: colors.primary }]}>Refresh Attendance</Text>
              </TouchableOpacity>

              {isTeacher ? (
                <View style={styles.studentListWrap}>
                  <Text style={[styles.sectionLabel, { color: colors.text }]}>Students Status</Text>
                  {(attendanceReport?.students || []).map((student: any) => {
                    const present = student.status === 'present';
                    return (
                      <View key={student.studentId} style={[styles.studentRow, { borderColor: colors.border }]}> 
                        <View style={{ flex: 1 }}>
                          <Text style={[styles.studentName, { color: colors.text }]}>{student.name}</Text>
                          <Text style={[styles.studentMeta, { color: colors.textSecondary }]}>{student.rollNumber || student.enrollmentNumber || student.email}</Text>
                        </View>
                        <View style={styles.studentRight}>
                          <Text style={[styles.studentStatus, { color: present ? '#059669' : '#dc2626' }]}>{present ? 'Present' : 'Absent'}</Text>
                          {!present ? (
                            <TouchableOpacity onPress={() => manualMarkPresent(student.studentId)}>
                              <Text style={[styles.manualMarkText, { color: colors.primary }]}>Mark Present</Text>
                            </TouchableOpacity>
                          ) : null}
                        </View>
                      </View>
                    );
                  })}
                </View>
              ) : (
                <View style={styles.studentListWrap}>
                  <Text style={[styles.sectionLabel, { color: colors.text }]}>My Attendance Status</Text>
                  {(() => {
                    const mine = (attendanceReport?.students || []).find((s: any) => s.studentId === user?._id);
                    if (!mine) {
                      return <Text style={[styles.studentMeta, { color: colors.textSecondary }]}>No status yet for your profile in this class.</Text>;
                    }
                    return (
                      <Text style={[styles.studentStatus, { color: mine.status === 'present' ? '#059669' : '#dc2626' }]}>
                        {mine.status === 'present' ? 'Marked Present' : 'Not Marked Yet'}
                      </Text>
                    );
                  })()}
                </View>
              )}

              {isTeacher ? (
                <TouchableOpacity
                  disabled={attendanceSubmitting}
                  onPress={closeAttendanceSession}
                  style={[styles.actionBtn, { backgroundColor: colors.error, marginTop: 14 }]}
                >
                  {attendanceSubmitting ? <ActivityIndicator color="#fff" /> : <Text style={styles.actionText}>Close Attendance Session</Text>}
                </TouchableOpacity>
              ) : null}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, paddingTop: 56 },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: 28, fontWeight: '800', marginBottom: 16 },
  subtitle: { fontSize: 15, textAlign: 'center', marginTop: 24 },
  formTitle: { fontSize: 16, fontWeight: '700', marginBottom: 10 },
  input: { borderWidth: 1, borderRadius: 12, paddingHorizontal: 12, paddingVertical: 10, marginBottom: 8 },
  row: { flexDirection: 'row', gap: 8 },
  half: { flex: 1 },
  actionBtn: { flex: 1, borderRadius: 12, paddingVertical: 12, alignItems: 'center', justifyContent: 'center' },
  actionText: { color: '#fff', fontWeight: '700' },
  daySection: { marginTop: 12 },
  dayTitle: { fontSize: 17, fontWeight: '700', marginBottom: 8 },
  card: { borderWidth: 1, borderRadius: 14, padding: 12, marginBottom: 10 },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  subject: { fontSize: 16, fontWeight: '700' },
  badge: { fontSize: 12, fontWeight: '700' },
  attendanceRow: { marginTop: 10 },
  attendanceBtn: {
    borderRadius: 10,
    paddingVertical: 9,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  attendanceBtnText: { color: '#fff', fontWeight: '700', fontSize: 13 },
  cardActions: { marginTop: 10, flexDirection: 'row', gap: 14 },
  fab: {
    position: 'absolute',
    right: 22,
    bottom: 92,
    width: 58,
    height: 58,
    borderRadius: 29,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.24,
    shadowRadius: 10,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'flex-end',
  },
  modalCard: {
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    borderWidth: 1,
    borderBottomWidth: 0,
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 20,
    maxHeight: '84%',
  },
  modalHead: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  attendanceSubject: { fontSize: 16, fontWeight: '800', marginBottom: 2 },
  attendanceHint: { fontSize: 12, marginBottom: 10 },
  attendanceStatsCard: {
    borderWidth: 1,
    borderRadius: 14,
    paddingVertical: 10,
    paddingHorizontal: 8,
    flexDirection: 'row',
    marginBottom: 10,
  },
  attendanceStatCol: { flex: 1, alignItems: 'center' },
  attendanceStatValue: { fontSize: 18, fontWeight: '800' },
  attendanceStatLabel: { fontSize: 12, marginTop: 2 },
  codeCard: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
  },
  codeTitle: { fontSize: 12, fontWeight: '600' },
  codeValue: { fontSize: 30, fontWeight: '800', letterSpacing: 2, marginTop: 4 },
  codeHint: { fontSize: 11, marginTop: 4 },
  scanStatusWrap: {
    marginVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  scanStatusText: { fontSize: 13, fontWeight: '600' },
  inlineRefresh: {
    borderWidth: 1,
    borderRadius: 10,
    paddingVertical: 9,
    paddingHorizontal: 10,
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  inlineRefreshText: { fontWeight: '700', fontSize: 13 },
  studentListWrap: { marginTop: 6 },
  sectionLabel: { fontSize: 14, fontWeight: '700', marginBottom: 8 },
  studentRow: {
    borderWidth: 1,
    borderRadius: 10,
    padding: 10,
    marginBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
  },
  studentName: { fontSize: 14, fontWeight: '700' },
  studentMeta: { fontSize: 12 },
  studentRight: { alignItems: 'flex-end', gap: 3 },
  studentStatus: { fontSize: 12, fontWeight: '800' },
  manualMarkText: { fontSize: 12, fontWeight: '700' },
});
