import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, ScrollView, Alert } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { apiClient } from '../config/api';
import { ensureBlePermissions, startTeacherBleAdvertising, stopTeacherBleAdvertising } from '../lib/bleAttendance';

export default function AttendanceSessionScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const params = useLocalSearchParams<{ scheduleId?: string; subject?: string }>();
  const scheduleId = typeof params.scheduleId === 'string' ? params.scheduleId : '';
  const subject = typeof params.subject === 'string' ? params.subject : 'Class';

  const [loading, setLoading] = useState(true);
  const [closing, setClosing] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [manualSavingId, setManualSavingId] = useState<string | null>(null);
  const [report, setReport] = useState<any>(null);
  const [bleReady, setBleReady] = useState(false);
  const [onlyLeftStudents, setOnlyLeftStudents] = useState(false);
  const [onlyManuallyMarked, setOnlyManuallyMarked] = useState(false);

  const presentList = useMemo(() => (report?.students || []).filter((s: any) => s.status === 'present'), [report]);
  const leftList = useMemo(() => (report?.students || []).filter((s: any) => s.status !== 'present'), [report]);
  const filteredStudents = useMemo(() => {
    const list = report?.students || [];
    return list.filter((student: any) => {
      if (onlyLeftStudents && student.status === 'present') return false;
      if (onlyManuallyMarked && student.source !== 'teacher_manual') return false;
      return true;
    });
  }, [report, onlyLeftStudents, onlyManuallyMarked]);

  const fetchActiveReport = async (silent = false) => {
    if (!scheduleId) return;
    if (!silent) setRefreshing(true);
    try {
      const { data } = await apiClient.get(`/schedules/${scheduleId}/attendance/session/active`);
      setReport(data);
    } catch (_error) {
      // session may be closed
    } finally {
      if (!silent) setRefreshing(false);
    }
  };

  const initialize = async () => {
    if (!scheduleId) {
      Alert.alert('Attendance', 'Schedule ID is missing.');
      router.back();
      return;
    }

    try {
      const { data } = await apiClient.post(`/schedules/${scheduleId}/attendance/session/start`);
      setReport(data);

      // Keep page responsive: BLE startup runs in background and should not block UI loading.
      setLoading(false);
      (async () => {
        const hasPermission = await ensureBlePermissions();
        if (!hasPermission) {
          Alert.alert('Bluetooth Permission', 'Allow bluetooth permissions so students can auto-mark attendance.');
          setBleReady(false);
          return;
        }

        if (data?.bleServiceUuid) {
          await startTeacherBleAdvertising(data.bleServiceUuid, data?.bluetoothCode || '');
          setBleReady(true);
        }
      })().catch(() => {
        setBleReady(false);
      });
    } catch (error: any) {
      Alert.alert('Attendance', error.response?.data?.message || 'Unable to start attendance session');
      router.back();
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    initialize();

    const poll = setInterval(() => {
      fetchActiveReport(true);
    }, 5000);

    return () => {
      clearInterval(poll);
      stopTeacherBleAdvertising().catch(() => undefined);
    };
  }, [scheduleId]);

  const manualMarkPresent = async (studentId: string) => {
    if (!scheduleId) return;
    try {
      setManualSavingId(studentId);
      const { data } = await apiClient.put(`/schedules/${scheduleId}/attendance/manual`, {
        studentId,
        present: true,
        note: 'Manually marked present by teacher',
      });
      if (data?.report) setReport(data.report);
    } catch (error: any) {
      Alert.alert('Attendance', error.response?.data?.message || 'Failed to mark student present');
    } finally {
      setManualSavingId(null);
    }
  };

  const closeSession = async () => {
    if (!scheduleId) return;
    try {
      setClosing(true);
      await apiClient.post(`/schedules/${scheduleId}/attendance/session/close`);
      await stopTeacherBleAdvertising();
      Alert.alert('Attendance Closed', 'Session has been closed.');
      router.back();
    } catch (error: any) {
      Alert.alert('Attendance', error.response?.data?.message || 'Failed to close session');
    } finally {
      setClosing(false);
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
      <View style={styles.header}> 
        <TouchableOpacity onPress={() => router.back()} style={[styles.backBtn, { borderColor: colors.border, backgroundColor: colors.surface }]}> 
          <Ionicons name="arrow-back" size={18} color={colors.text} />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={[styles.title, { color: colors.text }]}>Take Attendance</Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]} numberOfLines={1}>{subject}</Text>
        </View>
        <TouchableOpacity onPress={() => fetchActiveReport(false)} style={[styles.backBtn, { borderColor: colors.border, backgroundColor: colors.surface }]}> 
          {refreshing ? <ActivityIndicator size="small" color={colors.primary} /> : <Ionicons name="refresh" size={18} color={colors.primary} />}
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.content}> 
        <View style={[styles.summaryCard, { borderColor: colors.border, backgroundColor: colors.surface }]}> 
          <View style={styles.summaryCol}>
            <Text style={[styles.summaryValue, { color: colors.text }]}>{report?.totalStudents || 0}</Text>
            <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>Total Students</Text>
          </View>
          <View style={styles.summaryCol}>
            <Text style={[styles.summaryValue, { color: '#16a34a' }]}>{presentList.length}</Text>
            <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>Marked Present</Text>
          </View>
          <View style={styles.summaryCol}>
            <Text style={[styles.summaryValue, { color: '#dc2626' }]}>{leftList.length}</Text>
            <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>Left</Text>
          </View>
        </View>

        <View style={[styles.codeCard, { borderColor: colors.border, backgroundColor: colors.surface }]}> 
          <Text style={[styles.codeTitle, { color: colors.textSecondary }]}>Automatic Attendance (BLE)</Text>
          <Text style={[styles.codeValue, { color: colors.primary }]}>{report?.bluetoothCode || '------'}</Text>
          <Text style={[styles.bleHint, { color: colors.textSecondary }]}>Students near your phone are auto-marked via BLE session. BLE status: {bleReady ? 'Active' : 'Not active'}</Text>
        </View>

        <View style={[styles.listCard, { borderColor: colors.border, backgroundColor: colors.surface }]}> 
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Marked Present ({presentList.length})</Text>
          {presentList.length === 0 ? (
            <Text style={[styles.empty, { color: colors.textSecondary }]}>No students marked present yet.</Text>
          ) : (
            presentList.map((student: any) => (
              <View key={student.studentId} style={[styles.studentRow, { borderColor: colors.border }]}> 
                <View style={{ flex: 1 }}>
                  <Text style={[styles.studentName, { color: colors.text }]}>{student.name}</Text>
                  <Text style={[styles.studentMeta, { color: colors.textSecondary }]}>{student.rollNumber || student.enrollmentNumber || student.email}</Text>
                </View>
                <Text style={[styles.presentTag, { color: '#16a34a' }]}>Present</Text>
              </View>
            ))
          )}
        </View>

        <View style={[styles.listCard, { borderColor: colors.border, backgroundColor: colors.surface }]}> 
          <View style={styles.filterHead}>
            <Text style={[styles.sectionTitle, { color: colors.text, marginBottom: 0 }]}>Student Tracker ({filteredStudents.length})</Text>
            <View style={styles.filterRow}>
              <TouchableOpacity
                onPress={() => setOnlyLeftStudents((v) => !v)}
                style={[styles.filterBtn, { borderColor: onlyLeftStudents ? colors.primary : colors.border, backgroundColor: onlyLeftStudents ? colors.primaryBg : colors.background }]}
              >
                <Text style={[styles.filterBtnText, { color: onlyLeftStudents ? colors.primary : colors.textSecondary }]}>Only Left Students</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => setOnlyManuallyMarked((v) => !v)}
                style={[styles.filterBtn, { borderColor: onlyManuallyMarked ? colors.primary : colors.border, backgroundColor: onlyManuallyMarked ? colors.primaryBg : colors.background }]}
              >
                <Text style={[styles.filterBtnText, { color: onlyManuallyMarked ? colors.primary : colors.textSecondary }]}>Only Manually Marked</Text>
              </TouchableOpacity>
            </View>
          </View>

          {filteredStudents.length === 0 ? (
            <Text style={[styles.empty, { color: colors.textSecondary }]}>All students are marked present.</Text>
          ) : (
            filteredStudents.map((student: any) => (
              <View key={student.studentId} style={[styles.studentRow, { borderColor: colors.border }]}> 
                <View style={{ flex: 1 }}>
                  <Text style={[styles.studentName, { color: colors.text }]}>{student.name}</Text>
                  <Text style={[styles.studentMeta, { color: colors.textSecondary }]}>{student.rollNumber || student.enrollmentNumber || student.email}</Text>
                  <Text style={[styles.studentMeta, { color: colors.textSecondary }]}>
                    Status: {student.status === 'present' ? 'Present' : 'Left'} {student.source ? `| Source: ${student.source === 'teacher_manual' ? 'Manual' : 'Automatic'}` : ''}
                  </Text>
                </View>
                {student.status !== 'present' ? (
                  <TouchableOpacity
                    onPress={() => manualMarkPresent(student.studentId)}
                    disabled={manualSavingId === student.studentId}
                    style={[styles.manualBtn, { backgroundColor: colors.primary }]}
                  >
                    {manualSavingId === student.studentId ? <ActivityIndicator size="small" color="#fff" /> : <Text style={styles.manualBtnText}>Mark Present</Text>}
                  </TouchableOpacity>
                ) : (
                  <Text style={[styles.presentTag, { color: '#16a34a' }]}>Present</Text>
                )}
              </View>
            ))
          )}
        </View>

        <TouchableOpacity disabled={closing} onPress={closeSession} style={[styles.closeBtn, { backgroundColor: colors.error }]}> 
          {closing ? <ActivityIndicator color="#fff" /> : <Text style={styles.closeBtnText}>Close Attendance Session</Text>}
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  header: {
    paddingTop: 56,
    paddingHorizontal: 18,
    paddingBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: { fontSize: 20, fontWeight: '800' },
  subtitle: { fontSize: 12, marginTop: 1 },
  content: { paddingHorizontal: 18, paddingBottom: 120 },
  summaryCard: {
    borderWidth: 1,
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 10,
    flexDirection: 'row',
    marginBottom: 12,
  },
  summaryCol: { flex: 1, alignItems: 'center' },
  summaryValue: { fontSize: 22, fontWeight: '800' },
  summaryLabel: { fontSize: 12, marginTop: 2 },
  codeCard: { borderWidth: 1, borderRadius: 14, padding: 12, marginBottom: 12 },
  codeTitle: { fontSize: 12, fontWeight: '700' },
  codeValue: { fontSize: 30, fontWeight: '800', letterSpacing: 2, marginTop: 2 },
  bleHint: { fontSize: 12, marginTop: 2 },
  listCard: { borderWidth: 1, borderRadius: 14, padding: 12, marginBottom: 12 },
  sectionTitle: { fontSize: 14, fontWeight: '800', marginBottom: 8 },
  filterHead: { marginBottom: 8 },
  filterRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 8 },
  filterBtn: {
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  filterBtnText: { fontSize: 12, fontWeight: '700' },
  empty: { fontSize: 12 },
  studentRow: {
    borderWidth: 1,
    borderRadius: 10,
    padding: 10,
    marginBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  studentName: { fontSize: 14, fontWeight: '700' },
  studentMeta: { fontSize: 12, marginTop: 2 },
  presentTag: { fontSize: 12, fontWeight: '800' },
  manualBtn: {
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
    minWidth: 94,
    alignItems: 'center',
    justifyContent: 'center',
  },
  manualBtnText: { color: '#fff', fontSize: 12, fontWeight: '700' },
  closeBtn: {
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
  },
  closeBtnText: { color: '#fff', fontWeight: '800' },
});
