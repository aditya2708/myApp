// Attendance system configuration
export default {
  // QR token configuration
  qrToken: {
    // Default validity period in days
    defaultValidDays: 30,
    
    // Whether to show verification method on badges
    showVerificationMethod: true,
    
    // QR code display options
    qrDisplay: {
      size: 200,
      darkColor: '#000000',
      lightColor: '#ffffff',
      errorCorrectionLevel: 'H'
    },
    
    // QR export options - simplified
    qrExport: {
      // Default image format
      format: 'png',
      
      // Image quality (1-100, PNG ignores this)
      quality: 90,
      
      // Base file name template (tokens will be replaced)
      fileNameTemplate: 'qr_{studentId}_{timestamp}',
      
      // Include student info in QR image
      includeStudentInfo: true,
      
      // Unified export method - always use sharing
      preferredMethod: 'share',
      
      // Context-aware generation enabled
      contextAware: true
    }
  },
  
  // QR Generation workflow - simplified
  qrGeneration: {
    // Auto-detect context based on activity data
    autoDetectContext: true,
    
    // Show tutor section when tutor is assigned
    autoShowTutorSection: true,
    
    // Remove mode toggles for simplified UX
    simplifiedUI: true
  },
  
  // Verification configuration
  verification: {
    // Verification methods enabled
    methods: {
      qrCode: true,
      manual: true,
      faceRecognition: false,  // Will be enabled in Phase 2
      dual: false              // Will be enabled in Phase 2
    },
    
    // Text to display for verification status
    statusText: {
      pending: 'Pending Verification',
      verified: 'Verified',
      rejected: 'Rejected',
      manual: 'Manually Verified'
    },
    
    // Minimum required notes length for manual verification/rejection
    minNotesLength: 5
  },
  
  // Attendance status configuration
  attendanceStatus: {
    // Status options
    options: {
      present: 'present',
      late: 'late',
      absent: 'absent'
    },
    
    // Display text for statuses
    statusText: {
      present: 'Present',
      late: 'Late',
      absent: 'Absent'
    },
    
    // Status colors
    colors: {
      present: '#2ecc71',  // Green
      late: '#f39c12',     // Orange
      absent: '#e74c3c'    // Red
    },
    
    // Status icons (Ionicons)
    icons: {
      present: 'checkmark-circle',
      late: 'time',
      absent: 'close-circle'
    },
    
    // Default late threshold (minutes after scheduled time)
    defaultLateThreshold: 15
  },
  
  // Offline sync configuration
  offlineSync: {
    // Auto-sync when connection is restored
    autoSync: true,
    
    // Sync interval in milliseconds (when app is active)
    syncInterval: 60000,
    
    // Maximum offline queue size
    maxQueueSize: 100,
    
    // Whether to show offline mode indicators
    showOfflineIndicators: true
  },
  
  // Report generation configuration
  reports: {
    // Default date range in days (from today)
    defaultDateRange: 7,
    
    // Default options for PDF export
    pdfOptions: {
      pageSize: 'A4',
      includeRecords: true,
      orientation: 'portrait'
    },
    
    // Default grouping option
    defaultGrouping: 'none'
  },
  
  // Tutor payment calculation
  tutorPayment: {
    // Base rate per session (in IDR)
    ratePerSession: 50000,
    
    // Bonus percentage for high verification rate
    bonusRate: 0.1,
    
    // Verification threshold for bonus eligibility
    verificationThreshold: 0.9
  }
};