import React, { useRef, useState } from 'react';
import { View, Text, TextInput, StyleSheet, TouchableOpacity, KeyboardAvoidingView, Platform, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useAuth } from '../../context/AuthContext';
import { apiClient } from '../../config/api';
import { useTheme } from '../../context/ThemeContext';
import ThemedNoticeModal from '../../components/ThemedNoticeModal';

export default function VerifyScreen() {
  const { email, mode, role, devOtp } = useLocalSearchParams<{ email: string; mode?: string; role?: string; devOtp?: string }>();
  const router = useRouter();
  const { signIn } = useAuth();
  const { colors } = useTheme();
  const isLoginMode = mode === 'login';

  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [notice, setNotice] = useState<{ title: string; message: string; tone: 'info' | 'error' | 'success' } | null>(null);
  const inputs = useRef<Array<TextInput | null>>([]);

  const handleOtpChange = (text: string, index: number) => {
    const newOtp = [...otp];
    newOtp[index] = text.replace(/\D/g, '').slice(0, 1);
    setOtp(newOtp);

    if (text && index < 5) {
      inputs.current[index + 1]?.focus();
    }
  };

  const handleKeyPress = (e: any, index: number) => {
    if (e.nativeEvent.key === 'Backspace' && !otp[index] && index > 0) {
      inputs.current[index - 1]?.focus();
      const newOtp = [...otp];
      newOtp[index - 1] = '';
      setOtp(newOtp);
    }
  };

  const handleVerify = async () => {
    const otpString = otp.join('');
    if (otpString.length !== 6) {
      setNotice({ title: 'Invalid OTP', message: 'Please enter a valid 6-digit OTP.', tone: 'error' });
      return;
    }

    setLoading(true);
    try {
      const response = isLoginMode
        ? await apiClient.post('/auth/login/verify-otp', { email, otp: otpString })
        : await apiClient.post('/auth/signup', { email, otp: otpString });

      if (isLoginMode && role && response.data.role !== role) {
        setNotice({
          title: 'Role Mismatch',
          message: `This account is registered as a ${response.data.role}. Please select the correct login option.`,
          tone: 'error',
        });
        setLoading(false);
        return;
      }

      await signIn(response.data.token, {
        _id: response.data._id,
        name: response.data.name,
        email: response.data.email,
        role: response.data.role,
        isApproved: response.data.isApproved,
        profilePicture: response.data.profilePicture,
        enrollmentNumber: response.data.enrollmentNumber,
      });
    } catch (error: any) {
      setNotice({
        title: isLoginMode ? 'Login Verification Failed' : 'Verification Failed',
        message: error.response?.data?.message || 'Invalid OTP',
        tone: 'error',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.formContainer}>
        <TouchableOpacity onPress={() => router.back()} style={[styles.backButton, { backgroundColor: colors.surface }]}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>

        <View style={styles.header}>
          <View style={[styles.iconCircle, { backgroundColor: 'rgba(79, 70, 229, 0.1)' }]}>
            <Ionicons name={isLoginMode ? 'shield-checkmark-outline' : 'mail-open-outline'} size={40} color={colors.primary} />
          </View>
          <Text style={[styles.title, { color: colors.text }]}>{isLoginMode ? 'Verify it is you' : 'Check your email'}</Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            {isLoginMode ? 'Enter the 6-digit login code sent to' : 'We sent a 6-digit code to'}
          </Text>
          <Text style={[styles.emailText, { color: colors.primary }]}>{email}</Text>
          {devOtp ? <Text style={[styles.devOtpText, { color: colors.primary }]}>Dev OTP: {devOtp}</Text> : null}
        </View>

        <View style={styles.otpContainer}>
          {otp.map((digit, index) => (
            <TextInput
              key={index}
              ref={(ref) => { inputs.current[index] = ref; }}
              style={[styles.otpInput, { backgroundColor: colors.surface, borderColor: digit ? colors.primary : colors.border, color: colors.text }]}
              keyboardType="number-pad"
              maxLength={1}
              value={digit}
              onChangeText={(text) => handleOtpChange(text, index)}
              onKeyPress={(e) => handleKeyPress(e, index)}
              selectTextOnFocus
            />
          ))}
        </View>

        <TouchableOpacity style={[styles.verifyButton, { backgroundColor: colors.primary }]} onPress={handleVerify} disabled={loading}>
          {loading ? <ActivityIndicator color="#fff" /> : (
            <View style={styles.buttonContent}>
              <Text style={styles.verifyButtonText}>{isLoginMode ? 'Verify & Continue' : 'Verify Account'}</Text>
              <Ionicons name="checkmark-circle" size={20} color="#fff" />
            </View>
          )}
        </TouchableOpacity>

        <View style={styles.footer}>
          <Text style={[styles.footerText, { color: colors.textSecondary }]}>
            {isLoginMode ? 'Need to change login details? ' : 'Entered the wrong email? '}
          </Text>
          <TouchableOpacity onPress={() => router.back()}>
            <Text style={[styles.footerLink, { color: colors.primary }]}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </View>
      <ThemedNoticeModal
        visible={!!notice}
        title={notice?.title || ''}
        message={notice?.message || ''}
        tone={notice?.tone || 'info'}
        onClose={() => setNotice(null)}
      />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  formContainer: { flex: 1, padding: 24, justifyContent: 'center' },
  backButton: { position: 'absolute', top: 60, left: 24, width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center', zIndex: 10 },
  header: { marginBottom: 40, alignItems: 'center' },
  iconCircle: { width: 80, height: 80, borderRadius: 40, alignItems: 'center', justifyContent: 'center', marginBottom: 24 },
  title: { fontSize: 28, fontWeight: '800', marginBottom: 8, textAlign: 'center' },
  subtitle: { fontSize: 15, textAlign: 'center' },
  emailText: { fontSize: 15, fontWeight: '600', marginTop: 4 },
  devOtpText: { fontSize: 14, fontWeight: '700', marginTop: 10 },
  otpContainer: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 32, gap: 8 },
  otpInput: {
    flex: 1,
    height: 56,
    borderWidth: 1.5,
    borderRadius: 14,
    fontSize: 24,
    fontWeight: '700',
    textAlign: 'center',
  },
  verifyButton: {
    paddingVertical: 18,
    borderRadius: 16,
    alignItems: 'center',
    shadowColor: '#4f46e5',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  buttonContent: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  verifyButtonText: { color: '#ffffff', fontSize: 18, fontWeight: '700' },
  footer: { flexDirection: 'row', justifyContent: 'center', marginTop: 24 },
  footerText: { fontSize: 14 },
  footerLink: { fontSize: 14, fontWeight: '600' },
});
