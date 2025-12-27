const crypto = require('crypto');
const QRCode = require('qrcode');

const generatePatientId = () => {
    return 'P' + Date.now().toString(36).toUpperCase() + crypto.randomBytes(2).toString('hex').toUpperCase();
};

const generateDoctorId = () => {
    return 'D' + Date.now().toString(36).toUpperCase() + crypto.randomBytes(2).toString('hex').toUpperCase();
};

const generateHospitalId = () => {
    return 'H' + Date.now().toString(36).toUpperCase() + crypto.randomBytes(2).toString('hex').toUpperCase();
};

const generateScanId = () => {
    return 'S' + Date.now().toString(36).toUpperCase() + crypto.randomBytes(3).toString('hex').toUpperCase();
};

const generateAppointmentId = () => {
    return 'A' + Date.now().toString(36).toUpperCase() + crypto.randomBytes(2).toString('hex').toUpperCase();
};

const generatePrescriptionId = () => {
    return 'RX' + Date.now().toString(36).toUpperCase() + crypto.randomBytes(2).toString('hex').toUpperCase();
};

const generateQRCode = async(data) => {
    try {
        return await QRCode.toDataURL(data);
    } catch (error) {
        throw new Error('Failed to generate QR code');
    }
};

const generateMeetingLink = (appointmentId) => {
    const baseUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    return `${baseUrl}/video-call/${appointmentId}`;
};

const calculatePriorityScore = (symptoms, age, chronicConditions) => {
    let priority = 1;

    // Critical symptoms
    const criticalSymptoms = ['chest_pain', 'difficulty_breathing', 'severe_bleeding', 'unconsciousness'];
    const urgentSymptoms = ['high_fever', 'severe_pain', 'vomiting', 'dizziness'];

    symptoms.forEach(symptom => {
        if (criticalSymptoms.includes(symptom)) priority += 4;
        else if (urgentSymptoms.includes(symptom)) priority += 2;
        else priority += 1;
    });

    // Age factor
    if (age > 65) priority += 1;
    if (age < 2) priority += 2;

    // Chronic conditions
    priority += Math.min(chronicConditions.length, 2);

    return Math.min(priority, 5);
};

module.exports = {
    generatePatientId,
    generateDoctorId,
    generateHospitalId,
    generateScanId,
    generateAppointmentId,
    generatePrescriptionId,
    generateQRCode,
    generateMeetingLink,
    calculatePriorityScore
};