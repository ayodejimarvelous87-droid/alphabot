const Joi = require("joi");

exports.registerSchema = Joi.object({
  name: Joi.string().trim().min(2).max(100).required(),
  phone: Joi.string().trim().min(10).max(15).required(),
  email: Joi.string().email().required(),
  password: Joi.string().min(6).max(100).required(),
  referralCode: Joi.string().allow("", null)
});

exports.loginSchema = Joi.object({
  phone: Joi.string().trim().required(),
  password: Joi.string().required()
});

exports.otpSchema = Joi.object({
  phone: Joi.string().trim().required(),
  otp: Joi.string().length(6).required()
});


exports.resetPasswordSchema = Joi.object({
  email: Joi.string().email().required(),
  otp: Joi.string().length(6).required(),
  newPassword: Joi.string().min(6).max(100).required()
});

exports.sendResetSchema = Joi.object({
  email: Joi.string().email().required()
});


exports.emailOtpSchema = Joi.object({
  email: Joi.string().email().required(),
  otp: Joi.string().length(6).required()
});
