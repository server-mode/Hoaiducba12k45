import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

export function ProtectedRoute({ children }){
  const { authenticated, loading } = useAuth();
  const loc = useLocation();
  if(loading) return <div className="py-24 text-center text-gray-500">Đang kiểm tra phiên đăng nhập...</div>;
  if(!authenticated) return <Navigate to="/login" replace state={{ from: loc.pathname }} />;
  return children;
}
