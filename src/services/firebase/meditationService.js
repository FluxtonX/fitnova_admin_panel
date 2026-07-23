import {
  collection,
  doc,
  getDocs,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  orderBy,
} from 'firebase/firestore';
import { signInAnonymously } from 'firebase/auth';
import { db, auth } from './config';

const MEDITATIONS_COLLECTION = 'meditations';
const SLEEP_SOUNDS_COLLECTION = 'sleep_sounds';
const LOCAL_STORAGE_KEY = 'fitnova_meditations_local_cache';

const getLocalCache = () => {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (_) {
    return [];
  }
};

const saveLocalCache = (items) => {
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(items));
  } catch (_) {}
};

export const ensureAuth = async () => {
  try {
    if (!auth.currentUser) {
      await signInAnonymously(auth);
    }
  } catch (e) {
    console.warn('Anonymous auth sign-in notice:', e.message);
  }
};

/**
 * Fetch all meditation & sleep sessions from Firestore
 */
export const getMeditationSessions = async () => {
  try {
    await ensureAuth();
    const mapById = new Map();

    // 1. Include local cache
    const local = getLocalCache();
    local.forEach((item) => {
      if (item && item.id) mapById.set(item.id, item);
    });

    // 2. Fetch from 'meditations'
    try {
      const snap1 = await getDocs(collection(db, MEDITATIONS_COLLECTION));
      snap1.docs.forEach((d) => {
        mapById.set(d.id, { id: d.id, collectionName: MEDITATIONS_COLLECTION, ...d.data() });
      });
    } catch (e) {
      console.warn('Error fetching meditations:', e);
    }

    // 3. Fetch from 'sleep_sounds'
    try {
      const snap2 = await getDocs(collection(db, SLEEP_SOUNDS_COLLECTION));
      snap2.docs.forEach((d) => {
        if (!mapById.has(d.id)) {
          mapById.set(d.id, { id: d.id, collectionName: SLEEP_SOUNDS_COLLECTION, ...d.data() });
        }
      });
    } catch (e) {
      console.warn('Error fetching sleep_sounds:', e);
    }

    return Array.from(mapById.values());
  } catch (error) {
    console.error('Error in getMeditationSessions:', error);
    return getLocalCache();
  }
};

/**
 * Create or add a new meditation session to Firestore
 */
export const addMeditationSession = async (data) => {
  await ensureAuth();
  const id = data.id || `meditation_${Date.now()}`;
  const cat = data.category || data.focus || 'mindfulness';
  const collectionName = (cat === 'Sleep' || cat === 'sleep') ? SLEEP_SOUNDS_COLLECTION : MEDITATIONS_COLLECTION;
  const titleVal = (data.title || data.name || '').trim();
  const audioVal = (data.audioUrl || data.url || data.audio || '').trim();
  const imageVal = (data.imageUrl || data.image || '').trim() || 'https://images.unsplash.com/photo-1545205597-3d9d02c29597?auto=format&fit=crop&w=300&q=80';
  const guideVal = data.instructor || data.guide || 'Fitnova Master';
  const durVal = Number(data.duration || data.durationMinutes) || 15;

  const payload = {
    id,
    docId: id,
    title: titleVal,
    name: titleVal,
    category: cat,
    focus: cat,
    instructor: guideVal,
    guide: guideVal,
    durationMinutes: durVal,
    duration: durVal,
    audioUrl: audioVal,
    url: audioVal,
    audio: audioVal,
    imageUrl: imageVal,
    image: imageVal,
    description: data.description || '',
    tags: data.tags || '',
    tag: cat,
    isFeatured: Boolean(data.isFeatured),
    status: data.status || 'active',
    createdAt: data.createdAt || new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  // Always preserve in local cache
  const local = getLocalCache().filter((x) => x.id !== id);
  local.unshift(payload);
  saveLocalCache(local);

  try {
    const docRef = doc(db, collectionName, id);
    await setDoc(docRef, payload);

    if (collectionName !== MEDITATIONS_COLLECTION) {
      await setDoc(doc(db, MEDITATIONS_COLLECTION, id), payload).catch(() => {});
    }
  } catch (error) {
    console.warn('Firestore setDoc notice (saved in local session):', error.message);
  }

  return id;
};

/**
 * Update an existing meditation session in Firestore
 */
export const updateMeditationSession = async (id, data, currentCollection = MEDITATIONS_COLLECTION) => {
  await ensureAuth();
  const cat = data.category || data.focus || 'mindfulness';
  const titleVal = (data.title || data.name || '').trim();
  const audioVal = (data.audioUrl || data.url || data.audio || '').trim();
  const imageVal = (data.imageUrl || data.image || '').trim();
  const guideVal = data.instructor || data.guide || 'Fitnova Master';
  const durVal = Number(data.duration || data.durationMinutes) || 15;

  const payload = {
    title: titleVal,
    name: titleVal,
    category: cat,
    focus: cat,
    instructor: guideVal,
    guide: guideVal,
    durationMinutes: durVal,
    duration: durVal,
    audioUrl: audioVal,
    url: audioVal,
    audio: audioVal,
    imageUrl: imageVal,
    image: imageVal,
    description: data.description || '',
    tags: data.tags || '',
    tag: cat,
    isFeatured: Boolean(data.isFeatured),
    status: data.status || 'active',
    updatedAt: new Date().toISOString(),
  };

  const local = getLocalCache().map((x) => (x.id === id ? { ...x, ...payload } : x));
  saveLocalCache(local);

  try {
    const targetCollection = (cat === 'Sleep' || cat === 'sleep') ? SLEEP_SOUNDS_COLLECTION : MEDITATIONS_COLLECTION;
    const docRef = doc(db, targetCollection, id);
    await setDoc(docRef, payload, { merge: true });

    if (targetCollection !== MEDITATIONS_COLLECTION) {
      await setDoc(doc(db, MEDITATIONS_COLLECTION, id), payload, { merge: true }).catch(() => {});
    }
  } catch (error) {
    console.warn('Firestore update notice (saved in local session):', error.message);
  }
};

/**
 * Delete a meditation session from Firestore
 */
export const deleteMeditationSession = async (id, collectionName = MEDITATIONS_COLLECTION) => {
  try {
    if (!id) return;
    const targetId = String(id).trim();
    await deleteDoc(doc(db, collectionName, targetId)).catch(() => {});
    await deleteDoc(doc(db, MEDITATIONS_COLLECTION, targetId)).catch(() => {});
    await deleteDoc(doc(db, SLEEP_SOUNDS_COLLECTION, targetId)).catch(() => {});
  } catch (error) {
    console.error('Error deleting meditation session:', error);
    throw error;
  }
};

// Aliases and Exports for full compatibility
export const MEDITATION_FOCUS_AREAS = [
  { value: 'mindfulness', label: '🧘‍♂️ Mindfulness & Presence' },
  { value: 'focus', label: '🎯 Focus & Concentration' },
  { value: 'stress_relief', label: '🌊 Stress & Anxiety Relief' },
  { value: 'sleep', label: '🌙 Sleep & Deep Rest' },
  { value: 'nature', label: '🌧️ Nature & Rain Soundscapes' },
  { value: 'ocean', label: '🌊 Ocean & Waves' },
  { value: 'white_noise', label: '📻 White Noise' },
  { value: 'binaural', label: '🧠 Binaural Beats' },
  { value: 'ambient_music', label: '🎵 Ambient Relaxation' },
  { value: 'breathing', label: '🌬️ Deep Breathing & Pranayama' },
];

export const FOCUS_AREA_IMAGES = {
  mindfulness: 'https://images.unsplash.com/photo-1545205597-3d9d02c29597?auto=format&fit=crop&w=300&q=80',
  focus: 'https://images.unsplash.com/photo-1506126613408-eca07ce68773?auto=format&fit=crop&w=300&q=80',
  stress_relief: 'https://images.unsplash.com/photo-1518241353330-0f7941c2d9b5?auto=format&fit=crop&w=300&q=80',
  sleep: 'https://images.unsplash.com/photo-1511295742362-92c96b124e52?auto=format&fit=crop&w=300&q=80',
  nature: 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?auto=format&fit=crop&w=300&q=80',
  ocean: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=300&q=80',
  white_noise: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=300&q=80',
  binaural: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=300&q=80',
  ambient_music: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=300&q=80',
  breathing: 'https://images.unsplash.com/photo-1506126613408-eca07ce68773?auto=format&fit=crop&w=300&q=80',
};

export const getAvailableCloudinaryAudios = async () => {
  try {
    const sessions = await getMeditationSessions();
    return sessions.filter((s) => Boolean(s.audioUrl || s.url || s.audio));
  } catch (e) {
    console.warn('Error fetching available audios:', e);
    return [];
  }
};

export const getMeditations = getMeditationSessions;
export const createMeditation = addMeditationSession;
export const updateMeditation = async (id, data) => updateMeditationSession(id, data);
export const deleteMeditation = async (id) => deleteMeditationSession(id);
