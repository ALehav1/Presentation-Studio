import Dexie, { type EntityTable } from 'dexie';

// Define the slide image interface
interface SlideImage {
  id: string; // slideId
  imageUrl: string; // base64 data URL
  presentationId: string; // for grouping
  createdAt: Date;
}

// Define the IndexedDB database
class ImageDatabase extends Dexie {
  // Define table with proper typing
  images!: EntityTable<SlideImage, 'id'>;

  constructor() {
    super('PresentationImages');
    
    // Define schema
    this.version(1).stores({
      images: 'id, presentationId, createdAt' // Primary key: id, Indexes: presentationId, createdAt
    });
  }
}

// Create database instance
export const imageDb = new ImageDatabase();

/**
 * Save a slide image to IndexedDB
 * @param slideId - Unique slide identifier
 * @param imageUrl - Base64 data URL of the image
 * @param presentationId - ID of the presentation this slide belongs to
 */
export async function saveSlideImage(slideId: string, imageUrl: string, presentationId: string): Promise<void> {
  try {
    await imageDb.images.put({
      id: slideId,
      imageUrl,
      presentationId,
      createdAt: new Date()
    });
    console.log(`💾 Image saved to IndexedDB: ${slideId}`);
  } catch (error) {
    console.error('❌ Failed to save image to IndexedDB:', error);
    throw error;
  }
}

/**
 * Load slide images for a specific presentation
 * @param presentationId - ID of the presentation
 * @returns Map of slideId to imageUrl
 */
export async function loadPresentationImages(presentationId: string): Promise<Record<string, string>> {
  try {
    const images = await imageDb.images
      .where('presentationId')
      .equals(presentationId)
      .toArray();
    
    const imageMap: Record<string, string> = {};
    images.forEach(img => {
      imageMap[img.id] = img.imageUrl;
    });
    
    console.log(`📷 Loaded ${images.length} images from IndexedDB for presentation: ${presentationId}`);
    return imageMap;
  } catch (error) {
    console.error('❌ Failed to load images from IndexedDB:', error);
    return {};
  }
}

/**
 * Load a single slide image
 * @param slideId - ID of the slide
 * @returns Image URL or null if not found
 */
export async function loadSlideImage(slideId: string): Promise<string | null> {
  try {
    const image = await imageDb.images.get(slideId);
    return image?.imageUrl || null;
  } catch (error) {
    console.error(`❌ Failed to load image for slide ${slideId}:`, error);
    return null;
  }
}

/**
 * Delete all images for a presentation
 * @param presentationId - ID of the presentation
 */
export async function deletePresentationImages(presentationId: string): Promise<void> {
  try {
    const deleteCount = await imageDb.images
      .where('presentationId')
      .equals(presentationId)
      .delete();
    
    console.log(`🗑️ Deleted ${deleteCount} images for presentation: ${presentationId}`);
  } catch (error) {
    console.error('❌ Failed to delete presentation images:', error);
    throw error;
  }
}

/**
 * Clear old images to manage storage space
 * Keep only the most recent N presentations
 * @param keepCount - Number of recent presentations to keep (default: 5)
 */
export async function clearOldImages(keepCount: number = 5): Promise<void> {
  try {
    // Get all presentations sorted by creation date (newest first)
    const allImages = await imageDb.images.orderBy('createdAt').reverse().toArray();
    
    // Group by presentation ID and get unique presentation IDs
    const presentationIds = [...new Set(allImages.map(img => img.presentationId))];
    
    // Keep only the most recent presentations
    const presentationsToKeep = presentationIds.slice(0, keepCount);
    const presentationsToDelete = presentationIds.slice(keepCount);
    
    // Delete images from old presentations
    for (const presentationId of presentationsToDelete) {
      await deletePresentationImages(presentationId);
    }
    
    console.log(`🧹 Cleaned up images. Kept ${presentationsToKeep.length} presentations, deleted ${presentationsToDelete.length}`);
  } catch (error) {
    console.error('❌ Failed to clear old images:', error);
  }
}

/**
 * Get storage usage statistics
 * @returns Object with storage info
 */
export async function getStorageStats(): Promise<{
  totalImages: number;
  totalPresentations: number;
  estimatedSizeMB: number;
}> {
  try {
    const allImages = await imageDb.images.toArray();
    const uniquePresentations = new Set(allImages.map(img => img.presentationId)).size;
    
    // Rough estimate: base64 images are typically 1-3MB each
    const estimatedSizeMB = allImages.length * 1.5; // Average 1.5MB per image
    
    return {
      totalImages: allImages.length,
      totalPresentations: uniquePresentations,
      estimatedSizeMB: Math.round(estimatedSizeMB * 100) / 100
    };
  } catch (error) {
    console.error('❌ Failed to get storage stats:', error);
    return { totalImages: 0, totalPresentations: 0, estimatedSizeMB: 0 };
  }
}
