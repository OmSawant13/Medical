import crypto from 'crypto';
import QRCode from 'qrcode';

export const generatePatientId = (): string => {
  return 'P' + Date.now().toString(36).toUpperCase() + crypto.randomBytes(2).toString('hex').toUpperCase();
};

export const generateDoctorId = (): string => {
  return 'D' + Date.now().toString(36).toUpperCase() + crypto.randomBytes(2).toString('hex').toUpperCase();
};

export const generateHospitalId = (): string => {
  return 'H' + Date.now().toString(36).toUpperCase() + crypto.randomBytes(2).toString('hex').toUpperCase();
};

export const generateScanId = (): string => {
  return 'S' + Date.now().toString(36).toUpperCase() + crypto.randomBytes(3).toString('hex').toUpperCase();
};

export const generateAppointmentId = (): string => {
  return 'A' + Date.now().toString(36).toUpperCase() + crypto.randomBytes(2).toString('hex').toUpperCase();
};

export const generateQRCode = async (data: string): Promise<string> => {
  try {
    return await QRCode.toDataURL(data);
  } catch (error) {
    throw new Error('Failed to generate QR code');
  }
};

export const generateMeetingLink = (appointmentId: string): string => {
  const baseUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
  return `${baseUrl}/video-call/${appointmentId}`;
};

export const calculatePriorityScore = (symptoms: string[], age: number, chronicConditions: string[]): number => {
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
