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
  availability?: {
    monday?: { available: boolean; startTime: string; endTime: string };
    tuesday?: { available: boolean; startTime: string; endTime: string };
    wednesday?: { available: boolean; startTime: string; endTime: string };
    thursday?: { available: boolean; startTime: string; endTime: string };
    friday?: { available: boolean; startTime: string; endTime: string };
    saturday?: { available: boolean; startTime: string; endTime: string };
    sunday?: { available: boolean; startTime: string; endTime: string };
  };
  licenseNumber?: string;
  hospitalAffiliation?: string;
}

const DoctorDetail: React.FC = () => {
  const navigate = useNavigate();
  const { doctorId } = useParams<{ doctorId: string }>();
  const [doctor, setDoctor] = useState<Doctor | null>(null);
  const [loading, setLoading] = useState(true);

  // Booking form state
  const [bookingForm, setBookingForm] = useState({
    date: '',
    time: '',
    type: 'consultation',
    symptoms: '',
    notes: ''
  });
  const [availableSlots, setAvailableSlots] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);

  const loadDoctorDetails = React.useCallback(async () => {
    try {
      setLoading(true);
      const response = await patientAPI.getDoctorDetails(doctorId!);
      if (response.success && response.data) {
        setDoctor(response.data);
        generateAvailableSlots(response.data);
      } else {
        throw new Error('Doctor not found');
      }
    } catch (error: any) {
      console.error('Error loading doctor:', error);
      alert('❌ Failed to load doctor details');
    } finally {
      setLoading(false);
    }
  }, [doctorId]);

  useEffect(() => {
    if (doctorId) {
      loadDoctorDetails();
    }
  }, [doctorId, loadDoctorDetails]);

  const generateAvailableSlots = (doc: Doctor) => {
    // Generate time slots based on availability
    const slots: string[] = [];
    const today = new Date();

    // Generate slots for next 7 days
    const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];

    for (let day = 0; day < 7; day++) {
      const date = new Date(today);
      date.setDate(date.getDate() + day);
      const dayIndex = date.getDay();
      const dayName = dayNames[dayIndex];

      // Handle both old format (monday, tuesday) and new format
      const dayKey = dayName as keyof typeof doc.availability;
      const dayAvailability = doc.availability?.[dayKey] as any;

      // Check if available (handle both object and boolean)
      const isAvailable = dayAvailability &&
        (typeof dayAvailability === 'object' && dayAvailability !== null
          ? dayAvailability.available !== false
          : dayAvailability === true);

      if (isAvailable) {
        let start = '09:00';
        let end = '17:00';

        if (typeof dayAvailability === 'object' && dayAvailability !== null) {
          start = dayAvailability.startTime || '09:00';
          end = dayAvailability.endTime || '17:00';
        }

        // Generate 30-minute slots
        const [startHour, startMin] = start.split(':').map(Number);
        const [endHour, endMin] = end.split(':').map(Number);
        const startMinutes = startHour * 60 + startMin;
        const endMinutes = endHour * 60 + endMin;

        for (let minutes = startMinutes; minutes < endMinutes; minutes += 30) {
          const hour = Math.floor(minutes / 60);
          const min = minutes % 60;
          const timeSlot = `${hour.toString().padStart(2, '0')}:${min.toString().padStart(2, '0')}`;
          const dateStr = date.toISOString().split('T')[0];
          slots.push(`${dateStr} ${timeSlot}`);
        }
      }
    }

    setAvailableSlots(slots);
  };

  const handleBookingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!doctor || !bookingForm.date || !bookingForm.time) {
      alert('Please select date and time');
      return;
    }

    try {
      setSubmitting(true);
      const appointmentData = {
        doctorId: doctor.doctorId,
        appointmentDate: bookingForm.date,
        appointmentTime: bookingForm.time,
        type: bookingForm.type,
        symptoms: bookingForm.symptoms,
        notes: bookingForm.notes
      };

      await patientAPI.bookAppointment(appointmentData);
      alert('✅ Appointment booked successfully!');
      navigate('/patient-dashboard');
    } catch (error: any) {
      console.error('Booking error:', error);
      alert('❌ Failed to book appointment: ' + (error.message || 'Unknown error'));
    } finally {
      setSubmitting(false);
    }
  };

  const getDayAvailability = (day: string) => {
    if (!doctor?.availability) return null;
    const dayKey = day.toLowerCase() as keyof typeof doctor.availability;
    const availability = doctor.availability[dayKey] as any;

    // Handle both object format and simple boolean
    if (typeof availability === 'object' && availability !== null) {
      return availability;
    } else if (availability === true) {
      return { available: true, startTime: '09:00', endTime: '17:00' };
    }
    return null;
  };

  const weekDays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading doctor details...</p>
        </div>
      </div>
    );
  }

  if (!doctor) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600 mb-4">Doctor not found</p>
          <button
            onClick={() => navigate('/find-hospitals')}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Back to Hospitals
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <button
            onClick={() => navigate(-1)}
            className="text-blue-600 hover:text-blue-800 mb-4"
          >
            ← Back
          </button>
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{doctor.name}</h1>
              <div className="flex flex-wrap gap-2 mt-2">
                {doctor.specialization.map((spec, idx) => (
                  <span
                    key={idx}
                    className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium"
                  >
                    {spec}
                  </span>
                ))}
              </div>
            </div>
            <div className="text-right">
              <p className="text-3xl font-bold text-green-600">₹{doctor.consultationFee || 500}</p>
              <p className="text-sm text-gray-500">per consultation</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Doctor Info */}
          <div className="lg:col-span-2 space-y-6">
            {/* Education & Qualifications */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">📚 Education & Qualifications</h2>
              <ul className="space-y-3">
                {doctor.qualifications && doctor.qualifications.length > 0 ? (
                  doctor.qualifications.map((qual, idx) => (
                    <li key={idx} className="flex items-start">
                      <span className="text-green-500 mr-3 text-xl">✓</span>
                      <span className="text-gray-700">{qual}</span>
                    </li>
                  ))
                ) : (
                  <li className="text-gray-500">No qualifications listed</li>
                )}
              </ul>
            </div>

            {/* Experience */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">💼 Experience</h2>
              <p className="text-2xl font-bold text-blue-600">{doctor.experience || 0} years</p>
              <p className="text-gray-600 mt-2">of medical practice</p>
            </div>

            {/* Availability Schedule */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">📅 Availability</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {weekDays.map((day) => {
                  const availability = getDayAvailability(day);
                  return (
                    <div
                      key={day}
                      className={`p-3 rounded-lg border-2 ${availability?.available
                        ? 'border-green-200 bg-green-50'
                        : 'border-gray-200 bg-gray-50'
                        }`}
                    >
                      <p className="font-semibold text-sm text-gray-700">{day.slice(0, 3)}</p>
                      {availability?.available ? (
                        <p className="text-xs text-green-600 mt-1">
                          {availability.startTime} - {availability.endTime}
                        </p>
                      ) : (
                        <p className="text-xs text-gray-400 mt-1">Closed</p>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* License */}
            {doctor.licenseNumber && (
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-2">📋 License</h2>
                <p className="text-gray-700">License Number: {doctor.licenseNumber}</p>
              </div>
            )}
          </div>

          {/* Right Column - Booking */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-sm p-6 sticky top-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">📅 Book Appointment</h2>

              <form onSubmit={handleBookingSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Appointment Date
                  </label>
                  <input
                    type="date"
                    required
                    min={new Date().toISOString().split('T')[0]}
                    value={bookingForm.date}
                    onChange={(e) => {
                      setBookingForm(prev => ({ ...prev, date: e.target.value }));
                      // Filter available slots for selected date
                    }}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Time Slot
                  </label>
                  <select
                    required
                    value={bookingForm.time}
                    onChange={(e) => setBookingForm(prev => ({ ...prev, time: e.target.value }))}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Select time</option>
                    {availableSlots
                      .filter(slot => slot.startsWith(bookingForm.date || ''))
                      .map(slot => {
                        const time = slot.split(' ')[1];
                        return (
                          <option key={slot} value={time}>
                            {time}
                          </option>
                        );
                      })}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Appointment Type
                  </label>
                  <select
                    required
                    value={bookingForm.type}
                    onChange={(e) => setBookingForm(prev => ({ ...prev, type: e.target.value }))}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="consultation">Consultation</option>
                    <option value="follow-up">Follow-up</option>
                    <option value="checkup">Routine Checkup</option>
                    <option value="emergency">Emergency</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Symptoms / Reason
                  </label>
                  <textarea
                    value={bookingForm.symptoms}
                    onChange={(e) => setBookingForm(prev => ({ ...prev, symptoms: e.target.value }))}
                    placeholder="Describe your symptoms or reason for visit..."
                    rows={3}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Additional Notes (Optional)
                  </label>
                  <textarea
                    value={bookingForm.notes}
                    onChange={(e) => setBookingForm(prev => ({ ...prev, notes: e.target.value }))}
                    placeholder="Any additional information..."
                    rows={2}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className={`w-full py-3 px-4 rounded-lg font-semibold text-white transition-all ${submitting
                    ? 'bg-gray-400 cursor-not-allowed'
                    : 'bg-blue-600 hover:bg-blue-700 transform hover:scale-105'
                    }`}
                >
                  {submitting ? 'Booking...' : `Book Appointment - ₹${doctor.consultationFee || 500}`}
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DoctorDetail;

