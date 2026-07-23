import {
  collection,
  doc,
  getDocs,
  getDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  orderBy,
  writeBatch,
} from 'firebase/firestore';
import { db } from './config';
import { getExercises } from './exerciseService';
import presetVideos from './cloudinaryPresetVideos.json';
import { deleteFromCloudinary, extractPublicId } from '../cloudinary/cloudinaryService';

const WORKOUTS_COLLECTION = 'workouts';

// Clean video filename to human-readable exercise title
const cleanVideoTitle = (filename) => {
  return filename
    .replace(/\.mp4$/i, '')
    .replace(/_.*$/, '')
    .replace(/-(female|male)/gi, '')
    .replace(/-(version-\d*|FIX\d*)/gi, '')
    .replace(/-/g, ' ')
    .trim()
    .split(' ')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(' ');
};

// Generate comprehensive default workouts automatically from uploaded Cloudinary videos
const generateWorkoutsFromCloudinary = () => {
  const categories = {
    'Chest': {
      title: 'Chest & Upper Body Blast',
      category: 'Strength',
      difficulty: 'Intermediate',
      duration: '40 min',
      calories: 350,
      imageUrl: 'https://images.unsplash.com/photo-1583454110551-21f2fa2afe61?auto=format&fit=crop&w=900&q=80',
      description: 'Comprehensive chest press and upper body routine utilizing uploaded Cloudinary exercise videos.',
    },
    'Upper-Arms': {
      title: 'Biceps & Triceps Sculpt',
      category: 'Strength',
      difficulty: 'Beginner',
      duration: '35 min',
      calories: 280,
      imageUrl: 'https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?auto=format&fit=crop&w=900&q=80',
      description: 'Target biceps curls, triceps extensions and dips for muscular tone and endurance.',
    },
    'Waist': {
      title: 'Core & Abdominal Express',
      category: 'Core',
      difficulty: 'Beginner',
      duration: '25 min',
      calories: 210,
      imageUrl: 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?auto=format&fit=crop&w=900&q=80',
      description: 'Strengthen core, obliques, planks and waistline stabilization.',
    },
    'Shoulders': {
      title: 'Shoulders & Back Power',
      category: 'Strength',
      difficulty: 'Advanced',
      duration: '45 min',
      calories: 380,
      imageUrl: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&w=900&q=80',
      description: 'Overhead presses, lateral raises, rows and upper back conditioning.',
    },
    'Thighs': {
      title: 'Legs & Lower Body Power',
      category: 'Full Body',
      difficulty: 'Intermediate',
      duration: '30 min',
      calories: 310,
      imageUrl: 'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?auto=format&fit=crop&w=900&q=80',
      description: 'Air squats, rear lunges, calf raises and lower body strength.',
    },
    'Other': {
      title: 'Full Body HIIT & Burn',
      category: 'HIIT',
      difficulty: 'Advanced',
      duration: '30 min',
      calories: 420,
      imageUrl: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?auto=format&fit=crop&w=900&q=80',
      description: 'High intensity interval training with burpees, leg raises and bodyweight movements.',
    },
  };

  const grouped = {};

  presetVideos.forEach((v) => {
    if (!v.secure_url) return;
    const filename = v.name || v.file || '';
    let groupKey = 'Other';
    if (filename.toLowerCase().includes('chest')) groupKey = 'Chest';
    else if (filename.toLowerCase().includes('upper-arms') || filename.toLowerCase().includes('arms')) groupKey = 'Upper-Arms';
    else if (filename.toLowerCase().includes('waist') || filename.toLowerCase().includes('abs')) groupKey = 'Waist';
    else if (filename.toLowerCase().includes('shoulder')) groupKey = 'Shoulders';
    else if (filename.toLowerCase().includes('thighs') || filename.toLowerCase().includes('legs')) groupKey = 'Thighs';

    if (!grouped[groupKey]) grouped[groupKey] = [];
    grouped[groupKey].push({
      name: cleanVideoTitle(filename),
      videoAsset: v.secure_url,
      thumbnailAsset: v.secure_url.replace(/\.mp4$/i, '.jpg'),
    });
  });

  const workouts = [];
  Object.keys(categories).forEach((key) => {
    const meta = categories[key];
    const items = grouped[key] || [];
    if (items.length === 0) return;

    const exerciseDetails = items.map((ex, idx) => ({
      order: idx + 1,
      name: ex.name,
      videoAsset: ex.videoAsset,
      thumbnailAsset: ex.thumbnailAsset,
      sets: [
        { set: 1, instruction: '12 Reps' },
        { set: 2, instruction: '12 Reps' },
        { set: 3, instruction: '10 Reps' },
      ],
    }));

    workouts.push({
      title: meta.title,
      category: meta.category,
      duration: meta.duration,
      difficulty: meta.difficulty,
      calories: meta.calories,
      imageUrl: meta.imageUrl,
      description: meta.description,
      status: 'Active',
      author: 'Fitnova Team',
      exercises: exerciseDetails.map((e) => e.name),
      exerciseDetails,
    });
  });

  return workouts;
};

const SEED_WORKOUTS = generateWorkoutsFromCloudinary();

/**
 * Enrich workouts with live videoUrl & thumbnailUrl from Firestore 'exercises' collection
 */
export const enrichWorkoutsWithFirestoreExercises = async (workouts) => {
  try {
    const firestoreExercises = await getExercises();
    if (!firestoreExercises || firestoreExercises.length === 0) return workouts;

    // Create lookup dictionary for exercise name -> exercise doc
    const exMap = new Map();
    firestoreExercises.forEach((ex) => {
      if (ex.name) exMap.set(ex.name.toLowerCase().trim(), ex);
      if (ex.id) exMap.set(ex.id.toLowerCase().trim(), ex);
    });

    return workouts.map((w) => {
      if (!w.exerciseDetails || w.exerciseDetails.length === 0) return w;

      const updatedDetails = w.exerciseDetails.map((detail) => {
        const cleanName = (detail.name || '').toLowerCase().trim();
        const matched = exMap.get(cleanName);
        if (matched && (matched.videoUrl || matched.secure_url)) {
          const liveUrl = matched.videoUrl || matched.secure_url;
          const livePoster = matched.thumbnailUrl || (typeof liveUrl === 'string' ? liveUrl.replace(/\.mp4$/i, '.jpg') : '');

          return {
            ...detail,
            videoAsset: liveUrl,
            videoUrl: liveUrl,
            thumbnailAsset: livePoster,
            thumbnailUrl: livePoster,
          };
        }
        return detail;
      });

      return {
        ...w,
        exerciseDetails: updatedDetails,
      };
    });
  } catch (err) {
    console.warn('Could not enrich workouts with live Firestore exercises:', err);
    return workouts;
  }
};

/**
 * Fetch all workouts from Firestore with auto-seeding if empty
 */
export const getWorkouts = async () => {
  try {
    const workoutsRef = collection(db, WORKOUTS_COLLECTION);
    const snapshot = await getDocs(workoutsRef);

    let rawDocs = [];
    if (!snapshot.empty) {
      rawDocs = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
    }

    const sorted = rawDocs.sort((a, b) =>
      (b.createdAt || b.updatedAt || '').localeCompare(a.createdAt || a.updatedAt || '')
    );

    // Deduplicate workouts by normalized title to prevent duplicate cards
    const uniqueWorkouts = [];
    const seenTitles = new Set();
    const duplicateIdsToDelete = [];

    for (const w of sorted) {
      const normalizedTitle = (w.title || '').trim().toLowerCase();
      if (!normalizedTitle) {
        uniqueWorkouts.push(w);
        continue;
      }

      if (seenTitles.has(normalizedTitle)) {
        duplicateIdsToDelete.push(w.id);
      } else {
        seenTitles.add(normalizedTitle);
        uniqueWorkouts.push(w);
      }
    }

    // Clean up redundant duplicate documents from Firestore
    if (duplicateIdsToDelete.length > 0) {
      console.log(`Cleaning up ${duplicateIdsToDelete.length} duplicate workout records from Firestore...`);
      duplicateIdsToDelete.forEach((idToDelete) => {
        deleteDoc(doc(db, WORKOUTS_COLLECTION, idToDelete)).catch(() => {});
      });
    }

    return await enrichWorkoutsWithFirestoreExercises(uniqueWorkouts);
  } catch (error) {
    console.error('Error fetching workouts from Firestore:', error);
    return [];
  }
};

/**
 * Seed initial workouts into Firestore (Disabled)
 */
export const seedDefaultWorkouts = async () => {
  return [];
};

/**
 * Get a single workout by ID
 */
export const getWorkoutById = async (id) => {
  try {
    const docRef = doc(db, WORKOUTS_COLLECTION, id);
    const snapshot = await getDoc(docRef);
    if (snapshot.exists()) {
      const raw = { id: snapshot.id, ...snapshot.data() };
      const enriched = await enrichWorkoutsWithFirestoreExercises([raw]);
      return enriched[0];
    }
    throw new Error('Workout not found');
  } catch (error) {
    console.error('Error in getWorkoutById:', error);
    throw error;
  }
};

/**
 * Create a new workout in Firestore
 */
export const createWorkout = async (data) => {
  try {
    const exerciseDetails = Array.isArray(data.exerciseDetails) ? data.exerciseDetails : [];
    const exerciseNames = exerciseDetails.map((e) => e.name || 'Exercise').filter(Boolean);

    const payload = {
      title: data.title?.trim() || 'Untitled Workout',
      category: data.category || 'General',
      duration: data.duration ? (String(data.duration).includes('min') ? String(data.duration) : `${data.duration} min`) : '30 min',
      difficulty: data.difficulty || 'Intermediate',
      calories: Number(data.calories) || 200,
      imageUrl: data.imageUrl || 'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?auto=format&fit=crop&w=900&q=80',
      description: data.description || '',
      status: data.status || 'Active',
      author: data.author || 'Admin',
      exercises: exerciseNames,
      exerciseDetails: exerciseDetails.map((ex, idx) => ({
        order: ex.order || idx + 1,
        name: ex.name,
        videoAsset: ex.videoAsset || ex.videoUrl || '',
        thumbnailAsset: ex.thumbnailAsset || ex.thumbnailUrl || '',
        sets: Array.isArray(ex.sets) && ex.sets.length > 0
          ? ex.sets
          : [
              { set: 1, instruction: '12 Reps' },
              { set: 2, instruction: '12 Reps' },
              { set: 3, instruction: '10 Reps' },
            ],
      })),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const docRef = await addDoc(collection(db, WORKOUTS_COLLECTION), payload);
    return docRef.id;
  } catch (error) {
    console.error('Error creating workout:', error);
    throw error;
  }
};

/**
 * Update an existing workout
 */
export const updateWorkout = async (id, data) => {
  try {
    const docRef = doc(db, WORKOUTS_COLLECTION, id);
    const exerciseDetails = Array.isArray(data.exerciseDetails) ? data.exerciseDetails : [];
    const exerciseNames = exerciseDetails.map((e) => e.name || 'Exercise').filter(Boolean);

    const payload = {
      title: data.title?.trim() || 'Untitled Workout',
      category: data.category || 'General',
      duration: typeof data.duration === 'string' && data.duration.includes('min') ? data.duration : `${data.duration} min`,
      difficulty: data.difficulty || 'Intermediate',
      calories: Number(data.calories) || 200,
      imageUrl: data.imageUrl || 'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?auto=format&fit=crop&w=900&q=80',
      description: data.description || '',
      status: data.status || 'Active',
      author: data.author || 'Admin',
      exercises: exerciseNames,
      exerciseDetails: exerciseDetails.map((ex, idx) => ({
        order: ex.order || idx + 1,
        name: ex.name,
        videoAsset: ex.videoAsset || ex.videoUrl || '',
        thumbnailAsset: ex.thumbnailAsset || ex.thumbnailUrl || '',
        sets: Array.isArray(ex.sets) && ex.sets.length > 0 ? ex.sets : [{ set: 1, instruction: '10 Reps' }],
      })),
      updatedAt: new Date().toISOString(),
    };

    await updateDoc(docRef, payload);
  } catch (error) {
    console.error('Error updating workout:', error);
    throw error;
  }
};

/**
 * Delete a workout from Firestore
 */
export const deleteWorkout = async (id, workoutData = null) => {
  try {
    const docToDelete = workoutData || (await getWorkoutById(id));
    if (docToDelete && Array.isArray(docToDelete.exerciseDetails)) {
      for (const ex of docToDelete.exerciseDetails) {
        const videoUrl = ex?.videoAsset || ex?.videoUrl;
        const publicId = ex?.videoPublicId || extractPublicId(videoUrl);
        if (publicId && (ex?.isCustomUpload || !isPresetVideo(videoUrl, publicId))) {
          console.log(`Deleting Cloudinary video for workout deletion: ${publicId}`);
          await deleteFromCloudinary(publicId, 'video');
        }

        const thumbUrl = ex?.thumbnailAsset || ex?.thumbnailUrl;
        const thumbPublicId = extractPublicId(thumbUrl);
        if (thumbPublicId && thumbPublicId !== publicId && !isPresetVideo(thumbUrl, thumbPublicId)) {
          console.log(`Deleting Cloudinary thumbnail for workout deletion: ${thumbPublicId}`);
          await deleteFromCloudinary(thumbPublicId, 'image');
        }
      }
    }

    await deleteDoc(doc(db, WORKOUTS_COLLECTION, id));
  } catch (error) {
    console.error('Error deleting workout:', error);
    throw error;
  }
};

/**
 * Duplicate a workout
 */
export const duplicateWorkout = async (workout) => {
  try {
    const copyData = {
      ...workout,
      title: `${workout.title} (Copy)`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    delete copyData.id;

    return await createWorkout(copyData);
  } catch (error) {
    console.error('Error duplicating workout:', error);
    throw error;
  }
};

const presetPublicIds = new Set(presetVideos.map((v) => v.public_id).filter(Boolean));
const presetUrls = new Set(presetVideos.map((v) => v.secure_url).filter(Boolean));

export const isPresetVideo = (url, publicId) => {
  if (publicId && presetPublicIds.has(publicId)) return true;
  if (url && presetUrls.has(url)) return true;
  return false;
};

/**
 * Add a new exercise / video to an existing workout
 */
export const addExerciseToWorkout = async (workoutId, newExercise) => {
  try {
    const workoutDoc = await getWorkoutById(workoutId);
    if (!workoutDoc) throw new Error('Workout not found');

    const existingDetails = Array.isArray(workoutDoc.exerciseDetails) ? workoutDoc.exerciseDetails : [];
    const updatedDetails = [
      ...existingDetails,
      {
        order: existingDetails.length + 1,
        name: newExercise.name?.trim() || 'New Exercise',
        videoAsset: newExercise.videoUrl || '',
        videoUrl: newExercise.videoUrl || '',
        videoPublicId: newExercise.videoPublicId || extractPublicId(newExercise.videoUrl) || '',
        isCustomUpload: true,
        thumbnailAsset: newExercise.thumbnailUrl || (newExercise.videoUrl ? newExercise.videoUrl.replace(/\.mp4$/i, '.jpg') : ''),
        thumbnailUrl: newExercise.thumbnailUrl || (newExercise.videoUrl ? newExercise.videoUrl.replace(/\.mp4$/i, '.jpg') : ''),
        sets: newExercise.sets || [
          { set: 1, instruction: '12 Reps' },
          { set: 2, instruction: '12 Reps' },
          { set: 3, instruction: '10 Reps' },
        ],
      },
    ];

    const exerciseNames = updatedDetails.map((e) => e.name || 'Exercise').filter(Boolean);

    await updateWorkout(workoutId, {
      ...workoutDoc,
      exerciseDetails: updatedDetails,
      exercises: exerciseNames,
    });

    return await getWorkoutById(workoutId);
  } catch (error) {
    console.error('Error adding exercise to workout:', error);
    throw error;
  }
};

/**
 * Remove an exercise video from a workout, delete from Cloudinary (if custom upload) & Firestore metadata
 */
export const removeExerciseFromWorkout = async (workoutId, exerciseIndex, exerciseItem) => {
  try {
    const workoutDoc = await getWorkoutById(workoutId);
    if (!workoutDoc) throw new Error('Workout not found');

    const videoUrl = exerciseItem?.videoAsset || exerciseItem?.videoUrl;
    const publicId = exerciseItem?.videoPublicId || extractPublicId(videoUrl);

    // Only delete from Cloudinary if this is a user custom upload or NOT in preset system videos
    const isPreset = isPresetVideo(videoUrl, publicId);
    const shouldDeleteFromCloudinary = exerciseItem?.isCustomUpload || !isPreset;

    if (publicId && shouldDeleteFromCloudinary) {
      console.log(`Deleting custom uploaded video from Cloudinary: ${publicId}`);
      await deleteFromCloudinary(publicId, 'video');

      const thumbUrl = exerciseItem?.thumbnailAsset || exerciseItem?.thumbnailUrl;
      const thumbPublicId = extractPublicId(thumbUrl);
      if (thumbPublicId && thumbPublicId !== publicId && !isPresetVideo(thumbUrl, thumbPublicId)) {
        await deleteFromCloudinary(thumbPublicId, 'image');
      }
    } else {
      console.log(`Preserving system preset video in Cloudinary (not custom upload): ${publicId}`);
    }

    // Remove from workout exerciseDetails array in Firestore
    const existingDetails = Array.isArray(workoutDoc.exerciseDetails) ? workoutDoc.exerciseDetails : [];
    const updatedDetails = existingDetails.filter((_, idx) => idx !== exerciseIndex);
    const reindexedDetails = updatedDetails.map((ex, idx) => ({
      ...ex,
      order: idx + 1,
    }));

    const exerciseNames = reindexedDetails.map((e) => e.name || 'Exercise').filter(Boolean);

    await updateWorkout(workoutId, {
      ...workoutDoc,
      exerciseDetails: reindexedDetails,
      exercises: exerciseNames,
    });

    return await getWorkoutById(workoutId);
  } catch (error) {
    console.error('Error removing exercise from workout:', error);
    throw error;
  }
};
