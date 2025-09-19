// FEATURES PATH: features/adminPusat/screens/user/UserFormScreen.js
// DESC: Screen form untuk create / update user baru (dengan dropdown berjenjang kacab → wilbin → shelter)

import React, { useState, useEffect } from 'react';
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

  const [kacabList, setKacabList] = useState([]);
  const [wilbinList, setWilbinList] = useState([]);
  const [shelterList, setShelterList] = useState([]);

  const [id_kacab, setIdKacab] = useState('');
  const [id_wilbin, setIdWilbin] = useState('');
  const [id_shelter, setIdShelter] = useState('');

  const [loadingDropdown, setLoadingDropdown] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [apiError, setApiError] = useState('');

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
    if (!username || !email || (!editingId && !password) || !level) {
      Alert.alert('Validasi', 'Username, email, password (untuk create), dan level wajib diisi');
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
      const payload = { username, email, level, nama_lengkap, alamat, no_hp };
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

  return (
    <SafeAreaView style={styles.safe}> 
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.select({ ios: 'padding', android: 'height' })}
        keyboardVerticalOffset={Platform.select({ ios: 64, android: 0 })}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
          <View style={styles.container}>
            <View style={styles.headerCard}>
              <View style={styles.headerIconWrap}>
                <Ionicons name="people" size={22} color="#fff" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.title}>{mode === 'create' ? 'Tambah User' : 'Edit User'}</Text>
                <Text style={styles.subtitle}>Isi data pengguna untuk akses admin pusat/cabang/shelter</Text>
              </View>
            </View>

            <ScrollView
              style={styles.scroll}
              contentContainerStyle={styles.scrollContent}
              keyboardShouldPersistTaps="handled"
            >
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
                  <TextInput style={styles.input} value={email} onChangeText={setEmail} placeholder="email@example.com" />
                </FormRow>
                <FormRow label="Password">
                  <TextInput style={styles.input} value={password} onChangeText={setPassword} placeholder="min 6 karakter" secureTextEntry />
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
                  <TextInput style={styles.input} value={no_hp} onChangeText={setNoHp} placeholder="08xxxxxxxxxx" />
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

              <View style={{ height: 16 }} />
            </ScrollView>

            <View style={styles.footerBar}>
              <TouchableOpacity style={[styles.submitBtn, submitting && { opacity: 0.7 }]} disabled={submitting} onPress={onSubmit}>
                <Ionicons name="save" size={18} color="#fff" />
                <Text style={styles.submitText}>{submitting ? 'Menyimpan...' : 'Simpan'}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: THEME.bg },
  flex: { flex: 1 },
  container: { flex: 1, backgroundColor: THEME.bg },
  scroll: { flex: 1 },
  scrollContent: { padding: 16, paddingBottom: 24 },
  headerCard: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: THEME.card, margin: 16, marginBottom: 8, padding: 16, borderRadius: 12, elevation: 2 },
  headerIconWrap: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#2ecc71', alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: 18, fontWeight: 'bold', color: THEME.text },
  subtitle: { color: THEME.textMuted, marginTop: 2 },
  card: { backgroundColor: THEME.card, borderRadius: 12, padding: 16, marginHorizontal: 16, marginTop: 12, elevation: 2 },
  cardTitle: { fontSize: 16, fontWeight: '700', color: THEME.text, marginBottom: 10 },
  formRow: { marginBottom: 12 },
  label: { marginBottom: 6, color: THEME.text, fontWeight: '600' },
  input: { borderWidth: 1, borderColor: THEME.border, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 12, backgroundColor: THEME.inputBg, color: THEME.text },
  multiline: { minHeight: 80, textAlignVertical: 'top' },
  levelRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  levelPill: { backgroundColor: '#f0f0f0', paddingVertical: 10, paddingHorizontal: 12, borderRadius: 999 },
  levelPillActive: { backgroundColor: THEME.primaryAlt },
  levelPillText: { color: '#444', fontWeight: '600' },
  levelPillTextActive: { color: THEME.primary },
  errorBanner: { flexDirection: 'row', alignItems: 'center', gap: 8, marginHorizontal: 16, marginTop: 12, backgroundColor: THEME.danger, paddingVertical: 10, paddingHorizontal: 12, borderRadius: 10 },
  errorText: { color: '#fff', flex: 1 },
  footerBar: { backgroundColor: THEME.card, padding: 12, borderTopWidth: 1, borderTopColor: THEME.border },
  submitBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: THEME.primary, paddingVertical: 14, borderRadius: 10, gap: 8 },
  submitText: { color: '#fff', fontWeight: '700' },
});

export default UserFormScreen;