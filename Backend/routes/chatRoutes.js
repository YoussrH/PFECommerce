const express = require('express');
const multer = require('multer');
const { handleChat } = require('../controllers/chatController');

const router = express.Router();

// Configure multer for file uploads
const upload = multer({ dest: 'uploads/' });

router.post('/handleChat', upload.single('image'), handleChat);

module.exports = router;