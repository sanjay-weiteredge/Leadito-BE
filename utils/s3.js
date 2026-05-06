const { S3Client, GetObjectCommand } = require('@aws-sdk/client-s3');
const { Upload } = require('@aws-sdk/lib-storage');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');
const multer = require('multer');
const path = require('path');
require('dotenv').config();

const s3Client = new S3Client({
    region: process.env.S3_REGION,
    credentials: {
        accessKeyId: process.env.S3_ACCESS_KEY,
        secretAccessKey: process.env.S3_SECRET_KEY,
    },
});

const storage = multer.memoryStorage();

const upload = multer({
    storage: storage,
    limits: { fileSize: 50 * 1024 * 1024 }, // 50MB limit for videos
    fileFilter: (req, file, cb) => {
        const filetypes = /jpeg|jpg|png|webp|mp4|mov|m4v/;
        const mimetype = filetypes.test(file.mimetype);
        const extname = filetypes.test(path.extname(file.originalname).toLowerCase());

        if (mimetype || extname) {
            return cb(null, true);
        }
        cb(new Error('Only images and videos are allowed'));
    },
});

const uploadToS3 = async (file, folder = 'logos') => {
    const fileName = `${folder}/${Date.now()}_${path.basename(file.originalname).replace(/\s/g, '_')}`;

    const parallelUploads3 = new Upload({
        client: s3Client,
        params: {
            Bucket: process.env.S3_BUCKET_NAME,
            Key: fileName,
            Body: file.buffer,
            ContentType: file.mimetype,
        },
    });

    await parallelUploads3.done();
    return fileName; // Returns shortened key for DB storage
};

const isS3Value = (value) => {
    if (!value) return false;
    const clean = value.trim();
    return (
        clean.startsWith('logos/') ||
        clean.includes('amazonaws.com')
    );
};

const extractS3Key = (value) => {
    if (!value) return null;
    if (value.includes('amazonaws.com')) {
        // Extract key from full URL: https://bucket.s3.region.amazonaws.com/key
        try {
            const url = new URL(value);
            return url.pathname.startsWith('/') ? url.pathname.substring(1) : url.pathname;
        } catch (e) {
            return null;
        }
    }
    return value;
};

const getSignedUrlForView = async (s3Value) => {
    const key = extractS3Key(s3Value);
    if (!key) return null;

    try {
        const command = new GetObjectCommand({
            Bucket: process.env.S3_BUCKET_NAME,
            Key: key,
        });

        return await getSignedUrl(s3Client, command, { expiresIn: 86400 }); // 24h
    } catch (error) {
        console.error('Error generating signed URL:', error);
        return null;
    }
};

module.exports = { upload, uploadToS3, getSignedUrlForView, isS3Value };

