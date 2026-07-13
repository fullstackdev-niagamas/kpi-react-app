import { Icon } from '../Icons';
import { useKPIContext } from '../../context/KPIContext';

// Role simulasi diturunkan dari data Master Data User — kecuali 'cs' yang SENGAJA generik (bukan akun
// personal siapa pun). Keputusan user (2026-07-13): akun personal (mis. Indri Wahyuningrum, Corporate
// Strategy Officer) harus tetap murni "User" spt karyawan lain — kinerja pribadinya tidak boleh
// tercampur dgn kapasitas administratif Super User CS. 'Company' (BOD/Direktur Utama) -> ceo; sisanya -> user.
const roleForUser = (u) => (u.level === 'Company' ? 'ceo' : 'user');

// Akun Super User CS = generik/administratif, bukan personal siapa pun — dipisah dari daftar `users`.
const CS_SUPERUSER_ACCOUNT = { name: 'Corporate Strategy', position: 'Super User (Admin Sistem)' };

const ROLE_GROUP_LABEL = { ceo: '👑 CEO / Executive', cs: '⚙️ Corporate Strategy (Super User)', user: '👤 User (Karyawan)' };

export const Topbar = ({ currentRole, setCurrentRole, currentUserName, setCurrentUserName }) => {
  const { users } = useKPIContext();

  const accountsByRole = { ceo: [], cs: [CS_SUPERUSER_ACCOUNT], user: [] };
  users.forEach((u) => accountsByRole[roleForUser(u)].push(u));

  const currentValue = `${currentRole}::${currentUserName}`;
  const handleAccountChange = (e) => {
    const [role, ...rest] = e.target.value.split('::');
    setCurrentRole(role);
    setCurrentUserName(rest.join('::'));
  };

  return (
    <div className="flex flex-col">
      <div className="bg-nlg-text text-white text-[11px] px-4 py-1.5 flex items-center justify-between">
        <span>🧪 MODE DEMO MOCKUP — Role switcher &amp; tombol simulasi di bawah ini bukan bagian final UI.</span>
        <span className="text-nlg-text-subdued hidden sm:inline">Engineering Playbook NLG v1.7 · Design Tokens applied</span>
      </div>

      <div className="h-12 bg-white border-b border-nlg-border flex items-center justify-between px-4">
        <div className="flex items-center gap-2 text-sm">
          <div className="w-6 h-6 rounded-md bg-nlg-rail flex items-center justify-center text-[10px] font-bold text-nlg-text-muted">NLG</div>
          <span className="font-semibold text-nlg-text">App Suite</span>
          <span className="text-nlg-text-subdued text-xs">— App Shell global</span>
        </div>
        <div className="flex items-center gap-3">
          <label className="flex items-center gap-2 bg-nlg-primary-tint text-nlg-primary pl-3 pr-2 py-1.5 rounded-nlg-input text-xs font-medium cursor-pointer">
            Login sebagai
            <select value={currentValue} onChange={handleAccountChange} className="bg-transparent font-semibold focus:outline-none cursor-pointer max-w-[240px]">
              {['ceo', 'cs', 'user'].map((role) => accountsByRole[role].length > 0 && (
                <optgroup key={role} label={ROLE_GROUP_LABEL[role]}>
                  {accountsByRole[role].map((u) => (
                    <option key={u.name} value={`${role}::${u.name}`}>{u.name} — {u.position || u.dept}</option>
                  ))}
                </optgroup>
              ))}
            </select>
          </label>
          <button className="hidden lg:flex items-center gap-1.5 text-[11px] font-medium text-nlg-primary bg-nlg-primary-tint px-2.5 py-1.5 rounded-nlg-input">👀 Bandingkan Tampilan</button>
          <div className="w-7 h-7 rounded-full bg-nlg-rail flex items-center justify-center text-xs">👤</div>
        </div>
      </div>
    </div>
  );
};
