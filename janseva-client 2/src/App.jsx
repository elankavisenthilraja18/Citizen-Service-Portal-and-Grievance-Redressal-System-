import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './auth/AuthContext';
import { ToastProvider } from './components/Toast';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import { RequireRole } from './components/Guards';
import Login from './pages/Login';
import ForgotPassword from './pages/ForgotPassword';
import Register from './pages/Register';
import Home from './pages/Home';
import Services from './pages/Services';
import Track from './pages/Track';
import Faq from './pages/Faq';

import NotFound from './pages/NotFound';

import CitizenDashboard from './pages/citizen/CitizenDashboard';
import MyApplications from './pages/citizen/MyApplications';
import ApplicationDetail from './pages/citizen/ApplicationDetail';
import Apply from './pages/citizen/Apply';
import CertificateView from './pages/citizen/CertificateView';
import MyComplaints from './pages/citizen/MyComplaints';
import ComplaintDetail from './pages/citizen/ComplaintDetail';
import GrievanceForm from './pages/citizen/GrievanceForm';
import Profile from './pages/citizen/Profile';

import VerificationQueue from './pages/officer/VerificationQueue';
import FieldOfficerDashboard from './pages/officer/FieldOfficerDashboard';
import DepartmentOfficerDashboard from './pages/officer/DepartmentOfficerDashboard';
import GrievanceOfficerDashboard from './pages/officer/GrievanceOfficerDashboard';

import AdminOverview from './pages/admin/AdminOverview';
import ManageOfficers from './pages/admin/ManageOfficers';
import ManageCatalog from './pages/admin/ManageCatalog';
import Analytics from './pages/admin/Analytics';

function Layout({ children }) {
  return (
    <>
      <Navbar />
      <main>{children}</main>
      <Footer />
    </>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <BrowserRouter>
          <Routes>
            {/* Public */}
            <Route path="/" element={<Layout><Home /></Layout>} />
            <Route path="/services" element={<Layout><Services /></Layout>} />
            <Route path="/track" element={<Layout><Track /></Layout>} />
            <Route path="/faq" element={<Layout><Faq /></Layout>} />
            <Route path="/login" element={<Layout><Login /></Layout>} />
            <Route path="/forgot-password" element={<Layout><ForgotPassword /></Layout>} />
            <Route path="/register" element={<Layout><Register /></Layout>} />

            {/* Citizen */}
            <Route element={<RequireRole roles={['CITIZEN']} />}>
              <Route path="/citizen" element={<Layout><CitizenDashboard /></Layout>} />
              <Route path="/citizen/applications" element={<Layout><MyApplications /></Layout>} />
              <Route path="/citizen/applications/:id" element={<Layout><ApplicationDetail /></Layout>} />
              <Route path="/citizen/apply" element={<Layout><Apply /></Layout>} />
              <Route path="/citizen/certificates/:applicationId" element={<Layout><CertificateView /></Layout>} />
              <Route path="/citizen/complaints" element={<Layout><MyComplaints /></Layout>} />
              <Route path="/citizen/complaints/:id" element={<Layout><ComplaintDetail /></Layout>} />
              <Route path="/citizen/grievance/new" element={<Layout><GrievanceForm /></Layout>} />
              <Route path="/citizen/profile" element={<Layout><Profile /></Layout>} />
            </Route>

            {/* VAO / RI / Tahsildar */}
            <Route element={<RequireRole roles={['VAO', 'RI', 'TAHSILDAR']} />}>
              <Route path="/officer/queue" element={<Layout><VerificationQueue /></Layout>} />
            </Route>

            {/* Field Officer */}
            <Route element={<RequireRole roles={['FIELD_OFFICER']} />}>
              <Route path="/officer/field" element={<Layout><FieldOfficerDashboard /></Layout>} />
            </Route>

            {/* Department Officer */}
            <Route element={<RequireRole roles={['DEPARTMENT_OFFICER']} />}>
              <Route path="/officer/department" element={<Layout><DepartmentOfficerDashboard /></Layout>} />
            </Route>

            {/* Grievance Officer */}
            <Route element={<RequireRole roles={['GRIEVANCE_OFFICER']} />}>
              <Route path="/officer/grievance-oversight" element={<Layout><GrievanceOfficerDashboard /></Layout>} />
            </Route>

            {/* Administrator */}
            <Route element={<RequireRole roles={['ADMINISTRATOR']} />}>
              <Route path="/admin" element={<Layout><AdminOverview /></Layout>} />
              <Route path="/admin/officers" element={<Layout><ManageOfficers /></Layout>} />
              <Route path="/admin/catalog" element={<Layout><ManageCatalog /></Layout>} />
              <Route path="/admin/analytics" element={<Layout><Analytics /></Layout>} />
            </Route>

            <Route path="*" element={<Layout><NotFound /></Layout>} />
          </Routes>
        </BrowserRouter>
      </ToastProvider>
    </AuthProvider>
  );
}
