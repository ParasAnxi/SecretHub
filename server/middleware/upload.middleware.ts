//IMPORT
import multer from 'multer';

//MEMORY STORAGE
const storage = multer.memoryStorage();

//MULTER CONFIG
export const upload = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB LIMIT
  },
});
