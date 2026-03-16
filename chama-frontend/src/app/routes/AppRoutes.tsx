import { Navigate, Route, Routes } from 'react-router-dom'
import { ProtectedRoute } from '../guards/ProtectedRoute'
import { ChamaRoute } from '../guards/ChamaRoute'
import { RoleRoute } from '../guards/RoleRoute'
import { MemberLayout } from '../layout/MemberLayout'
import { AdminLayout } from '../layout/AdminLayout'
import { LandingPage } from '../../pages/LandingPage'
import { Login } from '../../pages/Login'
import { Register } from '../../pages/Register'
import { ForgotPassword } from '../../pages/ForgotPassword'
import { ResetPassword } from '../../pages/ResetPassword'
import { AcceptInvite } from '../../pages/AcceptInvite'
import { SelectChama } from '../../pages/SelectChama'
import { JoinChama } from '../../pages/JoinChama'
import { Unauthorized } from '../../pages/Unauthorized'
import { MemberDashboard } from '../../pages/member/Dashboard'
import { AdminDashboard } from '../../pages/admin/Dashboard'
import { MemberContributions } from '../../pages/member/MemberContributions'
import { MemberLoans } from '../../pages/member/MemberLoans'
import { MemberTransactions } from '../../pages/member/Transactions'
import { MemberMpesa } from '../../pages/member/Mpesa'
import { MemberAnalytics } from '../../pages/member/MemberAnalytics'
import { MemberSettings } from '../../pages/member/Settings'
import { ChamaHealth } from '../../pages/member/ChamaHealth'
import { Members } from '../../pages/Members'
import { Contributions } from '../../pages/Contributions'
import { Loans } from '../../pages/Loans'
import { AdminTransactions } from '../../pages/admin/Transactions'
import { AdminMpesa } from '../../pages/admin/Mpesa'
import { JoinRequests } from '../../pages/admin/JoinRequests'
import { AdminSettings } from '../../pages/admin/Settings'
import { AuditLog } from '../../pages/admin/AuditLog'
import { Reports } from '../../pages/Reports'
import { Analytics } from '../../pages/Analytics'
import { SuperAdminRoute } from '../guards/SuperAdminRoute'
import { SuperAdminLayout } from '../layout/SuperAdminLayout'
import { SuperDashboard } from '../../pages/super/SuperDashboard'
import { SuperChamas } from '../../pages/super/SuperChamas'
import { SuperUsers } from '../../pages/super/SuperUsers'
import { SuperAudit } from '../../pages/super/SuperAudit'
import { Notifications } from '../../pages/Notifications'
import { AccountLayout } from '../layout/AccountLayout'
import { Profile } from '../../pages/Profile'
import { AccountSettings } from '../../pages/AccountSettings'
import { About } from '../../pages/About'

export function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password" element={<ResetPassword />} />
      <Route path="/accept-invite" element={<AcceptInvite />} />
      <Route path="/unauthorized" element={<Unauthorized />} />

      {/* Protected routes */}
      <Route element={<ProtectedRoute />}>
        <Route path="/select-chama" element={<SelectChama />} />
        <Route path="/join-chama" element={<JoinChama />} />
        <Route path="/notifications" element={<Notifications />} />

        <Route element={<AccountLayout />}>
          <Route path="profile" element={<Profile />} />
          <Route path="settings" element={<AccountSettings />} />
          <Route path="help" element={<Navigate to="/about" replace />} />
          <Route path="about" element={<About />} />
        </Route>

        {/* Super Admin - only match when path starts with /super */}
        <Route path="/super" element={<SuperAdminRoute />}>
          <Route element={<SuperAdminLayout />}>
            <Route index element={<SuperDashboard />} />
            <Route path="dashboard" element={<SuperDashboard />} />
            <Route path="chamas" element={<SuperChamas />} />
            <Route path="users" element={<SuperUsers />} />
            <Route path="audit" element={<SuperAudit />} />
          </Route>
        </Route>

        {/* Member routes with chamaId */}
        <Route element={<ChamaRoute />}>
          <Route element={<RoleRoute allowedRoles={['MEMBER']} />}>
            <Route path="/member/:chamaId" element={<MemberLayout />}>
              <Route index element={<Navigate to="dashboard" replace />} />
              <Route path="dashboard" element={<MemberDashboard />} />
              <Route path="contributions" element={<MemberContributions />} />
              <Route path="loans" element={<MemberLoans />} />
              <Route path="transactions" element={<MemberTransactions />} />
              <Route path="chama-health" element={<ChamaHealth />} />
              <Route path="mpesa" element={<MemberMpesa />} />
              <Route path="analytics" element={<MemberAnalytics />} />
              <Route path="settings" element={<MemberSettings />} />
            </Route>
          </Route>

          {/* Admin routes with chamaId */}
          <Route element={<RoleRoute allowedRoles={['ADMIN', 'TREASURER', 'CHAIR', 'AUDITOR']} />}>
            <Route path="/admin/:chamaId" element={<AdminLayout />}>
              <Route index element={<Navigate to="dashboard" replace />} />
              <Route path="dashboard" element={<AdminDashboard />} />
              <Route path="members" element={<Members />} />
              <Route path="contributions" element={<Contributions />} />
              <Route path="loans" element={<Loans />} />
              <Route path="transactions" element={<AdminTransactions />} />
              <Route path="mpesa" element={<AdminMpesa />} />
              <Route path="join-requests" element={<JoinRequests />} />
              <Route path="reports" element={<Reports />} />
              <Route path="analytics" element={<Analytics />} />
              <Route path="audit-log" element={<AuditLog />} />
              <Route path="settings" element={<AdminSettings />} />
            </Route>
          </Route>
        </Route>
      </Route>

      {/* Redirect old routes - only exact /app, /member, /admin (no id) so nested /admin/:id/mpesa still matches */}
      <Route path="/app" element={<Navigate to="/select-chama" replace />} />
      <Route path="/app/*" element={<Navigate to="/select-chama" replace />} />
      <Route path="/member" element={<Navigate to="/select-chama" replace />} />
      <Route path="/admin" element={<Navigate to="/select-chama" replace />} />
    </Routes>
  )
}
