import { ref, uploadBytesResumable, getDownloadURL, deleteObject } from 'firebase/storage';
import { storage } from './config';

export const uploadFile = (file, folderPath, onProgress) => {
  return new Promise((resolve, reject) => {
    if (!file) {
      reject(new Error('No file provided'));
      return;
    }

    const fileExtension = file.name.split('.').pop();
    const uniqueFileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExtension}`;
    const storageRef = ref(storage, `${folderPath}/${uniqueFileName}`);
    
    const uploadTask = uploadBytesResumable(storageRef, file);

    uploadTask.on(
      'state_changed',
      (snapshot) => {
        const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
        if (onProgress) {
          onProgress(progress);
        }
      },
      (error) => {
        reject(error);
      },
      async () => {
        try {
          const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
          resolve(downloadURL);
        } catch (error) {
          reject(error);
        }
      }
    );
  });
};

export const deleteFile = async (fileUrl) => {
  try {
    // Basic extraction of path from URL, this might need refinement depending on the exact storage URL structure
    const pathRef = ref(storage, fileUrl);
    await deleteObject(pathRef);
  } catch (error) {
    console.error("Error deleting file:", error);
    // We don't always want to throw if a file delete fails, as the document might still need deleting
  }
};
