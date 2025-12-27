import mongoose, { Document, Schema } from 'mongoose';

export interface IMedicalScan extends Document {
  scanId: string;
  patientId: string;
  doctorId?: string;
  hospitalId?: string;
  scanType: 'chest-xray' | 'brain-mri' | 'bone-xray' | 'ct-scan' | 'ultrasound';
  filePath: string;
  fileSize: number;
  uploadedBy: mongoose.Types.ObjectId;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  aiAnalysis?: {
    confidence: number;
    findings: string[];
    recommendations: string[];
    processingTime: number;
    modelVersion: string;
    requiresDoctorReview: boolean;
  };
  doctorReview?: {
    reviewedBy: mongoose.Types.ObjectId;
    notes: string;
    approved: boolean;
    reviewDate: Date;
  };
  metadata: {
    originalName: string;
    mimeType: string;
    dimensions?: {
      width: number;
      height: number;
    };
  };
  createdAt: Date;
  updatedAt: Date;
}

const medicalScanSchema = new Schema({
  scanId: {
    type: String,
    unique: true,
    required: true
  },
  patientId: {
    type: String,
    required: true
  },
  doctorId: String,
  hospitalId: String,
  scanType: {
    type: String,
    required: true,
    enum: ['chest-xray', 'brain-mri', 'bone-xray', 'ct-scan', 'ultrasound']
  },
  filePath: {
    type: String,
    required: true
  },
  fileSize: Number,
  uploadedBy: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'processing', 'completed', 'failed'],
    default: 'pending'
  },
  aiAnalysis: {
    confidence: Number,
    findings: [String],
    recommendations: [String],
    processingTime: Number,
    modelVersion: String,
    requiresDoctorReview: Boolean
  },
  doctorReview: {
    reviewedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User'
    },
    notes: String,
    approved: Boolean,
    reviewDate: Date
  },
  metadata: {
    originalName: String,
    mimeType: String,
    dimensions: {
      width: Number,
      height: Number
    }
  }
}, {
  timestamps: true
});

export default mongoose.model<IMedicalScan>('MedicalScan', medicalScanSchema);
