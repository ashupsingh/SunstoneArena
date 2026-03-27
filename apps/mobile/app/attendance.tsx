import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, RefreshControl } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { apiClient } from '../config/api';

export default function AttendanceScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const { user } = useAuth();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [data, setData] = useState<any>(null);

  const isTeacher = user?.role === 'teacher' || user?.role === 'superadmin';

  const loadAttendance = async () => {
    try {
      const res = await apiClient.get('/schedules/attendance/history');
      setData(res.data || null);
    } catch (_e) {
      setData(null);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadAttendance();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    loadAttendance();
  };

  const studentSummary = useMemo(() => data?.summary || {}, [data]);
  const teacherSummary = useMemo(() => data?.summary || {}, [data]);

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
        <TouchableOpacity onPress={() => router.back()} style={[styles.backBtn, { borderColor: colors.border, backgroundColor: colors.surface }]}>
          <Ionicons name="arrow-back" size={18} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: colors.text }]}>Attendance</Text>
        <View style={{ width: 38 }} />
      </View>

      <ScrollView
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
        contentContainerStyle={styles.scrollContent}
      >
        {!isTeacher ? (
          <View style={[styles.summaryCard, { borderColor: colors.border, backgroundColor: colors.surface }]}> 
            <Text style={[styles.summaryTitle, { color: colors.text }]}>My Attendance Overview</Text>
            <View style={styles.summaryGrid}>
              <View style={styles.summaryStat}>
                <Text style={[styles.summaryValue, { color: colors.primary }]}>{studentSummary.attendancePercentage ?? 0}%</Text>
                <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>Attendance</Text>
              </View>
              <View style={styles.summaryStat}>
                <Text style={[styles.summaryValue, { color: '#059669' }]}>{studentSummary.presentClasses ?? 0}</Text>
                <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>Present</Text>
              </View>
              <View style={styles.summaryStat}>
                <Text style={[styles.summaryValue, { color: '#dc2626' }]}>{studentSummary.absentClasses ?? 0}</Text>
                <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>Absent</Text>
              </View>
            </View>

            <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>Classes You Attended</Text>
            <View style={styles.chipsWrap}>
              {(data?.presentClassSubjects || []).length === 0 ? (
                <Text style={[styles.emptyText, { color: colors.textSecondary }]}>No classes marked present yet.</Text>
              ) : (
                (data.presentClassSubjects || []).map((subject: string) => (
                  <View key={subject} style={[styles.subjectChip, { backgroundColor: colors.primaryBg, borderColor: colors.border }]}> 
                    <Text style={[styles.subjectChipText, { color: colors.primary }]}>{subject}</Text>
                  </View>
                ))
              )}
            </View>
          </View>
        ) : (
          <View style={[styles.summaryCard, { borderColor: colors.border, backgroundColor: colors.surface }]}> 
            <Text style={[styles.summaryTitle, { color: colors.text }]}>Attendance Tracking</Text>
            <View style={styles.summaryGrid}>
              <View style={styles.summaryStat}>
                <Text style={[styles.summaryValue, { color: colors.primary }]}>{teacherSummary.totalSessions ?? 0}</Text>
                <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>Sessions</Text>
              </View>
              <View style={styles.summaryStat}>
                <Text style={[styles.summaryValue, { color: '#059669' }]}>{teacherSummary.totalStudentsMarked ?? 0}</Text>
                <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>Marked Present</Text>
              </View>
              <View style={styles.summaryStat}>
                <Text style={[styles.summaryValue, { color: '#0284c7' }]}>{teacherSummary.averageAttendancePercentage ?? 0}%</Text>
                <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>Average</Text>
              </View>
            </View>
          </View>
        )}

        <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>Date-wise Attendance</Text>
        {(data?.datewise || []).length === 0 ? (
          <View style={[styles.emptyCard, { borderColor: colors.border, backgroundColor: colors.surface }]}> 
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>No attendance records available yet.</Text>
          </View>
        ) : (
          (data.datewise || []).map((entry: any) => {
            const date = entry.attendanceDate ? new Date(entry.attendanceDate) : null;
            return (
              <View key={entry.sessionId} style={[styles.recordCard, { borderColor: colors.border, backgroundColor: colors.surface }]}> 
                <View style={styles.recordTop}>
                  <Text style={[styles.recordSubject, { color: colors.text }]}>{entry.subject || 'Class'}</Text>
                  {!isTeacher ? (
                    <Text style={[styles.statusPill, { color: entry.status === 'present' ? '#059669' : '#dc2626' }]}>
                      {entry.status === 'present' ? 'Present' : 'Absent'}
                    </Text>
                  ) : (
                    <Text style={[styles.statusPill, { color: colors.primary }]}>{entry.status || 'closed'}</Text>
                  )}
                </View>
                <Text style={[styles.recordMeta, { color: colors.textSecondary }]}>
                  {entry.dayOfWeek || 'Day'} | {entry.startTime || '--:--'} - {entry.endTime || '--:--'}
                  {entry.room ? ` | ${entry.room}` : ''}
                </Text>
                <Text style={[styles.recordMeta, { color: colors.textSecondary }]}>
                  {date ? date.toLocaleDateString() : 'Date unavailable'}
                </Text>

                {isTeacher ? (
                  <Text style={[styles.recordMeta, { color: colors.textSecondary, marginTop: 4 }]}>
                    Present: {entry.presentCount ?? 0} / {entry.totalStudents ?? 0} | Absent: {entry.absentCount ?? 0}
                  </Text>
                ) : null}
              </View>
            );
          })
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  headerRow: {
    paddingHorizontal: 18,
    paddingTop: 56,
    paddingBottom: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: { fontSize: 22, fontWeight: '800' },
  scrollContent: { paddingHorizontal: 18, paddingBottom: 120 },
  summaryCard: { borderWidth: 1, borderRadius: 16, padding: 14, marginBottom: 18 },
  summaryTitle: { fontSize: 15, fontWeight: '800', marginBottom: 10 },
  summaryGrid: { flexDirection: 'row', gap: 8, marginBottom: 12 },
  summaryStat: { flex: 1, alignItems: 'center' },
  summaryValue: { fontSize: 22, fontWeight: '800' },
  summaryLabel: { fontSize: 12, marginTop: 2 },
  sectionLabel: { fontSize: 12, fontWeight: '700', marginBottom: 8, textTransform: 'uppercase' },
  chipsWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  subjectChip: { borderWidth: 1, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 6 },
  subjectChipText: { fontSize: 12, fontWeight: '700' },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  emptyCard: { borderWidth: 1, borderRadius: 14, padding: 14 },
  emptyText: { fontSize: 13 },
  recordCard: { borderWidth: 1, borderRadius: 14, padding: 12, marginBottom: 10 },
  recordTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  recordSubject: { fontSize: 15, fontWeight: '800', flex: 1, paddingRight: 8 },
  statusPill: { fontSize: 12, fontWeight: '800', textTransform: 'uppercase' },
  recordMeta: { fontSize: 12, marginTop: 4 },
});
