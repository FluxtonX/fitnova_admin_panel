import fs from 'fs';
import path from 'path';
import https from 'https';

const CLOUD_NAME = 'ncjlij4d';
const API_KEY = '557148135956429';
const UPLOAD_PRESET = 'fitnova_exercises';
const VIDEO_DIR = '/Users/mc/projects/fitnova/assets/video';

function findMp4Files(dir, fileList = []) {
  const files = fs.readdirSync(dir);
  files.forEach((file) => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    if (stat.isDirectory()) {
      findMp4Files(filePath, fileList);
    } else if (file.toLowerCase().endsWith('.mp4')) {
      fileList.push(filePath);
    }
  });
  return fileList;
}

function uploadFileHttps(filePath, retries = 3) {
  return new Promise((resolve) => {
    const fileName = path.basename(filePath);
    const relativePath = path.relative(VIDEO_DIR, filePath);
    const fileSizeMB = (fs.statSync(filePath).size / (1024 * 1024)).toFixed(2);

    console.log(`\n⏳ Uploading [${relativePath}] (${fileSizeMB} MB)...`);

    const boundary = '----CloudinaryBoundary' + Math.random().toString(16).substring(2);
    const postDataHeader = [];

    // Fields
    const fields = {
      upload_preset: UPLOAD_PRESET,
      api_key: API_KEY,
      folder: 'fitnova/exercises/videos',
    };

    for (const [key, val] of Object.entries(fields)) {
      postDataHeader.push(`--${boundary}\r\nContent-Disposition: form-data; name="${key}"\r\n\r\n${val}\r\n`);
    }

    // File header
    postDataHeader.push(
      `--${boundary}\r\nContent-Disposition: form-data; name="file"; filename="${fileName}"\r\nContent-Type: video/mp4\r\n\r\n`
    );

    const headerBuffer = Buffer.from(postDataHeader.join(''));
    const footerBuffer = Buffer.from(`\r\n--${boundary}--\r\n`);
    const fileBuffer = fs.readFileSync(filePath);

    const totalLength = headerBuffer.length + fileBuffer.length + footerBuffer.length;

    const options = {
      hostname: 'api.cloudinary.com',
      port: 443,
      path: `/v1_1/${CLOUD_NAME}/video/upload`,
      method: 'POST',
      headers: {
        'Content-Type': `multipart/form-data; boundary=${boundary}`,
        'Content-Length': totalLength,
      },
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          if (res.statusCode >= 200 && res.statusCode < 300) {
            console.log(`✅ Success: ${fileName}`);
            console.log(`   URL: ${parsed.secure_url}`);
            console.log(`   Public ID: ${parsed.public_id}`);
            resolve({
              file: relativePath,
              name: fileName,
              secure_url: parsed.secure_url,
              public_id: parsed.public_id,
              duration: parsed.duration || 0,
              format: parsed.format,
              bytes: parsed.bytes,
            });
          } else {
            console.error(`❌ Cloudinary Error [${fileName}]: ${parsed.error?.message || res.statusCode}`);
            if (retries > 0) {
              console.log(`🔄 Retrying... (${retries} left)`);
              setTimeout(() => uploadFileHttps(filePath, retries - 1).then(resolve), 2000);
            } else {
              resolve({ file: relativePath, error: parsed.error?.message || `Status ${res.statusCode}` });
            }
          }
        } catch (err) {
          console.error(`❌ Parse Error [${fileName}]: ${err.message}`);
          resolve({ file: relativePath, error: err.message });
        }
      });
    });

    req.on('error', (err) => {
      console.error(`❌ Network Error [${fileName}]: ${err.message}`);
      if (retries > 0) {
        console.log(`🔄 Retrying in 3s... (${retries} left)`);
        setTimeout(() => uploadFileHttps(filePath, retries - 1).then(resolve), 3000);
      } else {
        resolve({ file: relativePath, error: err.message });
      }
    });

    req.write(headerBuffer);
    req.write(fileBuffer);
    req.write(footerBuffer);
    req.end();
  });
}

// Sleep helper between uploads to prevent network throttling
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function runBatchUpload() {
  console.log('🚀 Starting Cloudinary Video Batch Upload...');
  console.log(`   Cloud Name: ${CLOUD_NAME}`);
  console.log(`   Upload Preset: ${UPLOAD_PRESET}`);
  console.log(`   Source Directory: ${VIDEO_DIR}`);

  const videoFiles = findMp4Files(VIDEO_DIR);
  console.log(`📹 Found ${videoFiles.length} MP4 videos to upload.`);

  const results = [];
  for (let i = 0; i < videoFiles.length; i++) {
    console.log(`\n[${i + 1}/${videoFiles.length}] Processing...`);
    const res = await uploadFileHttps(videoFiles[i]);
    results.push(res);
    await sleep(1000); // 1 second delay between video uploads
  }

  const outputPath = path.join(process.cwd(), 'uploaded_videos_cloudinary.json');
  fs.writeFileSync(outputPath, JSON.stringify(results, null, 2));

  const successCount = results.filter((r) => r.secure_url).length;
  console.log(`\n🎉 Batch upload complete! ${successCount}/${videoFiles.length} uploaded successfully.`);
  console.log(`   Output log saved to: ${outputPath}`);
}

runBatchUpload();
