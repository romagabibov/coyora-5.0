import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Settings, X, Plus, Trash2, RefreshCw, Moon, Sun, Download, Share2, Save, Link as LinkIcon, ArrowLeft } from 'lucide-react';
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
  const { theme, setTheme, translations, updateTranslations, aboutData, updateAboutData, portfolioData, updatePortfolio, addProject, removeProject, pressData, updatePress, addPress, removePress, labData, updateLab, addLab, removeLab, contact, updateContact, formSchemas, addFormSchema, updateFormSchema, removeFormSchema, volunteerFormConfig, updateVolunteerFormConfig, vacanciesFormConfig, updateVacanciesFormConfig, internshipsFormConfig, updateInternshipsFormConfig, reset, collaboratorsData, updateCollaborators } = useSiteStore();
  const [activeTab, setActiveTab] = useState<'theme' | 'translations' | 'about' | 'portfolio' | 'lab' | 'press' | 'contact' | 'forms' | 'applications' | 'capabilities' | 'collaborators'>('theme');
  const [activeAppTab, setActiveAppTab] = useState<'volunteer' | 'internship' | 'vacancy'>('volunteer');
  const [selectedFormForApps, setSelectedFormForApps] = useState<string | null>(null);
  const [selectedApplication, setSelectedApplication] = useState<any>(null);
  const [selectedLang, setSelectedLang] = useState('en');
  const [selectedCategory, setSelectedCategory] = useState<keyof PortfolioData>('fashion');
  const [newTranslationKey, setNewTranslationKey] = useState('');
  const [toastMessage, setToastMessage] = useState('');
  const [isToastVisible, setIsToastVisible] = useState(false);
  const [applications, setApplications] = useState<any[]>([]);
  const [loadingApps, setLoadingApps] = useState(false);
  const [appSearchQuery, setAppSearchQuery] = useState('');

  useEffect(() => {
    if (activeTab === 'applications' && isAdmin && selectedFormForApps) {
      setLoadingApps(true);
      getDocs(query(collection(db, 'volunteerApplications'), where('eventId', '==', selectedFormForApps)))
        .then(snapshot => {
          const apps = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
          apps.sort((a: any, b: any) => (b.timestamp?.toMillis?.() || 0) - (a.timestamp?.toMillis?.() || 0));
          setApplications(apps);
          setLoadingApps(false);
        })
        .catch(err => {
          console.error("Failed to fetch applications:", err);
          setLoadingApps(false);
        });
    } else if (activeTab === 'applications' && isAdmin && !selectedFormForApps) {
      setApplications([]);
    }
  }, [activeTab, isAdmin, selectedFormForApps]);

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
        fields: schema.fields || [],
        allowedEmails: schema.allowedEmails || []
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
        aria-label="Open Admin Panel"
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
                      <button onClick={() => { setIsOpen(false); onClose?.(); }} aria-label="Close Login" className="text-[#6b7280] hover:text-[#fe0000]">
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
                      <button onClick={() => { setIsOpen(false); onClose?.(); }} aria-label="Close Admin Panel" className="text-[#6b7280] hover:text-[#fe0000]">
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
                      <button onClick={() => setActiveTab('about')} className={`text-left px-4 py-2 rounded ${activeTab === 'about' ? 'bg-[#fe0000] text-white' : 'hover:bg-[#f9fafb]'}`}>About</button>
                      <button onClick={() => setActiveTab('capabilities')} className={`text-left px-4 py-2 rounded ${activeTab === 'capabilities' ? 'bg-[#fe0000] text-white' : 'hover:bg-[#f9fafb]'}`}>Core Capabilities</button>
                      <button onClick={() => setActiveTab('translations')} className={`text-left px-4 py-2 rounded ${activeTab === 'translations' ? 'bg-[#fe0000] text-white' : 'hover:bg-[#f9fafb]'}`}>Translations</button>
                      <button onClick={() => setActiveTab('portfolio')} className={`text-left px-4 py-2 rounded ${activeTab === 'portfolio' ? 'bg-[#fe0000] text-white' : 'hover:bg-[#f9fafb]'}`}>Portfolio</button>
                      <button onClick={() => setActiveTab('lab')} className={`text-left px-4 py-2 rounded ${activeTab === 'lab' ? 'bg-[#fe0000] text-white' : 'hover:bg-[#f9fafb]'}`}>Lab / Experiments</button>
                      <button onClick={() => setActiveTab('press')} className={`text-left px-4 py-2 rounded ${activeTab === 'press' ? 'bg-[#fe0000] text-white' : 'hover:bg-[#f9fafb]'}`}>Press & Media</button>
                      <button onClick={() => setActiveTab('collaborators')} className={`text-left px-4 py-2 rounded ${activeTab === 'collaborators' ? 'bg-[#fe0000] text-white' : 'hover:bg-[#f9fafb]'}`}>Collaborators</button>
                      <button onClick={() => setActiveTab('contact')} className={`text-left px-4 py-2 rounded ${activeTab === 'contact' ? 'bg-[#fe0000] text-white' : 'hover:bg-[#f9fafb]'}`}>Contact Info</button>
                      <button onClick={() => setActiveTab('forms')} className={`text-left px-4 py-2 rounded ${activeTab === 'forms' ? 'bg-[#fe0000] text-white' : 'hover:bg-[#f9fafb]'}`}>Forms & Events</button>
                      <button onClick={() => setActiveTab('applications')} className={`text-left px-4 py-2 rounded ${activeTab === 'applications' ? 'bg-[#fe0000] text-white' : 'hover:bg-[#f9fafb]'}`}>Applications (CRM)</button>
                    </>
                  )}
                </div>

                {/* Content */}
                <div className="flex-1 p-6 overflow-y-auto" data-lenis-prevent="true">
                  {activeTab === 'about' && (
                    <div className="space-y-6">
                      <div className="flex justify-between items-center mb-6">
                        <h3 className="text-lg font-bold">About Section</h3>
                        <div className="flex gap-4">
                          <div className="flex gap-2 bg-[#f9fafb] p-1 rounded">
                            {['en', 'ru', 'az'].map(l => (
                              <button key={l} onClick={() => setSelectedLang(l)} className={`px-4 py-1 rounded font-mono uppercase ${selectedLang === l ? 'bg-[#fe0000] text-white' : 'bg-transparent'}`}>{l}</button>
                            ))}
                          </div>
                          <button 
                            onClick={async () => {
                              try {
                                await setDoc(doc(db, 'settings', 'about'), { data: aboutData }, { merge: true });
                                await setDoc(doc(db, 'settings', 'translations'), { data: translations }, { merge: true });
                                showToast('About section saved successfully!');
                              } catch (err) {
                                console.error('Failed to save about:', err);
                                showToast('Failed to save about section');
                              }
                            }}
                            className="bg-[#fe0000] text-white px-4 py-1.5 rounded text-sm hover:bg-red-700 transition-colors flex items-center gap-2"
                          >
                            <Save size={16} /> Save About
                          </button>
                        </div>
                      </div>
                      
                      <div className="space-y-4 bg-[#f9fafb] p-4 rounded border border-[#e5e7eb]">
                        <div>
                          <label className="block text-xs font-bold mb-1 text-[#6b7280]">Image URL</label>
                          <input 
                            type="text" 
                            value={aboutData?.image || ''} 
                            onChange={(e) => updateAboutData({ ...aboutData, image: e.target.value })}
                            className="w-full bg-white border border-[#e5e7eb] rounded p-2 text-sm"
                            placeholder="https://example.com/image.jpg"
                          />
                          {aboutData?.image && (
                            <img src={aboutData.image} alt="Preview" className="mt-2 h-32 object-cover rounded border border-[#e5e7eb]" />
                          )}
                        </div>
                        
                        <div>
                          <label className="block text-xs font-bold mb-1 text-[#6b7280]">Title ({selectedLang.toUpperCase()})</label>
                          <input 
                            type="text" 
                            value={translations[selectedLang]?.about_title || ''} 
                            onChange={(e) => updateTranslations(selectedLang, 'about_title', e.target.value)}
                            className="w-full bg-white border border-[#e5e7eb] rounded p-2 text-sm"
                            placeholder="e.g. RAMAZAN HABIBOV"
                          />
                        </div>
                        
                        <div>
                          <label className="block text-xs font-bold mb-1 text-[#6b7280]">Description ({selectedLang.toUpperCase()})</label>
                          <textarea 
                            value={translations[selectedLang]?.about_text || ''} 
                            onChange={(e) => updateTranslations(selectedLang, 'about_text', e.target.value)}
                            className="w-full bg-white border border-[#e5e7eb] rounded p-2 text-sm min-h-[150px]"
                            placeholder="Enter description..."
                          />
                        </div>
                      </div>
                    </div>
                  )}

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
                        {Array.from(new Set([
                          ...Object.keys(translations['en'] || {}),
                          ...Object.keys(translations['ru'] || {}),
                          ...Object.keys(translations['az'] || {})
                        ])).sort().map((key) => {
                          const value = translations[selectedLang]?.[key] || '';
                          return (
                          <div key={key} className="flex flex-col gap-1">
                            <label className="text-xs font-mono text-[#6b7280]">{key}</label>
                            {typeof value === 'string' && value.length > 50 ? (
                              <textarea 
                                value={value}
                                onChange={(e) => updateTranslations(selectedLang, key, e.target.value)}
                                className="w-full bg-transparent border border-[#e5e7eb] rounded p-2 text-sm min-h-[100px]"
                              />
                            ) : (
                              <input 
                                type="text"
                                value={value}
                                onChange={(e) => updateTranslations(selectedLang, key, e.target.value)}
                                className="w-full bg-transparent border border-[#e5e7eb] rounded p-2 text-sm"
                              />
                            )}
                          </div>
                        )})}
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
                            <button onClick={() => removeProject(selectedCategory, idx)} aria-label="Remove Project" className="absolute top-4 right-4 text-red-500 hover:text-red-600"><Trash2 size={16} /></button>
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
                              <div>
                                <label className="text-xs font-mono text-[#6b7280]">Concept</label>
                                <textarea 
                                  value={project.concept || ''}
                                  onChange={(e) => updatePortfolio(selectedCategory, idx, { ...project, concept: e.target.value })}
                                  className="w-full bg-transparent border border-[#e5e7eb] rounded p-2 text-sm mt-1 min-h-[80px]"
                                />
                              </div>
                              <div>
                                <label className="text-xs font-mono text-[#6b7280]">Process</label>
                                <textarea 
                                  value={project.process || ''}
                                  onChange={(e) => updatePortfolio(selectedCategory, idx, { ...project, process: e.target.value })}
                                  className="w-full bg-transparent border border-[#e5e7eb] rounded p-2 text-sm mt-1 min-h-[80px]"
                                />
                              </div>
                              <div>
                                <label className="text-xs font-mono text-[#6b7280]">Credits</label>
                                <textarea 
                                  value={project.credits || ''}
                                  onChange={(e) => updatePortfolio(selectedCategory, idx, { ...project, credits: e.target.value })}
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

                  {activeTab === 'lab' && (
                    <div className="space-y-6">
                      <div className="flex justify-between items-center mb-6">
                        <h3 className="text-lg font-bold">Lab / Experiments</h3>
                        <button 
                          onClick={() => handleSaveSection('lab', labData)}
                          className="bg-[#fe0000] text-white px-4 py-1.5 rounded text-sm hover:bg-red-700 transition-colors flex items-center gap-2"
                        >
                          <Save size={16} /> Save Lab
                        </button>
                      </div>
                      
                      <div className="space-y-8">
                        {labData.map((item, idx) => (
                          <div key={idx} className="border border-[#e5e7eb] p-4 rounded-xl relative">
                            <button onClick={() => removeLab(idx)} aria-label="Remove Lab Item" className="absolute top-4 right-4 text-red-500 hover:text-red-600"><Trash2 size={16} /></button>
                            <div className="space-y-4">
                              <div>
                                <label className="text-xs font-mono text-[#6b7280]">Title</label>
                                <input 
                                  type="text"
                                  value={item.title}
                                  onChange={(e) => updateLab(idx, { ...item, title: e.target.value })}
                                  className="w-full bg-transparent border border-[#e5e7eb] rounded p-2 text-sm mt-1"
                                />
                              </div>
                              <div>
                                <label className="text-xs font-mono text-[#6b7280]">Image / Video URL</label>
                                <input 
                                  type="text"
                                  value={item.image}
                                  onChange={(e) => updateLab(idx, { ...item, image: e.target.value })}
                                  className="w-full bg-transparent border border-[#e5e7eb] rounded p-2 text-sm mt-1"
                                />
                              </div>
                              <div>
                                <label className="text-xs font-mono text-[#6b7280]">Description</label>
                                <textarea 
                                  value={item.description}
                                  onChange={(e) => updateLab(idx, { ...item, description: e.target.value })}
                                  className="w-full bg-transparent border border-[#e5e7eb] rounded p-2 text-sm mt-1 min-h-[80px]"
                                />
                              </div>
                              <div>
                                <label className="text-xs font-mono text-[#6b7280]">Experiments (JSON format: [{`{"name": "...", "desc": "..."}`}, ...])</label>
                                <textarea 
                                  value={JSON.stringify(item.experiments, null, 2)}
                                  onChange={(e) => {
                                    try {
                                      const parsed = JSON.parse(e.target.value);
                                      updateLab(idx, { ...item, experiments: parsed });
                                    } catch (err) {
                                      // Ignore invalid JSON while typing
                                    }
                                  }}
                                  className="w-full bg-transparent border border-[#e5e7eb] rounded p-2 text-sm mt-1 min-h-[120px] font-mono"
                                />
                              </div>
                            </div>
                          </div>
                        ))}
                        <button 
                          onClick={() => addLab({ id: Date.now().toString(), title: 'New Lab Item', image: '', description: '', experiments: [] })}
                          className="w-full py-4 border-2 border-dashed border-[#e5e7eb] rounded-xl text-[#6b7280] hover:border-[#fe0000] hover:text-[#fe0000] transition-colors flex items-center justify-center gap-2"
                        >
                          <Plus size={20} /> Add Lab Item
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
                            <button onClick={() => removePress(idx)} aria-label="Remove Press Item" className="absolute top-4 right-4 text-red-500 hover:text-red-600"><Trash2 size={16} /></button>
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

                  {activeTab === 'collaborators' && (
                    <div className="space-y-6">
                      <div className="flex justify-between items-center mb-6">
                        <h3 className="text-lg font-bold">Collaborators</h3>
                        <button 
                          onClick={() => handleSaveSection('collaborators', collaboratorsData)}
                          className="bg-[#fe0000] text-white px-4 py-1.5 rounded text-sm hover:bg-red-700 transition-colors flex items-center gap-2"
                        >
                          <Save size={16} /> Save Collaborators
                        </button>
                      </div>
                      <div className="space-y-8">
                        {collaboratorsData?.map((item, idx) => (
                          <div key={idx} className="border border-[#e5e7eb] p-4 rounded-xl relative">
                            <button onClick={() => {
                              const newCollabs = [...collaboratorsData];
                              newCollabs.splice(idx, 1);
                              updateCollaborators(newCollabs);
                            }} aria-label="Remove Collaborator" className="absolute top-4 right-4 text-red-500 hover:text-red-600"><Trash2 size={16} /></button>
                            <div className="space-y-4">
                              <div>
                                <label className="text-xs font-mono text-[#6b7280]">Name</label>
                                <input 
                                  type="text"
                                  value={item.name}
                                  onChange={(e) => {
                                    const newCollabs = [...collaboratorsData];
                                    newCollabs[idx] = { ...item, name: e.target.value };
                                    updateCollaborators(newCollabs);
                                  }}
                                  className="w-full bg-transparent border border-[#e5e7eb] rounded p-2 text-sm mt-1"
                                />
                              </div>
                              <div>
                                <label className="text-xs font-mono text-[#6b7280]">URL</label>
                                <input 
                                  type="text"
                                  value={item.url}
                                  onChange={(e) => {
                                    const newCollabs = [...collaboratorsData];
                                    newCollabs[idx] = { ...item, url: e.target.value };
                                    updateCollaborators(newCollabs);
                                  }}
                                  className="w-full bg-transparent border border-[#e5e7eb] rounded p-2 text-sm mt-1"
                                />
                              </div>
                            </div>
                          </div>
                        ))}
                        <button onClick={() => updateCollaborators([...(collaboratorsData || []), { name: 'New Collaborator', url: '#' }])} className="w-full py-4 border-2 border-dashed border-[#e5e7eb] rounded-xl flex items-center justify-center gap-2 text-[#6b7280] hover:text-[#fe0000] hover:border-[#fe0000] transition-colors">
                          <Plus size={20} /> Add Collaborator
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
                              onClick={() => {
                                setActiveAppTab(tab);
                                setSelectedFormForApps(null);
                              }}
                              className={`px-4 py-2 rounded font-mono uppercase text-sm ${activeAppTab === tab ? 'bg-[#fe0000] text-white' : 'bg-[#f9fafb] text-black hover:bg-gray-100'}`}
                            >
                              {tab}s
                            </button>
                          ))}
                        </div>
                        {selectedFormForApps && (
                          <button 
                            onClick={() => {
                              setLoadingApps(true);
                              getDocs(query(collection(db, 'volunteerApplications'), where('eventId', '==', selectedFormForApps)))
                                .then(snapshot => {
                                  const apps = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                                  apps.sort((a: any, b: any) => (b.timestamp?.toMillis?.() || 0) - (a.timestamp?.toMillis?.() || 0));
                                  setApplications(apps);
                                  setLoadingApps(false);
                                  showToast('Refreshed applications');
                                })
                                .catch(err => {
                                  console.error("Failed to fetch applications:", err);
                                  setLoadingApps(false);
                                });
                            }}
                            aria-label="Refresh Applications"
                            className="flex items-center gap-2 text-sm text-[#6b7280] hover:text-[#fe0000] transition-colors"
                          >
                            <RefreshCw size={16} className={loadingApps ? "animate-spin" : ""} />
                            Refresh
                          </button>
                        )}
                      </div>

                      {!selectedFormForApps ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                          {formSchemas.filter(s => s.category === activeAppTab).map(schema => (
                            <div key={schema.id} className="bg-white border border-[#e5e7eb] rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow">
                              <h3 className="font-bold text-lg mb-2">{schema.name}</h3>
                              <p className="text-sm text-gray-500 mb-4">{schema.date}</p>
                              <div className="flex justify-between items-center">
                                <button
                                  onClick={() => setSelectedFormForApps(schema.id)}
                                  className="text-sm bg-black text-white px-4 py-2 rounded hover:bg-gray-800 transition-colors"
                                >
                                  View Responses
                                </button>
                                <button
                                  onClick={() => {
                                    const url = `${window.location.origin}/view-responses/${schema.id}`;
                                    navigator.clipboard.writeText(url);
                                    showToast('Shareable link copied!');
                                  }}
                                  className="text-sm text-[#fe0000] hover:underline flex items-center gap-1"
                                >
                                  <LinkIcon size={14} /> Share Link
                                </button>
                              </div>
                            </div>
                          ))}
                          {formSchemas.filter(s => s.category === activeAppTab).length === 0 && (
                            <div className="col-span-full text-center py-12 text-[#6b7280] font-mono text-sm">
                              No {activeAppTab} forms found.
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="space-y-4">
                          <div className="flex justify-between items-center">
                            <button
                              onClick={() => setSelectedFormForApps(null)}
                              className="text-sm text-gray-600 hover:text-black flex items-center gap-1"
                            >
                              <ArrowLeft size={16} /> Back to Forms
                            </button>
                            <input
                              type="text"
                              placeholder="Search applications..."
                              value={appSearchQuery}
                              onChange={(e) => setAppSearchQuery(e.target.value)}
                              className="bg-white border border-[#e5e7eb] rounded px-3 py-1.5 text-sm font-mono w-64"
                            />
                          </div>
                          
                          <div className="bg-[#f9fafb] border border-[#e5e7eb] rounded-lg overflow-hidden">
                            <div className="overflow-x-auto">
                              <table className="w-full text-left text-sm font-mono">
                                <thead className="bg-[#ffffff] border-b border-[#e5e7eb]">
                                  <tr>
                                    <th className="px-4 py-3 font-semibold">Date</th>
                                    <th className="px-4 py-3 font-semibold">Submitter</th>
                                    <th className="px-4 py-3 font-semibold text-right">Actions</th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-[#e5e7eb]">
                                  {loadingApps ? (
                                    <tr>
                                      <td colSpan={3} className="px-4 py-8 text-center text-[#6b7280]">
                                        Loading applications...
                                      </td>
                                    </tr>
                                  ) : applications.length === 0 ? (
                                    <tr>
                                      <td colSpan={3} className="px-4 py-8 text-center text-[#6b7280]">
                                        No applications found for this form.
                                      </td>
                                    </tr>
                                  ) : (
                                    applications
                                      .filter(app => {
                                        if (!appSearchQuery) return true;
                                        const searchLower = appSearchQuery.toLowerCase();
                                        return JSON.stringify(app).toLowerCase().includes(searchLower);
                                      })
                                      .map((app) => {
                                      // Try to find a name or email field
                                      const submitter = app.formData?.name || app.formData?.['Full Name'] || app.formData?.email || app.formData?.['Email'] || app.name || app.email || 'Unknown';
                                      
                                      return (
                                      <tr key={app.id} className="hover:bg-[#ffffff] transition-colors">
                                        <td className="px-4 py-3 whitespace-nowrap">
                                          {app.timestamp?.toDate ? app.timestamp.toDate().toLocaleDateString() : 'Unknown'}
                                        </td>
                                        <td className="px-4 py-3">{submitter}</td>
                                        <td className="px-4 py-3 text-right">
                                          <button
                                            onClick={() => setSelectedApplication(app)}
                                            className="text-xs bg-[#fe0000] text-white px-3 py-1.5 rounded hover:bg-red-700 transition-colors mr-2"
                                          >
                                            View Details
                                          </button>
                                          <button
                                            onClick={async () => {
                                              if (window.confirm('Are you sure you want to delete this application?')) {
                                                try {
                                                  await deleteDoc(doc(db, 'volunteerApplications', app.id));
                                                  setApplications(apps => apps.filter(a => a.id !== app.id));
                                                  showToast('Application deleted');
                                                } catch (err) {
                                                  console.error('Error deleting application:', err);
                                                  showToast('Failed to delete application');
                                                }
                                              }
                                            }}
                                            className="text-xs bg-red-100 text-red-600 px-3 py-1.5 rounded hover:bg-red-200 transition-colors"
                                          >
                                            Delete
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
              className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col"
            >
              <div className="p-6 border-b border-[#e5e7eb] flex justify-between items-center shrink-0 bg-white z-10 rounded-t-xl">
                <h3 className="text-xl font-bold font-head text-gray-900">Application Details</h3>
                <button onClick={() => setSelectedApplication(null)} aria-label="Close Application Details" className="text-[#6b7280] hover:text-[#fe0000]">
                  <X size={24} />
                </button>
              </div>
              <div className="p-6 space-y-6 font-mono text-sm text-gray-900 overflow-y-auto flex-1 min-h-0">
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
                  <h4 className="font-bold border-b border-[#e5e7eb] pb-2 text-gray-900">Submitted Data</h4>
                  {selectedApplication.formData ? (
                    Object.entries(selectedApplication.formData).map(([key, value]) => (
                      <div key={key} className="break-words">
                        <span className="text-[#6b7280] text-xs uppercase block mb-1">{key}</span>
                        {typeof value === 'string' && (value.startsWith('http://') || value.startsWith('https://')) ? (
                          <a href={value} target="_blank" rel="noopener noreferrer" className="text-[#fe0000] hover:underline break-all">
                            {value}
                          </a>
                        ) : (
                          <div className="whitespace-pre-wrap bg-[#f9fafb] p-3 rounded border border-[#e5e7eb] text-gray-900">{String(value)}</div>
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
