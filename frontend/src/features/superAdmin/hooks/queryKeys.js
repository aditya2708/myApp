export const superAdminUserKeys = {
  all: ['superAdminUsers'],
  list: (search = '') => ['superAdminUsers', 'list', search],
  detail: (userId) => ['superAdminUsers', 'detail', userId],
  directory: (search = '') => ['superAdminUsers', 'directory', search],
  dropdowns: {
    kacabs: ['superAdminUsers', 'dropdowns', 'kacabs'],
    wilbins: (kacabId) => ['superAdminUsers', 'dropdowns', 'wilbins', kacabId || ''],
    shelters: (wilbinId) => ['superAdminUsers', 'dropdowns', 'shelters', wilbinId || ''],
  },
};
