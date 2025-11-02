import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Alert } from 'react-native';
import { adminShelterAnakApi } from '../api/adminShelterAnakApi';
import { adminShelterKelompokApi } from '../api/adminShelterKelompokApi';
import { 
  generateToken, 
  generateBatchTokens,
  getActiveToken,
  selectQrTokenLoading, 
  selectQrTokenError,
  resetQrTokenError
} from '../redux/qrTokenSlice';
import {
  generateTutorToken,
  selectCurrentTutorToken,
  selectTutorAttendanceLoading,
  selectTutorAttendanceError
} from '../redux/tutorAttendanceSlice';
import qrExportHelper from '../utils/qrExportHelper';

export const useQrTokenGeneration = (routeParams = {}) => {
  const dispatch = useDispatch();
  
  const { 
    id_aktivitas, 
    activityName, 
    activityDate,
    activityType,
    kelompokId,
    kelompokIds = [],
    kelompokName,
    level,
    completeActivity
  } = routeParams;
  
  const tokenLoading = useSelector(selectQrTokenLoading);
  const tokenError = useSelector(selectQrTokenError);
  const studentTokens = useSelector(state => state.qrToken.studentTokens);
  const tutorToken = useSelector(selectCurrentTutorToken);
  const tutorLoading = useSelector(selectTutorAttendanceLoading);
  const tutorError = useSelector(selectTutorAttendanceError);
  
  const [students, setStudents] = useState([]);
  const [selectedStudents, setSelectedStudents] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [validDays, setValidDays] = useState(30);
  const [expiryStrategy, setExpiryStrategy] = useState('days');
  const [exportLoading, setExportLoading] = useState(false);
  const [activityTutor, setActivityTutor] = useState(null);
  const [kelompokList, setKelompokList] = useState([]);
  const [selectedKelompokId, setSelectedKelompokId] = useState(kelompokId || '');
  const [kelompokLoading, setKelompokLoading] = useState(false);
  const [kelompokError, setKelompokError] = useState(null);
  const [isContextualMode, setIsContextualMode] = useState(!!id_aktivitas);
  const [targets, setTargets] = useState([]);

  const resolvedKelompokIds = useMemo(() => {
    const ids = [];
    if (Array.isArray(kelompokIds)) {
      ids.push(...kelompokIds.filter(Boolean));
    }
    if (kelompokId) {
      ids.push(kelompokId);
    }
    return Array.from(new Set(ids));
  }, [kelompokId, kelompokIds]);
  
  const qrRefs = useRef({}); // Unified QR refs for all targets

  const setQrRef = (targetId, ref) => {
    qrRefs.current[targetId] = ref;
  };

  useEffect(() => {
    if (completeActivity && completeActivity.tutor) {
      setActivityTutor(completeActivity.tutor);
    }
  }, [completeActivity]);
  
  // Clear token errors on mount (no active token is expected behavior)
  useEffect(() => {
    dispatch(resetQrTokenError());
  }, [dispatch]);
  
  // Context-aware detection: Auto-load data based on activity context
  useEffect(() => {
    // For contextual mode (activity-specific), set appropriate visibility
    if (isContextualMode) {
      // For Bimbel activities, don't need kelompok list (already have specific kelompok)
      if (activityType !== 'Bimbel') {
        fetchKelompokList();
      }
    } else {
      // For non-contextual mode, always fetch kelompok list for selection
      fetchKelompokList();
    }
  }, [isContextualMode, activityType, completeActivity]);
  
  useEffect(() => {
    if (isContextualMode) {
      if (activityType === 'Bimbel') {
        if (resolvedKelompokIds.length > 0) {
          fetchStudentsByKelompokIds(resolvedKelompokIds);
        } else {
          setStudents([]);
          setSelectedStudents([]);
        }
        return;
      }

      if (activityType === 'Kegiatan') {
        fetchAllStudents();
        return;
      }
    }

    if (selectedKelompokId) {
      fetchStudentsByKelompok(selectedKelompokId);
    } else {
      fetchAllStudents();
    }
  }, [
    isContextualMode,
    activityType,
    resolvedKelompokIds,
    selectedKelompokId,
    fetchStudentsByKelompokIds,
    fetchStudentsByKelompok,
    fetchAllStudents,
  ]);

  const fetchKelompokList = async () => {
    try {
      setKelompokLoading(true);
      setKelompokError(null);
      
      const response = await adminShelterKelompokApi.getAllKelompok();
      
      if (response.data && response.data.data) {
        setKelompokList(response.data.data);
      }
    } catch (error) {
      console.error('Error mengambil daftar kelompok:', error);
      setKelompokError('Gagal memuat kelompok. Silakan coba lagi.');
    } finally {
      setKelompokLoading(false);
    }
  };
  
  const queueTokenFetch = useCallback((activeStudentsList) => {
    const tokenFetchDelay = 300;

    activeStudentsList.forEach((student, index) => {
      if (!studentTokens[student.id_anak]) {
        setTimeout(() => {
          dispatch(getActiveToken(student.id_anak));
        }, tokenFetchDelay * index);
      }
    });
  }, [dispatch, studentTokens]);
  
  const fetchAllStudents = async () => {
    try {
      setLoading(true);
      setError(null);
      
      let allStudents = [];
      let currentPage = 1;
      let lastPage = 1;
      
      const initialResponse = await adminShelterAnakApi.getAllAnak({ page: 1 });
      
      if (initialResponse.data && initialResponse.data.pagination) {
        lastPage = initialResponse.data.pagination.last_page;
        allStudents = [...initialResponse.data.data];
        
        if (lastPage > 1) {
          for (let page = 2; page <= lastPage; page++) {
            const pageResponse = await adminShelterAnakApi.getAllAnak({ page });
            if (pageResponse.data && pageResponse.data.data) {
              allStudents = [...allStudents, ...pageResponse.data.data];
            }
          }
        }
        
        const activeStudents = allStudents.filter(
          student => student.status_validasi === 'aktif'
        );
        
        setStudents(activeStudents);
        setSelectedStudents([]);
        
        queueTokenFetch(activeStudents);
      }
    } catch (error) {
      console.error('Error mengambil semua siswa:', error);
      setError('Gagal memuat siswa. Silakan coba lagi.');
    } finally {
      setLoading(false);
    }
  };

  const fetchStudentsByKelompokIds = useCallback(async (idsParam) => {
    const uniqueIds = Array.from(
      new Set((Array.isArray(idsParam) ? idsParam : [idsParam]).filter(Boolean)),
    );

    if (uniqueIds.length === 0) {
      setStudents([]);
      setSelectedStudents([]);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const responses = await Promise.all(
        uniqueIds.map(id => adminShelterKelompokApi.getGroupChildren(id)),
      );

      const combinedStudents = responses.flatMap(response => {
        if (response?.data?.data && Array.isArray(response.data.data)) {
          return response.data.data;
        }
        return [];
      });

      const activeStudents = combinedStudents.filter(
        student => student.status_validasi === 'aktif',
      );

      setStudents(activeStudents);
      setSelectedStudents([]);
      queueTokenFetch(activeStudents);
    } catch (error) {
      console.error('Error mengambil siswa berdasarkan kelompok:', error);
      setError(`Gagal memuat siswa: ${error.message || 'Tidak diketahui'}`);
      setStudents([]);
    } finally {
      setLoading(false);
    }
  }, [queueTokenFetch]);
  
  const fetchStudentsByKelompok = async (kelompokIdParam) => {
    if (!kelompokIdParam) {
      setStudents([]);
      setSelectedStudents([]);
      return;
    }

    await fetchStudentsByKelompokIds([kelompokIdParam]);
  };

  const handleKelompokChange = (kelompokId) => {
    setSelectedKelompokId(kelompokId);
  };
  
  const filteredStudents = students.filter(student =>
    (student.full_name || student.nick_name || '')
      .toLowerCase()
      .includes(searchQuery.toLowerCase())
  );
  
  // Build unified targets array from students and tutor
  useEffect(() => {
    const newTargets = [];
    
    // Add tutor if assigned
    if (activityTutor) {
      newTargets.push({
        type: 'tutor',
        id: activityTutor.id_tutor,
        name: activityTutor.nama,
        data: activityTutor,
        token: tutorToken
      });
    }
    
    // Add students
    filteredStudents.forEach(student => {
      newTargets.push({
        type: 'student',
        id: student.id_anak,
        name: student.full_name || student.nick_name || 'Tidak Diketahui',
        data: student,
        token: studentTokens[student.id_anak],
        selected: selectedStudents.includes(student.id_anak)
      });
    });
    
    setTargets(newTargets);
  }, [
    filteredStudents.length, 
    activityTutor?.id_tutor,
    tutorToken,
    studentTokens, // Changed from Object.keys(studentTokens).length to full object
    selectedStudents.length
  ]);

  const toggleStudentSelection = (studentId) => {
    if (selectedStudents.includes(studentId)) {
      setSelectedStudents(selectedStudents.filter(id => id !== studentId));
    } else {
      setSelectedStudents([...selectedStudents, studentId]);
    }
  };
  
  const selectAllStudents = () => {
    if (selectedStudents.length === filteredStudents.length) {
      setSelectedStudents([]);
    } else {
      setSelectedStudents(filteredStudents.map(student => student.id_anak));
    }
  };
  
  const resolveTarget = (target) => {
    if (typeof target === 'object' && target !== null) {
      if (target.type === 'student') {
        const studentData = target.data || students.find(s => s.id_anak === target.id);
        const studentName = studentData?.full_name || studentData?.nick_name || `Siswa-${target.id}`;
        return {
          type: 'student',
          id: target.id,
          name: target.name || studentName,
          data: studentData,
          token: target.token || studentTokens[target.id]
        };
      }

      if (target.type === 'tutor') {
        const tutorName = target.name || activityTutor?.nama || `Tutor-${target.id}`;
        return {
          type: 'tutor',
          id: target.id,
          name: tutorName,
          data: target.data || activityTutor,
          token: target.token || tutorToken
        };
      }

      return target;
    }

    const studentId = target;
    const studentData = students.find(s => s.id_anak === studentId);
    const studentName = studentData?.full_name || studentData?.nick_name || `Siswa-${studentId}`;

    return {
      type: 'student',
      id: studentId,
      name: studentName,
      data: studentData,
      token: studentTokens[studentId]
    };
  };

  const handleGenerateToken = async (target) => {
    const normalizedTarget = resolveTarget(target);

    try {
      if (normalizedTarget.type === 'student') {
        await dispatch(generateToken({
          id_anak: normalizedTarget.id,
          validDays: expiryStrategy === 'days' ? validDays : undefined,
          expiryStrategy
        })).unwrap();
      } else if (normalizedTarget.type === 'tutor') {
        await dispatch(generateTutorToken({ id_tutor: normalizedTarget.id, validDays })).unwrap();
        Alert.alert('Berhasil', `Token berhasil dibuat untuk tutor: ${normalizedTarget.name}`);
      }
    } catch (error) {
      Alert.alert('Error', error.message || 'Gagal membuat token');
    }
  };

  const handleGenerateBatchTokens = async () => {
    if (selectedStudents.length === 0) {
      Alert.alert('Tidak Ada Siswa Dipilih', 'Silakan pilih minimal satu siswa.');
      return;
    }

    try {
      await dispatch(generateBatchTokens({
        studentIds: selectedStudents,
        validDays: expiryStrategy === 'days' ? validDays : undefined,
        expiryStrategy
      })).unwrap();

      Alert.alert('Berhasil', `Token berhasil dibuat untuk ${selectedStudents.length} siswa.`);
    } catch (error) {
      Alert.alert('Error', error.message || 'Gagal membuat token batch');
    }
  };


  const getQrDataUrl = async (targetId) => {
    return new Promise((resolve, reject) => {
      if (!qrRefs.current[targetId] || !qrRefs.current[targetId].getDataURL) {
        reject(new Error('QR code ref not found'));
        return;
      }
      
      qrRefs.current[targetId].getDataURL()
        .then(resolve)
        .catch(reject);
    });
  };

  const handleExportQr = async (target) => {
    const normalizedTarget = resolveTarget(target);

    try {
      const isSharingAvailable = await qrExportHelper.isSharingAvailable();
      if (!isSharingAvailable) {
        Alert.alert('Error', 'Fitur berbagi tidak tersedia di perangkat ini');
        return;
      }

      setExportLoading(true);

      if (!normalizedTarget.token) {
        Alert.alert('Error', `Tidak ada token ditemukan untuk ${normalizedTarget.type} ini`);
        return;
      }

      const base64Data = await getQrDataUrl(normalizedTarget.id);
      if (!base64Data) {
        throw new Error('Gagal membuat gambar kode QR');
      }

      const fileUri = await qrExportHelper.saveQrCodeToFile(base64Data, normalizedTarget.data);
      await qrExportHelper.shareQrCode(fileUri, {
        title: `Kode QR - ${normalizedTarget.name} (${normalizedTarget.type})`
      });
    } catch (error) {
      console.error('Error mengekspor kode QR:', error);
      Alert.alert('Error', error.message || 'Gagal mengekspor kode QR');
    } finally {
      setExportLoading(false);
    }
  };
  

  const handleExportBatchQr = async () => {
    if (selectedStudents.length === 0) {
      Alert.alert('Tidak Ada Siswa Dipilih', 'Silakan pilih minimal satu siswa.');
      return;
    }
    
    try {
      const isSharingAvailable = await qrExportHelper.isSharingAvailable();
      if (!isSharingAvailable) {
        Alert.alert('Error', 'Fitur berbagi tidak tersedia di perangkat ini');
        return;
      }

      setExportLoading(true);
      
      const qrDataArray = [];
      
      for (const studentId of selectedStudents) {
        const token = studentTokens[studentId];
        if (!token) continue;
        
        const student = students.find(s => s.id_anak === studentId);
        if (!student) continue;
        
        try {
          const base64Data = await getQrDataUrl(studentId);
          if (base64Data) {
            qrDataArray.push({ base64Data, student });
          }
        } catch (err) {
          console.error(`Error getting QR for student ${studentId}:`, err);
        }
      }
      
      if (qrDataArray.length === 0) {
        Alert.alert('Error', 'Tidak ada kode QR yang dapat dibuat');
        return;
      }
      
      const results = await qrExportHelper.processBatch(qrDataArray);
      
      const successfulExports = results.filter(r => r.success);
      const fileUris = successfulExports.map(r => r.fileUri);
      
      if (fileUris.length === 0) {
        Alert.alert('Error', 'Gagal mengekspor kode QR');
        return;
      }
      
      await qrExportHelper.handleMultipleQrCodes(fileUris);
      
    } catch (error) {
      console.error('Error mengekspor kode QR:', error);
      Alert.alert('Error', error.message || 'Gagal mengekspor kode QR');
    } finally {
      setExportLoading(false);
    }
  };

  return {
    // State
    students,
    selectedStudents,
    searchQuery,
    setSearchQuery,
    loading,
    error,
    validDays,
    setValidDays,
    expiryStrategy,
    setExpiryStrategy,
    exportLoading,
    activityTutor,
    kelompokList,
    selectedKelompokId,
    kelompokLoading,
    kelompokError,
    isContextualMode,
    targets,
    
    // Target selection helpers
    selectedTargets: selectedStudents.map(id => targets.find(t => t.id === id)).filter(Boolean),
    
    // Unified target handlers
    handleToggleTargetSelection: (target) => {
      if (target.type === 'student') {
        toggleStudentSelection(target.id);
      }
    },
    
    handleSelectAllTargets: () => {
      const studentTargets = targets.filter(t => t.type === 'student');
      if (selectedStudents.length === studentTargets.length) {
        setSelectedStudents([]);
      } else {
        setSelectedStudents(studentTargets.map(t => t.id));
      }
    },
    
    // Redux state
    tokenLoading,
    tokenError,
    studentTokens,
    tutorToken,
    tutorLoading,
    tutorError,
    
    // Route params
    id_aktivitas,
    activityName,
    activityDate,
    activityType,
    kelompokId,
    kelompokName,
    level,
    
    // Computed values
    filteredStudents,
    
    // Unified QR management
    qrRefs,
    setQrRef,
    
    // Unified handlers
    handleGenerateToken,
    handleExportQr,
    
    // Batch operations
    handleBatchGenerate: () => {
      const selectedTargets = targets.filter(t => 
        t.type === 'student' && selectedStudents.includes(t.id)
      );
      
      if (selectedTargets.length === 0) {
        Alert.alert('Tidak Ada Siswa Dipilih', 'Silakan pilih minimal satu siswa.');
        return;
      }
      
      return handleGenerateBatchTokens();
    },
    
    handleBatchExport: () => {
      const selectedTargets = targets.filter(t => 
        t.type === 'student' && selectedStudents.includes(t.id)
      );
      
      if (selectedTargets.length === 0) {
        Alert.alert('Tidak Ada Siswa Dipilih', 'Silakan pilih minimal satu siswa.');
        return;
      }
      
      return handleExportBatchQr();
    },
    
    // Legacy handlers (for compatibility)
    handleKelompokChange,
    toggleStudentSelection,
    selectAllStudents,
    handleGenerateBatchTokens,
    handleExportBatchQr,
    getQrDataUrl,
    
    // Functions
    fetchAllStudents,
    fetchStudentsByKelompok,
    fetchKelompokList
  };
};
