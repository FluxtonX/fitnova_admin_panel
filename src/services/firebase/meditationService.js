import {
  collection,
  doc,
  getDocs,
  getDoc,
  setDoc,
  addDoc,
  updateDoc,
  deleteDoc,
} from 'firebase/firestore';
import { db } from './config';
import { deleteFromCloudinary } from '../cloudinary/cloudinaryService';

const MEDITATION_COLLECTION = 'meditations';
const SLEEP_COLLECTION = 'sleep_sounds';
const LOCAL_STORAGE_KEY = 'fitnova_admin_wellness_audio_v1';

const getLocalCache = () => {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (_) {
    return [];
  }
};

const setLocalCache = (list) => {
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(list));
  } catch (_) {}
};

export const MEDITATION_FOCUS_AREAS = [
  { value: 'mindfulness', label: '🧘‍♂️ Mindfulness', unit: 'min' },
  { value: 'focus', label: '🎯 Focus & Clarity', unit: 'min' },
  { value: 'stress_relief', label: '🌊 Stress Relief', unit: 'min' },
  { value: 'sleep', label: '🌙 Sleep Preparation', unit: 'min' },
  { value: 'nature', label: '🌧️ Nature & Rain', unit: 'min' },
  { value: 'ocean', label: '🌊 Ocean & Waves', unit: 'min' },
  { value: 'white_noise', label: '📻 White & Pink Noise', unit: 'min' },
  { value: 'binaural', label: '🧠 Binaural Delta Waves', unit: 'min' },
  { value: 'ambient_music', label: '🎵 Ambient Relaxation', unit: 'min' },
  { value: 'breathing', label: '🌬️ Deep Breathing', unit: 'min' },
];

export const FOCUS_AREA_IMAGES = {
  mindfulness: 'https://images.unsplash.com/photo-1506126613408-eca07ce68773?auto=format&fit=crop&w=800&q=80',
  focus: 'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?auto=format&fit=crop&w=800&q=80',
  stress_relief: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=800&q=80',
  sleep: 'https://images.unsplash.com/photo-1515694346937-94d85e41e6f0?auto=format&fit=crop&w=800&q=80',
  nature: 'https://images.unsplash.com/photo-1515694346937-94d85e41e6f0?auto=format&fit=crop&w=800&q=80',
  ocean: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=800&q=80',
  white_noise: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=800&q=80',
  binaural: 'https://images.unsplash.com/photo-1506126613408-eca07ce68773?auto=format&fit=crop&w=800&q=80',
  ambient_music: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=800&q=80',
  breathing: 'https://images.unsplash.com/photo-1518611012118-696072aa579a?auto=format&fit=crop&w=800&q=80',
};

/**
 * Fetch available Cloudinary audio tracks across meditation & sleep collections
 */
export const getAvailableCloudinaryAudios = async () => {
  try {
    const list = await getMeditations();
    return (list || []).filter((item) => item.audioUrl);
  } catch (err) {
    console.warn('Could not fetch audios for assignment:', err);
    return [];
  }
};

/**
 * Fetch all meditation & sleep audio sessions from Firestore with Local Cache fallback
 */
export const getMeditations = async () => {
  const localList = getLocalCache();
  try {
    const mockIds = ['1', '2', '3', 'sleep_rain_01', 'sleep_ocean_02', 'sleep_noise_03', 'sleep_delta_04'];
    const firestoreList = [];

    // 1. Fetch from 'meditations' collection
    try {
      const snap1 = await getDocs(collection(db, MEDITATION_COLLECTION));
      snap1.forEach((d) => {
        if (!mockIds.includes(d.id)) {
          firestoreList.push({ id: d.id, ...d.data() });
        }
      });
    } catch (_) {}

    // 2. Fetch from 'sleep_sounds' collection
    try {
      const snap2 = await getDocs(collection(db, SLEEP_COLLECTION));
      snap2.forEach((d) => {
        if (!mockIds.includes(d.id)) {
          firestoreList.push({ id: d.id, ...d.data() });
        }
      });
    } catch (_) {}

    const mergedMap = new Map();
    localList.forEach((item) => {
      if (!mockIds.includes(item.id)) mergedMap.set(item.id, item);
    });
    firestoreList.forEach((item) => mergedMap.set(item.id, item));

    const finalResult = Array.from(mergedMap.values());
    setLocalCache(finalResult);
    return finalResult;
  } catch (error) {
    console.warn('Firestore fetch failed, returning cached local wellness audio:', error);
    return localList.filter((item) => !['1', '2', '3'].includes(item.id));
  }
};

/**
 * Create a new Meditation / Sleep document in Firestore with Local Cache fallback
 */
export const createMeditation = async (data) => {
  const id = data.id || `wellness_${Date.now()}`;
  const focus = data.focus || data.category || 'mindfulness';

  const payload = {
    id,
    meditationId: id,
    title: data.title?.trim() || data.name?.trim() || 'New Audio Session',
    focus: focus,
    category: focus,
    duration: Number(data.duration) || 15,
    audioUrl: data.audioUrl || '',
    publicId: data.publicId || null,
    imageUrl: data.imageUrl || FOCUS_AREA_IMAGES[focus] || FOCUS_AREA_IMAGES.mindfulness,
    description: data.description || '',
    instructor: data.instructor || 'Fitnova Master',
    tags: Array.isArray(data.tags)
      ? data.tags
      : (data.tags || '')
          .split(',')
          .map((t) => t.trim())
          .filter(Boolean),
    isFeatured: Boolean(data.isFeatured),
    isCustomUpload: true,
    playCount: Number(data.playCount) || 0,
    status: data.status || 'active',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const localList = getLocalCache();
  setLocalCache([payload, ...localList.filter((item) => item.id !== id)]);

  try {
    await setDoc(doc(db, MEDITATION_COLLECTION, id), payload);
  } catch (error) {
    try {
      await addDoc(collection(db, MEDITATION_COLLECTION), payload);
    } catch (err2) {
      console.warn('Firestore permission notice (saved in local cache):', err2.message);
    }
  }

  return id;
};

/**
 * Update an existing Meditation / Sleep document
 */
export const updateMeditation = async (id, data) => {
  const focus = data.focus || data.category || 'mindfulness';
  const payload = {
    title: data.title?.trim() || data.name?.trim() || 'Audio Session',
    focus: focus,
    category: focus,
    duration: Number(data.duration) || 15,
    audioUrl: data.audioUrl || '',
    ...(data.publicId && { publicId: data.publicId }),
    imageUrl: data.imageUrl || FOCUS_AREA_IMAGES[focus] || FOCUS_AREA_IMAGES.mindfulness,
    description: data.description || '',
    instructor: data.instructor || 'Fitnova Master',
    tags: Array.isArray(data.tags)
      ? data.tags
      : (data.tags || '')
          .split(',')
          .map((t) => t.trim())
          .filter(Boolean),
    isFeatured: Boolean(data.isFeatured),
    status: data.status || 'active',
    updatedAt: new Date().toISOString(),
  };

  const localList = getLocalCache();
  setLocalCache(localList.map((item) => (item.id === id ? { ...item, ...payload } : item)));

  try {
    await updateDoc(doc(db, MEDITATION_COLLECTION, id), payload);
  } catch (_) {
    try {
      await updateDoc(doc(db, SLEEP_COLLECTION, id), payload);
    } catch (err) {
      console.warn('Firestore update notice (saved in local cache):', err.message);
    }
  }

  return id;
};

/**
 * Delete a Meditation / Sleep document and destroy Cloudinary asset
 */
export const deleteMeditation = async (id, item = null) => {
  const localList = getLocalCache();
  setLocalCache(localList.filter((i) => i.id !== id));

  if (item) {
    const targetAsset = item.publicId || item.audioUrl;
    if (targetAsset && (item.isCustomUpload || item.publicId)) {
      console.log(`Deleting Cloudinary audio for wellness session "${item.title || item.name}" (${targetAsset})...`);
      await deleteFromCloudinary(targetAsset, 'video');
    }
  }

  try {
    await deleteDoc(doc(db, MEDITATION_COLLECTION, id));
  } catch (_) {}
  try {
    await deleteDoc(doc(db, SLEEP_COLLECTION, id));
  } catch (_) {}

  return true;
};
