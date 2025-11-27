import mongoose, { Document, Schema } from 'mongoose';

export interface IAppointment extends Document {
  appointmentId: string;
  patientId: string;
  doctorId: string;
  hospitalId?: string;
  appointmentDate: Date;
  appointmentTime: string;
  duration: number;
  type: 'consultation' | 'follow-up' | 'emergency' | 'video-call';
  status: 'scheduled' | 'confirmed' | 'in-progress' | 'completed' | 'cancelled' | 'no-show';
  meetingLink?: string;
  qrCode?: string;
  notes?: string;
  symptoms?: string[];
  diagnosis?: string;
  prescription?: string[];
  followUpRequired?: boolean;
  followUpDate?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const appointmentSchema = new Schema({
  appointmentId: {
    type: String,
    unique: true,
    required: true
  },
  patientId: {
    type: String,
    required: true
  },
  doctorId: {
    type: String,
    required: true
  },
  hospitalId: String,
  appointmentDate: {
    type: Date,
    required: true
  },
  appointmentTime: {
    type: String,
    required: true
  },
  duration: {
    type: Number,
    default: 30
  },
  type: {
    type: String,
    enum: ['consultation', 'follow-up', 'emergency', 'video-call'],
    required: true
  },
  status: {
    type: String,
    enum: ['scheduled', 'confirmed', 'in-progress', 'completed', 'cancelled', 'no-show'],
    default: 'scheduled'
  },
  meetingLink: String,
  qrCode: String,
  notes: String,
  symptoms: [String],
  diagnosis: String,
  prescription: [String],
  followUpRequired: {
    type: Boolean,
    default: false
  },
  followUpDate: Date
}, {
  timestamps: true
});

export default mongoose.model<IAppointment>('Appointment', appointmentSchema);
