import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

export function LoginPage(){
  const { login } = useAuth();
  const nav = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  async function handleSubmit(e){
    e.preventDefault();
    setError(null); setLoading(true);
    try { 
      const u = await login({ email, password }); 
      if(u.isAdmin){
        setError('Tài khoản admin: hãy đăng nhập tại /admin');
        return;
      }
      nav('/');
    } catch(err){ setError(err.message); } finally { setLoading(false); }
  }

  return (
    <div className="max-w-md mx-auto py-16 px-6">
  <h1 className="text-3xl font-bold mb-2 text-green-600 dark:text-green-400">Đăng nhập</h1>
  <p className="text-xs mb-4 text-gray-500 dark:text-gray-400">Admin? dùng đường dẫn <span className="font-mono bg-gray-100 dark:bg-gray-700 px-1 rounded">/admin</span></p>
      <form onSubmit={handleSubmit} className="space-y-4 bg-white dark:bg-gray-800/60 p-6 rounded-xl shadow">
        <div>
          <label className="block text-sm font-medium mb-1">Email</label>
          <input type="email" className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-green-500" value={email} onChange={e=>setEmail(e.target.value)} required />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Mật khẩu</label>
            <input type="password" className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-green-500" value={password} onChange={e=>setPassword(e.target.value)} required />
        </div>
        {error && <div className="text-sm text-red-500">{error}</div>}
        <button disabled={loading} className="w-full py-2 rounded-lg bg-green-600 hover:bg-green-700 disabled:opacity-60 text-white font-semibold transition">{loading ? 'Đang xử lý...' : 'Đăng nhập'}</button>
        <p className="text-sm text-gray-600 dark:text-gray-400">Chưa có tài khoản? <Link to="/register" className="text-green-600 dark:text-green-400 font-medium">Đăng ký</Link></p>
      </form>
    </div>
  );
}
