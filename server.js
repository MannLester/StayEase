import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import multer from 'multer';
import dotenv from 'dotenv';
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json()); // For parsing application/json

// MongoDB connection
mongoose.connect(process.env.MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
})
.then(() => console.log('MongoDB connected'))
.catch(err => console.error('MongoDB connection error:', err));

// PropertyPhoto model
const propertyPhotoSchema = new mongoose.Schema({
    label: { type: String, required: true }, // Keep the label field
    photoURL: { type: Buffer, required: true }, // Store image as binary data
});

const PropertyPhoto = mongoose.model('PropertyPhoto', propertyPhotoSchema, 'propertyPhotos');

// Route to upload an image
app.post('/api/property-photos/upload', upload.single('image'), async (req, res) => {
    const { label } = req.body; // Remove uid
    const photoURL = req.file.buffer; // Get the binary data from the uploaded file

    const newPropertyPhoto = new PropertyPhoto({ label, photoURL }); // Remove uid

    try {
        const savedPhoto = await newPropertyPhoto.save();
        res.status(201).json(savedPhoto);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

// Route to get the image
app.get('/api/property-photos/:id/image', async (req, res) => {
    try {
        const propertyPhoto = await PropertyPhoto.findById(req.params.id);
        if (!propertyPhoto || !propertyPhoto.photoURL) {
            return res.status(404).send('Property photo not found');
        }
        res.set('Content-Type', 'image/jpeg'); // Set the content type based on your image type
        res.send(propertyPhoto.photoURL); // Send the binary data as a response
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Start the server
app.listen(PORT, () => {
    console.log(`Server is runn	ing on http://localhost:${PORT}`);
});
