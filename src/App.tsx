import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext.tsx';
import { NotificationProvider } from './context/NotificationContext.tsx';
import { Navbar } from './components/Navbar.tsx';
import { Footer } from './components/Footer.tsx';

// Pages
import { LandingPage } from './pages/LandingPage.tsx';
import { CitizenDashboard } from './pages/CitizenDashboard.tsx';
import { NewComplaintPage } from './pages/NewComplaintPage.tsx';
import { ComplaintDetailPage } from './pages/ComplaintDetailPage.tsx';
import { IssueMapPage } from './pages/IssueMapPage.tsx';
import { OfficerDashboard } from './pages/OfficerDashboard.tsx';
import { AdminDashboard } from './pages/AdminDashboard.tsx';
import { LoginPage } from './pages/LoginPage.tsx';
import { RegisterPage } from './pages/RegisterPage.tsx';
import { ForgotPasswordPage } from './pages/ForgotPasswordPage.tsx';
import { ProfilePage } from './pages/ProfilePage.tsx';

function MainRouter() {
  const { user } = useAuth();
  const [currentTab, setCurrentTab] = useState<string>('home');
  const [activeComplaintId, setActiveComplaintId] = useState<string | null>(null);

  const handleOpenComplaint = (id: string) => {
    setActiveComplaintId(id);
    setCurrentTab('detail');
  };

  const handleReturnFromDetail = () => {
    setActiveComplaintId(null);
    if (user?.role === 'officer') {
      setCurrentTab('officer');
    } else if (user?.role === 'admin') {
      setCurrentTab('admin');
    } else {
      setCurrentTab('home');
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-slate-950 font-sans text-slate-100 antialiased selection:bg-emerald-500 selection:text-slate-950">
      <Navbar
        currentTab={currentTab}
        setCurrentTab={(tab) => {
          setActiveComplaintId(null);
          setCurrentTab(tab);
        }}
        onOpenComplaint={handleOpenComplaint}
      />

      <main className="flex-1">
        {currentTab === 'home' && (
          user ? (
            <CitizenDashboard
              onNavigate={setCurrentTab}
              onOpenComplaint={handleOpenComplaint}
            />
          ) : (
            <LandingPage
              onNavigate={setCurrentTab}
              onOpenComplaint={handleOpenComplaint}
            />
          )
        )}

        {currentTab === 'my-complaints' && (
          <CitizenDashboard
            onNavigate={setCurrentTab}
            onOpenComplaint={handleOpenComplaint}
          />
        )}

        {currentTab === 'report' && (
          <NewComplaintPage
            onNavigate={setCurrentTab}
            onOpenComplaint={handleOpenComplaint}
          />
        )}

        {currentTab === 'map' && (
          <IssueMapPage
            onNavigate={setCurrentTab}
            onOpenComplaint={handleOpenComplaint}
          />
        )}

        {currentTab === 'detail' && activeComplaintId && (
          <ComplaintDetailPage
            complaintId={activeComplaintId}
            onBack={handleReturnFromDetail}
            onOpenComplaint={handleOpenComplaint}
          />
        )}

        {currentTab === 'officer' && (
          <OfficerDashboard
            onNavigate={setCurrentTab}
            onOpenComplaint={handleOpenComplaint}
          />
        )}

        {currentTab === 'admin' && (
          <AdminDashboard
            onNavigate={setCurrentTab}
            onOpenComplaint={handleOpenComplaint}
          />
        )}

        {currentTab === 'login' && (
          <LoginPage onNavigate={setCurrentTab} />
        )}

        {currentTab === 'register' && (
          <RegisterPage onNavigate={setCurrentTab} />
        )}

        {currentTab === 'forgot-password' && (
          <ForgotPasswordPage onNavigate={setCurrentTab} />
        )}

        {currentTab === 'profile' && (
          <ProfilePage onNavigate={setCurrentTab} />
        )}
      </main>

      <Footer />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <NotificationProvider>
        <MainRouter />
      </NotificationProvider>
    </AuthProvider>
  );
}
