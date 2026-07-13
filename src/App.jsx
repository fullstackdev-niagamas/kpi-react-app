import { useState, useEffect } from 'react';
import { AppShell } from './components/Layout/AppShell';
import { Dashboard } from './pages/Dashboard';
import { Planning } from './pages/Planning';
import { ActualInput } from './pages/ActualInput';
import { History } from './pages/History';
import { Approval } from './pages/Approval';
import { Team } from './pages/Team';
import { MasterUser } from './pages/CS/MasterUser';
import { MasterSO } from './pages/CS/MasterSO';
import { MasterUOM } from './pages/CS/MasterUOM';
import { KPIBuilder } from './pages/CS/KPIBuilder';
import { WindowSetting } from './pages/CS/WindowSetting';
import { Monitoring } from './pages/CS/Monitoring';
import { Mediation } from './pages/CS/Mediation';
import { StrategyMap } from './pages/CS/StrategyMap';
import { Reports } from './pages/CS/Reports';
import { Executive } from './pages/CEO/Executive';
import { USER_MASTER } from './data/mockData';

const loadSession = (key, defaultVal) => {
  const saved = localStorage.getItem(key);
  return saved ? saved : defaultVal;
};

function App() {
  const [currentRole, setCurrentRole] = useState(() => loadSession('kpi_active_role', 'user'));
  const [currentUserName, setCurrentUserName] = useState(() => loadSession('kpi_active_user', USER_MASTER[0].name));
  const [currentPage, setCurrentPage] = useState(() => loadSession('kpi_active_page', 'dashboard'));

  useEffect(() => { localStorage.setItem('kpi_active_role', currentRole); }, [currentRole]);
  useEffect(() => { localStorage.setItem('kpi_active_user', currentUserName); }, [currentUserName]);
  useEffect(() => { localStorage.setItem('kpi_active_page', currentPage); }, [currentPage]);

  const renderPage = () => {
    switch (currentPage) {
      case 'dashboard': return <Dashboard currentUserName={currentUserName} />;
      case 'planning': return <Planning currentUserName={currentUserName} />;
      case 'actualInput': return <ActualInput currentUserName={currentUserName} />;
      case 'history': return <History currentUserName={currentUserName} />;
      case 'approval': return <Approval currentUserName={currentUserName} />;
      case 'team': return <Team currentUserName={currentUserName} />;
      
      // CS Pages
      case 'masterUser': return <MasterUser />;
      case 'masterSO': return <MasterSO />;
      case 'masterUOM': return <MasterUOM />;
      case 'builder': return <KPIBuilder />;
      case 'window': return <WindowSetting />;
      case 'monitoring': return <Monitoring />;
      case 'mediation': return <Mediation />;
      case 'strategyMapCS': return <StrategyMap isCS={true} />;
      case 'reports': return <Reports />;
      case 'reports_ceo': return <Reports />;
      
      // CEO Pages
      case 'executive': return <Executive />;
      case 'strategyMapCEO': return <StrategyMap isCS={false} />;

      default:
        return <div>Page under construction: {currentPage}</div>;
    }
  };

  return (
    <AppShell
      currentRole={currentRole}
      setCurrentRole={setCurrentRole}
      currentUserName={currentUserName}
      setCurrentUserName={setCurrentUserName}
      currentPage={currentPage}
      setCurrentPage={setCurrentPage}
    >
      {renderPage()}
    </AppShell>
  );
}

export default App;
