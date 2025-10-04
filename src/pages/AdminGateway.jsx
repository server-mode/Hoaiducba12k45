import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import { AdminPage } from './AdminPage.jsx';

// /admin route: if already admin -> show dashboard
// if logged in but not admin -> message no permission
// if not logged in -> dedicated admin login form (blocks normal users)
export function AdminGateway(){
  const { user, login, loading } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  if(loading) return null;
  if(user?.isAdmin){
    return <AdminPage />;
  }
  if(user && !user.isAdmin){
    return (
      <div className="max-w-md mx-auto py-16 px-6 text-center space-y-6">
        <h1 className="text-2xl font-bold text-red-600 dark:text-red-400">Không có quyền</h1>
        <p className="text-sm text-gray-600 dark:text-gray-400">Bạn đã đăng nhập nhưng không phải admin. Hãy đăng xuất và đăng nhập bằng tài khoản admin.</p>
      </div>
    );
  }

  async function handleSubmit(e){
    e.preventDefault(); setError(null); setSubmitting(true);
    try {
      const u = await login({ email, password });
      if(!u.isAdmin){
        setError('Tài khoản này không phải admin');
      }
    } catch(err){ setError(err.message); } finally { setSubmitting(false); }
  }

  return (
    <div className="max-w-md mx-auto py-16 px-6">
      <h1 className="text-3xl font-bold mb-6 text-green-600 dark:text-green-400">Admin Login</h1>
      <form onSubmit={handleSubmit} className="space-y-4 bg-white dark:bg-gray-800/60 p-6 rounded-xl shadow">
        <div className="text-xs text-gray-500 dark:text-gray-400">Chỉ dành cho quản trị viên. Tài khoản thường hãy dùng trang đăng nhập bình thường.</div>
        <div>
          <label className="block text-sm font-medium mb-1">Email Admin</label>
          <input type="email" value={email} onChange={e=>setEmail(e.target.value)} required className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-green-500" />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Mật khẩu</label>
          <input type="password" value={password} onChange={e=>setPassword(e.target.value)} required className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-green-500" />
        </div>
        {error && <div className="text-sm text-red-500">{error}</div>}
        <button disabled={submitting} className="w-full py-2 rounded-lg bg-green-600 hover:bg-green-700 disabled:opacity-60 text-white font-semibold transition">{submitting ? 'Đang xử lý...' : 'Đăng nhập admin'}</button>
      </form>
    </div>
  );
}
