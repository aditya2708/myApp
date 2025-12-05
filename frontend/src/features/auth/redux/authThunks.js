import { createAsyncThunk } from '@reduxjs/toolkit';
import { authApi } from '../api/authApi';
import { managementApi } from '../../sso/api/managementApi';
import { refreshAccessToken } from '../../../api/tokenRefresher';
import {
  storeToken,
  getToken,
  removeToken,
  storeUser,
  removeUser,
  storeRefreshToken,
  removeRefreshToken,
  getRefreshToken,
  getCurrentRole,
  storeCurrentRole,
  removeCurrentRole,
} from '../../../common/utils/storageHelpers';
import { 
  setAuthToken, 
  loginStart, 
  loginSuccess, 
  loginFailure,
  logoutStart,
  logoutSuccess,
  logoutFailure,
  fetchUserStart,
  fetchUserSuccess,
  fetchUserFailure,
  initializeStart,
  initializeSuccess,
  initializeFailure,
  setCurrentRole
} from './authSlice';

const normalizeRole = (role) => {
  if (!role) return null;
  return {
    slug: role.slug,
    name: role.name || role.slug,
    scope_type: role.scope_type ?? null,
    scope_id: role.scope_id ?? null,
  };
};

const rolesFromPayload = (payload) => {
  if (!payload) return [];
  return (payload.roles || payload.user?.roles || []).map(normalizeRole).filter(Boolean);
};

const isSameRole = (a, b) => {
  if (!a || !b) return false;
  return (
    a.slug === b.slug &&
    (a.scope_type ?? null) === (b.scope_type ?? null) &&
    (a.scope_id ?? null) === (b.scope_id ?? null)
  );
};

const resolveRoleSelection = async (payload, preferredRole = null, options = {}) => {
  const availableRoles = rolesFromPayload(payload);
  const serverCurrent = normalizeRole(payload?.current_role || payload?.user?.current_role);
  const storedRole = options.useStored !== false ? normalizeRole(await getCurrentRole()) : null;
  const singleRole = availableRoles.length === 1 ? availableRoles[0] : null;
  const fallbackLevel = payload?.user?.level
    ? normalizeRole({ slug: payload.user.level, name: payload.user.level })
    : null;

  const candidates = [
    normalizeRole(preferredRole),
    storedRole,
    serverCurrent,
    singleRole,
  ].filter(Boolean);

  let resolved = null;
  for (const candidate of candidates) {
    const match = availableRoles.find((r) => isSameRole(r, candidate));
    if (match) {
      resolved = match;
      break;
    }
  }

  if (!resolved) {
    if (availableRoles.length === 1) {
      resolved = availableRoles[0];
    } else if (availableRoles.length === 0 && fallbackLevel) {
      resolved = fallbackLevel;
    }
  }

  resolved ? await storeCurrentRole(resolved) : await removeCurrentRole();

  return {
    availableRoles,
    currentRole: resolved,
  };
};

/**
 * Initialize authentication state
 * Checks for existing token and fetches user data if token exists
 */
export const initializeAuth = () => async (dispatch) => {
  try {
    dispatch(initializeStart());

    // Check if token exists in storage
    let token = await getToken();
    const refreshToken = await getRefreshToken();

    // If access token missing but refresh token exists, try to refresh
    if (!token && refreshToken) {
      try {
        token = await refreshAccessToken();
      } catch (error) {
        console.warn('Refresh during init failed:', error?.message || error);
        await removeRefreshToken();
        await removeUser();
      }
    }
    
    if (token) {
      // If token exists, set it in the state
      dispatch(setAuthToken(token));
      
      // Try to fetch current user with the token
      try {
        dispatch(fetchUserStart());
        const response = await authApi.getCurrentUser();
        const roleState = await resolveRoleSelection(response.data);
        dispatch(
          fetchUserSuccess({
            ...response.data,
            roles: roleState.availableRoles,
            currentRole: roleState.currentRole,
          })
        );
      } catch (error) {
        // If fetching user fails, token might be invalid
        await removeToken();
        await removeUser();
        await removeCurrentRole();
        dispatch(setAuthToken(null));
        dispatch(fetchUserFailure({ message: 'Sesi berakhir. Silakan masuk kembali.' }));
      }
    }
    
    // Mark initialization as complete
    dispatch(initializeSuccess());
  } catch (error) {
    console.error('Error initializing auth:', error);
    dispatch(initializeFailure());
  }
};

/**
 * Login user
 * Send login credentials and store token if successful
 */
export const loginUser = (credentials) => async (dispatch) => {
  try {
    dispatch(loginStart());

    const loginResponse = await managementApi.login(credentials);
    const { access_token, refresh_token } = loginResponse.data;

    await storeToken(access_token);
    if (refresh_token) {
      await storeRefreshToken(refresh_token);
    }
    dispatch(setAuthToken(access_token));

    const userinfoResponse = await managementApi.userinfo(access_token);
    const managementUser = userinfoResponse.data;

    let tenantPayload = null;
    try {
      const tenantResponse = await authApi.getCurrentUser();
      tenantPayload = tenantResponse.data;
    } catch (tenantError) {
      console.warn('Tenant profile fetch failed:', tenantError?.response?.data || tenantError.message);
    }

    const roleState = await resolveRoleSelection(tenantPayload);

    const resolvedUser =
      tenantPayload?.user || {
        id: managementUser?.sub ?? null,
        email: managementUser?.email ?? null,
        level: roleState.currentRole?.slug ?? tenantPayload?.user?.level ?? null,
      };

    if (resolvedUser && roleState.currentRole?.slug) {
      resolvedUser.level = roleState.currentRole.slug;
    }

    await storeUser(resolvedUser);

    dispatch(
      loginSuccess({
        token: access_token,
        user: resolvedUser,
        profile:
          tenantPayload?.profile ??
          tenantPayload?.user?.profile ??
          managementUser ??
          null,
        sso: tenantPayload?.sso ?? managementUser ?? null,
        roles: roleState.availableRoles,
        currentRole: roleState.currentRole,
      })
    );

    return {
      user: resolvedUser,
      profile:
        tenantPayload?.profile ??
        tenantPayload?.user?.profile ??
        managementUser ??
        null,
      sso: tenantPayload?.sso ?? managementUser ?? null,
      roles: roleState.availableRoles,
      currentRole: roleState.currentRole,
    };
  } catch (error) {
    const fieldErrors = error.response?.data?.errors;
    const rawMessage =
      error.response?.data?.message || error.message || 'Gagal login SSO';

    const fallbackFieldMessage =
      fieldErrors && typeof fieldErrors === 'object'
        ? Object.values(fieldErrors).flat().join(', ')
        : null;

    const message =
      typeof rawMessage === 'string'
        ? rawMessage
        : fallbackFieldMessage || 'Gagal login SSO';

    const formattedError = {
      message,
      fieldErrors: fieldErrors || null,
    };

    await removeToken();
    await removeRefreshToken();
    await removeUser();
    await removeCurrentRole();

    dispatch(loginFailure(formattedError));
    throw formattedError;
  }
};

/**
 * Logout user
 * Clear token and user data
 */
export const logoutUser = () => async (dispatch) => {
  dispatch(logoutStart());

  try {
    await authApi.logout();

    await removeToken();
    await removeRefreshToken();
    await removeUser();
    await removeCurrentRole();

    dispatch(logoutSuccess());
    return { success: true };
  } catch (error) {
    console.error('Logout API error:', error);

    await removeToken();
    await removeRefreshToken();
    await removeUser();
    await removeCurrentRole();

    dispatch(logoutFailure());

    const message =
      error?.response?.data?.message ||
      error?.message ||
      'Gagal logout. Silakan coba lagi.';

    return {
      success: false,
      message,
    };
  }
};

/**
 * Fetch current user data
 * Get user profile based on stored token
 */
export const fetchCurrentUser = () => async (dispatch) => {
  try {
    dispatch(fetchUserStart());
    
    const response = await authApi.getCurrentUser();
    const roleState = await resolveRoleSelection(response.data);
    
    // Update stored user data
    await storeUser(response.data.user);
    
    const mergedUser = {
      ...response.data.user,
      level: roleState.currentRole?.slug ?? response.data.user?.level ?? null,
    };
    await storeUser(mergedUser);

    dispatch(
      fetchUserSuccess({
        ...response.data,
        user: mergedUser,
        roles: roleState.availableRoles,
        currentRole: roleState.currentRole,
      })
    );
    return {
      ...response.data,
      user: mergedUser,
      roles: roleState.availableRoles,
      currentRole: roleState.currentRole,
    };
  } catch (error) {
    console.error('Error fetching current user:', error);
    
    const errorMsg = error.response?.data?.message || 'Gagal mengambil data pengguna';
    dispatch(fetchUserFailure({ message: errorMsg }));
    throw error;
  }
};

export const setActiveRole = (role) => async (dispatch) => {
  const normalized = normalizeRole(role);

  if (!normalized?.slug) {
    return { success: false, message: 'Role tidak valid' };
  }

  await storeCurrentRole(normalized);
  dispatch(setCurrentRole(normalized));

  try {
    dispatch(fetchUserStart());
    const response = await authApi.getCurrentUser();
    const roleState = await resolveRoleSelection(response.data, normalized, { useStored: false });

    const mergedUser = {
      ...response.data.user,
      level: roleState.currentRole?.slug ?? response.data.user?.level ?? null,
    };
    await storeUser(mergedUser);

    dispatch(
      fetchUserSuccess({
        ...response.data,
        user: mergedUser,
        roles: roleState.availableRoles,
        currentRole: roleState.currentRole,
      })
    );

    return { success: true, role: roleState.currentRole };
  } catch (error) {
    const errorMsg = error.response?.data?.message || 'Gagal menerapkan role';
    dispatch(fetchUserFailure({ message: errorMsg }));
    return { success: false, message: errorMsg };
  }
};
