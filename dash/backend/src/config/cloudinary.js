const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const multer = require('multer');
require('dotenv').config();

// Configuration Cloudinary
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME || 'djhq6legc',
    api_key: process.env.CLOUDINARY_API_KEY || '491628491696291',
    api_secret: process.env.CLOUDINARY_API_SECRET || 'PohiW4vr2wMqZgtuJNM4dPdczcs'
});

// Configuration du stockage
const storage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: {
        folder: 'blacksnack',
        allowed_formats: ['jpg', 'png', 'jpeg', 'gif', 'webp'],
        transformation: [{ width: 1000, height: 1000, crop: 'limit' }]
    }
});

const upload = multer({ storage: storage });

module.exports = {
    cloudinary,
    upload
};
