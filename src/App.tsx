import { BrowserRouter, Routes, Route } from 'react-router-dom';
import '@/i18n';
import { AppProvider } from '@/context/AppContext';
import { AuthProvider } from '@/context/AuthContext';
import { LandingPage } from '@/pages/LandingPage';
import { AdultMode } from '@/pages/AdultMode';
import { YouthMode } from '@/pages/YouthMode';
import { EmergencyDirectory } from '@/pages/EmergencyDirectory';
import { ServicesMap } from '@/pages/ServicesMap';
import { LocationShare } from '@/pages/LocationShare';
import { Resources } from '@/pages/Resources';
import { TrustedCircle } from '@/pages/TrustedCircle';
import { Account } from '@/pages/Account';
import { ReportForm } from '@/pages/ReportForm';
import { ReportStatus } from '@/pages/ReportStatus';
import { YouthHelp } from '@/pages/YouthHelp';
import { YouthUnsafe } from '@/pages/YouthUnsafe';
import { YouthSafePeople } from '@/pages/YouthSafePeople';
import { YouthLearn } from '@/pages/YouthLearn';
import { ResponderDashboard } from '@/pages/ResponderDashboard';
import { TrackPage } from '@/pages/TrackPage';

function App() {
  return (
    <AppProvider>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/adult" element={<AdultMode />} />
            <Route path="/adult/emergency" element={<EmergencyDirectory />} />
            <Route path="/adult/services" element={<ServicesMap />} />
            <Route path="/adult/location" element={<LocationShare />} />
            <Route path="/adult/resources" element={<Resources />} />
            <Route path="/adult/trusted-circle" element={<TrustedCircle />} />
            <Route path="/adult/report" element={<ReportForm />} />
            <Route path="/adult/report-status" element={<ReportStatus />} />
            <Route path="/adult/account" element={<Account />} />
            <Route path="/responder" element={<ResponderDashboard />} />
            <Route path="/youth" element={<YouthMode />} />
            <Route path="/youth/help" element={<YouthHelp />} />
            <Route path="/youth/unsafe" element={<YouthUnsafe />} />
            <Route path="/youth/safe-people" element={<YouthSafePeople />} />
            <Route path="/youth/learn" element={<YouthLearn />} />
            <Route path="/track/:token" element={<TrackPage />} />
            <Route path="*" element={<LandingPage />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </AppProvider>
  );
}

export default App;
