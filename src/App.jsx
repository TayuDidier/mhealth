import { Navigate, Route, Routes } from 'react-router-dom'
import { useAuth } from './contexts/AuthContext'

// Landing
import LandingPage from './pages/LandingPage'

// Auth
import LoginPage from './pages/auth/LoginPage'
import RegisterPage from './pages/auth/RegisterPage'
import ResetPasswordPage from './pages/auth/ResetPasswordPage'
import PatientOnboarding from './pages/auth/PatientOnboarding'

// Patient
import PatientLayout from './pages/patient/PatientLayout'
import HomeDashboard from './pages/patient/HomeDashboard'
import AppointmentsPage from './pages/patient/AppointmentsPage'
import KnowledgeHubPage from './pages/patient/KnowledgeHubPage'
import ArticleDetailPage from './pages/patient/ArticleDetailPage'
import HealthPassportPage from './pages/patient/HealthPassportPage'
import MessagesPage from './pages/patient/MessagesPage'
import ProfilePage from './pages/patient/ProfilePage'

// Provider
import ProviderLayout from './pages/provider/ProviderLayout'
import ProviderDashboard from './pages/provider/ProviderDashboard'
import PatientManagement from './pages/provider/PatientManagement'
import PatientDetailPage from './pages/provider/PatientDetailPage'
import ProviderAppointments from './pages/provider/ProviderAppointments'
import ProviderMessages from './pages/provider/ProviderMessages'
import ProviderProfile from './pages/provider/ProviderProfile'

// Admin
import AdminLayout from './pages/admin/AdminLayout'
import AdminOverview from './pages/admin/AdminOverview'
import ProviderManagement from './pages/admin/ProviderManagement'
import AdminPatientManagement from './pages/admin/PatientManagement'
import ContentManagement from './pages/admin/ContentManagement'
import Analytics from './pages/admin/Analytics'

function RequireAuth({ children, role }) {
  const { user, profile, loading } = useAuth()
  if (loading) return <Spinner />
  if (!user) return <Navigate to="/login" replace />
  if (role && profile?.role && profile.role !== role) {
    if (profile.role === 'admin') return <Navigate to="/admin" replace />
    if (profile.role === 'provider') return <Navigate to="/provider" replace />
    return <Navigate to="/patient" replace />
  }
  return children
}

function Spinner() {
  return (
    <div className="min-h-screen bg-background-light dark:bg-background-dark flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="w-12 h-12 rounded-full gradient-pink flex items-center justify-center animate-pulse">
          <span className="material-symbols-outlined text-white text-2xl">favorite</span>
        </div>
        <p className="text-sm text-gray-500 font-medium">Loading MHealth…</p>
      </div>
    </div>
  )
}

export default function App() {
  return (
    <Routes>
      {/* Landing */}
      <Route path="/" element={<LandingPage />} />

      {/* Public */}
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/reset-password" element={<ResetPasswordPage />} />

      {/* Onboarding */}
      <Route path="/onboarding" element={
        <RequireAuth role="patient"><PatientOnboarding /></RequireAuth>
      } />

      {/* Patient */}
      <Route path="/patient" element={<RequireAuth role="patient"><PatientLayout /></RequireAuth>}>
        <Route index element={<HomeDashboard />} />
        <Route path="appointments" element={<AppointmentsPage />} />
        <Route path="hub" element={<KnowledgeHubPage />} />
        <Route path="hub/:id" element={<ArticleDetailPage />} />
        <Route path="passport" element={<HealthPassportPage />} />
        <Route path="messages" element={<MessagesPage />} />
        <Route path="profile" element={<ProfilePage />} />
      </Route>

      {/* Provider */}
      <Route path="/provider" element={<RequireAuth role="provider"><ProviderLayout /></RequireAuth>}>
        <Route index element={<ProviderDashboard />} />
        <Route path="patients" element={<PatientManagement />} />
        <Route path="patients/:id" element={<PatientDetailPage />} />
        <Route path="appointments" element={<ProviderAppointments />} />
        <Route path="messages" element={<ProviderMessages />} />
        <Route path="profile" element={<ProviderProfile />} />
      </Route>

      {/* Admin */}
      <Route path="/admin" element={<RequireAuth role="admin"><AdminLayout /></RequireAuth>}>
        <Route index element={<AdminOverview />} />
        <Route path="providers" element={<ProviderManagement />} />
        <Route path="patients" element={<AdminPatientManagement />} />
        <Route path="content" element={<ContentManagement />} />
        <Route path="analytics" element={<Analytics />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

