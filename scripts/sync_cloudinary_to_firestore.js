import fs from 'fs';
import path from 'path';
import { initializeApp } from 'firebase/app';
import { getFirestore, doc, setDoc, serverTimestamp } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyBuhx148XDOHGS_TQipCkoxs2tl0cD5dx8",
  authDomain: "fitnovva.firebaseapp.com",
  projectId: "fitnovva",
  storageBucket: "fitnovva.firebasestorage.app",
  messagingSenderId: "917529088327",
  appId: "1:917529088327:web:74224d8c4b5d73db0cbc62",
  measurementId: "G-7NC687R29E"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Parse metadata from video filename
function parseExerciseMetadata(filename, secureUrl, duration) {
  let baseName = filename.replace(/\.mp4$/i, '');
  
  // Extract category if filename has _Category pattern
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

  // Clean exercise title
  let cleanTitle = baseName
    .replace(/_.*$/, '') // remove trailing _Category
    .replace(/-(female|male)/gi, '') // clean gender tags
    .replace(/-(version-\d*|FIX\d*)/gi, '') // clean fix tags
    .replace(/-/g, ' ') // hyphen to space
    .trim();

  // Capitalize title
  cleanTitle = cleanTitle
    .split(' ')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(' ');

  // Thumbnail URL: Cloudinary transforms .mp4 to .jpg automatically for video posters
  const thumbnailUrl = secureUrl.replace(/\.mp4$/i, '.jpg');

  // Slug ID
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
      `Inhale during the preparation phase and exhale during exertion.`,
      `Complete 3 full sets of 12 repetitions with controlled pace.`
    ],
    benefits: [
      `Builds strength in ${primaryMuscle.toLowerCase()}.`,
      `Improves muscular endurance and core stability.`,
      `Boosts daily calorie burn.`
    ],
    tips: [
      `Keep your core engaged at all times.`,
      `Do not rush through reps; focus on form over speed.`
    ],
    videoUrl: secureUrl,
    thumbnailUrl: thumbnailUrl,
    status: 'active',
  };
}

async function syncToFirestore() {
  console.log('🚀 Starting Cloudinary Videos -> Firestore Sync...');
  const jsonPath = path.join(process.cwd(), 'uploaded_videos_cloudinary.json');
  if (!fs.existsSync(jsonPath)) {
    console.error(`❌ Could not find ${jsonPath}`);
    process.exit(1);
  }

  const rawData = fs.readFileSync(jsonPath, 'utf8');
  const items = JSON.parse(rawData);

  console.log(`📋 Found ${items.length} uploaded Cloudinary records.`);

  const successfulUploads = items.filter((item) => item.secure_url);
  console.log(`✅ ${successfulUploads.length} valid video links ready to sync.`);

  let syncedCount = 0;
  for (let i = 0; i < successfulUploads.length; i++) {
    const item = successfulUploads[i];
    const exercise = parseExerciseMetadata(item.name, item.secure_url, item.duration);

    try {
      const docRef = doc(db, 'exercises', exercise.id);
      await setDoc(docRef, {
        ...exercise,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      }, { merge: true });

      syncedCount++;
      console.log(`[${syncedCount}/${successfulUploads.length}] Synced exercise: "${exercise.name}" (${exercise.category}) -> Firestore ID: ${exercise.id}`);
    } catch (err) {
      console.error(`❌ Failed to sync ${exercise.name}: ${err.message}`);
    }
  }

  console.log(`\n🎉 Firestore Exercise Sync Complete! ${syncedCount} exercises written to Firestore 'exercises' collection.`);
  process.exit(0);
}

syncToFirestore();
