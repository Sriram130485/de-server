const bcrypt = require("bcryptjs");

exports.generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

exports.hashOTP = async (otp) => {
  return await bcrypt.hash(otp, 10);
};

exports.verifyOTP = async (otp, hashedOTP) => {
  return await bcrypt.compare(otp, hashedOTP);
};
