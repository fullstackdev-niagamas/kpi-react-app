import { useState } from 'react';
import { Topbar } from './Topbar';
import { Sidebar } from './Sidebar';

export const AppShell = ({ children, currentRole, setCurrentRole, currentUserName, setCurrentUserName, currentPage, setCurrentPage }) => {
  return (
    <div className="min-h-screen bg-nlg-bg flex flex-col font-sans text-[14px]">
      <Topbar 
        currentRole={currentRole} 
        setCurrentRole={setCurrentRole} 
        currentUserName={currentUserName} 
        setCurrentUserName={setCurrentUserName} 
      />
      <div className="flex flex-1 overflow-hidden" style={{ height: 'calc(100vh - 78px)' }}>
        {/* Tier 1 Rail */}
        <div className="w-16 bg-nlg-rail flex flex-col items-center py-4 gap-3 shrink-0">
          <div className="w-9 h-9 rounded-lg bg-white border border-nlg-border flex items-center justify-center text-[10px] text-nlg-text-subdued">HR</div>
          <div className="w-9 h-9 rounded-lg bg-nlg-primary text-white flex items-center justify-center text-[11px] font-bold">KPI</div>
          <div className="w-9 h-9 rounded-lg bg-white border border-nlg-border flex items-center justify-center text-[10px] text-nlg-text-subdued">CRM</div>
        </div>

        {/* Tier 2 Sidebar */}
        <Sidebar 
          currentRole={currentRole} 
          currentUserName={currentUserName} 
          currentPage={currentPage} 
          setCurrentPage={setCurrentPage} 
        />

        {/* Main Canvas */}
        <div className="flex-1 overflow-y-auto bg-white">
          {/* Cap lebar dulu 1320px — dinaikkan supaya tabel lebar (mis. KPI Builder, 13 kolom) lebih
              mungkin muat tanpa scroll horizontal di layar besar. Berlaku ke semua halaman/user. */}
          <div className="p-6 max-w-[1760px] mx-auto fade-in">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
};
