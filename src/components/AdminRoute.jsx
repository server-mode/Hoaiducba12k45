import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

export function AdminRoute({ children }){
  const { user, loading } = useAuth();
  if(loading) return null;
  if(!user?.isAdmin) return <Navigate to="/" replace />;
  return children;
}
