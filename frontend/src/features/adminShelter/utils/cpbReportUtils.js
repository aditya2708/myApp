/**
 * CPB Report utility functions
 * Contains helper functions for CPB data processing and formatting
 */

// CPB Status definitions
export const CPB_STATUS = {
  BCPB: 'BCPB',
  CPB: 'CPB', 
  NPB: 'NPB',
  PB: 'PB'
};

export const CPB_STATUS_LABELS = {
  BCPB: 'Bakal Calon Penerima Beasiswa',
  CPB: 'Calon Penerima Beasiswa',
  NPB: 'Non Penerima Beasiswa',
  PB: 'Penerima Beasiswa'
};

// CPB status color coding
export const getCpbStatusColor = (status) => {
  switch (status) {
    case CPB_STATUS.BCPB:
      return '#e67e22'; // Orange
    case CPB_STATUS.CPB:
      return '#3498db'; // Blue
    case CPB_STATUS.NPB:
      return '#95a5a6'; // Gray
    case CPB_STATUS.PB:
      return '#27ae60'; // Green
    default:
      return '#9b59b6';
  }
};

// Get CPB status priority for sorting
export const getCpbStatusPriority = (status) => {
  switch (status) {
    case CPB_STATUS.PB:
      return 1;
    case CPB_STATUS.CPB:
      return 2;
    case CPB_STATUS.BCPB:
      return 3;
    case CPB_STATUS.NPB:
      return 4;
    default:
      return 5;
  }
};

// Gender icons and colors
export const getGenderIcon = (gender) => {
  return gender === 'Laki-laki' ? 'male' : 'female';
};

export const getGenderColor = (gender) => {
  return gender === 'Laki-laki' ? '#3498db' : '#e91e63';
};

// Validate CPB status
export const isValidCpbStatus = (status) => {
  return Object.values(CPB_STATUS).includes(status);
};

// Format age display
export const formatAge = (age) => {
  if (!age) return '';
  return `${age} thn`;
};

// Sort children by CPB status priority
export const sortChildrenByCpbStatus = (children, order = 'asc') => {
  return [...children].sort((a, b) => {
    const priorityA = getCpbStatusPriority(a.status_cpb);
    const priorityB = getCpbStatusPriority(b.status_cpb);
    
    if (order === 'desc') {
      return priorityB - priorityA;
    }
    return priorityA - priorityB;
  });
};

// Sort children by name
export const sortChildrenByName = (children, order = 'asc') => {
  return [...children].sort((a, b) => {
    const nameA = a.full_name.toLowerCase();
    const nameB = b.full_name.toLowerCase();
    
    if (order === 'desc') {
      return nameB.localeCompare(nameA);
    }
    return nameA.localeCompare(nameB);
  });
};

// Filter children by gender
export const filterChildrenByGender = (children, gender) => {
  if (!gender) return children;
  return children.filter(child => child.jenis_kelamin === gender);
};

// Filter children by class
export const filterChildrenByKelas = (children, kelas) => {
  if (!kelas) return children;
  return children.filter(child => child.kelas === kelas);
};

// Filter children by parent status
export const filterChildrenByStatusOrangTua = (children, status) => {
  if (!status) return children;
  return children.filter(child => child.status_orang_tua === status);
};

// Search children by name
export const searchChildren = (children, searchTerm) => {
  if (!searchTerm) return children;
  
  const term = searchTerm.toLowerCase();
  return children.filter(child => 
    child.full_name.toLowerCase().includes(term) ||
    (child.nick_name && child.nick_name.toLowerCase().includes(term))
  );
};

// Calculate summary statistics
export const calculateCpbSummary = (children) => {
  if (!children || children.length === 0) {
    return {
      total: 0,
      BCPB: 0,
      CPB: 0,
      NPB: 0,
      PB: 0
    };
  }

  const summary = children.reduce((acc, child) => {
    acc.total++;
    acc[child.status_cpb] = (acc[child.status_cpb] || 0) + 1;
    return acc;
  }, {
    total: 0,
    BCPB: 0,
    CPB: 0,
    NPB: 0,
    PB: 0
  });

  return summary;
};

// Group children by CPB status
export const groupChildrenByCpbStatus = (children) => {
  return children.reduce((groups, child) => {
    const status = child.status_cpb;
    if (!groups[status]) {
      groups[status] = [];
    }
    groups[status].push(child);
    return groups;
  }, {});
};

// Format date for display
export const formatDate = (dateString, format = 'dd/MM/yyyy') => {
  if (!dateString) return '';
  
  const date = new Date(dateString);
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();

  switch (format) {
    case 'dd/MM/yyyy':
      return `${day}/${month}/${year}`;
    case 'dd MMM yyyy':
      return date.toLocaleDateString('id-ID', { 
        day: '2-digit', 
        month: 'short', 
        year: 'numeric' 
      });
    default:
      return date.toLocaleDateString('id-ID');
  }
};

// Prepare export data
export const prepareExportData = (children, filters, summary) => {
  return {
    exportDate: new Date().toISOString(),
    filters,
    summary,
    children: children.map(child => ({
      namaLengkap: child.full_name,
      namaPanggilan: child.nick_name,
      jenisKelamin: child.jenis_kelamin,
      umur: child.umur,
      kelas: child.kelas,
      level: child.level,
      statusOrangTua: child.status_orang_tua,
      statusCpb: child.status_cpb,
      tanggalDaftar: formatDate(child.created_at),
      tanggalSponsorship: child.sponsorship_date ? formatDate(child.sponsorship_date) : ''
    }))
  };
};

// Validate filters
export const validateFilters = (filters) => {
  const errors = [];

  if (filters.jenisKelamin && !['Laki-laki', 'Perempuan'].includes(filters.jenisKelamin)) {
    errors.push('Invalid gender filter');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};

// Get tab counts from summary
export const getTabCounts = (summary) => {
  return {
    BCPB: summary?.BCPB || 0,
    CPB: summary?.CPB || 0,
    NPB: summary?.NPB || 0,
    PB: summary?.PB || 0
  };
};

// Check if filters are active
export const hasActiveFilters = (filters) => {
  return !!(
    filters.jenisKelamin || 
    filters.kelas || 
    filters.statusOrangTua || 
    filters.search
  );
};

// Reset filters to default
export const getDefaultFilters = () => ({
  jenisKelamin: null,
  kelas: null,
  statusOrangTua: null,
  search: ''
});

// Debounce function for search
export const debounce = (func, wait) => {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
};

// Format child display name
export const formatChildDisplayName = (child) => {
  if (child.nick_name) {
    return `${child.full_name} (${child.nick_name})`;
  }
  return child.full_name;
};

// Get CPB status description
export const getCpbStatusDescription = (status) => {
  return CPB_STATUS_LABELS[status] || status;
};

// Calculate percentage distribution
export const calculateStatusDistribution = (summary) => {
  const total = summary.total || 0;
  if (total === 0) return {};

  return {
    BCPB: Math.round((summary.BCPB / total) * 100),
    CPB: Math.round((summary.CPB / total) * 100),
    NPB: Math.round((summary.NPB / total) * 100),
    PB: Math.round((summary.PB / total) * 100)
  };
};