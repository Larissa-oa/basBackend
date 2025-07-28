const multer = require('multer');
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const cloudinary = require('cloudinary').v2;

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME || 'do8nqb1cm',
  api_key: process.env.CLOUDINARY_API_KEY || '669728947363792',
  api_secret: process.env.CLOUDINARY_API_SECRET || 'v3S79P166aGmNEvrULx5cQvMiPY'
});

// Configure Cloudinary storage
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'bas-backend',
    allowed_formats: ['jpg', 'jpeg', 'png', 'gif', 'webp'],
    transformation: [{ width: 1000, height: 1000, crop: 'limit' }]
  }
});

const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Only image files are allowed!'), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB
});

// Helper function to delete image from Cloudinary
const deleteImage = async (publicId) => {
  try {
    if (publicId) {
      const result = await cloudinary.uploader.destroy(publicId);
      console.log('Image deleted from Cloudinary:', result);
      return result;
    }
  } catch (error) {
    console.error('Error deleting image from Cloudinary:', error);
  }
};

// Helper function to extract public ID from URL
const getPublicIdFromUrl = (url) => {
  if (!url) return null;
  
  // Extract public ID from Cloudinary URL
  const match = url.match(/\/v\d+\/([^\/]+)\./);
  return match ? match[1] : null;
};

module.exports = { upload, deleteImage, getPublicIdFromUrl };
