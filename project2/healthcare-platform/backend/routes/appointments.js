const express = require('express');
const Appointment = require('../models/Appointment');
const Patient = require('../models/Patient');
const Doctor = require('../models/Doctor');
const { authenticateToken, authorizeRoles, validateHIPAA } = require('../middleware/auth');
const { generateAppointmentId, generateQRCode, generateMeetingLink } = require('../utils/generators');

const router = express.Router();

// Add route-level logging to catch ALL requests to this router
router.use((req, res, next) => {
    console.log(`🔍 Appointments Router: ${req.method} ${req.path} ${req.originalUrl}`);
    if (req.path.includes('cancel')) {
        console.log(`   🚨 CANCEL ROUTE REQUEST: ${req.method} ${req.path}`);
    }
    next();
});

router.use(authenticateToken);
router.use(validateHIPAA);

// Debug: Log route registration
console.log('✅ Appointments routes loaded: PUT /:appointmentId/cancel');

// Debug: Log all routes being registered
console.log('📋 Appointments routes registered:');
console.log('   POST /');
console.log('   PUT /:appointmentId/cancel');
console.log('   GET /');
console.log('   PUT /:appointmentId/status');
console.log('   POST /:appointmentId/checkin');

// Create new appointment
router.post('/', authorizeRoles('patient', 'doctor', 'hospital'), async(req, res) => {
    try {
        const { patientId, doctorId, hospitalId, appointmentDate, appointmentTime, type, symptoms } = req.body;

        if (!patientId || !doctorId || !appointmentDate || !appointmentTime || !type) {
            return res.status(400).json({
                success: false,
                error: 'Missing required fields'
            });
        }

        // Verify patient and doctor exist
        const [patient, doctor] = await Promise.all([
            Patient.findOne({ patientId }),
            Doctor.findOne({ doctorId })
        ]);

        if (!patient) {
            return res.status(404).json({
                success: false,
                error: 'Patient not found'
            });
        }

        if (!doctor) {
            return res.status(404).json({
                success: false,
                error: 'Doctor not found'
            });
        }

        const appointmentId = generateAppointmentId();

        // Generate QR code and meeting link
        const qrCode = await generateQRCode(appointmentId);
        const meetingLink = generateMeetingLink(appointmentId);

        const appointment = new Appointment({
            appointmentId,
            patientId,
            doctorId,
            hospitalId: hospitalId || null, // Save hospitalId if provided
            appointmentDate: new Date(appointmentDate),
            appointmentTime,
            type,
            symptoms: symptoms || [],
            status: 'scheduled', // Explicitly set status to 'scheduled'
            qrCode,
            meetingLink: type === 'video-call' ? meetingLink : undefined
        });

        await appointment.save();
        
        console.log(`✅ Appointment created: ${appointmentId}`);
        console.log(`   Patient: ${patientId}`);
        console.log(`   Doctor: ${doctorId} (${doctor.userId?.name || doctor.name || 'Unknown'})`);
        console.log(`   Doctor's actual doctorId in DB: ${doctor.doctorId}`);
        console.log(`   Appointment saved with doctorId: ${appointment.doctorId}`);
        console.log(`   Date: ${appointmentDate}`);
        console.log(`   Status: scheduled`);
        
        // Verify the appointment was saved correctly
        const savedAppointment = await Appointment.findOne({ appointmentId });
        if (savedAppointment) {
            console.log(`   ✅ Verification: Saved appointment doctorId = ${savedAppointment.doctorId}`);
        } else {
            console.log(`   ❌ ERROR: Appointment not found after save!`);
        }

        // If hospitalId is provided, update doctor's hospitalAffiliation to ensure they appear in that hospital's doctor list
        if (hospitalId && doctor.hospitalAffiliation !== hospitalId) {
            await Doctor.updateOne(
                { doctorId },
                { $set: { hospitalAffiliation: hospitalId } }
            );
            console.log(`✅ Updated doctor ${doctorId} hospitalAffiliation to ${hospitalId}`);
        }

        // Notify via Socket.IO
        if (global.io) {
            global.io.to(`doctor_${doctorId}`).emit('new_appointment', {
                appointmentId,
                patientName: patient.personalInfo && patient.personalInfo.name || 'Patient',
                appointmentDate,
                appointmentTime,
                type,
                symptoms: symptoms || []
            });

            global.io.to(`patient_${patientId}`).emit('appointment_confirmed', {
                appointmentId,
                doctorName: doctor.name || 'Doctor',
                appointmentDate,
                appointmentTime,
                qrCode,
                meetingLink: type === 'video-call' ? meetingLink : undefined
            });
        }

        res.status(201).json({
            success: true,
            message: 'Appointment created successfully',
            data: {
                appointmentId,
                patientId,
                doctorId,
                appointmentDate,
                appointmentTime,
                type,
                status: 'scheduled',
                qrCode,
                meetingLink: type === 'video-call' ? meetingLink : undefined
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: 'Failed to create appointment',
            details: error.message
        });
    }
});

// Cancel appointment (patient can cancel their own appointments)
// IMPORTANT: This route MUST be defined BEFORE the GET / route to avoid route conflicts
router.put('/:appointmentId/cancel', authorizeRoles('patient', 'doctor', 'hospital'), async(req, res) => {
    console.log(`🔄 ========== CANCEL ROUTE HIT ==========`);
    console.log(`   PUT /:appointmentId/cancel - appointmentId: ${req.params.appointmentId}`);
    try {
        const { appointmentId } = req.params;
        const { reason } = req.body;
        
        console.log(`🔄 Cancel appointment request: ${appointmentId} by user ${req.user?.email || req.user?._id}`);

        // Find appointment
        const appointment = await Appointment.findOne({ appointmentId });
        if (!appointment) {
            return res.status(404).json({
                success: false,
                error: 'Appointment not found'
            });
        }

        // Verify authorization - patients can only cancel their own appointments
        if (req.user.role === 'patient') {
            const patient = await Patient.findOne({ userId: req.user._id });
            if (!patient || patient.patientId !== appointment.patientId) {
                return res.status(403).json({
                    success: false,
                    error: 'Unauthorized: You can only cancel your own appointments'
                });
            }
        }

        // Check if appointment can be cancelled
        if (appointment.status === 'completed') {
            return res.status(400).json({
                success: false,
                error: 'Cannot cancel a completed appointment'
            });
        }

        if (appointment.status === 'cancelled') {
            return res.status(400).json({
                success: false,
                error: 'Appointment is already cancelled'
            });
        }

        // Update appointment status
        appointment.status = 'cancelled';
        if (reason) {
            appointment.notes = (appointment.notes || '') + `\nCancellation reason: ${reason}`;
        }
        await appointment.save();

        // Notify doctor via Socket.IO
        if (global.io) {
            global.io.to(`doctor_${appointment.doctorId}`).emit('appointment_cancelled', {
                appointmentId,
                patientId: appointment.patientId,
                appointmentDate: appointment.appointmentDate,
                appointmentTime: appointment.appointmentTime,
                reason: reason || 'No reason provided'
            });
        }

        res.json({
            success: true,
            message: 'Appointment cancelled successfully',
            data: appointment
        });
    } catch (error) {
        console.error('Error cancelling appointment:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to cancel appointment',
            details: error.message
        });
    }
});

// Get appointments
router.get('/', authorizeRoles('patient', 'doctor', 'hospital'), async(req, res) => {
    try {
        const { patientId, doctorId, status, date, limit = 50, page = 1 } = req.query;

        const filters = {};

        if (req.user && req.user.role === 'patient') {
            const patient = await Patient.findOne({ userId: req.user._id });
            filters.patientId = patient ? patient.patientId : '';
        } else if (req.user && req.user.role === 'doctor') {
            const doctor = await Doctor.findOne({ userId: req.user._id });
            filters.doctorId = doctor ? doctor.doctorId : '';
        } else {
            // Hospital can see all, or filter by patientId/doctorId
            if (patientId) filters.patientId = patientId;
            if (doctorId) filters.doctorId = doctorId;
        }

        if (status) filters.status = status;
        if (date) {
            const queryDate = new Date(date);
            const nextDay = new Date(queryDate);
            nextDay.setDate(nextDay.getDate() + 1);
            filters.appointmentDate = { $gte: queryDate, $lt: nextDay };
        }

        const skip = (Number(page) - 1) * Number(limit);

        const appointments = await Appointment.find(filters)
            .sort({ appointmentDate: 1, appointmentTime: 1 })
            .limit(Number(limit))
            .skip(skip)
            .lean();

        // Populate doctor and patient details for better frontend display
        const populatedAppointments = await Promise.all(
            appointments.map(async (apt) => {
                const doctor = await Doctor.findOne({ doctorId: apt.doctorId }).populate('userId', 'name email').lean();
                const patient = await Patient.findOne({ patientId: apt.patientId }).populate('userId', 'name email').lean();
                
                return {
                    ...apt,
                    doctorName: doctor ? (doctor.userId?.name || doctor.name || 'Doctor') : 'Doctor', // Add doctorName directly for frontend
                    doctorDetails: doctor ? {
                        name: doctor.userId?.name || doctor.name || 'Doctor',
                        specialization: doctor.specialization || [],
                        consultationFee: doctor.consultationFee || 0
                    } : null,
                    patientDetails: patient ? {
                        name: patient.userId?.name || patient.personalInfo?.name || 'Patient',
                        phone: patient.personalInfo?.phone || ''
                    } : null
                };
            })
        );

        const total = await Appointment.countDocuments(filters);

        res.json({
            success: true,
            data: populatedAppointments,
            pagination: {
                total,
                page: Number(page),
                limit: Number(limit),
                pages: Math.ceil(total / Number(limit))
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: 'Failed to fetch appointments',
            details: error.message
        });
    }
});

// Update appointment status
router.put('/:appointmentId/status', authorizeRoles('doctor', 'hospital'), async(req, res) => {
    try {
        const { appointmentId } = req.params;
        const { status, notes, diagnosis, prescription } = req.body;

        if (!status) {
            return res.status(400).json({
                success: false,
                error: 'Status is required'
            });
        }

        const appointment = await Appointment.findOne({ appointmentId });
        if (!appointment) {
            return res.status(404).json({
                success: false,
                error: 'Appointment not found'
            });
        }

        appointment.status = status;
        if (notes) appointment.notes = notes;
        if (diagnosis) appointment.diagnosis = diagnosis;
        if (prescription) appointment.prescription = prescription;

        await appointment.save();

        // Notify patient
        if (global.io) {
            global.io.to(`patient_${appointment.patientId}`).emit('appointment_updated', {
                appointmentId,
                status,
                notes,
                diagnosis,
                prescription,
                timestamp: new Date().toISOString()
            });
        }

        res.json({
            success: true,
            message: 'Appointment updated successfully',
            data: appointment
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: 'Failed to update appointment',
            details: error.message
        });
    }
});

// Patient check-in
router.post('/:appointmentId/checkin', authorizeRoles('patient', 'hospital'), async(req, res) => {
    try {
        const { appointmentId } = req.params;

        const appointment = await Appointment.findOne({ appointmentId });
        if (!appointment) {
            return res.status(404).json({
                success: false,
                error: 'Appointment not found'
            });
        }

        appointment.status = 'confirmed';
        await appointment.save();

        // Notify doctor
        if (global.io) {
            global.io.to(`doctor_${appointment.doctorId}`).emit('patient_checkin', {
                appointmentId,
                patientId: appointment.patientId,
                checkInTime: new Date().toISOString()
            });
        }

        res.json({
            success: true,
            message: 'Check-in successful',
            data: appointment
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: 'Check-in failed',
            details: error.message
        });
    }
});

// Get appointment analytics
router.get('/analytics', authorizeRoles('doctor', 'hospital'), async(req, res) => {
    try {
        const analytics = await Appointment.aggregate([{
            $group: {
                _id: '$status',
                count: { $sum: 1 },
                avgDuration: { $avg: '$duration' }
            }
        }]);

        const totalAppointments = await Appointment.countDocuments();
        const todayAppointments = await Appointment.countDocuments({
            appointmentDate: {
                $gte: new Date(new Date().setHours(0, 0, 0, 0)),
                $lt: new Date(new Date().setHours(23, 59, 59, 999))
            }
        });

        res.json({
            success: true,
            data: {
                totalAppointments,
                todayAppointments,
                statusBreakdown: analytics,
                completionRate: (() => {
                    const completed = analytics.find(a => a._id === 'completed');
                    return totalAppointments > 0 ? ((completed ? completed.count : 0) / totalAppointments * 100).toFixed(1) : '0.0';
                })()
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: 'Failed to generate analytics',
            details: error.message
        });
    }
});

module.exports = router;