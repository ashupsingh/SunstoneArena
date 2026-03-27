import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, TouchableOpacity, Alert, RefreshControl } from 'react-native';
import { apiClient } from '../../config/api';
import { useTheme } from '../../context/ThemeContext';
import { Ionicons } from '@expo/vector-icons';

interface Student {
  _id: string;
  name: string;
  email: string;
  enrollmentNumber?: string;
  rollNumber?: string;
  isFlagged: boolean;
}

export default function StudentsScreen() {
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const { colors } = useTheme();

  const fetchStudents = async () => {
    try {
      const { data } = await apiClient.get('/teacher/students');
      setStudents(data);
    } catch (error: any) {
      Alert.alert('Error', 'Failed to load students');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchStudents();
  }, []);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchStudents();
  };

  const handleFlagStudent = (studentId: string, studentName: string) => {
    Alert.prompt(
      'Flag Student',
      `Please provide a reason why ${studentName} shouldn't be in this department:`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Flag for Admin Review', 
          style: 'destructive',
          onPress: async (reason: string | undefined) => {
            if (!reason) {
              Alert.alert('Error', 'A reason is required to flag a student.');
              return;
            }
            try {
              await apiClient.post(`/teacher/students/${studentId}/flag`, { reason });
              Alert.alert('Success', 'Student has been flagged. Admins will review this.');
              fetchStudents();
            } catch (error: any) {
              Alert.alert('Error', error.response?.data?.message || 'Failed to flag student');
            }
          }
        }
      ]
    );
  };

  const renderStudent = ({ item }: { item: Student }) => (
    <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <View style={styles.cardHeader}>
        <View style={[styles.avatar, { backgroundColor: colors.primaryBg }]}>
          <Text style={[styles.avatarText, { color: colors.primary }]}>{item.name.charAt(0)}</Text>
        </View>
        <View style={styles.cardInfo}>
          <Text style={[styles.name, { color: colors.text }]}>{item.name}</Text>
          <Text style={[styles.email, { color: colors.textSecondary }]}>{item.email}</Text>
          <View style={styles.badgeRow}>
            {item.enrollmentNumber ? <Text style={[styles.badge, { backgroundColor: colors.border, color: colors.textSecondary }]}>Enrollment: {item.enrollmentNumber}</Text> : null}
            {item.rollNumber ? <Text style={[styles.badge, { backgroundColor: colors.border, color: colors.textSecondary }]}>Roll: {item.rollNumber}</Text> : null}
          </View>
        </View>
      </View>
      
      {!item.isFlagged ? (
        <TouchableOpacity style={[styles.flagButton, { backgroundColor: colors.errorBg, borderColor: colors.error }]} onPress={() => handleFlagStudent(item._id, item.name)}>
          <Ionicons name="flag" size={16} color={colors.error} style={{ marginRight: 6 }} />
          <Text style={[styles.flagButtonText, { color: colors.error }]}>Flag Student</Text>
        </TouchableOpacity>
      ) : (
        <View style={[styles.flagButton, { backgroundColor: colors.border, borderColor: colors.border }]}>
          <Ionicons name="flag" size={16} color={colors.textSecondary} style={{ marginRight: 6 }} />
          <Text style={[styles.flagButtonText, { color: colors.textSecondary }]}>Flagged for Review</Text>
        </View>
      )}
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Text style={[styles.title, { color: colors.text }]}>Department Students</Text>
      
      {loading ? (
        <View style={styles.centered}><ActivityIndicator size="large" color={colors.primary} /></View>
      ) : (
        <FlatList
          data={students}
          keyExtractor={(item) => item._id}
          renderItem={renderStudent}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={colors.primary} />}
          contentContainerStyle={{ paddingBottom: 40 }}
          ListEmptyComponent={<Text style={[styles.emptyText, { color: colors.textSecondary }]}>No students found in your department.</Text>}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingHorizontal: 20, paddingTop: 60 },
  title: { fontSize: 28, fontWeight: '800', marginBottom: 24 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyText: { textAlign: 'center', marginTop: 40, fontSize: 16 },
  card: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
  },
  cardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  avatar: {
    width: 48, height: 48, borderRadius: 24,
    alignItems: 'center', justifyContent: 'center', marginRight: 16
  },
  avatarText: { fontSize: 20, fontWeight: '700' },
  cardInfo: { flex: 1 },
  name: { fontSize: 18, fontWeight: 'bold', marginBottom: 2 },
  email: { fontSize: 14, marginBottom: 6 },
  badgeRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  badge: {
    fontSize: 11, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8, overflow: 'hidden'
  },
  flagButton: {
    borderWidth: 1, paddingVertical: 12, borderRadius: 10, alignItems: 'center', justifyContent: 'center', flexDirection: 'row'
  },
  flagButtonText: { fontWeight: '600', fontSize: 14 },
});
