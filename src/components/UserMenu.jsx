import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

export function UserMenu(){
  const { authenticated, user, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const nav = useNavigate();
  const ref = useRef(null);

  useEffect(() => {
    function onClick(e){ if(ref.current && !ref.current.contains(e.target)) setOpen(false); }
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  function handleLogout(){ logout(); setOpen(false); nav('/'); }

  const initials = (user?.name || user?.email || '?').trim().charAt(0).toUpperCase();

  return (
    <div className="relative" ref={ref}>
      <button type="button" onClick={()=>setOpen(o=>!o)} className="w-10 h-10 rounded-full bg-gradient-to-br from-green-500 to-green-600 text-white font-semibold flex items-center justify-center shadow hover:from-green-600 hover:to-green-700 focus:outline-none focus:ring-2 focus:ring-green-400 overflow-hidden">
        {authenticated ? (
          user?.avatar ? <img src={user.avatar} alt="avatar" className="w-full h-full object-cover" /> : initials
        ) : '👤'}
      </button>
      {open && (
        <div className="absolute right-0 mt-2 w-56 rounded-xl overflow-hidden shadow-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 origin-top-right animate-scaleFade">
          {!authenticated && (
            <div className="py-2">
              <Link to="/login" onClick={()=>setOpen(false)} className="block px-4 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200">Đăng nhập</Link>
              <Link to="/register" onClick={()=>setOpen(false)} className="block px-4 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200">Đăng ký</Link>
            </div>
          )}
          {authenticated && (
            <div className="py-2">
              <div className="px-4 pt-2 pb-1 text-xs uppercase tracking-wide text-gray-400">Tài khoản</div>
              <div className="px-4 pb-2 text-sm font-medium text-gray-800 dark:text-gray-100">{user.name || user.email}</div>
              <Link to="/profile" onClick={()=>setOpen(false)} className="block px-4 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200">Hồ sơ</Link>
              <button onClick={handleLogout} className="w-full text-left px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 font-semibold">Đăng xuất</button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
