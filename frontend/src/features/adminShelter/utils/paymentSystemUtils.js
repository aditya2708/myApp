export const PAYMENT_SYSTEMS = {
  FLAT_MONTHLY: 'flat_monthly',
  PER_SESSION: 'per_session',
  PER_STUDENT_CATEGORY: 'per_student_category',
  PER_HOUR: 'per_hour',
  BASE_PER_SESSION: 'base_per_session',
  BASE_PER_STUDENT: 'base_per_student',
  BASE_PER_HOUR: 'base_per_hour',
  SESSION_PER_STUDENT: 'session_per_student'
};

export const PAYMENT_SYSTEM_NAMES = {
  [PAYMENT_SYSTEMS.FLAT_MONTHLY]: 'Honor Bulanan Tetap',
  [PAYMENT_SYSTEMS.PER_SESSION]: 'Per Sesi/Pertemuan',
  [PAYMENT_SYSTEMS.PER_STUDENT_CATEGORY]: 'Per Kategori Siswa',
  [PAYMENT_SYSTEMS.PER_HOUR]: 'Per Jam',
  [PAYMENT_SYSTEMS.BASE_PER_SESSION]: 'Dasar + Per Sesi',
  [PAYMENT_SYSTEMS.BASE_PER_STUDENT]: 'Dasar + Per Siswa',
  [PAYMENT_SYSTEMS.BASE_PER_HOUR]: 'Dasar + Per Jam',
  [PAYMENT_SYSTEMS.SESSION_PER_STUDENT]: 'Per Sesi + Per Siswa'
};

export const getPaymentSystemName = (paymentSystem) => {
  return PAYMENT_SYSTEM_NAMES[paymentSystem] || paymentSystem || 'Unknown';
};

export const getRequiredInputFields = (paymentSystem) => {
  switch (paymentSystem) {
    case PAYMENT_SYSTEMS.FLAT_MONTHLY:
      return [];
    case PAYMENT_SYSTEMS.PER_SESSION:
      return ['session_count'];
    case PAYMENT_SYSTEMS.PER_STUDENT_CATEGORY:
      return ['cpb_count', 'pb_count', 'npb_count'];
    case PAYMENT_SYSTEMS.PER_HOUR:
      return ['hour_count'];
    case PAYMENT_SYSTEMS.BASE_PER_SESSION:
      return ['session_count'];
    case PAYMENT_SYSTEMS.BASE_PER_STUDENT:
      return ['cpb_count', 'pb_count', 'npb_count'];
    case PAYMENT_SYSTEMS.BASE_PER_HOUR:
      return ['hour_count'];
    case PAYMENT_SYSTEMS.SESSION_PER_STUDENT:
      return ['session_count', 'cpb_count', 'pb_count', 'npb_count'];
    default:
      return ['cpb_count', 'pb_count', 'npb_count'];
  }
};

export const getInputFieldConfig = (paymentSystem) => {
  const configs = {
    cpb_count: {
      label: 'Jumlah Siswa CPB',
      placeholder: '0',
      type: 'numeric',
      icon: 'people'
    },
    pb_count: {
      label: 'Jumlah Siswa PB',
      placeholder: '0',
      type: 'numeric',
      icon: 'people'
    },
    npb_count: {
      label: 'Jumlah Siswa NPB',
      placeholder: '0',
      type: 'numeric',
      icon: 'people'
    },
    session_count: {
      label: 'Jumlah Sesi',
      placeholder: '1',
      type: 'numeric',
      icon: 'calendar'
    },
    hour_count: {
      label: 'Jumlah Jam',
      placeholder: '2',
      type: 'numeric',
      step: '0.5',
      icon: 'time'
    }
  };

  const requiredFields = getRequiredInputFields(paymentSystem);
  return requiredFields.map(field => ({
    key: field,
    ...configs[field]
  }));
};

export const hasStudentBreakdown = (paymentSystem) => {
  return [
    PAYMENT_SYSTEMS.PER_STUDENT_CATEGORY,
    PAYMENT_SYSTEMS.BASE_PER_STUDENT,
    PAYMENT_SYSTEMS.SESSION_PER_STUDENT
  ].includes(paymentSystem);
};

export const hasSessionBreakdown = (paymentSystem) => {
  return [
    PAYMENT_SYSTEMS.PER_SESSION,
    PAYMENT_SYSTEMS.BASE_PER_SESSION,
    PAYMENT_SYSTEMS.SESSION_PER_STUDENT
  ].includes(paymentSystem);
};

export const hasHourBreakdown = (paymentSystem) => {
  return [
    PAYMENT_SYSTEMS.PER_HOUR,
    PAYMENT_SYSTEMS.BASE_PER_HOUR
  ].includes(paymentSystem);
};

export const hasBaseAmount = (paymentSystem) => {
  return [
    PAYMENT_SYSTEMS.BASE_PER_SESSION,
    PAYMENT_SYSTEMS.BASE_PER_STUDENT,
    PAYMENT_SYSTEMS.BASE_PER_HOUR
  ].includes(paymentSystem);
};

export const isFlatMonthly = (paymentSystem) => {
  return paymentSystem === PAYMENT_SYSTEMS.FLAT_MONTHLY;
};

export const getDefaultInputValues = (paymentSystem) => {
  switch (paymentSystem) {
    case PAYMENT_SYSTEMS.FLAT_MONTHLY:
      return {};
    case PAYMENT_SYSTEMS.PER_SESSION:
      return { session_count: 1 };
    case PAYMENT_SYSTEMS.PER_STUDENT_CATEGORY:
      return { cpb_count: 5, pb_count: 3, npb_count: 2 };
    case PAYMENT_SYSTEMS.PER_HOUR:
      return { hour_count: 2 };
    case PAYMENT_SYSTEMS.BASE_PER_SESSION:
      return { session_count: 1 };
    case PAYMENT_SYSTEMS.BASE_PER_STUDENT:
      return { cpb_count: 5, pb_count: 3, npb_count: 2 };
    case PAYMENT_SYSTEMS.BASE_PER_HOUR:
      return { hour_count: 2 };
    case PAYMENT_SYSTEMS.SESSION_PER_STUDENT:
      return { session_count: 1, cpb_count: 5, pb_count: 3, npb_count: 2 };
    default:
      return { cpb_count: 5, pb_count: 3, npb_count: 2 };
  }
};

export const validateInputs = (paymentSystem, inputs) => {
  const requiredFields = getRequiredInputFields(paymentSystem);
  const errors = {};

  requiredFields.forEach(field => {
    const value = inputs[field];
    if (value === undefined || value === null || value === '') {
      errors[field] = 'Field is required';
    } else if (isNaN(value) || value < 0) {
      errors[field] = 'Must be a valid positive number';
    }
  });

  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
};

export const formatBreakdownComponent = (component, componentKey) => {
  if (!component) return null;

  const formatCurrency = (amount) => 
    `Rp ${Number(amount || 0).toLocaleString('id-ID')}`;

  const formatDescription = (component, key) => {
    switch (key) {
      case 'cpb':
        return `${component.count} siswa CPB × ${formatCurrency(component.rate)}`;
      case 'pb':
        return `${component.count} siswa PB × ${formatCurrency(component.rate)}`;
      case 'npb':
        return `${component.count} siswa NPB × ${formatCurrency(component.rate)}`;
      case 'session':
        return `${component.count} sesi × ${formatCurrency(component.rate)}`;
      case 'hour':
        return `${component.count} jam × ${formatCurrency(component.rate)}`;
      case 'student':
        return `${component.count} siswa × ${formatCurrency(component.rate)}`;
      case 'base':
        return 'Honor dasar';
      case 'monthly':
        return 'Honor bulanan tetap';
      default:
        return component.description || '';
    }
  };

  return {
    ...component,
    formatted_amount: formatCurrency(component.amount),
    formatted_rate: formatCurrency(component.rate),
    formatted_description: formatDescription(component, componentKey || 'unknown')
  };
};

export const getBreakdownStructure = (paymentSystem) => {
  switch (paymentSystem) {
    case PAYMENT_SYSTEMS.FLAT_MONTHLY:
      return ['monthly'];
    case PAYMENT_SYSTEMS.PER_SESSION:
      return ['session'];
    case PAYMENT_SYSTEMS.PER_STUDENT_CATEGORY:
      return ['cpb', 'pb', 'npb'];
    case PAYMENT_SYSTEMS.PER_HOUR:
      return ['hour'];
    case PAYMENT_SYSTEMS.BASE_PER_SESSION:
      return ['base', 'session'];
    case PAYMENT_SYSTEMS.BASE_PER_STUDENT:
      return ['base', 'student'];
    case PAYMENT_SYSTEMS.BASE_PER_HOUR:
      return ['base', 'hour'];
    case PAYMENT_SYSTEMS.SESSION_PER_STUDENT:
      return ['session', 'student'];
    default:
      return ['cpb', 'pb', 'npb'];
  }
};

export const getSystemDescription = (paymentSystem) => {
  switch (paymentSystem) {
    case PAYMENT_SYSTEMS.FLAT_MONTHLY:
      return 'Honor tetap setiap bulan tanpa mempertimbangkan jumlah sesi atau siswa';
    case PAYMENT_SYSTEMS.PER_SESSION:
      return 'Honor dihitung berdasarkan jumlah sesi yang dilakukan';
    case PAYMENT_SYSTEMS.PER_STUDENT_CATEGORY:
      return 'Honor dihitung berdasarkan kategori dan jumlah siswa yang hadir';
    case PAYMENT_SYSTEMS.PER_HOUR:
      return 'Honor dihitung berdasarkan jumlah jam mengajar';
    case PAYMENT_SYSTEMS.BASE_PER_SESSION:
      return 'Honor dasar ditambah honor per sesi';
    case PAYMENT_SYSTEMS.BASE_PER_STUDENT:
      return 'Honor dasar ditambah honor per siswa';
    case PAYMENT_SYSTEMS.BASE_PER_HOUR:
      return 'Honor dasar ditambah honor per jam';
    case PAYMENT_SYSTEMS.SESSION_PER_STUDENT:
      return 'Honor per sesi ditambah honor per siswa';
    default:
      return 'Sistem pembayaran tidak dikenal';
  }
};