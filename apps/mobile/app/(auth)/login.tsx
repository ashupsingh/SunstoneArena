import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, TouchableOpacity, KeyboardAvoidingView, Platform, ActivityIndicator, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useAuth } from '../../context/AuthContext';
import { apiClient } from '../../config/api';
import { useTheme } from '../../context/ThemeContext';

export default function LoginScreen() {
  const { role } = useLocalSearchParams<{ role?: string | string[] }>();
  const router = useRouter();
  const { signIn } = useAuth();
  const { colors } = useTheme();

  const normalizedRole = Array.isArray(role) ? role[0] : role;
  const selectedRole = normalizedRole === 'teacher' || normalizedRole === 'student' ? normalizedRole : undefined;

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{email?: string, password?: string}>({});

  const displayRole = selectedRole === 'teacher' ? 'Teacher' : 'Student';

  const handleLogin = async () => {
    const newErrors: {email?: string, password?: string} = {};
    if (!email) newErrors.email = 'Email is required';
    if (!password) newErrors.password = 'Password is required';
    
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }
    setErrors({});

    setLoading(true);
    try {
      const normalizedEmail = email.trim().toLowerCase();
      try {
        const response = await apiClient.post('/auth/login/request-otp', { email: normalizedEmail, password });

        if (response.data?.devOtp) {
          Alert.alert('OTP Generated', `Development OTP: ${response.data.devOtp}`);
        } else {
          Alert.alert('OTP Sent', 'A verification code was sent to your email.');
        }

        router.push({
          pathname: '/(auth)/verify',
          params: {
            email: normalizedEmail,
            mode: 'login',
            role: selectedRole || '',
          },
        });
      } catch (otpError: any) {
        const status = otpError?.response?.status;
        const rawMessage = typeof otpError?.response?.data === 'string' ? otpError.response.data : '';
        const routeMissing = status === 404 || rawMessage.includes('Cannot POST /api/auth/login/request-otp');

        if (!routeMissing) {
          throw otpError;
        }

        const fallbackResponse = await apiClient.post('/auth/login', { email: normalizedEmail, password });

        if (selectedRole && fallbackResponse.data.role !== selectedRole) {
          Alert.alert('Error', `This account is registered as a ${fallbackResponse.data.role}. Please select the correct login option.`);
          setLoading(false);
          return;
        }

        Alert.alert('Temporary Login Mode', 'OTP login is not available on the connected server yet, so the app used standard login for now.');

        await signIn(fallbackResponse.data.token, {
          _id: fallbackResponse.data._id,
          name: fallbackResponse.data.name,
          email: fallbackResponse.data.email,
          role: fallbackResponse.data.role,
          isApproved: fallbackResponse.data.isApproved,
          profilePicture: fallbackResponse.data.profilePicture,
          enrollmentNumber: fallbackResponse.data.enrollmentNumber,
        });
      }

    } catch (error: any) {
      console.log('Mobile Login Error:', error, error.response?.data);
      const msg = error.response?.data?.message || `Detailed Error: ${error.message || 'Unknown'}`;
      Alert.alert('Login Failed', msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.formContainer}>
        <View style={styles.header}>
          <View style={[styles.roleChip, { backgroundColor: colors.primaryBg }]}> 
            <Ionicons name={selectedRole === 'teacher' ? 'laptop-outline' : 'school-outline'} size={16} color={colors.primary} />
            <Text style={[styles.roleChipText, { color: colors.primary }]}>{displayRole} Access</Text>
          </View>
          <Text style={[styles.title, { color: colors.text }]}>Welcome Back</Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>Sign in to continue to SyntaxError.</Text>
        </View>

        <View style={styles.inputGroup}>
          <Text style={[styles.label, { color: colors.textSecondary }]}>Email Address</Text>
          <TextInput
            style={[styles.input, { backgroundColor: colors.surface, borderColor: errors.email ? colors.error : colors.border, color: colors.text }]}
            placeholder="Enter your email"
            placeholderTextColor={colors.textSecondary}
            keyboardType="email-address"
            autoCapitalize="none"
            value={email}
            onChangeText={(text) => { setEmail(text); setErrors({...errors, email: undefined}); }}
          />
          {errors.email ? <Text style={[styles.errorText, { color: colors.error }]}>{errors.email}</Text> : null}
        </View>

        <View style={styles.inputGroup}>
          <Text style={[styles.label, { color: colors.textSecondary }]}>Password</Text>
          <View style={[styles.passwordContainer, { backgroundColor: colors.surface, borderColor: errors.password ? colors.error : colors.border }]}>
            <TextInput
              style={[styles.passwordInput, { color: colors.text }]}
              placeholder="Enter your password"
              placeholderTextColor={colors.textSecondary}
              secureTextEntry={!showPassword}
              value={password}
              onChangeText={(text) => { setPassword(text); setErrors({...errors, password: undefined}); }}
            />
            <TouchableOpacity 
              style={styles.eyeIcon} 
              onPress={() => setShowPassword(!showPassword)}
            >
              <Ionicons name={showPassword ? 'eye-off' : 'eye'} size={20} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>
          {errors.password ? <Text style={[styles.errorText, { color: colors.error }]}>{errors.password}</Text> : null}
        </View>

        <TouchableOpacity style={styles.forgotPasswordContainer} onPress={() => Alert.alert('Forgot Password', 'Password recovery flow will be implemented soon.')}>
          <Text style={[styles.forgotPasswordText, { color: colors.primary }]}>Forgot Password?</Text>
        </TouchableOpacity>

        <TouchableOpacity style={[styles.loginButton, { backgroundColor: colors.primary }]} onPress={handleLogin} disabled={loading}>
          {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.loginButtonText}>Log In</Text>}
        </TouchableOpacity>

        <View style={styles.footer}>
          <Text style={[styles.footerText, { color: colors.textSecondary }]}>Don't have an account? </Text>
          <TouchableOpacity onPress={() => router.push({ pathname: '/(auth)/signup', params: { role: selectedRole || 'student' } })}>
            <Text style={[styles.footerLink, { color: colors.primary }]}>Sign Up</Text>
          </TouchableOpacity>
        </View>
        
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Text style={[styles.backButtonText, { color: colors.textSecondary }]}>Change Role</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  formContainer: { flex: 1, padding: 24, justifyContent: 'center' },
  header: { marginBottom: 40 },
  roleChip: { alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 999, marginBottom: 14, flexDirection: 'row', alignItems: 'center', gap: 6 },
  roleChipText: { fontSize: 12, fontWeight: '700' },
  title: { fontSize: 36, fontWeight: '800', marginBottom: 8, letterSpacing: -0.6 },
  subtitle: { fontSize: 16 },
  inputGroup: { marginBottom: 20 },
  label: { fontSize: 14, fontWeight: '600', marginBottom: 8 },
  input: {
    borderWidth: 1,
    borderRadius: 14,
    padding: 16,
    fontSize: 16,
  },
  passwordContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 14,
  },
  passwordInput: {
    flex: 1,
    padding: 16,
    fontSize: 16,
  },
  eyeIcon: {
    padding: 16,
  },
  errorText: {
    fontSize: 12,
    marginTop: 6,
    marginLeft: 4,
  },
  forgotPasswordContainer: {
    alignItems: 'flex-end',
    marginBottom: 20,
    marginTop: -8,
  },
  forgotPasswordText: {
    fontSize: 14,
    fontWeight: '600',
  },
  loginButton: {
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: 'center',
    marginTop: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.18,
    shadowRadius: 8,
    elevation: 4,
  },
  loginButtonText: { color: '#ffffff', fontSize: 16, fontWeight: '700' },
  footer: { flexDirection: 'row', justifyContent: 'center', marginTop: 24 },
  footerText: { fontSize: 14 },
  footerLink: { fontSize: 14, fontWeight: '700' },
  backButton: { marginTop: 32, alignItems: 'center' },
  backButtonText: { fontSize: 14, fontWeight: '600' },
});
