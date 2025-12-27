/**
 * Production-grade input validation utilities
 */

/**
 * Validate email format
 */
const validateEmail = (email) => {
  if (!email || typeof email !== 'string') {
    return { valid: false, error: 'Email is required and must be a string' };
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const normalizedEmail = email.toLowerCase().trim();

  if (!emailRegex.test(normalizedEmail)) {
    return { valid: false, error: 'Invalid email format' };
  }

  if (normalizedEmail.length > 254) {
    return { valid: false, error: 'Email is too long (max 254 characters)' };
  }

  return { valid: true, email: normalizedEmail };
};

/**
 * Validate password strength
 */
const validatePassword = (password) => {
  if (!password || typeof password !== 'string') {
    return { valid: false, error: 'Password is required and must be a string' };
  }

  if (password.length < 8) {
    return { valid: false, error: 'Password must be at least 8 characters long' };
  }

  if (password.length > 128) {
    return { valid: false, error: 'Password is too long (max 128 characters)' };
  }

  // Check for at least one uppercase letter
  if (!/[A-Z]/.test(password)) {
    return { valid: false, error: 'Password must contain at least one uppercase letter' };
  }

  // Check for at least one lowercase letter
  if (!/[a-z]/.test(password)) {
    return { valid: false, error: 'Password must contain at least one lowercase letter' };
  }

  // Check for at least one number
  if (!/[0-9]/.test(password)) {
    return { valid: false, error: 'Password must contain at least one number' };
  }

  // Check for at least one special character
  if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
    return { valid: false, error: 'Password must contain at least one special character' };
  }

  // Check for common weak passwords
  const commonPasswords = [
    'password', 'password123', '12345678', 'qwerty123',
    'admin123', 'welcome123', 'letmein', 'monkey123'
  ];
  if (commonPasswords.includes(password.toLowerCase())) {
    return { valid: false, error: 'Password is too common. Please choose a stronger password' };
  }

  return { valid: true };
};

/**
 * Validate name
 */
const validateName = (name) => {
  if (!name || typeof name !== 'string') {
    return { valid: false, error: 'Name is required and must be a string' };
  }

  const trimmedName = name.trim();

  if (trimmedName.length < 2) {
    return { valid: false, error: 'Name must be at least 2 characters long' };
  }

  if (trimmedName.length > 100) {
    return { valid: false, error: 'Name is too long (max 100 characters)' };
  }

  // Check for valid characters (letters, spaces, hyphens, apostrophes)
  if (!/^[a-zA-Z\s\-'\.]+$/.test(trimmedName)) {
    return { valid: false, error: 'Name contains invalid characters' };
  }

  return { valid: true, name: trimmedName };
};

/**
 * Validate role
 */
const validateRole = (role) => {
  const validRoles = ['patient', 'doctor', 'hospital'];
  
  if (!role || typeof role !== 'string') {
    return { valid: false, error: 'Role is required and must be a string' };
  }

  const normalizedRole = role.toLowerCase().trim();

  if (!validRoles.includes(normalizedRole)) {
    return { valid: false, error: `Invalid role. Must be one of: ${validRoles.join(', ')}` };
  }

  return { valid: true, role: normalizedRole };
};

/**
 * Sanitize string input
 */
const sanitizeString = (input) => {
  if (typeof input !== 'string') {
    return input;
  }

  return input
    .trim()
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '') // Remove script tags
    .replace(/<[^>]+>/g, '') // Remove HTML tags
    .replace(/javascript:/gi, '') // Remove javascript: protocol
    .replace(/on\w+\s*=/gi, ''); // Remove event handlers
};

/**
 * Validate and sanitize registration data
 */
const validateRegistration = (data) => {
  const errors = [];
  const sanitized = {};

  // Validate email
  const emailValidation = validateEmail(data.email);
  if (!emailValidation.valid) {
    errors.push(emailValidation.error);
  } else {
    sanitized.email = emailValidation.email;
  }

  // Validate password
  const passwordValidation = validatePassword(data.password);
  if (!passwordValidation.valid) {
    errors.push(passwordValidation.error);
  } else {
    // IMPORTANT: Do not sanitize passwords (it can remove special characters).
    // Store as-is; hashing happens in the User model pre-save hook.
    sanitized.password = data.password;
  }

  // Validate name
  const nameValidation = validateName(data.name);
  if (!nameValidation.valid) {
    errors.push(nameValidation.error);
  } else {
    sanitized.name = nameValidation.name;
  }

  // Validate role
  const roleValidation = validateRole(data.role);
  if (!roleValidation.valid) {
    errors.push(roleValidation.error);
  } else {
    sanitized.role = roleValidation.role;
  }

  return {
    valid: errors.length === 0,
    errors,
    data: sanitized
  };
};

/**
 * Validate login data
 * NOTE: Login doesn't validate password strength - only checks it exists
 */
const validateLogin = (data) => {
  const errors = [];
  const sanitized = {};

  // Validate email
  const emailValidation = validateEmail(data.email);
  if (!emailValidation.valid) {
    errors.push(emailValidation.error);
  } else {
    sanitized.email = emailValidation.email;
  }

  // Validate password (just check it exists - NO STRENGTH VALIDATION for login)
  if (!data.password || typeof data.password !== 'string' || data.password.length === 0) {
    errors.push('Password is required');
  } else {
    // Just sanitize, don't validate strength
    sanitized.password = data.password;
  }

  // Validate role (optional)
  if (data.role) {
    const roleValidation = validateRole(data.role);
    if (!roleValidation.valid) {
      errors.push(roleValidation.error);
    } else {
      sanitized.role = roleValidation.role;
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    data: sanitized
  };
};

module.exports = {
  validateEmail,
  validatePassword,
  validateName,
  validateRole,
  sanitizeString,
  validateRegistration,
  validateLogin
};
