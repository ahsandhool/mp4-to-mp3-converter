const express = require('express');
const multer = require('multer');
const ffmpeg = require('fluent-ffmpeg');
const path = require('path');
const fs = require('fs');

const app = express();
const port = 5000;

// Set up storage for multer
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/'); // Save uploaded files in the 'uploads' directory
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname)); // Unique filename
  },
});

const upload = multer({ storage });

// Route to handle the file upload and conversion
app.post('/convert', upload.single('file'), (req, res) => {
  if (!req.file) {
    return res.status(400).send('No file uploaded');
  }

  // Path to the uploaded MP4 file
  const mp4FilePath = path.join(__dirname, 'uploads', req.file.filename);

  // Path to the converted MP3 file
  const mp3FilePath = path.join(__dirname, 'downloads', req.file.filename.replace('.mp4', '.mp3'));

  // Convert MP4 to MP3 using ffmpeg
  ffmpeg(mp4FilePath)
    .output(mp3FilePath)
    .audioCodec('libmp3lame')
    .on('end', () => {
      // Send the download URL in the response
      const downloadUrl = `http://localhost:${port}/download/${path.basename(mp3FilePath)}`;
      res.json({ downloadUrl });
    })
    .on('error', (err) => {
      res.status(500).send('Error converting file: ' + err.message);
    })
    .run();
});

// Serve the converted MP3 file for download
app.get('/download/:filename', (req, res) => {
  const file = path.join(__dirname, 'downloads', req.params.filename);
  if (fs.existsSync(file)) {
    res.download(file);
  } else {
    res.status(404).send('File not found');
  }
});

// Create the 'uploads' and 'downloads' directories if they don't exist
if (!fs.existsSync('uploads')) fs.mkdirSync('uploads');
if (!fs.existsSync('downloads')) fs.mkdirSync('downloads');

// Start the server
app.listen(port, () => {
  console.log(`Server is running at http://localhost:${port}`);
});
