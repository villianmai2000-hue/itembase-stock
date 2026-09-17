/**
 * Image compressor utility for client-side image optimization
 * Resizes large camera photos to a max dimension of 1920px and quality 0.82
 * Reduces 5MB-15MB phone photos to ~200KB-400KB while preserving high visual quality
 */
export async function compressImageFile(file, maxWidth = 1920, maxHeight = 1920, quality = 0.82) {
  // If it's a PDF, don't compress as an image
  if (file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf')) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve({
        name: file.name,
        type: 'application/pdf',
        size: file.size,
        isPdf: true,
        url: e.target.result
      });
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  // If it's an SVG or GIF, preserve directly to avoid breaking vector or animation
  if (file.type === 'image/svg+xml' || file.type === 'image/gif') {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve({
        name: file.name,
        type: file.type,
        size: file.size,
        isPdf: false,
        url: e.target.result
      });
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        let width = img.width;
        let height = img.height;

        // Calculate aspect ratio
        if (width > maxWidth || height > maxHeight) {
          if (width > height) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          } else {
            width = Math.round((width * maxHeight) / height);
            height = maxHeight;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(img, 0, 0, width, height);

        // Export as webp or png or jpeg
        const mimeType = file.type === 'image/png' ? 'image/png' : 'image/jpeg';
        const dataUrl = canvas.toDataURL(mimeType, quality);

        // Approximate byte size
        const approximateSize = Math.round((dataUrl.length - 22) * 3 / 4);

        resolve({
          name: file.name,
          type: mimeType,
          size: approximateSize,
          isPdf: false,
          url: dataUrl
        });
      };
      img.onerror = () => {
        // Fallback to original dataURL if canvas fails
        resolve({
          name: file.name,
          type: file.type || 'image/jpeg',
          size: file.size,
          isPdf: false,
          url: event.target.result
        });
      };
      img.src = event.target.result;
    };
    reader.onerror = () => {
      resolve(null);
    };
    reader.readAsDataURL(file);
  });
}
