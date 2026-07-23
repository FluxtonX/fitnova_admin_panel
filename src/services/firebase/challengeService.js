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
  writeBatch,
} from 'firebase/firestore';
import { db } from './config';

const DEFAULT_CHALLENGES_COLLECTION = 'default_challenges';
const CHALLENGES_COLLECTION = 'challenges';

export const CATEGORY_IMAGES = {
  complete_workouts: 'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?auto=format&fit=crop&w=800&q=80',
  burn_calories: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?auto=format&fit=crop&w=800&q=80',
  build_streak: 'https://images.unsplash.com/photo-1476480862126-209bfaa8edc8?auto=format&fit=crop&w=800&q=80',
  weight_loss: 'https://images.unsplash.com/photo-1518611012118-696072aa579a?auto=format&fit=crop&w=800&q=80',
  strength_goal: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&w=800&q=80',
  meditation_goal: 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?auto=format&fit=crop&w=800&q=80',
  water: 'https://images.unsplash.com/photo-1548839140-29a749e1bc4e?auto=format&fit=crop&w=800&q=80',
  team_challenge: 'https://images.unsplash.com/photo-1526506118085-60ce8714f8c5?auto=format&fit=crop&w=800&q=80',
  custom: 'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?auto=format&fit=crop&w=800&q=80',
};

/**
 * Fetch all challenge definitions from Firestore
 */
export const getChallenges = async () => {
  try {
    const q1 = query(collection(db, DEFAULT_CHALLENGES_COLLECTION));
    const snapshot1 = await getDocs(q1);

    const MapById = new Map();

    snapshot1.docs.forEach((docSnap) => {
      MapById.set(docSnap.id, { id: docSnap.id, ...docSnap.data() });
    });

    // Also fetch from 'challenges' collection for backwards compatibility
    try {
      const q2 = query(collection(db, CHALLENGES_COLLECTION));
      const snapshot2 = await getDocs(q2);
      snapshot2.docs.forEach((docSnap) => {
        if (!MapById.has(docSnap.id)) {
          MapById.set(docSnap.id, { id: docSnap.id, ...docSnap.data() });
        }
      });
    } catch (_) {}

    const list = Array.from(MapById.values());
    list.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
    return list;
  } catch (error) {
    console.error('Error fetching challenges:', error);
    throw error;
  }
};

/**
 * Get single challenge by ID
 */
export const getChallengeById = async (id) => {
  try {
    const docRef1 = doc(db, DEFAULT_CHALLENGES_COLLECTION, id);
    const snap1 = await getDoc(docRef1);
    if (snap1.exists()) {
      return { id: snap1.id, ...snap1.data() };
    }

    const docRef2 = doc(db, CHALLENGES_COLLECTION, id);
    const snap2 = await getDoc(docRef2);
    if (snap2.exists()) {
      return { id: snap2.id, ...snap2.data() };
    }

    throw new Error('Challenge not found');
  } catch (error) {
    console.error('Error getting challenge by id:', error);
    throw error;
  }
};

/**
 * Map challenge icon string / category to Flutter icon integer code point
 */
const getIconCodePoint = (category) => {
  switch (category) {
    case 'complete_workouts':
    case 'workout':
      return 58270; // Icons.fitness_center_rounded
    case 'burn_calories':
      return 58249; // Icons.local_fire_department_rounded
    case 'build_streak':
    case 'steps':
      return 58210; // Icons.directions_walk_rounded
    case 'weight_loss':
      return 58983; // Icons.track_changes_rounded
    case 'strength_goal':
      return 58999; // Icons.trending_up_rounded
    case 'meditation_goal':
      return 58823; // Icons.self_improvement_rounded
    case 'water':
      return 58880; // Icons.water_drop_rounded
    case 'team_challenge':
      return 58189; // Icons.groups_rounded
    default:
      return 58000; // Icons.flag_rounded
  }
};

/**
 * Map category string to color integer ARGB32
 */
const getColorCode = (colorHex, category) => {
  if (colorHex) {
    const clean = colorHex.replace('#', '');
    return parseInt(`FF${clean}`, 16);
  }
  switch (category) {
    case 'complete_workouts': return 4281604315; // 0xFF3498DB (Blue)
    case 'burn_calories': return 4293941782; // 0xFFEF4444 (Red)
    case 'build_streak': return 4290726888; // 0xFFBF4BE8 (Purple)
    case 'weight_loss': return 4283237743; // 0xFF4DC56F (Green)
    case 'strength_goal': return 4286011382; // 0xFF7757F6 (Indigo)
    case 'meditation_goal': return 4293673082; // 0xFFEC407A (Pink)
    case 'team_challenge': return 4294278706; // 0xFFF59E32 (Orange)
    default: return 4281604315;
  }
};

/**
 * Create a new Challenge and sync to both `default_challenges` & `challenges`
 */
export const createChallenge = async (data) => {
  try {
    const id = data.id || `challenge_${Date.now()}`;
    const category = data.type || data.category || 'complete_workouts';

    const rulesList = Array.isArray(data.rules)
      ? data.rules
      : (data.rules || '')
          .split('\n')
          .map((r) => r.trim())
          .filter(Boolean);

    const payload = {
      id: id,
      challengeId: id,
      type: category,
      category: category,
      title: data.title.trim(),
      description: data.description || '',
      imageUrl: data.imageUrl || CATEGORY_IMAGES[category] || CATEGORY_IMAGES.complete_workouts,
      videoUrl: data.videoUrl || data.video || null,
      goal: data.goal || `Complete ${data.targetValue || 10} ${data.unit || 'units'}`,
      rules: rulesList.length > 0 ? rulesList : ['Complete daily tasks to track progress.'],
      durationDays: Number(data.durationDays) || 7,
      targetValue: Number(data.targetValue) || 10,
      rewardPoints: Number(data.rewardPoints) || 500,
      badgeName: data.badgeName || `${data.title} Badge`,
      unit: data.unit || 'workouts',
      targetUnit: data.unit || 'workouts',
      color: getColorCode(data.colorHex, category),
      icon: getIconCodePoint(category),
      status: data.status || 'active',
      challengeMode: data.challengeMode || 'community',
      visibility: data.challengeMode === 'solo' ? 'Private' : 'Public Community',
      isDefault: true,
      isFeatured: Boolean(data.isFeatured),
      participantCount: Number(data.participantCount) || 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // Save to both collections
    await setDoc(doc(db, DEFAULT_CHALLENGES_COLLECTION, id), payload);
    await setDoc(doc(db, CHALLENGES_COLLECTION, id), payload);

    return id;
  } catch (error) {
    console.error('Error creating challenge:', error);
    throw error;
  }
};

/**
 * Update an existing challenge in both collections
 */
export const updateChallenge = async (id, data) => {
  try {
    const category = data.type || data.category || 'complete_workouts';

    const rulesList = Array.isArray(data.rules)
      ? data.rules
      : (data.rules || '')
          .split('\n')
          .map((r) => r.trim())
          .filter(Boolean);

    const payload = {
      title: data.title.trim(),
      type: category,
      category: category,
      description: data.description || '',
      imageUrl: data.imageUrl || CATEGORY_IMAGES[category] || CATEGORY_IMAGES.complete_workouts,
      videoUrl: data.videoUrl || data.video || null,
      goal: data.goal || `Complete ${data.targetValue || 10} ${data.unit || 'units'}`,
      rules: rulesList,
      durationDays: Number(data.durationDays) || 7,
      targetValue: Number(data.targetValue) || 10,
      rewardPoints: Number(data.rewardPoints) || 500,
      badgeName: data.badgeName || `${data.title} Badge`,
      unit: data.unit || 'workouts',
      targetUnit: data.unit || 'workouts',
      color: getColorCode(data.colorHex, category),
      icon: getIconCodePoint(category),
      status: data.status || 'active',
      challengeMode: data.challengeMode || 'community',
      visibility: data.challengeMode === 'solo' ? 'Private' : 'Public Community',
      isFeatured: Boolean(data.isFeatured),
      updatedAt: new Date().toISOString(),
    };

    const ref1 = doc(db, DEFAULT_CHALLENGES_COLLECTION, id);
    const ref2 = doc(db, CHALLENGES_COLLECTION, id);

    await updateDoc(ref1, payload).catch(() => setDoc(ref1, payload, { merge: true }));
    await updateDoc(ref2, payload).catch(() => setDoc(ref2, payload, { merge: true }));
  } catch (error) {
    console.error('Error updating challenge:', error);
    throw error;
  }
};

/**
 * Delete a challenge from both Firestore collections
 */
export const deleteChallenge = async (id) => {
  try {
    await deleteDoc(doc(db, DEFAULT_CHALLENGES_COLLECTION, id)).catch(() => {});
    await deleteDoc(doc(db, CHALLENGES_COLLECTION, id)).catch(() => {});
  } catch (error) {
    console.error('Error deleting challenge:', error);
    throw error;
  }
};

/**
 * Duplicate a challenge
 */
export const duplicateChallenge = async (id) => {
  try {
    const original = await getChallengeById(id);
    const newId = `challenge_${Date.now()}`;
    const copyData = {
      ...original,
      id: newId,
      title: `${original.title} (Copy)`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    return await createChallenge(copyData);
  } catch (error) {
    console.error('Error duplicating challenge:', error);
    throw error;
  }
};

/**
 * Bulk delete challenges
 */
export const bulkDeleteChallenges = async (ids) => {
  try {
    for (const id of ids) {
      await deleteChallenge(id);
    }
  } catch (error) {
    console.error('Error in bulkDeleteChallenges:', error);
    throw error;
  }
};

/**
 * Bulk update status of challenges
 */
export const bulkUpdateChallengeStatus = async (ids, newStatus) => {
  try {
    const updatedAt = new Date().toISOString();
    for (const id of ids) {
      const ref1 = doc(db, DEFAULT_CHALLENGES_COLLECTION, id);
      const ref2 = doc(db, CHALLENGES_COLLECTION, id);

      await updateDoc(ref1, { status: newStatus, updatedAt }).catch(() => {});
      await updateDoc(ref2, { status: newStatus, updatedAt }).catch(() => {});
    }
  } catch (error) {
    console.error('Error in bulkUpdateChallengeStatus:', error);
    throw error;
  }
};
