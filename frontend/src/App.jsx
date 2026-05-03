import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import { Toaster } from 'react-hot-toast';

// Auth Pages
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/auth/LoginPage';
import RegisterPage from './pages/auth/RegisterPage';
import ForgotPasswordPage from './pages/auth/ForgotPasswordPage';
import ResetPasswordPage from './pages/auth/ResetPasswordPage';

// Admin Pages
import AdminLayout from './pages/admin/AdminLayout';
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminUsers from './pages/admin/AdminUsers';
import AdminCategories from './pages/admin/AdminCategories';
import AdminTests from './pages/admin/AdminTests';
import AdminTestEditor from './pages/admin/AdminTestEditor';
import AdminAnalytics from './pages/admin/AdminAnalytics';
import AdminFeedback from './pages/admin/AdminFeedback';
import AdminModeration from './pages/admin/AdminModeration';
import AdminAuditLog from './pages/admin/AdminAuditLog';

// Student Pages
import StudentLayout from './pages/student/StudentLayout';
import StudentDashboard from './pages/student/StudentDashboard';
import StudentTests from './pages/student/StudentTests';
import ExamInterface from './pages/student/ExamInterface';
import ResultPage from './pages/student/ResultPage';
import AttemptHistory from './pages/student/AttemptHistory';
import StudentProfile from './pages/student/StudentProfile';
import StudentAnalytics from './pages/student/StudentAnalytics';
import StudentFeedback from './pages/student/StudentFeedback';

const ProtectedRoute = ({ children, role }) => {
  const { user, loading } = useAuth();
  if (loading) return <div className="min-h-screen flex items-center justify-center"><div className="spinner" /></div>;
  if (!user) return <Navigate to="/login" replace />;
  if (role === 'SUPER_ADMIN' && user.role !== 'SUPER_ADMIN') return <Navigate to="/student/dashboard" replace />;
  if (role === 'STUDENT' && user.role === 'SUPER_ADMIN') return <Navigate to="/admin/dashboard" replace />;
  return children;
};

const PublicRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return <div className="min-h-screen flex items-center justify-center"><div className="spinner" /></div>;
  if (user) {
    return user.role === 'SUPER_ADMIN'
      ? <Navigate to="/admin/dashboard" replace />
      : <Navigate to="/student/dashboard" replace />;
  }
  return children;
};

function App() {
  return (
    <>
      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            background: '#1f2937',
            color: '#f1f5f9',
            border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: '12px',
          },
          success: { iconTheme: { primary: '#22c55e', secondary: '#fff' } },
          error: { iconTheme: { primary: '#ef4444', secondary: '#fff' } },
        }}
      />
      <Routes>
        {/* Public */}
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<PublicRoute><LoginPage /></PublicRoute>} />
        <Route path="/register" element={<PublicRoute><RegisterPage /></PublicRoute>} />
        <Route path="/forgot-password" element={<PublicRoute><ForgotPasswordPage /></PublicRoute>} />
        <Route path="/reset-password" element={<PublicRoute><ResetPasswordPage /></PublicRoute>} />

        {/* Admin */}
        <Route path="/admin" element={<ProtectedRoute role="SUPER_ADMIN"><AdminLayout /></ProtectedRoute>}>
          <Route index element={<Navigate to="dashboard" replace />} />
          <Route path="dashboard" element={<AdminDashboard />} />
          <Route path="users" element={<AdminUsers />} />
          <Route path="categories" element={<AdminCategories />} />
          <Route path="tests" element={<AdminTests />} />
          <Route path="tests/create" element={<AdminTestEditor />} />
          <Route path="tests/:id/edit" element={<AdminTestEditor />} />
          <Route path="analytics" element={<AdminAnalytics />} />
          <Route path="feedback" element={<AdminFeedback />} />
          <Route path="moderation" element={<AdminModeration />} />
          <Route path="audit-log" element={<AdminAuditLog />} />
        </Route>

        {/* Student */}
        <Route path="/student" element={<ProtectedRoute role="STUDENT"><StudentLayout /></ProtectedRoute>}>
          <Route index element={<Navigate to="dashboard" replace />} />
          <Route path="dashboard" element={<StudentDashboard />} />
          <Route path="tests" element={<StudentTests />} />
          <Route path="analytics" element={<StudentAnalytics />} />
          <Route path="history" element={<AttemptHistory />} />
          <Route path="profile" element={<StudentProfile />} />
          <Route path="feedback" element={<StudentFeedback />} />
        </Route>

        {/* Exam Interface — full screen, outside student layout */}
        <Route path="/exam/:testId" element={<ProtectedRoute role="STUDENT"><ExamInterface /></ProtectedRoute>} />
        <Route path="/result/:attemptId" element={<ProtectedRoute role="STUDENT"><ResultPage /></ProtectedRoute>} />

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  );
}

export default App;
