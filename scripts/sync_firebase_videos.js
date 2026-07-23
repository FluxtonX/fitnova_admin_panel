import { initializeApp } from "firebase/app";
import { getAuth, signInAnonymously } from "firebase/auth";
import { getFirestore, doc, writeBatch } from "firebase/firestore";
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

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
const auth = getAuth(app);
const db = getFirestore(app);

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const uploadedPath = path.resolve(__dirname, '../uploaded_videos_cloudinary.json');
const presetPath = path.resolve(__dirname, '../src/services/firebase/cloudinaryPresetVideos.json');

const targetJsonPath = fs.existsSync(uploadedPath) ? uploadedPath : presetPath;

function parseMetadata(fileName, secureUrl, duration) {
  let cleanName = fileName || '';
  const lastDot = cleanName.lastIndexOf('.');
  const baseName = lastDot !== -1 ? cleanName.substring(0, lastDot) : cleanName;

  let category = 'Full Body';
  let primaryMuscle = 'Full Body';

  const parts = baseName.split('_');
  if (parts.length >= 2) {
    const lastPart = parts[parts.length - 1];
    if (lastPart.toLowerCase().includes('chest')) {
      category = 'Chest';
      primaryMuscle = 'Pectorals';
    } else if (lastPart.toLowerCase().includes('upper-arms') || lastPart.toLowerCase().includes('biceps') || lastPart.toLowerCase().includes('triceps')) {
      category = 'Arms';
      primaryMuscle = 'Biceps & Triceps';
    } else if (lastPart.toLowerCase().includes('waist') || lastPart.toLowerCase().includes('abs')) {
      category = 'Abs';
      primaryMuscle = 'Rectus Abdominis';
    } else if (lastPart.toLowerCase().includes('thighs') || lastPart.toLowerCase().includes('legs')) {
      category = 'Legs';
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
    video: secureUrl,
    videoUrl: secureUrl,
    videoAsset: secureUrl,
    thumbnail: thumbnailUrl,
    thumbnailUrl: thumbnailUrl,
    thumbnailAsset: thumbnailUrl,
    status: 'active',
  };
}

async function syncVideos() {
  console.log('🚀 Connecting to Firebase Firestore...');
  try {
    await signInAnonymously(auth);
    console.log('✅ Firebase Auth successful!');
  } catch (authErr) {
    console.log('⚠️ Notice: Proceeding directly with Firestore access...');
  }

  console.log(`📂 Reading Cloudinary videos from ${targetJsonPath}...`);
  const fileContent = fs.readFileSync(targetJsonPath, 'utf8');
  const presetVideos = JSON.parse(fileContent);

  // Sync to src/services/firebase/cloudinaryPresetVideos.json so Admin UI also gets updated URLs
  try {
    fs.writeFileSync(presetPath, fileContent, 'utf8');
    console.log('✅ Updated src/services/firebase/cloudinaryPresetVideos.json with latest uploaded URLs!');
  } catch (_) {}

  const validItems = presetVideos.filter((v) => v.secure_url);
  console.log(`⚡ Found ${validItems.length} Cloudinary video records to sync...`);

  let count = 0;
  for (let i = 0; i < validItems.length; i += 40) {
    const chunk = validItems.slice(i, i + 40);
    const batch = writeBatch(db);

    chunk.forEach((item) => {
      const metadata = parseMetadata(item.name, item.secure_url, item.duration);
      const docRef = doc(db, 'exercises', metadata.id);
      const now = new Date().toISOString();
      batch.set(docRef, {
        ...metadata,
        createdAt: now,
        updatedAt: now,
      }, { merge: true });
      count++;
    });

    await batch.commit();
    console.log(`📦 Synced ${count} / ${validItems.length} videos to Firebase...`);
  }

  console.log(`🎉 SUCCESS! All ${count} Cloudinary video URLs updated in Firebase Firestore!`);
  process.exit(0);
}

syncVideos().catch((err) => {
  console.error('❌ Error syncing videos:', err);
  process.exit(1);
});
