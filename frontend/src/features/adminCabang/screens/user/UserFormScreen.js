// FEATURES PATH: features/adminCabang/screens/user/UserFormScreen.js
// DESC: Form create/update user admin cabang dengan dropdown wilbin & shelter sesuai cabang sendiri

import React, { useCallback, useEffect, useMemo, useState } from 'react';
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

import { adminCabangUserManagementApi } from '../../api/adminCabangUserManagementApi';
import { useAuth } from '../../../../common/hooks/useAuth';

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

const pickProfileCabangId = (profile) => {
  if (!profile) return '';
  return (
    profile?.kacab?.id_kacab ??
    profile?.kacab?.id ??
    profile?.id_kacab ??
    profile?.kacab_id ??
    ''
  );
};

const UserFormScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { profile } = useAuth();
  const mode = route.params?.mode || 'create';
  const defaultLevel = useMemo(() => {
    const requested = route.params?.defaultLevel;
    if (requested && LEVEL_OPTIONS.find((opt) => opt.key === requested)) {
      return requested;
    }
    return 'admin_cabang';
  }, [route.params?.defaultLevel]);
  const editingId = route.params?.idUsers || null;

  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [level, setLevel] = useState(defaultLevel);
  const [nama_lengkap, setNamaLengkap] = useState('');
  const [alamat, setAlamat] = useState('');
  const [no_hp, setNoHp] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const [kacabName, setKacabName] = useState('');
  const [id_kacab, setIdKacab] = useState('');
  const [wilbinList, setWilbinList] = useState([]);
  const [shelterList, setShelterList] = useState([]);
  const [id_wilbin, setIdWilbin] = useState('');
  const [id_shelter, setIdShelter] = useState('');

  const [loadingDropdown, setLoadingDropdown] = useState(false);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [apiError, setApiError] = useState('');

  useEffect(() => {
    const cabangId = pickProfileCabangId(profile);
    setIdKacab(cabangId ? String(cabangId) : '');
    setKacabName(profile?.kacab?.nama_cabang || profile?.nama_cabang || 'Cabang Anda');
  }, [profile]);

  const fetchWilbinDropdown = useCallback(async (kacabId) => {
    if (!kacabId) {
      setWilbinList([]);
      return;
    }
    try {
      setLoadingDropdown(true);
      const res = await adminCabangUserManagementApi.getWilbinDropdown(kacabId);
      const list = res?.data?.data || res?.data || [];
      setWilbinList(Array.isArray(list) ? list : []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingDropdown(false);
    }
  }, []);

  const fetchShelterOptions = useCallback(async (wilbinId, { preserveSelection } = {}) => {
    if (!wilbinId) {
      setShelterList([]);
      if (!preserveSelection) setIdShelter('');
      return;
    }
    try {
      setLoadingDropdown(true);
      const res = await adminCabangUserManagementApi.getShelterByWilbin(wilbinId);
      const list = res?.data?.data || res?.data || [];
      setShelterList(Array.isArray(list) ? list : []);
      if (!preserveSelection) {
        setIdShelter('');
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingDropdown(false);
    }
  }, []);

  const fetchDetail = useCallback(async () => {
    if (!editingId) return;
    try {
      setLoadingDetail(true);
      const res = await adminCabangUserManagementApi.getUserDetail(editingId);
      const container = res?.data?.data || res?.data || {};
      const user = container?.user || container || {};
      const profileData =
        container?.profile ||
        container?.admin_cabang ||
        container?.admin_shelter ||
        {};

      setUsername(user?.username || '');
      setEmail(user?.email || '');
      setLevel(user?.level && LEVEL_OPTIONS.find((opt) => opt.key === user.level) ? user.level : defaultLevel);
      setNamaLengkap(profileData?.nama_lengkap || '');
      setAlamat(profileData?.alamat || '');
      setNoHp(profileData?.no_hp || '');

      const cabangIdDetail = profileData?.id_kacab ?? profileData?.kacab_id ?? null;
      if (cabangIdDetail) {
        setIdKacab(String(cabangIdDetail));
      }
      if (profileData?.nama_cabang) {
        setKacabName(profileData.nama_cabang);
      }

      const wilbinIdDetail = profileData?.id_wilbin ?? profileData?.wilbin_id ?? null;
      if (wilbinIdDetail) {
        const wilbinIdString = String(wilbinIdDetail);
        setIdWilbin(wilbinIdString);
        await fetchShelterOptions(wilbinIdString, { preserveSelection: true });
        const shelterIdDetail = profileData?.id_shelter ?? profileData?.shelter_id ?? null;
        if (shelterIdDetail) {
          setIdShelter(String(shelterIdDetail));
        }
      }
    } catch (err) {
      const msg = err?.response?.data?.message || err?.message || 'Gagal memuat detail user';
      Alert.alert('Error', String(msg));
    } finally {
      setLoadingDetail(false);
    }
  }, [defaultLevel, editingId, fetchShelterOptions]);

  useEffect(() => {
    if (!id_kacab) {
      setWilbinList([]);
      setIdWilbin('');
      setShelterList([]);
      setIdShelter('');
      return;
    }
    fetchWilbinDropdown(id_kacab);
  }, [id_kacab, fetchWilbinDropdown]);

  useEffect(() => {
    if (mode === 'edit' && editingId) {
      fetchDetail();
    }
  }, [mode, editingId, fetchDetail]);

  const handleWilbinChange = useCallback(
    (value) => {
      setIdWilbin(value);
      if (value) {
        fetchShelterOptions(value);
      } else {
        setShelterList([]);
        setIdShelter('');
      }
    },
    [fetchShelterOptions]
  );

  useEffect(() => {
    if (level !== 'admin_shelter') {
      setIdWilbin('');
      setIdShelter('');
    }
  }, [level]);

  const onSubmit = async () => {
    if (!username || !email || (!editingId && !password) || !level) {
      Alert.alert('Validasi', 'Username, email, password (untuk create), dan level wajib diisi');
      return;
    }

    if (!id_kacab) {
      Alert.alert('Validasi', 'Data cabang tidak ditemukan. Hubungi admin pusat.');
      return;
    }

    if (level === 'admin_shelter' && (!id_wilbin || !id_shelter)) {
      Alert.alert('Validasi', 'Pilih wilbin dan shelter untuk admin shelter');
      return;
    }

    try {
      setSubmitting(true);
      setApiError('');
      const payload = { username, email, level, nama_lengkap, alamat, no_hp, id_kacab };
      if (password) payload.password = password;
      if (level === 'admin_shelter') {
        payload.id_wilbin = id_wilbin;
        payload.id_shelter = id_shelter;
      }

      let res;
      if (mode === 'edit' && editingId) {
        res = await adminCabangUserManagementApi.updateUser(editingId, payload);
      } else {
        res = await adminCabangUserManagementApi.createUser(payload);
      }

      if (res?.data?.status || res?.status === 200) {
        Alert.alert('Sukses', `User berhasil ${mode === 'edit' ? 'diupdate' : 'dibuat'}`, [
          { text: 'OK', onPress: () => navigation.goBack() },
        ]);
      } else {
        const msg = res?.data?.message || `Gagal ${mode === 'edit' ? 'mengupdate' : 'membuat'} user`;
        setApiError(String(msg));
        Alert.alert('Gagal', msg);
      }
    } catch (err) {
      const msg = err?.response?.data?.message || err?.message || `Gagal ${mode === 'edit' ? 'mengupdate' : 'membuat'} user`;
      setApiError(String(msg));
      Alert.alert('Error', String(msg));
    } finally {
      setSubmitting(false);
    }
  };

  const cabangInfo = kacabName || 'Cabang Anda';

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.select({ ios: 'padding', android: 'height' })}
        keyboardVerticalOffset={Platform.select({ ios: 64, android: 90 })}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
          <ScrollView
            style={styles.scroll}
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
          >
            <View style={styles.contentWrap}>
              <View style={styles.headerCard}>
                <View style={styles.headerIconWrap}>
                  <Ionicons name="people" size={22} color="#fff" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.title}>{mode === 'create' ? 'Tambah User Cabang' : 'Edit User Cabang'}</Text>
                  <Text style={styles.subtitle}>Kelola akses admin cabang & shelter di cabang Anda</Text>
                </View>
              </View>

              <View style={styles.body}>
                {loadingDetail && (
                  <View style={styles.loadingOverlay}>
                    <ActivityIndicator size="large" color={THEME.primary} />
                  </View>
                )}

                {/* Card: Level */}
                <View style={styles.card}>
                  <Text style={styles.cardTitle}>Level</Text>
                  <LevelPicker value={level} onChange={setLevel} />
                </View>

                {/* Card: Data Akun */}
                <View style={styles.card}>
                  <Text style={styles.cardTitle}>Data Akun</Text>
                  <FormRow label="Username">
                    <TextInput style={styles.input} value={username} onChangeText={setUsername} placeholder="username" />
                  </FormRow>
                  <FormRow label="Email">
                    <TextInput style={styles.input} value={email} onChangeText={setEmail} placeholder="email@example.com" autoCapitalize="none" />
                  </FormRow>
                  <FormRow label="Password">
                    <View style={[styles.input, styles.passwordInputWrapper]}>
                      <TextInput
                        style={styles.passwordInput}
                        value={password}
                        onChangeText={setPassword}
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
                  </FormRow>
                </View>

                {/* Card: Profil */}
                <View style={styles.card}>
                  <Text style={styles.cardTitle}>Profil (Opsional)</Text>
                  <FormRow label="Nama Lengkap">
                    <TextInput style={styles.input} value={nama_lengkap} onChangeText={setNamaLengkap} placeholder="Nama lengkap" />
                  </FormRow>
                  <FormRow label="Alamat">
                    <TextInput style={[styles.input, styles.multiline]} value={alamat} onChangeText={setAlamat} placeholder="Alamat" multiline />
                  </FormRow>
                  <FormRow label="No HP">
                    <TextInput style={styles.input} value={no_hp} onChangeText={setNoHp} placeholder="08xxxxxxxxxx" keyboardType="phone-pad" />
                  </FormRow>
                </View>

                {/* Card: Relasi Cabang */}
                <View style={styles.card}>
                  <Text style={styles.cardTitle}>Relasi Cabang</Text>
                  <FormRow label="Cabang">
                    <View style={styles.readonlyBox}>
                      <Ionicons name="business" size={16} color={THEME.textMuted} style={{ marginRight: 6 }} />
                      <Text style={styles.readonlyText}>{cabangInfo}</Text>
                    </View>
                    <Text style={styles.helperText}>User otomatis terhubung ke cabang Anda.</Text>
                  </FormRow>

                  {level === 'admin_shelter' && (
                    <>
                      <FormRow label="Wilbin">
                        {loadingDropdown ? (
                          <ActivityIndicator />
                        ) : (
                          <Picker selectedValue={id_wilbin} onValueChange={handleWilbinChange}>
                            <Picker.Item label="-- Pilih Wilbin --" value="" />
                            {wilbinList.map((w) => (
                              <Picker.Item key={w.id_wilbin || w.id} label={w.nama_wilbin} value={String(w.id_wilbin || w.id)} />
                            ))}
                          </Picker>
                        )}
                      </FormRow>

                      <FormRow label="Shelter">
                        {loadingDropdown ? (
                          <ActivityIndicator />
                        ) : (
                          <Picker selectedValue={id_shelter} onValueChange={setIdShelter} enabled={!!id_wilbin}>
                            <Picker.Item label="-- Pilih Shelter --" value="" />
                            {shelterList.map((s) => (
                              <Picker.Item key={s.id_shelter || s.id} label={s.nama_shelter} value={String(s.id_shelter || s.id)} />
                            ))}
                          </Picker>
                        )}
                      </FormRow>
                    </>
                  )}
                </View>

                {!!apiError && (
                  <View style={styles.errorBanner}>
                    <Ionicons name="alert-circle" size={18} color="#fff" />
                    <Text style={styles.errorText}>{apiError}</Text>
                  </View>
                )}
              </View>
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
  scroll: { flex: 1, backgroundColor: THEME.bg },
  scrollContent: { flexGrow: 1, padding: 20, paddingBottom: 40 },
  contentWrap: { flexGrow: 1, width: '100%', gap: 20 },
  body: { flexGrow: 1, gap: 16, position: 'relative' },
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
  levelRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  levelPill: { backgroundColor: '#f0f0f0', paddingVertical: 10, paddingHorizontal: 12, borderRadius: 999 },
  levelPillActive: { backgroundColor: THEME.primaryAlt },
  levelPillText: { color: '#444', fontWeight: '600' },
  levelPillTextActive: { color: THEME.primary },
  errorBanner: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: THEME.danger, paddingVertical: 12, paddingHorizontal: 14, borderRadius: 12 },
  errorText: { color: '#fff', flex: 1 },
  footerBar: { marginTop: 24, width: '100%', backgroundColor: THEME.card, padding: 20, borderRadius: 16, elevation: 2 },
  submitBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: THEME.primary, paddingVertical: 16, borderRadius: 12, gap: 8, width: '100%' },
  submitText: { color: '#fff', fontWeight: '700' },
  readonlyBox: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: THEME.border, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 12, backgroundColor: '#fafafa' },
  readonlyText: { color: THEME.text, fontWeight: '600', flex: 1 },
  helperText: { color: THEME.textMuted, fontSize: 12, marginTop: 6 },
  loadingOverlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 10, backgroundColor: 'rgba(255,255,255,0.7)', alignItems: 'center', justifyContent: 'center', borderRadius: 16 },
});

export default UserFormScreen;
