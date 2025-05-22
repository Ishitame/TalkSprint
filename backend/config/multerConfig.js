const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Create upload directory if it doesn't exist
const uploadPath = path.join('uploads', 'audio');
if (!fs.existsSync(uploadPath)) {
  fs.mkdirSync(uploadPath, { recursive: true });
}

// Storage configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, `jam-${uniqueSuffix}${path.extname(file.originalname)}`);
  }
});

// Only accept webm audio

 const fileFilter = (req, file, cb) => {
  if (file.mimetype === 'audio/webm') {
    cb(null, true);
  } else {
    cb(new Error('Only .wav audio files are allowed'), false);
  }
};


const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10 MB
  }
});

module.exports = upload;
