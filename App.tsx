import React, { useState, useEffect, useMemo } from 'react';
import { User, UserRole, AuditEntry, AuditStatus, Standard, Indicator, CorrectiveAction, AuditPlan, AuditSchedule, SPMIDocument } from './types';
import { STANDARDS as DEFAULT_STANDARDS, PRODI_LIST } from './constants';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell 
} from 'recharts';

const INITIAL_ADMIN: User = { 
  id: 'admin-001', 
  username: 'admin', 
  password: 'admin123', 
  role: UserRole.ADMIN 
};

const CYCLE_OPTIONS = ['2024', '2025', '2026', '2027', '2028', '2029', '2030'];

const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [standards, setStandards] = useState<Standard[]>([]);
  const [auditData, setAuditData] = useState<AuditEntry[]>([]);
  const [correctiveActions, setCorrectiveActions] = useState<CorrectiveAction[]>([]);
  const [auditPlans, setAuditPlans] = useState<AuditPlan[]>([]);
  const [spmiDocuments, setSpmiDocuments] = useState<SPMIDocument[]>([]);
  
  // State untuk siklus yang dipilih user untuk dilihat (Dropdown View)
  const [currentCycle, setCurrentCycle] = useState<string>('2026');

  // State daftar siklus aktif (whitelist)
  const [activeCycles, setActiveCycles] = useState<string[]>([]);
  
  const [loginForm, setLoginForm] = useState({ username: '', password: '' });
  const [error, setError] = useState('');
  
  // Update Tab Types
  const [activeTab, setActiveTab] = useState<
    'dashboard' | 'audit' | 'users' | 'reports' | 'settings' | 'corrective' | 'planning' | 
    'p1_perencanaan' | 'p2_pelaksanaan' | 'p3_pengendalian' | 'p4_peningkatan'
  >('dashboard');

  useEffect(() => {
    const savedUsers = localStorage.getItem('spmi_users');
    const savedAudit = localStorage.getItem('spmi_audit');
    const savedStandards = localStorage.getItem('spmi_standards');
    const savedPTK = localStorage.getItem('spmi_ptk');
    const savedCycle = localStorage.getItem('spmi_current_cycle');
    const savedActiveCycles = localStorage.getItem('spmi_active_cycles_list');
    
    const savedPlans = localStorage.getItem('spmi_audit_plans');
    const savedDocs = localStorage.getItem('spmi_documents');
    
    let loadedUsers: User[] = savedUsers ? JSON.parse(savedUsers) : [INITIAL_ADMIN];
    if (!loadedUsers.some(u => u.role === UserRole.ADMIN)) loadedUsers.push(INITIAL_ADMIN);
    setUsers(loadedUsers);

    setStandards(savedStandards ? JSON.parse(savedStandards) : DEFAULT_STANDARDS);
    if (savedAudit) setAuditData(JSON.parse(savedAudit));
    if (savedPTK) setCorrectiveActions(JSON.parse(savedPTK));
    
    // Load Cycle View State
    if (savedCycle) {
        try { 
            const parsed = JSON.parse(savedCycle);
            setCurrentCycle(String(parsed)); 
        } catch { 
            setCurrentCycle(String(savedCycle)); 
        }
    }

    // Load Active Cycles
    if (savedActiveCycles) {
        try {
            const parsed = JSON.parse(savedActiveCycles);
            if (Array.isArray(parsed)) setActiveCycles(parsed);
        } catch {
            setActiveCycles([]);
        }
    }

    if (savedPlans) setAuditPlans(JSON.parse(savedPlans));
    if (savedDocs) setSpmiDocuments(JSON.parse(savedDocs));
  }, []);

  const saveToLocal = (key: string, data: any) => {
    localStorage.setItem(key, JSON.stringify(data));
  };

  const handleCycleChange = (cycle: string) => {
    setCurrentCycle(cycle);
    saveToLocal('spmi_current_cycle', cycle);
  };

  // Fungsi Toggle Status Siklus (Akan dipassing ke child components)
  const toggleCycleStatus = (cycleToToggle: string) => {
    const isActive = activeCycles.includes(cycleToToggle);
    let newActiveCycles: string[];

    if (isActive) {
       // Non-aktifkan
       if (window.confirm(`Konfirmasi Admin:\n\nTutup Akses (Kunci) Siklus ${cycleToToggle}?`)) {
          newActiveCycles = activeCycles.filter(c => c !== cycleToToggle);
          setActiveCycles(newActiveCycles);
          saveToLocal('spmi_active_cycles_list', newActiveCycles);
       }
    } else {
       // Aktifkan
       if (window.confirm(`Konfirmasi Admin:\n\nBuka Akses Siklus ${cycleToToggle}?`)) {
          newActiveCycles = [...activeCycles, cycleToToggle];
          setActiveCycles(newActiveCycles);
          saveToLocal('spmi_active_cycles_list', newActiveCycles);
       }
    }
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const user = users.find(u => u.username === loginForm.username && u.password === loginForm.password);
    if (user) {
      setCurrentUser(user);
      setError('');
    } else {
      setError('Username atau Password salah!');
    }
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setLoginForm({ username: '', password: '' });
    setActiveTab('dashboard');
  };

  const saveAuditEntry = (entry: AuditEntry) => {
    const newData = [...auditData];
    const index = newData.findIndex(d => 
      d.indicatorId === entry.indicatorId && 
      d.prodi === entry.prodi && 
      d.cycle === entry.cycle
    );
    const updatedEntry = { ...entry, lastUpdated: new Date().toISOString() };
    if (index > -1) newData[index] = updatedEntry;
    else newData.push(updatedEntry);
    setAuditData(newData);
    saveToLocal('spmi_audit', newData);
  };

  const savePTK = (ptk: CorrectiveAction) => {
    const newData = [...correctiveActions];
    const index = newData.findIndex(d => 
      d.indicatorId === ptk.indicatorId && 
      d.prodi === ptk.prodi && 
      d.cycle === ptk.cycle
    );
    if (index > -1) newData[index] = ptk;
    else newData.push(ptk);
    setCorrectiveActions(newData);
    saveToLocal('spmi_ptk', newData);
  };

  const saveUser = (u: User) => {
    const newUsers = [...users, u];
    setUsers(newUsers);
    saveToLocal('spmi_users', newUsers);
  };

  // Fungsi hapus user (Hanya Admin)
  const deleteUser = (id: string) => {
    if (currentUser?.role !== UserRole.ADMIN) return;
    if (window.confirm("Yakin ingin menghapus user ini secara permanen?")) {
      const newUsers = users.filter(u => u.id !== id);
      setUsers(newUsers);
      saveToLocal('spmi_users', newUsers);
    }
  };

  const saveStandards = (s: Standard[]) => {
    setStandards(s);
    saveToLocal('spmi_standards', s);
  };

  const savePlan = (plan: AuditPlan) => {
    const newPlans = [...auditPlans];
    const index = newPlans.findIndex(p => p.id === plan.id);
    if (index > -1) newPlans[index] = plan;
    else newPlans.push(plan);
    setAuditPlans(newPlans);
    saveToLocal('spmi_audit_plans', newPlans);
  }

  const saveDocument = (doc: SPMIDocument) => {
    const newDocs = [...spmiDocuments, doc];
    setSpmiDocuments(newDocs);
    saveToLocal('spmi_documents', newDocs);
  }

  const deleteDocument = (id: string) => {
    if(confirm('Hapus dokumen ini?')) {
      const newDocs = spmiDocuments.filter(d => d.id !== id);
      setSpmiDocuments(newDocs);
      saveToLocal('spmi_documents', newDocs);
    }
  }

  if (!currentUser) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-emerald-900 p-4 font-sans">
        <div className="bg-white p-10 rounded-3xl shadow-2xl w-full max-w-md">
          <div className="text-center mb-10">
            <div className="w-20 h-20 bg-emerald-100 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-inner">
              <i className="fas fa-university text-emerald-600 text-3xl"></i>
            </div>
            <h1 className="text-2xl font-black text-emerald-900 uppercase tracking-tighter">SPMI UNUGHA</h1>
            <p className="text-gray-400 text-[10px] font-bold tracking-[0.2em] mt-1 italic">Quality Control Center</p>
          </div>
          <form onSubmit={handleLogin} className="space-y-6">
            <input 
              type="text" placeholder="Username" required
              className="w-full p-4 bg-gray-50 border-2 border-transparent rounded-xl focus:border-emerald-500 outline-none transition-all font-bold shadow-inner"
              value={loginForm.username}
              onChange={(e) => setLoginForm({...loginForm, username: e.target.value})}
            />
            <input 
              type="password" placeholder="Password" required
              className="w-full p-4 bg-gray-50 border-2 border-transparent rounded-xl focus:border-emerald-500 outline-none transition-all font-bold shadow-inner"
              value={loginForm.password}
              onChange={(e) => setLoginForm({...loginForm, password: e.target.value})}
            />
            {error && <p className="text-red-500 text-xs font-bold text-center italic">{error}</p>}
            <button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-black py-4 rounded-xl shadow-lg transition-all active:scale-95">
              LOGIN KE SISTEM
            </button>
          </form>
        </div>
      </div>
    );
  }

  const isAdmin = currentUser.role === UserRole.ADMIN;

  return (
    <div className="min-h-screen flex bg-gray-50 font-sans">
      <aside className="w-72 bg-emerald-950 text-white flex flex-col fixed inset-y-0 shadow-2xl z-20 overflow-y-auto">
        <div className="p-8 border-b border-emerald-900">
          <div className="flex items-center gap-3">
            <i className="fas fa-shield-halved text-emerald-400 text-2xl"></i>
            <span className="font-black text-xl tracking-tighter uppercase">SPMI<span className="text-emerald-400 italic">Hub</span></span>
          </div>
          <div className="mt-6 p-4 bg-emerald-900/40 rounded-2xl border border-emerald-800">
            <p className="text-[10px] text-emerald-400 font-black uppercase mb-1">User Aktif</p>
            <p className="font-bold text-sm truncate">{currentUser.username}</p>
            <p className="text-[9px] text-emerald-500 uppercase font-black mt-1 flex items-center gap-2">
              <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse"></span>
              {currentUser.role} {currentUser.prodi ? `| ${currentUser.prodi}` : ''}
            </p>
          </div>
        </div>
        
        <nav className="flex-1 p-6 space-y-2">
            {/* P1 - PERENCANAAN (All Roles) */}
            <div className="px-4 py-2 mt-2">
              <span className="text-[10px] font-black text-emerald-400/60 uppercase tracking-widest">P1 - Perencanaan</span>
            </div>
            <NavItem active={activeTab === 'p1_perencanaan'} onClick={() => setActiveTab('p1_perencanaan')} icon="fa-file-lines" label="Dokumen SPMI" />

            {/* P2 - PELAKSANAAN (All Roles) */}
            <div className="px-4 py-2 mt-4">
              <span className="text-[10px] font-black text-emerald-400/60 uppercase tracking-widest">P2 - Pelaksanaan</span>
            </div>
            <NavItem active={activeTab === 'p2_pelaksanaan'} onClick={() => setActiveTab('p2_pelaksanaan')} icon="fa-gavel" label="SK & Pelaksanaan" />

            {/* E - EVALUASI (All Roles, but specific tabs are Admin Only) */}
            <div className="px-4 py-2 mt-4">
              <span className="text-[10px] font-black text-emerald-400/60 uppercase tracking-widest">E - Evaluasi (Audit)</span>
            </div>
            <NavItem active={activeTab === 'dashboard'} onClick={() => setActiveTab('dashboard')} icon="fa-house" label="Dashboard" />
            <NavItem active={activeTab === 'audit'} onClick={() => setActiveTab('audit')} icon="fa-clipboard-check" label="Audit Mutu" />
            <NavItem active={activeTab === 'corrective'} onClick={() => setActiveTab('corrective')} icon="fa-triangle-exclamation" label="Tindakan Koreksi" />
            <NavItem active={activeTab === 'reports'} onClick={() => setActiveTab('reports')} icon="fa-chart-column" label="Laporan Hasil" />
            
            {/* Admin Only Menus inside Evaluasi */}
            {isAdmin && (
              <>
                <div className="my-2 border-t border-emerald-900 mx-4"></div>
                <NavItem active={activeTab === 'planning'} onClick={() => setActiveTab('planning')} icon="fa-calendar-alt" label="Perencanaan Audit" />
                <NavItem active={activeTab === 'users'} onClick={() => setActiveTab('users')} icon="fa-users-gear" label="Manajemen Akun" />
                <NavItem active={activeTab === 'settings'} onClick={() => setActiveTab('settings')} icon="fa-sliders" label="Kelola Standar" />
              </>
            )}

            {/* P3 - PENGENDALIAN (All Roles) */}
            <div className="px-4 py-2 mt-4">
              <span className="text-[10px] font-black text-emerald-400/60 uppercase tracking-widest">P3 - Pengendalian</span>
            </div>
            <NavItem active={activeTab === 'p3_pengendalian'} onClick={() => setActiveTab('p3_pengendalian')} icon="fa-tower-control" label="Dokumen Pengendalian" />

            {/* P4 - PENINGKATAN (All Roles) */}
            <div className="px-4 py-2 mt-4">
              <span className="text-[10px] font-black text-emerald-400/60 uppercase tracking-widest">P4 - Peningkatan</span>
            </div>
            <NavItem active={activeTab === 'p4_peningkatan'} onClick={() => setActiveTab('p4_peningkatan')} icon="fa-arrow-trend-up" label="Dokumen Peningkatan" />
        </nav>
        <div className="p-6">
          <button onClick={handleLogout} className="w-full p-4 bg-red-600/20 hover:bg-red-600 text-white rounded-xl transition-all font-black text-xs uppercase tracking-widest">
            LOGOUT
          </button>
        </div>
      </aside>

      <main className="ml-72 flex-1 p-10 overflow-x-hidden">
        <header className="mb-10 flex flex-col gap-6">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center">
            <div>
              <div className="flex items-center gap-3 mb-1">
                 <h2 className="text-3xl font-black text-gray-900 tracking-tight capitalize">
                   {activeTab === 'p1_perencanaan' ? 'P1 - Perencanaan SPMI' : 
                    activeTab === 'p2_pelaksanaan' ? 'P2 - Pelaksanaan (SK)' :
                    activeTab === 'p3_pengendalian' ? 'P3 - Pengendalian Mutu' :
                    activeTab === 'p4_peningkatan' ? 'P4 - Peningkatan Mutu' :
                    activeTab.replace('-', ' ')}
                 </h2>
              </div>
              <p className="text-gray-400 text-sm font-medium italic">Pemantauan Mutu Internal - Periode Tahun {currentCycle}</p>
            </div>

            <div className="flex items-center gap-4 bg-white p-2 rounded-[2rem] shadow-sm border border-gray-100">
              <div className={`px-5 py-3 rounded-[1.5rem] flex items-center gap-4 bg-emerald-50`}>
                <div className="flex flex-col">
                  <span className="text-[8px] font-black text-gray-400 uppercase tracking-widest">Pilih Tahun Siklus:</span>
                  <select 
                    className={`bg-transparent font-black text-sm outline-none cursor-pointer text-emerald-600`}
                    value={currentCycle}
                    onChange={(e) => handleCycleChange(e.target.value)}
                  >
                    {CYCLE_OPTIONS.map(c => <option key={c} value={c}>TAHUN {c}</option>)}
                  </select>
                </div>
                <i className={`fas fa-calendar-check text-emerald-500 text-lg ml-4`}></i>
              </div>
            </div>
          </div>
        </header>

        <div className="animate-in fade-in duration-500">
          {/* FITUR PPEPP untuk Semua (Read Only jika bukan Admin) */}
          {activeTab === 'p1_perencanaan' && <DocumentPortal title="Dokumen Perencanaan (P1)" categories={['Kebijakan', 'Manual', 'Standar', 'Formulir']} documents={spmiDocuments} onSave={saveDocument} onDelete={deleteDocument} isReadOnly={!isAdmin} />}
          {activeTab === 'p2_pelaksanaan' && <DocumentPortal title="Dokumen Pelaksanaan & SK (P2)" categories={['SK']} documents={spmiDocuments} onSave={saveDocument} onDelete={deleteDocument} isReadOnly={!isAdmin} />}
          {activeTab === 'p3_pengendalian' && <DocumentPortal title="Dokumen Pengendalian (P3)" categories={['Pengendalian']} documents={spmiDocuments} onSave={saveDocument} onDelete={deleteDocument} isReadOnly={!isAdmin} />}
          {activeTab === 'p4_peningkatan' && <DocumentPortal title="Dokumen Peningkatan (P4)" categories={['Peningkatan']} documents={spmiDocuments} onSave={saveDocument} onDelete={deleteDocument} isReadOnly={!isAdmin} />}
          
          {/* FITUR EVALUASI (Existing) */}
          {activeTab === 'dashboard' && <Dashboard auditData={auditData} standards={standards} correctiveActions={correctiveActions} currentCycle={currentCycle} />}
          {activeTab === 'audit' && <AuditPortal auditData={auditData} onSave={saveAuditEntry} currentUser={currentUser} standards={standards} currentCycle={currentCycle} activeCycles={activeCycles} onToggleCycle={toggleCycleStatus} />}
          {activeTab === 'corrective' && <CorrectiveActionPortal auditData={auditData} correctiveActions={correctiveActions} onSavePTK={savePTK} currentUser={currentUser} standards={standards} currentCycle={currentCycle} activeCycles={activeCycles} onToggleCycle={toggleCycleStatus} />}
          {activeTab === 'planning' && <PlanningPortal plans={auditPlans} onSavePlan={savePlan} users={users} currentCycle={currentCycle} />}
          {activeTab === 'users' && <UserManagement users={users} onSaveUser={saveUser} onDeleteUser={deleteUser} currentUser={currentUser} />}
          {activeTab === 'settings' && <StandardSettings standards={standards} onSave={saveStandards} currentCycle={currentCycle} />}
          {activeTab === 'reports' && <Reports auditData={auditData} standards={standards} currentCycle={currentCycle} currentUser={currentUser} />}
        </div>
        
        {/* Footer info tanggal sistem */}
        <footer className="mt-20 pt-10 border-t border-gray-100 flex justify-between items-center text-[10px] font-bold text-gray-400 uppercase tracking-widest">
           <div className="flex items-center gap-3">
              <i className="fas fa-clock text-emerald-500"></i>
              Waktu Sistem: {new Date().toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
           </div>
           <div>
              SPMI UNUGHA Cilacap &copy; {currentCycle}
           </div>
        </footer>
      </main>
    </div>
  );
};

const NavItem: React.FC<{ active: boolean, onClick: () => void, icon: string, label: string }> = ({ active, onClick, icon, label }) => (
  <button onClick={onClick} className={`w-full flex items-center gap-4 p-4 rounded-xl transition-all ${active ? 'bg-emerald-600 text-white shadow-xl translate-x-1' : 'text-emerald-300 hover:bg-emerald-900/50'}`}>
    <i className={`fas ${icon} w-5`}></i>
    <span className="font-bold text-sm">{label}</span>
  </button>
);

const DocumentPortal: React.FC<{ 
  title: string, 
  categories: string[], 
  documents: SPMIDocument[], 
  onSave: (doc: SPMIDocument) => void,
  onDelete: (id: string) => void,
  isReadOnly?: boolean // Prop baru untuk mode lihat saja
}> = ({ title, categories, documents, onSave, onDelete, isReadOnly = false }) => {
  const [activeCat, setActiveCat] = useState(categories[0]);
  const [formData, setFormData] = useState({ name: '', url: '' });

  const filteredDocs = documents.filter(d => d.category === activeCat);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.url) return;
    onSave({
      id: `doc-${Date.now()}`,
      category: activeCat as any,
      name: formData.name,
      url: formData.url,
      lastUpdated: new Date().toISOString()
    });
    setFormData({ name: '', url: '' });
  };

  return (
    <div className="space-y-6">
      {categories.length > 1 && (
        <div className="flex gap-2 p-1 bg-gray-200 rounded-xl w-fit">
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setActiveCat(cat)}
              className={`px-4 py-2 rounded-lg text-xs font-black uppercase tracking-widest transition-all ${activeCat === cat ? 'bg-white text-emerald-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
            >
              {cat}
            </button>
          ))}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {!isReadOnly && (
          <div className="bg-white p-8 rounded-[2rem] shadow-sm border border-gray-100 h-fit">
            <h3 className="text-lg font-black text-gray-800 mb-6 flex items-center gap-2">
              <i className="fas fa-plus-circle text-emerald-500"></i>
              Tambah {activeCat}
            </h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="text-[10px] font-bold text-gray-400 uppercase block mb-1">Nama Dokumen</label>
                <input 
                  className="w-full p-3 bg-gray-50 rounded-xl text-sm font-bold outline-none border border-transparent focus:border-emerald-200 transition-all" 
                  placeholder={`Contoh: ${activeCat} Akademik 2025`}
                  value={formData.name}
                  onChange={e => setFormData({...formData, name: e.target.value})}
                />
              </div>
              <div>
                <label className="text-[10px] font-bold text-gray-400 uppercase block mb-1">Link File (Google Drive/Web)</label>
                <input 
                  className="w-full p-3 bg-gray-50 rounded-xl text-sm font-bold outline-none border border-transparent focus:border-emerald-200 transition-all text-blue-600" 
                  placeholder="https://..."
                  value={formData.url}
                  onChange={e => setFormData({...formData, url: e.target.value})}
                />
              </div>
              <button className="w-full py-3 bg-emerald-600 text-white rounded-xl font-black uppercase tracking-widest mt-2 hover:bg-emerald-700 transition-all">
                Simpan Dokumen
              </button>
            </form>
          </div>
        )}

        <div className={`${isReadOnly ? 'md:col-span-3' : 'md:col-span-2'} space-y-4`}>
           {filteredDocs.length === 0 && (
             <div className="text-center p-10 border-2 border-dashed border-gray-200 rounded-3xl text-gray-400 italic font-bold">
               Belum ada dokumen {activeCat} yang diunggah.
             </div>
           )}
           {filteredDocs.map(doc => (
             <div key={doc.id} className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex justify-between items-center group hover:border-emerald-200 transition-all">
               <div className="flex items-center gap-4">
                 <div className="w-10 h-10 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-600">
                   <i className="fas fa-file-pdf"></i>
                 </div>
                 <div>
                   <h4 className="font-bold text-gray-800 text-sm">{doc.name}</h4>
                   <a href={doc.url} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-500 font-bold hover:underline truncate max-w-[200px] block">
                     {doc.url}
                   </a>
                   <p className="text-[9px] text-gray-400 mt-1">Updated: {new Date(doc.lastUpdated).toLocaleDateString()}</p>
                 </div>
               </div>
               <div className="flex items-center gap-2">
                 <a 
                   href={doc.url} 
                   target="_blank" 
                   rel="noopener noreferrer"
                   className="p-2 bg-emerald-100 text-emerald-600 rounded-lg hover:bg-emerald-600 hover:text-white transition-all"
                   title="Buka / Download"
                 >
                   <i className="fas fa-external-link-alt text-xs"></i>
                 </a>
                 {!isReadOnly && (
                   <button 
                     onClick={() => onDelete(doc.id)}
                     className="p-2 bg-red-50 text-red-500 rounded-lg hover:bg-red-500 hover:text-white transition-all"
                     title="Hapus Dokumen"
                   >
                     <i className="fas fa-trash text-xs"></i>
                   </button>
                 )}
               </div>
             </div>
           ))}
        </div>
      </div>
    </div>
  );
};

const PlanningPortal: React.FC<{ plans: AuditPlan[], onSavePlan: (p: AuditPlan) => void, users: User[], currentCycle: string }> = ({ plans, onSavePlan, users, currentCycle }) => {
  const [formData, setFormData] = useState<Partial<AuditPlan> & { auditor1?: string, auditor2?: string }>({
    cycle: currentCycle,
    prodi: PRODI_LIST[0],
    isActive: true,
    schedule: {
      fillingStart: '', fillingEnd: '',
      deskEvalStart: '', deskEvalEnd: '',
      visitStart: '', visitEnd: '',
      rtmStart: '', rtmEnd: ''
    }
  });

  const auditors = users.filter(u => u.role === UserRole.AUDITOR);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const auditorIds = [];
    if (formData.auditor1) auditorIds.push(formData.auditor1);
    if (formData.auditor2) auditorIds.push(formData.auditor2);

    const newPlan: AuditPlan = {
      id: formData.id || `plan-${Date.now()}`,
      prodi: formData.prodi!,
      cycle: formData.cycle!,
      isActive: formData.isActive || true,
      auditorIds,
      schedule: formData.schedule!
    };
    onSavePlan(newPlan);
    alert('Perencanaan berhasil disimpan!');
  };

  const handleDateChange = (field: keyof AuditSchedule, value: string) => {
    setFormData({
      ...formData,
      schedule: {
        ...formData.schedule!,
        [field]: value
      }
    });
  };

  return (
    <div className="space-y-8">
      <div className="bg-white p-10 rounded-[3rem] shadow-sm border border-gray-100">
        <div className="flex justify-between items-center mb-8">
          <h3 className="text-2xl font-black text-gray-800">Tambah Perencanaan Audit ({currentCycle})</h3>
          <div className="flex items-center gap-3">
             <span className="text-xs font-bold text-gray-500">Status Aktif</span>
             <button 
                onClick={() => setFormData({...formData, isActive: !formData.isActive})}
                className={`w-12 h-6 rounded-full p-1 transition-colors ${formData.isActive ? 'bg-emerald-500' : 'bg-gray-300'}`}
             >
                <div className={`w-4 h-4 bg-white rounded-full transition-transform ${formData.isActive ? 'translate-x-6' : ''}`}></div>
             </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-2">Auditee (Prodi)</label>
              <select className="w-full p-4 bg-gray-50 rounded-xl font-bold text-sm outline-none" value={formData.prodi} onChange={e => setFormData({...formData, prodi: e.target.value})}>
                {PRODI_LIST.map(p => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
            <div>
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-2">Modul AMI</label>
              <select className="w-full p-4 bg-gray-50 rounded-xl font-bold text-sm outline-none" disabled>
                <option>Standar SPMI (Default)</option>
              </select>
            </div>
            <div>
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-2">Siklus</label>
              <select className="w-full p-4 bg-gray-50 rounded-xl font-bold text-sm outline-none" value={formData.cycle} onChange={e => setFormData({...formData, cycle: e.target.value})}>
                {CYCLE_OPTIONS.map(c => <option key={c} value={c}>TAHUN {c}</option>)}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="space-y-4 p-4 border rounded-2xl bg-gray-50/50">
               <h4 className="text-xs font-black text-emerald-600 uppercase">Pengisian Borang (Auditee)</h4>
               <div>
                  <label className="text-[9px] text-gray-400 block mb-1">Mulai</label>
                  <input type="date" className="w-full p-2 rounded-lg text-xs font-bold" value={formData.schedule?.fillingStart} onChange={e => handleDateChange('fillingStart', e.target.value)} />
               </div>
               <div>
                  <label className="text-[9px] text-gray-400 block mb-1">Selesai</label>
                  <input type="date" className="w-full p-2 rounded-lg text-xs font-bold" value={formData.schedule?.fillingEnd} onChange={e => handleDateChange('fillingEnd', e.target.value)} />
               </div>
            </div>

            <div className="space-y-4 p-4 border rounded-2xl bg-gray-50/50">
               <h4 className="text-xs font-black text-blue-600 uppercase">Desk Evaluasi (Auditor)</h4>
               <div>
                  <label className="text-[9px] text-gray-400 block mb-1">Mulai</label>
                  <input type="date" className="w-full p-2 rounded-lg text-xs font-bold" value={formData.schedule?.deskEvalStart} onChange={e => handleDateChange('deskEvalStart', e.target.value)} />
               </div>
               <div>
                  <label className="text-[9px] text-gray-400 block mb-1">Selesai</label>
                  <input type="date" className="w-full p-2 rounded-lg text-xs font-bold" value={formData.schedule?.deskEvalEnd} onChange={e => handleDateChange('deskEvalEnd', e.target.value)} />
               </div>
            </div>

            <div className="space-y-4 p-4 border rounded-2xl bg-gray-50/50">
               <h4 className="text-xs font-black text-purple-600 uppercase">Visitasi Lapangan</h4>
               <div>
                  <label className="text-[9px] text-gray-400 block mb-1">Mulai</label>
                  <input type="date" className="w-full p-2 rounded-lg text-xs font-bold" value={formData.schedule?.visitStart} onChange={e => handleDateChange('visitStart', e.target.value)} />
               </div>
               <div>
                  <label className="text-[9px] text-gray-400 block mb-1">Selesai</label>
                  <input type="date" className="w-full p-2 rounded-lg text-xs font-bold" value={formData.schedule?.visitEnd} onChange={e => handleDateChange('visitEnd', e.target.value)} />
               </div>
            </div>

            <div className="space-y-4 p-4 border rounded-2xl bg-gray-50/50">
               <h4 className="text-xs font-black text-orange-600 uppercase">Rapat Tinjauan Manajemen</h4>
               <div>
                  <label className="text-[9px] text-gray-400 block mb-1">Mulai</label>
                  <input type="date" className="w-full p-2 rounded-lg text-xs font-bold" value={formData.schedule?.rtmStart} onChange={e => handleDateChange('rtmStart', e.target.value)} />
               </div>
               <div>
                  <label className="text-[9px] text-gray-400 block mb-1">Selesai</label>
                  <input type="date" className="w-full p-2 rounded-lg text-xs font-bold" value={formData.schedule?.rtmEnd} onChange={e => handleDateChange('rtmEnd', e.target.value)} />
               </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
               <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-2">Auditor 1</label>
               <select className="w-full p-4 bg-gray-50 rounded-xl font-bold text-sm outline-none" value={formData.auditor1} onChange={e => setFormData({...formData, auditor1: e.target.value})}>
                 <option value="">-- Pilih Auditor --</option>
                 {auditors.map(a => <option key={a.id} value={a.id}>{a.username}</option>)}
               </select>
            </div>
            <div>
               <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-2">Auditor 2</label>
               <select className="w-full p-4 bg-gray-50 rounded-xl font-bold text-sm outline-none" value={formData.auditor2} onChange={e => setFormData({...formData, auditor2: e.target.value})}>
                 <option value="">-- Pilih Auditor --</option>
                 {auditors.map(a => <option key={a.id} value={a.id}>{a.username}</option>)}
               </select>
            </div>
          </div>

          <button type="submit" className="w-full py-4 bg-gray-800 text-white font-black rounded-xl hover:bg-gray-900 uppercase tracking-widest shadow-lg">Simpan Perencanaan</button>
        </form>
      </div>

      <div className="bg-white p-8 rounded-[2rem] shadow-sm border border-gray-100">
        <h3 className="text-xl font-black text-gray-800 mb-6">Daftar Perencanaan ({currentCycle})</h3>
        <table className="w-full text-left">
           <thead className="bg-gray-50">
              <tr>
                 <th className="p-4 text-[10px] font-black uppercase text-gray-500">Prodi</th>
                 <th className="p-4 text-[10px] font-black uppercase text-gray-500">Pengisian</th>
                 <th className="p-4 text-[10px] font-black uppercase text-gray-500">Desk Eval</th>
                 <th className="p-4 text-[10px] font-black uppercase text-gray-500">Auditor</th>
                 <th className="p-4 text-[10px] font-black uppercase text-gray-500">Status</th>
              </tr>
           </thead>
           <tbody className="divide-y divide-gray-100">
              {plans.filter(p => p.cycle === currentCycle).map(plan => (
                 <tr key={plan.id}>
                    <td className="p-4 font-bold text-sm">{plan.prodi}</td>
                    <td className="p-4 text-xs">{plan.schedule.fillingStart} - {plan.schedule.fillingEnd}</td>
                    <td className="p-4 text-xs">{plan.schedule.deskEvalStart} - {plan.schedule.deskEvalEnd}</td>
                    <td className="p-4 text-xs">
                       {plan.auditorIds.map(id => users.find(u => u.id === id)?.username).join(', ')}
                    </td>
                    <td className="p-4">
                       <span className={`px-2 py-1 rounded text-[10px] font-black ${plan.isActive ? 'bg-emerald-100 text-emerald-600' : 'bg-gray-100 text-gray-500'}`}>
                          {plan.isActive ? 'ACTIVE' : 'INACTIVE'}
                       </span>
                    </td>
                 </tr>
              ))}
              {plans.filter(p => p.cycle === currentCycle).length === 0 && (
                 <tr>
                    <td colSpan={5} className="p-8 text-center text-gray-400 italic text-sm">Belum ada data perencanaan untuk siklus ini.</td>
                 </tr>
              )}
           </tbody>
        </table>
      </div>
    </div>
  );
};

const Dashboard: React.FC<{
  auditData: AuditEntry[];
  standards: Standard[];
  correctiveActions: CorrectiveAction[];
  currentCycle: string;
}> = ({ auditData, standards, correctiveActions, currentCycle }) => {
  const currentData = auditData.filter((d) => d.cycle === currentCycle);
  const achieved = currentData.filter((d) => d.status === AuditStatus.ACHIEVED).length;
  const notAchieved = currentData.filter((d) => d.status === AuditStatus.NOT_ACHIEVED).length;
  const pending = currentData.filter((d) => d.status === AuditStatus.PENDING).length;

  const chartData = [
    { name: 'Tercapai', value: achieved, fill: '#10B981' },
    { name: 'Tidak Tercapai', value: notAchieved, fill: '#EF4444' },
    { name: 'Pending', value: pending, fill: '#F59E0B' },
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-emerald-100">
          <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest">Indikator Tercapai</h3>
          <p className="text-4xl font-black text-emerald-600 mt-2">{achieved}</p>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-red-100">
          <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest">Tidak Tercapai</h3>
          <p className="text-4xl font-black text-red-600 mt-2">{notAchieved}</p>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-orange-100">
          <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest">Menunggu Audit</h3>
          <p className="text-4xl font-black text-orange-600 mt-2">{pending}</p>
        </div>
      </div>
      <div className="bg-white p-6 rounded-2xl shadow-sm">
        <h3 className="text-lg font-black text-gray-800 mb-4">Statistik Capaian</h3>
        <div className="h-64 w-full">
           <ResponsiveContainer width="100%" height="100%">
             <BarChart data={chartData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" />
                <YAxis dataKey="name" type="category" width={100} tick={{fontSize: 10}} />
                <Tooltip />
                <Bar dataKey="value" radius={[0, 10, 10, 0]} barSize={40} />
             </BarChart>
           </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

const AuditPortal: React.FC<{
  auditData: AuditEntry[];
  onSave: (entry: AuditEntry) => void;
  currentUser: User;
  standards: Standard[];
  currentCycle: string;
  activeCycles: string[];
  onToggleCycle: (cycle: string) => void;
}> = ({ auditData, onSave, currentUser, standards, currentCycle, activeCycles, onToggleCycle }) => {
  const [selectedStandard, setSelectedStandard] = useState(standards[0]?.id);
  
  // Logic untuk menentukan Prodi mana yang tersedia untuk dipilih
  const availableProdis = useMemo(() => {
     if (currentUser.role === UserRole.ADMIN) return PRODI_LIST;
     if (currentUser.role === UserRole.AUDITEE) return [currentUser.prodi || ''];
     if (currentUser.role === UserRole.AUDITOR) return currentUser.assignedProdi || [];
     return [];
  }, [currentUser]);

  const [selectedProdi, setSelectedProdi] = useState<string>(availableProdis[0] || '');

  useEffect(() => {
     if (availableProdis.length > 0 && !availableProdis.includes(selectedProdi)) {
        setSelectedProdi(availableProdis[0]);
     }
  }, [availableProdis, selectedProdi]);
  
  // Cek Status Siklus
  const isLocked = !activeCycles.includes(currentCycle);

  const handleSave = (indicatorId: string, updates: Partial<AuditEntry>) => {
     // Proteksi: Jika terkunci dan bukan Admin, tidak bisa save
     if (isLocked && currentUser.role !== UserRole.ADMIN) return;

     const existing = auditData.find(d => d.indicatorId === indicatorId && d.prodi === selectedProdi && d.cycle === currentCycle);
     const entry: AuditEntry = {
        prodi: selectedProdi,
        indicatorId,
        cycle: currentCycle,
        achievementValue: existing?.achievementValue || '',
        auditDate: existing?.auditDate || new Date().toISOString().split('T')[0],
        docLink: existing?.docLink || '',
        status: existing?.status || AuditStatus.NOT_FILLED,
        notes: existing?.notes || '',
        lastUpdated: new Date().toISOString(),
        ...updates
     };
     onSave(entry);
  };

  return (
    <div className="space-y-6">
       {/* HEADER KONTROL SIKLUS (KHUSUS AUDIT PORTAL) */}
       <div className={`p-6 rounded-2xl flex justify-between items-center ${isLocked ? 'bg-red-50 border border-red-100' : 'bg-emerald-50 border border-emerald-100'}`}>
          <div className="flex items-center gap-3">
             <div className={`w-10 h-10 rounded-full flex items-center justify-center ${isLocked ? 'bg-red-100 text-red-600' : 'bg-emerald-100 text-emerald-600'}`}>
                <i className={`fas ${isLocked ? 'fa-lock' : 'fa-lock-open'}`}></i>
             </div>
             <div>
                <h4 className={`text-sm font-black uppercase tracking-widest ${isLocked ? 'text-red-700' : 'text-emerald-700'}`}>
                   Status Audit: {isLocked ? 'TERKUNCI' : 'TERBUKA'}
                </h4>
                <p className="text-xs text-gray-500">Siklus Tahun {currentCycle}</p>
             </div>
          </div>
          {currentUser.role === UserRole.ADMIN && (
             <button 
                onClick={() => onToggleCycle(currentCycle)}
                className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${isLocked ? 'bg-emerald-600 text-white hover:bg-emerald-700' : 'bg-red-500 text-white hover:bg-red-600'}`}
             >
                {isLocked ? 'Buka Siklus' : 'Tutup Siklus'}
             </button>
          )}
       </div>

       <div className="flex gap-4 overflow-x-auto pb-4">
         {standards.map(s => (
            <button key={s.id} onClick={() => setSelectedStandard(s.id)} className={`px-4 py-2 rounded-xl text-xs font-black uppercase whitespace-nowrap transition-all ${selectedStandard === s.id ? 'bg-emerald-600 text-white shadow-lg' : 'bg-white text-gray-500 hover:bg-gray-50'}`}>
              {s.code}
            </button>
         ))}
       </div>
       
       {currentUser.role !== UserRole.AUDITEE && (
         <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex items-center gap-4">
            <span className="text-xs font-black text-gray-400 uppercase">Pilih Prodi:</span>
            {availableProdis.length > 0 ? (
                <select value={selectedProdi} onChange={e => setSelectedProdi(e.target.value)} className="font-bold text-sm outline-none bg-transparent">
                   {availableProdis.map(p => <option key={p} value={p}>{p}</option>)}
                </select>
            ) : (
                <span className="text-sm font-bold text-red-500">Belum ada Prodi ditugaskan</span>
            )}
         </div>
       )}
       
       <div className="space-y-4">
          {availableProdis.includes(selectedProdi) && standards.find(s => s.id === selectedStandard)?.indicators.map(ind => {
             const entry = auditData.find(d => d.indicatorId === ind.id && d.prodi === selectedProdi && d.cycle === currentCycle);
             
             // Resolve Target berdasarkan siklus
             const currentTarget = ind.cycleTargets?.[currentCycle]?.target || ind.target;
             const currentTargetYear = ind.cycleTargets?.[currentCycle]?.targetYear || ind.targetYear;

             return (
               <div key={ind.id} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                  <div className="flex justify-between items-start mb-4">
                     <div>
                        <span className="text-[10px] font-black text-emerald-500 uppercase bg-emerald-50 px-2 py-1 rounded-md">{ind.id}</span>
                        <h4 className="font-bold text-gray-800 mt-2">{ind.name}</h4>
                        <p className="text-xs text-gray-400 mt-1">Target ({currentCycle}): <strong>{currentTarget}</strong> <span className="text-[10px] ml-1 opacity-60">({currentTargetYear})</span></p>
                     </div>
                     <span className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase ${
                        entry?.status === AuditStatus.ACHIEVED ? 'bg-emerald-100 text-emerald-600' :
                        entry?.status === AuditStatus.NOT_ACHIEVED ? 'bg-red-100 text-red-600' :
                        'bg-gray-100 text-gray-500'
                     }`}>
                        {entry?.status || 'BELUM DIISI'}
                     </span>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-gray-50">
                     <div>
                        <label className="text-[9px] font-black text-gray-400 uppercase block mb-1">Capaian (Auditee)</label>
                        <input 
                           className="w-full p-2 bg-gray-50 rounded-lg text-sm font-bold disabled:bg-gray-100 disabled:text-gray-400"
                           value={entry?.achievementValue || ''}
                           onChange={e => handleSave(ind.id, { achievementValue: e.target.value, status: AuditStatus.PENDING })}
                           placeholder="Isi nilai capaian..."
                           // Disable jika user Auditor ATAU Locked
                           disabled={currentUser.role === UserRole.AUDITOR || (isLocked && currentUser.role !== UserRole.ADMIN)}
                        />
                        {/* INPUT LINK DOKUMEN + TOMBOL AKSES */}
                        <div className="relative mt-2">
                            <input 
                               className="w-full p-2 pr-10 bg-gray-50 rounded-lg text-xs font-bold text-blue-600 disabled:bg-gray-100 disabled:text-gray-400"
                               value={entry?.docLink || ''}
                               onChange={e => handleSave(ind.id, { docLink: e.target.value })}
                               placeholder="Link Bukti Dokumen"
                               // Disable jika user Auditor ATAU Locked
                               disabled={currentUser.role === UserRole.AUDITOR || (isLocked && currentUser.role !== UserRole.ADMIN)}
                            />
                            {entry?.docLink && (
                                <a 
                                  href={entry.docLink} 
                                  target="_blank" 
                                  rel="noopener noreferrer"
                                  className="absolute right-2 top-1/2 -translate-y-1/2 text-emerald-600 hover:text-emerald-800 p-1 bg-white rounded-full shadow-sm"
                                  title="Buka Dokumen"
                                >
                                  <i className="fas fa-external-link-alt"></i>
                                </a>
                            )}
                        </div>
                     </div>
                     <div>
                        <label className="text-[9px] font-black text-gray-400 uppercase block mb-1">Audit (Auditor)</label>
                        <select 
                           className="w-full p-2 bg-gray-50 rounded-lg text-sm font-bold mb-2 disabled:bg-gray-100 disabled:text-gray-400"
                           value={entry?.status || AuditStatus.NOT_FILLED}
                           onChange={e => handleSave(ind.id, { status: e.target.value as AuditStatus })}
                           disabled={currentUser.role === UserRole.AUDITEE || (isLocked && currentUser.role !== UserRole.ADMIN)}
                        >
                           {Object.values(AuditStatus).map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                        <textarea 
                           className="w-full p-2 bg-gray-50 rounded-lg text-xs font-bold disabled:bg-gray-100 disabled:text-gray-400"
                           value={entry?.notes || ''}
                           onChange={e => handleSave(ind.id, { notes: e.target.value })}
                           placeholder="Catatan Auditor..."
                           rows={2}
                           disabled={currentUser.role === UserRole.AUDITEE || (isLocked && currentUser.role !== UserRole.ADMIN)}
                        />
                     </div>
                  </div>
               </div>
             );
          })}
       </div>
    </div>
  );
};

const CorrectiveActionPortal: React.FC<{
  auditData: AuditEntry[];
  correctiveActions: CorrectiveAction[];
  onSavePTK: (ptk: CorrectiveAction) => void;
  currentUser: User;
  standards: Standard[];
  currentCycle: string;
  activeCycles: string[];
  onToggleCycle: (cycle: string) => void;
}> = ({ auditData, correctiveActions, onSavePTK, currentUser, standards, currentCycle, activeCycles, onToggleCycle }) => {
  const [auditorProdiFilter, setAuditorProdiFilter] = useState<string>('');
  
  const notAchieved = auditData.filter(d => d.cycle === currentCycle && d.status === AuditStatus.NOT_ACHIEVED);

  const isLocked = !activeCycles.includes(currentCycle);

  // Helper to find existing PTK
  const getPTK = (indicatorId: string, prodi: string) => 
    correctiveActions.find(c => c.indicatorId === indicatorId && c.prodi === prodi && c.cycle === currentCycle);

  const handleSave = (indicatorId: string, prodi: string, updates: Partial<CorrectiveAction>) => {
    
    // Proteksi: Jika terkunci dan bukan Admin, tidak bisa save
    if (isLocked && currentUser.role !== UserRole.ADMIN) return;

    const existing = getPTK(indicatorId, prodi);
    const ptk: CorrectiveAction = {
      id: existing?.id || `ptk-${Date.now()}-${Math.random()}`,
      prodi,
      indicatorId,
      cycle: currentCycle,
      category: existing?.category || 'NONE',
      rootCause: existing?.rootCause || '',
      prevention: existing?.prevention || '',
      docVerification: existing?.docVerification || 'PENDING',
      plan: existing?.plan || '',
      realization: existing?.realization || '',
      correctionDocLink: existing?.correctionDocLink || '',
      targetYear: existing?.targetYear || String(new Date().getFullYear()),
      createdAt: existing?.createdAt || new Date().toISOString(),
      ...updates
    };
    onSavePTK(ptk);
  };

  if (notAchieved.length === 0) {
    return <div className="p-10 text-center bg-white rounded-3xl border border-dashed border-gray-300 text-gray-400 font-bold">Tidak ada temuan yang memerlukan tindakan koreksi pada siklus ini.</div>;
  }

  return (
    <div className="space-y-8">
      {/* HEADER KONTROL SIKLUS (KHUSUS PTK PORTAL) */}
       <div className={`p-6 rounded-2xl flex justify-between items-center ${isLocked ? 'bg-red-50 border border-red-100' : 'bg-emerald-50 border border-emerald-100'}`}>
          <div className="flex items-center gap-3">
             <div className={`w-10 h-10 rounded-full flex items-center justify-center ${isLocked ? 'bg-red-100 text-red-600' : 'bg-emerald-100 text-emerald-600'}`}>
                <i className={`fas ${isLocked ? 'fa-lock' : 'fa-lock-open'}`}></i>
             </div>
             <div>
                <h4 className={`text-sm font-black uppercase tracking-widest ${isLocked ? 'text-red-700' : 'text-emerald-700'}`}>
                   Status Tindakan Koreksi: {isLocked ? 'TERKUNCI' : 'TERBUKA'}
                </h4>
                <p className="text-xs text-gray-500">Siklus Tahun {currentCycle}</p>
             </div>
          </div>
          {currentUser.role === UserRole.ADMIN && (
             <button 
                onClick={() => onToggleCycle(currentCycle)}
                className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${isLocked ? 'bg-emerald-600 text-white hover:bg-emerald-700' : 'bg-red-500 text-white hover:bg-red-600'}`}
             >
                {isLocked ? 'Buka Siklus' : 'Tutup Siklus'}
             </button>
          )}
       </div>

      {/* FILTER PRODI UNTUK AUDITOR */}
      {currentUser.role === UserRole.AUDITOR && currentUser.assignedProdi && currentUser.assignedProdi.length > 0 && (
          <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex items-center gap-4">
              <span className="text-xs font-black text-gray-400 uppercase">Filter Prodi Binaan:</span>
              <select 
                  className="bg-transparent font-bold text-sm outline-none cursor-pointer"
                  value={auditorProdiFilter}
                  onChange={(e) => setAuditorProdiFilter(e.target.value)}
              >
                  <option value="">-- Tampilkan Semua --</option>
                  {currentUser.assignedProdi.map(p => (
                      <option key={p} value={p}>{p}</option>
                  ))}
              </select>
          </div>
      )}

      {notAchieved.map(entry => {
        const standard = standards.find(s => s.indicators.some(i => i.id === entry.indicatorId));
        const indicator = standard?.indicators.find(i => i.id === entry.indicatorId);
        const ptk = getPTK(entry.indicatorId, entry.prodi);

        // Filter: Auditee only sees their own prodi. 
        if (currentUser.role === UserRole.AUDITEE && currentUser.prodi !== entry.prodi) return null;
        
        // Filter: Auditor only sees assigned prodis AND applies local dropdown filter.
        if (currentUser.role === UserRole.AUDITOR) {
            if (!currentUser.assignedProdi?.includes(entry.prodi)) return null;
            if (auditorProdiFilter && entry.prodi !== auditorProdiFilter) return null;
        }

        return (
          <div key={`${entry.indicatorId}-${entry.prodi}`} className="bg-white p-8 rounded-[2rem] shadow-sm border-l-8 border-red-500">
             <div className="mb-6 pb-6 border-b border-gray-100">
                <div className="flex justify-between items-start">
                   <div>
                      <span className="text-[10px] font-black text-white bg-red-500 px-2 py-1 rounded mb-2 inline-block">TEMUAN {ptk?.category !== 'NONE' ? `(${ptk?.category})` : ''}</span>
                      <h4 className="font-bold text-gray-800 text-lg">{indicator?.name}</h4>
                      <p className="text-xs text-gray-500 mt-1">Prodi: <span className="font-black text-gray-800">{entry.prodi}</span> | Target: {indicator?.target}</p>
                   </div>
                   {ptk?.docVerification === 'SUITABLE' && <i className="fas fa-check-circle text-3xl text-emerald-500"></i>}
                </div>
                <div className="mt-4 bg-red-50 p-4 rounded-xl">
                   <p className="text-[10px] font-black text-red-400 uppercase">Catatan Auditor (Audit)</p>
                   <p className="text-sm font-bold text-red-900 mt-1">{entry.notes || '-'}</p>
                </div>
             </div>

             <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Bagian PLAN (Auditee) */}
                <div className="space-y-4">
                   <h5 className="text-xs font-black text-gray-400 uppercase tracking-widest border-b pb-2">Analisis & Rencana (Auditee)</h5>
                   
                   <div>
                      <label className="text-[9px] font-bold text-gray-400 uppercase">Akar Masalah</label>
                      <textarea 
                        className="w-full p-3 bg-gray-50 rounded-xl text-xs font-bold mt-1" 
                        rows={3}
                        value={ptk?.rootCause || ''}
                        onChange={e => handleSave(entry.indicatorId, entry.prodi, { rootCause: e.target.value })}
                        disabled={currentUser.role === UserRole.AUDITOR || (isLocked && currentUser.role !== UserRole.ADMIN)}
                      />
                   </div>
                   
                   <div>
                      <label className="text-[9px] font-bold text-gray-400 uppercase">Tindakan Koreksi (Perbaikan)</label>
                      <textarea 
                        className="w-full p-3 bg-gray-50 rounded-xl text-xs font-bold mt-1" 
                        rows={3}
                        value={ptk?.plan || ''}
                        onChange={e => handleSave(entry.indicatorId, entry.prodi, { plan: e.target.value })}
                        disabled={currentUser.role === UserRole.AUDITOR || (isLocked && currentUser.role !== UserRole.ADMIN)}
                      />
                   </div>

                   <div>
                      <label className="text-[9px] font-bold text-gray-400 uppercase">Tindakan Pencegahan</label>
                      <textarea 
                        className="w-full p-3 bg-gray-50 rounded-xl text-xs font-bold mt-1" 
                        rows={2}
                        value={ptk?.prevention || ''}
                        onChange={e => handleSave(entry.indicatorId, entry.prodi, { prevention: e.target.value })}
                        disabled={currentUser.role === UserRole.AUDITOR || (isLocked && currentUser.role !== UserRole.ADMIN)}
                      />
                   </div>
                </div>

                {/* Bagian VERIFIKASI (Auditor) */}
                <div className="space-y-4">
                   <h5 className="text-xs font-black text-gray-400 uppercase tracking-widest border-b pb-2">Verifikasi & Status (Auditor)</h5>
                   
                   <div>
                      <label className="text-[9px] font-bold text-gray-400 uppercase">Kategori Temuan</label>
                      <select 
                        className="w-full p-3 bg-gray-50 rounded-xl text-xs font-bold mt-1 outline-none"
                        value={ptk?.category || 'NONE'}
                        onChange={e => handleSave(entry.indicatorId, entry.prodi, { category: e.target.value as any })}
                        disabled={currentUser.role === UserRole.AUDITEE || (isLocked && currentUser.role !== UserRole.ADMIN)}
                      >
                         <option value="NONE">Belum Ditentukan</option>
                         <option value="MAJOR">MAJOR (Kritis)</option>
                         <option value="MINOR">MINOR (Ringan)</option>
                      </select>
                   </div>

                   <div>
                      <label className="text-[9px] font-bold text-gray-400 uppercase">Target Penyelesaian</label>
                      <input 
                         type="date"
                         className="w-full p-3 bg-gray-50 rounded-xl text-xs font-bold mt-1"
                         value={ptk?.targetYear || ''}
                         onChange={e => handleSave(entry.indicatorId, entry.prodi, { targetYear: e.target.value })}
                         disabled={currentUser.role === UserRole.AUDITEE || (isLocked && currentUser.role !== UserRole.ADMIN)}
                      />
                   </div>

                   <div>
                      <label className="text-[9px] font-bold text-gray-400 uppercase">Status Verifikasi</label>
                      <div className="flex gap-2 mt-1">
                         {['PENDING', 'SUITABLE', 'NOT_SUITABLE'].map(status => (
                            <button
                               key={status}
                               onClick={() => handleSave(entry.indicatorId, entry.prodi, { docVerification: status as any })}
                               disabled={currentUser.role === UserRole.AUDITEE || (isLocked && currentUser.role !== UserRole.ADMIN)}
                               className={`flex-1 py-2 rounded-lg text-[9px] font-black uppercase ${
                                  ptk?.docVerification === status 
                                  ? (status === 'SUITABLE' ? 'bg-emerald-500 text-white' : status === 'NOT_SUITABLE' ? 'bg-red-500 text-white' : 'bg-gray-500 text-white')
                                  : 'bg-gray-100 text-gray-400'
                               }`}
                            >
                               {status}
                            </button>
                         ))}
                      </div>
                   </div>
                </div>
             </div>
          </div>
        );
      })}
    </div>
  );
};

const UserManagement: React.FC<{
  users: User[];
  onSaveUser: (u: User) => void;
  onDeleteUser: (id: string) => void;
  currentUser: User;
}> = ({ users, onSaveUser, onDeleteUser, currentUser }) => {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [formData, setFormData] = useState<Partial<User>>({ role: UserRole.AUDITEE });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.username || !formData.password) return;
    onSaveUser({
      id: formData.id || `user-${Date.now()}`,
      username: formData.username!,
      password: formData.password!,
      role: formData.role!,
      prodi: formData.role === UserRole.AUDITEE ? formData.prodi : undefined,
      assignedProdi: formData.role === UserRole.AUDITOR ? formData.assignedProdi : undefined
    } as User);
    setIsFormOpen(false);
    setFormData({ role: UserRole.AUDITEE });
  };

  const handleEdit = (u: User) => {
    setFormData(u);
    setIsFormOpen(true);
  };

  const toggleAssignedProdi = (prodi: string) => {
    const current = formData.assignedProdi || [];
    if (current.includes(prodi)) {
       setFormData({ ...formData, assignedProdi: current.filter(p => p !== prodi) });
    } else {
       setFormData({ ...formData, assignedProdi: [...current, prodi] });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
         <h3 className="text-xl font-black text-gray-800">Manajemen Pengguna</h3>
         <button onClick={() => { setFormData({ role: UserRole.AUDITEE }); setIsFormOpen(true); }} className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all">
            + Tambah User
         </button>
      </div>

      {isFormOpen && (
         <div className="bg-white p-8 rounded-[2rem] border border-emerald-100 shadow-xl mb-8">
            <h4 className="text-lg font-black text-emerald-900 mb-6">{formData.id ? 'Edit User' : 'User Baru'}</h4>
            <form onSubmit={handleSubmit} className="space-y-4">
               <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <input className="p-3 bg-gray-50 rounded-xl font-bold text-sm" placeholder="Username" value={formData.username || ''} onChange={e => setFormData({...formData, username: e.target.value})} required />
                  <input className="p-3 bg-gray-50 rounded-xl font-bold text-sm" placeholder="Password" value={formData.password || ''} onChange={e => setFormData({...formData, password: e.target.value})} required />
                  <select className="p-3 bg-gray-50 rounded-xl font-bold text-sm outline-none" value={formData.role} onChange={e => setFormData({...formData, role: e.target.value as UserRole})}>
                     {Object.values(UserRole).map(r => <option key={r} value={r}>{r}</option>)}
                  </select>
               </div>
               
               {formData.role === UserRole.AUDITEE && (
                 <div>
                    <label className="text-[10px] font-bold text-gray-400 uppercase block mb-2">Prodi (Auditee)</label>
                    <select className="w-full p-3 bg-gray-50 rounded-xl font-bold text-sm outline-none" value={formData.prodi || ''} onChange={e => setFormData({...formData, prodi: e.target.value})}>
                       <option value="">-- Pilih Prodi --</option>
                       {PRODI_LIST.map(p => <option key={p} value={p}>{p}</option>)}
                    </select>
                 </div>
               )}

               {formData.role === UserRole.AUDITOR && (
                 <div>
                    <label className="text-[10px] font-bold text-gray-400 uppercase block mb-2">Assigned Prodi (Dapat memilih lebih dari 1)</label>
                    <div className="flex flex-wrap gap-2">
                       {PRODI_LIST.map(p => (
                          <button 
                             type="button" 
                             key={p} 
                             onClick={() => toggleAssignedProdi(p)}
                             className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase transition-all ${formData.assignedProdi?.includes(p) ? 'bg-emerald-500 text-white' : 'bg-gray-100 text-gray-400'}`}
                          >
                             {p}
                          </button>
                       ))}
                    </div>
                 </div>
               )}

               <div className="flex gap-2 pt-4">
                  <button type="submit" className="flex-1 bg-emerald-600 text-white py-3 rounded-xl font-black uppercase text-xs hover:bg-emerald-700">Simpan</button>
                  <button type="button" onClick={() => setIsFormOpen(false)} className="flex-1 bg-gray-200 text-gray-600 py-3 rounded-xl font-black uppercase text-xs hover:bg-gray-300">Batal</button>
               </div>
            </form>
         </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
         {users.map(u => (
            <div key={u.id} className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex justify-between items-start">
               <div>
                  <div className="flex items-center gap-2 mb-1">
                     <span className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center text-gray-500">
                        <i className={`fas ${u.role === UserRole.ADMIN ? 'fa-user-shield' : u.role === UserRole.AUDITOR ? 'fa-user-check' : 'fa-user-graduate'}`}></i>
                     </span>
                     <span className="font-bold text-gray-800">{u.username}</span>
                  </div>
                  <p className="text-[10px] text-gray-400 font-black uppercase ml-10">{u.role}</p>
                  {u.prodi && <p className="text-[10px] text-emerald-600 font-bold ml-10 mt-1">{u.prodi}</p>}
                  {u.assignedProdi && <p className="text-[10px] text-blue-600 font-bold ml-10 mt-1 line-clamp-1">{u.assignedProdi.join(', ')}</p>}
               </div>
               {currentUser.role === UserRole.ADMIN && u.username !== 'admin' && (
                  <div className="flex flex-col gap-1">
                     <button onClick={() => handleEdit(u)} className="p-2 text-blue-400 hover:bg-blue-50 rounded-lg"><i className="fas fa-edit"></i></button>
                     <button onClick={() => onDeleteUser(u.id)} className="p-2 text-red-400 hover:bg-red-50 rounded-lg"><i className="fas fa-trash"></i></button>
                  </div>
               )}
            </div>
         ))}
      </div>
    </div>
  );
};

const StandardSettings: React.FC<{
  standards: Standard[];
  onSave: (s: Standard[]) => void;
  currentCycle: string;
}> = ({ standards, onSave, currentCycle }) => {
  const [activeStandard, setActiveStandard] = useState<string | null>(null);

  // Fungsi Tambah Standar
  const handleAddStandard = () => {
    const code = prompt("Masukkan Kode Standar (misal: STA/SPMI-09):");
    const title = prompt("Masukkan Judul Standar:");
    if (!code || !title) return;

    const newStandard: Standard = {
       id: `S-${Date.now()}`,
       code,
       title,
       indicators: []
    };
    onSave([...standards, newStandard]);
  };

  // Fungsi Hapus Standar
  const handleDeleteStandard = (id: string) => {
     if(window.confirm("Hapus standar ini beserta seluruh indikatornya?")) {
        onSave(standards.filter(s => s.id !== id));
     }
  };

  // Fungsi Edit Standar
  const updateStandard = (id: string, field: 'code' | 'title', value: string) => {
     const newStandards = standards.map(s => {
        if (s.id !== id) return s;
        return { ...s, [field]: value };
     });
     onSave(newStandards);
  };

  // Fungsi Tambah Indikator
  const handleAddIndicator = (standardId: string) => {
     const id = prompt("Masukkan ID Indikator (misal: I9-1):");
     const name = prompt("Masukkan Nama Indikator:");
     if (!id || !name) return;

     const newStandards = standards.map(s => {
        if (s.id !== standardId) return s;
        return {
           ...s,
           indicators: [
              ...s.indicators,
              {
                 id,
                 standardId,
                 name,
                 baseline: '-',
                 target: '-',
                 targetYear: String(new Date().getFullYear() + 5),
                 subject: 'Unit Terkait'
              }
           ]
        };
     });
     onSave(newStandards);
  };

  // Fungsi Hapus Indikator
  const handleDeleteIndicator = (standardId: string, indicatorId: string) => {
     if(window.confirm("Hapus indikator ini?")) {
        const newStandards = standards.map(s => {
           if (s.id !== standardId) return s;
           return {
              ...s,
              indicators: s.indicators.filter(i => i.id !== indicatorId)
           };
        });
        onSave(newStandards);
     }
  };

  const updateIndicator = (standardId: string, indicatorId: string, field: string, value: string) => {
    const newStandards = standards.map(s => {
      if (s.id !== standardId) return s;
      return {
        ...s,
        indicators: s.indicators.map(i => {
           if (i.id !== indicatorId) return i;
           // If editing target for SPECIFIC cycle
           if (field === 'target') {
              const cycleTargets = i.cycleTargets || {};
              return {
                 ...i,
                 cycleTargets: {
                    ...cycleTargets,
                    [currentCycle]: { 
                        target: value, 
                        targetYear: cycleTargets[currentCycle]?.targetYear || i.targetYear 
                    }
                 }
              };
           }
           // General fields update (name, baseline, etc)
           return { ...i, [field]: value };
        })
      };
    });
    onSave(newStandards);
  };

  return (
    <div className="space-y-4">
       <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-black text-gray-800">Pengaturan Standar & Indikator</h3>
          <button onClick={handleAddStandard} className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all">
             + Standar Baru
          </button>
       </div>
       
       <div className="bg-yellow-50 p-4 rounded-xl border border-yellow-200 mb-4">
          <p className="text-xs font-bold text-yellow-800"><i className="fas fa-info-circle mr-2"></i>Edit kolom target untuk mengubah target spesifik <strong>Siklus {currentCycle}</strong>. Kolom lain berlaku umum.</p>
       </div>

       {standards.map(s => (
          <div key={s.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
             <div className="flex justify-between items-center p-5 bg-gray-50/50 hover:bg-gray-50 transition-colors border-b border-gray-100">
                <button 
                  onClick={() => setActiveStandard(activeStandard === s.id ? null : s.id)}
                  className="flex items-center gap-4 flex-1 text-left"
                >
                   <input 
                      className="bg-emerald-100 text-emerald-700 px-3 py-1 rounded text-[10px] font-black w-24 text-center border-transparent focus:border-emerald-500 focus:bg-white transition-all"
                      value={s.code}
                      onClick={(e) => e.stopPropagation()}
                      onChange={(e) => updateStandard(s.id, 'code', e.target.value)}
                   />
                   <input 
                      className="font-bold text-gray-700 text-sm bg-transparent border-b border-transparent focus:border-gray-300 outline-none flex-1"
                      value={s.title}
                      onClick={(e) => e.stopPropagation()}
                      onChange={(e) => updateStandard(s.id, 'title', e.target.value)}
                   />
                </button>
                <div className="flex items-center gap-3">
                   <button onClick={() => handleDeleteStandard(s.id)} className="text-red-400 hover:text-red-600 p-2"><i className="fas fa-trash"></i></button>
                   <button onClick={() => setActiveStandard(activeStandard === s.id ? null : s.id)}>
                      <i className={`fas fa-chevron-down transition-transform text-gray-400 ${activeStandard === s.id ? 'rotate-180' : ''}`}></i>
                   </button>
                </div>
             </div>
             
             {activeStandard === s.id && (
                <div className="p-6 space-y-4 bg-gray-50/30">
                   <div className="flex justify-end">
                      <button onClick={() => handleAddIndicator(s.id)} className="text-emerald-600 text-[10px] font-black uppercase hover:underline">
                         + Tambah Indikator
                      </button>
                   </div>
                   {s.indicators.map(ind => {
                      const currentTarget = ind.cycleTargets?.[currentCycle]?.target || ind.target;
                      return (
                         <div key={ind.id} className="flex flex-col md:flex-row gap-4 items-start md:items-center p-4 rounded-xl bg-white border border-gray-100 shadow-sm relative group">
                            <button onClick={() => handleDeleteIndicator(s.id, ind.id)} className="absolute -top-2 -right-2 w-6 h-6 bg-red-100 text-red-500 rounded-full shadow-sm opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center hover:bg-red-500 hover:text-white">
                               <i className="fas fa-times text-[10px]"></i>
                            </button>
                            
                            <div className="flex-1 w-full space-y-2">
                               <div className="flex gap-2">
                                  <input 
                                     className="text-[9px] font-black text-gray-400 bg-gray-50 px-2 py-1 rounded border-transparent focus:border-gray-300 w-16"
                                     value={ind.id}
                                     onChange={(e) => updateIndicator(s.id, ind.id, 'id', e.target.value)}
                                  />
                                  <input 
                                     className="text-[9px] font-black text-blue-400 bg-blue-50 px-2 py-1 rounded border-transparent focus:border-blue-300 w-24"
                                     value={ind.subject}
                                     onChange={(e) => updateIndicator(s.id, ind.id, 'subject', e.target.value)}
                                  />
                               </div>
                               <input 
                                  className="w-full text-xs font-bold text-gray-800 border-b border-transparent focus:border-gray-300 outline-none pb-1"
                                  value={ind.name}
                                  onChange={(e) => updateIndicator(s.id, ind.id, 'name', e.target.value)}
                               />
                            </div>
                            
                            <div className="w-full md:w-32">
                               <label className="text-[8px] font-black text-gray-400 uppercase block mb-1">Target {currentCycle}</label>
                               <input 
                                  className="w-full p-2 rounded-lg border border-gray-200 text-xs font-bold focus:border-emerald-500 focus:ring-1 focus:ring-emerald-200 outline-none"
                                  value={currentTarget}
                                  onChange={(e) => updateIndicator(s.id, ind.id, 'target', e.target.value)}
                               />
                            </div>
                         </div>
                      );
                   })}
                   {s.indicators.length === 0 && (
                      <div className="text-center text-gray-400 text-xs italic py-4">Belum ada indikator.</div>
                   )}
                </div>
             )}
          </div>
       ))}
    </div>
  );
};

const Reports: React.FC<{
  auditData: AuditEntry[];
  standards: Standard[];
  currentCycle: string;
  currentUser: User;
}> = ({ auditData, standards, currentCycle }) => {
   // Calculate summary
   const data = auditData.filter(d => d.cycle === currentCycle);
   const achieved = data.filter(d => d.status === AuditStatus.ACHIEVED).length;
   const notAchieved = data.filter(d => d.status === AuditStatus.NOT_ACHIEVED).length;
   const totalIndicators = standards.reduce((acc, s) => acc + s.indicators.length, 0) * PRODI_LIST.length; // Approximate total if all prodis audited
   
   // This is a simplified report view
   return (
      <div className="space-y-8">
         <div className="flex justify-between items-center print:hidden">
            <h3 className="text-2xl font-black text-gray-800">Laporan Audit Mutu {currentCycle}</h3>
            <button onClick={() => window.print()} className="bg-gray-800 text-white px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-gray-900">
               <i className="fas fa-print mr-2"></i> Cetak
            </button>
         </div>

         <div className="bg-white p-8 rounded-[2rem] shadow-sm border border-gray-100">
            <table className="w-full text-left border-collapse">
               <thead>
                  <tr className="border-b-2 border-gray-100">
                     <th className="p-3 text-[10px] font-black uppercase text-gray-400">Kode</th>
                     <th className="p-3 text-[10px] font-black uppercase text-gray-400">Indikator</th>
                     <th className="p-3 text-[10px] font-black uppercase text-gray-400">Prodi</th>
                     <th className="p-3 text-[10px] font-black uppercase text-gray-400">Target</th>
                     <th className="p-3 text-[10px] font-black uppercase text-gray-400">Capaian</th>
                     <th className="p-3 text-[10px] font-black uppercase text-gray-400">Status</th>
                  </tr>
               </thead>
               <tbody className="divide-y divide-gray-50">
                  {data.map((entry) => {
                     const standard = standards.find(s => s.indicators.some(i => i.id === entry.indicatorId));
                     const indicator = standard?.indicators.find(i => i.id === entry.indicatorId);
                     const target = indicator?.cycleTargets?.[currentCycle]?.target || indicator?.target;
                     
                     return (
                        <tr key={`${entry.indicatorId}-${entry.prodi}`}>
                           <td className="p-3 text-xs font-bold text-gray-500">{indicator?.id}</td>
                           <td className="p-3 text-xs font-bold text-gray-800">{indicator?.name}</td>
                           <td className="p-3 text-xs font-bold text-gray-600">{entry.prodi}</td>
                           <td className="p-3 text-xs font-bold text-gray-500">{target}</td>
                           <td className="p-3 text-xs font-bold text-gray-800">{entry.achievementValue}</td>
                           <td className="p-3">
                              <span className={`px-2 py-1 rounded text-[9px] font-black uppercase ${
                                 entry.status === AuditStatus.ACHIEVED ? 'bg-emerald-100 text-emerald-600' :
                                 entry.status === AuditStatus.NOT_ACHIEVED ? 'bg-red-100 text-red-600' :
                                 'bg-gray-100 text-gray-400'
                              }`}>
                                 {entry.status}
                              </span>
                           </td>
                        </tr>
                     );
                  })}
                  {data.length === 0 && (
                     <tr>
                        <td colSpan={6} className="p-8 text-center text-gray-400 italic font-bold">Belum ada data audit untuk siklus ini.</td>
                     </tr>
                  )}
               </tbody>
            </table>
         </div>
      </div>
   );
};

export default App;