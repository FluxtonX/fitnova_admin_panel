import {
  collection,
  doc,
  getDocs,
  getDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  writeBatch,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from './config';
import { deleteFromCloudinary } from '../cloudinary/cloudinaryService';

const EXERCISES_COLLECTION = 'exercises';

/**
 * Fetch all exercises with client-side & server-side filtering, search, and sorting
 */
export const getExercises = async () => {
  try {
    const exercisesRef = collection(db, EXERCISES_COLLECTION);
    const q = query(exercisesRef, orderBy('createdAt', 'desc'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));
  } catch (error) {
    console.error('Error in getExercises:', error);
    throw error;
  }
};

/**
 * Fetch a single exercise by ID
 */
export const getExerciseById = async (id) => {
  try {
    const docRef = doc(db, EXERCISES_COLLECTION, id);
    const snapshot = await getDoc(docRef);
    if (snapshot.exists()) {
      return { id: snapshot.id, ...snapshot.data() };
    }
    throw new Error('Exercise not found');
  } catch (error) {
    console.error('Error in getExerciseById:', error);
    throw error;
  }
};

/**
 * Check if exercise with the same name already exists (case-insensitive)
 */
export const checkDuplicateName = async (name, currentId = null) => {
  try {
    const exercisesRef = collection(db, EXERCISES_COLLECTION);
    const snapshot = await getDocs(exercisesRef);
    const normalizedName = name.trim().toLowerCase();

    return snapshot.docs.some((doc) => {
      if (currentId && doc.id === currentId) return false;
      const dataName = (doc.data().name || '').trim().toLowerCase();
      return dataName === normalizedName;
    });
  } catch (error) {
    console.warn('Error checking duplicate name:', error);
    return false;
  }
};

/**
 * Create a new exercise in Firestore
 */
export const createExercise = async (data) => {
  try {
    const isDuplicate = await checkDuplicateName(data.name);
    if (isDuplicate) {
      throw new Error(`An exercise with the name "${data.name}" already exists.`);
    }

    const payload = {
      name: data.name.trim(),
      description: data.description || '',
      instructions: data.instructions || '',
      benefits: data.benefits || '',
      tips: data.tips || '',
      category: data.category || 'Full Body',
      primaryMuscle: data.primaryMuscle || 'Full Body',
      secondaryMuscle: data.secondaryMuscle || '',
      difficulty: data.difficulty || 'Beginner',
      equipment: data.equipment || 'None',
      duration: Number(data.duration) || 0,
      calories: Number(data.calories) || 0,
      sets: Number(data.sets) || 3,
      reps: Number(data.reps) || 10,
      restTime: Number(data.restTime) || 30,
      status: data.status || 'Active',
      featured: Boolean(data.featured),
      thumbnail: data.thumbnail || null,
      video: data.video || null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const docRef = await addDoc(collection(db, EXERCISES_COLLECTION), payload);
    return docRef.id;
  } catch (error) {
    console.error('Error creating exercise:', error);
    throw error;
  }
};

/**
 * Update an existing exercise
 */
export const updateExercise = async (id, data) => {
  try {
    const isDuplicate = await checkDuplicateName(data.name, id);
    if (isDuplicate) {
      throw new Error(`An exercise with the name "${data.name}" already exists.`);
    }

    const docRef = doc(db, EXERCISES_COLLECTION, id);
    const payload = {
      name: data.name.trim(),
      description: data.description || '',
      instructions: data.instructions || '',
      benefits: data.benefits || '',
      tips: data.tips || '',
      category: data.category || 'Full Body',
      primaryMuscle: data.primaryMuscle || 'Full Body',
      secondaryMuscle: data.secondaryMuscle || '',
      difficulty: data.difficulty || 'Beginner',
      equipment: data.equipment || 'None',
      duration: Number(data.duration) || 0,
      calories: Number(data.calories) || 0,
      sets: Number(data.sets) || 3,
      reps: Number(data.reps) || 10,
      restTime: Number(data.restTime) || 30,
      status: data.status || 'Active',
      featured: Boolean(data.featured),
      thumbnail: data.thumbnail || null,
      video: data.video || null,
      updatedAt: new Date().toISOString(),
    };

    await updateDoc(docRef, payload);
  } catch (error) {
    console.error('Error updating exercise:', error);
    throw error;
  }
};

/**
 * Delete an exercise from Firestore & remove associated Cloudinary media
 */
export const deleteExercise = async (id, exerciseData = null) => {
  try {
    let exercise = exerciseData;
    if (!exercise) {
      exercise = await getExerciseById(id);
    }

    // Clean up Cloudinary assets if present
    if (exercise?.thumbnail?.public_id) {
      deleteFromCloudinary(exercise.thumbnail.public_id, 'image');
    }
    if (exercise?.video?.public_id) {
      deleteFromCloudinary(exercise.video.public_id, 'video');
    }

    await deleteDoc(doc(db, EXERCISES_COLLECTION, id));
  } catch (error) {
    console.error('Error deleting exercise:', error);
    throw error;
  }
};

/**
 * Duplicate an exercise
 */
export const duplicateExercise = async (id) => {
  try {
    const original = await getExerciseById(id);
    const copyData = {
      ...original,
      name: `${original.name} (Copy)`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    delete copyData.id;

    return await createExercise(copyData);
  } catch (error) {
    console.error('Error duplicating exercise:', error);
    throw error;
  }
};

/**
 * Bulk delete exercises
 */
export const bulkDeleteExercises = async (exerciseList) => {
  try {
    const batch = writeBatch(db);
    for (const item of exerciseList) {
      const id = typeof item === 'string' ? item : item.id;
      const ref = doc(db, EXERCISES_COLLECTION, id);
      batch.delete(ref);

      if (typeof item === 'object' && item !== null) {
        if (item.thumbnail?.public_id) deleteFromCloudinary(item.thumbnail.public_id, 'image');
        if (item.video?.public_id) deleteFromCloudinary(item.video.public_id, 'video');
      }
    }
    await batch.commit();
  } catch (error) {
    console.error('Error in bulkDeleteExercises:', error);
    throw error;
  }
};

/**
 * Bulk update exercise status
 */
export const bulkUpdateStatus = async (ids, newStatus) => {
  try {
    const batch = writeBatch(db);
    const updatedAt = new Date().toISOString();
    ids.forEach((id) => {
      const ref = doc(db, EXERCISES_COLLECTION, id);
      batch.update(ref, { status: newStatus, updatedAt });
    });
    await batch.commit();
  } catch (error) {
    console.error('Error in bulkUpdateStatus:', error);
    throw error;
  }
};

import presetVideos from './cloudinaryPresetVideos.json';

function parseMetadata(filename, secureUrl, duration) {
  let baseName = filename.replace(/\.mp4$/i, '');
  let category = 'Full Body';
  let primaryMuscle = 'Full Body';

  if (baseName.includes('_')) {
    const parts = baseName.split('_');
    const lastPart = parts[parts.length - 1].replace(/-FIX\d*\.?/g, '').trim();
    if (lastPart.toLowerCase().includes('chest')) {
      category = 'Chest';
      primaryMuscle = 'Pectorals';
    } else if (lastPart.toLowerCase().includes('upper-arms') || lastPart.toLowerCase().includes('arms')) {
      category = 'Upper Arms';
      primaryMuscle = 'Biceps & Triceps';
    } else if (lastPart.toLowerCase().includes('waist') || lastPart.toLowerCase().includes('abs')) {
      category = 'Waist';
      primaryMuscle = 'Abs & Core';
    } else if (lastPart.toLowerCase().includes('thighs') || lastPart.toLowerCase().includes('legs')) {
      category = 'Thighs';
      primaryMuscle = 'Quadriceps & Hamstrings';
    } else if (lastPart.toLowerCase().includes('shoulders') || lastPart.toLowerCase().includes('shoulder')) {
      category = 'Shoulders';
      primaryMuscle = 'Deltoids';
    } else if (lastPart.toLowerCase().includes('back')) {
      category = 'Back';
      primaryMuscle = 'Lats & Rhomboids';
    } else if (lastPart.toLowerCase().includes('calves')) {
      category = 'Calves';
      primaryMuscle = 'Gastrocnemius';
    } else if (lastPart.toLowerCase().includes('hips')) {
      category = 'Hips';
      primaryMuscle = 'Glutes & Hips';
    }
  }

  let cleanTitle = baseName
    .replace(/_.*$/, '')
    .replace(/-(female|male)/gi, '')
    .replace(/-(version-\d*|FIX\d*)/gi, '')
    .replace(/-/g, ' ')
    .trim();

  cleanTitle = cleanTitle
    .split(' ')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(' ');

  const thumbnailUrl = secureUrl.replace(/\.mp4$/i, '.jpg');
  const slugId = cleanTitle.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '');

  return {
    id: slugId || baseName.toLowerCase().replace(/[^a-z0-9]+/g, '_'),
    name: cleanTitle,
    category,
    primaryMuscle,
    secondaryMuscle: 'Core & Stabilizers',
    difficulty: 'Intermediate',
    equipment: cleanTitle.toLowerCase().includes('dumbbell') ? 'Dumbbells' : 'Bodyweight',
    duration: Math.round(duration || 30),
    calories: Math.round((duration || 30) * 0.25) || 12,
    sets: 3,
    reps: 12,
    restSeconds: 30,
    instructions: [
      `Maintain proper posture throughout the ${cleanTitle} movement.`,
      `Inhale during preparation and exhale during exertion.`,
      `Complete 3 full sets of 12 repetitions.`
    ],
    benefits: [
      `Builds strength in ${primaryMuscle.toLowerCase()}.`,
      `Improves muscular endurance and core balance.`
    ],
    tips: [
      `Keep your core engaged throughout.`,
      `Perform movement with smooth control.`
    ],
    videoUrl: secureUrl,
    thumbnailUrl: thumbnailUrl,
    status: 'active',
  };
}

/**
 * Bulk sync uploaded Cloudinary video URLs to Firestore exercises collection
 */
export const syncCloudinaryPresetExercises = async () => {
  try {
    let count = 0;
    // Process in batches of 40 (Firestore batch limit is 500)
    const validItems = presetVideos.filter((v) => v.secure_url);
    
    for (let i = 0; i < validItems.length; i += 40) {
      const chunk = validItems.slice(i, i + 40);
      const batch = writeBatch(db);

      chunk.forEach((item) => {
        const metadata = parseMetadata(item.name, item.secure_url, item.duration);
        const docRef = doc(db, EXERCISES_COLLECTION, metadata.id);
        const now = new Date().toISOString();
        batch.set(docRef, {
          ...metadata,
          createdAt: now,
          updatedAt: now,
        }, { merge: true });
        count++;
      });

      await batch.commit();
    }

    return count;
  } catch (error) {
    console.error('Error in syncCloudinaryPresetExercises:', error);
    throw error;
  }
};
