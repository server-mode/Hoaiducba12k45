import React, { useState } from 'react';
import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useTheme } from './hooks/useTheme';
import { useAuth } from './context/AuthContext.jsx';
import { UserMenu } from './components/UserMenu.jsx';

export default function App(){
  const { dark, toggle } = useTheme();
  const { user, authenticated, logout } = useAuth();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);

  const navLinkClass = ({ isActive }) =>
    (isActive ? 'text-green-600 dark:text-green-400 font-semibold' : 'text-gray-600 dark:text-gray-300 hover:text-green-600 dark:hover:text-green-400 font-medium');

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-black text-gray-800 dark:text-gray-200 flex flex-col">
      <header className="bg-white dark:bg-gray-900/80 backdrop-blur-sm shadow-md sticky top-0 z-30">
        <nav className="container mx-auto px-6 py-3 flex justify-between items-center">
          <Link to="/" className="text-2xl font-bold text-green-600 dark:text-green-400">LỚP A12K45</Link>
          <div className="hidden md:flex items-center space-x-6">
            <NavLink to="/" end className={navLinkClass}>Trang chủ</NavLink>
            <NavLink to="/gioithieu" className={navLinkClass}>Giới Thiệu</NavLink>
            <NavLink to="/thanhtich" className={navLinkClass}>Thành Tích</NavLink>
            {authenticated && user?.isAdmin && <NavLink to="/admin" className={navLinkClass}>Admin</NavLink>}
            <UserMenu />
            <button type="button" onClick={toggle} className="text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg text-sm p-2.5 transition-all" aria-label="Đổi giao diện">
              {dark ? '🌙' : '☀️'}
            </button>
          </div>
          <div className="md:hidden flex items-center">
            <button type="button" onClick={toggle} className="text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg text-sm p-2.5 mr-2 transition-all" aria-label="Đổi giao diện">
              {dark ? '🌙' : '☀️'}
            </button>
            <button onClick={() => setMobileOpen(o=>!o)} className="outline-none" aria-label="Mở menu">
              <svg className="w-6 h-6 text-gray-500 hover:text-green-600 dark:hover:text-green-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16"/></svg>
            </button>
          </div>
        </nav>
        <div id="mobile-menu" className={(mobileOpen?'' : 'hidden ') + 'md:hidden'}>
          <NavLink to="/" end className="block py-3 px-6 text-sm text-green-600 dark:text-green-400 font-semibold" onClick={()=>setMobileOpen(false)}>Trang chủ</NavLink>
          <NavLink to="/gioithieu" className="block py-3 px-6 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-800" onClick={()=>setMobileOpen(false)}>Giới Thiệu</NavLink>
          <NavLink to="/thanhtich" className="block py-3 px-6 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-800" onClick={()=>setMobileOpen(false)}>Thành Tích</NavLink>
          <div className="py-3 px-6">
            <UserMenu />
          </div>
        </div>
      </header>

      <div className="flex-1 flex flex-col">
        <Outlet />
      </div>

      <footer className="bg-gray-800/50 dark:bg-black/50 text-white py-6 mt-12">
        <div className="container mx-auto px-6 text-center">
          <p>&copy; 2025 - A12K45</p>
        </div>
      </footer>
    </div>
  );
}
