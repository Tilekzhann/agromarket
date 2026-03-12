// lib/firebase/storage.js
import { 
  ref,
  uploadBytes,
  uploadBytesResumable,
  getDownloadURL,
  deleteObject,
  listAll,
  getMetadata,
  updateMetadata
} from 'firebase/storage';
import { storage } from './config';

// Загрузить файл
export async function uploadFile(file, path, onProgress = null) {
  try {
    const storageRef = ref(storage, path);
    const uploadTask = uploadBytesResumable(storageRef, file);
    
    return new Promise((resolve, reject) => {
      uploadTask.on(
        'state_changed',
        (snapshot) => {
          const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
          if (onProgress) onProgress(progress);
        },
        (error) => {
          console.error('Upload error:', error);
          reject(error);
        },
        async () => {
          const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
          resolve({
            url: downloadURL,
            path: uploadTask.snapshot.ref.fullPath,
            name: file.name,
            size: file.size,
            type: file.type
          });
        }
      );
    });
  } catch (error) {
    console.error('Error uploading file:', error);
    throw error;
  }
}

// Загрузить несколько файлов
export async function uploadMultipleFiles(files, basePath, onProgress = null) {
  try {
    const uploadPromises = files.map((file, index) => {
      const timestamp = Date.now();
      const fileName = `${timestamp}_${file.name}`;
      const filePath = `${basePath}/${fileName}`;
      return uploadFile(file, filePath, 
        onProgress ? (progress) => onProgress(index, progress) : null
      );
    });
    
    return await Promise.all(uploadPromises);
  } catch (error) {
    console.error('Error uploading multiple files:', error);
    throw error;
  }
}

// Получить URL файла
export async function getFileUrl(path) {
  try {
    const storageRef = ref(storage, path);
    return await getDownloadURL(storageRef);
  } catch (error) {
    console.error('Error getting file URL:', error);
    throw error;
  }
}

// Удалить файл
export async function deleteFile(path) {
  try {
    const storageRef = ref(storage, path);
    await deleteObject(storageRef);
    return true;
  } catch (error) {
    console.error('Error deleting file:', error);
    throw error;
  }
}

// Удалить несколько файлов
export async function deleteMultipleFiles(paths) {
  try {
    const deletePromises = paths.map(path => deleteFile(path));
    await Promise.all(deletePromises);
    return true;
  } catch (error) {
    console.error('Error deleting multiple files:', error);
    throw error;
  }
}

// Получить список файлов в папке
export async function listFiles(path) {
  try {
    const storageRef = ref(storage, path);
    const result = await listAll(storageRef);
    
    const files = await Promise.all(
      result.items.map(async (itemRef) => {
        const url = await getDownloadURL(itemRef);
        const metadata = await getMetadata(itemRef);
        return {
          name: itemRef.name,
          path: itemRef.fullPath,
          url,
          size: metadata.size,
          contentType: metadata.contentType,
          timeCreated: metadata.timeCreated,
          updated: metadata.updated
        };
      })
    );
    
    return {
      files,
      prefixes: result.prefixes.map(prefix => prefix.fullPath)
    };
  } catch (error) {
    console.error('Error listing files:', error);
    throw error;
  }
}

// Получить метаданные файла
export async function getFileMetadata(path) {
  try {
    const storageRef = ref(storage, path);
    return await getMetadata(storageRef);
  } catch (error) {
    console.error('Error getting file metadata:', error);
    throw error;
  }
}

// Обновить метаданные файла
export async function updateFileMetadata(path, metadata) {
  try {
    const storageRef = ref(storage, path);
    return await updateMetadata(storageRef, metadata);
  } catch (error) {
    console.error('Error updating file metadata:', error);
    throw error;
  }
}

// Копировать файл
export async function copyFile(sourcePath, destinationPath) {
  try {
    const url = await getFileUrl(sourcePath);
    const response = await fetch(url);
    const blob = await response.blob();
    
    return await uploadFile(blob, destinationPath);
  } catch (error) {
    console.error('Error copying file:', error);
    throw error;
  }
}

// Переместить файл
export async function moveFile(sourcePath, destinationPath) {
  try {
    const result = await copyFile(sourcePath, destinationPath);
    await deleteFile(sourcePath);
    return result;
  } catch (error) {
    console.error('Error moving file:', error);
    throw error;
  }
}

// Сгенерировать путь для изображения товара
export function getProductImagePath(productId, fileName) {
  const timestamp = Date.now();
  const safeFileName = fileName.replace(/[^a-zA-Z0-9.]/g, '_');
  return `products/${productId}/images/${timestamp}_${safeFileName}`;
}

// Сгенерировать путь для сертификата
export function getCertificatePath(productId, fileName) {
  const timestamp = Date.now();
  const safeFileName = fileName.replace(/[^a-zA-Z0-9.]/g, '_');
  return `products/${productId}/certificates/${timestamp}_${safeFileName}`;
}

// Сгенерировать путь для аватара пользователя
export function getUserAvatarPath(userId, fileName) {
  const timestamp = Date.now();
  const safeFileName = fileName.replace(/[^a-zA-Z0-9.]/g, '_');
  return `users/${userId}/avatar/${timestamp}_${safeFileName}`;
}

// Проверить, существует ли файл
export async function fileExists(path) {
  try {
    const storageRef = ref(storage, path);
    await getMetadata(storageRef);
    return true;
  } catch (error) {
    if (error.code === 'storage/object-not-found') {
      return false;
    }
    throw error;
  }
}