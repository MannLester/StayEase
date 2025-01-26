// server.js
import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json()); // For parsing application/json

// MongoDB connection
mongoose.connect(process.env.MONGODB_URI)
    .then(() => {
        console.log('MongoDB connected');
        app.listen(PORT, () => {
            console.log(`Server is running on http://localhost:${PORT}`);
        });
    })
    .catch(err => console.error('MongoDB connection error:', err));

// User model
const userSchema = new mongoose.Schema({
    uid: { type: String, required: true },
    email: { type: String, required: true },
    displayName: { type: String },
    photoURL: { type: String },
    dateJoined: { type: Date, default: Date.now },
});

const User = mongoose.model('User', userSchema, 'accounts');

// Routes
app.post('/api/accounts', async (req, res) => {
    const { uid, email, displayName, photoURL } = req.body;
    const newUser = new User({ uid, email, displayName, photoURL });

    try {
        const savedUser = await newUser.save();
        res.status(201).json(savedUser);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

app.get('/api/accounts', async (req, res) => {
    try {
        const users = await User.find();
        res.json(users);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});