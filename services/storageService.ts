import { storage } from './firebase';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';

/**
 * Upload an image file to Firebase Storage
 * @param file - The image file to upload
 * @param path - The path in storage (e.g., 'raffles/raffle-id')
 * @returns The download URL of the uploaded image
 */
export async function uploadRaffleImage(file: File, raffleId: string): Promise<string> {
  try {
    // Create a unique filename using timestamp
    const timestamp = Date.now();
    const filename = `${raffleId}_${timestamp}`;
    const storageRef = ref(storage, `raffles/${raffleId}/${filename}`);
    
    // Upload the file
    const snapshot = await uploadBytes(storageRef, file);
    
    // Get the download URL
    const downloadURL = await getDownloadURL(snapshot.ref);
    return downloadURL;
  } catch (error) {
    console.error('Error uploading image:', error);
    throw new Error('Failed to upload image');
  }
}

/**
 * Delete an image from Firebase Storage
 * @param imageUrl - The full download URL of the image
 */
export async function deleteRaffleImage(imageUrl: string): Promise<void> {
  try {
    // Extract the path from the URL
    // Firebase URLs have the format: https://firebasestorage.googleapis.com/v0/b/{bucket}/o/{path}?...
    const decodedUrl = decodeURIComponent(imageUrl);
    const urlParts = decodedUrl.split('/o/')[1]?.split('?')[0];
    
    if (!urlParts) {
      console.warn('Could not extract storage path from URL');
      return;
    }
    
    const storageRef = ref(storage, urlParts);
    await deleteObject(storageRef);
  } catch (error) {
    console.error('Error deleting image:', error);
    // Don't throw, just log the error as it's not critical
  }
}

/**
 * Replace an image: delete old one and upload new one
 * @param newFile - The new image file
 * @param raffleId - The raffle ID
 * @param oldImageUrl - The URL of the image to delete (optional)
 * @returns The download URL of the new image
 */
export async function replaceRaffleImage(
  newFile: File,
  raffleId: string,
  oldImageUrl?: string
): Promise<string> {
  try {
    // Delete old image if it exists
    if (oldImageUrl) {
      await deleteRaffleImage(oldImageUrl);
    }
    
    // Upload new image
    const newImageUrl = await uploadRaffleImage(newFile, raffleId);
    return newImageUrl;
  } catch (error) {
    console.error('Error replacing image:', error);
    throw error;
  }
}
