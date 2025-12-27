export interface User {
  id: string;
  email: string;
  name: string;
  role: 'patient' | 'doctor' | 'hospital';
  createdAt: Date;
}

export interface Patient extends User {
  patientId: string;
  phone: string;
  emergencyContact: string;
  gender: 'male' | 'female' | 'other';
  medicalHistory: MedicalRecord[];
}

export interface Doctor extends User {
  doctorId: string;
  specialization: string;
  license: string;
}

export interface Hospital extends User {
  hospitalId: string;
  address: string;
  departments: string[];
}

export interface MedicalRecord {
  id: string;
  patientId: string;
  date: Date;
  diagnosis: string;
  treatment: string;
  notes: string;
}

export interface Appointment {
  id: string;
  patientId: string;
  doctorId: string;
  hospitalId?: string;
  date: Date;
  type: 'online' | 'offline';
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled';
  meetingLink?: string;
  qrCode?: string;
}

export interface ScanAnalysis {
  id: string;
  patientId: string;
  imageUrl: string;
  findings: Array<{
    type: string;
    description: string;
    confidence: number;
    region?: {
      x: number;
      y: number;
      width: number;
      height: number;
    };
  }>;
  recommendations: string[];
  timestamp: Date;
}
