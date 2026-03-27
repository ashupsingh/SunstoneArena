import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { useTheme } from '../../context/ThemeContext';
import { Ionicons } from '@expo/vector-icons';

export default function WelcomeScreen() {
  const router = useRouter();
  const { colors, theme } = useTheme();

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      
      <View style={styles.heroContainer}>
        <View style={[styles.logoBox, { backgroundColor: theme === 'dark' ? '#1e293b' : '#0f172a' }]}>
          <Ionicons name="code-slash" size={48} color={colors.primary} />
        </View>
        <View style={styles.titleRow}>
          <Text style={[styles.titleText, { color: colors.text }]}>Syntax</Text>
          <Text style={[styles.titleText, { color: colors.primary }]}>Error</Text>
        </View>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>Modern Campus Platform</Text>
      </View>

      <View style={styles.cardContainer}>
        <Text style={[styles.label, { color: colors.textSecondary }]}>Get Started</Text>

        <TouchableOpacity 
          style={[styles.roleCard, { backgroundColor: colors.surface, borderColor: colors.border }]} 
          onPress={() => router.push({ pathname: '/(auth)/login', params: { role: 'student' } })}
        >
          <View style={[styles.iconBox, { backgroundColor: 'rgba(79, 70, 229, 0.1)' }]}>
            <Ionicons name="school" size={28} color={colors.primary} />
          </View>
          <View style={styles.roleTextContainer}>
            <Text style={[styles.roleTitle, { color: colors.text }]}>Student Login</Text>
            <Text style={[styles.roleDesc, { color: colors.textSecondary }]}>Access your schedule & grades</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color={colors.border} />
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.roleCard, { backgroundColor: colors.surface, borderColor: colors.border }]} 
          onPress={() => router.push({ pathname: '/(auth)/login', params: { role: 'teacher' } })}
        >
          <View style={[styles.iconBox, { backgroundColor: 'rgba(79, 70, 229, 0.1)' }]}>
            <Ionicons name="laptop-outline" size={28} color={colors.primary} />
          </View>
          <View style={styles.roleTextContainer}>
            <Text style={[styles.roleTitle, { color: colors.text }]}>Teacher Login</Text>
            <Text style={[styles.roleDesc, { color: colors.textSecondary }]}>Manage your department</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color={colors.border} />
        </TouchableOpacity>
      </View>
      
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
    justifyContent: 'space-between',
  },
  heroContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoBox: {
    width: 96,
    height: 96,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 6,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  titleText: {
    fontSize: 38,
    fontWeight: '900',
    letterSpacing: -1,
  },
  subtitle: {
    fontSize: 16,
    fontWeight: '500',
    letterSpacing: 0.5,
  },
  cardContainer: {
    width: '100%',
    paddingBottom: 40,
  },
  label: {
    fontSize: 14,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1.2,
    marginBottom: 16,
    marginLeft: 4,
  },
  roleCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    borderRadius: 24,
    marginBottom: 16,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 2,
  },
  iconBox: {
    width: 56,
    height: 56,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  roleTextContainer: {
    flex: 1,
  },
  roleTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 4,
  },
  roleDesc: {
    fontSize: 14,
  },
});
