import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { patientAPI } from '../services/api';

interface Doctor {
  doctorId: string;
  name: string;
  email: string;
  specialization: string[];
  experience: number;
  qualifications: string[];
  consultationFee: number;
  availability?: any;
  licenseNumber?: string;
}

interface Hospital {
  hospitalId: string;
  hospitalName: string;
  address?: any;
}

const HospitalDoctors: React.FC = () => {
  const navigate = useNavigate();
  const { hospitalId } = useParams<{ hospitalId: string }>();
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [hospital, setHospital] = useState<Hospital | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSpecialization, setSelectedSpecialization] = useState<string>('all');

  useEffect(() => {
    if (hospitalId) {
      loadDoctors();
    }
  }, [hospitalId]);

  const loadDoctors = async () => {
    try {
      setLoading(true);
      const response = await patientAPI.getDoctorsByHospital(hospitalId!);
      setDoctors(response.data?.doctors || []);
      setHospital(response.data?.hospital || null);
    } catch (error: any) {
      console.error('Error loading doctors:', error);
      alert('❌ Failed to load doctors');
    } finally {
      setLoading(false);
    }
  };

  const handleDoctorClick = (doctor: Doctor) => {
    navigate(`/doctors/${doctor.doctorId}`);
  };

  // Get all specializations for filter
  const allSpecializations = Array.from(
    new Set(doctors.flatMap(d => d.specialization || []))
  );

  // Filter doctors
  const filteredDoctors = doctors.filter(doctor => {
    const matchesSearch = doctor.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      doctor.specialization.some(s => s.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesSpecialization = selectedSpecialization === 'all' ||
      doctor.specialization.includes(selectedSpecialization);
    return matchesSearch && matchesSpecialization;
  });

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <button
                onClick={() => navigate('/find-hospitals')}
                className="text-blue-600 hover:text-blue-800 mb-2"
              >
                ← Back to Hospitals
              </button>
              <h1 className="text-2xl font-bold text-gray-900">
                {hospital?.hospitalName || 'Hospital'} - Doctors
              </h1>
              <p className="text-sm text-gray-600 mt-1">
                {hospital?.address?.fullAddress || hospital?.address?.city || ''}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Filters */}
        <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Search Doctors
              </label>
              <input
                type="text"
                placeholder="Search by name or specialization..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Specialization
              </label>
              <select
                value={selectedSpecialization}
                onChange={(e) => setSelectedSpecialization(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">All Specializations</option>
                {allSpecializations.map(spec => (
                  <option key={spec} value={spec}>{spec}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Doctors List */}
        {loading ? (
          <div className="bg-white rounded-lg shadow-sm p-12 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading doctors...</p>
          </div>
        ) : filteredDoctors.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm p-12 text-center">
            <p className="text-gray-600">No doctors found</p>
            <p className="text-sm text-gray-500 mt-2">Try adjusting your search filters</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredDoctors.map((doctor) => (
              <div
                key={doctor.doctorId}
                onClick={() => handleDoctorClick(doctor)}
                className="bg-white rounded-lg shadow-lg p-6 cursor-pointer hover:shadow-xl transition-shadow border border-gray-200 hover:border-blue-500"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h3 className="text-xl font-bold text-gray-900 mb-1">{doctor.name}</h3>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {doctor.specialization.map((spec, idx) => (
                        <span
                          key={idx}
                          className="px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded font-medium"
                        >
                          {spec}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-green-600">
                      ₹{doctor.consultationFee || 500}
                    </p>
                    <p className="text-xs text-gray-500">per consultation</p>
                  </div>
                </div>

                {/* Education & Qualifications */}
                {doctor.qualifications && doctor.qualifications.length > 0 && (
                  <div className="mb-4">
                    <p className="text-sm font-semibold text-gray-700 mb-2">📚 Education & Qualifications:</p>
                    <ul className="space-y-1">
                      {doctor.qualifications.map((qual, idx) => (
                        <li key={idx} className="text-sm text-gray-600 flex items-start">
                          <span className="mr-2">•</span>
                          <span>{qual}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Experience */}
                <div className="mb-4">
                  <p className="text-sm font-semibold text-gray-700 mb-1">💼 Experience:</p>
                  <p className="text-sm text-gray-600">{doctor.experience || 0} years</p>
                </div>

                {/* License */}
                {doctor.licenseNumber && (
                  <div className="mb-4">
                    <p className="text-sm font-semibold text-gray-700 mb-1">📋 License:</p>
                    <p className="text-sm text-gray-600">{doctor.licenseNumber}</p>
                  </div>
                )}

                {/* View Profile Button */}
                <button className="w-full mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium">
                  View Profile & Book Appointment →
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Results Count */}
        {!loading && filteredDoctors.length > 0 && (
          <div className="mt-6 text-center text-gray-600">
            <p>Showing {filteredDoctors.length} of {doctors.length} doctors</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default HospitalDoctors;

