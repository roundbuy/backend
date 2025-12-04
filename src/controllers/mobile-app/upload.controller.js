const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Configure multer storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../../../uploads');
    // Ensure upload directory exists
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    // Generate unique filename with timestamp and random string
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const extension = path.extname(file.originalname);
    cb(null, 'image-' + uniqueSuffix + extension);
  }
});

// File filter for image types
const fileFilter = (req, file, cb) => {
  const allowedTypes = [
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/gif',
    'image/bmp',
    'image/vnd.microsoft.icon', // ico
    'image/webp',
    'image/avif',
    'image/svg+xml'
  ];

  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error(`Invalid file type: ${file.mimetype}. Only image files are allowed.`), false);
  }
};

// Configure multer upload
const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 300 * 1024, // 300KB in bytes
    files: 3 // Maximum 3 files
  }
}).array('images', 3); // Field name 'images', max 3 files

/**
 * Upload images
 * POST /api/v1/mobile-app/upload/images
 */
const uploadImages = async (req, res) => {
  try {
    // Use multer upload middleware
    upload(req, res, (err) => {
      if (err) {
        // Handle multer errors
        if (err instanceof multer.MulterError) {
          if (err.code === 'LIMIT_FILE_SIZE') {
            return res.status(400).json({
              success: false,
              message: 'File size too large. Maximum size is 300KB per image.'
            });
          }
          if (err.code === 'LIMIT_FILE_COUNT') {
            return res.status(400).json({
              success: false,
              message: 'Too many files. Maximum 3 images allowed.'
            });
          }
          if (err.code === 'LIMIT_UNEXPECTED_FILE') {
            return res.status(400).json({
              success: false,
              message: 'Unexpected field name. Use "images" as the field name.'
            });
          }
        }

        // Handle custom file filter errors
        return res.status(400).json({
          success: false,
          message: err.message || 'File upload error'
        });
      }

      // Check if files were uploaded
      if (!req.files || req.files.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'No image files provided'
        });
      }

      // Validate file count (should be handled by multer, but double-check)
      if (req.files.length > 3) {
        // Clean up uploaded files
        req.files.forEach(file => {
          fs.unlinkSync(file.path);
        });
        return res.status(400).json({
          success: false,
          message: 'Maximum 3 images allowed'
        });
      }

      // Validate each file size (should be handled by multer, but double-check)
      for (const file of req.files) {
        if (file.size > 300 * 1024) {
          // Clean up all uploaded files
          req.files.forEach(f => {
            fs.unlinkSync(f.path);
          });
          return res.status(400).json({
            success: false,
            message: `File ${file.originalname} exceeds 300KB limit`
          });
        }
      }

      // Generate URLs for uploaded images
      const imageUrls = req.files.map(file => {
        // Return relative URL that can be accessed via /uploads/ static route
        return `/uploads/${file.filename}`;
      });

      res.status(201).json({
        success: true,
        message: `${req.files.length} image(s) uploaded successfully`,
        data: {
          images: imageUrls,
          count: req.files.length
        }
      });
    });
  } catch (error) {
    console.error('Image upload error:', error);
    res.status(500).json({
      success: false,
      message: 'Error uploading images',
      error: error.message
    });
  }
};

module.exports = {
  uploadImages
};