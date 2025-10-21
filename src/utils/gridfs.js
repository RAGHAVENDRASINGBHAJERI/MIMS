import { GridFSBucket } from 'mongodb';
import mongoose from 'mongoose';

let gfs;

export const initGridFS = () => {
  gfs = new GridFSBucket(mongoose.connection.db, {
    bucketName: process.env.GRIDFS_BUCKET || 'bills'
  });
};

export const getGridFS = () => gfs;

export const uploadFile = (filename, fileBuffer) => {
  return new Promise((resolve, reject) => {
    const uploadStream = gfs.openUploadStream(filename);
    
    uploadStream.write(fileBuffer);
    uploadStream.end();
    
    uploadStream.on('error', reject);
    uploadStream.on('finish', () => {
      resolve(uploadStream.id);
    });
  });
};

export const downloadFile = (fileId) => {
  return gfs.openDownloadStream(fileId);
};

export const deleteFile = (fileId) => {
  return gfs.delete(fileId);
};
