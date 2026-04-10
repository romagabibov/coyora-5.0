let audioCtx: AudioContext | null = null;
let ambientOsc: OscillatorNode | null = null;
let ambientGain: GainNode | null = null;
let bgMusic: HTMLAudioElement | null = null;
export let isMuted = true;

const musicTracks = [
  'https://cdn.pixabay.com/audio/2022/05/27/audio_1808fbf07a.mp3', // Ambient Piano
  'https://cdn.pixabay.com/audio/2022/01/21/audio_31743c589f.mp3', // Relaxing Nature
  'https://cdn.pixabay.com/audio/2021/11/25/audio_91b32e02f9.mp3', // Deep Space
  'https://cdn.pixabay.com/audio/2022/03/10/audio_c8c8a7315b.mp3', // Minimalist Zen
  'https://cdn.pixabay.com/audio/2022/10/25/audio_4f21f1b8b4.mp3', // Ambient 5
  'https://cdn.pixabay.com/audio/2022/08/23/audio_d16737dc28.mp3', // Ambient 6
  'https://cdn.pixabay.com/audio/2022/02/07/audio_6770281222.mp3'  // Ambient 7
];

let playQueue: string[] = [];
let isFirstRound = true;

const shuffleArray = (array: string[]) => {
  const newArr = [...array];
  for (let i = newArr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newArr[i], newArr[j]] = [newArr[j], newArr[i]];
  }
  return newArr;
};

const fillQueue = () => {
  if (isFirstRound) {
    playQueue = [...musicTracks];
    isFirstRound = false;
  } else {
    playQueue = shuffleArray(musicTracks);
  }
};

const playNextTrack = () => {
  if (!bgMusic) return;
  if (playQueue.length === 0) {
    fillQueue();
  }
  const nextTrack = playQueue.shift();
  if (nextTrack) {
    bgMusic.src = nextTrack;
    bgMusic.play().catch(e => {
      console.error("Background music play failed:", e);
      setTimeout(playNextTrack, 1000); // Skip to next track if error
    });
  }
};

export const initAudio = () => {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
  }
  if (audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  if (!bgMusic) {
    bgMusic = new Audio();
    bgMusic.volume = 0.2; // Keep it quiet and relaxing
    bgMusic.addEventListener('ended', playNextTrack);
    bgMusic.addEventListener('error', playNextTrack);
    
    fillQueue();
    const firstTrack = playQueue.shift();
    if (firstTrack) bgMusic.src = firstTrack;
  }
};

export const toggleMute = () => {
  isMuted = !isMuted;
  if (!isMuted) {
    initAudio();
    startAmbient();
    if (bgMusic) {
      if (!bgMusic.src || bgMusic.src === window.location.href) {
        playNextTrack();
      } else {
        bgMusic.play().catch(e => console.error("Background music play failed:", e));
      }
    }
  } else {
    stopAmbient();
    if (bgMusic) {
      bgMusic.pause();
    }
  }
  return isMuted;
};

export const playHover = () => {
  if (isMuted || !audioCtx) return;
  try {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    
    // High-tech short tick
    osc.type = 'sine';
    osc.frequency.setValueAtTime(2000, audioCtx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(100, audioCtx.currentTime + 0.03);
    
    gain.gain.setValueAtTime(0, audioCtx.currentTime);
    gain.gain.linearRampToValueAtTime(0.05, audioCtx.currentTime + 0.005);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.03);
    
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.start();
    osc.stop(audioCtx.currentTime + 0.03);
  } catch (e) {
    console.error(e);
  }
};

export const playClick = () => {
  if (isMuted || !audioCtx) return;
  try {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    
    // Deep electronic thud
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(300, audioCtx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(40, audioCtx.currentTime + 0.15);
    
    gain.gain.setValueAtTime(0, audioCtx.currentTime);
    gain.gain.linearRampToValueAtTime(0.1, audioCtx.currentTime + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.15);
    
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.start();
    osc.stop(audioCtx.currentTime + 0.15);
  } catch (e) {
    console.error(e);
  }
};

const startAmbient = () => {
  if (!audioCtx || ambientOsc) return;
  try {
    ambientOsc = audioCtx.createOscillator();
    ambientGain = audioCtx.createGain();
    const filter = audioCtx.createBiquadFilter();
    
    ambientOsc.type = 'sine';
    ambientOsc.frequency.value = 55; // Low drone
    
    filter.type = 'lowpass';
    filter.frequency.value = 150;

    ambientGain.gain.value = 0.02; // Very quiet

    ambientOsc.connect(filter);
    filter.connect(ambientGain);
    ambientGain.connect(audioCtx.destination);
    ambientOsc.start();
  } catch (e) {
    console.error(e);
  }
};

const stopAmbient = () => {
  if (ambientOsc) {
    try {
      ambientOsc.stop();
      ambientOsc.disconnect();
    } catch (e) {}
    ambientOsc = null;
  }
  if (ambientGain) {
    try {
      ambientGain.disconnect();
    } catch (e) {}
    ambientGain = null;
  }
};
