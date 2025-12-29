
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { createRoot } from 'react-dom/client';
import { User, UserRole, AuditEntry, AuditStatus, Standard, Indicator, CorrectiveAction, AuditPlan, AuditSchedule, SPMIDocument } from './types';
import { STANDARDS as DEFAULT_STANDARDS, PRODI_LIST } from './constants';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell 
} from 'recharts';
import { GoogleGenAI } from "@google/genai";

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
  const [currentCycle, setCurrentCycle] = useState<string>('2025');
  const [activeCycles, setActiveCycles] = useState<string[]>(['2025']);
  const [loginForm, setLoginForm] = useState({ username: '', password: '' });
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [isAiOpen, setIsAiOpen] = useState(false);

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
    if (savedCycle) setCurrentCycle(JSON.parse(savedCycle));
    if (savedActiveCycles) setActiveCycles(JSON.parse(savedActiveCycles));
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

  const toggleCycleStatus = (cycleToToggle: string) => {
    const isActive = activeCycles.includes(cycleToToggle);
    let newActiveCycles: string[];
    if (isActive) {
       if (window.confirm(`Tutup Akses Siklus ${cycleToToggle}?`)) {
          newActiveCycles = activeCycles.filter(c => c !== cycleToToggle);
          setActiveCycles(newActiveCycles);
          saveToLocal('spmi_active_cycles_list', newActiveCycles);
       }
    } else {
       if (window.confirm(`Buka Akses Siklus ${cycleToToggle}?`)) {
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
    const newUsers = users.some(existing => existing.id === u.id) 
      ? users.map(existing => existing.id === u.id ? u : existing)
      : [...users, u];
    setUsers(newUsers);
    saveToLocal('spmi_users', newUsers);
  };

  const deleteUser = (id: string) => {
    if (currentUser?.role !== UserRole.ADMIN) return;
    if (window.confirm("Hapus user secara permanen?")) {
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
  };

  const saveDocument = (doc: SPMIDocument) => {
    const newDocs = [...spmiDocuments, doc];
    setSpmiDocuments(newDocs);
    saveToLocal('spmi_documents', newDocs);
  };

  const deleteDocument = (id: string) => {
    if(confirm('Hapus dokumen ini?')) {
      const newDocs = spmiDocuments.filter(d => d.id !== id);
      setSpmiDocuments(newDocs);
      saveToLocal('spmi_documents', newDocs);
    }
  };

  if (!currentUser) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-emerald-950 p-4 font-sans relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none">
          <div className="absolute top-10 left-10 w-64 h-64 bg-emerald-400 rounded-full blur-3xl"></div>
          <div className="absolute bottom-10 right-10 w-96 h-96 bg-emerald-600 rounded-full blur-3xl"></div>
        </div>
        <div className="bg-white p-12 rounded-[2.5rem] shadow-2xl w-full max-w-md z-10 border border-emerald-800/20">
          <div className="text-center mb-10">
            <div className="w-24 h-24 bg-emerald-50 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-xl shadow-emerald-900/10">
              <i className="fas fa-university text-emerald-600 text-4xl"></i>
            </div>
            <h1 className="text-3xl font-black text-emerald-900 uppercase tracking-tighter">SPMI UNUGHA</h1>
            <p className="text-gray-400 text-[10px] font-bold tracking-[0.3em] mt-2 italic">UNIVERSITAS NAHDLATUL ULAMA AL GHAZALI</p>
          </div>
          <form onSubmit={handleLogin} className="space-y-6">
            <div className="space-y-1">
              <label className="text-[10px] font-black text-emerald-800 uppercase ml-2">Username Access</label>
              <input 
                type="text" placeholder="Masukkan Username" required
                className="w-full p-4 bg-gray-50 border-2 border-transparent rounded-2xl focus:border-emerald-500 outline-none transition-all font-bold shadow-inner"
                value={loginForm.username}
                onChange={(e) => setLoginForm({...loginForm, username: e.target.value})}
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-black text-emerald-800 uppercase ml-2">Secret Password</label>
              <input 
                type="password" placeholder="••••••••" required
                className="w-full p-4 bg-gray-50 border-2 border-transparent rounded-2xl focus:border-emerald-500 outline-none transition-all font-bold shadow-inner"
                value={loginForm.password}
                onChange={(e) => setLoginForm({...loginForm, password: e.target.value})}
              />
            </div>
            {error && <p className="text-red-500 text-xs font-bold text-center italic animate-bounce">{error}</p>}
            <button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-black py-4 rounded-2xl shadow-lg transition-all active:scale-95 group">
              SIGN IN TO PORTAL <i className="fas fa-arrow-right ml-2 group-hover:translate-x-1 transition-transform"></i>
            </button>
          </form>
          <div className="mt-8 text-center">
            <p className="text-[10px] text-gray-400 font-bold uppercase">Quality Assurance Center &copy; 2025</p>
          </div>
        </div>
      </div>
    );
  }

  const isAdmin = currentUser.role === UserRole.ADMIN;

  return (
    <div className="min-h-screen flex bg-gray-50 font-sans">
      {/* Sidebar */}
      <aside className="w-80 bg-emerald-950 text-white flex flex-col fixed inset-y-0 shadow-2xl z-20 overflow-y-auto scrollbar-hide">
        <div className="p-10 border-b border-emerald-900/50">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-emerald-500/20 rounded-2xl flex items-center justify-center text-emerald-400 border border-emerald-500/30">
              <i className="fas fa-shield-halved text-2xl"></i>
            </div>
            <div>
              <span className="font-black text-2xl tracking-tighter uppercase block">SPMI<span className="text-emerald-400 italic">Hub</span></span>
              <span className="text-[9px] text-emerald-500/60 font-black uppercase tracking-widest">Quality Control</span>
            </div>
          </div>
          <div className="mt-8 p-5 bg-emerald-900/40 rounded-[1.5rem] border border-emerald-800/50 group hover:border-emerald-400/30 transition-all cursor-default">
            <p className="text-[9px] text-emerald-400 font-black uppercase mb-1">Authenticated User</p>
            <p className="font-bold text-base truncate">{currentUser.username}</p>
            <div className="flex items-center justify-between mt-2">
               <p className="text-[10px] text-emerald-500 font-black flex items-center gap-2">
                 <span className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse shadow-[0_0_8px_rgba(52,211,153,0.8)]"></span>
                 {currentUser.role}
               </p>
               {currentUser.prodi && <span className="bg-emerald-400/10 text-emerald-400 text-[8px] font-black px-2 py-0.5 rounded-full border border-emerald-400/20">{currentUser.prodi}</span>}
            </div>
          </div>
        </div>
        
        <nav className="flex-1 p-6 space-y-1">
            <SidebarSection label="Strategic Planning" />
            <NavItem active={activeTab === 'p1_perencanaan'} onClick={() => setActiveTab('p1_perencanaan')} icon="fa-file-lines" label="Dokumen SPMI" />

            <SidebarSection label="Implementation" />
            <NavItem active={activeTab === 'p2_pelaksanaan'} onClick={() => setActiveTab('p2_pelaksanaan')} icon="fa-gavel" label="SK & Pelaksanaan" />

            <SidebarSection label="Audit & Evaluation" />
            <NavItem active={activeTab === 'dashboard'} onClick={() => setActiveTab('dashboard')} icon="fa-house" label="Dashboard" />
            <NavItem active={activeTab === 'audit'} onClick={() => setActiveTab('audit')} icon="fa-clipboard-check" label="Audit Mutu Internal" />
            <NavItem active={activeTab === 'corrective'} onClick={() => setActiveTab('corrective')} icon="fa-triangle-exclamation" label="Tindakan Koreksi" />
            <NavItem active={activeTab === 'reports'} onClick={() => setActiveTab('reports')} icon="fa-chart-column" label="Reporting" />
            
            {isAdmin && (
              <>
                <SidebarSection label="Administration" />
                <NavItem active={activeTab === 'planning'} onClick={() => setActiveTab('planning')} icon="fa-calendar-alt" label="Audit Scheduling" />
                <NavItem active={activeTab === 'users'} onClick={() => setActiveTab('users')} icon="fa-users-gear" label="Account Center" />
                <NavItem active={activeTab === 'settings'} onClick={() => setActiveTab('settings')} icon="fa-sliders" label="Config Standards" />
              </>
            )}

            <SidebarSection label="Continuous Improvement" />
            <NavItem active={activeTab === 'p3_pengendalian'} onClick={() => setActiveTab('p3_pengendalian')} icon="fa-tower-control" label="Pengendalian" />
            <NavItem active={activeTab === 'p4_peningkatan'} onClick={() => setActiveTab('p4_peningkatan')} icon="fa-arrow-trend-up" label="Peningkatan" />
        </nav>

        <div className="p-6 mt-auto">
          <button onClick={handleLogout} className="w-full p-4 bg-red-600/10 hover:bg-red-600 text-red-500 hover:text-white border border-red-600/20 rounded-2xl transition-all font-black text-xs uppercase tracking-widest flex items-center justify-center gap-3">
            <i className="fas fa-power-off"></i> LOGOUT SYSTEM
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="ml-80 flex-1 p-12 overflow-x-hidden min-h-screen relative">
        <header className="mb-12">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
            <div>
              <div className="flex items-center gap-4 mb-2">
                 <div className="w-1.5 h-10 bg-emerald-500 rounded-full"></div>
                 <h2 className="text-4xl font-black text-gray-900 tracking-tight capitalize">
                   {activeTab === 'p1_perencanaan' ? 'P1 - Perencanaan SPMI' : 
                    activeTab === 'p2_pelaksanaan' ? 'P2 - Pelaksanaan' :
                    activeTab === 'p3_pengendalian' ? 'P3 - Pengendalian' :
                    activeTab === 'p4_peningkatan' ? 'P4 - Peningkatan' :
                    activeTab.replace(/([A-Z])/g, ' $1').replace('_', ' ')}
                 </h2>
              </div>
              <p className="text-gray-400 text-sm font-medium ml-6">Sistem Penjaminan Mutu Internal &bull; Cycle Year {currentCycle}</p>
            </div>

            <div className="flex items-center gap-4 bg-white p-2 rounded-[2rem] shadow-xl shadow-emerald-900/5 border border-gray-100">
              <div className="px-6 py-3 rounded-[1.5rem] flex items-center gap-4 bg-emerald-50/50 border border-emerald-100">
                <div className="flex flex-col">
                  <span className="text-[9px] font-black text-emerald-800/40 uppercase tracking-widest">Active Cycle:</span>
                  <select 
                    className="bg-transparent font-black text-sm outline-none cursor-pointer text-emerald-700"
                    value={currentCycle}
                    onChange={(e) => handleCycleChange(e.target.value)}
                  >
                    {CYCLE_OPTIONS.map(c => <option key={c} value={c}>TAHUN {c}</option>)}
                  </select>
                </div>
                <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center text-emerald-600 shadow-sm">
                   <i className="fas fa-calendar-check text-lg"></i>
                </div>
              </div>
            </div>
          </div>
        </header>

        <div className="animate-in fade-in slide-in-from-bottom-4 duration-700 fill-mode-both">
          {activeTab === 'p1_perencanaan' && <DocumentPortal title="P1 - Perencanaan" categories={['Kebijakan', 'Manual', 'Standar', 'Formulir']} documents={spmiDocuments} onSave={saveDocument} onDelete={deleteDocument} isReadOnly={!isAdmin} />}
          {activeTab === 'p2_pelaksanaan' && <DocumentPortal title="P2 - Pelaksanaan" categories={['SK']} documents={spmiDocuments} onSave={saveDocument} onDelete={deleteDocument} isReadOnly={!isAdmin} />}
          {activeTab === 'p3_pengendalian' && <DocumentPortal title="P3 - Pengendalian" categories={['Pengendalian']} documents={spmiDocuments} onSave={saveDocument} onDelete={deleteDocument} isReadOnly={!isAdmin} />}
          {activeTab === 'p4_peningkatan' && <DocumentPortal title="P4 - Peningkatan" categories={['Peningkatan']} documents={spmiDocuments} onSave={saveDocument} onDelete={deleteDocument} isReadOnly={!isAdmin} />}
          
          {activeTab === 'dashboard' && <Dashboard auditData={auditData} standards={standards} correctiveActions={correctiveActions} currentCycle={currentCycle} />}
          {activeTab === 'audit' && <AuditPortal auditData={auditData} onSave={saveAuditEntry} currentUser={currentUser} standards={standards} currentCycle={currentCycle} activeCycles={activeCycles} onToggleCycle={toggleCycleStatus} />}
          {activeTab === 'corrective' && <CorrectiveActionPortal auditData={auditData} correctiveActions={correctiveActions} onSavePTK={savePTK} currentUser={currentUser} standards={standards} currentCycle={currentCycle} activeCycles={activeCycles} onToggleCycle={toggleCycleStatus} />}
          {activeTab === 'planning' && <PlanningPortal plans={auditPlans} onSavePlan={savePlan} users={users} currentCycle={currentCycle} />}
          {activeTab === 'users' && <UserManagement users={users} onSaveUser={saveUser} onDeleteUser={deleteUser} currentUser={currentUser} />}
          {activeTab === 'settings' && <StandardSettings standards={standards} onSave={saveStandards} currentCycle={currentCycle} />}
          {activeTab === 'reports' && <Reports auditData={auditData} standards={standards} currentCycle={currentCycle} currentUser={currentUser} />}
        </div>
        
        <footer className="mt-24 pt-10 border-t border-gray-100 flex flex-col md:flex-row justify-between items-center text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em] gap-4">
           <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                 <i className="fas fa-server text-emerald-500"></i>
                 <span>Node: 01-PROD</span>
              </div>
              <div className="flex items-center gap-2">
                 <i className="fas fa-clock text-emerald-500"></i>
                 <span>System Time: {new Date().toLocaleTimeString('id-ID')}</span>
              </div>
           </div>
           <div className="flex items-center gap-2">
              <img src="https://img.icons8.com/color/48/000000/google-logo.png" className="w-4 h-4" alt="Google" />
              <span>SPMI UNUGHA Cilacap &bull; Empowered by AI</span>
           </div>
        </footer>
      </main>

      {/* AI Assistant Toggle */}
      <button 
        onClick={() => setIsAiOpen(!isAiOpen)}
        className="fixed bottom-10 right-10 w-16 h-16 bg-emerald-600 text-white rounded-full shadow-2xl flex items-center justify-center hover:scale-110 active:scale-95 transition-all z-50 group border-4 border-white"
      >
        <i className={`fas ${isAiOpen ? 'fa-times' : 'fa-robot'} text-2xl`}></i>
        <span className="absolute -top-2 -right-2 bg-red-500 text-white text-[8px] font-black px-2 py-1 rounded-full animate-pulse border-2 border-white">AI</span>
      </button>

      {/* AI Assistant Drawer */}
      {isAiOpen && (
        <AiAssistant 
          onClose={() => setIsAiOpen(false)} 
          currentCycle={currentCycle} 
          auditData={auditData}
          standards={standards}
        />
      )}
    </div>
  );
};

// --- Child Components ---

const SidebarSection: React.FC<{ label: string }> = ({ label }) => (
  <div className="px-6 py-4 mt-4">
    <span className="text-[10px] font-black text-emerald-400/40 uppercase tracking-[0.3em]">{label}</span>
  </div>
);

const NavItem: React.FC<{ active: boolean, onClick: () => void, icon: string, label: string }> = ({ active, onClick, icon, label }) => (
  <button onClick={onClick} className={`w-full flex items-center gap-4 p-4 rounded-2xl transition-all ${active ? 'bg-emerald-600 text-white shadow-xl translate-x-1' : 'text-emerald-300/70 hover:bg-emerald-900/50 hover:text-white'}`}>
    <div className={`w-8 h-8 flex items-center justify-center rounded-xl ${active ? 'bg-emerald-500 shadow-inner' : 'bg-transparent border border-emerald-800/30'}`}>
      <i className={`fas ${icon} text-sm`}></i>
    </div>
    <span className="font-bold text-sm tracking-tight">{label}</span>
  </button>
);

const AiAssistant: React.FC<{ onClose: () => void, currentCycle: string, auditData: AuditEntry[], standards: Standard[] }> = ({ onClose, currentCycle, auditData, standards }) => {
  const [messages, setMessages] = useState<{role: 'user' | 'ai', content: string}[]>([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages]);

  const handleAsk = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;
    const userMsg = input;
    setInput('');
    setMessages(prev => [...prev, {role: 'user', content: userMsg}]);
    setIsTyping(true);

    try {
      const summary = auditData.filter(d => d.cycle === currentCycle).map(d => `${d.prodi}: ${d.indicatorId} - ${d.status}`).join('\n');
      const systemPrompt = `You are the SPMI UNUGHA AI Assistant. You help auditors and university staff with Quality Assurance questions. 
      Current Cycle: ${currentCycle}. 
      Current Audit Status Snippet: ${summary.slice(0, 500)}. 
      Respond professionally in Indonesian.`;

      // Corrected: Initialize AI client and call generateContent using named parameters and property access for text
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: userMsg,
        config: { systemInstruction: systemPrompt }
      });

      setMessages(prev => [...prev, {role: 'ai', content: response.text || "Mohon maaf, terjadi kendala teknis."}]);
    } catch (err) {
      setMessages(prev => [...prev, {role: 'ai', content: "Error connecting to AI. Please check your API key."}]);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <div className="fixed bottom-32 right-10 w-96 bg-white rounded-[2rem] shadow-[0_32px_64px_-16px_rgba(6,78,59,0.3)] z-[100] border border-emerald-100 flex flex-col overflow-hidden animate-in fade-in slide-in-from-bottom-8">
      <div className="bg-emerald-900 p-6 text-white flex justify-between items-center">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-emerald-400/20 rounded-full flex items-center justify-center border border-emerald-400/30">
            <i className="fas fa-microchip"></i>
          </div>
          <div>
            <p className="font-black text-sm uppercase tracking-widest leading-none">AI Auditor</p>
            <p className="text-[9px] text-emerald-400 font-bold uppercase mt-1">Intelligent Advisor</p>
          </div>
        </div>
        <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors"><i className="fas fa-times"></i></button>
      </div>
      <div ref={scrollRef} className="flex-1 p-6 h-96 overflow-y-auto space-y-4 bg-emerald-50/20 scrollbar-hide">
        {messages.length === 0 && (
          <div className="text-center p-8 bg-white rounded-2xl border border-emerald-100 shadow-sm">
            <p className="text-xs text-gray-500 font-bold italic">Halo! Saya asisten AI SPMI UNUGHA. Ada yang bisa saya bantu terkait audit atau standar mutu?</p>
            <div className="mt-4 flex flex-wrap gap-2 justify-center">
              <button onClick={() => setInput("Ringkas capaian audit siklus ini")} className="text-[9px] bg-emerald-50 text-emerald-600 px-3 py-1.5 rounded-full font-black uppercase hover:bg-emerald-600 hover:text-white transition-all border border-emerald-100">Ringkasan</button>
              <button onClick={() => setInput("Apa itu standar PPEPP?")} className="text-[9px] bg-emerald-50 text-emerald-600 px-3 py-1.5 rounded-full font-black uppercase hover:bg-emerald-600 hover:text-white transition-all border border-emerald-100">Info PPEPP</button>
            </div>
          </div>
        )}
        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[85%] p-4 rounded-2xl text-xs font-bold shadow-sm ${m.role === 'user' ? 'bg-emerald-600 text-white rounded-br-none' : 'bg-white text-gray-800 rounded-bl-none border border-emerald-100'}`}>
              {m.content}
            </div>
          </div>
        ))}
        {isTyping && (
          <div className="flex justify-start">
            <div className="bg-white p-4 rounded-2xl rounded-bl-none border border-emerald-100 flex gap-1">
              <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-bounce"></div>
              <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-bounce delay-75"></div>
              <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-bounce delay-150"></div>
            </div>
          </div>
        )}
      </div>
      <form onSubmit={handleAsk} className="p-4 border-t border-emerald-50 bg-white">
        <div className="flex gap-2">
          <input 
            className="flex-1 p-3 bg-gray-50 rounded-xl text-xs font-bold outline-none focus:bg-white focus:ring-2 focus:ring-emerald-100 transition-all"
            placeholder="Ketik pertanyaan..."
            value={input}
            onChange={e => setInput(e.target.value)}
          />
          <button className="w-12 h-12 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 transition-all flex items-center justify-center">
            <i className="fas fa-paper-plane"></i>
          </button>
        </div>
      </form>
    </div>
  );
};

// Simplified Sub-components for logic flow
const DocumentPortal: React.FC<{ title: string, categories: string[], documents: SPMIDocument[], onSave: (doc: SPMIDocument) => void, onDelete: (id: string) => void, isReadOnly?: boolean }> = ({ title, categories, documents, onSave, onDelete, isReadOnly }) => {
  const [activeCat, setActiveCat] = useState(categories[0]);
  const [formData, setFormData] = useState({ name: '', url: '' });
  const filteredDocs = documents.filter(d => d.category === activeCat);

  return (
    <div className="space-y-8">
      <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
        {categories.map(cat => (
          <button key={cat} onClick={() => setActiveCat(cat)} className={`px-6 py-3 rounded-2xl text-xs font-black uppercase tracking-widest transition-all ${activeCat === cat ? 'bg-emerald-600 text-white shadow-xl shadow-emerald-900/10 scale-105' : 'bg-white text-gray-400 hover:bg-gray-100 border border-gray-100'}`}>
            {cat}
          </button>
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        {!isReadOnly && (
          <div className="bg-white p-10 rounded-[2.5rem] shadow-xl shadow-emerald-900/5 border border-emerald-100">
            <h3 className="text-xl font-black text-gray-900 mb-8 flex items-center gap-3"><i className="fas fa-cloud-arrow-up text-emerald-500"></i> Upload New {activeCat}</h3>
            <div className="space-y-6">
               <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-400 uppercase ml-2 tracking-widest">Document Name</label>
                  <input className="w-full p-4 bg-gray-50 rounded-2xl font-bold text-sm outline-none focus:ring-2 focus:ring-emerald-100 transition-all" placeholder="Enter name" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
               </div>
               <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-400 uppercase ml-2 tracking-widest">File Link (Cloud Storage)</label>
                  <input className="w-full p-4 bg-gray-50 rounded-2xl font-bold text-sm outline-none focus:ring-2 focus:ring-emerald-100 transition-all text-blue-600" placeholder="https://..." value={formData.url} onChange={e => setFormData({...formData, url: e.target.value})} />
               </div>
               <button onClick={() => {onSave({id: `d-${Date.now()}`, category: activeCat as any, name: formData.name, url: formData.url, lastUpdated: new Date().toISOString()}); setFormData({name:'', url:''});}} className="w-full py-4 bg-emerald-600 text-white rounded-2xl font-black uppercase tracking-widest hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-900/10">Publish Document</button>
            </div>
          </div>
        )}
        <div className={`${isReadOnly ? 'lg:col-span-3' : 'lg:col-span-2'} grid grid-cols-1 md:grid-cols-2 gap-6`}>
           {filteredDocs.map(doc => (
             <div key={doc.id} className="bg-white p-6 rounded-3xl shadow-xl shadow-emerald-900/5 border border-gray-100 flex items-center gap-6 group hover:border-emerald-500/50 transition-all border-l-8 border-l-emerald-500">
                <div className="w-14 h-14 bg-emerald-50 rounded-2xl flex items-center justify-center text-emerald-600 flex-shrink-0 shadow-inner group-hover:bg-emerald-600 group-hover:text-white transition-all">
                   <i className="fas fa-file-pdf text-xl"></i>
                </div>
                <div className="flex-1 min-w-0">
                   <h4 className="font-black text-gray-900 text-sm truncate">{doc.name}</h4>
                   <p className="text-[10px] text-gray-400 font-bold uppercase mt-1">Modified: {new Date(doc.lastUpdated).toLocaleDateString()}</p>
                   <div className="flex gap-2 mt-3">
                      <a href={doc.url} target="_blank" className="text-[10px] bg-blue-50 text-blue-600 px-3 py-1.5 rounded-lg font-black uppercase hover:bg-blue-600 hover:text-white transition-all">Open Link</a>
                      {!isReadOnly && <button onClick={() => onDelete(doc.id)} className="text-[10px] bg-red-50 text-red-600 px-3 py-1.5 rounded-lg font-black uppercase hover:bg-red-600 hover:text-white transition-all">Delete</button>}
                   </div>
                </div>
             </div>
           ))}
           {filteredDocs.length === 0 && <div className="col-span-full py-20 bg-gray-50 border-4 border-dashed border-gray-100 rounded-[3rem] text-center"><p className="text-gray-400 font-black uppercase tracking-widest">No documents available in this category</p></div>}
        </div>
      </div>
    </div>
  );
};

const Dashboard: React.FC<{ auditData: AuditEntry[], standards: Standard[], correctiveActions: CorrectiveAction[], currentCycle: string }> = ({ auditData, standards, currentCycle }) => {
  const currentData = auditData.filter(d => d.cycle === currentCycle);
  const achieved = currentData.filter(d => d.status === AuditStatus.ACHIEVED).length;
  const notAchieved = currentData.filter(d => d.status === AuditStatus.NOT_ACHIEVED).length;
  const pending = currentData.filter(d => d.status === AuditStatus.PENDING).length;

  const chartData = [
    { name: 'ACHIEVED', value: achieved, fill: '#10B981' },
    { name: 'NOT ACHIEVED', value: notAchieved, fill: '#EF4444' },
    { name: 'PENDING', value: pending, fill: '#F59E0B' },
  ];

  return (
    <div className="space-y-10">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <StatCard label="Indikator Tercapai" value={achieved} color="emerald" icon="fa-check-double" />
        <StatCard label="Indikator Belum Tercapai" value={notAchieved} color="red" icon="fa-circle-exclamation" />
        <StatCard label="Audit Menunggu Verifikasi" value={pending} color="amber" icon="fa-hourglass-half" />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
         <div className="bg-white p-10 rounded-[3rem] shadow-xl shadow-emerald-900/5 border border-gray-100">
           <h3 className="text-xl font-black text-gray-900 mb-8 uppercase tracking-tighter">Capaian Mutu Visual</h3>
           <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                   <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                   <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 10, fontWeight: 'bold', fill: '#9ca3af'}} />
                   <YAxis axisLine={false} tickLine={false} tick={{fontSize: 10, fontWeight: 'bold', fill: '#9ca3af'}} />
                   <Tooltip cursor={{fill: '#f9fafb'}} contentStyle={{borderRadius: '16px', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)', fontSize: '10px', fontWeight: 'bold'}} />
                   <Bar dataKey="value" radius={[8, 8, 0, 0]} barSize={60} />
                </BarChart>
              </ResponsiveContainer>
           </div>
         </div>
         <div className="bg-emerald-900 p-10 rounded-[3rem] shadow-xl shadow-emerald-900/20 text-white relative overflow-hidden">
            <div className="absolute top-0 right-0 p-8 opacity-10">
               <i className="fas fa-university text-9xl"></i>
            </div>
            <h3 className="text-xl font-black mb-8 uppercase tracking-tighter">Quick Summary ({currentCycle})</h3>
            <div className="space-y-6">
               <SummaryRow label="Total Indicators in System" value={standards.reduce((a, s) => a + s.indicators.length, 0)} />
               <SummaryRow label="Active Study Programs" value={PRODI_LIST.length} />
               <SummaryRow label="Compliance Rate" value={`${achieved > 0 ? ((achieved / (achieved + notAchieved)) * 100).toFixed(1) : 0}%`} />
               <div className="pt-6">
                  <div className="h-4 bg-emerald-950/50 rounded-full overflow-hidden border border-emerald-800">
                     <div className="h-full bg-emerald-400 transition-all duration-1000" style={{width: `${achieved > 0 ? (achieved / (achieved + notAchieved + pending)) * 100 : 0}%`}}></div>
                  </div>
                  <p className="text-[10px] font-black uppercase text-emerald-400/60 mt-2 text-right tracking-widest">Progress Monitoring</p>
               </div>
            </div>
         </div>
      </div>
    </div>
  );
};

const StatCard: React.FC<{ label: string, value: number, color: string, icon: string }> = ({ label, value, color, icon }) => (
  <div className="bg-white p-8 rounded-[2.5rem] shadow-xl shadow-emerald-900/5 border border-gray-100 flex items-center justify-between group hover:border-emerald-500/30 transition-all cursor-default relative overflow-hidden">
    <div className={`absolute top-0 right-0 p-6 opacity-5 group-hover:scale-110 transition-transform`}>
       <i className={`fas ${icon} text-6xl`}></i>
    </div>
    <div>
      <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">{label}</p>
      <p className={`text-5xl font-black text-${color}-600 tracking-tighter`}>{value}</p>
    </div>
    <div className={`w-14 h-14 rounded-2xl bg-${color}-50 flex items-center justify-center text-${color}-600 border border-${color}-100`}>
      <i className={`fas ${icon} text-xl`}></i>
    </div>
  </div>
);

const SummaryRow: React.FC<{ label: string, value: string | number }> = ({ label, value }) => (
  <div className="flex justify-between items-center border-b border-emerald-800/50 pb-4">
    <span className="text-xs font-bold text-emerald-400/80 uppercase tracking-wider">{label}</span>
    <span className="text-lg font-black">{value}</span>
  </div>
);

const AuditPortal: React.FC<{ auditData: AuditEntry[], onSave: (entry: AuditEntry) => void, currentUser: User, standards: Standard[], currentCycle: string, activeCycles: string[], onToggleCycle: (c: string) => void }> = ({ auditData, onSave, currentUser, standards, currentCycle, activeCycles, onToggleCycle }) => {
  const [selectedStandard, setSelectedStandard] = useState(standards[0]?.id || '');
  const availableProdis = useMemo(() => {
     if (currentUser.role === UserRole.ADMIN) return PRODI_LIST;
     if (currentUser.role === UserRole.AUDITEE) return [currentUser.prodi || ''];
     if (currentUser.role === UserRole.AUDITOR) return currentUser.assignedProdi || [];
     return [];
  }, [currentUser]);
  const [selectedProdi, setSelectedProdi] = useState<string>(availableProdis[0] || '');
  const isLocked = !activeCycles.includes(currentCycle);

  return (
    <div className="space-y-8">
       <div className={`p-8 rounded-[2.5rem] flex justify-between items-center ${isLocked ? 'bg-red-50 border border-red-100 shadow-red-900/5' : 'bg-emerald-50 border border-emerald-100 shadow-emerald-900/5 shadow-xl'}`}>
          <div className="flex items-center gap-6">
             <div className={`w-16 h-16 rounded-[1.5rem] flex items-center justify-center shadow-lg ${isLocked ? 'bg-white text-red-600' : 'bg-white text-emerald-600'}`}>
                <i className={`fas ${isLocked ? 'fa-lock' : 'fa-lock-open'} text-2xl`}></i>
             </div>
             <div>
                <h4 className={`text-lg font-black uppercase tracking-tighter ${isLocked ? 'text-red-700' : 'text-emerald-900'}`}>Audit Flow Status: {isLocked ? 'Closed' : 'Open'}</h4>
                <p className="text-xs font-bold text-gray-500 opacity-60">Cycle Year: {currentCycle}</p>
             </div>
          </div>
          {currentUser.role === UserRole.ADMIN && (
             <button onClick={() => onToggleCycle(currentCycle)} className={`px-8 py-3 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] transition-all shadow-lg ${isLocked ? 'bg-emerald-600 text-white hover:bg-emerald-700 shadow-emerald-900/20' : 'bg-red-500 text-white hover:bg-red-600 shadow-red-900/20'}`}>
                {isLocked ? 'Enable Editing' : 'Lock Cycle'}
             </button>
          )}
       </div>

       <div className="flex gap-3 overflow-x-auto pb-4 scrollbar-hide">
         {standards.map(s => (
            <button key={s.id} onClick={() => setSelectedStandard(s.id)} className={`px-6 py-3 rounded-2xl text-[10px] font-black uppercase whitespace-nowrap transition-all border ${selectedStandard === s.id ? 'bg-emerald-600 text-white border-emerald-600 shadow-xl shadow-emerald-900/10' : 'bg-white text-gray-400 border-gray-100 hover:bg-gray-50'}`}>
              {s.code}
            </button>
         ))}
       </div>
       
       <div className="bg-white p-8 rounded-3xl shadow-xl shadow-emerald-900/5 border border-gray-100 flex items-center gap-6">
          <div className="w-10 h-10 bg-emerald-50 rounded-xl flex items-center justify-center text-emerald-600"><i className="fas fa-building-columns"></i></div>
          <div className="flex-1">
            <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-1">Target Study Program</span>
            <select value={selectedProdi} onChange={e => setSelectedProdi(e.target.value)} className="w-full font-black text-lg outline-none bg-transparent text-gray-900 cursor-pointer">
               {availableProdis.map(p => <option key={p} value={p}>{p}</option>)}
            </select>
          </div>
       </div>
       
       <div className="space-y-6">
          {standards.find(s => s.id === selectedStandard)?.indicators.map(ind => {
             const entry = auditData.find(d => d.indicatorId === ind.id && d.prodi === selectedProdi && d.cycle === currentCycle);
             const currentTarget = ind.cycleTargets?.[currentCycle]?.target || ind.target;

             return (
               <div key={ind.id} className="bg-white p-8 rounded-[2.5rem] shadow-xl shadow-emerald-900/5 border border-gray-100 group hover:border-emerald-500/50 transition-all border-l-8 border-l-emerald-100">
                  <div className="flex justify-between items-start mb-8">
                     <div className="flex-1 pr-6">
                        <div className="flex items-center gap-2 mb-3">
                           <span className="text-[10px] font-black text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-100">{ind.id}</span>
                           <span className="text-[10px] font-black text-blue-600 bg-blue-50 px-3 py-1.5 rounded-xl border border-blue-100 uppercase tracking-widest">{ind.subject}</span>
                        </div>
                        <h4 className="font-black text-gray-900 text-xl tracking-tight leading-tight">{ind.name}</h4>
                        <div className="flex items-center gap-2 mt-2">
                           <i className="fas fa-bullseye text-emerald-500 text-[10px]"></i>
                           <p className="text-xs font-bold text-gray-400">Standard Target: <span className="text-emerald-600">{currentTarget}</span></p>
                        </div>
                     </div>
                     <div className={`px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-sm ${
                        entry?.status === AuditStatus.ACHIEVED ? 'bg-emerald-500 text-white' :
                        entry?.status === AuditStatus.NOT_ACHIEVED ? 'bg-red-500 text-white' :
                        'bg-gray-100 text-gray-400'
                     }`}>
                        {entry?.status || 'NOT FILLED'}
                     </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-10 pt-8 border-t border-gray-50">
                     <div className="space-y-4">
                        <h5 className="text-[10px] font-black text-emerald-800 uppercase tracking-[0.2em] flex items-center gap-2">
                           <i className="fas fa-edit"></i> Auditee Submission
                        </h5>
                        <div className="space-y-3">
                           <input 
                              className="w-full p-4 bg-gray-50 rounded-2xl text-sm font-bold border-2 border-transparent focus:border-emerald-200 outline-none transition-all"
                              value={entry?.achievementValue || ''}
                              onChange={e => onSave({ ...entry!, prodi: selectedProdi, indicatorId: ind.id, cycle: currentCycle, achievementValue: e.target.value, status: AuditStatus.PENDING, lastUpdated: new Date().toISOString() } as any)}
                              placeholder="Ketik nilai capaian riil..."
                              disabled={currentUser.role === UserRole.AUDITOR || (isLocked && currentUser.role !== UserRole.ADMIN)}
                           />
                           <div className="relative">
                              <input 
                                 className="w-full p-4 pr-12 bg-gray-50 rounded-2xl text-xs font-bold text-blue-600 border-2 border-transparent focus:border-emerald-200 outline-none transition-all"
                                 value={entry?.docLink || ''}
                                 onChange={e => onSave({ ...entry!, prodi: selectedProdi, indicatorId: ind.id, cycle: currentCycle, docLink: e.target.value, lastUpdated: new Date().toISOString() } as any)}
                                 placeholder="URL Bukti (Google Drive)"
                                 disabled={currentUser.role === UserRole.AUDITOR || (isLocked && currentUser.role !== UserRole.ADMIN)}
                              />
                              {entry?.docLink && <a href={entry.docLink} target="_blank" className="absolute right-4 top-4 text-emerald-600 hover:text-emerald-800"><i className="fas fa-external-link-alt"></i></a>}
                           </div>
                        </div>
                     </div>
                     <div className="space-y-4">
                        <h5 className="text-[10px] font-black text-blue-800 uppercase tracking-[0.2em] flex items-center gap-2">
                           <i className="fas fa-shield-check"></i> Auditor Verification
                        </h5>
                        <div className="space-y-3">
                           <select 
                              className="w-full p-4 bg-gray-50 rounded-2xl text-sm font-black outline-none border-2 border-transparent focus:border-blue-200 transition-all text-gray-900"
                              value={entry?.status || AuditStatus.NOT_FILLED}
                              onChange={e => onSave({ ...entry!, prodi: selectedProdi, indicatorId: ind.id, cycle: currentCycle, status: e.target.value as AuditStatus, lastUpdated: new Date().toISOString() } as any)}
                              disabled={currentUser.role === UserRole.AUDITEE || (isLocked && currentUser.role !== UserRole.ADMIN)}
                           >
                              {Object.values(AuditStatus).map(s => <option key={s} value={s}>{s.replace('_', ' ')}</option>)}
                           </select>
                           <textarea 
                              className="w-full p-4 bg-gray-50 rounded-2xl text-xs font-bold outline-none border-2 border-transparent focus:border-blue-200 transition-all"
                              value={entry?.notes || ''}
                              onChange={e => onSave({ ...entry!, prodi: selectedProdi, indicatorId: ind.id, cycle: currentCycle, notes: e.target.value, lastUpdated: new Date().toISOString() } as any)}
                              placeholder="Catatan verifikasi atau temuan audit..."
                              rows={2}
                              disabled={currentUser.role === UserRole.AUDITEE || (isLocked && currentUser.role !== UserRole.ADMIN)}
                           />
                        </div>
                     </div>
                  </div>
               </div>
             );
          })}
       </div>
    </div>
  );
};

// --- Defining Missing Portals and System Components ---

const CorrectiveActionPortal: React.FC<{ auditData: AuditEntry[], correctiveActions: CorrectiveAction[], onSavePTK: (ptk: CorrectiveAction) => void, currentUser: User, standards: Standard[], currentCycle: string, activeCycles: string[], onToggleCycle: (c: string) => void }> = ({ auditData, correctiveActions, onSavePTK, currentUser, standards, currentCycle, activeCycles, onToggleCycle }) => {
  const notAchieved = auditData.filter(d => d.cycle === currentCycle && d.status === AuditStatus.NOT_ACHIEVED);
  const isLocked = !activeCycles.includes(currentCycle);

  const handleSave = (indicatorId: string, prodi: string, updates: Partial<CorrectiveAction>) => {
    if (isLocked && currentUser.role !== UserRole.ADMIN) return;
    const existing = correctiveActions.find(c => c.indicatorId === indicatorId && c.prodi === prodi && c.cycle === currentCycle);
    const ptk: CorrectiveAction = {
      id: existing?.id || `ptk-${Date.now()}`,
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
      targetYear: existing?.targetYear || currentCycle,
      createdAt: existing?.createdAt || new Date().toISOString(),
      ...updates
    };
    onSavePTK(ptk);
  };

  if (notAchieved.length === 0) {
    return <div className="py-20 bg-gray-50 border-4 border-dashed border-gray-100 rounded-[3rem] text-center"><p className="text-gray-400 font-black uppercase tracking-widest">No major corrective actions identified for this cycle</p></div>;
  }

  return (
    <div className="space-y-8">
       {notAchieved.map(entry => {
         const indicator = standards.flatMap(s => s.indicators).find(i => i.id === entry.indicatorId);
         const ptk = correctiveActions.find(c => c.indicatorId === entry.indicatorId && c.prodi === entry.prodi && c.cycle === currentCycle);
         if (currentUser.role === UserRole.AUDITEE && currentUser.prodi !== entry.prodi) return null;
         
         return (
           <div key={`${entry.indicatorId}-${entry.prodi}`} className="bg-white p-10 rounded-[2.5rem] shadow-xl shadow-emerald-900/5 border border-gray-100 border-l-8 border-l-red-500">
              <div className="flex justify-between items-start mb-8">
                 <div>
                    <span className="text-[10px] font-black text-red-600 bg-red-50 px-3 py-1.5 rounded-xl border border-red-100 uppercase tracking-widest mb-2 inline-block">Unachieved Finding</span>
                    <h4 className="font-black text-gray-900 text-xl tracking-tight leading-tight">{indicator?.name}</h4>
                    <p className="text-xs font-bold text-gray-400 mt-2">Study Program: <span className="text-gray-900">{entry.prodi}</span></p>
                 </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                 <div className="space-y-6">
                    <h5 className="text-[10px] font-black text-emerald-800 uppercase tracking-widest">Analisis (Auditee)</h5>
                    <div className="space-y-4">
                       <textarea className="w-full p-4 bg-gray-50 rounded-2xl text-xs font-bold outline-none border-2 border-transparent focus:border-emerald-200" placeholder="Akar Masalah..." value={ptk?.rootCause || ''} onChange={e => handleSave(entry.indicatorId, entry.prodi, { rootCause: e.target.value })} disabled={currentUser.role === UserRole.AUDITOR || isLocked} rows={3} />
                       <textarea className="w-full p-4 bg-gray-50 rounded-2xl text-xs font-bold outline-none border-2 border-transparent focus:border-emerald-200" placeholder="Rencana Tindakan..." value={ptk?.plan || ''} onChange={e => handleSave(entry.indicatorId, entry.prodi, { plan: e.target.value })} disabled={currentUser.role === UserRole.AUDITOR || isLocked} rows={3} />
                    </div>
                 </div>
                 <div className="space-y-6">
                    <h5 className="text-[10px] font-black text-blue-800 uppercase tracking-widest">Verifikasi (Auditor)</h5>
                    <div className="space-y-4">
                       <select className="w-full p-4 bg-gray-50 rounded-2xl text-xs font-black outline-none" value={ptk?.docVerification || 'PENDING'} onChange={e => handleSave(entry.indicatorId, entry.prodi, { docVerification: e.target.value as any })} disabled={currentUser.role === UserRole.AUDITEE || isLocked}>
                          <option value="PENDING">Menunggu</option>
                          <option value="SUITABLE">Sesuai</option>
                          <option value="NOT_SUITABLE">Tidak Sesuai</option>
                       </select>
                       <textarea className="w-full p-4 bg-gray-50 rounded-2xl text-xs font-bold outline-none border-2 border-transparent focus:border-blue-200" placeholder="Catatan Verifikasi..." value={ptk?.realization || ''} onChange={e => handleSave(entry.indicatorId, entry.prodi, { realization: e.target.value })} disabled={currentUser.role === UserRole.AUDITEE || isLocked} rows={3} />
                    </div>
                 </div>
              </div>
           </div>
         );
       })}
    </div>
  );
};

const PlanningPortal: React.FC<{ plans: AuditPlan[], onSavePlan: (p: AuditPlan) => void, users: User[], currentCycle: string }> = ({ plans, onSavePlan, users, currentCycle }) => {
  const [formData, setFormData] = useState<Partial<AuditPlan>>({ prodi: PRODI_LIST[0], cycle: currentCycle, isActive: true, schedule: { fillingStart: '', fillingEnd: '', deskEvalStart: '', deskEvalEnd: '', visitStart: '', visitEnd: '', rtmStart: '', rtmEnd: '' }, auditorIds: [] });
  const auditors = users.filter(u => u.role === UserRole.AUDITOR);
  
  return (
    <div className="space-y-10">
       <div className="bg-white p-12 rounded-[3rem] shadow-xl shadow-emerald-900/5 border border-emerald-100">
          <h3 className="text-2xl font-black text-gray-900 mb-10 uppercase tracking-tighter">New Audit Scheduling</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
             <div className="space-y-6">
                <div className="space-y-2">
                   <label className="text-[10px] font-black text-gray-400 uppercase ml-2">Program Studi</label>
                   <select className="w-full p-4 bg-gray-50 rounded-2xl font-bold outline-none" value={formData.prodi} onChange={e => setFormData({...formData, prodi: e.target.value})}>
                      {PRODI_LIST.map(p => <option key={p} value={p}>{p}</option>)}
                   </select>
                </div>
                <div className="space-y-2">
                   <label className="text-[10px] font-black text-gray-400 uppercase ml-2">Lead Auditor</label>
                   <select className="w-full p-4 bg-gray-50 rounded-2xl font-bold outline-none" onChange={e => setFormData({...formData, auditorIds: [e.target.value]})}>
                      <option value="">-- Choose Auditor --</option>
                      {auditors.map(a => <option key={a.id} value={a.id}>{a.username}</option>)}
                   </select>
                </div>
             </div>
             <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2"><label className="text-[10px] font-black text-gray-400 uppercase">Start Date</label><input type="date" className="w-full p-4 bg-gray-50 rounded-2xl font-bold text-xs" onChange={e => setFormData({...formData, schedule: {...formData.schedule!, visitStart: e.target.value}})} /></div>
                <div className="space-y-2"><label className="text-[10px] font-black text-gray-400 uppercase">End Date</label><input type="date" className="w-full p-4 bg-gray-50 rounded-2xl font-bold text-xs" onChange={e => setFormData({...formData, schedule: {...formData.schedule!, visitEnd: e.target.value}})} /></div>
             </div>
          </div>
          <button className="w-full mt-10 py-5 bg-emerald-600 text-white font-black rounded-2xl hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-900/10 uppercase tracking-widest" onClick={() => onSavePlan({ ...formData, id: `plan-${Date.now()}` } as AuditPlan)}>Authorize Audit Timeline</button>
       </div>
    </div>
  );
};

const StandardSettings: React.FC<{ standards: Standard[], onSave: (s: Standard[]) => void, currentCycle: string }> = ({ standards, onSave, currentCycle }) => {
  return (
    <div className="space-y-8">
       <div className="flex justify-between items-center bg-white p-8 rounded-[2rem] shadow-xl shadow-emerald-900/5 border border-gray-100">
          <div><h3 className="text-2xl font-black text-gray-900 uppercase tracking-tighter">Configuration Matrix</h3><p className="text-[10px] text-emerald-600 font-black uppercase mt-1">Siklus: {currentCycle}</p></div>
          <button className="bg-emerald-600 text-white px-8 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest" onClick={() => alert('Logic added in next deployment')}>Update Global Standar</button>
       </div>
       {standards.map(s => (
          <div key={s.id} className="bg-white p-8 rounded-[2.5rem] shadow-xl shadow-emerald-900/5 border border-gray-100">
             <div className="flex items-center gap-4 mb-8">
                <span className="bg-emerald-900 text-emerald-400 px-4 py-2 rounded-xl text-[10px] font-black">{s.code}</span>
                <h4 className="font-black text-gray-900 text-lg uppercase tracking-tight">{s.title}</h4>
             </div>
             <div className="space-y-4">
                {s.indicators.map(ind => (
                   <div key={ind.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl group hover:bg-white border-2 border-transparent hover:border-emerald-100 transition-all">
                      <div><p className="font-black text-sm text-gray-900">{ind.name}</p><span className="text-[9px] font-black text-gray-400 uppercase">{ind.subject}</span></div>
                      <div className="text-right"><p className="text-[10px] font-black text-emerald-600 uppercase">Target Cycle</p><span className="font-black text-gray-900">{ind.cycleTargets?.[currentCycle]?.target || ind.target}</span></div>
                   </div>
                ))}
             </div>
          </div>
       ))}
    </div>
  );
};

const Reports: React.FC<{ auditData: AuditEntry[], standards: Standard[], currentCycle: string, currentUser: User }> = ({ auditData, standards, currentCycle }) => {
  const data = auditData.filter(d => d.cycle === currentCycle);
  return (
     <div className="space-y-8">
        <div className="flex justify-between items-center bg-white p-8 rounded-[2rem] shadow-xl shadow-emerald-900/5 border border-gray-100">
           <h3 className="text-2xl font-black text-gray-900 uppercase tracking-tighter">Consolidated Audit Report</h3>
           <button onClick={() => window.print()} className="bg-emerald-900 text-white px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-emerald-800 transition-all"><i className="fas fa-print mr-2"></i> Download as PDF</button>
        </div>
        <div className="bg-white p-10 rounded-[3rem] shadow-xl shadow-emerald-900/5 border border-gray-100 overflow-hidden">
           <table className="w-full text-left">
              <thead className="bg-emerald-900 text-white">
                 <tr>
                    <th className="p-5 text-[10px] font-black uppercase tracking-widest">Indicator</th>
                    <th className="p-5 text-[10px] font-black uppercase tracking-widest">Prodi</th>
                    <th className="p-5 text-[10px] font-black uppercase tracking-widest">Target</th>
                    <th className="p-5 text-[10px] font-black uppercase tracking-widest">Achievement</th>
                    <th className="p-5 text-[10px] font-black uppercase tracking-widest">Verdict</th>
                 </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                 {data.map((entry, idx) => {
                    const indicator = standards.flatMap(s => s.indicators).find(i => i.id === entry.indicatorId);
                    return (
                       <tr key={idx} className="hover:bg-emerald-50/20">
                          <td className="p-5 font-bold text-gray-900 text-sm">{indicator?.name}</td>
                          <td className="p-5 font-black text-gray-500 text-xs">{entry.prodi}</td>
                          <td className="p-5 font-black text-emerald-600 text-xs">{indicator?.target}</td>
                          <td className="p-5 font-black text-gray-900 text-xs">{entry.achievementValue}</td>
                          <td className="p-5"><span className={`px-4 py-1 rounded-full text-[9px] font-black uppercase ${entry.status === AuditStatus.ACHIEVED ? 'bg-emerald-100 text-emerald-600' : 'bg-red-100 text-red-600'}`}>{entry.status}</span></td>
                       </tr>
                    );
                 })}
              </tbody>
           </table>
        </div>
     </div>
  );
};

const UserManagement: React.FC<{ users: User[], onSaveUser: (u: User) => void, onDeleteUser: (id: string) => void, currentUser: User }> = ({ users, onSaveUser, onDeleteUser, currentUser }) => {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [formData, setFormData] = useState<Partial<User>>({ role: UserRole.AUDITEE });

  return (
    <div className="space-y-10">
      <div className="flex justify-between items-center bg-white p-8 rounded-[2rem] shadow-xl shadow-emerald-900/5 border border-gray-100">
         <div>
            <h3 className="text-2xl font-black text-gray-900 uppercase tracking-tighter">Account Management</h3>
            <p className="text-xs font-bold text-gray-400 mt-1 uppercase tracking-widest">Manage access for Auditors and Study Programs</p>
         </div>
         <button onClick={() => { setFormData({ role: UserRole.AUDITEE }); setIsFormOpen(true); }} className="bg-emerald-600 hover:bg-emerald-700 text-white px-8 py-3 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] shadow-lg shadow-emerald-900/10 transition-all active:scale-95">
            Create Account
         </button>
      </div>

      {isFormOpen && (
