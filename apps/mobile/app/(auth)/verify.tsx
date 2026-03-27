import React, { useState, useRef } from 'react';
import { View, Text, TextInput, StyleSheet, TouchableOpacity, KeyboardAvoidingView, Platform, ActivityIndicator, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useAuth } from '../../context/AuthContext';
import { apiClient } from '../../config/api';
import { useTheme } from '../../context/ThemeContext';

export default function VerifyScreen() {
  const { email } = useLocalSearchParams<{ email: string }>();
  const router = useRouter();
  const { signIn } = useAuth();
  const { colors } = useTheme();

  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const inputs = useRef<Array<TextInput | null>>([]);

  const handleOtpChange = (text: string, index: number) => {
    const newOtp = [...otp];
    newOtp[index] = text;
    setOtp(newOtp);

    // Auto-advance to next input
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
      Alert.alert('Error', 'Please enter a valid 6-digit OTP');
      return;
    }

    setLoading(true);
    try {
      const response = await apiClient.post('/auth/signup', { email, otp: otpString });
      
      await signIn(response.data.token, {
        _id: response.data._id,
        name: response.data.name,
        email: response.data.email,
        role: response.data.role,
        isApproved: response.data.isApproved,
        profilePicture: response.data.profilePicture,
        enrollmentNumber: response.data.enrollmentNumber,
      });
      // AuthContext will automatically route them appropriately (tabs or pending)

    } catch (error: any) {
      console.log('OTP Verify Error:', JSON.stringify(error.response?.data));
      Alert.alert('Verification Failed', error.response?.data?.message || 'Invalid OTP');
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
            <Ionicons name="mail-open-outline" size={40} color={colors.primary} />
          </View>
          <Text style={[styles.title, { color: colors.text }]}>Check your email</Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>We sent a 6-digit code to</Text>
          <Text style={[styles.emailText, { color: colors.primary }]}>{email}</Text>
        </View>

        <View style={styles.otpContainer}>
          {otp.map((digit, index) => (
            <TextInput
              key={index}
              ref={(ref) => { inputs.current[index] = ref; }}
              style={[styles.otpInput, { 
                backgroundColor: colors.surface, 
                borderColor: digit ? colors.primary : colors.border, 
                color: colors.text 
              }]}
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
              <Text style={styles.verifyButtonText}>Verify Account</Text>
              <Ionicons name="checkmark-circle" size={20} color="#fff" />
            </View>
          )}
        </TouchableOpacity>

        <View style={styles.footer}>
          <Text style={[styles.footerText, { color: colors.textSecondary }]}>Entered the wrong email? </Text>
          <TouchableOpacity onPress={() => router.back()}>
            <Text style={[styles.footerLink, { color: colors.primary }]}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </View>
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
