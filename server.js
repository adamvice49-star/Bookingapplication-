const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const QRCode = require('qrcode');
const app = express();
const PORT = process.env.PORT || 5000;
const express = require('express');
const express = require('express');
const path = require('path');

// Serve static files from the public directory explicitly
app.use(express.static('public'));

// Fallback to serve index.html for any frontend route requests
app.get('*', (req, res) => {
  res.sendFile(path.resolve('public', 'index.html'));
});



app.use(cors());
app.use(bodyParser.json());
app.use(express.static('public'));

// In-memory storage for OTPs and user sessions
const userSessions = {};

// Generate a random OTP
function generateOTP() {
    return Math.floor(100000 + Math.random() * 900000).toString();
}

// API to handle user login and OTP generation
app.post('/api/login', (req, res) => {
    const username = typeof req.body?.username === 'string' ? req.body.username.trim() : '';
    const mobile = typeof req.body?.mobile === 'string' ? req.body.mobile.trim() : '';
    if (username.length < 3 || username.length > 60 || !/^\d{10}$/.test(mobile)) {
        return res.status(400).json({ error: 'Enter a name and a valid 10-digit mobile number.' });
    }
    const otp = generateOTP();
    userSessions[mobile] = { username, otp };
    // In a real application, you would send the OTP via SMS
    return res.status(200).json({ message: 'OTP generated successfully.', otp });
});

// API to verify OTP
app.post('/api/verify-otp', (req, res) => {
    const mobile = typeof req.body?.mobile === 'string' ? req.body.mobile.trim() : '';
    const otp = typeof req.body?.otp === 'string' ? req.body.otp.trim() : '';
    const session = userSessions[mobile];
    if (!/^\d{10}$/.test(mobile) || !/^\d{6}$/.test(otp) || !session || session.otp !== otp) {
        return res.status(400).json({ error: 'Invalid OTP.' });
    }
    // OTP verified, redirect to home page
    delete userSessions[mobile]; // Clear session after verification
    return res.status(200).json({ message: 'Login successful.', username: session.username });
});

app.post('/api/qr', async (req, res) => {
    const data = req.body?.data;
    if (typeof data !== 'string' || !data.trim() || data.length > 256) {
        return res.status(400).json({ error: 'QR data must be a non-empty string under 256 characters.' });
    }

    try {
        const image = await QRCode.toDataURL(data, { width: 180, margin: 1 });
        return res.status(200).json({ image });
    } catch (error) {
        console.error('Could not generate QR code:', error);
        return res.status(500).json({ error: 'Could not generate a QR code.' });
    }
});

app.use((error, req, res, next) => {
    if (req.path.startsWith('/api/')) {
        if (error.type === 'entity.too.large') {
            return res.status(413).json({ error: 'Request is too large.' });
        }
        if (error instanceof SyntaxError && error.type === 'entity.parse.failed') {
            return res.status(400).json({ error: 'Request body must contain valid JSON.' });
        }
        console.error('API request failed:', error);
        return res.status(500).json({ error: 'The server could not complete the request.' });
    }
    return next(error);
});

// Start the server
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});