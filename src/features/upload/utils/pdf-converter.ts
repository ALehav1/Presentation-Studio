import { pdfjs } from '../../../utils/pdf-setup';

export interface ConversionProgress {
  current: number;
  total: number;
  percentage: number;
}

export async function convertPdfToImages(
  file: File,
  onProgress?: (progress: ConversionProgress) => void
): Promise<string[]> {
  const images: string[] = [];
  
  try {
    // Convert file to array buffer
    const arrayBuffer = await file.arrayBuffer();
    
    // Load the PDF document
    const pdf = await pdfjs.getDocument({ data: arrayBuffer }).promise;
    const numPages = pdf.numPages;
    
    // Process each page
    for (let pageNum = 1; pageNum <= numPages; pageNum++) {
      // Get the page
      const page = await pdf.getPage(pageNum);
      
      // Set up canvas with proper scale for quality
      const viewport = page.getViewport({ scale: 2.0 }); // Higher scale = better quality
      const canvas = document.createElement('canvas');
      const context = canvas.getContext('2d', { willReadFrequently: true });
      
      if (!context) {
        throw new Error('Could not get canvas context');
      }
      
      canvas.width = viewport.width;
      canvas.height = viewport.height;
      
      // Render the page to canvas
      await page.render({
        canvasContext: context,
        viewport: viewport
      }).promise;
      
      // Convert canvas to image data URL
      const imageDataUrl = canvas.toDataURL('image/png');
      images.push(imageDataUrl);
      
      // Report progress
      if (onProgress) {
        onProgress({
          current: pageNum,
          total: numPages,
          percentage: Math.round((pageNum / numPages) * 100)
        });
      }
    }
    
    return images;
  } catch (error) {
    console.error('PDF conversion error:', error);
    throw new Error('Failed to convert PDF. Please try a different file.');
  }
}
