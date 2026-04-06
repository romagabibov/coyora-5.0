import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Settings, X, Plus, Trash2, RefreshCw, Moon, Sun, Download, Share2, Save } from 'lucide-react';
import { useSiteStore, PortfolioData } from './store';
import { db, auth } from './firebase';
import { collection, getDocs, query, orderBy, addDoc, updateDoc, deleteDoc, doc, serverTimestamp, getDoc, setDoc, where } from 'firebase/firestore';
import { signInWithPopup, GoogleAuthProvider, signOut, onAuthStateChanged } from 'firebase/auth';
import { handleFirestoreError, OperationType } from './utils/firestoreErrorHandler';
import { Toast } from './components/Toast';
import { EventEditor } from './components/EventEditor';

interface AdminPanelProps {
  onClose?: () => void;
}

export default function AdminPanel({ onClose }: AdminPanelProps) {
  const [isOpen, setIsOpen] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [error, setError] = useState('');
  const { theme, setTheme, translations, updateTranslations, portfolioData, updatePortfolio, addProject, removeProject, pressData, updatePress, addPress, removePress, contact, updateContact, formSchemas, addFormSchema, updateFormSchema, removeFormSchema, volunteerFormConfig, updateVolunteerFormConfig, vacanciesFormConfig, updateVacanciesFormConfig, internshipsFormConfig, updateInternshipsFormConfig, reset } = useSiteStore();
  const [activeTab, setActiveTab] = useState<'theme' | 'translations' | 'portfolio' | 'press' | 'contact' | 'forms' | 'applications' | 'capabilities'>('theme');
  const [activeAppTab, setActiveAppTab] = useState<'volunteer' | 'internship' | 'vacancy'>('volunteer');
  const [selectedApplication, setSelectedApplication] = useState<any>(null);
  const [selectedLang, setSelectedLang] = useState('en');
  const [selectedCategory, setSelectedCategory] = useState<keyof PortfolioData>('fashion');
  const [newTranslationKey, setNewTranslationKey] = useState('');
  const [toastMessage, setToastMessage] = useState('');
  const [isToastVisible, setIsToastVisible] = useState(false);
  const [applications, setApplications] = useState<any[]>([]);
  const [loadingApps, setLoadingApps] = useState(false);

  useEffect(() => {
    if (activeTab === 'applications' && isAdmin) {
      setLoadingApps(true);
      getDocs(query(collection(db, 'volunteerApplications'), where('type', '==', activeAppTab)))
        .then(snapshot => {
          const apps = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
          apps.sort((a: any, b: any) => (b.timestamp?.toMillis() || 0) - (a.timestamp?.toMillis() || 0));
          setApplications(apps);
          setLoadingApps(false);
        })
        .catch(err => {
          console.error("Failed to fetch applications:", err);
          setLoadingApps(false);
        });
    }
  }, [activeTab, isAdmin, activeAppTab]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setIsToastVisible(true);
    setTimeout(() => setIsToastVisible(false), 3000);
  };

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('admin') === 'forms') {
      setIsOpen(true);
      setActiveTab('forms');
    }
  }, []);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        if ((user.email === 'vnsbek@gmail.com' || user.email === 'coyoraofficial@gmail.com') && user.emailVerified) {
          setIsAdmin(true);
          setIsAuthenticated(true);
        } else {
          await signOut(auth);
          setIsAuthenticated(false);
          setIsAdmin(false);
          setError('Unauthorized email address.');
        }
      } else {
        setIsAuthenticated(false);
        setIsAdmin(false);
      }
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      if ((result.user.email === 'vnsbek@gmail.com' || result.user.email === 'coyoraofficial@gmail.com') && result.user.emailVerified) {
        setIsAdmin(true);
        setIsAuthenticated(true);
        setError('');
      } else {
        await signOut(auth);
        setIsAuthenticated(false);
        setIsAdmin(false);
        setError('Unauthorized email address.');
      }
    } catch (err: any) {
      console.error("Login error:", err);
      setError(err.message || 'Failed to login');
    }
  };

  const handleLogout = async () => {
    await signOut(auth);
    setIsAuthenticated(false);
  };

  const handleAddTranslationKey = (e: React.FormEvent) => {
    e.preventDefault();
    if (newTranslationKey.trim()) {
      const key = newTranslationKey.trim();
      updateTranslations('en', key, newTranslationKey);
      updateTranslations('ru', key, newTranslationKey);
      updateTranslations('az', key, newTranslationKey);
      setNewTranslationKey('');
      showToast('Translation key added');
    }
  };

  const handleAddProject = () => {
    addProject(selectedCategory, { name: 'New Project', images: [] });
  };

  const handleAddFormSchema = async (category: 'volunteer' | 'internship' | 'vacancy') => {
    try {
      await addDoc(collection(db, 'formSchemas'), {
        category,
        name: `New ${category}`,
        date: 'TBD',
        description: '',
        createdAt: serverTimestamp()
      });
    } catch (err) {
      try {
        handleFirestoreError(err, OperationType.CREATE, 'formSchemas');
      } catch (e: any) {
        setError(JSON.parse(e.message).error || `Failed to add ${category}`);
      }
    }
  };

  const handleLocalUpdateFormSchema = (id: string, field: string, value: any) => {
    const schema = formSchemas.find(e => e.id === id);
    if (schema) {
      updateFormSchema(id, { ...schema, [field]: value });
    }
  };

  const handleSaveFormSchema = async (id: string) => {
    try {
      const schema = formSchemas.find(e => e.id === id);
      if (!schema) return;

      const schemaRef = doc(db, 'formSchemas', id);
      await updateDoc(schemaRef, {
        name: schema.name,
        date: schema.date,
        description: schema.description,
        fields: schema.fields || []
      });
      showToast('Form saved successfully!');
    } catch (err) {
      try {
        handleFirestoreError(err, OperationType.UPDATE, `formSchemas/${id}`);
      } catch (e: any) {
        setError(JSON.parse(e.message).error || "Failed to update form");
      }
    }
  };

  const handleDeleteFormSchema = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'formSchemas', id));
    } catch (err) {
      try {
        handleFirestoreError(err, OperationType.DELETE, `formSchemas/${id}`);
      } catch (e: any) {
        setError(JSON.parse(e.message).error || "Failed to delete form");
      }
    }
  };

  const handleSaveSection = async (section: string, data: any) => {
    try {
      await setDoc(doc(db, 'settings', section), { data }, { merge: true });
      showToast(`${section.charAt(0).toUpperCase() + section.slice(1)} saved successfully!`);
    } catch (err) {
      console.error(`Failed to save ${section}:`, err);
      setError(`Failed to save ${section}`);
    }
  };

  const handleSaveFormConfig = async () => {
    try {
      await setDoc(doc(db, 'settings', 'volunteerForm'), volunteerFormConfig, { merge: true });
      showToast('General Config saved successfully!');
    } catch (err) {
      console.error("Failed to save form config to Firestore:", err);
      setError("Failed to save form config");
    }
  };

  const handleSaveVacanciesFormConfig = async () => {
    try {
      await setDoc(doc(db, 'settings', 'vacanciesForm'), vacanciesFormConfig, { merge: true });
      showToast('Vacancies Config saved successfully!');
    } catch (err) {
      console.error("Failed to save vacancies form config to Firestore:", err);
      setError("Failed to save vacancies form config");
    }
  };

  const handleSaveInternshipsFormConfig = async () => {
    try {
      await setDoc(doc(db, 'settings', 'internshipsForm'), internshipsFormConfig, { merge: true });
      showToast('Internships Config saved successfully!');
    } catch (err) {
      console.error("Failed to save internships form config to Firestore:", err);
      setError("Failed to save internships form config");
    }
  };

  return (
    <>
      <Toast message={toastMessage} isVisible={isToastVisible} onClose={() => setIsToastVisible(false)} />
      <button 
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 w-12 h-12 bg-[#fe0000] text-white rounded-full flex items-center justify-center shadow-lg z-50 hover:scale-110 transition-transform"
      >
        <Settings size={20} />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 z-[100] flex items-center justify-center backdrop-blur-sm"
          >
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white w-full h-full max-w-none max-h-none rounded-none shadow-2xl overflow-hidden flex flex-col text-black border border-gray-200"
            >
              {!isAuthenticated ? (
                <div className="p-12 flex flex-col items-center justify-center min-h-[400px]">
                  <div className="w-full max-w-xs">
                    <div className="flex justify-between items-center mb-8">
                      <h2 className="text-2xl font-bold font-head uppercase">Admin Login</h2>
                      <button onClick={() => { setIsOpen(false); onClose?.(); }} className="text-[#6b7280] hover:text-[#fe0000]">
                        <X size={24} />
                      </button>
                    </div>
                    <form onSubmit={handleLogin} className="flex flex-col gap-4">
                      <p className="text-sm font-mono text-[#6b7280] mb-4">
                        Please sign in with your authorized Google account to access the admin panel.
                      </p>
                      {error && <span className="text-red-500 text-xs font-mono">{error}</span>}
                      <button type="submit" className="w-full bg-[#fe0000] text-white rounded-lg p-3 font-mono uppercase tracking-widest hover:bg-red-700 transition-colors">
                        Sign in with Google
                      </button>
                    </form>
                  </div>
                </div>
              ) : (
                <>
                  <div className="p-6 border-b border-[#e5e7eb] flex justify-between items-center">
                    <h2 className="text-xl font-bold font-head uppercase">Admin Panel</h2>
                    <div className="flex gap-4">
                      <button onClick={handleLogout} className="flex items-center gap-2 text-xs text-[#6b7280] hover:text-[#fe0000] font-mono">
                        Logout
                      </button>
                      <button onClick={reset} className="flex items-center gap-2 text-xs text-red-500 hover:text-red-600 font-mono">
                        <RefreshCw size={14} /> Reset to Default
                      </button>
                      <button onClick={() => { setIsOpen(false); onClose?.(); }} className="text-[#6b7280] hover:text-[#fe0000]">
                        <X size={24} />
                      </button>
                    </div>
                  </div>

                  <div className="flex flex-col md:flex-row flex-1 overflow-hidden">
                    {/* Sidebar */}
                <div className="w-full md:w-48 border-b md:border-b-0 md:border-r border-[#e5e7eb] p-4 flex md:flex-col gap-2 font-mono text-sm overflow-x-auto md:overflow-x-visible whitespace-nowrap">
                  {isAdmin && (
                    <>
                      <button onClick={() => setActiveTab('theme')} className={`text-left px-4 py-2 rounded ${activeTab === 'theme' ? 'bg-[#fe0000] text-white' : 'hover:bg-[#f9fafb]'}`}>Theme</button>
                      <button onClick={() => setActiveTab('capabilities')} className={`text-left px-4 py-2 rounded ${activeTab === 'capabilities' ? 'bg-[#fe0000] text-white' : 'hover:bg-[#f9fafb]'}`}>Core Capabilities</button>
                      <button onClick={() => setActiveTab('translations')} className={`text-left px-4 py-2 rounded ${activeTab === 'translations' ? 'bg-[#fe0000] text-white' : 'hover:bg-[#f9fafb]'}`}>Translations</button>
                      <button onClick={() => setActiveTab('portfolio')} className={`text-left px-4 py-2 rounded ${activeTab === 'portfolio' ? 'bg-[#fe0000] text-white' : 'hover:bg-[#f9fafb]'}`}>Portfolio</button>
                      <button onClick={() => setActiveTab('press')} className={`text-left px-4 py-2 rounded ${activeTab === 'press' ? 'bg-[#fe0000] text-white' : 'hover:bg-[#f9fafb]'}`}>Press & Media</button>
                      <button onClick={() => setActiveTab('contact')} className={`text-left px-4 py-2 rounded ${activeTab === 'contact' ? 'bg-[#fe0000] text-white' : 'hover:bg-[#f9fafb]'}`}>Contact Info</button>
                      <button onClick={() => setActiveTab('forms')} className={`text-left px-4 py-2 rounded ${activeTab === 'forms' ? 'bg-[#fe0000] text-white' : 'hover:bg-[#f9fafb]'}`}>Forms & Events</button>
                      <button onClick={() => setActiveTab('applications')} className={`text-left px-4 py-2 rounded ${activeTab === 'applications' ? 'bg-[#fe0000] text-white' : 'hover:bg-[#f9fafb]'}`}>Applications (CRM)</button>
                    </>
                  )}
                </div>

                {/* Content */}
                <div className="flex-1 p-6 overflow-y-auto" data-lenis-prevent="true">
                  {activeTab === 'theme' && (
                    <div className="space-y-6">
                      <div className="flex justify-between items-center mb-4">
                        <h3 className="text-lg font-bold">Site Theme</h3>
                        <button 
                          onClick={() => handleSaveSection('theme', theme)}
                          className="bg-[#fe0000] text-white px-4 py-1.5 rounded text-sm hover:bg-red-700 transition-colors flex items-center gap-2"
                        >
                          <Save size={16} /> Save Theme
                        </button>
                      </div>
                      <div className="flex gap-4">
                        <button 
                          onClick={() => setTheme('light')}
                          className={`flex-1 p-6 border rounded-xl flex flex-col items-center gap-4 ${theme === 'light' ? 'border-[#fe0000] bg-[#fe0000]/5' : 'border-[#e5e7eb]'}`}
                        >
                          <Sun size={32} />
                          <span className="font-mono">Light Mode</span>
                        </button>
                        <button 
                          onClick={() => setTheme('dark')}
                          className={`flex-1 p-6 border rounded-xl flex flex-col items-center gap-4 ${theme === 'dark' ? 'border-[#fe0000] bg-[#fe0000]/5' : 'border-[#e5e7eb]'}`}
                        >
                          <Moon size={32} />
                          <span className="font-mono">Dark Mode</span>
                        </button>
                      </div>
                    </div>
                  )}

                  {activeTab === 'capabilities' && (
                    <div className="space-y-6">
                      <div className="flex justify-between items-center mb-6">
                        <div className="flex gap-2">
                          {['en', 'ru', 'az'].map(l => (
                            <button key={l} onClick={() => setSelectedLang(l)} className={`px-4 py-1 rounded font-mono uppercase ${selectedLang === l ? 'bg-[#fe0000] text-white' : 'bg-[#f9fafb]'}`}>{l}</button>
                          ))}
                        </div>
                        <button 
                          onClick={() => handleSaveSection('translations', translations)}
                          className="bg-[#fe0000] text-white px-4 py-1.5 rounded text-sm hover:bg-red-700 transition-colors flex items-center gap-2"
                        >
                          <Save size={16} /> Save Capabilities
                        </button>
                      </div>
                      <div className="space-y-8">
                        {['fashion', 'event', 'graphic', 'web'].map(cap => (
                          <div key={cap} className="border border-[#e5e7eb] p-4 rounded-xl space-y-4">
                            <h4 className="font-bold uppercase text-lg">{cap}</h4>
                            <div className="flex flex-col gap-1">
                              <label className="text-xs font-mono text-[#6b7280]">Title</label>
                              <input 
                                type="text"
                                value={translations[selectedLang]?.[`s_${cap}`] || ''}
                                onChange={(e) => updateTranslations(selectedLang, `s_${cap}`, e.target.value)}
                                className="w-full bg-transparent border border-[#e5e7eb] rounded p-2 text-sm"
                              />
                            </div>
                            <div className="flex flex-col gap-1">
                              <label className="text-xs font-mono text-[#6b7280]">Description</label>
                              <textarea 
                                value={translations[selectedLang]?.[`s_${cap}_p`] || ''}
                                onChange={(e) => updateTranslations(selectedLang, `s_${cap}_p`, e.target.value)}
                                className="w-full bg-transparent border border-[#e5e7eb] rounded p-2 text-sm min-h-[80px]"
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {activeTab === 'translations' && (
                    <div className="space-y-6">
                      <div className="flex justify-between items-center mb-6">
                        <div className="flex gap-2">
                          {['en', 'ru', 'az'].map(l => (
                            <button key={l} onClick={() => setSelectedLang(l)} className={`px-4 py-1 rounded font-mono uppercase ${selectedLang === l ? 'bg-[#fe0000] text-white' : 'bg-[#f9fafb]'}`}>{l}</button>
                          ))}
                        </div>
                        <div className="flex gap-4 items-center">
                          <form onSubmit={handleAddTranslationKey} className="flex gap-2">
                            <input 
                              type="text"
                              value={newTranslationKey}
                              onChange={(e) => setNewTranslationKey(e.target.value)}
                              placeholder="New translation key"
                              className="bg-transparent border border-[#e5e7eb] rounded p-1.5 text-sm font-mono w-48"
                            />
                            <button type="submit" className="bg-[#f9fafb] border border-[#e5e7eb] px-3 py-1.5 rounded text-sm hover:bg-[#fe0000] hover:text-white transition-colors">
                              Add Key
                            </button>
                          </form>
                          <button 
                            onClick={() => handleSaveSection('translations', translations)}
                            className="bg-[#fe0000] text-white px-4 py-1.5 rounded text-sm hover:bg-red-700 transition-colors flex items-center gap-2"
                          >
                            <Save size={16} /> Save Translations
                          </button>
                        </div>
                      </div>
                      <div className="space-y-4">
                        {Object.entries(translations[selectedLang]).map(([key, value]) => (
                          <div key={key} className="flex flex-col gap-1">
                            <label className="text-xs font-mono text-[#6b7280]">{key}</label>
                            {typeof value === 'string' && value.length > 50 ? (
                              <textarea 
                                value={value as string}
                                onChange={(e) => updateTranslations(selectedLang, key, e.target.value)}
                                className="w-full bg-transparent border border-[#e5e7eb] rounded p-2 text-sm min-h-[100px]"
                              />
                            ) : (
                              <input 
                                type="text"
                                value={value as string}
                                onChange={(e) => updateTranslations(selectedLang, key, e.target.value)}
                                className="w-full bg-transparent border border-[#e5e7eb] rounded p-2 text-sm"
                              />
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {activeTab === 'portfolio' && (
                    <div className="space-y-6">
                      <div className="flex justify-between items-center mb-6">
                        <div className="flex gap-2">
                          {(['fashion', 'event', 'graphic', 'web'] as const).map(c => (
                            <button key={c} onClick={() => setSelectedCategory(c)} className={`px-4 py-1 rounded font-mono uppercase ${selectedCategory === c ? 'bg-[#fe0000] text-white' : 'bg-[#f9fafb]'}`}>{c}</button>
                          ))}
                        </div>
                        <button 
                          onClick={() => handleSaveSection('portfolio', portfolioData)}
                          className="bg-[#fe0000] text-white px-4 py-1.5 rounded text-sm hover:bg-red-700 transition-colors flex items-center gap-2"
                        >
                          <Save size={16} /> Save Portfolio
                        </button>
                      </div>
                      
                      <div className="space-y-8">
                        {portfolioData[selectedCategory].map((project, idx) => (
                          <div key={idx} className="border border-[#e5e7eb] p-4 rounded-xl relative">
                            <button onClick={() => removeProject(selectedCategory, idx)} className="absolute top-4 right-4 text-red-500 hover:text-red-600"><Trash2 size={16} /></button>
                            <div className="space-y-4">
                              <div>
                                <label className="text-xs font-mono text-[#6b7280]">Project Name</label>
                                <input 
                                  type="text"
                                  value={project.name}
                                  onChange={(e) => updatePortfolio(selectedCategory, idx, { ...project, name: e.target.value })}
                                  className="w-full bg-transparent border border-[#e5e7eb] rounded p-2 text-sm mt-1"
                                />
                              </div>
                              <div>
                                <label className="text-xs font-mono text-[#6b7280]">Link (Optional)</label>
                                <input 
                                  type="text"
                                  value={project.link || ''}
                                  onChange={(e) => updatePortfolio(selectedCategory, idx, { ...project, link: e.target.value })}
                                  className="w-full bg-transparent border border-[#e5e7eb] rounded p-2 text-sm mt-1"
                                />
                              </div>
                              <div>
                                <label className="text-xs font-mono text-[#6b7280]">Images (Comma separated URLs)</label>
                                <textarea 
                                  value={project.images?.join(',\n') || ''}
                                  onChange={(e) => updatePortfolio(selectedCategory, idx, { ...project, images: e.target.value.split(',').map(s => s.trim()).filter(Boolean) })}
                                  className="w-full bg-transparent border border-[#e5e7eb] rounded p-2 text-sm mt-1 min-h-[80px]"
                                />
                              </div>
                            </div>
                          </div>
                        ))}
                        <button onClick={handleAddProject} className="w-full py-4 border-2 border-dashed border-[#e5e7eb] rounded-xl flex items-center justify-center gap-2 text-[#6b7280] hover:text-[#fe0000] hover:border-[#fe0000] transition-colors">
                          <Plus size={20} /> Add Project
                        </button>
                      </div>
                    </div>
                  )}

                  {activeTab === 'press' && (
                    <div className="space-y-6">
                      <div className="flex justify-between items-center mb-6">
                        <h3 className="text-lg font-bold">Press & Media</h3>
                        <button 
                          onClick={() => handleSaveSection('press', pressData)}
                          className="bg-[#fe0000] text-white px-4 py-1.5 rounded text-sm hover:bg-red-700 transition-colors flex items-center gap-2"
                        >
                          <Save size={16} /> Save Press
                        </button>
                      </div>
                      <div className="space-y-8">
                        {pressData.map((item, idx) => (
                          <div key={idx} className="border border-[#e5e7eb] p-4 rounded-xl relative">
                            <button onClick={() => removePress(idx)} className="absolute top-4 right-4 text-red-500 hover:text-red-600"><Trash2 size={16} /></button>
                            <div className="space-y-4">
                              <div>
                                <label className="text-xs font-mono text-[#6b7280]">Year</label>
                                <input 
                                  type="text"
                                  value={item.year}
                                  onChange={(e) => updatePress(idx, { ...item, year: e.target.value })}
                                  className="w-full bg-transparent border border-[#e5e7eb] rounded p-2 text-sm mt-1"
                                />
                              </div>
                              <div>
                                <label className="text-xs font-mono text-[#6b7280]">Title</label>
                                <input 
                                  type="text"
                                  value={item.title}
                                  onChange={(e) => updatePress(idx, { ...item, title: e.target.value })}
                                  className="w-full bg-transparent border border-[#e5e7eb] rounded p-2 text-sm mt-1"
                                />
                              </div>
                              <div>
                                <label className="text-xs font-mono text-[#6b7280]">Publication</label>
                                <input 
                                  type="text"
                                  value={item.publication}
                                  onChange={(e) => updatePress(idx, { ...item, publication: e.target.value })}
                                  className="w-full bg-transparent border border-[#e5e7eb] rounded p-2 text-sm mt-1"
                                />
                              </div>
                              <div>
                                <label className="text-xs font-mono text-[#6b7280]">Link</label>
                                <input 
                                  type="text"
                                  value={item.link}
                                  onChange={(e) => updatePress(idx, { ...item, link: e.target.value })}
                                  className="w-full bg-transparent border border-[#e5e7eb] rounded p-2 text-sm mt-1"
                                />
                              </div>
                            </div>
                          </div>
                        ))}
                        <button onClick={() => addPress({ year: '2026', title: 'New Article', publication: 'Magazine', link: '#' })} className="w-full py-4 border-2 border-dashed border-[#e5e7eb] rounded-xl flex items-center justify-center gap-2 text-[#6b7280] hover:text-[#fe0000] hover:border-[#fe0000] transition-colors">
                          <Plus size={20} /> Add Press Item
                        </button>
                      </div>
                    </div>
                  )}

                  {activeTab === 'contact' && (
                    <div className="space-y-6">
                      <div className="flex justify-between items-center mb-6">
                        <h3 className="text-lg font-bold">Contact Info</h3>
                        <button 
                          onClick={() => handleSaveSection('contact', contact)}
                          className="bg-[#fe0000] text-white px-4 py-1.5 rounded text-sm hover:bg-red-700 transition-colors flex items-center gap-2"
                        >
                          <Save size={16} /> Save Contact Info
                        </button>
                      </div>
                      <div className="space-y-4">
                        {Object.entries(contact).map(([key, value]) => (
                          <div key={key} className="flex flex-col gap-1">
                            <label className="text-xs font-mono text-[#6b7280] uppercase">{key}</label>
                            <input 
                              type="text"
                              value={value}
                              onChange={(e) => updateContact(key, e.target.value)}
                              className="w-full bg-transparent border border-[#e5e7eb] rounded p-2 text-sm"
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {activeTab === 'forms' && (
                    <div className="space-y-8">


                      {/* Forms & Events List */}
                      {['volunteer', 'vacancy', 'internship'].map((category) => {
                        const config = category === 'volunteer' ? volunteerFormConfig : category === 'vacancy' ? vacanciesFormConfig : internshipsFormConfig;
                        const updateConfig = category === 'volunteer' ? updateVolunteerFormConfig : category === 'vacancy' ? updateVacanciesFormConfig : updateInternshipsFormConfig;
                        const saveConfig = category === 'volunteer' ? handleSaveFormConfig : category === 'vacancy' ? handleSaveVacanciesFormConfig : handleSaveInternshipsFormConfig;

                        return (
                          <div key={category} className="mt-8 space-y-8">
                            <div className="border border-[#e5e7eb] rounded-lg p-6 bg-[#f9fafb]">
                              <div className="flex justify-between items-center mb-4">
                                <h3 className="text-lg font-bold capitalize">{category === 'vacancy' ? 'Vacancies' : category + 's'} Form Configuration</h3>
                                <p className="text-xs text-[#6b7280] font-mono">
                                  Configure the main title and description for the {category} modal.
                                </p>
                              </div>
                              <div className="space-y-4">
                                <div>
                                  <label className="block text-xs font-mono text-[#6b7280] mb-1 uppercase tracking-wider">Form Title</label>
                                  <input
                                    type="text"
                                    value={config.title}
                                    onChange={(e) => updateConfig({ ...config, title: e.target.value })}
                                    className="w-full bg-transparent border border-[#e5e7eb] rounded px-3 py-2 font-mono text-sm"
                                    placeholder={`e.g. ${category} Application`}
                                  />
                                </div>
                                <div>
                                  <label className="block text-xs font-mono text-[#6b7280] mb-1 uppercase tracking-wider">Form Description</label>
                                  <textarea
                                    value={config.description}
                                    onChange={(e) => updateConfig({ ...config, description: e.target.value })}
                                    className="w-full bg-transparent border border-[#e5e7eb] rounded px-3 py-2 font-mono text-sm min-h-[100px]"
                                    placeholder="e.g. Please fill out this form to apply..."
                                  />
                                </div>
                                <button
                                  onClick={saveConfig}
                                  className="w-full py-3 bg-[#fe0000] text-white font-mono text-xs uppercase tracking-widest rounded hover:bg-red-700 transition-colors mt-4 flex items-center justify-center gap-2"
                                >
                                  <Save size={16} /> Save {category} Config
                                </button>
                              </div>
                            </div>

                            <div>
                              <div className="flex justify-between items-center mb-4">
                                <h3 className="text-lg font-bold capitalize">{category === 'vacancy' ? 'Vacancies' : category + 's'}</h3>
                                <button 
                                  onClick={() => handleAddFormSchema(category as any)}
                                  className="flex items-center gap-2 text-xs bg-[#fe0000] text-white px-3 py-1.5 rounded hover:bg-red-700 transition-colors"
                                >
                                  <Plus size={14} /> Add {category}
                                </button>
                              </div>

                              <div className="space-y-4">
                                {formSchemas.filter(s => s.category === category).map((schema) => (
                                  <EventEditor
                                    key={schema.id}
                                    event={schema}
                                    onUpdate={handleLocalUpdateFormSchema}
                                    onSave={handleSaveFormSchema}
                                    onDelete={handleDeleteFormSchema}
                                  />
                                ))}
                                {formSchemas.filter(s => s.category === category).length === 0 && (
                                  <div className="text-center py-12 text-[#6b7280] font-mono text-sm">
                                    No {category} forms created yet.
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}



                  {activeTab === 'applications' && (
                    <div className="space-y-8">
                      <div className="flex justify-between items-center">
                        <div className="flex gap-2">
                          {(['volunteer', 'internship', 'vacancy'] as const).map(tab => (
                            <button
                              key={tab}
                              onClick={() => setActiveAppTab(tab)}
                              className={`px-4 py-2 rounded font-mono uppercase text-sm ${activeAppTab === tab ? 'bg-[#fe0000] text-white' : 'bg-[#f9fafb] text-black hover:bg-gray-100'}`}
                            >
                              {tab}s
                            </button>
                          ))}
                        </div>
                        <button 
                          onClick={() => {
                            setLoadingApps(true);
                            getDocs(query(collection(db, 'volunteerApplications'), where('type', '==', activeAppTab)))
                              .then(snapshot => {
                                const apps = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                                apps.sort((a: any, b: any) => (b.timestamp?.toMillis() || 0) - (a.timestamp?.toMillis() || 0));
                                setApplications(apps);
                                setLoadingApps(false);
                                showToast('Refreshed applications');
                              })
                              .catch(err => {
                                console.error("Failed to fetch applications:", err);
                                setLoadingApps(false);
                              });
                          }}
                          className="flex items-center gap-2 text-sm text-[#6b7280] hover:text-[#fe0000] transition-colors"
                        >
                          <RefreshCw size={16} className={loadingApps ? "animate-spin" : ""} />
                          Refresh
                        </button>
                      </div>

                      <div className="bg-[#f9fafb] border border-[#e5e7eb] rounded-lg overflow-hidden">
                        <div className="overflow-x-auto">
                          <table className="w-full text-left text-sm font-mono">
                            <thead className="bg-[#ffffff] border-b border-[#e5e7eb]">
                              <tr>
                                <th className="px-4 py-3 font-semibold">Date</th>
                                <th className="px-4 py-3 font-semibold">Type</th>
                                <th className="px-4 py-3 font-semibold">Event</th>
                                <th className="px-4 py-3 font-semibold">Submitter</th>
                                <th className="px-4 py-3 font-semibold text-right">Actions</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-[#e5e7eb]">
                              {loadingApps ? (
                                <tr>
                                  <td colSpan={5} className="px-4 py-8 text-center text-[#6b7280]">
                                    Loading applications...
                                  </td>
                                </tr>
                              ) : applications.length === 0 ? (
                                <tr>
                                  <td colSpan={5} className="px-4 py-8 text-center text-[#6b7280]">
                                    No applications found.
                                  </td>
                                </tr>
                              ) : (
                                applications.map((app) => {
                                  // Try to find a name or email field
                                  const submitter = app.formData?.name || app.formData?.['Full Name'] || app.formData?.email || app.formData?.['Email'] || app.name || app.email || 'Unknown';
                                  
                                  return (
                                  <tr key={app.id} className="hover:bg-[#ffffff] transition-colors">
                                    <td className="px-4 py-3 whitespace-nowrap">
                                      {app.timestamp?.toDate ? app.timestamp.toDate().toLocaleDateString() : 'Unknown'}
                                    </td>
                                    <td className="px-4 py-3 capitalize">{app.type || 'volunteer'}</td>
                                    <td className="px-4 py-3">{app.eventName}</td>
                                    <td className="px-4 py-3">{submitter}</td>
                                    <td className="px-4 py-3 text-right">
                                      <button
                                        onClick={() => setSelectedApplication(app)}
                                        className="text-xs bg-[#fe0000] text-white px-3 py-1.5 rounded hover:bg-red-700 transition-colors"
                                      >
                                        View Details
                                      </button>
                                    </td>
                                  </tr>
                                )})
                              )}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </div>
                  )}

                </div>
              </div>
              </>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Application Details Modal */}
      <AnimatePresence>
        {selectedApplication && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-[110] flex items-center justify-center p-4 backdrop-blur-sm"
            onClick={() => setSelectedApplication(null)}
          >
            <motion.div
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.95 }}
              onClick={e => e.stopPropagation()}
              className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[80vh] overflow-y-auto"
            >
              <div className="p-6 border-b border-[#e5e7eb] flex justify-between items-center sticky top-0 bg-white z-10">
                <h3 className="text-xl font-bold font-head">Application Details</h3>
                <button onClick={() => setSelectedApplication(null)} className="text-[#6b7280] hover:text-[#fe0000]">
                  <X size={24} />
                </button>
              </div>
              <div className="p-6 space-y-6 font-mono text-sm">
                <div className="grid grid-cols-2 gap-4 bg-[#f9fafb] p-4 rounded-lg border border-[#e5e7eb]">
                  <div>
                    <span className="text-[#6b7280] text-xs uppercase block mb-1">Date</span>
                    {selectedApplication.timestamp?.toDate ? selectedApplication.timestamp.toDate().toLocaleString() : 'Unknown'}
                  </div>
                  <div>
                    <span className="text-[#6b7280] text-xs uppercase block mb-1">Type</span>
                    <span className="capitalize">{selectedApplication.type || 'volunteer'}</span>
                  </div>
                  <div className="col-span-2">
                    <span className="text-[#6b7280] text-xs uppercase block mb-1">Event / Form</span>
                    {selectedApplication.eventName}
                  </div>
                </div>

                <div className="space-y-4">
                  <h4 className="font-bold border-b border-[#e5e7eb] pb-2">Submitted Data</h4>
                  {selectedApplication.formData ? (
                    Object.entries(selectedApplication.formData).map(([key, value]) => (
                      <div key={key} className="break-words">
                        <span className="text-[#6b7280] text-xs uppercase block mb-1">{key}</span>
                        {typeof value === 'string' && (value.startsWith('http://') || value.startsWith('https://')) ? (
                          <a href={value} target="_blank" rel="noopener noreferrer" className="text-[#fe0000] hover:underline break-all">
                            {value}
                          </a>
                        ) : (
                          <div className="whitespace-pre-wrap bg-[#f9fafb] p-3 rounded border border-[#e5e7eb]">{String(value)}</div>
                        )}
                      </div>
                    ))
                  ) : (
                    <div className="text-[#6b7280] italic">No dynamic form data found.</div>
                  )}
                  
                  {/* Fallback for old flat structure */}
                  {!selectedApplication.formData && (
                    <>
                      {selectedApplication.name && (
                        <div>
                          <span className="text-[#6b7280] text-xs uppercase block mb-1">Name</span>
                          <div className="bg-[#f9fafb] p-3 rounded border border-[#e5e7eb]">{selectedApplication.name}</div>
                        </div>
                      )}
                      {selectedApplication.email && (
                        <div>
                          <span className="text-[#6b7280] text-xs uppercase block mb-1">Email</span>
                          <div className="bg-[#f9fafb] p-3 rounded border border-[#e5e7eb]">{selectedApplication.email}</div>
                        </div>
                      )}
                      {selectedApplication.phone && (
                        <div>
                          <span className="text-[#6b7280] text-xs uppercase block mb-1">Phone</span>
                          <div className="bg-[#f9fafb] p-3 rounded border border-[#e5e7eb]">{selectedApplication.phone}</div>
                        </div>
                      )}
                      {selectedApplication.motivation && (
                        <div>
                          <span className="text-[#6b7280] text-xs uppercase block mb-1">Motivation</span>
                          <div className="whitespace-pre-wrap bg-[#f9fafb] p-3 rounded border border-[#e5e7eb]">{selectedApplication.motivation}</div>
                        </div>
                      )}
                      {selectedApplication.photoUrl && (
                        <div>
                          <span className="text-[#6b7280] text-xs uppercase block mb-1">Photo</span>
                          <a href={selectedApplication.photoUrl} target="_blank" rel="noopener noreferrer" className="text-[#fe0000] hover:underline break-all">
                            {selectedApplication.photoUrl}
                          </a>
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
