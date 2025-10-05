import React from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import App from './App.jsx';
import { HomePage } from './pages/HomePage.jsx';
import { GioiThieuPage } from './pages/GioiThieuPage.jsx';
import { ThanhtichPage } from './pages/ThanhtichPage.jsx';
import { LoginPage } from './pages/LoginPage.jsx';
import { RegisterPage } from './pages/RegisterPage.jsx';
import { ProfilePage } from './pages/ProfilePage.jsx';
import { AdminGateway } from './pages/AdminGateway.jsx';
import { ProtectedRoute } from './components/ProtectedRoute.jsx'; // still used for other routes if any
import { AuthProvider } from './context/AuthContext.jsx';
import { PostProvider } from './context/PostContext.jsx';
import './index.css';

createRoot(document.getElementById('root')).render(
	<AuthProvider>
		<PostProvider>
			<BrowserRouter >
				<Routes>
					<Route path="/" element={<App />}> 
						<Route index element={<HomePage />} />
						<Route path="gioithieu" element={<GioiThieuPage />} />
						<Route path="thanhtich" element={<ThanhtichPage />} />
						<Route path="profile" element={<ProfilePage />} />
						<Route path="profile/:id" element={<ProfilePage />} />
						<Route path="admin" element={<AdminGateway />} />
						<Route path="login" element={<LoginPage />} />
						<Route path="register" element={<RegisterPage />} />
					</Route>
				</Routes>
			</BrowserRouter>
		</PostProvider>
	</AuthProvider>
);
