const crypto = require('crypto');

// Generate random string
const generateRandomString = (length = 32) => {
    return crypto.randomBytes(length).toString('hex');
};

// Generate unique ID
const generateUniqueId = () => {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
};

// Validate email format
const isValidEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
};

// Validate phone number (Indian format)
const isValidPhoneNumber = (phone) => {
    const phoneRegex = /^[6-9]\d{9}$/;
    return phoneRegex.test(phone);
};

// Calculate age from date of birth
const calculateAge = (dateOfBirth) => {
    const today = new Date();
    const birthDate = new Date(dateOfBirth);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();

    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
        age--;
    }

    return age;
};

// Calculate distance between two coordinates (Haversine formula)
const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371; // Earth's radius in kilometers
    const dLat = deg2rad(lat2 - lat1);
    const dLon = deg2rad(lon2 - lon1);
    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c;
    return distance;
};

const deg2rad = (deg) => {
    return deg * (Math.PI / 180);
};

// Format date for display
const formatDate = (date, format = 'DD/MM/YYYY') => {
    const d = new Date(date);
    const day = d.getDate().toString().padStart(2, '0');
    const month = (d.getMonth() + 1).toString().padStart(2, '0');
    const year = d.getFullYear();

    switch (format) {
        case 'DD/MM/YYYY':
            return `${day}/${month}/${year}`;
        case 'MM/DD/YYYY':
            return `${month}/${day}/${year}`;
        case 'YYYY-MM-DD':
            return `${year}-${month}-${day}`;
        default:
            return d.toLocaleDateString();
    }
};

// Format time ago
const timeAgo = (date) => {
    const now = new Date();
    const past = new Date(date);
    const diffInSeconds = Math.floor((now - past) / 1000);

    if (diffInSeconds < 60) {
        return 'just now';
    } else if (diffInSeconds < 3600) {
        const minutes = Math.floor(diffInSeconds / 60);
        return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
    } else if (diffInSeconds < 86400) {
        const hours = Math.floor(diffInSeconds / 3600);
        return `${hours} hour${hours > 1 ? 's' : ''} ago`;
    } else if (diffInSeconds < 2592000) {
        const days = Math.floor(diffInSeconds / 86400);
        return `${days} day${days > 1 ? 's' : ''} ago`;
    } else {
        return formatDate(past);
    }
};

// Sanitize string (remove special characters)
const sanitizeString = (str) => {
    return str.replace(/[^a-zA-Z0-9\s]/g, '').trim();
};

// Generate slug from string
const generateSlug = (str) => {
    return str
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .trim('-');
};

// Check if string contains profanity (basic implementation)
const containsProfanity = (str) => {
    const profanityWords = [
        'badword1', 'badword2', 'badword3' // Add actual profanity words
    ];

    const lowerStr = str.toLowerCase();
    return profanityWords.some(word => lowerStr.includes(word));
};

// Validate image file
const isValidImageFile = (filename, mimetype) => {
    const allowedExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp'];
    const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];

    const extension = filename.toLowerCase().substring(filename.lastIndexOf('.'));
    return allowedExtensions.includes(extension) && allowedMimeTypes.includes(mimetype);
};

// Generate OTP
const generateOTP = (length = 6) => {
    const digits = '0123456789';
    let OTP = '';
    for (let i = 0; i < length; i++) {
        OTP += digits[Math.floor(Math.random() * 10)];
    }
    return OTP;
};

// Mask email
const maskEmail = (email) => {
    const [localPart, domain] = email.split('@');
    const maskedLocal = localPart.substring(0, 2) + '*'.repeat(localPart.length - 2);
    return `${maskedLocal}@${domain}`;
};

// Mask phone number
const maskPhoneNumber = (phone) => {
    return phone.substring(0, 2) + '*'.repeat(phone.length - 4) + phone.substring(phone.length - 2);
};

// Calculate compatibility score
const calculateCompatibility = (profile1, profile2) => {
    let score = 0;
    let factors = 0;

    // Age compatibility
    if (profile1.age && profile2.age) {
        const ageDiff = Math.abs(profile1.age - profile2.age);
        const ageScore = Math.max(0, 100 - (ageDiff * 2));
        score += ageScore;
        factors++;
    }

    // Interest compatibility
    if (profile1.interests && profile2.interests) {
        const commonInterests = profile1.interests.filter(interest =>
            profile2.interests.includes(interest)
        );
        const interestScore = (commonInterests.length / Math.max(profile1.interests.length, profile2.interests.length)) * 100;
        score += interestScore;
        factors++;
    }

    // Location compatibility
    if (profile1.location && profile2.location) {
        const distance = calculateDistance(
            profile1.location.latitude,
            profile1.location.longitude,
            profile2.location.latitude,
            profile2.location.longitude
        );
        const locationScore = Math.max(0, 100 - (distance * 2));
        score += locationScore;
        factors++;
    }

    return factors > 0 ? Math.round(score / factors) : 0;
};

// Pagination helper
const paginate = (array, page = 1, limit = 10) => {
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;

    return {
        data: array.slice(startIndex, endIndex),
        pagination: {
            page,
            limit,
            total: array.length,
            pages: Math.ceil(array.length / limit),
            hasNext: endIndex < array.length,
            hasPrev: page > 1
        }
    };
};

// Error response helper
const errorResponse = (message, statusCode = 400, errors = null) => {
    return {
        success: false,
        message,
        ...(errors && { errors }),
        statusCode
    };
};

// Success response helper
const successResponse = (message, data = null, statusCode = 200) => {
    return {
        success: true,
        message,
        ...(data && { data }),
        statusCode
    };
};

module.exports = {
    generateRandomString,
    generateUniqueId,
    isValidEmail,
    isValidPhoneNumber,
    calculateAge,
    calculateDistance,
    formatDate,
    timeAgo,
    sanitizeString,
    generateSlug,
    containsProfanity,
    isValidImageFile,
    generateOTP,
    maskEmail,
    maskPhoneNumber,
    calculateCompatibility,
    paginate,
    errorResponse,
    successResponse
};