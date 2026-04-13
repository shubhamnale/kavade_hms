import React, { useState, useEffect, lazy, Suspense } from 'react'
import { AuthProvider, useAuth } from './context/AuthContext'
import { doctorsAPI } from './api'
import Sidebar      from './components/Sidebar'
import Topbar       from './components/Topbar'
import { Spinner }  from './components/UI'
import './responsive.css'

const LoginPage       = lazy(() => import('./pages/LoginPage'))
const Dashboard       = lazy(() => import('./pages/Dashboard'))
const PatientsPage    = lazy(() => import('./pages/PatientsPage'))
const DoctorsPage     = lazy(() => import('./pages/DoctorsPage'))
const UsersPage       = lazy(() => import('./pages/UsersPage'))
const ReportsPage     = lazy(() => import('./pages/ReportsPage'))
const TimingPage      = lazy(() => import('./pages/TimingPage'))
const DailyReportPage = lazy(() => import('./pages/DailyReportPage'))
const ProfilePage     = lazy(() => import('./pages/ProfilePage'))

const PAGE_LABELS = {
  dash:         'Dashboard',
  patients:     'Patients',
  doctors:      'Doctors',
  users:        'User Accounts',
  reports:      'Reports',
  timing:       'Timing Log',
  dailyreport:  'Daily Patient Report',
  profile:      'My Profile',
}

function Layout() {
  const [active,     setActive]     = useState('dash')
  const [doctors,    setDoctors]    = useState([])
  const [docLoading, setDocLoading] = useState(true)
  const [sidebarOpen, setSidebarOpen] = useState(false)

  useEffect(() => {
    doctorsAPI.getAll()
      .then(r => setDoctors(r.data.data))
      .catch(console.error)
      .finally(() => setDocLoading(false))
  }, [])

  const renderPage = () => {
    switch (active) {
      case 'dash':     return <Dashboard />
      case 'patients': return <PatientsPage doctors={doctors} />
      case 'doctors':  return <DoctorsPage  doctors={doctors} loading={docLoading} onDoctorAdded={d => setDoctors(p => [d,...p])} />
      case 'users':    return <UsersPage    doctors={doctors} />
      case 'reports':      return <ReportsPage />
      case 'timing':       return <TimingPage />
      case 'dailyreport':  return <DailyReportPage />
      case 'profile':  return <ProfilePage />
      default:         return <Dashboard />
    }
  }

  return (
    <div>
      {/* Overlay for mobile/tablet sidebar */}
      <div
        className={`sidebar-overlay${sidebarOpen ? ' overlay-visible' : ''}`}
        onClick={() => setSidebarOpen(false)}
      />
      <Sidebar
        active={active}
        setActive={setActive}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />
      <div className="hms-main" style={{ marginLeft:240, paddingTop:60, minHeight:'100vh' }}>
        <Topbar
          pageTitle={PAGE_LABELS[active] || 'Dashboard'}
          onMenuToggle={() => setSidebarOpen(o => !o)}
        />
        <Suspense fallback={<div style={{ padding:28 }}><Spinner text="Loading page..." /></div>}>
          {renderPage()}
        </Suspense>
      </div>
    </div>
  )
}

function AppContent() {
  const { user, loading } = useAuth()
  if (loading) return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'center', minHeight:'100vh' }}>
      <Spinner text="Starting Kavade HMS…" />
    </div>
  )
  return user ? <Layout /> : (
    <Suspense fallback={<div style={{ display:'flex', alignItems:'center', justifyContent:'center', minHeight:'100vh' }}><Spinner text="Loading..." /></div>}>
      <LoginPage />
    </Suspense>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  )
}
