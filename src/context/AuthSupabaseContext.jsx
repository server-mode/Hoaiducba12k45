import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { supabase } from '../lib/supabaseClient.js';

const AuthSupabaseContext = createContext(null);

export function AuthSupabaseProvider({ children }){
  const [session, setSession] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  // Load session & profile
  useEffect(() => {
    let mounted = true;
    (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if(!mounted) return;
      setSession(session);
      if(session?.user){ await loadProfile(session.user.id); }
      setLoading(false);
    })();

    const { data: listener } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
      if(newSession?.user){ loadProfile(newSession.user.id); } else { setProfile(null); }
    });
    return () => { mounted = false; listener.subscription.unsubscribe(); };
  }, []);

  const loadProfile = useCallback(async (userId) => {
    const { data, error } = await supabase.from('profiles').select('*').eq('id', userId).single();
    if(!error) setProfile(data);
  }, []);

  const register = useCallback(async ({ email, password, name }) => {
    const { data, error } = await supabase.auth.signUp({ email, password, options: { data: { display_name: name } } });
    if(error) throw error;
    // Create profile row explicitly (in case no trigger)
    if(data.user){
      await supabase.from('profiles').upsert({ id: data.user.id, display_name: name || email.split('@')[0] });
      await loadProfile(data.user.id);
    }
    return data.user;
  }, [loadProfile]);

  const login = useCallback(async ({ email, password }) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if(error) throw error;
    if(data.user){ await loadProfile(data.user.id); }
    return data.user;
  }, [loadProfile]);

  const logout = useCallback(async () => {
    await supabase.auth.signOut();
    setProfile(null);
  }, []);

  const updateProfile = useCallback(async (patch) => {
    if(!session?.user) throw new Error('Chưa đăng nhập');
    const { error } = await supabase.from('profiles').update(patch).eq('id', session.user.id);
    if(error) throw error;
    await loadProfile(session.user.id);
  }, [session, loadProfile]);

  const changePassword = useCallback(async ({ oldPassword, newPassword }) => {
    // Supabase không hỗ trợ verify old password client-side; chỉ update trực tiếp.
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if(error) throw error;
    return true;
  }, []);

  const value = {
    user: profile && session?.user ? { id: session.user.id, email: session.user.email, name: profile.display_name, avatar: profile.avatar_url, cover: profile.cover_url, bio: profile.bio, isAdmin: profile.role === 'admin' } : null,
    profile,
    session,
    loading,
    authenticated: !!session?.user,
    register,
    login,
    logout,
    updateProfile,
    changePassword,
  };

  return <AuthSupabaseContext.Provider value={value}>{children}</AuthSupabaseContext.Provider>;
}

export function useAuthSupabase(){
  return useContext(AuthSupabaseContext);
}
