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

const SLEEP_COLLECTION = 'sleep_sounds';
const LOCAL_STORAGE_KEY = 'fitnova_admin_sleep_sounds_v1';

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

export const SLEEP_CATEGORIES = [
  { value: 'nature', label: '🌧️ Nature & Rain', unit: 'min' },
  { value: 'ocean', label: '🌊 Ocean & Waves', unit: 'min' },
  { value: 'white_noise', label: '📻 White & Pink Noise', unit: 'min' },
  { value: 'binaural', label: '🧠 Binaural Delta Waves', unit: 'min' },
  { value: 'ambient_music', label: '🎵 Ambient Relaxation', unit: 'min' },
  { value: 'sleep_story', label: '📖 Sleep Bedtime Story', unit: 'min' },
];

export const CATEGORY_SOUND_IMAGES = {
  nature: 'https://images.unsplash.com/photo-1515694346937-94d85e41e6f0?auto=format&fit=crop&w=800&q=80',
  ocean: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=800&q=80',
  white_noise: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=800&q=80',
  binaural: 'https://images.unsplash.com/photo-1506126613408-eca07ce68773?auto=format&fit=crop&w=800&q=80',
  ambient_music: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=800&q=80',
  sleep_story: 'https://images.unsplash.com/photo-1532012197267-da84d127e765?auto=format&fit=crop&w=800&q=80',
};

export const DEFAULT_SLEEP_SOUNDS = [];

/**
 * Fetch all sleep sound tracks from Firestore with Local Cache fallback
 */
export const getSleepSounds = async () => {
  const localList = getLocalCache();
  try {
    const snap = await getDocs(collection(db, SLEEP_COLLECTION));
    const firestoreList = [];
    const defaultDocIds = ['sleep_rain_01', 'sleep_ocean_02', 'sleep_noise_03', 'sleep_delta_04'];
    snap.forEach((d) => {
      const data = d.data();
      if (defaultDocIds.includes(d.id)) {
        deleteDoc(doc(db, SLEEP_COLLECTION, d.id)).catch(() => {});
        return;
      }
      firestoreList.push({ id: d.id, ...data });
    });

    const mergedMap = new Map();
    localList.forEach((item) => mergedMap.set(item.id, item));
    firestoreList.forEach((item) => mergedMap.set(item.id, item));

    const finalResult = Array.from(mergedMap.values());
    setLocalCache(finalResult);
    return finalResult;
  } catch (error) {
    console.warn('Firestore fetch failed, returning cached local sleep sounds:', error);
    return localList;
  }
};

/**
 * Seed initial sleep sounds into Firestore (Disabled)
 */
export const seedDefaultSleepSounds = async () => {
  return [];
};

/**
 * Create a new Sleep Sound document in Firestore with Local Cache fallback
 */
export const createSleepSound = async (data) => {
  const id = data.id || `sound_${Date.now()}`;
  const category = data.category || 'nature';

  const payload = {
    id,
    soundId: id,
    title: data.title.trim(),
    category: category,
    duration: Number(data.duration) || 30,
    audioUrl: data.audioUrl || '',
    publicId: data.publicId || null,
    imageUrl: data.imageUrl || CATEGORY_SOUND_IMAGES[category] || CATEGORY_SOUND_IMAGES.nature,
    description: data.description || '',
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

  // 1. Immediately update local storage cache so data is never lost
  const localList = getLocalCache();
  setLocalCache([payload, ...localList.filter((item) => item.id !== id)]);

  // 2. Sync to Firebase Firestore
  try {
    await setDoc(doc(db, SLEEP_COLLECTION, id), payload);
  } catch (error) {
    console.warn('setDoc error, attempting fallback addDoc:', error);
    try {
      await addDoc(collection(db, SLEEP_COLLECTION), payload);
    } catch (err2) {
      console.warn('Firestore permission notice (saved to local cache):', err2.message);
    }
  }

  return id;
};

/**
 * Update an existing Sleep Sound document
 */
export const updateSleepSound = async (id, data) => {
  const category = data.category || 'nature';
  const payload = {
    title: data.title.trim(),
    category: category,
    duration: Number(data.duration) || 30,
    audioUrl: data.audioUrl || '',
    ...(data.publicId && { publicId: data.publicId }),
    imageUrl: data.imageUrl || CATEGORY_SOUND_IMAGES[category] || CATEGORY_SOUND_IMAGES.nature,
    description: data.description || '',
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

  // Update local cache
  const localList = getLocalCache();
  setLocalCache(localList.map((item) => (item.id === id ? { ...item, ...payload } : item)));

  try {
    await updateDoc(doc(db, SLEEP_COLLECTION, id), payload);
  } catch (error) {
    console.warn('Firestore update error, saved in local cache:', error);
  }

  return id;
};

/**
 * Delete a Sleep Sound track document and delete from Cloudinary
 */
export const deleteSleepSound = async (id, track = null) => {
  // Update local cache
  const localList = getLocalCache();
  setLocalCache(localList.filter((item) => item.id !== id));

  if (track) {
    const targetAsset = track.publicId || track.audioUrl;
    if (targetAsset) {
      console.log(`Deleting Cloudinary audio for sleep sound "${track.title}" (${targetAsset})...`);
      await deleteFromCloudinary(targetAsset, 'video');
    }
  }

  try {
    await deleteDoc(doc(db, SLEEP_COLLECTION, id));
  } catch (error) {
    console.warn('Firestore delete notice:', error);
  }

  return true;
};
