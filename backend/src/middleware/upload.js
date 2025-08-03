const multer = require('multer');
const path = require('path');
const fs = require('fs-extra');
const { v4: uuidv4 } = require('uuid');
const logger = require('../utils/logger');

// Ensure upload directories exist
const ensureUploadDirs = () => {
  const dirs = [
    path.join(__dirname, '../../../uploads'),
    path.join(__dirname, '../../../uploads/avatars'),
    path.join(__dirname, '../../../uploads/worlds'),
    path.join(__dirname, '../../../uploads/saves'),
    path.join(__dirname, '../../../uploads/temp')
  ];

  dirs.forEach(dir => {
    fs.ensureDirSync(dir);
  });
};

// Initialize upload directories
ensureUploadDirs();

// File type validation
const imageFileFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|gif|webp/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedTypes.test(file.mimetype);

  if (mimetype && extname) {
    return cb(null, true);
  } else {
    cb(new Error('Only image files (JPEG, JPG, PNG, GIF, WebP) are allowed!'));
  }
};

const worldFileFilter = (req, file, cb) => {
  const allowedTypes = /json|zip/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());

  if (extname) {
    return cb(null, true);
  } else {
    cb(new Error('Only JSON and ZIP files are allowed for worlds!'));
  }
};

const saveFileFilter = (req, file, cb) => {
  const allowedTypes = /json/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());

  if (extname) {
    return cb(null, true);
  } else {
    cb(new Error('Only JSON files are allowed for saves!'));
  }
};

// Storage configurations
const avatarStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, '../../../uploads/avatars'));
  },
  filename: (req, file, cb) => {
    const uniqueName = `${uuidv4()}${path.extname(file.originalname)}`;
    cb(null, uniqueName);
  }
});

const worldStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, '../../../uploads/worlds'));
  },
  filename: (req, file, cb) => {
    const uniqueName = `${uuidv4()}${path.extname(file.originalname)}`;
    cb(null, uniqueName);
  }
});

const saveStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, '../../../uploads/saves'));
  },
  filename: (req, file, cb) => {
    const uniqueName = `${uuidv4()}${path.extname(file.originalname)}`;
    cb(null, uniqueName);
  }
});

const tempStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, '../../../uploads/temp'));
  },
  filename: (req, file, cb) => {
    const uniqueName = `${uuidv4()}${path.extname(file.originalname)}`;
    cb(null, uniqueName);
  }
});

// Memory storage for processing
const memoryStorage = multer.memoryStorage();

// Upload configurations
const avatarUpload = multer({
  storage: avatarStorage,
  fileFilter: imageFileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
    files: 1
  }
});

const worldUpload = multer({
  storage: worldStorage,
  fileFilter: worldFileFilter,
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB limit
    files: 1
  }
});

const saveUpload = multer({
  storage: saveStorage,
  fileFilter: saveFileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
    files: 1
  }
});

const tempUpload = multer({
  storage: tempStorage,
  limits: {
    fileSize: 100 * 1024 * 1024, // 100MB limit
    files: 5
  }
});

const memoryUpload = multer({
  storage: memoryStorage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
    files: 1
  }
});

// Cleanup utilities
const cleanupTempFiles = async () => {
  try {
    const tempDir = path.join(__dirname, '../../../uploads/temp');
    const files = await fs.readdir(tempDir);
    const now = Date.now();
    const maxAge = 24 * 60 * 60 * 1000; // 24 hours

    for (const file of files) {
      const filePath = path.join(tempDir, file);
      const stats = await fs.stat(filePath);
      
      if (now - stats.mtime.getTime() > maxAge) {
        await fs.remove(filePath);
        logger.info(`Cleaned up temp file: ${file}`);
      }
    }
  } catch (error) {
    logger.error('Error cleaning up temp files:', error);
  }
};

const deleteFile = async (filePath) => {
  try {
    if (await fs.pathExists(filePath)) {
      await fs.remove(filePath);
      logger.info(`Deleted file: ${filePath}`);
      return true;
    }
    return false;
  } catch (error) {
    logger.error(`Error deleting file ${filePath}:`, error);
    return false;
  }
};

// Middleware for handling upload errors
const handleUploadError = (error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    switch (error.code) {
      case 'LIMIT_FILE_SIZE':
        return res.status(400).json({
          error: 'File too large',
          code: 'FILE_TOO_LARGE',
          maxSize: error.field === 'avatar' ? '5MB' : error.field === 'world' ? '50MB' : '10MB'
        });
      case 'LIMIT_FILE_COUNT':
        return res.status(400).json({
          error: 'Too many files',
          code: 'TOO_MANY_FILES'
        });
      case 'LIMIT_UNEXPECTED_FILE':
        return res.status(400).json({
          error: 'Unexpected file field',
          code: 'UNEXPECTED_FILE'
        });
      default:
        return res.status(400).json({
          error: 'File upload error',
          code: 'UPLOAD_ERROR',
          details: error.message
        });
    }
  } else if (error.message.includes('Only')) {
    return res.status(400).json({
      error: error.message,
      code: 'INVALID_FILE_TYPE'
    });
  }
  
  next(error);
};

// Validation middleware
const validateFileExists = (req, res, next) => {
  if (!req.file && !req.files) {
    return res.status(400).json({
      error: 'No file uploaded',
      code: 'NO_FILE'
    });
  }
  next();
};

const validateImageFile = (req, res, next) => {
  if (!req.file) {
    return res.status(400).json({
      error: 'No image file uploaded',
      code: 'NO_IMAGE'
    });
  }

  const allowedMimes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
  if (!allowedMimes.includes(req.file.mimetype)) {
    return res.status(400).json({
      error: 'Invalid image file type',
      code: 'INVALID_IMAGE_TYPE'
    });
  }

  next();
};

// File URL generation
const getFileUrl = (fileName, type = 'uploads') => {
  const baseUrl = process.env.BASE_URL || 'http://localhost:3000';
  return `${baseUrl}/${type}/${fileName}`;
};

const getAvatarUrl = (fileName) => {
  return getFileUrl(`avatars/${fileName}`, 'uploads');
};

const getWorldUrl = (fileName) => {
  return getFileUrl(`worlds/${fileName}`, 'uploads');
};

const getSaveUrl = (fileName) => {
  return getFileUrl(`saves/${fileName}`, 'uploads');
};

// Run cleanup on startup and schedule periodic cleanup
cleanupTempFiles();
setInterval(cleanupTempFiles, 6 * 60 * 60 * 1000); // Every 6 hours

module.exports = {
  avatarUpload,
  worldUpload,
  saveUpload,
  tempUpload,
  memoryUpload,
  handleUploadError,
  validateFileExists,
  validateImageFile,
  cleanupTempFiles,
  deleteFile,
  getFileUrl,
  getAvatarUrl,
  getWorldUrl,
  getSaveUrl
};