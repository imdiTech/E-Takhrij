import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { GoogleOAuthProvider } from '@react-oauth/google'
import Layout from './components/Layout'
import SearchPage from './pages/SearchPage'
import DetailPage from './pages/DetailPage'
import AnalysisPage from './pages/AnalysisPage'
import ChatPage from './pages/ChatPage'
import ProfilePage from './pages/ProfilePage'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import AdminDashboardPage from './pages/AdminDashboardPage'
import ThematicPage from './pages/ThematicPage'
import ProtectedRoute from './components/ProtectedRoute'
import { AuthProvider } from './context/AuthContext'

const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;

function App() {
  return (
    <GoogleOAuthProvider clientId={googleClientId}>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Layout />}>
              <Route index element={<ProtectedRoute><SearchPage /></ProtectedRoute>} />
              <Route path="hadith/:id" element={<ProtectedRoute><DetailPage /></ProtectedRoute>} />
              <Route path="hadith/:id/analysis" element={<ProtectedRoute><AnalysisPage /></ProtectedRoute>} />
              <Route path="chat" element={<ProtectedRoute><ChatPage /></ProtectedRoute>} />
              <Route path="tematik" element={<ProtectedRoute><ThematicPage /></ProtectedRoute>} />
              <Route path="profile" element={<ProfilePage />} />
              <Route path="login" element={<LoginPage />} />
              <Route path="register" element={<RegisterPage />} />
              <Route 
                path="admin" 
                element={
                  <ProtectedRoute adminOnly={true}>
                    <AdminDashboardPage />
                  </ProtectedRoute>
                } 
              />
            </Route>
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </GoogleOAuthProvider>
  )
}

export default App
