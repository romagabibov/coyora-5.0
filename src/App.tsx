import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence, useScroll, useTransform, useInView } from 'motion/react';
import { Instagram, Linkedin, Link2, Send, MessageCircle, X, ArrowUpRight, ArrowLeft, Volume2, VolumeX, ChevronLeft, ChevronRight, Menu } from 'lucide-react';
import Lenis from 'lenis';
import ReactGA from 'react-ga4';
import { useSiteStore, PortfolioData, Project } from './store';
const AdminPanel = React.lazy(() => import('./AdminPanel'));
import HeroTypingText from './HeroTypingText';
import ManifestoTypingText from './ManifestoTypingText';
import { LoadingScreen } from './LoadingScreen';
import { toggleMute, playHover, playClick } from './utils/audio';
import useEmblaCarousel from 'embla-carousel-react';
import { db } from './firebase';
import { collection, onSnapshot, query, orderBy, doc } from 'firebase/firestore';
import { handleFirestoreError, OperationType } from './utils/firestoreErrorHandler';
import ViewResponses from './ViewResponses';

const CustomCursor = () => {
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [isHovering, setIsHovering] = useState(false);

  useEffect(() => {
    const updateMouse = (e: MouseEvent) => setMousePos({ x: e.clientX, y: e.clientY });
    const handleMouseOver = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      setIsHovering(!!target.closest('a, button, [role="button"], .cursor-pointer'));
    };
    window.addEventListener('mousemove', updateMouse);
    window.addEventListener('mouseover', handleMouseOver);
    return () => {
      window.removeEventListener('mousemove', updateMouse);
      window.removeEventListener('mouseover', handleMouseOver);
    };
  }, []);

  return (
    <>
      <motion.div
        className="fixed top-0 left-0 w-1 h-1 rounded-full bg-[#fe0000] pointer-events-none z-[9999] hidden md:block"
        animate={{
          x: mousePos.x - 2,
          y: mousePos.y - 2,
          scale: isHovering ? 0 : 1,
        }}
        transition={{ type: "spring", stiffness: 1000, damping: 40, mass: 0.1 }}
      />
      <motion.div
        className="fixed top-0 left-0 w-4 h-4 rounded-full border border-[#fe0000]/50 pointer-events-none z-[9999] hidden md:block"
        animate={{
          x: mousePos.x - 8,
          y: mousePos.y - 8,
          scale: isHovering ? 1.5 : 1,
          backgroundColor: isHovering ? "rgba(254, 0, 0, 0.1)" : "rgba(254, 0, 0, 0)",
        }}
        transition={{ type: "spring", stiffness: 500, damping: 28, mass: 0.5 }}
      />
    </>
  );
};

const SocialLink = ({ icon, href, label }: { icon: React.ReactNode, href: string, label: string }) => (
  <a href={href} aria-label={label} target="_blank" rel="noopener noreferrer" className="w-12 h-12 rounded-full border border-[var(--color-border)] flex items-center justify-center text-[var(--color-muted)] hover:text-[#fe0000] hover:border-[#fe0000] transition-all duration-300 group bg-[var(--color-surface)] hover:bg-[#fe0000]/10">
    {icon}
  </a>
);

const OpportunityModal = React.lazy(() => import('./components/OpportunityModal').then(module => ({ default: module.OpportunityModal })));
import { Toast } from './components/Toast';
import { useLocation, useNavigate, Routes, Route } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
const StandaloneForm = React.lazy(() => import('./components/StandaloneForm').then(module => ({ default: module.StandaloneForm })));

const ServiceCard = ({ s, i, playHover, playClick, setActiveSection, setActiveProject }: any) => {
  const ref = React.useRef<HTMLDivElement>(null);
  const [isActive, setIsActive] = React.useState(false);
  const timeoutRef = React.useRef<NodeJS.Timeout | null>(null);
  const isActiveRef = React.useRef(false);

  React.useEffect(() => {
    const handleScroll = () => {
      if (!ref.current) return;
      const rect = ref.current.getBoundingClientRect();
      const windowHeight = window.innerHeight;
      
      // Calculate the exact center of the card
      const cardCenter = rect.top + rect.height / 2;
      const screenCenter = windowHeight / 2;
      
      // Define a "sweet spot" in the center of the screen (+/- 15% of screen height)
      // This creates a 30vh active zone. Since cards are 40vh tall, there will be a natural gap between activations.
      const threshold = windowHeight * 0.15; 
      
      const shouldBeActive = Math.abs(cardCenter - screenCenter) < threshold;
      
      if (shouldBeActive && !isActiveRef.current) {
        if (!timeoutRef.current) {
          // Add a small pause before lighting up, as requested
          timeoutRef.current = setTimeout(() => {
            setIsActive(true);
            isActiveRef.current = true;
            timeoutRef.current = null;
          }, 150); 
        }
      } else if (!shouldBeActive) {
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
          timeoutRef.current = null;
        }
        if (isActiveRef.current) {
          setIsActive(false);
          isActiveRef.current = false;
        }
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll(); // Initial check
    
    return () => {
      window.removeEventListener('scroll', handleScroll);
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  return (
    <motion.div 
      ref={ref}
      initial={{ opacity: 0, y: 50 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: false, amount: 0.1 }}
      transition={{ duration: 0.8, delay: i * 0.1, ease: [0.16, 1, 0.3, 1] }}
      onMouseEnter={playHover}
      onClick={() => { playClick(); setActiveSection(s.id); setActiveProject(null); }}
      className={`group p-8 md:p-12 flex flex-col justify-between min-h-[40vh] cursor-pointer transition-colors duration-500 relative overflow-hidden border-r border-b border-[var(--color-border)] ${isActive ? 'max-md:bg-[#fe0000] md:bg-[var(--color-bg)] md:hover:bg-[#fe0000]' : 'bg-[var(--color-bg)] hover:bg-[#fe0000]'}`}
    >
      <div className="flex justify-between items-start relative z-10">
        <span className={`font-mono text-xs tracking-widest transition-colors ${isActive ? 'max-md:text-black/50 md:text-[var(--color-muted)] md:group-hover:text-black/50' : 'text-[var(--color-muted)] group-hover:text-black/50'}`}>0{i+1}</span>
        <ArrowUpRight className={`transition-colors duration-500 transform group-hover:translate-x-1 group-hover:-translate-y-1 ${isActive ? 'max-md:text-black md:text-[var(--color-muted)] md:group-hover:text-black' : 'text-[var(--color-muted)] group-hover:text-black'}`} size={24} strokeWidth={1.5} />
      </div>
      <div className="mt-20 relative z-10">
        <h3 className={`font-head text-2xl md:text-3xl uppercase transition-colors mb-4 tracking-tight ${isActive ? 'max-md:text-black md:text-[var(--color-text)] md:group-hover:text-black' : 'text-[var(--color-text)] group-hover:text-black'}`}>
          {s.title}
        </h3>
        <p className={`text-[10px] md:text-xs font-mono leading-relaxed tracking-wide transition-colors ${isActive ? 'max-md:text-black/80 md:text-[var(--color-muted)] md:group-hover:text-black/80' : 'text-[var(--color-muted)] group-hover:text-black/80'}`}>{s.desc}</p>
      </div>
    </motion.div>
  );
};

function MainApp() {
  const location = useLocation();
  const navigate = useNavigate();
  
  const langs = ['en', 'ru', 'az'] as const;
  const [lang, setLang] = useState<typeof langs[number]>('en');
  const [isAboutOpen, setIsAboutOpen] = useState(false);
  const [activeSection, setActiveSection] = useState<keyof PortfolioData | null>(null);
  const [activeProject, setActiveProject] = useState<Project | null>(null);
  const [activeLab, setActiveLab] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [soundEnabled, setSoundEnabled] = useState(false);
  const [activeOpportunityModal, setActiveOpportunityModal] = useState<'volunteer' | 'vacancy' | 'internship' | null>(null);
  const [toastMessage, setToastMessage] = useState('');
  const [isToastVisible, setIsToastVisible] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const labScrollRef = React.useRef<HTMLDivElement>(null);

  const scrollLab = (direction: 'left' | 'right') => {
    if (labScrollRef.current && labScrollRef.current.firstElementChild) {
      const scrollAmount = labScrollRef.current.firstElementChild.clientWidth;
      labScrollRef.current.scrollBy({ left: direction === 'left' ? -scrollAmount : scrollAmount, behavior: 'smooth' });
    }
  };

  const [infoModal, setInfoModal] = useState<{title: string, content: string} | null>(null);
  const [showAdminPanel, setShowAdminPanel] = useState(() => {
    const params = new URLSearchParams(window.location.search);
    return params.has('admin') || window.location.pathname === '/admin';
  });

  useEffect(() => {
    // Track page view
    ReactGA.send({ hitType: "pageview", page: location.pathname + location.search });

    if (location.pathname === '/volunteer') {
      setActiveOpportunityModal('volunteer');
    } else if (location.pathname === '/vacancies') {
      setActiveOpportunityModal('vacancy');
    } else if (location.pathname === '/internships') {
      setActiveOpportunityModal('internship');
    } else if (location.pathname === '/admin') {
      setShowAdminPanel(true);
    } else {
      setActiveOpportunityModal(null);
    }
  }, [location.pathname]);

  const { theme, setTheme, translations, aboutData, portfolioData, pressData, labData, collaboratorsData, contact } = useSiteStore();
  const t = translations[lang] || translations['en'];
  const translate = (key: string | undefined) => {
    if (!key) return '';
    return t[key] || t[key.trim()] || t[key.toLowerCase().replace(/\s+/g, '_')] || key;
  };

  useEffect(() => {
    // Secret code listener (Keyboard)
    let buffer = '';
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!e.key) return;
      buffer += e.key.toUpperCase();
      if (buffer.length > 9) buffer = buffer.slice(-9);
      if (buffer === 'COYORA123') {
        setShowAdminPanel(true);
        buffer = '';
      }
    };
    window.addEventListener('keydown', handleKeyDown);

    const qFormSchemas = query(collection(db, 'formSchemas'));

    const unsubscribeAbout = onSnapshot(doc(db, 'settings', 'about'), (docSnap) => {
      if (docSnap.exists()) {
        useSiteStore.setState({ aboutData: docSnap.data().data });
      }
    });

    const unsubscribeTranslations = onSnapshot(doc(db, 'settings', 'translations'), (docSnap) => {
      if (docSnap.exists()) {
        useSiteStore.setState({ translations: docSnap.data().data });
      }
    });

    const unsubscribePortfolio = onSnapshot(doc(db, 'settings', 'portfolio'), (docSnap) => {
      if (docSnap.exists()) {
        useSiteStore.setState({ portfolioData: docSnap.data().data });
      }
    });

    const unsubscribePress = onSnapshot(doc(db, 'settings', 'press'), (docSnap) => {
      if (docSnap.exists()) {
        useSiteStore.setState({ pressData: docSnap.data().data });
      }
    });

    const unsubscribeLab = onSnapshot(doc(db, 'settings', 'lab'), (docSnap) => {
      if (docSnap.exists()) {
        useSiteStore.setState({ labData: docSnap.data().data });
      }
    });

    const unsubscribeContact = onSnapshot(doc(db, 'settings', 'contact'), (docSnap) => {
      if (docSnap.exists()) {
        useSiteStore.setState({ contact: docSnap.data().data });
      }
    });

    const unsubscribeCollaborators = onSnapshot(doc(db, 'settings', 'collaborators'), (docSnap) => {
      if (docSnap.exists()) {
        useSiteStore.setState({ collaboratorsData: docSnap.data().data });
      }
    });

    const unsubscribeTheme = onSnapshot(doc(db, 'settings', 'theme'), (docSnap) => {
      if (docSnap.exists()) {
        useSiteStore.setState({ theme: docSnap.data().data });
      }
    });

    const unsubscribeFormSchemas = onSnapshot(qFormSchemas, (snapshot) => {
      const schemas = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as any[];
      schemas.sort((a, b) => (b.createdAt?.toMillis?.() || 0) - (a.createdAt?.toMillis?.() || 0));
      useSiteStore.setState({ formSchemas: schemas });
    }, (error) => {
      try {
        handleFirestoreError(error, OperationType.GET, 'formSchemas');
      } catch (e) {
        console.error("Failed to fetch form schemas:", e);
      }
    });

    const unsubscribeFormConfig = onSnapshot(doc(db, 'settings', 'volunteerForm'), (docSnap) => {
      if (docSnap.exists()) {
        useSiteStore.setState({ volunteerFormConfig: docSnap.data() as any });
      }
    });

    const unsubscribeVacanciesFormConfig = onSnapshot(doc(db, 'settings', 'vacanciesForm'), (docSnap) => {
      if (docSnap.exists()) {
        useSiteStore.setState({ vacanciesFormConfig: docSnap.data() as any });
      }
    });

    const unsubscribeInternshipsFormConfig = onSnapshot(doc(db, 'settings', 'internshipsForm'), (docSnap) => {
      if (docSnap.exists()) {
        useSiteStore.setState({ internshipsFormConfig: docSnap.data() as any });
      }
    });

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      unsubscribeAbout();
      unsubscribeFormSchemas();
      unsubscribeFormConfig();
      unsubscribeVacanciesFormConfig();
      unsubscribeInternshipsFormConfig();
      unsubscribeTranslations();
      unsubscribePortfolio();
      unsubscribePress();
      unsubscribeLab();
      unsubscribeContact();
      unsubscribeCollaborators();
      unsubscribeTheme();
    };
  }, []);

  const handleToggleSound = () => {
    const muted = toggleMute();
    setSoundEnabled(!muted);
  };

  const bgColor = theme === 'dark' ? '#050505' : '#f5f5f5';
  const textColor = theme === 'dark' ? '#f5f5f5' : '#050505';
  const borderColor = theme === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)';
  const mutedColor = theme === 'dark' ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.5)';
  const surfaceColor = theme === 'dark' ? '#0a0a0a' : '#ffffff';

  useEffect(() => {
    const lenis = new Lenis({
      duration: 1.2,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      orientation: 'vertical',
      smoothWheel: true,
    });
    let rafId: number;
    function raf(time: number) { 
      lenis.raf(time); 
      rafId = requestAnimationFrame(raf); 
    }
    rafId = requestAnimationFrame(raf);
    return () => {
      cancelAnimationFrame(rafId);
      lenis.destroy();
    };
  }, []);

  useEffect(() => {
    if (isAboutOpen || activeSection || activeLab || activeOpportunityModal) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [isAboutOpen, activeSection, activeLab, activeOpportunityModal]);

  const toggleLang = () => setLang(prev => langs[(langs.indexOf(prev) + 1) % langs.length]);

  const servicesList = [
    { id: 'fashion' as const, title: t.s_fashion, desc: t.s_fashion_p },
    { id: 'event' as const, title: t.s_event, desc: t.s_event_p },
    { id: 'graphic' as const, title: t.s_graphic, desc: t.s_graphic_p },
    { id: 'web' as const, title: t.s_web, desc: t.s_web_p },
  ];

  const handleContactSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setToastMessage(t.success_contact);
    setIsToastVisible(true);
    (e.target as HTMLFormElement).reset();
  };

  const handleSubscribeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setToastMessage(t.success_subscribe);
    setIsToastVisible(true);
    (e.target as HTMLFormElement).reset();
  };

  return (
    <motion.div 
      style={{ 
        '--color-bg': bgColor, 
        '--color-text': textColor, 
        '--color-border': borderColor,
        '--color-muted': mutedColor,
        '--color-surface': surfaceColor,
        backgroundColor: bgColor,
        color: textColor
      } as any}
      className="relative min-h-[100dvh] font-sans selection:bg-[#fe0000] selection:text-white overflow-x-hidden"
    >
      <Helmet>
        <title>RAMAZAN HABIBOV | COYORA STUDIO</title>
        <meta name="description" content="COYORA Studio - Bridging the gap between physical fashion and digital expression. Fashion, Event, Graphic, and Web design by Ramazan Habibov." />
        <meta name="keywords" content="fashion design, web design, graphic design, event managing, COYORA, creative hub" />
      </Helmet>
      <Toast message={toastMessage} isVisible={isToastVisible} onClose={() => setIsToastVisible(false)} />
      {isLoading && <LoadingScreen onComplete={() => setIsLoading(false)} />}
      <div className="bg-noise" />
      <CustomCursor />

      <React.Suspense fallback={null}>
        {showAdminPanel && <AdminPanel onClose={() => { setShowAdminPanel(false); navigate('/'); }} />}
      </React.Suspense>

      {/* Header */}
      <header className="fixed top-0 w-full p-6 md:p-8 flex justify-between items-center z-40 mix-blend-difference text-white">
        <div className="flex items-center gap-4">
          <img src="https://i.ibb.co/6cFB7Hqz/1.jpg" alt="COYORA Logo" className="h-5 w-auto object-contain" fetchPriority="high" />
          <span className="font-head font-bold text-xs tracking-[0.4em] hidden sm:block uppercase text-white">{translate('COYORA')}</span>
        </div>
        
        <div className="text-[10px] font-mono text-white/60 hidden lg:flex items-center gap-4 tracking-[0.2em]">
          <span>{translate('SYS.VER.2.0.26')}</span>
          <span className="w-1 h-1 rounded-full bg-[#fe0000] animate-pulse" />
          <span className="text-[#fe0000]">{translate('ONLINE')}</span>
        </div>

        <nav className="flex gap-6 md:gap-8 items-center">
          <a href="#services" onMouseEnter={playHover} onClick={playClick} className="text-[10px] uppercase tracking-[0.2em] text-white/60 hover:text-[#fe0000] transition-colors font-mono hidden md:block">[{t.nav_design}]</a>
          <button onClick={() => { playClick(); setIsAboutOpen(true); }} onMouseEnter={playHover} className="text-[10px] uppercase tracking-[0.2em] text-white/60 hover:text-[#fe0000] transition-colors font-mono hidden md:block">[{t.nav_about}]</button>
          <a href="#lab" onMouseEnter={playHover} onClick={playClick} className="text-[10px] uppercase tracking-[0.2em] text-white/60 hover:text-[#fe0000] transition-colors font-mono hidden md:block">[{translate('LAB')}]</a>
          <a href="#press" onMouseEnter={playHover} onClick={playClick} className="text-[10px] uppercase tracking-[0.2em] text-white/60 hover:text-[#fe0000] transition-colors font-mono hidden md:block">[{translate('PRESS')}]</a>
          <a href="#contact" onMouseEnter={playHover} onClick={playClick} className="text-[10px] uppercase tracking-[0.2em] text-white/60 hover:text-[#fe0000] transition-colors font-mono hidden md:block">[{t.nav_contact}]</a>
          <button onClick={() => { playClick(); handleToggleSound(); }} onMouseEnter={playHover} className="text-[10px] uppercase tracking-[0.2em] text-white hover:text-[#fe0000] transition-colors ml-4 font-mono border border-white/20 hover:border-[#fe0000] px-3 py-1 rounded-none flex items-center gap-2">
            {soundEnabled ? <Volume2 size={12} /> : <VolumeX size={12} />}
            {t.sound}
          </button>
          <button onClick={() => { playClick(); toggleLang(); }} onMouseEnter={playHover} className="text-[10px] uppercase tracking-[0.2em] text-white hover:text-[#fe0000] transition-colors ml-2 font-mono border border-white/20 hover:border-[#fe0000] px-3 py-1 rounded-none">
            {lang}
          </button>
          <button onClick={() => { playClick(); setIsMobileMenuOpen(true); }} className="md:hidden text-white hover:text-[#fe0000] transition-colors ml-2">
            <Menu size={24} />
          </button>
        </nav>
      </header>

      {/* Mobile Menu Overlay */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed inset-0 z-50 bg-[#050505] text-white flex flex-col p-6"
          >
            <div className="flex justify-between items-center mb-12">
              <div className="flex items-center gap-4">
                <img src="https://i.ibb.co/6cFB7Hqz/1.jpg" alt="COYORA Logo" className="h-5 w-auto object-contain" />
              </div>
              <button onClick={() => { playClick(); setIsMobileMenuOpen(false); }} className="text-white hover:text-[#fe0000] transition-colors">
                <X size={24} />
              </button>
            </div>
            <div className="flex flex-col gap-8 font-mono text-sm tracking-[0.2em] uppercase">
              <a href="#services" onClick={() => { playClick(); setIsMobileMenuOpen(false); }} className="hover:text-[#fe0000] transition-colors">[{t.nav_design}]</a>
              <button onClick={() => { playClick(); setIsMobileMenuOpen(false); setIsAboutOpen(true); }} className="text-left hover:text-[#fe0000] transition-colors">[{t.nav_about}]</button>
              <a href="#lab" onClick={() => { playClick(); setIsMobileMenuOpen(false); }} className="hover:text-[#fe0000] transition-colors">[{translate('LAB')}]</a>
              <a href="#press" onClick={() => { playClick(); setIsMobileMenuOpen(false); }} className="hover:text-[#fe0000] transition-colors">[{translate('PRESS')}]</a>
              <a href="#contact" onClick={() => { playClick(); setIsMobileMenuOpen(false); }} className="hover:text-[#fe0000] transition-colors">[{t.nav_contact}]</a>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <main>
        {/* Hero Section */}
        <section data-theme="dark" className="h-[100dvh] flex flex-col justify-center px-[4vw] md:px-[8vw] relative overflow-hidden">
          {/* Background Video */}
          <div className="absolute inset-0 z-0">
            <div className="absolute inset-0 bg-[#050505]/80 mix-blend-multiply z-10" />
            <video 
              autoPlay 
              loop 
              muted 
              playsInline 
              className="w-full h-full object-cover opacity-30 grayscale"
            >
              <source src="https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4" type="video/mp4" />
            </video>
          </div>

          {/* Grid lines background for technical feel */}
          <div className="absolute inset-0 bg-[linear-gradient(to_right,var(--color-border)_1px,transparent_1px),linear-gradient(to_bottom,var(--color-border)_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_60%_at_50%_50%,#000_70%,transparent_100%)] pointer-events-none opacity-20 z-0" />
          
          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }} className="relative z-10 w-full flex flex-col items-center text-center mt-12">
            <div className="mb-8 px-4 py-1 border border-[#fe0000]/30 rounded-none bg-[#fe0000]/5 backdrop-blur-md">
              <span className="text-[#fe0000] font-mono text-[10px] tracking-[0.2em] uppercase">
                {t.studio} // {translate('EST. 2026')}
              </span>
            </div>
            <HeroTypingText />
            <p className="mt-12 font-mono text-xs md:text-sm text-[var(--color-muted)] tracking-[0.3em] uppercase max-w-xl mx-auto leading-relaxed">
              {translate('Bridging the gap between physical fashion and digital expression.')}
            </p>
          </motion.div>
        </section>

        {/* Marquee - Minimalist version */}
        <div className="py-4 border-y border-[var(--color-border)] bg-[var(--color-bg)] overflow-hidden">
          <div className="marquee-container">
            <div className="marquee-content font-mono text-[10px] md:text-xs uppercase tracking-[0.3em] text-[var(--color-muted)]">
              <span className="mx-8">{translate('WE BUILD DIGITAL & PHYSICAL EXPERIENCES')}</span>
              <span className="mx-8 text-[#fe0000]">/</span>
              <span className="mx-8">{translate('FASHION')}</span>
              <span className="mx-8 text-[#fe0000]">/</span>
              <span className="mx-8">{translate('EVENT')}</span>
              <span className="mx-8 text-[#fe0000]">/</span>
              <span className="mx-8">{translate('GRAPHIC')}</span>
              <span className="mx-8 text-[#fe0000]">/</span>
              <span className="mx-8">{translate('WEB')}</span>
              <span className="mx-8 text-[#fe0000]">/</span>
              <span className="mx-8">{translate('WE BUILD DIGITAL & PHYSICAL EXPERIENCES')}</span>
              <span className="mx-8 text-[#fe0000]">/</span>
              <span className="mx-8">{translate('FASHION')}</span>
              <span className="mx-8 text-[#fe0000]">/</span>
              <span className="mx-8">{translate('EVENT')}</span>
              <span className="mx-8 text-[#fe0000]">/</span>
              <span className="mx-8">{translate('GRAPHIC')}</span>
              <span className="mx-8 text-[#fe0000]">/</span>
              <span className="mx-8">{translate('WEB')}</span>
              <span className="mx-8 text-[#fe0000]">/</span>
            </div>
          </div>
        </div>

        {/* Services / Futuristic Minimalist Grid */}
        <section id="services" data-theme="light" className="py-[15vh] px-[4vw] md:px-[8vw]">
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: false, amount: 0.2 }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            className="flex justify-between items-end mb-12"
          >
            <h2 className="font-mono text-xs md:text-sm text-[var(--color-muted)] tracking-[0.3em] uppercase">
              {t.core_capabilities}
            </h2>
            <span className="font-mono text-[10px] text-[#fe0000] hidden sm:block">{t.select_module}</span>
          </motion.div>
          
          <div className="grid grid-cols-1 md:grid-cols-4 border-t border-l border-[var(--color-border)]">
            {servicesList.map((s, i) => (
              <ServiceCard 
                key={s.id} 
                s={s} 
                i={i} 
                playHover={playHover} 
                playClick={playClick} 
                setActiveSection={setActiveSection} 
                setActiveProject={setActiveProject} 
              />
            ))}
          </div>
        </section>

        {/* Playground / Lab Section */}
        <section id="lab" data-theme="dark" className="py-[15vh] px-[4vw] md:px-[8vw] border-t border-[var(--color-border)]">
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: false, amount: 0.2 }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            className="flex justify-between items-end mb-12"
          >
            <h2 className="font-mono text-xs md:text-sm text-[var(--color-muted)] tracking-[0.3em] uppercase">
              {t.lab_experiments}
            </h2>
            <div className="flex items-center gap-4">
              <span className="font-mono text-[10px] text-[#fe0000] hidden sm:block">{t.rd_division}</span>
              <motion.div 
                animate={{ x: [0, 10, 0] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="flex items-center gap-2 font-mono text-[10px] text-[var(--color-muted)] md:hidden"
              >
                <span>{lang === 'ru' ? 'Скролльте для изучения' : (lang === 'az' ? 'Kəşf etmək üçün sürüşdürün' : 'Scroll to explore')}</span>
                <ChevronRight size={12} />
              </motion.div>
            </div>
          </motion.div>
          
          <div className="relative group/slider">
            {labData.length > 3 && (
              <>
                <button 
                  onClick={() => scrollLab('left')}
                  aria-label="Scroll left"
                  className="absolute left-4 top-1/2 -translate-y-1/2 z-30 w-12 h-12 hidden lg:flex items-center justify-center bg-black/50 text-white rounded-full opacity-0 group-hover/slider:opacity-100 transition-opacity hover:bg-[#fe0000] border border-[var(--color-border)]"
                >
                  <ChevronLeft size={24} />
                </button>
                <button 
                  onClick={() => scrollLab('right')}
                  aria-label="Scroll right"
                  className="absolute right-4 top-1/2 -translate-y-1/2 z-30 w-12 h-12 hidden lg:flex items-center justify-center bg-black/50 text-white rounded-full opacity-0 group-hover/slider:opacity-100 transition-opacity hover:bg-[#fe0000] border border-[var(--color-border)]"
                >
                  <ChevronRight size={24} />
                </button>
              </>
            )}
            <div 
              ref={labScrollRef}
              className="flex overflow-x-auto snap-x snap-mandatory hide-scrollbar bg-[var(--color-border)] border border-[var(--color-border)]"
            >
              {labData.map((item, idx) => (
                <motion.div 
                  key={item.id}
                  initial={{ opacity: 0, scale: 0.95 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: false, amount: 0.1 }}
                  transition={{ duration: 0.8, delay: idx * 0.1, ease: [0.16, 1, 0.3, 1] }}
                  onClick={() => { playClick(); setActiveLab(item.id); }}
                  className="group relative flex-none w-[85vw] md:w-[50vw] lg:w-[calc(33.333333%)] aspect-square bg-[var(--color-bg)] overflow-hidden cursor-pointer snap-center border-r border-[var(--color-border)] last:border-r-0"
                >
                  <div className="absolute inset-0 bg-[#fe0000]/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500 z-10 mix-blend-overlay" />
                  <img src={item.image} alt={translate(item.title)} className="w-full h-full object-cover grayscale-0 opacity-100 md:grayscale md:opacity-60 md:group-hover:grayscale-0 md:group-hover:opacity-100 md:group-hover:scale-105 transition-all duration-700 transform-gpu will-change-transform" loading="lazy" />
                  <div className="absolute bottom-0 left-0 p-6 z-20 translate-y-0 opacity-100 md:translate-y-4 md:opacity-0 md:group-hover:translate-y-0 md:group-hover:opacity-100 transition-all duration-500 bg-gradient-to-t from-black/80 to-transparent w-full">
                    <p className="font-mono text-[10px] text-[#fe0000] tracking-widest mb-2">EXP_{item.id}</p>
                    <h3 className="font-head text-xl uppercase text-white">{translate(item.title)}</h3>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Press / Media Section */}
        <section id="press" className="py-[15vh] px-[4vw] md:px-[8vw] border-t border-[var(--color-border)]">
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: false, amount: 0.2 }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            className="flex justify-between items-end mb-12"
          >
            <h2 className="font-mono text-xs md:text-sm text-[var(--color-muted)] tracking-[0.3em] uppercase">
              {t.press_media}
            </h2>
            <span className="font-mono text-[10px] text-[#fe0000] hidden sm:block">{t.publications}</span>
          </motion.div>
          
          <div className="flex flex-col border-t border-[var(--color-border)]">
            {pressData.map((item, idx) => (
              <motion.a 
                href={item.link}
                target="_blank"
                rel="noopener noreferrer"
                key={`${item.title}-${idx}`}
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: false, amount: 0.2 }}
                transition={{ duration: 0.6, delay: idx * 0.1, ease: [0.16, 1, 0.3, 1] }}
                className="group flex flex-col md:flex-row justify-between items-start md:items-center py-8 border-b border-[var(--color-border)] hover:bg-[var(--color-surface)] transition-colors px-4"
              >
                <div className="flex items-center gap-8 mb-4 md:mb-0">
                  <span className="font-mono text-xs text-[var(--color-muted)]">{translate(item.year)}</span>
                  <h3 className="font-head text-xl md:text-2xl uppercase group-hover:text-[#fe0000] transition-colors">{translate(item.title)}</h3>
                </div>
                <div className="flex items-center gap-4">
                  <span className="font-mono text-xs tracking-widest uppercase">{translate(item.publication)}</span>
                  <ArrowUpRight size={16} className="text-[var(--color-muted)] group-hover:text-[#fe0000] transition-colors transform group-hover:translate-x-1 group-hover:-translate-y-1" />
                </div>
              </motion.a>
            ))}
          </div>
        </section>

        {/* Manifesto Section */}
        <section id="manifesto" className="py-[20vh] px-[4vw] md:px-[8vw] border-t border-[var(--color-border)] flex items-center justify-center bg-[var(--color-bg)] relative overflow-hidden">
          <div className="absolute inset-0 bg-[linear-gradient(to_right,var(--color-border)_1px,transparent_1px),linear-gradient(to_bottom,var(--color-border)_1px,transparent_1px)] bg-[size:4rem_4rem] pointer-events-none opacity-10" />
          <motion.div 
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: false, amount: 0.3 }}
            transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
            className="max-w-5xl mx-auto text-center relative z-10"
          >
            <h2 className="font-mono text-[10px] text-[#fe0000] tracking-[0.3em] uppercase mb-12">{t.manifesto}</h2>
            <ManifestoTypingText />
          </motion.div>
        </section>

        {/* Collaborators Section */}
        <section id="collaborators" className="py-[10vh] border-t border-[var(--color-border)] bg-[var(--color-bg)] overflow-hidden">
          <div className="flex justify-between items-end mb-12 px-[4vw] md:px-[8vw]">
            <h2 className="font-mono text-xs md:text-sm text-[var(--color-muted)] tracking-[0.3em] uppercase">
              {t.collaborators}
            </h2>
          </div>
          <div className="marquee-container py-8 border-y border-[var(--color-border)]">
            <div className="marquee-content marquee-collaborators font-head text-4xl md:text-6xl uppercase tracking-tighter text-[var(--color-text)]">
              {collaboratorsData && collaboratorsData.map((collab, index) => (
                <React.Fragment key={`collab-1-${index}`}>
                  <a href={collab.url} target="_blank" rel="noopener noreferrer" className="mx-12 hover:text-[#fe0000] transition-colors">
                    {translate(collab.name)}
                  </a>
                  <span className="mx-12 text-[#fe0000]">/</span>
                </React.Fragment>
              ))}
              {collaboratorsData && collaboratorsData.map((collab, index) => (
                <React.Fragment key={`collab-2-${index}`}>
                  <a href={collab.url} target="_blank" rel="noopener noreferrer" className="mx-12 hover:text-[#fe0000] transition-colors">
                    {translate(collab.name)}
                  </a>
                  <span className="mx-12 text-[#fe0000]">/</span>
                </React.Fragment>
              ))}
              {collaboratorsData && collaboratorsData.map((collab, index) => (
                <React.Fragment key={`collab-3-${index}`}>
                  <a href={collab.url} target="_blank" rel="noopener noreferrer" className="mx-12 hover:text-[#fe0000] transition-colors">
                    {translate(collab.name)}
                  </a>
                  <span className="mx-12 text-[#fe0000]">/</span>
                </React.Fragment>
              ))}
              {collaboratorsData && collaboratorsData.map((collab, index) => (
                <React.Fragment key={`collab-4-${index}`}>
                  <a href={collab.url} target="_blank" rel="noopener noreferrer" className="mx-12 hover:text-[#fe0000] transition-colors">
                    {translate(collab.name)}
                  </a>
                  <span className="mx-12 text-[#fe0000]">/</span>
                </React.Fragment>
              ))}
            </div>
          </div>
        </section>

        {/* Contact Section */}
        <section id="contact" className="pt-[15vh] pb-8 px-[4vw] md:px-[8vw] border-t border-[var(--color-border)] relative overflow-hidden bg-[var(--color-bg)]">
          <motion.div 
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: false, amount: 0.2 }}
            transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
            className="max-w-7xl mx-auto relative z-10 flex flex-col items-center text-center"
          >
            <div className="w-px h-24 bg-gradient-to-b from-transparent to-[#fe0000] mb-12" />
            <h2 className="font-mono text-xs md:text-sm tracking-[0.3em] text-[#fe0000] uppercase mb-8">
              {t.initiate_sequence}
            </h2>
            <h3 className="font-head text-4xl md:text-6xl uppercase mb-12 max-w-3xl leading-tight text-[var(--color-text)]">
              {t.lets_talk}
            </h3>
            
            <a 
              href={`mailto:${contact.email}`} 
              className="group relative font-head text-[6vw] md:text-[4vw] leading-none text-[var(--color-muted)] hover:text-[var(--color-text)] transition-colors duration-500 block mb-16 tracking-tighter"
            >
              {contact.email}
              <div className="absolute -bottom-4 left-0 w-0 h-px bg-[#fe0000] group-hover:w-full transition-all duration-700" />
            </a>

            {/* Contact Form */}
            <form action={`https://formspree.io/f/${contact.formspreeId}`} method="POST" className="w-full max-w-2xl text-left mb-24 flex flex-col gap-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <input type="text" name="name" placeholder={t.name} required className="bg-transparent border-b border-[var(--color-border)] py-4 font-mono text-xs tracking-widest focus:outline-none focus:border-[#fe0000] transition-colors text-[var(--color-text)] placeholder:text-[var(--color-muted)]" />
                <input type="email" name="email" placeholder="Email" required className="bg-transparent border-b border-[var(--color-border)] py-4 font-mono text-xs tracking-widest focus:outline-none focus:border-[#fe0000] transition-colors text-[var(--color-text)] placeholder:text-[var(--color-muted)]" />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <input type="tel" name="phone" placeholder="Phone" required className="bg-transparent border-b border-[var(--color-border)] py-4 font-mono text-xs tracking-widest focus:outline-none focus:border-[#fe0000] transition-colors text-[var(--color-text)] placeholder:text-[var(--color-muted)]" />
                <input type="text" name="company" placeholder={t.company} className="bg-transparent border-b border-[var(--color-border)] py-4 font-mono text-xs tracking-widest focus:outline-none focus:border-[#fe0000] transition-colors text-[var(--color-text)] placeholder:text-[var(--color-muted)]" />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <select name="project_type" required defaultValue="" className="bg-transparent border-b border-[var(--color-border)] py-4 font-mono text-xs tracking-widest focus:outline-none focus:border-[#fe0000] transition-colors text-[var(--color-text)] placeholder:text-[var(--color-muted)] appearance-none cursor-pointer">
                  <option value="" disabled className="bg-[var(--color-bg)] text-[var(--color-text)]">{t.project_type}</option>
                  <option value="fashion" className="bg-[var(--color-bg)] text-[var(--color-text)]">Fashion</option>
                  <option value="event" className="bg-[var(--color-bg)] text-[var(--color-text)]">Event</option>
                  <option value="web" className="bg-[var(--color-bg)] text-[var(--color-text)]">Web</option>
                  <option value="graphic" className="bg-[var(--color-bg)] text-[var(--color-text)]">Graphic</option>
                </select>
                <input type="text" name="budget" placeholder={t.budget} className="bg-transparent border-b border-[var(--color-border)] py-4 font-mono text-xs tracking-widest focus:outline-none focus:border-[#fe0000] transition-colors text-[var(--color-text)] placeholder:text-[var(--color-muted)]" />
              </div>
              <textarea name="message" placeholder={t.message} required rows={4} className="bg-transparent border-b border-[var(--color-border)] py-4 font-mono text-xs tracking-widest focus:outline-none focus:border-[#fe0000] transition-colors resize-none text-[var(--color-text)] placeholder:text-[var(--color-muted)]" />
              <input type="text" name="_gotcha" style={{ display: 'none' }} tabIndex={-1} autoComplete="off" />
              <button type="submit" className="self-start px-8 py-4 bg-[#fe0000] text-white font-mono text-xs tracking-[0.2em] uppercase hover:bg-[var(--color-text)] hover:text-[var(--color-bg)] transition-colors duration-500">
                {t.send_inquiry}
              </button>
            </form>

            <div className="flex flex-wrap justify-center gap-4 md:gap-6 pt-12 border-t border-[var(--color-border)] w-full">
              <SocialLink icon={<Instagram size={20} strokeWidth={1.5}/>} label="Instagram" href={contact.instagram} />
              <SocialLink icon={<Linkedin size={20} strokeWidth={1.5}/>} label="LinkedIn" href={contact.linkedin} />
              <SocialLink icon={<Link2 size={20} strokeWidth={1.5}/>} label="Website" href={contact.website} />
              <SocialLink icon={<Send size={20} strokeWidth={1.5}/>} label="Telegram" href={contact.telegram} />
              <SocialLink icon={<MessageCircle size={20} strokeWidth={1.5}/>} label="WhatsApp" href={contact.whatsapp} />
            </div>

            <div className="mt-32 w-full text-[10px] tracking-[0.2em] font-mono uppercase flex flex-col md:flex-row justify-between items-center gap-8">
              <div className="flex flex-col md:flex-row gap-4 items-center w-full md:w-auto">
                <div className="flex flex-row gap-4 items-center text-[var(--color-muted)] opacity-60">
                  <span>{translate('COYORA')} © 2026</span>
                  <span className="text-[#fe0000]">/</span>
                  <span>{translate('BAKU')}</span>
                  <span className="text-[#fe0000]">/</span>
                  <span>{t.working_worldwide}</span>
                </div>
                <div className="hidden md:block w-8"></div>
                <div className="flex flex-row gap-4 items-center mt-4 md:mt-0 text-[var(--color-muted)]">
                  <span className="hidden md:inline text-[#fe0000]">/</span>
                  <button onClick={() => { playClick(); navigate('/vacancies'); }} className="hover:text-[#fe0000] transition-colors">{t.vacancies}</button>
                  <span className="text-[#fe0000]">/</span>
                  <button onClick={() => { playClick(); navigate('/internships'); }} className="hover:text-[#fe0000] transition-colors">{t.internship}</button>
                  <span className="text-[#fe0000]">/</span>
                  <button onClick={() => { playClick(); navigate('/volunteer'); }} className="hover:text-[#fe0000] transition-colors">{t.volunteer}</button>
                </div>
              </div>
              
              <a 
                href="https://maps.app.goo.gl/7FzSPSGuKxnFtD6k8" 
                target="_blank" 
                rel="noopener noreferrer"
                className="group flex flex-col items-center md:items-end gap-3 hover:text-[var(--color-text)] transition-colors mt-8 md:mt-0"
              >
                <div className="w-48 h-24 md:w-64 md:h-32 bg-[var(--color-surface)] border border-[var(--color-border)] overflow-hidden relative">
                  <div className="absolute inset-0 bg-[#fe0000]/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500 z-10 mix-blend-overlay" />
                  <iframe 
                    src="https://maps.google.com/maps?q=40.37931731088697,49.878500417756605&t=&z=15&ie=UTF8&iwloc=&output=embed" 
                    className="w-full h-full border-none grayscale opacity-60 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
                    title="Location Map"
                  />
                </div>
                <span className="flex items-center gap-2">
                  40.3793° N, 49.8785° E <ArrowUpRight size={10} className="text-[#fe0000]" />
                </span>
              </a>
            </div>

          </motion.div>
        </section>
      </main>

      {/* About Modal */}
      <AnimatePresence>
        {isAboutOpen && (
          <motion.div
            data-lenis-prevent="true"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            className="fixed inset-0 bg-[var(--color-bg)] z-50 overflow-y-auto"
          >
            {/* Technical grid background */}
            <div className="absolute inset-0 bg-[linear-gradient(to_right,var(--color-border)_1px,transparent_1px),linear-gradient(to_bottom,var(--color-border)_1px,transparent_1px)] bg-[size:4rem_4rem] pointer-events-none opacity-20" />
            
            <div className="min-h-[100dvh] p-6 md:p-12 flex flex-col relative z-10">
              <div className="flex justify-between items-center mb-16 border-b border-[var(--color-border)] pb-6">
                <span className="font-mono text-[10px] text-[#fe0000] tracking-[0.3em] uppercase">{translate('SYS.INFO')} // {t.nav_about}</span>
                <button onClick={() => setIsAboutOpen(false)} className="flex items-center gap-2 text-[10px] font-mono tracking-[0.2em] uppercase text-[var(--color-muted)] hover:text-[#fe0000] transition-colors group">
                  {t.close}
                </button>
              </div>

              <div className="max-w-7xl mx-auto w-full flex-1 flex flex-col justify-center">
                <div className="flex flex-col md:flex-row gap-12 md:gap-24 items-center">
                  <div className="w-full md:w-2/5 relative group">
                    <div className="absolute -inset-4 border border-[#fe0000]/20 opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
                    <div className="aspect-[3/4] bg-[var(--color-surface)] overflow-hidden border border-[var(--color-border)] relative">
                      <div className="absolute inset-0 bg-[#fe0000]/20 opacity-0 group-hover:opacity-100 transition-opacity duration-700 z-10 mix-blend-overlay" />
                      <img src={aboutData?.image || "https://i.ibb.co/pvwdGxYx/ADY05299.jpg"} alt="About" className="w-full h-full object-cover grayscale-0 opacity-100 md:grayscale md:opacity-70 md:group-hover:opacity-100 md:group-hover:scale-105 transition-all duration-1000 transform-gpu will-change-transform" loading="lazy" />
                    </div>
                    {/* Technical corner markers */}
                    <div className="absolute -top-2 -left-2 w-4 h-4 border-t border-l border-[#fe0000] opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                    <div className="absolute -bottom-2 -right-2 w-4 h-4 border-b border-r border-[#fe0000] opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                  </div>
                  <div className="w-full md:w-3/5">
                    <h2 className="font-head text-4xl md:text-6xl uppercase mb-8 tracking-tighter text-[var(--color-text)]">{t.about_title}<span className="text-[#fe0000]">.</span></h2>
                    <div className="w-12 h-px bg-[#fe0000] mb-8" />
                    <p className="text-sm md:text-base leading-relaxed font-mono text-[var(--color-muted)] tracking-wide mb-12">
                      {t.about_text}
                    </p>

                    {/* Timeline */}
                    <div className="border-t border-[var(--color-border)] pt-12">
                      <div>
                        <h3 className="font-mono text-[10px] tracking-[0.3em] text-[#fe0000] uppercase mb-6">{t.timeline}</h3>
                        <ul className="space-y-4 font-mono text-xs text-[var(--color-muted)]">
                          <li className="flex gap-4"><span className="text-[var(--color-text)]">2026</span> <span>{translate('Coyora Studio launch')}</span></li>
                          <li className="flex gap-4"><span className="text-[var(--color-text)]">2025</span> <span>{translate('Azerbaijan Fashion Week')}</span></li>
                          <li className="flex gap-4"><span className="text-[var(--color-text)]">2024</span> <span>{translate('Grand Prix Azerbaijan Fashion Forwards')}</span></li>
                          <li className="flex gap-4"><span className="text-[var(--color-text)]">2022</span> <span>{translate('Azerbaijan Fashion Week management')}</span></li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Lab Modal */}
      <AnimatePresence>
        {activeLab && (
          <motion.div
            data-lenis-prevent="true"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            className="fixed inset-0 bg-[var(--color-bg)] z-50 overflow-y-auto"
          >
            <div className="absolute inset-0 bg-[linear-gradient(to_right,var(--color-border)_1px,transparent_1px),linear-gradient(to_bottom,var(--color-border)_1px,transparent_1px)] bg-[size:4rem_4rem] pointer-events-none opacity-20" />
            
            <div className="min-h-[100dvh] p-6 md:p-12 flex flex-col relative z-10">
              <div className="flex justify-between items-center mb-16 border-b border-[var(--color-border)] pb-6">
                <span className="font-mono text-[10px] text-[#fe0000] tracking-[0.3em] uppercase">
                  {translate('LAB')} // EXP_{activeLab}
                </span>
                <button onClick={() => setActiveLab(null)} className="flex items-center gap-2 text-[10px] font-mono tracking-[0.2em] uppercase text-[var(--color-muted)] hover:text-[#fe0000] transition-colors">
                  {t.close}
                </button>
              </div>

              <div className="max-w-7xl mx-auto w-full">
                {labData.filter(l => l.id === activeLab).map(lab => (
                  <motion.div key={lab.id} initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}>
                    <div className="flex flex-col md:flex-row gap-12 mb-16">
                      <div className="w-full md:w-1/2">
                        <div className="aspect-square bg-[var(--color-surface)] border border-[var(--color-border)] overflow-hidden relative group">
                          <div className="absolute inset-0 bg-[#fe0000]/20 opacity-0 group-hover:opacity-100 transition-opacity duration-700 z-10 mix-blend-overlay" />
                          <img src={lab.image} alt={translate(lab.title)} className="w-full h-full object-cover grayscale-0 opacity-100 md:grayscale md:opacity-80 md:group-hover:opacity-100 md:group-hover:scale-105 transition-all duration-1000 transform-gpu will-change-transform" loading="lazy" />
                        </div>
                      </div>
                      <div className="w-full md:w-1/2 flex flex-col justify-center">
                        <h2 className="font-head text-4xl md:text-6xl uppercase mb-8 tracking-tighter text-[var(--color-text)]">{translate(lab.title)}<span className="text-[#fe0000]">.</span></h2>
                        <div className="w-12 h-px bg-[#fe0000] mb-8" />
                        <p className="text-sm md:text-base leading-relaxed font-mono text-[var(--color-muted)] tracking-wide mb-12 whitespace-pre-line">
                          {translate(lab.description)}
                        </p>
                        
                        <div className="border-t border-[var(--color-border)] pt-12">
                          <h3 className="font-mono text-[10px] tracking-[0.3em] text-[#fe0000] uppercase mb-6">{t.experiments}</h3>
                          <div className="space-y-8">
                            {lab.experiments.map((exp, idx) => (
                              <div key={`${exp.name}-${idx}`} className="border-l-2 border-[#fe0000] pl-4">
                                <h4 className="font-head text-xl uppercase text-[var(--color-text)] mb-2">{translate(exp.name)}</h4>
                                <p className="font-mono text-xs text-[var(--color-muted)] leading-relaxed">{translate(exp.desc)}</p>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Portfolio Modal */}
      <AnimatePresence>
        {activeSection && (
          <motion.div
            data-lenis-prevent="true"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            className="fixed inset-0 bg-[var(--color-bg)] z-50 overflow-y-auto"
          >
            <div className="absolute inset-0 bg-[linear-gradient(to_right,var(--color-border)_1px,transparent_1px),linear-gradient(to_bottom,var(--color-border)_1px,transparent_1px)] bg-[size:4rem_4rem] pointer-events-none opacity-20" />
            
            <div className="min-h-[100dvh] p-6 md:p-12 flex flex-col relative z-10">
              <div className="flex justify-between items-center mb-16 border-b border-[var(--color-border)] pb-6">
                <div className="flex items-center gap-6">
                  <span className="font-mono text-[10px] text-[#fe0000] tracking-[0.3em] uppercase">
                    {translate('DIR')} // {translate(activeSection.replace('_', ' ')).toUpperCase()}
                  </span>
                  {activeProject && (
                    <button onClick={() => setActiveProject(null)} className="flex items-center gap-2 text-[10px] font-mono tracking-[0.2em] uppercase text-[var(--color-muted)] hover:text-[var(--color-text)] transition-colors">
                      <ArrowLeft size={12} /> [ {t.back_to_projects} ]
                    </button>
                  )}
                </div>
                
                <button onClick={() => { setActiveSection(null); setActiveProject(null); }} className="flex items-center gap-2 text-[10px] font-mono tracking-[0.2em] uppercase text-[var(--color-muted)] hover:text-[#fe0000] transition-colors">
                  {t.close}
                </button>
              </div>

              <div className="max-w-7xl mx-auto w-full">
                {!activeProject ? (
                  <>
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-16 gap-8">
                      <h2 className="font-head text-5xl md:text-7xl uppercase tracking-tighter text-[var(--color-text)]">
                        {translate(activeSection.replace('_', ' '))}<span className="text-[#fe0000]">.</span>
                      </h2>
                      
                      {/* Category Filter */}
                      <div className="flex flex-wrap gap-4 font-mono text-[10px] tracking-[0.2em] uppercase">
                        {Object.keys(portfolioData).map((category) => (
                          <button
                            key={category}
                            onClick={() => { playClick(); setActiveSection(category); }}
                            onMouseEnter={playHover}
                            className={`transition-colors duration-300 ${activeSection === category ? 'text-[#fe0000] border-b border-[#fe0000]' : 'text-[var(--color-muted)] hover:text-[var(--color-text)]'}`}
                          >
                            [ {translate(category.replace('_', ' '))} ]
                          </button>
                        ))}
                      </div>
                    </div>
                    
                    <AnimatePresence mode="wait">
                      <motion.div 
                        key={activeSection}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                        className="flex flex-col border-t border-[var(--color-border)]"
                      >
                        {portfolioData[activeSection].length > 0 ? (
                          portfolioData[activeSection].map((proj, idx) => (
                            <motion.div
                              key={`${proj.name}-${idx}`}
                              initial={{ opacity: 0, x: -20 }}
                              whileInView={{ opacity: 1, x: 0 }}
                              viewport={{ once: false, amount: 0.2 }}
                              transition={{ delay: idx * 0.1, duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                              onClick={() => { playClick(); setActiveProject(proj); }}
                              onMouseEnter={playHover}
                              className="py-8 md:py-12 border-b border-[var(--color-border)] flex justify-between items-center cursor-pointer group hover:bg-[#fe0000] px-6 -mx-6 transition-colors duration-500"
                            >
                              <div className="flex items-center gap-8">
                                <span className="font-mono text-[10px] text-[var(--color-muted)] group-hover:text-black/50 transition-colors">0{idx+1}</span>
                                <span className="font-head text-2xl md:text-4xl uppercase text-[var(--color-muted)] group-hover:text-[var(--color-bg)] transition-colors tracking-tight">{translate(proj.name)}</span>
                              </div>
                              <ArrowUpRight className="text-[var(--color-muted)] group-hover:text-black transition-colors duration-500 transform group-hover:translate-x-2 group-hover:-translate-y-2" size={24} strokeWidth={1.5} />
                            </motion.div>
                          ))
                        ) : (
                          <p className="text-[#fe0000] text-xs font-mono tracking-widest uppercase mt-12">[ {t.coming_soon} ]</p>
                        )}
                      </motion.div>
                    </AnimatePresence>
                  </>
                ) : (
                  <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}>
                    <div className="flex flex-col md:flex-row md:items-end justify-between mb-16 gap-8">
                      <div>
                        <h3 className="font-head text-3xl md:text-5xl tracking-tighter text-[var(--color-text)] mb-4">{translate(activeProject.name)}</h3>
                        <div className="flex gap-4 font-mono text-[10px] tracking-[0.2em] uppercase text-[var(--color-muted)]">
                          {activeProject.year && <span>{translate(activeProject.year)}</span>}
                          {activeProject.year && <span className="text-[#fe0000]">/</span>}
                          <span>{translate(activeSection.replace('_', ' '))}</span>
                        </div>
                      </div>
                      {activeProject.link && (
                        <a 
                          href={activeProject.link} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-3 px-6 py-3 bg-[#fe0000] text-white font-mono text-[10px] uppercase tracking-[0.2em] hover:bg-[var(--color-text)] hover:text-[var(--color-bg)] transition-colors duration-500 group"
                        >
                          {t.visit_site} <ArrowUpRight size={14} className="group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                        </a>
                      )}
                    </div>

                    {(activeProject.concept || activeProject.process || activeProject.credits) && (
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-12 mb-16 border-t border-[var(--color-border)] pt-12">
                        {activeProject.concept && (
                          <div>
                            <h4 className="font-mono text-[10px] tracking-[0.3em] text-[#fe0000] uppercase mb-4">[ {translate('CONCEPT')} ]</h4>
                            <p className="font-mono text-xs text-[var(--color-muted)] leading-relaxed">{translate(activeProject.concept)}</p>
                          </div>
                        )}
                        {activeProject.process && (
                          <div>
                            <h4 className="font-mono text-[10px] tracking-[0.3em] text-[#fe0000] uppercase mb-4">[ {translate('PROCESS')} ]</h4>
                            <p className="font-mono text-xs text-[var(--color-muted)] leading-relaxed">{translate(activeProject.process)}</p>
                          </div>
                        )}
                        {activeProject.credits && (
                          <div>
                            <h4 className="font-mono text-[10px] tracking-[0.3em] text-[#fe0000] uppercase mb-4">[ {translate('CREDITS')} ]</h4>
                            <p className="font-mono text-xs text-[var(--color-muted)] leading-relaxed whitespace-pre-line">{translate(activeProject.credits)}</p>
                          </div>
                        )}
                      </div>
                    )}

                    {activeProject.images && activeSection !== 'web' && (
                      <div className="bg-[var(--color-border)] border border-[var(--color-border)]">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-px">
                          {activeProject.images.map((img, idx) => (
                            <div key={`img-${idx}`} className="w-full min-w-0 overflow-hidden bg-[var(--color-bg)] relative group">
                              <div className="absolute inset-0 bg-[#fe0000]/10 opacity-0 md:group-hover:opacity-100 transition-opacity duration-500 z-10 pointer-events-none mix-blend-overlay" />
                              <img src={img} alt={`${translate(activeProject.name)} - Image ${idx + 1}`} className="w-full h-auto object-cover grayscale-0 opacity-100 md:grayscale md:opacity-80 md:group-hover:grayscale-0 md:group-hover:opacity-100 transition-all duration-700 pointer-events-none" loading="lazy" />
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {activeSection === 'web' && activeProject.link && (
                      <div className="w-full aspect-video bg-[var(--color-border)] border border-[var(--color-border)] relative overflow-hidden group">
                        <div className="absolute inset-0 bg-[#fe0000]/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500 z-10 pointer-events-none mix-blend-overlay" />
                        <iframe 
                          src={activeProject.link} 
                          className="w-full h-full border-none grayscale opacity-80 group-hover:grayscale-0 group-hover:opacity-100 transition-all duration-700 pointer-events-none"
                          title={translate(activeProject.name)}
                          loading="lazy"
                        />
                      </div>
                    )}
                  </motion.div>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      <AnimatePresence>
        {infoModal && (
          <motion.div
            data-lenis-prevent="true"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
            className="fixed inset-0 bg-[var(--color-bg)] z-50 overflow-y-auto flex items-center justify-center p-6"
          >
            <div className="absolute inset-0 bg-[linear-gradient(to_right,var(--color-border)_1px,transparent_1px),linear-gradient(to_bottom,var(--color-border)_1px,transparent_1px)] bg-[size:4rem_4rem] pointer-events-none opacity-20" />
            <div className="bg-[var(--color-surface)] border border-[var(--color-border)] p-8 md:p-12 max-w-2xl w-full relative z-10">
              <div className="flex justify-between items-center mb-8 border-b border-[var(--color-border)] pb-4">
                <span className="font-mono text-[10px] text-[#fe0000] tracking-[0.3em] uppercase">
                  {translate('SYS.INFO')} // {translate(infoModal.title)}
                </span>
                <button onClick={() => setInfoModal(null)} className="flex items-center gap-2 text-[10px] font-mono tracking-[0.2em] uppercase text-[var(--color-muted)] hover:text-[#fe0000] transition-colors">
                  {t.close}
                </button>
              </div>
              <h2 className="font-head text-3xl md:text-5xl uppercase mb-8 tracking-tighter text-[var(--color-text)]">
                {translate(infoModal.title)}<span className="text-[#fe0000]">.</span>
              </h2>
              <p className="font-mono text-sm text-[var(--color-muted)] leading-relaxed whitespace-pre-line">
                {translate(infoModal.content)}
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {activeOpportunityModal && (
          <React.Suspense fallback={null}>
            <OpportunityModal 
              type={activeOpportunityModal} 
              onClose={() => {
                setActiveOpportunityModal(null);
                navigate('/');
              }} 
              lang={lang} 
            />
          </React.Suspense>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

export default function App() {
  return (
    <Routes>
      <Route path="/apply/:type/:schemaId" element={
        <React.Suspense fallback={null}>
          <StandaloneForm />
        </React.Suspense>
      } />
      <Route path="/view-responses/:formId" element={<ViewResponses />} />
      <Route path="*" element={<MainApp />} />
    </Routes>
  );
}
