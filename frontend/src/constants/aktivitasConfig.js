// Activity types and configuration
export default {
  // Activity types
  types: {
    BIMBEL: 'Bimbel',
    KEGIATAN: 'Kegiatan'
  },
  
  // Default values for new activities
  defaults: {
    type: 'Bimbel',
    date: new Date(),
  },
  
  // Photo options
  photos: {
    maxPhotos: 3,
    maxSize: 2048, // Max size in KB
    allowedTypes: ['image/jpeg', 'image/png', 'image/jpg']
  },
  
  // Photo display options
  photoDisplay: {
    thumbnailSize: 60,
    listImageWidth: 100
  }
};