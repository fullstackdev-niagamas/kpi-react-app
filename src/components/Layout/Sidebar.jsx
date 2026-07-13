import { Icon } from '../Icons';
import { useKPIContext } from '../../context/KPIContext';

const NAV_USER_BASE = [
  { id: 'dashboard', label: 'Dashboard Saya', icon: 'home' },
  { id: 'planning', label: 'Input Planning KPI', icon: 'edit' },
  { id: 'actualInput', label: 'Input Realisasi (Actual)', icon: 'pencil' },
  { id: 'history', label: 'Riwayat Submission', icon: 'clock' },
];

const NAV_USER_APPROVER_EXTRA = [
  { id: 'approval', label: 'Approval Queue (Tim Saya)', icon: 'check' },
  { id: 'team', label: 'Performa Tim', icon: 'users' },
];

const NAV = {
  cs: [
    { id: 'masterSO',       label: 'Master Strategic Objective', icon: 'map'      },
    { id: 'builder',        label: 'KPI Setup / Builder',        icon: 'layers'   },
    { id: 'strategyMapCS',  label: 'Strategy Map (Kelola)',      icon: 'map'      },
    { id: 'monitoring',     label: 'Monitoring Dashboard',       icon: 'bar'      },
    { id: 'masterUser',     label: 'Master Data User',           icon: 'users'    },
    { id: 'masterUOM',      label: 'Master UOM',                 icon: 'edit'     },
    { id: 'window',         label: 'Setting Jendela Waktu',      icon: 'calendar' },
    { id: 'mediation',      label: 'Pending Mediation',          icon: 'alert'    },
    { id: 'reports',        label: 'Laporan / Export',           icon: 'file'     },
    { id: 'divider',        label: '──── CEO View ────',         icon: 'bar'      },
    { id: 'executive',      label: 'Executive Dashboard',        icon: 'bar'      },
    { id: 'strategyMapCEO', label: 'Strategy Map (View)',        icon: 'map'      },
    { id: 'reports_ceo',    label: 'Laporan Strategis',          icon: 'file'     },
  ],
  ceo: [
    { id: 'executive',      label: 'Executive Dashboard',    icon: 'bar'  },
    { id: 'strategyMapCEO', label: 'Strategy Map',           icon: 'map'  },
    { id: 'reports',        label: 'Laporan Strategis',      icon: 'file' },
  ],
};

const ROLE_LABELS = { user: 'User', cs: 'Corporate Strategy', ceo: 'CEO' };

export const Sidebar = ({ currentRole, currentUserName, currentPage, setCurrentPage }) => {
  const { users } = useKPIContext();
  // Role 'cs' = akun Super User generik/administratif (bukan akun personal siapa pun sejak
  // 2026-07-13) — jadi TIDAK dapat menu personal (Dashboard/Planning/dst), murni menu admin.
  // Akun personal (mis. Indri Wahyuningrum, Corporate Strategy Officer) login sbg role 'user' biasa.
  //
  // CEO (Andrian Hartono) TIDAK dapat menu Planning pribadi (KPI BOD = Agregasi Company, keputusan
  // v6.1) — tapi dia tetap Superior ASLI beberapa Dept Head di Master Data User (Indri, Abu Tholib,
  // Morren Andriyanto dkk.), jadi tetap butuh Approval Queue & Performa Tim utk approve submission
  // mereka. 2 kapabilitas ini independen: "punya KPI pribadi" vs "jadi atasan orang lain" — gap ini
  // sebelumnya bikin CEO tidak punya cara sama sekali menjalankan approval (ditemukan 2026-07-13).
  const isApprover = (currentRole === 'user' || currentRole === 'ceo') && users.some(x => x.superior === currentUserName.trim());
  // 'cs' = akun sintetis/generik (bukan orang nyata) → label role. 'user' & 'ceo' = orang nyata → nama asli.
  const displayName = currentRole === 'cs' ? ROLE_LABELS.cs : (currentUserName.trim() || ROLE_LABELS[currentRole]);

  let navItems = [];
  if (currentRole === 'user') {
    navItems = [...NAV_USER_BASE, ...NAV_USER_APPROVER_EXTRA];
  } else if (currentRole === 'ceo') {
    navItems = isApprover
      ? [...NAV.ceo, { id: 'divider', label: '──── Approval (Tim Saya) ────' }, ...NAV_USER_APPROVER_EXTRA]
      : NAV.ceo;
  } else {
    navItems = NAV[currentRole] || [];
  }

  const extraIds = NAV_USER_APPROVER_EXTRA.map(x => x.id);

  return (
    <div className="w-60 bg-nlg-sidebar border-r border-nlg-border flex flex-col py-4 shrink-0 transition-all overflow-hidden h-full">
      <div className="px-4 mb-1 flex items-center justify-between">
        <div>
          <div className="text-[10px] font-semibold text-nlg-text-subdued uppercase tracking-wider">KPI Management</div>
          <div className="text-sm font-bold text-nlg-text mt-0.5 flex items-center gap-1">
            {displayName}
            {isApprover && <span className="text-[9px] bg-nlg-primary-tint text-nlg-primary px-1.5 py-0.5 rounded-full font-semibold">Approver</span>}
          </div>
        </div>
      </div>

      <nav className="flex-1 px-2 mt-3 space-y-0.5 overflow-y-auto">
        {navItems.map((item, idx) => {
          if (item.id === 'divider') {
            return <div key={idx} className="px-3 py-2 text-[10px] font-bold text-nlg-text-subdued uppercase tracking-wider mt-2 border-t border-nlg-border">{item.label}</div>;
          }
          const isExtra = extraIds.includes(item.id);
          const disabled = currentRole === 'user' && isExtra && !isApprover;
          const isActive = currentPage === item.id;
          
          return (
            <button
              key={idx}
              disabled={disabled}
              onClick={() => !disabled && setCurrentPage(item.id)}
              className={`nav-item w-full flex items-center gap-2.5 px-3 py-2 rounded-nlg-input text-[13px] text-left transition-colors ${
                disabled ? 'text-nlg-text-subdued opacity-50 cursor-not-allowed' : 
                isActive ? 'bg-nlg-primary-tint text-nlg-primary font-semibold' : 'text-nlg-text-muted hover:bg-white'
              }`}
            >
              <Icon name={item.icon} style={{ stroke: isActive ? '#1A73E8' : 'currentColor' }} />
              <span className="flex-1">{item.label}</span>
              {disabled && <Icon name="lock" />}
            </button>
          );
        })}
      </nav>

      {currentRole === 'user' && (
        <div className="px-3 pt-3 border-t border-nlg-border mt-2">
          <div className="text-[10px] text-nlg-text-subdued leading-relaxed px-1">
            Tidak ada login "Superior" terpisah. Menu Approval Queue &amp; Performa Tim selalu tampil, namun otomatis <b>nonaktif (🔒)</b> jika akun ini tidak tercatat punya subordinate di Master Data User.
          </div>
        </div>
      )}
    </div>
  );
};
