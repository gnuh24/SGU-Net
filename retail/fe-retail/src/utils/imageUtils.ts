/**
 * Helper function to build full image URL from relative path or filename
 * @param imageUrl - Full URL or relative path from backend (e.g., "/images/filename.jpg")
 * @param image - Just the filename (e.g., "filename.jpg")
 * @returns Full URL to the image
 */
export const getImageUrl = (imageUrl?: string, image?: string): string | null => {
  const BACKEND_BASE_URL = "http://localhost:5260";
  
  // If imageUrl is provided
  if (imageUrl) {
    // If it's already a full URL, return as is
    if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) {
      return imageUrl;
    }
    // If it's a relative path, add base URL
    return `${BACKEND_BASE_URL}${imageUrl.startsWith('/') ? '' : '/'}${imageUrl}`;
  }
  
  // If only image filename is provided
  if (image) {
    return `${BACKEND_BASE_URL}/images/${image}`;
  }
  
  return null;
};

