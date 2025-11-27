import mongoose, { Document, Schema } from 'mongoose';

export interface IPatient extends Document {
  userId: mongoose.Types.ObjectId;
  patientId: string;
  personalInfo: {
    dateOfBirth: Date;
    gender: 'male' | 'female' | 'other';
    phone: string;
    emergencyContact: {
      name: string;
      phone: string;
      relationship: string;
    };
    address: {
      street: string;
      city: string;
      state: string;
      zipCode: string;
      country: string;
    };
  };
  medicalInfo: {
    bloodType?: string;
    allergies: string[];
    chronicConditions: string[];
    currentMedications: string[];
    insuranceInfo?: {
      provider: string;
      policyNumber: string;
    };
  };
  priorityScore: number;
  createdAt: Date;
  updatedAt: Date;
}

const patientSchema = new Schema({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  patientId: {
    type: String,
    unique: true,
    required: true
  },
  personalInfo: {
    dateOfBirth: Date,
    gender: {
      type: String,
      enum: ['male', 'female', 'other']
    },
    phone: String,
    emergencyContact: {
      name: String,
      phone: String,
      relationship: String
    },
    address: {
      street: String,
      city: String,
      state: String,
      zipCode: String,
      country: String
    }
  },
  medicalInfo: {
    bloodType: String,
    allergies: [String],
    chronicConditions: [String],
    currentMedications: [String],
    insuranceInfo: {
      provider: String,
      policyNumber: String
    }
  },
  priorityScore: {
    type: Number,
    default: 1
  }
}, {
  timestamps: true
});

export default mongoose.model<IPatient>('Patient', patientSchema);
