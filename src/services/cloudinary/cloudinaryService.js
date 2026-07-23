/**
 * Cloudinary Upload & Management Service
 * Direct client-side upload with real-time progress callbacks,
 * authenticated API deletion using SHA-1 signature, and asset formatting.
 */

const CLOUD_NAME = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME || 'ncjlij4d';
const API_KEY = import.meta.env.VITE_CLOUDINARY_API_KEY || '557148135956429';
const API_SECRET = import.meta.env.VITE_CLOUDINARY_API_SECRET || '4TZwgc9qUOv3BZNZjidgZ1K6DSk';
const UPLOAD_PRESET = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET || 'fitnova_exercises';

/**
 * Helper to compute SHA-1 hash for Cloudinary API signature
 */
const sha1 = async (str) => {
  const buffer = new TextEncoder().encode(str);
  const hash = await crypto.subtle.digest('SHA-1', buffer);
  return Array.from(new Uint8Array(hash))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
};

/**
 * Upload a file directly to Cloudinary with real-time progress callbacks.
 * 
 * @param {File} file - Image or Video File object
 * @param {'image' | 'video' | 'auto'} resourceType - Type of resource
 * @param {Function} onProgress - Progress callback function (percentage 0-100)
 * @returns {Promise<Object>} Formatted Cloudinary metadata
 */
export const uploadToCloudinary = (file, resourceType = 'auto', onProgress = () => {}, folderPath = null) => {
  return new Promise(async (resolve, reject) => {
    if (!file) {
      return reject(new Error('No file provided for upload.'));
    }

    try {
      const isAudio = file.type.startsWith('audio/') || /\.(mp3|wav|aac|ogg|m4a|flac)$/i.test(file.name);
      let type = resourceType;
      if (type === 'auto') {
        if (file.type.startsWith('video/') || isAudio) {
          type = 'video';
        } else {
          type = 'image';
        }
      }

      let defaultFolder = `fitnova/exercises/${type}s`;
      if (isAudio) {
        defaultFolder = 'fitnova/exercises/audio';
      }

      const targetFolder = folderPath || defaultFolder;
      const sanitizedName = file.name
        .toLowerCase()
        .replace(/\.[^/.]+$/, '')
        .replace(/[^a-z0-9_-]/g, '_');
      const publicIdSimple = `${sanitizedName}_${Date.now()}`;
      const timestamp = Math.floor(Date.now() / 1000);

      // Cloudinary SHA-1 signed upload signature:
      // Sorted keys alphabetically: folder, public_id, timestamp
      const strToSign = `folder=${targetFolder}&public_id=${publicIdSimple}&timestamp=${timestamp}${API_SECRET}`;
      const signature = await sha1(strToSign);

      const url = `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/${type}/upload`;
      const xhr = new XMLHttpRequest();
      const formData = new FormData();

      formData.append('file', file);
      formData.append('api_key', API_KEY);
      formData.append('timestamp', timestamp.toString());
      formData.append('folder', targetFolder);
      formData.append('public_id', publicIdSimple);
      formData.append('signature', signature);

      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable) {
          const percent = Math.round((event.loaded / event.total) * 100);
          onProgress(percent);
        }
      };

      xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          try {
            const response = JSON.parse(xhr.responseText);
            resolve({
              url: response.secure_url,
              secure_url: response.secure_url,
              public_id: response.public_id,
              format: response.format,
              bytes: response.bytes,
              duration: response.duration || 0,
              width: response.width || 0,
              height: response.height || 0,
              resource_type: response.resource_type || type,
              createdAt: new Date().toISOString(),
            });
          } catch (err) {
            reject(new Error('Failed to parse Cloudinary response.'));
          }
        } else {
          try {
            const errRes = JSON.parse(xhr.responseText);
            const rawMsg = errRes.error?.message || `Upload failed with status ${xhr.status}`;
            reject(new Error(rawMsg));
          } catch (_) {
            reject(new Error(`Upload failed with status ${xhr.status}`));
          }
        }
      };

      xhr.onerror = () => {
        reject(new Error('Network error during Cloudinary upload. Please check your internet connection.'));
      };

      xhr.onabort = () => {
        reject(new Error('Upload canceled by user.'));
      };

      xhr.open('POST', url, true);
      xhr.send(formData);
    } catch (err) {
      reject(err);
    }
  });
};

/**
 * Extract Cloudinary Public ID from a secure URL or asset string
 */
export const extractPublicId = (url) => {
  if (!url || typeof url !== 'string') return null;
  if (!url.includes('cloudinary.com')) return url;
  try {
    const parts = url.split('/upload/');
    if (parts.length < 2) return url;
    let path = parts.slice(1).join('/upload/');
    const segments = path.split('/');
    const cleanSegments = segments.filter((seg) => {
      if (/^v\d+$/.test(seg)) return false;
      if (seg.includes(',') || /^[a-z]{1,2}_/.test(seg)) return false;
      return true;
    });

    let fullPath = cleanSegments.join('/');
    fullPath = fullPath.split('?')[0];
    const lastDotIndex = fullPath.lastIndexOf('.');
    if (lastDotIndex !== -1) {
      fullPath = fullPath.substring(0, lastDotIndex);
    }
    return fullPath;
  } catch (err) {
    console.warn('Error extracting Cloudinary public_id:', err);
    return url;
  }
};

/**
 * Delete asset directly from Cloudinary using SHA-1 signed request
 */
export const deleteFromCloudinary = async (publicIdOrUrl, resourceType = 'video') => {
  if (!publicIdOrUrl) return { result: 'error', message: 'No public ID or URL provided' };

  const publicId = publicIdOrUrl.includes('http') ? extractPublicId(publicIdOrUrl) : publicIdOrUrl;
  if (!publicId) return { result: 'error', message: 'Could not extract Cloudinary public ID' };

  try {
    const timestamp = Math.floor(Date.now() / 1000);
    // Cloudinary SHA-1 signature formula: public_id=<public_id>&timestamp=<timestamp><api_secret>
    const strToSign = `public_id=${publicId}&timestamp=${timestamp}${API_SECRET}`;
    const signature = await sha1(strToSign);

    const executeDelete = async (resType) => {
      const url = `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/${resType}/destroy`;
      const formData = new FormData();
      formData.append('public_id', publicId);
      formData.append('timestamp', timestamp.toString());
      formData.append('api_key', API_KEY);
      formData.append('signature', signature);

      const response = await fetch(url, {
        method: 'POST',
        body: formData,
      });
      return await response.json();
    };

    let result = await executeDelete(resourceType);
    console.log(`Cloudinary ${resourceType} delete response for "${publicId}":`, result);

    // Fallback: If not found under specified resourceType (e.g. 'video'), try 'image' or vice-versa
    if (result?.result !== 'ok') {
      const altType = resourceType === 'video' ? 'image' : 'video';
      const altResult = await executeDelete(altType);
      console.log(`Cloudinary ${altType} fallback delete response for "${publicId}":`, altResult);
      if (altResult?.result === 'ok') return altResult;
    }

    return result;
  } catch (error) {
    console.error('Error during Cloudinary deletion:', error);
    return { result: 'error', message: error.message };
  }
};
