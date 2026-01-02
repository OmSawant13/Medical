const axios = require('axios');

const API_URL = 'http://localhost:5001/api/v1';

async function run() {
    try {
        const loginRes = await axios.post(`${API_URL}/auth/login`, {
            email: 'omsawant@example.com',
            password: 'omsawant123',
            role: 'patient'
        });

        const token = loginRes.data.data.accessToken;
        console.log('✅ Logged in. Token:', token.substring(0, 20) + '...');

        console.log('📥 Fetching Appointments...');
        const aptRes = await axios.get(`${API_URL}/appointments`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        const appointments = aptRes.data.data || aptRes.data;
        console.log(`✅ Got ${appointments.length} appointments.`);

        console.log('📥 Fetching Prescriptions...');
        const presRes = await axios.get(`${API_URL}/prescriptions/patient`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        const prescriptions = presRes.data.data || presRes.data;
        console.log(`✅ Got ${prescriptions.length} prescriptions.`);

        console.log('\n🔍 Testing Matching Logic...');

        for (const apt of appointments) {
            console.log(`\n🏥 Appointment: ${apt.appointmentId} (ID: ${apt._id}) - Dr. ${apt.doctorDetails?.name || 'Unknown'}`);

            const match = prescriptions.find(p => {
                const pApptId = p.appointmentId; // This should be string now

                // Logic from frontend
                const match1 = pApptId === apt.appointmentId;
                const match2 = pApptId === apt._id;
                const match3 = String(pApptId) === String(apt.appointmentId);
                const match4 = String(pApptId) === String(apt._id);

                if (match1 || match2 || match3 || match4) {
                    console.log(`   ✅ MATCH FOUND! Prescription ID: ${p.prescriptionId}`);
                    console.log(`      Matched via: ${match1 ? 'apptId===apptId' : ''} ${match2 ? 'apptId===_id' : ''} ...`);
                    return true;
                }
                return false;
            });

            if (!match) {
                console.log('   ❌ No prescription matched.');
                // Debug why
                console.log('      Checking against all prescriptions:');
                prescriptions.forEach(p => {
                    console.log(`      - Presc ApptID: ${p.appointmentId} (${typeof p.appointmentId}) vs ApptID: ${apt.appointmentId}`);
                });
            }
        }

    } catch (error) {
        console.error('❌ Error:', error.message);
        if (error.response) {
            console.error('Response:', error.response.data);
        }
    }
}

run();
