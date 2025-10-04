import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { USE_SUPABASE } from '../config/appConfig.js';
import { supabase } from '../lib/supabaseClient.js';

/* Simple local auth (email + password) using localStorage.
   Structure:
  localStorage.users = JSON.stringify([{id, email, passwordHash, name, avatar, createdAt}])
   localStorage.session = JSON.stringify({ userId })
*/

const AuthContext = createContext(null);

function hashPassword(pw){
  // Light hash placeholder (NOT for production). Replace with real hashing when moving to Supabase.
  return btoa(unescape(encodeURIComponent(pw)));
}

export function AuthProvider({ children }){
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [pendingEmailConfirm, setPendingEmailConfirm] = useState(null);

  const ensureProfileExists = useCallback(async (uid, fallbackName, email) => {
    if(!uid) return null;
    const sel = await supabase.from('profiles').select('*').eq('id', uid).single();
    if(sel.error){
      if(sel.error.code !== '406'){ console.warn('[profiles] fetch error', sel.error); }
    }
    if(sel.data) return sel.data;
    const base = { id: uid, name: fallbackName || 'User', is_admin:false, upload_bytes:0, email };
    const up = await supabase.from('profiles').upsert(base, { onConflict:'id' });
    if(up.error){ console.warn('[profiles] upsert error', up.error); return null; }
    const sel2 = await supabase.from('profiles').select('*').eq('id', uid).single();
    if(sel2.error && sel2.error.code !== '406'){ console.warn('[profiles] fetch2 error', sel2.error); }
    return sel2.data || null;
  }, []);

  // Load session (Supabase or local)
  useEffect(() => {
    (async () => {
      if(USE_SUPABASE){
  const sessionResp = await supabase.auth.getSession();
  const session = sessionResp?.data?.session || null;
  if(session && session.user){
            const profile = await ensureProfileExists(session.user.id, session.user.email?.split('@')[0], session.user.email);
          setUser({
            id: session.user.id,
            email: session.user.email,
            name: profile?.name || session.user.email?.split('@')[0],
            avatar: profile?.avatar_url || null,
            cover: profile?.cover_url || null,
            bio: profile?.bio || '',
            dob: profile?.dob || null,
            isAdmin: !!profile?.is_admin,
            suspended: !!profile?.suspended,
            uploadBytes: profile?.upload_bytes || 0
          });
        }
        setLoading(false);
        // subscribe to auth changes
    const { data: sub } = supabase.auth.onAuthStateChange(async (event, session) => {
          if(session?.user){
      const profile = await ensureProfileExists(session.user.id, session.user.email?.split('@')[0], session.user.email);
            setUser({
              id: session.user.id,
              email: session.user.email,
              name: profile?.name || session.user.email?.split('@')[0],
              avatar: profile?.avatar_url || null,
              cover: profile?.cover_url || null,
              bio: profile?.bio || '',
              dob: profile?.dob || null,
              isAdmin: !!profile?.is_admin,
              suspended: !!profile?.suspended,
              uploadBytes: profile?.upload_bytes || 0
            });
          } else {
            setUser(null);
          }
        });
        return () => { sub.subscription.unsubscribe(); };
        return;
      }
      try {
        const sessionRaw = localStorage.getItem('session');
        const usersRaw = localStorage.getItem('users');
        if(sessionRaw && usersRaw){
          const session = JSON.parse(sessionRaw);
          let users = JSON.parse(usersRaw) || [];
          let migrated = false;
          users = users.map(u => {
            let changed = false;
            if(u.cover === undefined){ u.cover = null; changed = true; }
              if(u.bio === undefined){ u.bio = ''; changed = true; }
            if(u.isAdmin === undefined){ u.isAdmin = false; changed = true; }
            if(u.suspended === undefined){ u.suspended = false; changed = true; }
            if(u.uploadBytes === undefined){ u.uploadBytes = 0; changed = true; }
            if(u.dob === undefined){ u.dob = null; changed = true; }
            if(changed) migrated = true;
            return u;
          });
          if(!users.some(u=>u.isAdmin)){
            const adminUser = { id: crypto.randomUUID(), email: 'admin@class.local', passwordHash: hashPassword('admin123'), name: 'Administrator', avatar: null, cover: null, bio: 'Quản trị viên', createdAt: new Date().toISOString(), isAdmin: true, suspended:false, uploadBytes:0 };
            users.push(adminUser);
            migrated = true;
            if(!session?.userId){ localStorage.setItem('session', JSON.stringify({ userId: adminUser.id })); }
          }
          if(migrated){ localStorage.setItem('users', JSON.stringify(users)); }
          const found = users.find(u => u.id === session.userId);
          if(found) setUser(found);
        }
      } catch(e){ console.warn('Auth load failed', e); }
      finally { setLoading(false); }
    })();
  }, []);

  const persistUsers = (users) => localStorage.setItem('users', JSON.stringify(users));

  const register = useCallback(async ({ email, password, name }) => {
    if(!email || !password) throw new Error('Email và mật khẩu bắt buộc');
    if(USE_SUPABASE){
      const { data, error } = await supabase.auth.signUp({ email, password });
      if(error) throw error;
  const uid = data.user.id; // email stored in profiles via listener ensureProfileExists
  // Profile will be created by auth listener ensureProfileExists when session active
      if(!data.session){
        setPendingEmailConfirm(email);
      }
  return { id: uid, email };
    }
    const users = JSON.parse(localStorage.getItem('users') || '[]');
    if(users.some(u => u.email.toLowerCase() === email.toLowerCase())) throw new Error('Email đã tồn tại');
    const newUser = { id: crypto.randomUUID(), email, passwordHash: hashPassword(password), name: name || email.split('@')[0], avatar: null, cover: null, bio: '', dob: null, createdAt: new Date().toISOString(), isAdmin:false, suspended:false, uploadBytes:0 };
    users.push(newUser);
    persistUsers(users);
    localStorage.setItem('session', JSON.stringify({ userId: newUser.id }));
    setUser(newUser);
    return newUser;
  }, []);

  const login = useCallback(async ({ email, password }) => {
    if(USE_SUPABASE){
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if(error){
        console.warn('[auth] login error', error);
        if(error.message && error.message.toLowerCase().includes('email not confirmed')){
          setPendingEmailConfirm(email);
          throw new Error('Email chưa xác nhận. Kiểm tra hộp thư hoặc dùng resendConfirmation(email).');
        }
        throw new Error(error.message || 'Sai email hoặc mật khẩu');
      }
      const uid = data.user.id;
  const sel = await supabase.from('profiles').select('*').eq('id', uid).single();
  const profile = sel.error && sel.error.code==='406' ? null : sel.data;
  const merged = { id: uid, email: data.user.email, name: profile?.name || email.split('@')[0], avatar: profile?.avatar_url||null, cover: profile?.cover_url||null, bio: profile?.bio||'', dob: profile?.dob||null, isAdmin: !!profile?.is_admin, suspended: !!profile?.suspended, uploadBytes: profile?.upload_bytes||0 };
      setUser(merged);
      return merged;
    }
    const users = JSON.parse(localStorage.getItem('users') || '[]');
    const u = users.find(x => x.email.toLowerCase() === email.toLowerCase());
    if(!u) throw new Error('Sai email hoặc mật khẩu');
    if(u.passwordHash !== hashPassword(password)) throw new Error('Sai email hoặc mật khẩu');
    localStorage.setItem('session', JSON.stringify({ userId: u.id }));
    setUser(u);
    try {
      const activityRaw = localStorage.getItem('userActivity');
      const activity = activityRaw? JSON.parse(activityRaw): {};
      if(!activity[u.id]) activity[u.id] = { logins: [], actions: [], viewedPosts: {}, meta: {} };
      activity[u.id].logins.push({ at: new Date().toISOString(), ip: '0.0.0.0', location: 'N/A (client)' });
      localStorage.setItem('userActivity', JSON.stringify(activity));
    } catch {}
    return u;
  }, []);

  const logout = useCallback(async () => {
    if(USE_SUPABASE){ await supabase.auth.signOut(); setUser(null); return; }
    localStorage.removeItem('session');
    setUser(null);
  }, []);

  const updateProfile = useCallback(async (data) => {
    if(!user) throw new Error('Chưa đăng nhập');
    if(USE_SUPABASE){
      const patch = {};
      if(data.name !== undefined) patch.name = data.name;
      if(data.bio !== undefined) patch.bio = data.bio;
      if(data.avatar !== undefined) patch.avatar_url = data.avatar;
      if(data.cover !== undefined) patch.cover_url = data.cover;
      if(Object.keys(patch).length){ await supabase.from('profiles').update(patch).eq('id', user.id); }
      const merged = { ...user, ...data };
      setUser(merged);
      return merged;
    }
    const users = JSON.parse(localStorage.getItem('users') || '[]');
    const idx = users.findIndex(u => u.id === user.id);
    if(idx === -1) throw new Error('Không tìm thấy user');
    const updated = { ...users[idx], ...data };
    users[idx] = updated;
    persistUsers(users);
    setUser(updated);
    return updated;
  }, [user]);

  const changePassword = useCallback(async ({ oldPassword, newPassword }) => {
    if(!user) throw new Error('Chưa đăng nhập');
    if(USE_SUPABASE){
      // Supabase requires re-auth; simplest: sign in then update via admin API not exposed client side -> use update user password
      const { error: signInErr } = await supabase.auth.signInWithPassword({ email: user.email, password: oldPassword });
      if(signInErr) throw new Error('Mật khẩu cũ không đúng');
      const { error: pwErr } = await supabase.auth.updateUser({ password: newPassword });
      if(pwErr) throw pwErr;
      return true;
    }
    const users = JSON.parse(localStorage.getItem('users') || '[]');
    const idx = users.findIndex(u => u.id === user.id);
    if(idx === -1) throw new Error('Không tìm thấy user');
    if(users[idx].passwordHash !== hashPassword(oldPassword)) throw new Error('Mật khẩu cũ không đúng');
    users[idx].passwordHash = hashPassword(newPassword);
    persistUsers(users);
    return true;
  }, [user]);

  const updateCover = useCallback(async (coverData) => updateProfile({ cover: coverData }), [updateProfile]);

  // Admin helpers
  const listUsers = useCallback(async () => {
    if(USE_SUPABASE){
      let columns = 'id, name, bio, avatar_url, cover_url, is_admin, suspended, upload_bytes, dob, created_at, email';
      let { data, error } = await supabase.from('profiles').select(columns);
      if(error){
        // retry without email (older schema before migration 0002)
        console.warn('[profiles] listUsers fallback (no email column?)', error.message);
        ({ data } = await supabase.from('profiles').select('id, name, bio, avatar_url, cover_url, is_admin, suspended, upload_bytes, dob, created_at'));
      }
      return (data||[]).map(r => ({ id:r.id, name:r.name, bio:r.bio, avatar:r.avatar_url, cover:r.cover_url, isAdmin:r.is_admin, suspended:r.suspended, uploadBytes:r.upload_bytes, dob:r.dob, createdAt:r.created_at, email:r.email || null }));
    }
    try { return JSON.parse(localStorage.getItem('users')||'[]'); } catch { return []; }
  }, []);

  const adminUpdateUser = useCallback(async (targetId, patch) => {
    if(!user?.isAdmin) throw new Error('Không có quyền');
    if(USE_SUPABASE){
      const update = {};
      if(patch.name !== undefined) update.name = patch.name;
      if(patch.bio !== undefined) update.bio = patch.bio;
      if(patch.avatar !== undefined) update.avatar_url = patch.avatar;
      if(patch.cover !== undefined) update.cover_url = patch.cover;
      if(patch.isAdmin !== undefined) update.is_admin = patch.isAdmin;
      if(patch.suspended !== undefined) update.suspended = patch.suspended;
      if(Object.keys(update).length){ await supabase.from('profiles').update(update).eq('id', targetId); }
      if(user.id === targetId) setUser(prev => ({ ...prev, ...patch }));
      return { id: targetId, ...patch };
    }
    const users = JSON.parse(localStorage.getItem('users')||'[]');
    const idx = users.findIndex(u=>u.id===targetId);
    if(idx===-1) throw new Error('User không tồn tại');
    if(patch.isAdmin === false && users[idx].isAdmin){
      const adminCount = users.filter(u=>u.isAdmin).length;
      if(adminCount <= 1) throw new Error('Không thể gỡ admin cuối cùng');
    }
    users[idx] = { ...users[idx], ...patch };
    persistUsers(users);
    if(user.id === targetId) setUser(users[idx]);
    return users[idx];
  }, [user]);

  const adminDeleteUser = useCallback(async (targetId) => {
    if(!user?.isAdmin) throw new Error('Không có quyền');
    if(USE_SUPABASE){
      // soft delete: mark suspended
      await supabase.from('profiles').update({ suspended:true }).eq('id', targetId);
      if(user.id === targetId){ await supabase.auth.signOut(); setUser(null); }
      return;
    }
    let users = JSON.parse(localStorage.getItem('users')||'[]');
    const target = users.find(u=>u.id===targetId);
    if(target?.isAdmin){
      const adminCount = users.filter(u=>u.isAdmin).length;
      if(adminCount <=1) throw new Error('Không thể xóa admin cuối cùng');
    }
    users = users.filter(u=>u.id !== targetId);
    persistUsers(users);
    if(user.id === targetId){ localStorage.removeItem('session'); setUser(null); }
  }, [user]);

  const adminResetPassword = useCallback((targetId, newPassword) => {
    if(!user?.isAdmin) throw new Error('Không có quyền');
    const users = JSON.parse(localStorage.getItem('users')||'[]');
    const idx = users.findIndex(u=>u.id===targetId);
    if(idx===-1) throw new Error('User không tồn tại');
    users[idx].passwordHash = hashPassword(newPassword);
    persistUsers(users);
    if(user.id === targetId) setUser(users[idx]);
  }, [user]);

  const incrementUploadBytes = useCallback(async (bytes) => {
    if(!user) return;
    if(USE_SUPABASE){
      const newTotal = (user.uploadBytes||0) + bytes;
      await supabase.from('profiles').update({ upload_bytes: newTotal }).eq('id', user.id);
      setUser(prev => ({ ...prev, uploadBytes: newTotal }));
      return;
    }
    const users = JSON.parse(localStorage.getItem('users')||'[]');
    const idx = users.findIndex(u=>u.id===user.id);
    if(idx>-1){ users[idx].uploadBytes = (users[idx].uploadBytes||0) + bytes; persistUsers(users); setUser(users[idx]); }
  }, [user]);

  const recordAction = useCallback((action, extra={}) => {
    if(!user) return;
    try {
      const activityRaw = localStorage.getItem('userActivity');
      const activity = activityRaw? JSON.parse(activityRaw): {};
      if(!activity[user.id]) activity[user.id] = { logins: [], actions: [], viewedPosts: {}, meta: {} };
      activity[user.id].actions.push({ at: new Date().toISOString(), action, ...extra });
      // cap length
      if(activity[user.id].actions.length > 500) activity[user.id].actions = activity[user.id].actions.slice(-500);
      localStorage.setItem('userActivity', JSON.stringify(activity));
    } catch {}
  }, [user]);

  const recordPostView = useCallback((postId) => {
    if(!user) return;
    try {
      const activityRaw = localStorage.getItem('userActivity');
      const activity = activityRaw? JSON.parse(activityRaw): {};
      if(!activity[user.id]) activity[user.id] = { logins: [], actions: [], viewedPosts: {}, meta: {} };
      if(!activity[user.id].viewedPosts[postId]) activity[user.id].viewedPosts[postId] = { count:0, lastAt:null };
      activity[user.id].viewedPosts[postId].count += 1;
      activity[user.id].viewedPosts[postId].lastAt = new Date().toISOString();
      localStorage.setItem('userActivity', JSON.stringify(activity));
    } catch {}
  }, [user]);

  const getActivity = useCallback((userId) => {
    try {
      const raw = localStorage.getItem('userActivity');
      if(!raw) return null;
      const data = JSON.parse(raw);
      return data[userId] || null;
    } catch { return null; }
  }, []);

  const value = { user, loading, authenticated: !!user, login, register, logout, updateProfile, changePassword, updateCover, listUsers, adminUpdateUser, adminDeleteUser, incrementUploadBytes, adminResetPassword, recordAction, recordPostView, getActivity };
  const resendConfirmation = useCallback(async (targetEmail) => {
    const emailToUse = targetEmail || pendingEmailConfirm;
    if(!emailToUse) throw new Error('Không có email cần xác nhận');
    const { error } = await supabase.auth.resend({ type: 'signup', email: emailToUse });
    if(error) throw error;
    return true;
  }, [pendingEmailConfirm]);

  value.pendingEmailConfirm = pendingEmailConfirm;
  value.resendConfirmation = resendConfirmation;

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(){
  return useContext(AuthContext);
}
