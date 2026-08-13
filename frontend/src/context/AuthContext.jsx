import React, { createContext, useContext, useState } from 'react';
import api from '../services/api';
import { supabase, isSupabaseConfigured } from '../config/supabase';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('vvc_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [token, setToken] = useState(() => localStorage.getItem('vvc_token') || null);
  const [loading, setLoading] = useState(false);

  const persistSession = (jwtToken, userProfile) => {
    localStorage.setItem('vvc_token', jwtToken);
    localStorage.setItem('vvc_user', JSON.stringify(userProfile));
    setToken(jwtToken);
    setUser(userProfile);
  };

  const loginUser = async (email, password) => {
    setLoading(true);
    try {
      const res = await api.post('/auth/login', { email, password });
      const { token: jwtToken, user: userProfile } = res.data;
      persistSession(jwtToken, userProfile);
      return userProfile;
    } finally {
      setLoading(false);
    }
  };

  const registerUser = async (payload) => {
    setLoading(true);
    try {
      const res = await api.post('/auth/register', payload);
      const { token: jwtToken, user: userProfile } = res.data;
      persistSession(jwtToken, userProfile);
      return userProfile;
    } finally {
      setLoading(false);
    }
  };

  // Starts the Google OAuth redirect flow (Supabase Auth provider must be enabled)
  const loginWithGoogle = async () => {
    if (!isSupabaseConfigured) {
      throw new Error('Supabase anon key is not configured (VITE_SUPABASE_ANON_KEY).');
    }
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/login` }
    });
    if (error) throw error;
  };

  // Called after the OAuth redirect returns: exchanges the Supabase session
  // for the platform JWT (role always comes from the staff_profiles table)
  const completeGoogleSignIn = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.access_token) return null;
    setLoading(true);
    try {
      const res = await api.post('/auth/oauth-exchange', { access_token: session.access_token });
      persistSession(res.data.token, res.data.user);
      await supabase.auth.signOut().catch(() => {}); // platform JWT takes over from here
      return res.data.user;
    } finally {
      setLoading(false);
    }
  };

  const logoutUser = async () => {
    try {
      await api.post('/auth/logout');
    } catch (e) {
      // Session cleanup proceeds regardless
    }
    localStorage.removeItem('vvc_token');
    localStorage.removeItem('vvc_user');
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, loginUser, registerUser, logoutUser, loginWithGoogle, completeGoogleSignIn }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
