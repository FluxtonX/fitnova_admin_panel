import fs from 'fs';
import path from 'path';
import https from 'https';

const API_KEY = "AIzaSyBuhx148XDOHGS_TQipCkoxs2tl0cD5dx8";
const PROJECT_ID = "fitnovva";

function parseExerciseMetadata(filename, secureUrl, duration) {
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
    videoUrl: secureUrl,
    thumbnailUrl: thumbnailUrl,
    status: 'active',
  };
}

function writeToFirestoreRest(exercise) {
  return new Promise((resolve) => {
    const postData = JSON.stringify({
      fields: {
        id: { stringValue: exercise.id },
        name: { stringValue: exercise.name },
        category: { stringValue: exercise.category },
        primaryMuscle: { stringValue: exercise.primaryMuscle },
        secondaryMuscle: { stringValue: exercise.secondaryMuscle },
        difficulty: { stringValue: exercise.difficulty },
        equipment: { stringValue: exercise.equipment },
        duration: { integerValue: exercise.duration },
        calories: { integerValue: exercise.calories },
        sets: { integerValue: exercise.sets },
        reps: { integerValue: exercise.reps },
        restSeconds: { integerValue: exercise.restSeconds },
        videoUrl: { stringValue: exercise.videoUrl },
        thumbnailUrl: { stringValue: exercise.thumbnailUrl },
        status: { stringValue: exercise.status },
        instructions: {
          arrayValue: {
            values: [
              { stringValue: `Maintain proper posture throughout the ${exercise.name} movement.` },
              { stringValue: `Inhale during preparation and exhale during exertion.` },
              { stringValue: `Complete 3 full sets of 12 repetitions.` }
            ]
          }
        },
        benefits: {
          arrayValue: {
            values: [
              { stringValue: `Builds strength in ${exercise.primaryMuscle.toLowerCase()}.` },
              { stringValue: `Improves muscular endurance and core balance.` }
            ]
          }
        },
        tips: {
          arrayValue: {
            values: [
              { stringValue: `Keep your core engaged throughout.` },
              { stringValue: `Perform movement with smooth control.` }
            ]
          }
        }
      }
    });

    const options = {
      hostname: 'firestore.googleapis.com',
      port: 443,
      path: `/v1/projects/${PROJECT_ID}/databases/(default)/documents/exercises/${exercise.id}?key=${API_KEY}`,
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData),
      },
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          console.log(`✅ Synced to Firestore: "${exercise.name}" (${exercise.category})`);
          resolve(true);
        } else {
          console.error(`❌ Firestore REST Error [${exercise.name}]: ${res.statusCode} ${data}`);
          resolve(false);
        }
      });
    });

    req.on('error', (err) => {
      console.error(`❌ Network Error [${exercise.name}]: ${err.message}`);
      resolve(false);
    });

    req.write(postData);
    req.end();
  });
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function runFirestoreSync() {
  console.log('🚀 Starting Cloudinary -> Firestore REST API Sync...');
  const jsonPath = path.join(process.cwd(), 'uploaded_videos_cloudinary.json');
  if (!fs.existsSync(jsonPath)) {
    console.error(`❌ File not found: ${jsonPath}`);
    process.exit(1);
  }

  const items = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
  const validItems = items.filter((i) => i.secure_url);

  console.log(`📋 Found ${validItems.length} uploaded videos.`);

  let syncedCount = 0;
  for (let i = 0; i < validItems.length; i++) {
    const item = validItems[i];
    const exercise = parseExerciseMetadata(item.name, item.secure_url, item.duration);
    
    console.log(`\n[${i + 1}/${validItems.length}] Processing...`);
    const success = await writeToFirestoreRest(exercise);
    if (success) syncedCount++;
    await sleep(200); // 200ms rate limit protection
  }

  console.log(`\n🎉 Firestore Exercise Sync Complete! ${syncedCount}/${validItems.length} exercises written to Firestore 'exercises' collection.`);
  process.exit(0);
}

runFirestoreSync();
