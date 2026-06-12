import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface UserProfile {
  id: string;
  phone: string;
  email: string | null;
  name: string | null;
  role: 'CUSTOMER' | 'ADMIN' | 'VENDOR' | 'DELIVERY';
  isVerified: boolean;
}

interface AuthState {
  user: UserProfile | null;
  token: string | null;
  isAuthenticated: boolean;
  otpPhonePending: string | null; // Tracks which phone number we are currently verifying
}

const getInitialState = (): AuthState => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('token');
    const userJson = localStorage.getItem('user');
    if (token && userJson) {
      try {
        return {
          user: JSON.parse(userJson),
          token,
          isAuthenticated: true,
          otpPhonePending: null,
        };
      } catch (e) {
        // Clear corrupt storage
        localStorage.removeItem('token');
        localStorage.removeItem('user');
      }
    }
  }
  return {
    user: null,
    token: null,
    isAuthenticated: false,
    otpPhonePending: null,
  };
};

const authSlice = createSlice({
  name: 'auth',
  initialState: getInitialState(),
  reducers: {
    setCredentials: (
      state,
      action: PayloadAction<{ user: UserProfile; token: string }>
    ) => {
      state.user = action.payload.user;
      state.token = action.payload.token;
      state.isAuthenticated = true;
      if (typeof window !== 'undefined') {
        localStorage.setItem('token', action.payload.token);
        localStorage.setItem('user', JSON.stringify(action.payload.user));
      }
    },
    logout: (state) => {
      state.user = null;
      state.token = null;
      state.isAuthenticated = false;
      state.otpPhonePending = null;
      if (typeof window !== 'undefined') {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
      }
    },
    setOtpPending: (state, action: PayloadAction<string>) => {
      state.otpPhonePending = action.payload;
    },
    clearOtpPending: (state) => {
      state.otpPhonePending = null;
    },
    updateProfile: (state, action: PayloadAction<Partial<UserProfile>>) => {
      if (state.user) {
        state.user = { ...state.user, ...action.payload };
        if (typeof window !== 'undefined') {
          localStorage.setItem('user', JSON.stringify(state.user));
        }
      }
    },
  },
});

export const { setCredentials, logout, setOtpPending, clearOtpPending, updateProfile } =
  authSlice.actions;

export default authSlice.reducer;
