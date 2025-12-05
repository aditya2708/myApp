import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
  ActivityIndicator,
  TouchableOpacity,
} from 'react-native';
import { useSelector } from 'react-redux';
import PickerInput from '../../../common/components/PickerInput';
import TextInput from '../../../common/components/TextInput';
import Button from '../../../common/components/Button';
import ErrorMessage from '../../../common/components/ErrorMessage';
import { USER_ROLES } from '../../../constants/config';
import { selectUser } from '../../auth/redux/authSlice';
import { useSuperAdminUserDetail } from '../hooks/useSuperAdminUserDetail';
import { useUpdateSuperAdminUser } from '../hooks/useUpdateSuperAdminUser';
import {
  useKacabOptions,
  useShelterOptions,
  useWilbinOptions,
} from '../hooks/useSuperAdminDropdowns';
import { parsePayload } from '../utils/responseHelpers';

const ROLE_OPTIONS = [
  { label: 'Super Admin', value: USER_ROLES.SUPER_ADMIN },
  { label: 'Admin Pusat', value: USER_ROLES.ADMIN_PUSAT },
  { label: 'Admin Cabang', value: USER_ROLES.ADMIN_CABANG },
  { label: 'Admin Shelter', value: USER_ROLES.ADMIN_SHELTER },
  { label: 'Donatur', value: USER_ROLES.DONATUR },
];

const STATUS_OPTIONS = [
  { label: 'Aktif', value: 'Aktif' },
  { label: 'Tidak Aktif', value: 'Tidak Aktif' },
];

const ROLE_LABELS = ROLE_OPTIONS.reduce((acc, item) => {
  acc[item.value] = item.label;
  return acc;
}, {});

const VALID_ROLE_SLUGS = ROLE_OPTIONS.map((item) => item.value);

const formatDate = (value) => {
  if (!value) {
    return '-';
  }

  try {
    return new Date(value).toLocaleString('id-ID');
  } catch (error) {
    return value;
  }
};

const SuperAdminUserFormScreen = ({ route, navigation }) => {
  const { userId } = route.params ?? {};
  const authUser = useSelector(selectUser);
  const [roles, setRoles] = useState([]);
  const [status, setStatus] = useState('Aktif');
  const [formError, setFormError] = useState(null);
  const [fieldErrors, setFieldErrors] = useState({});
  const [profileForm, setProfileForm] = useState({
    namaLengkap: '',
    alamat: '',
    noHp: '',
  });
  const [selectedKacab, setSelectedKacab] = useState('');
  const [selectedWilbin, setSelectedWilbin] = useState('');
  const [selectedShelter, setSelectedShelter] = useState('');
  const prefillingRef = useRef(false);

  const resolvedAuthId =
    authUser?.id ?? authUser?.id_users ?? null;
  const resolvedTargetId = userId ?? null;
  const isSelfModification =
    resolvedAuthId !== null &&
    resolvedTargetId !== null &&
    String(resolvedAuthId) === String(resolvedTargetId);

  const userQuery = useSuperAdminUserDetail(userId);
  const updateMutation = useUpdateSuperAdminUser();

  const filterValidRoles = useCallback((roleItems = []) => {
    return roleItems
      .map((item) => {
        if (!item) return null;
        if (typeof item === 'string') {
          return { slug: item, scope_type: null, scope_id: null };
        }
        return {
          slug: item.slug,
          scope_type: item.scope_type ?? null,
          scope_id: item.scope_id ?? null,
        };
      })
      .filter((item) => item?.slug && VALID_ROLE_SLUGS.includes(item.slug));
  }, []);

  const requiresProfileFields = useMemo(
    () =>
      roles.some((r) =>
        [
          USER_ROLES.ADMIN_PUSAT,
          USER_ROLES.ADMIN_CABANG,
          USER_ROLES.ADMIN_SHELTER,
        ].includes(r.slug)
      ),
    [roles]
  );

  const requiresCabang = useMemo(
    () =>
      roles.some((r) =>
        [USER_ROLES.ADMIN_CABANG, USER_ROLES.ADMIN_SHELTER].includes(r.slug)
      ),
    [roles]
  );

  const requiresWilbin = useMemo(
    () => roles.some((r) => r.slug === USER_ROLES.ADMIN_SHELTER),
    [roles]
  );

  const requiresShelter = requiresWilbin;

  const shouldSendProfile = requiresProfileFields || requiresCabang || requiresWilbin;

  const clearFieldError = useCallback((key) => {
    setFieldErrors((prev) => {
      if (!prev || !prev[key]) {
        return prev;
      }

      const next = { ...prev };
      delete next[key];
      return next;
    });
  }, []);

  const applyProfileFromPayload = useCallback((profilePayload) => {
    const profileData = profilePayload || {};
    setProfileForm({
      namaLengkap:
        profileData?.nama_lengkap ??
        profileData?.nama ??
        profileData?.nama_lengkap_adm ??
        '',
      alamat:
        profileData?.alamat ??
        profileData?.alamat_adm ??
        '',
      noHp: profileData?.no_hp ?? '',
    });

    prefillingRef.current = true;
    setSelectedKacab(
      profileData?.id_kacab ? String(profileData.id_kacab) : ''
    );
    setSelectedWilbin(
      profileData?.id_wilbin ? String(profileData.id_wilbin) : ''
    );
    setSelectedShelter(
      profileData?.id_shelter ? String(profileData.id_shelter) : ''
    );
    setTimeout(() => {
      prefillingRef.current = false;
    }, 0);
  }, []);

  const handleProfileChange = useCallback(
    (field, value) => {
      setProfileForm((prev) => ({
        ...prev,
        [field]: value,
      }));
      clearFieldError(field);
      setFormError(null);
    },
    [clearFieldError]
  );

  const toggleRole = useCallback((slug) => {
    setRoles((prev) => {
      const exists = prev.find((r) => r.slug === slug);
      if (exists) {
        const next = prev.filter((r) => r.slug !== slug);
        if (!next.some((r) => r.slug === USER_ROLES.ADMIN_CABANG)) {
          setSelectedKacab('');
        }
        if (!next.some((r) => r.slug === USER_ROLES.ADMIN_SHELTER)) {
          setSelectedWilbin('');
          setSelectedShelter('');
        }
        return next;
      }
      return [...prev, { slug }];
    });
    setFormError(null);
    setFieldErrors({});
  }, []);

  const handleKacabChange = useCallback(
    (value) => {
      setSelectedKacab(value);
      clearFieldError('id_kacab');
      setFormError(null);
    },
    [clearFieldError]
  );

  const handleWilbinChange = useCallback(
    (value) => {
      setSelectedWilbin(value);
      clearFieldError('id_wilbin');
      setFormError(null);
    },
    [clearFieldError]
  );

  const handleShelterChange = useCallback(
    (value) => {
      setSelectedShelter(value);
      clearFieldError('id_shelter');
      setFormError(null);
    },
    [clearFieldError]
  );

  const { data: kacabOptions = [], isLoading: kacabLoading } = useKacabOptions();

  const {
    data: wilbinOptions = [],
    isLoading: wilbinLoading,
  } = useWilbinOptions(selectedKacab, { enabled: !!selectedKacab });

  const {
    data: shelterOptions = [],
    isLoading: shelterLoading,
  } = useShelterOptions(selectedWilbin, { enabled: !!selectedWilbin });

  const validateProfile = useCallback(() => {
    const errors = {};

    const trimmedNama = profileForm.namaLengkap?.trim();
    const trimmedAlamat = profileForm.alamat?.trim();
    const trimmedNoHp = profileForm.noHp?.trim();

    if (requiresProfileFields) {
      if (!trimmedNama) {
        errors.nama_lengkap = 'Nama lengkap wajib diisi.';
      }

      if (!trimmedAlamat) {
        errors.alamat = 'Alamat wajib diisi.';
      }

      if (!trimmedNoHp) {
        errors.no_hp = 'Nomor HP wajib diisi.';
      }
    }

    if (requiresCabang && !selectedKacab) {
      errors.id_kacab = 'Cabang wajib dipilih.';
    }

    if (requiresWilbin && !selectedWilbin) {
      errors.id_wilbin = 'Wilayah binaan wajib dipilih.';
    }

    if (requiresShelter && !selectedShelter) {
      errors.id_shelter = 'Shelter wajib dipilih.';
    }

    return errors;
  }, [
    profileForm.alamat,
    profileForm.namaLengkap,
    profileForm.noHp,
    requiresCabang,
    requiresProfileFields,
    requiresShelter,
    requiresWilbin,
    selectedKacab,
    selectedShelter,
    selectedWilbin,
  ]);

  const toNumberOrNull = (value) => {
    if (!value) {
      return null;
    }

    const parsed = Number(value);
    return Number.isNaN(parsed) ? null : parsed;
  };

  const userData = userQuery.data;
  const detailErrorMessage = userQuery.error
    ? userQuery.error?.response?.data?.message ||
      userQuery.error?.message ||
      'Tidak bisa memuat detail pengguna.'
    : null;
  const isSaving = updateMutation.isPending;

  useEffect(() => {
    if (!userData) {
      return;
    }

    const payloadRoles = Array.isArray(userData?.roles) ? userData.roles : [];
    const normalizedPayloadRoles = filterValidRoles(payloadRoles);

    if (normalizedPayloadRoles.length > 0) {
      setRoles(normalizedPayloadRoles);
      const cabangRole = normalizedPayloadRoles.find(
        (r) => r.slug === USER_ROLES.ADMIN_CABANG
      );
      const shelterRole = normalizedPayloadRoles.find(
        (r) => r.slug === USER_ROLES.ADMIN_SHELTER
      );
      if (cabangRole?.scope_id) {
        prefillingRef.current = true;
        setSelectedKacab(String(cabangRole.scope_id));
      }
      if (shelterRole?.scope_id) {
        prefillingRef.current = true;
        setSelectedShelter(String(shelterRole.scope_id));
      }
    } else if (userData?.level && VALID_ROLE_SLUGS.includes(userData.level)) {
      setRoles([{ slug: userData.level }]);
    } else {
      setRoles([]);
    }

    setStatus(userData?.status || 'Aktif');
    const profileCandidate =
      userData?.role_profiles?.[USER_ROLES.ADMIN_SHELTER] ??
      userData?.role_profiles?.[USER_ROLES.ADMIN_CABANG] ??
      userData?.role_profiles?.[USER_ROLES.ADMIN_PUSAT] ??
      userData?.profile;
    applyProfileFromPayload(profileCandidate);
    setFieldErrors({});
    setFormError(null);
  }, [applyProfileFromPayload, filterValidRoles, userData]);

  useEffect(() => {
    if (prefillingRef.current) {
      return;
    }
    setSelectedWilbin('');
    setSelectedShelter('');
  }, [selectedKacab]);

  useEffect(() => {
    if (prefillingRef.current) {
      return;
    }
    setSelectedShelter('');
  }, [selectedWilbin]);

  const handleSubmit = async () => {
    if (isSelfModification) {
      Alert.alert(
        'Tidak Diizinkan',
        'Anda tidak dapat mengubah role atau status akun sendiri.'
      );
      return;
    }

    setFormError(null);
    setFieldErrors({});

    if (!roles || roles.length === 0) {
      setFieldErrors({ roles: 'Pilih minimal satu role.' });
      setFormError('Pilih minimal satu role.');
      return;
    }

    const validationErrors = validateProfile();

    if (Object.keys(validationErrors).length > 0) {
      setFieldErrors(validationErrors);
      setFormError('Lengkapi data wajib sebelum menyimpan.');
      return;
    }

    const profilePayload = {
      nama_lengkap: profileForm.namaLengkap?.trim() || null,
      alamat: profileForm.alamat?.trim() || null,
      no_hp: profileForm.noHp?.trim() || null,
      id_kacab: toNumberOrNull(selectedKacab),
      id_wilbin: toNumberOrNull(selectedWilbin),
      id_shelter: toNumberOrNull(selectedShelter),
    };

    const normalizedRoles = roles.map((item) => {
      const slug = item.slug;
      if (slug === USER_ROLES.ADMIN_CABANG) {
        return {
          slug,
          scope_type: 'cabang',
          scope_id: toNumberOrNull(selectedKacab),
        };
      }
      if (slug === USER_ROLES.ADMIN_SHELTER) {
        return {
          slug,
          scope_type: 'shelter',
          scope_id: toNumberOrNull(selectedShelter),
        };
      }
      return { slug, scope_type: null, scope_id: null };
    });

    const primaryRole =
      normalizedRoles.find((item) => VALID_ROLE_SLUGS.includes(item.slug))
        ?.slug ?? null;

    const requestBody = {
      level: primaryRole,
      roles: normalizedRoles,
      status,
    };

    if (shouldSendProfile) {
      requestBody.profile = profilePayload;
    }

    try {
      const response = await updateMutation.mutateAsync({
        userId,
        payload: requestBody,
      });
      const payload = parsePayload(response.data);
      applyProfileFromPayload(payload?.profile);
      const payloadRoles = Array.isArray(payload?.roles) ? payload.roles : [];
      const normalizedPayloadRoles = filterValidRoles(payloadRoles);
      if (normalizedPayloadRoles.length > 0) {
        setRoles(normalizedPayloadRoles);
      } else if (payload?.level && VALID_ROLE_SLUGS.includes(payload.level)) {
        setRoles([{ slug: payload.level }]);
      } else {
        setRoles([]);
      }
      setStatus(payload?.status || status);
      setFieldErrors({});
      setFormError(null);
      Alert.alert('Berhasil', 'Perubahan role tersimpan.');
      if (navigation.canGoBack()) {
        navigation.goBack();
      }
    } catch (err) {
      console.error('Gagal menyimpan role:', err);
      const responseErrors =
        err?.response?.data?.errors || err?.response?.data?.data?.errors;
      const message =
        err?.response?.data?.message ||
        err?.response?.data?.error ||
        'Perubahan role gagal disimpan.';

      if (err?.response?.status === 422 && responseErrors && typeof responseErrors === 'object') {
        const normalizedErrors = Object.entries(responseErrors).reduce((acc, [key, value]) => {
          if (Array.isArray(value) && value.length > 0) {
            acc[key] = value[0];
          } else if (typeof value === 'string') {
            acc[key] = value;
          }
          return acc;
        }, {});
        setFieldErrors(normalizedErrors);
      } else {
        setFieldErrors({});
      }

      setFormError(message);
    }
  };

  if (userQuery.isLoading) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator size="large" color="#9b59b6" />
      </View>
    );
  }

  if (detailErrorMessage) {
    return (
      <View style={styles.loader}>
        <ErrorMessage message={detailErrorMessage} visible onRetry={userQuery.refetch} />
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled"
    >
      <View style={styles.section}>
        <Text style={styles.label}>Nama</Text>
        <Text style={styles.value}>{userData?.username || '-'}</Text>
      </View>
      <View style={styles.section}>
        <Text style={styles.label}>Email</Text>
        <Text style={styles.value}>{userData?.email || '-'}</Text>
      </View>
      <View style={styles.section}>
        <Text style={styles.label}>SSO SUB</Text>
        <Text style={styles.value}>{userData?.token_api || '-'}</Text>
      </View>
      <View style={styles.section}>
        <Text style={styles.label}>Terakhir diperbarui</Text>
        <Text style={styles.value}>{formatDate(userData?.updated_at)}</Text>
      </View>

      {isSelfModification && (
        <View style={styles.notice}>
          <Text style={styles.noticeText}>
            Anda tidak dapat mengubah role atau status akun sendiri.
          </Text>
        </View>
      )}

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Role Lokal (bisa lebih dari 1)</Text>
        <View style={styles.roleChips}>
          {ROLE_OPTIONS.map((option) => {
            const active = roles.some((r) => r.slug === option.value);
            return (
              <TouchableOpacity
                key={option.value}
                style={[styles.roleChip, active && styles.roleChipActive]}
                onPress={() => !isSelfModification && toggleRole(option.value)}
                disabled={isSelfModification}
              >
                <Text style={[styles.roleChipLabel, active && styles.roleChipLabelActive]}>
                  {option.label}
                </Text>
                <Text style={[styles.roleChipSlug, active && styles.roleChipSlugActive]}>
                  {option.value}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
        {fieldErrors.roles && <Text style={styles.errorText}>{fieldErrors.roles}</Text>}
      </View>

      <View style={styles.section}>
        <PickerInput
          label="Status"
          value={status}
          onValueChange={(value) => {
            setStatus(value);
            setFormError(null);
          }}
          items={STATUS_OPTIONS}
          placeholder="Pilih status"
          pickerProps={{ enabled: !isSelfModification }}
        />
      </View>

      {requiresProfileFields && (
        <View style={styles.sectionGroup}>
          <Text style={styles.sectionTitle}>Informasi Profil</Text>
          <TextInput
            label="Nama Lengkap"
            value={profileForm.namaLengkap}
            onChangeText={(text) => handleProfileChange('namaLengkap', text)}
            error={fieldErrors.nama_lengkap}
            disabled={isSelfModification}
          />
          <TextInput
            label="Alamat"
            value={profileForm.alamat}
            onChangeText={(text) => handleProfileChange('alamat', text)}
            error={fieldErrors.alamat}
            disabled={isSelfModification}
            multiline
            inputProps={{ numberOfLines: 3 }}
          />
          <TextInput
            label="Nomor HP"
            value={profileForm.noHp}
            onChangeText={(text) => handleProfileChange('noHp', text)}
            error={fieldErrors.no_hp}
            disabled={isSelfModification}
            inputProps={{ keyboardType: 'phone-pad' }}
          />
        </View>
      )}

      {requiresCabang && (
        <View style={styles.sectionGroup}>
          <Text style={styles.sectionTitle}>Penempatan Cabang</Text>
          <PickerInput
            label="Cabang"
            value={selectedKacab}
            onValueChange={handleKacabChange}
            items={kacabOptions}
            placeholder={
              kacabLoading ? 'Memuat cabang...' : 'Pilih cabang'
            }
            error={fieldErrors.id_kacab}
            pickerProps={{
              enabled:
                !isSelfModification &&
                !kacabLoading &&
                kacabOptions.length > 0,
            }}
          />
          {kacabLoading && (
            <Text style={styles.helperText}>Memuat daftar cabang...</Text>
          )}
        </View>
      )}

      {requiresWilbin && (
        <View style={styles.sectionGroup}>
          <Text style={styles.sectionTitle}>Wilayah Binaan & Shelter</Text>
          <PickerInput
            label="Wilayah Binaan"
            value={selectedWilbin}
            onValueChange={handleWilbinChange}
            items={wilbinOptions}
            placeholder={
              wilbinLoading ? 'Memuat wilayah binaan...' : 'Pilih wilayah binaan'
            }
            error={fieldErrors.id_wilbin}
            pickerProps={{
              enabled:
                !isSelfModification &&
                !!selectedKacab &&
                !wilbinLoading &&
                wilbinOptions.length > 0,
            }}
          />
          {wilbinLoading && (
            <Text style={styles.helperText}>Memuat daftar wilayah binaan...</Text>
          )}
          <PickerInput
            label="Shelter"
            value={selectedShelter}
            onValueChange={handleShelterChange}
            items={shelterOptions}
            placeholder={
              shelterLoading ? 'Memuat shelter...' : 'Pilih shelter'
            }
            error={fieldErrors.id_shelter}
            pickerProps={{
              enabled:
                !isSelfModification &&
                !!selectedWilbin &&
                !shelterLoading &&
                shelterOptions.length > 0,
            }}
          />
          {shelterLoading && (
            <Text style={styles.helperText}>Memuat daftar shelter...</Text>
          )}
        </View>
      )}

      {formError && (
        <ErrorMessage
          message={formError}
          visible
          onRetry={() => setFormError(null)}
          retryText="Tutup"
        />
      )}

      <Button
        title="Simpan Perubahan"
        onPress={handleSubmit}
        loading={isSaving}
        disabled={isSelfModification}
        fullWidth
      />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9f9fb',
  },
  content: {
    padding: 16,
    paddingBottom: 32,
    flexGrow: 1,
  },
  section: {
    marginBottom: 16,
  },
  sectionGroup: {
    marginBottom: 24,
    padding: 16,
    backgroundColor: '#fff',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 6,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1f2937',
    marginBottom: 12,
  },
  label: {
    fontSize: 14,
    color: '#7f8c8d',
    marginBottom: 4,
  },
  value: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2c3e50',
  },
  notice: {
    backgroundColor: '#fff8e6',
    borderColor: '#f4d03f',
    borderWidth: 1,
    borderRadius: 10,
    padding: 12,
    marginBottom: 16,
  },
  noticeText: {
    fontSize: 13,
    color: '#a67c00',
    lineHeight: 18,
  },
  roleChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -4,
  },
  roleChip: {
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#d1d5db',
    backgroundColor: '#fff',
    minWidth: '45%',
    marginHorizontal: 4,
    marginBottom: 8,
  },
  roleChipActive: {
    borderColor: '#7c3aed',
    backgroundColor: '#f3e8ff',
  },
  roleChipLabel: {
    fontSize: 15,
    fontWeight: '700',
    color: '#111827',
  },
  roleChipLabelActive: {
    color: '#5b21b6',
  },
  roleChipSlug: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 2,
  },
  roleChipSlugActive: {
    color: '#4c1d95',
  },
  loader: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  helperText: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 4,
  },
  errorText: {
    marginTop: 8,
    color: '#b91c1c',
    fontSize: 13,
  },
});

export default SuperAdminUserFormScreen;
