const express = require('express');
const router = express.Router();
const userController = require('../controllers/user.controller');

router.post('/register-driver', userController.registerDriver);
router.get('/status/:userId', userController.getDriverStatus);

module.exports = router;
