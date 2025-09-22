// FEATURES PATH: features/adminPusat/screens/user/UserFormScreen.js
// DESC: Screen form untuk create / update user baru (dengan dropdown berjenjang kacab → wilbin → shelter)

import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Alert,
  Platform,
  KeyboardAvoidingView,
  ScrollView,
  SafeAreaView,
  TouchableWithoutFeedback,
  Keyboard,
  ActivityIndicator,
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { userManagementApi } from '../../api/userManagementApi';

const THEME = {
  bg: '#f5f5f5',
  card: '#ffffff',
  primary: '#27ae60',
  primaryAlt: '#e8f7f0',
  danger: '#e74c3c',
  text: '#333',
  textMuted: '#666',
  border: '#e5e5e5',
  inputBg: '#fff',
};

const LEVEL_OPTIONS = [
  { key: 'admin_pusat', label: 'Admin Pusat' },
  { key: 'admin_cabang', label: 'Admin Cabang' },
  { key: 'admin_shelter', label: 'Admin Shelter' },
];

const LevelPicker = ({ value, onChange }) => (
  <View style={styles.levelRow}>
    {LEVEL_OPTIONS.map((opt) => {
      const active = value === opt.key;
      return (
        <TouchableOpacity
          key={opt.key}
          style={[styles.levelPill, active && styles.levelPillActive]}
          onPress={() => onChange(opt.key)}
        >
          <Text style={[styles.levelPillText, active && styles.levelPillTextActive]}>
            {opt.label}
          </Text>
        </TouchableOpacity>
      );
    })}
  </View>
);

const FormRow = ({ label, children }) => (
  <View style={styles.formRow}>
    <Text style={styles.label}>{label}</Text>
    {children}
  </View>
);

const UserFormScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const mode = route.params?.mode || 'create';
  const defaultLevel = route.params?.defaultLevel || 'admin_cabang';
  const editingId = route.params?.idUsers || null;

  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [level, setLevel] = useState(defaultLevel);
  const [nama_lengkap, setNamaLengkap] = useState('');
  const [alamat, setAlamat] = useState('');
  const [no_hp, setNoHp] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const [kacabList, setKacabList] = useState([]);
  const [wilbinList, setWilbinList] = useState([]);
  const [shelterList, setShelterList] = useState([]);

  const [id_kacab, setIdKacab] = useState('');
  const [id_wilbin, setIdWilbin] = useState('');
  const [id_shelter, setIdShelter] = useState('');

  const [loadingDropdown, setLoadingDropdown] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [apiError, setApiError] = useState('');
  const [formErrors, setFormErrors] = useState({});

  const setFieldError = useCallback((field, message) => {
    setFormErrors((prev) => {
      if (message) {
        if (prev[field] === message) return prev;
        return { ...prev, [field]: message };
      }
      if (!prev?.[field]) return prev;
      const next = { ...prev };
      delete next[field];
      return next;
    });
  }, []);

  const clearFieldError = useCallback(
    (field) => {
      setFieldError(field, null);
    },
    [setFieldError]
  );

  const validateField = useCallback(
    (field, rawValue) => {
      let errorMessage = '';
      const value = typeof rawValue === 'string' ? rawValue.trim() : rawValue;

      switch (field) {
        case 'username':
          if (!value) {
            errorMessage = 'Username wajib diisi';
          }
          break;
        case 'email':
          if (!value) {
            errorMessage = 'Email wajib diisi';
          } else {
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(String(value).toLowerCase())) {
              errorMessage = 'Format email tidak valid';
            }
          }
          break;
        case 'password':
          if (mode !== 'edit' && !value) {
            errorMessage = 'Password wajib diisi saat membuat user baru';
          } else if (value && String(value).length < 6) {
            errorMessage = 'Password minimal 6 karakter';
          }
          break;
        case 'nama_lengkap':
          if (!value) {
            errorMessage = 'Nama lengkap wajib diisi';
          } else if (String(value).length < 3) {
            errorMessage = 'Nama lengkap minimal 3 karakter';
          }
          break;
        case 'alamat':
          if (!value) {
            errorMessage = 'Alamat wajib diisi';
          } else if (String(value).length < 5) {
            errorMessage = 'Alamat minimal 5 karakter';
          }
          break;
        case 'no_hp':
          if (!value) {
            errorMessage = 'No HP wajib diisi';
          } else {
            const phone = String(value).replace(/[^0-9+]/g, '');
            if (!/^\+?\d{8,15}$/.test(phone)) {
              errorMessage = 'No HP harus berupa 8-15 digit angka';
            }
          }
          break;
        default:
          break;
      }

      setFieldError(field, errorMessage);
      return !errorMessage;
    },
    [mode, setFieldError]
  );

  const extractFieldErrors = (errors, fallbackMessage) => {
    const fieldErrors = {};
    const allowedFields = [
      'username',
      'email',
      'password',
      'nama_lengkap',
      'alamat',
      'no_hp',
      'id_kacab',
      'id_wilbin',
      'id_shelter',
    ];

    const assignError = (field, value) => {
      if (!value) return;
      if (Array.isArray(value)) {
        fieldErrors[field] = String(value[0]);
      } else {
        fieldErrors[field] = String(value);
      }
    };

    if (errors && typeof errors === 'object') {
      Object.entries(errors).forEach(([field, value]) => {
        if (allowedFields.includes(field)) {
          assignError(field, value);
        }
      });
    }

    if (fallbackMessage && typeof fallbackMessage === 'string') {
      const lower = fallbackMessage.toLowerCase();
      if (!fieldErrors.email && lower.includes('email')) {
        fieldErrors.email = fallbackMessage;
      }
      if (!fieldErrors.username && lower.includes('username')) {
        fieldErrors.username = fallbackMessage;
      }
      if (!fieldErrors.nama_lengkap && lower.includes('nama lengkap')) {
        fieldErrors.nama_lengkap = fallbackMessage;
      }
      if (!fieldErrors.alamat && lower.includes('alamat')) {
        fieldErrors.alamat = fallbackMessage;
      }
      if (
        !fieldErrors.no_hp &&
        (lower.includes('no hp') || lower.includes('nomor hp') || lower.includes('telepon'))
      ) {
        fieldErrors.no_hp = fallbackMessage;
      }
    }

    return fieldErrors;
  };

  useEffect(() => {
    const fetchKacab = async () => {
      try {
        setLoadingDropdown(true);
        const res = await userManagementApi.getKacab();
        setKacabList(res?.data?.data || []);
      } catch (e) {
        console.error(e);
      } finally {
        setLoadingDropdown(false);
      }
    };
    fetchKacab();
  }, []);

  useEffect(() => {
    if (!id_kacab) return;
    const fetchWilbin = async () => {
      try {
        setLoadingDropdown(true);
        const res = await userManagementApi.getWilbinByKacab(id_kacab);
        setWilbinList(res?.data?.data || []);
        setIdWilbin('');
        setShelterList([]);
        setIdShelter('');
      } catch (e) {
        console.error(e);
      } finally {
        setLoadingDropdown(false);
      }
    };
    fetchWilbin();
  }, [id_kacab]);

  useEffect(() => {
    if (!id_wilbin) return;
    const fetchShelter = async () => {
      try {
        setLoadingDropdown(true);
        const res = await userManagementApi.getShelterByWilbin(id_wilbin);
        setShelterList(res?.data?.data || []);
        setIdShelter('');
      } catch (e) {
        console.error(e);
      } finally {
        setLoadingDropdown(false);
      }
    };
    fetchShelter();
  }, [id_wilbin]);

  const onSubmit = async () => {
    const trimmedUsername = username.trim();
    const trimmedEmail = email.trim();
    const trimmedNamaLengkap = nama_lengkap.trim();
    const trimmedAlamat = alamat.trim();
    const trimmedNoHp = no_hp.trim();
    if (trimmedUsername !== username) setUsername(trimmedUsername);
    if (trimmedEmail !== email) setEmail(trimmedEmail);
    if (trimmedNamaLengkap !== nama_lengkap) setNamaLengkap(trimmedNamaLengkap);
    if (trimmedAlamat !== alamat) setAlamat(trimmedAlamat);
    if (trimmedNoHp !== no_hp) setNoHp(trimmedNoHp);

    const fieldsToValidate = {
      username: trimmedUsername,
      email: trimmedEmail,
      password,
      nama_lengkap: trimmedNamaLengkap,
      alamat: trimmedAlamat,
      no_hp: trimmedNoHp,
    };

    const validationResults = Object.entries(fieldsToValidate).map(([field, value]) =>
      validateField(field, value)
    );

    if (validationResults.includes(false) || !level) {
      Alert.alert('Validasi', 'Periksa kembali isian wajib yang masih kosong atau tidak valid.');
      return;
    }

    if (level === 'admin_cabang' && !id_kacab) {
      Alert.alert('Validasi', 'Pilih cabang (kacab)');
      return;
    }
    if (level === 'admin_shelter' && (!id_kacab || !id_wilbin || !id_shelter)) {
      Alert.alert('Validasi', 'Pilih cabang, wilbin, dan shelter');
      return;
    }

    try {
      setSubmitting(true);
      setApiError('');
      setFormErrors({});

      const payload = {
        username: trimmedUsername,
        email: trimmedEmail,
        level,
        nama_lengkap: trimmedNamaLengkap,
        alamat: trimmedAlamat,
        no_hp: trimmedNoHp,
      };
      if (password) payload.password = password;
      if (level === 'admin_cabang') payload.id_kacab = id_kacab;
      if (level === 'admin_shelter') {
        payload.id_kacab = id_kacab;
        payload.id_wilbin = id_wilbin;
        payload.id_shelter = id_shelter;
      }

      let res;
      if (mode === 'edit' && editingId) {
        res = await userManagementApi.updateUser(editingId, payload);
      } else {
        res = await userManagementApi.createUser(payload);
      }

      if (res?.data?.status) {
        Alert.alert('Sukses', `User berhasil ${mode === 'edit' ? 'diupdate' : 'dibuat'}`, [
          { text: 'OK', onPress: () => navigation.goBack() },
        ]);
        setFormErrors({});
      } else {
        const msg = res?.data?.message || `Gagal ${mode === 'edit' ? 'mengupdate' : 'membuat'} user`;
        const fieldErr = extractFieldErrors(res?.data?.errors, msg);
        if (Object.keys(fieldErr).length) {
          setFormErrors(fieldErr);
        }
        setApiError(String(msg));
        Alert.alert('Gagal', msg);
      }
    } catch (err) {
      const msg = err?.response?.data?.message || err?.message || `Gagal ${mode === 'edit' ? 'mengupdate' : 'membuat'} user`;
      const fieldErr = extractFieldErrors(err?.response?.data?.errors, msg);
      if (Object.keys(fieldErr).length) {
        setFormErrors(fieldErr);
      }
      setApiError(String(msg));
      Alert.alert('Error', String(msg));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.select({ ios: 'padding', android: 'height' })}
        keyboardVerticalOffset={Platform.select({ ios: 64, android: 0 })}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
          <ScrollView
            style={styles.flex}
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
          >
            <View style={styles.mainContent}>
              <View style={styles.headerCard}>
                <View style={styles.headerIconWrap}>
                  <Ionicons name="people" size={22} color="#fff" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.title}>{mode === 'create' ? 'Tambah User' : 'Edit User'}</Text>
                  <Text style={styles.subtitle}>Isi data pengguna untuk akses admin pusat/cabang/shelter</Text>
                </View>
              </View>

              {/* Card: Level */}
              <View style={styles.card}>
                <Text style={styles.cardTitle}>Level</Text>
                <LevelPicker value={level} onChange={setLevel} />
              </View>

              {/* Card: Data Akun */}
              <View style={styles.card}>
                <Text style={styles.cardTitle}>Data Akun</Text>
                <FormRow label="Username">
                  <TextInput
                    style={[styles.input, formErrors.username && styles.inputError]}
                    value={username}
                    onChangeText={(text) => {
                      setUsername(text);
                      clearFieldError('username');
                    }}
                    onBlur={() => validateField('username', username)}
                    placeholder="username"
                    autoCapitalize="none"
                  />
                  {formErrors.username ? <Text style={styles.fieldError}>{formErrors.username}</Text> : null}
                </FormRow>
                <FormRow label="Email">
                  <TextInput
                    style={[styles.input, formErrors.email && styles.inputError]}
                    value={email}
                    onChangeText={(text) => {
                      setEmail(text);
                      clearFieldError('email');
                    }}
                    onBlur={() => validateField('email', email)}
                    placeholder="email@example.com"
                    keyboardType="email-address"
                    autoCapitalize="none"
                  />
                  {formErrors.email ? <Text style={styles.fieldError}>{formErrors.email}</Text> : null}
                </FormRow>
                <FormRow label="Password">
                  <View
                    style={[
                      styles.input,
                      styles.passwordInputWrapper,
                      formErrors.password && styles.inputError,
                    ]}
                  >
                    <TextInput
                      style={styles.passwordInput}
                      value={password}
                      onChangeText={(text) => {
                        setPassword(text);
                        clearFieldError('password');
                      }}
                      onBlur={() => validateField('password', password)}
                      placeholder="min 6 karakter"
                      secureTextEntry={!showPassword}
                    />
                    <TouchableOpacity
                      onPress={() => setShowPassword((prev) => !prev)}
                      style={styles.passwordToggle}
                      accessibilityLabel={showPassword ? 'Sembunyikan password' : 'Tampilkan password'}
                    >
                      <Ionicons name={showPassword ? 'eye-off' : 'eye'} size={20} color={THEME.textMuted} />
                    </TouchableOpacity>
                  </View>
                  {formErrors.password ? <Text style={styles.fieldError}>{formErrors.password}</Text> : null}
                </FormRow>
              </View>

              {/* Card: Profil */}
              <View style={styles.card}>
                <Text style={styles.cardTitle}>Profil</Text>
                <FormRow label="Nama Lengkap">
                  <TextInput
                    style={[styles.input, formErrors.nama_lengkap && styles.inputError]}
                    value={nama_lengkap}
                    onChangeText={(text) => {
                      setNamaLengkap(text);
                      clearFieldError('nama_lengkap');
                    }}
                    onBlur={() => validateField('nama_lengkap', nama_lengkap)}
                    placeholder="Nama lengkap"
                  />
                  {formErrors.nama_lengkap ? (
                    <Text style={styles.fieldError}>{formErrors.nama_lengkap}</Text>
                  ) : null}
                </FormRow>
                <FormRow label="Alamat">
                  <TextInput
                    style={[styles.input, styles.multiline, formErrors.alamat && styles.inputError]}
                    value={alamat}
                    onChangeText={(text) => {
                      setAlamat(text);
                      clearFieldError('alamat');
                    }}
                    onBlur={() => validateField('alamat', alamat)}
                    placeholder="Alamat"
                    multiline
                  />
                  {formErrors.alamat ? <Text style={styles.fieldError}>{formErrors.alamat}</Text> : null}
                </FormRow>
                <FormRow label="No HP">
                  <TextInput
                    style={[styles.input, formErrors.no_hp && styles.inputError]}
                    value={no_hp}
                    onChangeText={(text) => {
                      setNoHp(text);
                      clearFieldError('no_hp');
                    }}
                    onBlur={() => validateField('no_hp', no_hp)}
                    placeholder="08xxxxxxxxxx"
                    keyboardType="phone-pad"
                  />
                  {formErrors.no_hp ? <Text style={styles.fieldError}>{formErrors.no_hp}</Text> : null}
                </FormRow>
              </View>

              {/* Card: Dropdown untuk cabang/shelter */}
              {level === 'admin_cabang' || level === 'admin_shelter' ? (
                <View style={styles.card}>
                  <Text style={styles.cardTitle}>Relasi</Text>

                  <FormRow label="Cabang">
                    {loadingDropdown ? <ActivityIndicator /> : (
                      <Picker selectedValue={id_kacab} onValueChange={setIdKacab}>
                        <Picker.Item label="-- Pilih Cabang --" value="" />
                        {kacabList.map((k) => (
                          <Picker.Item key={k.id_kacab} label={k.nama_cabang} value={k.id_kacab} />
                        ))}
                      </Picker>
                    )}
                  </FormRow>

                  {level === 'admin_shelter' && (
                    <>
                      <FormRow label="Wilbin">
                        {loadingDropdown ? <ActivityIndicator /> : (
                          <Picker selectedValue={id_wilbin} onValueChange={setIdWilbin} enabled={!!id_kacab}>
                            <Picker.Item label="-- Pilih Wilbin --" value="" />
                            {wilbinList.map((w) => (
                              <Picker.Item key={w.id_wilbin} label={w.nama_wilbin} value={w.id_wilbin} />
                            ))}
                          </Picker>
                        )}
                      </FormRow>

                      <FormRow label="Shelter">
                        {loadingDropdown ? <ActivityIndicator /> : (
                          <Picker selectedValue={id_shelter} onValueChange={setIdShelter} enabled={!!id_wilbin}>
                            <Picker.Item label="-- Pilih Shelter --" value="" />
                            {shelterList.map((s) => (
                              <Picker.Item key={s.id_shelter} label={s.nama_shelter} value={s.id_shelter} />
                            ))}
                          </Picker>
                        )}
                      </FormRow>
                    </>
                  )}
                </View>
              ) : null}

              {!!apiError && (
                <View style={styles.errorBanner}>
                  <Ionicons name="alert-circle" size={18} color="#fff" />
                  <Text style={styles.errorText}>{apiError}</Text>
                </View>
              )}
            </View>

            <View style={styles.footerBar}>
              <TouchableOpacity style={[styles.submitBtn, submitting && { opacity: 0.7 }]} disabled={submitting} onPress={onSubmit}>
                <Ionicons name="save" size={18} color="#fff" />
                <Text style={styles.submitText}>{submitting ? 'Menyimpan...' : 'Simpan'}</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: THEME.bg },
  flex: { flex: 1 },
  scrollContent: { flexGrow: 1, padding: 20, paddingBottom: 48, backgroundColor: THEME.bg },
  mainContent: { flexGrow: 1, gap: 16, width: '100%' },
  headerCard: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: THEME.card, padding: 20, borderRadius: 16, elevation: 2 },
  headerIconWrap: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#2ecc71', alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: 18, fontWeight: 'bold', color: THEME.text },
  subtitle: { color: THEME.textMuted, marginTop: 2 },
  card: { backgroundColor: THEME.card, borderRadius: 16, padding: 20, elevation: 2 },
  cardTitle: { fontSize: 16, fontWeight: '700', color: THEME.text, marginBottom: 10 },
  formRow: { marginBottom: 12 },
  label: { marginBottom: 6, color: THEME.text, fontWeight: '600' },
  input: { borderWidth: 1, borderColor: THEME.border, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 12, backgroundColor: THEME.inputBg, color: THEME.text },
  passwordInputWrapper: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 0, paddingVertical: 0 },
  passwordInput: { flex: 1, paddingHorizontal: 12, paddingVertical: 12, color: THEME.text },
  passwordToggle: { paddingHorizontal: 12, height: '100%', alignItems: 'center', justifyContent: 'center' },
  multiline: { minHeight: 80, textAlignVertical: 'top' },
  inputError: { borderColor: THEME.danger },
  fieldError: { color: THEME.danger, marginTop: 6, fontSize: 12 },
  levelRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  levelPill: { backgroundColor: '#f0f0f0', paddingVertical: 10, paddingHorizontal: 12, borderRadius: 999 },
  levelPillActive: { backgroundColor: THEME.primaryAlt },
  levelPillText: { color: '#444', fontWeight: '600' },
  levelPillTextActive: { color: THEME.primary },
  errorBanner: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: THEME.danger, paddingVertical: 12, paddingHorizontal: 16, borderRadius: 12 },
  errorText: { color: '#fff', flex: 1 },
  footerBar: { marginTop: 24, backgroundColor: THEME.card, padding: 20, borderRadius: 16, elevation: 3, width: '100%' },
  submitBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: THEME.primary, paddingVertical: 14, borderRadius: 10, gap: 8 },
  submitText: { color: '#fff', fontWeight: '700' },
});

export default UserFormScreen;