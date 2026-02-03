require('dotenv').config();
const nodemailer = require('nodemailer');

console.log('Testing SMTP connection...');
console.log(`Host: ${process.env.SMTP_HOST}`);
console.log(`Port: ${process.env.SMTP_PORT}`);
console.log(`Secure: ${process.env.SMTP_SECURE}`);
console.log(`User: ${process.env.SMTP_USER}`);

const config = {
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT),
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASSWORD
    }
};

const transporter = nodemailer.createTransport(config);

transporter.verify((error, success) => {
    if (error) {
        console.error('❌ Connection failed:', error);
        process.exit(1);
    } else {
        console.log('✅ Connection successful! Server is ready to take our messages');
        process.exit(0);
    }
});
