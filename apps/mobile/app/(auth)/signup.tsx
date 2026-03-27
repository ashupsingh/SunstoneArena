import React, { useEffect, useState } from 'react';
import { View, Text, TextInput, StyleSheet, TouchableOpacity, KeyboardAvoidingView, Platform, ActivityIndicator, Alert, ScrollView, Modal } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { apiClient } from '../../config/api';
import { useTheme } from '../../context/ThemeContext';

export default function SignupScreen() {
  const { role: initialRoleParam } = useLocalSearchParams<{ role?: string | string[] }>();
  const router = useRouter();
  const { colors } = useTheme();

  const initialRole = Array.isArray(initialRoleParam) ? initialRoleParam[0] : initialRoleParam;

  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);

  // Form State
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [role, setRole] = useState((initialRole === 'teacher' ? 'teacher' : 'student') as 'student' | 'teacher');
  const [departmentName, setDepartmentName] = useState('');
  const [enrollmentNumber, setEnrollmentNumber] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [departments, setDepartments] = useState<Array<{ _id: string; name: string; code: string }>>([]);
  const [deptModalVisible, setDeptModalVisible] = useState(false);

  useEffect(() => {
    const loadDepartments = async () => {
      try {
        const { data } = await apiClient.get('/departments');
        setDepartments(Array.isArray(data) ? data : []);
      } catch (_error) {
        setDepartments([]);
      }
    };

    loadDepartments();
  }, []);

  const isStudent = role === 'student';
  // Standardized flow:
  // 1: Name & Email
  // 2: Password & Phone
  // 3: Role & Department
  // 4: Enrollment (skipped if teacher -> go to 5)
  // 5: Review & Final Submit

  const handleNext = () => {
    const newErrors: Record<string, string> = {};
    if (step === 1) {
      if (!name) newErrors.name = 'Full name is required';
      if (!email) {
        newErrors.email = 'Email address is required';
      } else {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) newErrors.email = 'Please enter a valid email address';
      }
      if (Object.keys(newErrors).length > 0) return setErrors(newErrors);
      setErrors({});
      setStep(2);
    } else if (step === 2) {
      if (!phoneNumber) newErrors.phoneNumber = 'Phone number is required';
      if (!password) {
        newErrors.password = 'Password is required';
      } else {
        const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#^()_\-+=])[A-Za-z\d@$!%*?&#^()_\-+=]{8,}$/;
        if (!passwordRegex.test(password)) {
          newErrors.password = 'Min 8 chars with 1 uppercase, 1 lowercase, 1 number, & 1 special character';
        }
      }
      if (!confirmPassword) newErrors.confirmPassword = 'Please confirm your password';
      else if (password !== confirmPassword) newErrors.confirmPassword = 'Passwords do not match';
      
      if (Object.keys(newErrors).length > 0) return setErrors(newErrors);
      setErrors({});
      setStep(3);
    } else if (step === 3) {
      if (!role) newErrors.role = 'Role selection is required';
      if (!departmentName) newErrors.departmentName = 'Department name is required';
      if (Object.keys(newErrors).length > 0) return setErrors(newErrors);
      setErrors({});
      if (role === 'student') setStep(4);
      else setStep(5);
    } else if (step === 4) {
      if (!enrollmentNumber) newErrors.enrollmentNumber = 'Enrollment Number is required specifically for students';
      if (Object.keys(newErrors).length > 0) return setErrors(newErrors);
      setErrors({});
      setStep(5);
    }
  };

  const handleBack = () => {
    if (step === 1) router.back();
    else if (step === 5 && role === 'teacher') setStep(3);
    else setStep(step - 1);
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const payload: any = { name, email, password, departmentName, phoneNumber, role };
      if (role === 'student') payload.enrollmentNumber = enrollmentNumber;

      const response = await apiClient.post('/auth/send-otp', payload);
      const devOtp = response?.data?.devOtp;

      if (devOtp) {
        Alert.alert('OTP Generated', `Email is not configured on server. Use OTP: ${devOtp}`);
      } else {
        Alert.alert('Success', 'Verification OTP sent to your email!');
      }

      router.push({ pathname: '/(auth)/verify', params: { email } });
    } catch (error: any) {
      console.log('Signup Error:', JSON.stringify(error.response?.data));
      const msg = error.response?.data?.message 
        || error.response?.data?.errors?.map((e: any) => e.message).join('\n') 
        || error.message 
        || 'Something went wrong';
      Alert.alert('Signup Failed', msg);
    } finally {
      setLoading(false);
    }
  };

  const renderProgressBar = () => (
    <View style={styles.progressContainer}>
      {[...Array(5)].map((_, i) => (
        <View key={i} style={[
          styles.progressDot, 
          { backgroundColor: step >= i + 1 ? colors.primary : colors.border }
        ]} />
      ))}
    </View>
  );

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.headerRow}>
        <TouchableOpacity onPress={handleBack} style={[styles.iconButton, { backgroundColor: colors.surface }]}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        {renderProgressBar()}
        <View style={{ width: 44 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContainer} showsVerticalScrollIndicator={false}>
        
        {/* STEP 1 */}
        {step === 1 && (
          <View style={styles.stepContent}>
            <View style={styles.iconCircleTitle}>
              <Ionicons name="person-outline" size={32} color={colors.primary} />
            </View>
            <Text style={[styles.title, { color: colors.text }]}>Let's get started</Text>
            <Text style={[styles.subtitle, { color: colors.textSecondary }]}>Tell us your name and email to begin.</Text>

            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: colors.textSecondary }]}>Full Name</Text>
              <TextInput
                style={[styles.input, { backgroundColor: colors.surface, borderColor: errors.name ? colors.error : colors.border, color: colors.text }]}
                placeholder="John Doe"
                placeholderTextColor={colors.textSecondary}
                value={name}
                onChangeText={(text) => { setName(text); setErrors({...errors, name: ''}); }}
              />
              {errors.name ? <Text style={[styles.errorText, { color: colors.error }]}>{errors.name}</Text> : null}
            </View>

            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: colors.textSecondary }]}>Email Address</Text>
              <TextInput
                style={[styles.input, { backgroundColor: colors.surface, borderColor: errors.email ? colors.error : colors.border, color: colors.text }]}
                placeholder="college@domain.edu"
                placeholderTextColor={colors.textSecondary}
                keyboardType="email-address"
                autoCapitalize="none"
                value={email}
                onChangeText={(text) => { setEmail(text); setErrors({...errors, email: ''}); }}
              />
              {errors.email ? <Text style={[styles.errorText, { color: colors.error }]}>{errors.email}</Text> : null}
            </View>
          </View>
        )}

        {/* STEP 2 */}
        {step === 2 && (
          <View style={styles.stepContent}>
            <View style={styles.iconCircleTitle}>
              <Ionicons name="lock-closed-outline" size={32} color={colors.primary} />
            </View>
            <Text style={[styles.title, { color: colors.text }]}>Secure your account</Text>
            <Text style={[styles.subtitle, { color: colors.textSecondary }]}>Set a strong password and provide your phone number.</Text>

            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: colors.textSecondary }]}>Phone Number</Text>
              <TextInput
                style={[styles.input, { backgroundColor: colors.surface, borderColor: errors.phoneNumber ? colors.error : colors.border, color: colors.text }]}
                placeholder="+1 234 567 890"
                placeholderTextColor={colors.textSecondary}
                keyboardType="phone-pad"
                value={phoneNumber}
                onChangeText={(text) => { setPhoneNumber(text); setErrors({...errors, phoneNumber: ''}); }}
              />
              {errors.phoneNumber ? <Text style={[styles.errorText, { color: colors.error }]}>{errors.phoneNumber}</Text> : null}
            </View>

            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: colors.textSecondary }]}>Password</Text>
              <View style={[styles.passwordContainer, { backgroundColor: colors.surface, borderColor: errors.password ? colors.error : colors.border }]}>
                <TextInput
                  style={[styles.passwordInput, { color: colors.text }]}
                  placeholder="Min 8 characters"
                  placeholderTextColor={colors.textSecondary}
                  secureTextEntry={!showPassword}
                  value={password}
                  onChangeText={(text) => { setPassword(text); setErrors({...errors, password: ''}); }}
                />
                <TouchableOpacity style={styles.eyeIcon} onPress={() => setShowPassword(!showPassword)}>
                  <Ionicons name={showPassword ? 'eye-off' : 'eye'} size={20} color={colors.textSecondary} />
                </TouchableOpacity>
              </View>
              {errors.password ? <Text style={[styles.errorText, { color: colors.error }]}>{errors.password}</Text> : null}
            </View>

            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: colors.textSecondary }]}>Confirm Password</Text>
              <View style={[styles.passwordContainer, { backgroundColor: colors.surface, borderColor: errors.confirmPassword ? colors.error : colors.border }]}>
                <TextInput
                  style={[styles.passwordInput, { color: colors.text }]}
                  placeholder="Re-enter password"
                  placeholderTextColor={colors.textSecondary}
                  secureTextEntry={!showPassword}
                  value={confirmPassword}
                  onChangeText={(text) => { setConfirmPassword(text); setErrors({...errors, confirmPassword: ''}); }}
                />
              </View>
              {errors.confirmPassword ? <Text style={[styles.errorText, { color: colors.error }]}>{errors.confirmPassword}</Text> : null}
            </View>
          </View>
        )}

        {/* STEP 3 */}
        {step === 3 && (
          <View style={styles.stepContent}>
            <View style={styles.iconCircleTitle}>
              <Ionicons name="briefcase-outline" size={32} color={colors.primary} />
            </View>
            <Text style={[styles.title, { color: colors.text }]}>Academic Details</Text>
            <Text style={[styles.subtitle, { color: colors.textSecondary }]}>Select your role and department on campus.</Text>

            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: colors.textSecondary }]}>I am a...</Text>
              <View style={styles.roleContainer}>
                <TouchableOpacity onPress={() => setRole('student')} style={[styles.roleCard, role === 'student' ? { borderColor: colors.primary, backgroundColor: colors.primaryBg } : { borderColor: colors.border, backgroundColor: colors.surface }]}>
                  <Ionicons name="school" size={32} color={role === 'student' ? colors.primary : colors.textSecondary} />
                  <Text style={[styles.roleText, { color: role === 'student' ? colors.primary : colors.textSecondary }]}>Student</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => setRole('teacher')} style={[styles.roleCard, role === 'teacher' ? { borderColor: colors.primary, backgroundColor: colors.primaryBg } : { borderColor: colors.border, backgroundColor: colors.surface }]}>
                  <Ionicons name="laptop" size={32} color={role === 'teacher' ? colors.primary : colors.textSecondary} />
                  <Text style={[styles.roleText, { color: role === 'teacher' ? colors.primary : colors.textSecondary }]}>Teacher</Text>
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: colors.textSecondary }]}>Department Name</Text>
              <TouchableOpacity
                style={[styles.input, styles.dropdownButton, { backgroundColor: colors.surface, borderColor: errors.departmentName ? colors.error : colors.border }]}
                onPress={() => setDeptModalVisible(true)}
              >
                <Text style={{ color: departmentName ? colors.text : colors.textSecondary, fontSize: 16 }}>
                  {departmentName || 'Select department'}
                </Text>
                <Ionicons name="chevron-down" size={18} color={colors.textSecondary} />
              </TouchableOpacity>
              {errors.departmentName ? <Text style={[styles.errorText, { color: colors.error }]}>{errors.departmentName}</Text> : null}
            </View>
          </View>
        )}

        {/* STEP 4 */}
        {step === 4 && (
          <View style={styles.stepContent}>
            <View style={styles.iconCircleTitle}>
              <Ionicons name="id-card-outline" size={32} color={colors.primary} />
            </View>
            <Text style={[styles.title, { color: colors.text }]}>Student Verification</Text>
            <Text style={[styles.subtitle, { color: colors.textSecondary }]}>Enter your official university enrollment number.</Text>

            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: colors.textSecondary }]}>Enrollment Number</Text>
              <TextInput
                style={[styles.input, { backgroundColor: colors.surface, borderColor: errors.enrollmentNumber ? colors.error : colors.border, color: colors.text }]}
                placeholder="e.g. ADTU12345"
                placeholderTextColor={colors.textSecondary}
                autoCapitalize="characters"
                value={enrollmentNumber}
                onChangeText={(text) => { setEnrollmentNumber(text); setErrors({...errors, enrollmentNumber: ''}); }}
              />
              {errors.enrollmentNumber ? <Text style={[styles.errorText, { color: colors.error }]}>{errors.enrollmentNumber}</Text> : null}
            </View>
          </View>
        )}

        {/* STEP 5 */}
        {step === 5 && (
          <View style={styles.stepContent}>
            <View style={styles.iconCircleTitle}>
              <Ionicons name="checkmark-done-outline" size={32} color={colors.primary} />
            </View>
            <Text style={[styles.title, { color: colors.text }]}>Review & Submit</Text>
            <Text style={[styles.subtitle, { color: colors.textSecondary }]}>Your profile photo is disabled for now. You can add it later from profile settings.</Text>

            <View style={[styles.reviewCard, { backgroundColor: colors.surface, borderColor: colors.border }]}> 
              <View style={[styles.reviewAvatar, { backgroundColor: colors.primaryBg }]}> 
                <Text style={[styles.reviewAvatarText, { color: colors.primary }]}>{(name.trim().charAt(0) || 'U').toUpperCase()}</Text>
              </View>
              <Text style={[styles.reviewName, { color: colors.text }]}>{name || 'Your Name'}</Text>
              <Text style={[styles.reviewSub, { color: colors.textSecondary }]}>{email || 'you@example.com'}</Text>
              <Text style={[styles.reviewSub, { color: colors.textSecondary }]}>Role: {role}</Text>
              <Text style={[styles.reviewSub, { color: colors.textSecondary }]}>Department: {departmentName || 'Not selected'}</Text>
              {role === 'student' ? (
                <Text style={[styles.reviewSub, { color: colors.textSecondary }]}>Enrollment: {enrollmentNumber || 'Not provided'}</Text>
              ) : null}
            </View>

          </View>
        )}

      </ScrollView>

      {/* FOOTER BUTTONS */}
      <View style={[styles.footerContainer, { borderTopColor: colors.border, backgroundColor: colors.background }]}>
        {step < 5 ? (
          <TouchableOpacity style={[styles.primaryButton, { backgroundColor: colors.primary }]} onPress={handleNext}>
            <Text style={styles.primaryButtonText}>Next Step</Text>
            <Ionicons name="arrow-forward" size={20} color="#fff" />
          </TouchableOpacity>
        ) : (
          <TouchableOpacity style={[styles.primaryButton, { backgroundColor: colors.primary }]} onPress={handleSubmit} disabled={loading}>
            {loading ? <ActivityIndicator color="#fff" /> : (
              <>
                <Text style={styles.primaryButtonText}>Done & Submit</Text>
                <Ionicons name="checkmark-circle" size={20} color="#fff" />
              </>
            )}
          </TouchableOpacity>
        )}
      </View>

      <Modal visible={deptModalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalSheet, { backgroundColor: colors.background, borderColor: colors.border }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>Choose Department</Text>
              <TouchableOpacity onPress={() => setDeptModalVisible(false)}>
                <Ionicons name="close" size={22} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={{ paddingBottom: 20 }}>
              {departments.map((dept) => (
                <TouchableOpacity
                  key={dept._id}
                  style={[styles.deptItem, { borderColor: colors.border, backgroundColor: colors.surface }]}
                  onPress={() => {
                    setDepartmentName(dept.name);
                    setErrors({ ...errors, departmentName: '' });
                    setDeptModalVisible(false);
                  }}
                >
                  <Text style={[styles.deptName, { color: colors.text }]}>{dept.name}</Text>
                  <Text style={[styles.deptCode, { color: colors.textSecondary }]}>{dept.code}</Text>
                </TouchableOpacity>
              ))}

              {departments.length === 0 && (
                <Text style={{ color: colors.textSecondary, textAlign: 'center', marginTop: 24 }}>
                  No departments available. Please try again.
                </Text>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>

    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: 60, paddingBottom: 16 },
  iconButton: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center', shadowColor: '#000', shadowOffset: { width:0, height:2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 },
  progressContainer: { flexDirection: 'row', gap: 6 },
  progressDot: { width: 12, height: 6, borderRadius: 3 },
  scrollContainer: { padding: 24, paddingVertical: 20, flexGrow: 1 },
  stepContent: { flex: 1 },
  iconCircleTitle: { width: 64, height: 64, borderRadius: 32, backgroundColor: 'rgba(79, 70, 229, 0.1)', alignItems: 'center', justifyContent: 'center', marginBottom: 24 },
  title: { fontSize: 32, fontWeight: '800', marginBottom: 8, letterSpacing: -0.5 },
  subtitle: { fontSize: 16, lineHeight: 24, marginBottom: 40 },
  inputGroup: { marginBottom: 20 },
  label: { fontSize: 14, fontWeight: '600', marginBottom: 8 },
  input: { borderWidth: 1, borderRadius: 16, padding: 16, fontSize: 16 },
  dropdownButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  passwordContainer: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderRadius: 16, overflow: 'hidden' },
  passwordInput: { flex: 1, padding: 16, fontSize: 16 },
  eyeIcon: { padding: 16 },
  errorText: { fontSize: 12, marginTop: 4, marginLeft: 6 },
  roleContainer: { flexDirection: 'row', gap: 16 },
  roleCard: { flex: 1, borderWidth: 2, borderRadius: 20, padding: 20, alignItems: 'center', justifyContent: 'center', minHeight: 120 },
  roleText: { marginTop: 12, fontSize: 16, fontWeight: '600' },
  reviewCard: { borderWidth: 1, borderRadius: 18, padding: 18, alignItems: 'center' },
  reviewAvatar: { width: 72, height: 72, borderRadius: 36, alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  reviewAvatarText: { fontSize: 30, fontWeight: '800' },
  reviewName: { fontSize: 20, fontWeight: '700', marginBottom: 6 },
  reviewSub: { fontSize: 14, marginBottom: 4 },
  footerContainer: { padding: 24, paddingBottom: Platform.OS === 'ios' ? 40 : 24, borderTopWidth: 1 },
  primaryButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 18, borderRadius: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.15, shadowRadius: 12, elevation: 4, gap: 8 },
  primaryButtonText: { color: '#ffffff', fontSize: 18, fontWeight: '700' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.35)', justifyContent: 'flex-end' },
  modalSheet: { maxHeight: '70%', borderTopLeftRadius: 22, borderTopRightRadius: 22, borderWidth: 1, paddingHorizontal: 20, paddingTop: 16 },
  modalHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 },
  modalTitle: { fontSize: 18, fontWeight: '700' },
  deptItem: { borderWidth: 1, borderRadius: 14, padding: 14, marginBottom: 10 },
  deptName: { fontSize: 15, fontWeight: '600', marginBottom: 3 },
  deptCode: { fontSize: 12, fontWeight: '500' },
});
