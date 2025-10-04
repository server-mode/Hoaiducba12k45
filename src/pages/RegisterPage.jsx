import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

export function RegisterPage(){
  const { register } = useAuth();
  const nav = useNavigate();
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  async function handleSubmit(e){
    e.preventDefault();
    setError(null);
    if(password !== confirm){ setError('Mật khẩu nhập lại không khớp'); return; }
    setLoading(true);
    try { await register({ email, password, name }); nav('/'); } catch(err){ setError(err.message); } finally { setLoading(false); }
  }

  return (
    <div className="max-w-md mx-auto py-16 px-6">
      <h1 className="text-3xl font-bold mb-6 text-green-600 dark:text-green-400">Đăng ký</h1>
      <form onSubmit={handleSubmit} className="space-y-4 bg-white dark:bg-gray-800/60 p-6 rounded-xl shadow">
        <div>
          <label className="block text-sm font-medium mb-1">Họ tên</label>
          <input type="text" className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-green-500" value={name} onChange={e=>setName(e.target.value)} placeholder="Tuỳ chọn" />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Email</label>
          <input type="email" className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-green-500" value={email} onChange={e=>setEmail(e.target.value)} required />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Mật khẩu</label>
          <input type="password" className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-green-500" value={password} onChange={e=>setPassword(e.target.value)} required />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Nhập lại mật khẩu</label>
          <input type="password" className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-green-500" value={confirm} onChange={e=>setConfirm(e.target.value)} required />
        </div>
        {error && <div className="text-sm text-red-500">{error}</div>}
        <button disabled={loading} className="w-full py-2 rounded-lg bg-green-600 hover:bg-green-700 disabled:opacity-60 text-white font-semibold transition">{loading ? 'Đang xử lý...' : 'Tạo tài khoản'}</button>
        <p className="text-sm text-gray-600 dark:text-gray-400">Đã có tài khoản? <Link to="/login" className="text-green-600 dark:text-green-400 font-medium">Đăng nhập</Link></p>
      </form>
    </div>
  );
}
