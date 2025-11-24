const fs = require('fs');
const path = require('path');

/**
 * Check if file is an image
 */
const isImageFile = (filename) => {
  const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.webp'];
  const ext = path.extname(filename).toLowerCase();
  return imageExtensions.includes(ext);
};

/**
 * Convert image to base64 for AI processing
 */
const imageToBase64 = (filePath) => {
  try {
    if (!fs.existsSync(filePath)) {
      throw new Error('File not found');
    }
    const imageBuffer = fs.readFileSync(filePath);
    const base64 = imageBuffer.toString('base64');
    const ext = path.extname(filePath).toLowerCase().replace('.', '');
    const mimeType = `image/${ext === 'jpg' ? 'jpeg' : ext}`;
    return {
      data: base64,
      mimeType: mimeType
    };
  } catch (error) {
    console.error('Image to Base64 Error:', error);
    throw error;
  }
};

/**
 * Process multiple images for AI analysis
 */
const processImagesForAI = async (filePaths) => {
  const images = [];
  for (const filePath of filePaths) {
    if (isImageFile(filePath)) {
      try {
        const imageData = imageToBase64(filePath);
        images.push(imageData);
      } catch (error) {
        console.warn(`Failed to process image ${filePath}:`, error.message);
      }
    }
  }
  return images;
};

/**
 * Get file type category
 */
const getFileCategory = (filename, recordType) => {
  const ext = path.extname(filename).toLowerCase();
  
  if (recordType === 'xray') {
    return 'chest_xray';
  }
  if (recordType === 'lab_test') {
    if (['.jpg', '.jpeg', '.png'].includes(ext)) {
      return 'lab_report_image';
    }
    return 'lab_report_document';
  }
  if (['.jpg', '.jpeg', '.png', '.gif', '.bmp'].includes(ext)) {
    return 'medical_image';
  }
  return 'document';
};

module.exports = {
  isImageFile,
  imageToBase64,
  processImagesForAI,
  getFileCategory
};

