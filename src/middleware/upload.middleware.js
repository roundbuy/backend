const multer = require('multer');
const path = require('path');
const fs = require('fs');

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        // You can conditionally change dest based on req.baseUrl or file.fieldname
        let dest = 'uploads/misc/';
        if (req.baseUrl.includes('kyc')) dest = 'uploads/kyc/';
        if (req.baseUrl.includes('events')) dest = 'uploads/events/';

        // Ensure directory exists
        const fullDest = path.join(__dirname, '../../', dest);
        if (!fs.existsSync(fullDest)) {
            fs.mkdirSync(fullDest, { recursive: true });
        }
        cb(null, dest);
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({ storage: storage });

module.exports = upload;
