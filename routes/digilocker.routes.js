const express = require('express');
const router = express.Router();
const digilockerController = require('../controllers/digilocker.controller');

const multer = require('multer');
const upload = multer({ storage: multer.memoryStorage() });

router.get('/initiate', digilockerController.initiateAuth);
router.get('/callback', digilockerController.handleCallback); // Now just a redirector
router.post('/exchange-token', digilockerController.exchangeToken); // New local logic
router.get('/session/:sessionId', digilockerController.getSession);
router.post('/verify-match', digilockerController.verifyMatch);
router.post('/finalize-verification', digilockerController.finalizeVerification);
router.post('/verify-ocr', upload.single('documentImage'), digilockerController.verifyOcr);
router.get('/issued-files', digilockerController.getIssuedFiles);
router.get('/eaadhar', digilockerController.getEAadhaar);

module.exports = router;
