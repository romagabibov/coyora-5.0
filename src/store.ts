import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type Project = { 
  name: string; 
  images?: string[]; 
  link?: string;
  year?: string;
  concept?: string;
  process?: string;
  credits?: string;
  videoPreview?: string;
};
export type PortfolioData = Record<string, Project[]>;

export type PressItem = {
  year: string;
  title: string;
  publication: string;
  link: string;
};

export type LabItem = {
  id: string;
  title: string;
  image: string;
  description: string;
  experiments: { name: string; desc: string }[];
};

export type FormFieldType = 'text' | 'textarea' | 'email' | 'phone' | 'file' | 'dropdown' | 'checkboxes';

export type FormField = {
  id: string;
  type: FormFieldType;
  label: string;
  required: boolean;
  allowedFileTypes?: string[];
  options?: string[]; // For dropdown
};

export type FormSchema = {
  id: string;
  category: 'volunteer' | 'internship' | 'vacancy';
  name: string;
  date: string;
  description: string;
  fields?: FormField[];
  createdAt?: any;
  allowedEmails?: string[];
};

export type VolunteerFormConfig = {
  title: string;
  description: string;
};

export type Collaborator = {
  name: string;
  url: string;
};

export type AboutData = {
  image: string;
};

export type BrandingData = {
  logoUrl: string;
  faviconUrl: string;
  ogImageUrl: string;
};

export type SiteData = {
  theme: 'dark' | 'light';
  branding: BrandingData;
  translations: any;
  aboutData: AboutData;
  portfolioData: PortfolioData;
  pressData: PressItem[];
  labData: LabItem[];
  collaboratorsData: Collaborator[];
  formSchemas: FormSchema[];
  volunteerFormConfig: VolunteerFormConfig;
  vacanciesFormConfig: VolunteerFormConfig;
  internshipsFormConfig: VolunteerFormConfig;
  contact: {
    email: string;
    phone: string;
    address: string;
    instagram: string;
    linkedin: string;
    website: string;
    telegram: string;
    whatsapp: string;
    formspreeId: string;
    footerWebsiteUrl: string;
  };
  setTheme: (theme: 'dark' | 'light') => void;
  updateTranslations: (lang: string, key: string, value: string) => void;
  updatePortfolio: (category: keyof PortfolioData, index: number, project: Project) => void;
  addProject: (category: keyof PortfolioData, project: Project) => void;
  removeProject: (category: keyof PortfolioData, index: number) => void;
  updatePress: (index: number, item: PressItem) => void;
  addPress: (item: PressItem) => void;
  removePress: (index: number) => void;
  updateLab: (index: number, item: LabItem) => void;
  addLab: (item: LabItem) => void;
  removeLab: (index: number) => void;
  updateContact: (key: string, value: string) => void;
  updateBranding: (branding: BrandingData) => void;
  updateCollaborators: (collaborators: Collaborator[]) => void;
  updateAboutData: (data: AboutData) => void;
  addFormSchema: (schema: FormSchema) => void;
  updateFormSchema: (id: string, schema: FormSchema) => void;
  removeFormSchema: (id: string) => void;
  updateVolunteerFormConfig: (config: VolunteerFormConfig) => void;
  updateVacanciesFormConfig: (config: VolunteerFormConfig) => void;
  updateInternshipsFormConfig: (config: VolunteerFormConfig) => void;
  reset: () => void;
};

const defaultTranslations = {
  en: {
    nav_design: "Design", nav_about: "About", nav_contact: "Contact",
    studio: "studio",
    s_fashion: "Fashion", s_fashion_p: "Collection creation & conceptual wear.",
    s_event: "Event", s_event_p: "Immersive spaces & event architecture.",
    s_graphic: "Graphic", s_graphic_p: "Branding & visual communications.",
    s_web: "Web", s_web_p: "Digital experiences & modern interfaces.",
    about_title: "RAMAZAN HABIBOV",
    about_text: "Based in Baku, Ramazan Habibov is a visionary designer bridging the gap between physical fashion and digital expression. Under COYORA studio, he explores new silhouettes, immersive event architectures, and bold graphic identities for the next generation of brands.",
    back_to_projects: "BACK TO PROJECTS",
    coming_soon: "Projects coming soon...",
    lets_talk: "HAVE A COMPLEX PROJECT? LET'S TALK.",
    visit_site: "VISIT LIVE SITE",
    sound: "SOUND",
    light: "LIGHT",
    dark: "DARK",
    core_capabilities: "[ CORE CAPABILITIES ]",
    select_module: "SELECT MODULE",
    lab_experiments: "[ LAB / EXPERIMENTS ]",
    rd_division: "R&D DIVISION",
    press_media: "[ PRESS & MEDIA ]",
    publications: "PUBLICATIONS",
    manifesto: "[ MANIFESTO ]",
    collaborators: "[ COLLABORATORS ]",
    initiate_sequence: "[ INITIATE SEQUENCE ]",
    name: "NAME",
    company: "COMPANY",
    project_type: "PROJECT TYPE",
    budget: "BUDGET",
    message: "MESSAGE",
    send_inquiry: "SEND INQUIRY",
    subscribe_void: "[ SUBSCRIBE TO THE VOID ]",
    enter_email: "ENTER EMAIL",
    join: "JOIN",
    working_worldwide: "WORKING WORLDWIDE",
    vacancies: "VACANCIES",
    internship: "INTERNSHIP",
    vacancies_info: "Information about upcoming vacancies will be posted here.",
    internship_info: "Information about upcoming internships will be posted here.",
    volunteer: "VOLUNTEER",
    close: "[ CLOSE ]",
    timeline: "[ TIMELINE ]",
    experiments: "[ EXPERIMENTS ]",
    success_contact: "Message sent successfully!",
    success_subscribe: "Subscribed successfully!",
    success_copy: "Link copied to clipboard!",
    select_event: "Select an event to participate in",
    no_events: "No events available at the moment.",
    form_not_configured: "The volunteer form has not been configured yet. Please check back later.",
    designed_by: "DESIGNED & DEVELOPED BY COYORA",
    all_rights_reserved: "ALL RIGHTS RESERVED"
  },
  ru: {
    nav_design: "Дизайн", nav_about: "Обо мне", nav_contact: "Контакты",
    studio: "студия",
    s_fashion: "Fashion", s_fashion_p: "Создание коллекций и концептуальной одежды.",
    s_event: "Event", s_event_p: "Иммерсивные пространства и архитектура событий.",
    s_graphic: "Графика", s_graphic_p: "Брендинг и визуальные коммуникации.",
    s_web: "Web", s_web_p: "Цифровые решения и современные интерфейсы.",
    about_title: "РАМАЗАН ГАБИБОВ",
    about_text: "Базирующийся в Баку, Рамазан Габибов — дизайнер-визионер, стирающий границы между физической модой и цифровым самовыражением. В рамках студии COYORA он исследует новые силуэты, иммерсивную архитектуру событий и смелые графические идентичности.",
    back_to_projects: "НАЗАД К ПРОЕКТАМ",
    coming_soon: "Проекты скоро появятся...",
    lets_talk: "ЕСТЬ СЛОЖНЫЙ ПРОЕКТ? ДАВАЙТЕ ОБСУДИМ.",
    visit_site: "ПОСЕТИТЬ САЙТ",
    sound: "ЗВУК",
    light: "СВЕТЛАЯ",
    dark: "ТЕМНАЯ",
    core_capabilities: "[ ОСНОВНЫЕ НАПРАВЛЕНИЯ ]",
    select_module: "ВЫБРАТЬ МОДУЛЬ",
    lab_experiments: "[ ЛАБОРАТОРИЯ / ЭКСПЕРИМЕНТЫ ]",
    rd_division: "ОТДЕЛ R&D",
    press_media: "[ ПРЕССА И МЕДИА ]",
    publications: "ПУБЛИКАЦИИ",
    manifesto: "[ МАНИФЕСТ ]",
    collaborators: "[ СОТРУДНИЧЕСТВО ]",
    initiate_sequence: "[ НАЧАТЬ ПОСЛЕДОВАТЕЛЬНОСТЬ ]",
    name: "ИМЯ",
    company: "КОМПАНИЯ",
    project_type: "ТИП ПРОЕКТА",
    budget: "БЮДЖЕТ",
    message: "СООБЩЕНИЕ",
    send_inquiry: "ОТПРАВИТЬ ЗАПРОС",
    subscribe_void: "[ ПОДПИСАТЬСЯ НА ПУСТОТУ ]",
    enter_email: "ВВЕДИТЕ EMAIL",
    join: "ПРИСОЕДИНИТЬСЯ",
    working_worldwide: "РАБОТАЕМ ПО ВСЕМУ МИРУ",
    vacancies: "ВАКАНСИИ",
    internship: "СТАЖИРОВКА",
    vacancies_info: "Информация о предстоящих вакансиях будет опубликована здесь.",
    internship_info: "Информация о предстоящих стажировках будет опубликована здесь.",
    volunteer: "ВОЛОНТЕРСТВО",
    close: "[ ЗАКРЫТЬ ]",
    timeline: "[ ХРОНОЛОГИЯ ]",
    experiments: "[ ЭКСПЕРИМЕНТЫ ]",
    success_contact: "Сообщение успешно отправлено!",
    success_subscribe: "Успешная подписка!",
    success_copy: "Ссылка скопирована в буфер обмена!",
    select_event: "Выберите мероприятие для участия",
    no_events: "На данный момент нет доступных мероприятий.",
    form_not_configured: "Форма волонтера еще не настроена. Пожалуйста, зайдите позже.",
    designed_by: "ДИЗАЙН И РАЗРАБОТКА COYORA",
    all_rights_reserved: "ВСЕ ПРАВА ЗАЩИЩЕНЫ"
  },
  az: {
    nav_design: "Dizayn", nav_about: "Haqqında", nav_contact: "Əlaqə",
    studio: "studiya",
    s_fashion: "Moda", s_fashion_p: "Kolleksiyaların və konseptual geyimlərin yaradılması.",
    s_event: "Tədbir", s_event_p: "İmmersiv məkanlar və tədbir arxitekturası.",
    s_graphic: "Qrafik", s_graphic_p: "Brendinq və vizual kommunikasiyalar.",
    s_web: "Veb", s_web_p: "Rəqəmsal təcrübələr və müasir interfeyslər.",
    about_title: "RAMAZAN HƏBİBOV",
    about_text: "Bakıda fəaliyyət göstərən Ramazan Həbibov fiziki moda və rəqəmsal ifadə arasındakı fərqi aradan qaldıran vizioner dizaynerdir. COYORA studiyası altında o, yeni siluetlər, immersiv tədbir arxitekturaları və cəsarətli qrafik kimliklər araşdırır.",
    back_to_projects: "LAYİHƏLƏRƏ QAYIT",
    coming_soon: "Layihələr tezliklə...",
    lets_talk: "MÜRƏKKƏB LAYİHƏNİZ VAR? GƏLİN DANIŞAQ.",
    visit_site: "SAYTA KEÇİD",
    sound: "SƏS",
    light: "AÇIQ",
    dark: "TÜND",
    core_capabilities: "[ ƏSAS İSTİQAMƏTLƏR ]",
    select_module: "MODUL SEÇİN",
    lab_experiments: "[ LABORATORİYA / EKSPERİMENTLƏR ]",
    rd_division: "R&D BÖLMƏSİ",
    press_media: "[ MƏTBUAT VƏ MEDİA ]",
    publications: "NƏŞRLƏR",
    manifesto: "[ MANİFEST ]",
    collaborators: "[ ƏMƏKDAŞLAR ]",
    initiate_sequence: "[ ARDICILLIĞI BAŞLAT ]",
    name: "AD",
    company: "ŞİRKƏT",
    project_type: "LAYİHƏ NÖVÜ",
    budget: "BÜDCƏ",
    message: "MESAJ",
    send_inquiry: "SORĞU GÖNDƏR",
    subscribe_void: "[ BOŞLUĞA ABUNƏ OL ]",
    enter_email: "EMAİL DAXİL EDİN",
    join: "QOŞUL",
    working_worldwide: "BÜTÜN DÜNYA ÜZRƏ İŞLƏYİRİK",
    vacancies: "VAKANSİYALAR",
    internship: "TƏCRÜBƏ",
    vacancies_info: "Qarşıdan gələn vakansiyalar haqqında məlumat burada yerləşdiriləcək.",
    internship_info: "Qarşıdan gələn təcrübə proqramları haqqında məlumat burada yerləşdiriləcək.",
    volunteer: "KÖNÜLLÜ",
    close: "[ BAĞLA ]",
    timeline: "[ XRONOLOGİYA ]",
    experiments: "[ EKSPERİMENTLƏR ]",
    success_contact: "Mesaj uğurla göndərildi!",
    success_subscribe: "Uğurla abunə oldunuz!",
    success_copy: "Link mübadilə buferinə kopyalandı!",
    select_event: "İştirak etmək üçün tədbir seçin",
    no_events: "Hazırda heç bir tədbir yoxdur.",
    form_not_configured: "Könüllü forması hələ tənzimlənməyib. Zəhmət olmasa daha sonra yoxlayın.",
    designed_by: "COYORA TƏRƏFİNDƏN DİZAYN VƏ İNKİŞAF ETDİRİLMİŞDİR",
    all_rights_reserved: "BÜTÜN HÜQUQLAR QORUNUR"
  }
};

const defaultPortfolioData: PortfolioData = {
  fashion: [
    { 
      name: "Coyora SS/25 Collection", 
      year: "2025",
      concept: "A futuristic take on traditional silhouettes, blending digital aesthetics with physical craftsmanship.",
      process: "Developed over 6 months using 3D prototyping before physical construction.",
      credits: "Design: Ramazan Habibov\nPhotography: Studio X",
      images: ["https://i.ibb.co/PZdCSq5H/316.png", "https://i.ibb.co/7t5TSskX/385.png"] 
    },
    { 
      name: "Coyora FW/25-26 Collection", 
      year: "2025", 
      concept: "Exploring the dichotomy between warmth and cold, using innovative thermal fabrics.",
      process: "Iterative design process focusing on material behavior in extreme temperatures.",
      credits: "Design: Ramazan Habibov\nStyling: Anna K.",
      images: ["https://i.ibb.co/5g09vLFN/COYORA-fw25-26-2.jpg", "https://i.ibb.co/v6tcZjfZ/COYORA-fw25-26-3-2.jpg", "https://i.ibb.co/gFV3g3NX/38e6090c-c5ac-4e2e-a817-a5a64323ebfe.png", "https://i.ibb.co/4w47SMVJ/COYORA-fw25-26-6.jpg", "https://i.ibb.co/9mMCyGdB/COYORA-fw25-26-7-1.jpg"] 
    },
    { 
      name: "Coyora SS/26 Collection", 
      year: "2026", 
      concept: "A return to nature, utilizing sustainable materials and organic forms.",
      process: "Sourced materials from local artisans and focused on zero-waste pattern making.",
      credits: "Design: Ramazan Habibov\nPhotography: Elena M.",
      images: ["https://i.ibb.co/ycmJ46JY/coyora-ss26-1.jpg", "https://i.ibb.co/35yPmnpQ/0efd0abd-ffcf-4886-adf6-b9f0521aeb7a.jpg", "https://i.ibb.co/Q7SQFrRv/coyora-ss26-2.jpg" , "https://i.ibb.co/cKzxyZhq/COYORA-ORIGINAL4.jpg","https://i.ibb.co/VWXvhXWt/COYORA-ORIGINAL2.jpg", "https://i.ibb.co/JRT0vmsY/COYORA-ORIGINAL1.jpg"] 
    },
  ],
  event: [
    { 
      name: "Azerbaijan Fashion Week", 
      year: "2025",
      concept: "Immersive stage design focusing on light and shadow to highlight the collections.",
      process: "Collaborated with lighting engineers to create dynamic, responsive environments.",
      credits: "Production: Coyora Studio\nLighting: Luma Tech",
      images: ["https://i.ibb.co/Q35mpb6F/poster.jpg", "https://i.ibb.co/PdWfqcf/1764678299540.jpg", "https://i.ibb.co/RkdZvpZj/newspic.jpg", "https://i.ibb.co/rrSZkmM/AFW-Smm-press.webp", "https://i.ibb.co/394qsCcR/17010979274371949978-1200x630.jpg", "https://i.ibb.co/gbW2pRMn/AFW-poster.jpg"] 
    },
    { 
      name: "Azerbaijan Fashion Forward contest", 
      year: "2024",
      concept: "A platform to showcase emerging talent with a minimalist, modern aesthetic.",
      process: "Designed the entire visual identity and spatial layout for the event.",
      credits: "Art Direction: Ramazan Habibov",
      images: ["https://i.ibb.co/ch2tf86S/Whats-App-2023-12-15-17-40-52-37974692.jpg", "https://i.ibb.co/xq9Xc8Br/2.jpg", "https://i.ibb.co/QFfCYWbG/614585ca-1da9-4a5d-bb3a-996b85490cc1.jpg"] 
    },
    { 
      name: "Turkiye Fashion Week", 
      year: "2025",
      concept: "Bridging cultures through fashion, with a stage design inspired by historical motifs.",
      process: "Extensive research into regional architecture to inform the set design.",
      credits: "Set Design: Coyora Studio",
      images: ["https://i.ibb.co/1tnznv1R/fashion-week-turkiye-fwtr-azerbaijan-2025-20251161616148fd0b1d36edb4eb98f2347342e29a317.jpg"] 
    },
    { 
      name: "International Gurama Fest", 
      year: "2023",
      concept: "Celebrating traditional crafts in a contemporary setting.",
      process: "Curated exhibition spaces that allowed for interactive craft demonstrations.",
      credits: "Exhibition Design: Coyora Studio",
      images: ["https://i.ibb.co/277QZWbq/guramafest.jpg"] 
    },
    { 
      name: "Yeriyən Düşüncə", 
      year: "2024",
      concept: "An experimental art exhibition exploring the concept of 'walking thought'.",
      process: "Created a labyrinthine layout to encourage wandering and discovery.",
      credits: "Spatial Design: Ramazan Habibov",
      images: ["https://i.ibb.co/v6tk0q9n/1706269799-1.jpg", "https://i.ibb.co/d0VmNXdS/1713284017.jpg" ] 
    }
  ],
  graphic: [
    { 
      name: "BIG MODEL AGENCY", 
      year: "2024",
      concept: "A bold, typographic identity reflecting the agency's modern approach.",
      process: "Developed a custom typeface and a comprehensive brand guidelines document.",
      credits: "Graphic Design: Coyora Studio",
      images: ["https://i.ibb.co/S4fsjN48/8451.jpg", "https://i.ibb.co/WpR7KCNt/bgmdkids-page-0001.jpg", "https://i.ibb.co/r8Xyvvx/bra-ur-2-page-0001.jpg"] 
    },
    { 
      name: "FELICIA BATUMI", 
      year: "2023",
      concept: "Elegant and sophisticated branding for a luxury real estate project.",
      process: "Focused on high-end print materials and a refined digital presence.",
      credits: "Art Direction: Ramazan Habibov",
      images: ["https://i.ibb.co/w16498Q/0007.jpg", "https://i.ibb.co/cKf8zwzQ/0001.jpg", "https://i.ibb.co/6cWdjt28/0003.jpg"] 
    },
    { 
      name: "PROJECT #1", 
      year: "2024",
      concept: "Experimental poster series exploring generative design techniques.",
      process: "Utilized custom algorithms to generate unique visual patterns.",
      credits: "Design & Code: Coyora Studio",
      images: ["https://i.ibb.co/HTjwnQyf/2.jpg", "https://i.ibb.co/Myw6T7vz/3.jpg", "https://i.ibb.co/KxLDJbSf/4.jpg", "https://i.ibb.co/qMSpVd63/1-1.jpg", "https://i.ibb.co/FbmjXCbC/5.jpg"] 
    },
  ],
  web: [
    { 
      name: "BIG MODEL DATABASE", 
      year: "2024",
      concept: "A comprehensive, easily searchable database for talent management.",
      process: "Built with a focus on performance and intuitive user experience.",
      credits: "Development: Coyora Studio",
      link: "https://bigmodeldatabase.vercel.app/", 
      images: ["https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&q=80&w=1920"] 
    },
    { 
      name: "PLS.AZ", 
      year: "2023",
      concept: "A sleek, modern e-commerce platform for a boutique fashion brand.",
      process: "Integrated seamless payment gateways and dynamic product displays.",
      credits: "Design & Dev: Ramazan Habibov",
      link: "https://pls.az/", 
      images: ["https://images.unsplash.com/photo-1550751827-4bd374c3f58b?auto=format&fit=crop&q=80&w=1920"] 
    },
    { 
      name: "VCONT", 
      year: "2024",
      concept: "A portfolio website for a creative agency, featuring smooth animations.",
      process: "Utilized WebGL for interactive background elements.",
      credits: "Creative Direction: Coyora Studio",
      link: "https://vcont.vercel.app/", 
      images: ["https://images.unsplash.com/photo-1558655146-d09347e92766?auto=format&fit=crop&q=80&w=1920"] 
    }
  ]
};

const defaultContact = {
  email: 'coyoraofficial@gmail.com',
  phone: '+994552739521',
  address: 'Baku, Azerbaijan',
  instagram: 'https://www.instagram.com/_romagabibov_/',
  linkedin: 'https://www.linkedin.com/in/ramazanhabibov/',
  website: 'https://coyoraoriginal.tilda.ws/',
  telegram: 'https://t.me/Romagabibov',
  whatsapp: 'http://wa.me/994552739521',
  formspreeId: 'mqkvzrqw',
  footerWebsiteUrl: 'https://coyoraoriginal.tilda.ws/'
};

const defaultPressData: PressItem[] = [
  { year: '2026', title: 'The Future of Digital Fashion', publication: 'Vogue Tech', link: '#' },
  { year: '2025', title: 'Immersive Event Design Trends', publication: 'Design Week', link: '#' },
  { year: '2025', title: 'Minimalism in Web Experiences', publication: 'Awwwards', link: '#' }
];

const defaultLabData: LabItem[] = [
  {
    id: '001',
    title: 'Generative Study 1',
    image: 'https://picsum.photos/seed/lab1/800/800',
    description: 'Exploring algorithmic patterns in textile design.',
    experiments: [
      { name: 'Noise Algorithms', desc: 'Using Perlin noise to generate organic fabric textures.' },
      { name: 'Parametric Forms', desc: 'Creating 3D printable accessories based on mathematical equations.' }
    ]
  },
  {
    id: '002',
    title: 'Generative Study 2',
    image: 'https://picsum.photos/seed/lab2/800/800',
    description: 'Interactive light installations for immersive spaces.',
    experiments: [
      { name: 'Reactive LED Arrays', desc: 'Programming LEDs to respond to ambient sound frequencies.' },
      { name: 'Shadow Mapping', desc: 'Using projectors to alter the perception of physical architecture.' }
    ]
  },
  {
    id: '003',
    title: 'Generative Study 3',
    image: 'https://picsum.photos/seed/lab3/800/800',
    description: 'Web-based interactive 3D experiences.',
    experiments: [
      { name: 'WebGL Shaders', desc: 'Custom GLSL shaders for real-time visual distortions.' },
      { name: 'Physics Simulations', desc: 'Simulating cloth and soft body dynamics in the browser.' }
    ]
  },
  {
    id: '004',
    title: 'Generative Study 4',
    image: 'https://picsum.photos/seed/lab4/800/800',
    description: 'Experimental typography and kinetic text.',
    experiments: [
      { name: 'Variable Fonts', desc: 'Animating font weight and width based on scroll position.' },
      { name: 'Kinetic Layouts', desc: 'Text that reacts to cursor movement and velocity.' }
    ]
  }
];

const defaultVolunteerFormConfig: VolunteerFormConfig = {
  title: "BECOME A VOLUNTEER",
  description: "Please fill out the form below."
};

const defaultVacanciesFormConfig: VolunteerFormConfig = {
  title: "VACANCIES",
  description: "Information about upcoming vacancies will be posted here."
};

const defaultInternshipsFormConfig: VolunteerFormConfig = {
  title: "INTERNSHIP",
  description: "Information about upcoming internships will be posted here."
};

const defaultCollaboratorsData: Collaborator[] = [
  { name: 'Azerbaijan Fashion Week', url: '#' },
  { name: 'MBFW AZERBAIJAN', url: '#' },
  { name: 'Big Model Agency', url: '#' },
  { name: 'Debet Safety', url: '#' },
  { name: 'VCONT', url: '#' }
];

const defaultAboutData: AboutData = {
  image: 'https://i.ibb.co/pvwdGxYx/ADY05299.jpg'
};

const defaultBrandingData: BrandingData = {
  logoUrl: '',
  faviconUrl: '',
  ogImageUrl: ''
};

export const useSiteStore = create<SiteData>()(
  persist(
    (set) => ({
      theme: 'dark',
      branding: defaultBrandingData,
      translations: defaultTranslations,
      aboutData: defaultAboutData,
      portfolioData: defaultPortfolioData,
      pressData: defaultPressData,
      labData: defaultLabData,
      collaboratorsData: defaultCollaboratorsData,
      formSchemas: [],
      volunteerFormConfig: defaultVolunteerFormConfig,
      vacanciesFormConfig: defaultVacanciesFormConfig,
      internshipsFormConfig: defaultInternshipsFormConfig,
      contact: defaultContact,
      setTheme: (theme) => set({ theme }),
      updateTranslations: (lang, key, value) => set((state) => ({
        translations: {
          ...state.translations,
          [lang]: {
            ...state.translations[lang],
            [key]: value
          }
        }
      })),
      updatePortfolio: (category, index, project) => set((state) => {
        const newCategory = [...state.portfolioData[category]];
        newCategory[index] = project;
        return { portfolioData: { ...state.portfolioData, [category]: newCategory } };
      }),
      addProject: (category, project) => set((state) => ({
        portfolioData: {
          ...state.portfolioData,
          [category]: [...state.portfolioData[category], project]
        }
      })),
      removeProject: (category, index) => set((state) => {
        const newCategory = [...state.portfolioData[category]];
        newCategory.splice(index, 1);
        return { portfolioData: { ...state.portfolioData, [category]: newCategory } };
      }),
      updatePress: (index, item) => set((state) => {
        const newPress = [...state.pressData];
        newPress[index] = item;
        return { pressData: newPress };
      }),
      addPress: (item) => set((state) => ({
        pressData: [...state.pressData, item]
      })),
      removePress: (index) => set((state) => {
        const newPress = [...state.pressData];
        newPress.splice(index, 1);
        return { pressData: newPress };
      }),
      updateLab: (index, item) => set((state) => {
        const newLab = [...state.labData];
        newLab[index] = item;
        return { labData: newLab };
      }),
      addLab: (item) => set((state) => ({
        labData: [...state.labData, item]
      })),
      removeLab: (index) => set((state) => {
        const newLab = [...state.labData];
        newLab.splice(index, 1);
        return { labData: newLab };
      }),
      updateContact: (key, value) => set((state) => ({
        contact: { ...state.contact, [key]: value }
      })),
      updateBranding: (branding) => set({ branding }),
      updateCollaborators: (collaborators) => set({ collaboratorsData: collaborators }),
      updateAboutData: (data) => set({ aboutData: data }),
      addFormSchema: (schema) => set((state) => ({
        formSchemas: [...state.formSchemas, schema]
      })),
      updateFormSchema: (id, schema) => set((state) => ({
        formSchemas: state.formSchemas.map(s => s.id === id ? schema : s)
      })),
      removeFormSchema: (id) => set((state) => ({
        formSchemas: state.formSchemas.filter(s => s.id !== id)
      })),
      updateVolunteerFormConfig: (config) => set({ volunteerFormConfig: config }),
      updateVacanciesFormConfig: (config) => set({ vacanciesFormConfig: config }),
      updateInternshipsFormConfig: (config) => set({ internshipsFormConfig: config }),
      reset: () => set({
        translations: defaultTranslations,
        aboutData: defaultAboutData,
        portfolioData: defaultPortfolioData,
        pressData: defaultPressData,
        labData: defaultLabData,
        formSchemas: [],
        volunteerFormConfig: defaultVolunteerFormConfig,
        vacanciesFormConfig: defaultVacanciesFormConfig,
        internshipsFormConfig: defaultInternshipsFormConfig,
        contact: defaultContact
      })
    }),
    {
      name: 'coyora-site-storage',
      merge: (persistedState: any, currentState: SiteData) => {
        return {
          ...currentState,
          ...persistedState,
          translations: {
            en: { ...currentState.translations.en, ...(persistedState.translations?.en || {}) },
            ru: { ...currentState.translations.ru, ...(persistedState.translations?.ru || {}) },
            az: { ...currentState.translations.az, ...(persistedState.translations?.az || {}) },
          },
          contact: {
            ...currentState.contact,
            ...(persistedState.contact || {})
          },
          volunteerFormConfig: {
            ...currentState.volunteerFormConfig,
            ...(persistedState.volunteerFormConfig || {})
          },
          vacanciesFormConfig: {
            ...currentState.vacanciesFormConfig,
            ...(persistedState.vacanciesFormConfig || {})
          },
          internshipsFormConfig: {
            ...currentState.internshipsFormConfig,
            ...(persistedState.internshipsFormConfig || {})
          },
          portfolioData: {
            ...currentState.portfolioData,
            ...(persistedState.portfolioData || {})
          }
        };
      }
    }
  )
);
