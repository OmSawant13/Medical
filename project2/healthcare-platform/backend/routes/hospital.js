const express = require('express');
const { Client } = require('@googlemaps/google-maps-services-js');
const Hospital = require('../models/Hospital');
const Doctor = require('../models/Doctor');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');

const router = express.Router();

// ============================================================================
// CONFIG (from hos/config.js - WORKING API KEY)
// ============================================================================
const GOOGLE_MAPS_API_KEY = 'AIzaSyDQopm3nPID30j7ujyiV4jaCOEesTrubLk'; // From hos/config.js (working key)
const DEFAULT_RADIUS = 5000; // 5km in meters (hos default)
// No MAX_RESULTS limit - get ALL results like hos (hos gets up to 60 per search via pagination)

// Initialize Google Maps client
const client = new Client({});

// Simple in-memory cache
const cache = {};

// ============================================================================
// MIDDLEWARE
// ============================================================================
router.use(authenticateToken);

// ============================================================================
// EXACT FUNCTIONS FROM hos/app.js
// ============================================================================

/**
 * Haversine distance in meters (EXACT from hos/app.js)
 */
function haversineMeters(a, b) {
    const R = 6371000;
    const toRad = (d) => (d * Math.PI) / 180;
    const dLat = toRad(b.lat - a.lat);
    const dLng = toRad(b.lng - a.lng);
    const lat1 = toRad(a.lat);
    const lat2 = toRad(b.lat);
    const s =
        Math.sin(dLat / 2) ** 2 +
        Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
    return 2 * R * Math.asin(Math.sqrt(s));
}

/**
 * Normalize types (EXACT from hos/app.js)
 */
function normalizeTypes(types) {
    if (!Array.isArray(types)) return [];
    return types.filter(Boolean).map((t) => String(t).toLowerCase());
}

/**
 * Strict filtering: keep hospitals + clinics (EXACT from hos/app.js)
 */
function isHospitalOrClinicPlace({ name, types, primaryType }) {
    const n = String(name || "").toLowerCase();
    const t = new Set(normalizeTypes(types));
    const p = primaryType ? String(primaryType).toLowerCase() : "";

    // Keyword-based excludes (to avoid "medical & general store" etc)
    const excludedNamePhrases = [
        "medical and general store",
        "general store",
        "medical store",
        "chemist",
        "pharmacy",
        "drugstore",
    ];
    const nameLooksExcluded = excludedNamePhrases.some((x) => n.includes(x));

    // Explicit includes
    const hasHospital = t.has("hospital") || p === "hospital";
    const hasClinicType =
        t.has("clinic") ||
        t.has("medical_clinic") ||
        p === "clinic" ||
        p === "medical_clinic";

    // Name-based includes
    const nameLooksMedical =
        n.includes("hospital") ||
        n.includes("clinic") ||
        n.includes("nursing home") ||
        n.includes("health center") ||
        n.includes("health centre") ||
        n.includes("polyclinic") ||
        n.includes("medical centre") ||
        n.includes("medical center") ||
        n.includes("dispensary");

    // Explicit excludes
    const excludes = [
        "pharmacy",
        "drugstore",
        "store",
        "grocery_or_supermarket",
        "supermarket",
        "convenience_store",
        "department_store",
        "shopping_mall",
    ];
    const isExcluded = excludes.some((x) => t.has(x) || p === x);

    // Keep hospital always (unless it clearly looks like a store/pharmacy by name).
    if (hasHospital) return !nameLooksExcluded;

    // Keep clinics by type (unless excluded).
    if (hasClinicType && !isExcluded && !nameLooksExcluded) return true;

    // Some places come back as "doctor" even when they're clinics
    const hasDoctor = t.has("doctor") || p === "doctor";
    if (hasDoctor && nameLooksMedical && !isExcluded && !nameLooksExcluded) return true;

    // Finally, if types are missing/odd but name is clearly hospital/clinic, allow
    if (nameLooksMedical && !isExcluded && !nameLooksExcluded) return true;
    return false;
}

/**
 * Map place to item (EXACT from hos/app.js - legacy version)
 * Adapted for Google Places API response format
 */
function mapPlaceToItem(place, userLatLng, radiusMeters) {
    const loc = place?.geometry?.location;
    if (!loc) return null;

    // Handle both function-based (frontend) and object-based (backend API) location
    const lat = typeof loc.lat === "function" ? loc.lat() : (loc.lat || loc.latitude);
    const lng = typeof loc.lng === "function" ? loc.lng() : (loc.lng || loc.longitude);
    
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;

    const latLng = { lat, lng };
    const distanceM = haversineMeters(userLatLng, latLng);
    if (Number.isFinite(radiusMeters) && distanceM > radiusMeters) return null; // strict filter

    return {
        placeId: place.place_id,
        name: place.name || "Unknown",
        address: place.vicinity || place.formatted_address || "",
        rating: place.rating,
        ratingCount: place.user_ratings_total,
        openNow: place.opening_hours?.open_now !== undefined ? place.opening_hours.open_now : null,
        distanceM,
        latLng,
    };
}

/**
 * Get ALL pages from placesNearby (EXACT hos pagination logic - maxPages=3 = up to 60 results)
 */
async function placesNearbyAll(params, maxPages = 3) {
    const allResults = [];
    let nextPageToken = null;
    let pages = 0;

    do {
        const requestParams = { ...params };
        if (nextPageToken) {
            requestParams.pagetoken = nextPageToken;
            // Wait 2 seconds for next_page_token to become valid (Google requirement)
            await new Promise(resolve => setTimeout(resolve, 2000));
        }

        try {
            const response = await client.placesNearby({ params: requestParams });
            const results = response.data.results || [];
            allResults.push(...results);
            pages++;

            nextPageToken = response.data.next_page_token || null;
            // Stop if no more pages or reached max pages
            if (!nextPageToken || pages >= maxPages) break;
        } catch (error) {
            console.warn(`⚠️ Pagination error on page ${pages + 1}:`, error.message);
            break;
        }
    } while (nextPageToken && pages < maxPages);

    return allResults;
}

/**
 * Get ALL pages from textSearch (EXACT hos pagination logic - maxPages=3)
 */
async function textSearchAll(params, maxPages = 3) {
    const allResults = [];
    let nextPageToken = null;
    let pages = 0;

    do {
        const requestParams = { ...params };
        if (nextPageToken) {
            requestParams.pagetoken = nextPageToken;
            // Wait 2 seconds for next_page_token to become valid (Google requirement)
            await new Promise(resolve => setTimeout(resolve, 2000));
        }

        try {
            const response = await client.textSearch({ params: requestParams });
            const results = response.data.results || [];
            allResults.push(...results);
            pages++;

            nextPageToken = response.data.next_page_token || null;
            // Stop if no more pages or reached max pages
            if (!nextPageToken || pages >= maxPages) break;
        } catch (error) {
            console.warn(`⚠️ Text search pagination error on page ${pages + 1}:`, error.message);
            break;
        }
    } while (nextPageToken && pages < maxPages);

    return allResults;
}

/**
 * Fetch hospitals and clinics (EXACT logic from hos/app.js fetchHospitalsAndClinics)
 * WITH PAGINATION to get ALL results (pass se pass wale bhi)
 */
async function fetchHospitalsAndClinics({ userLatLng, radiusMeters, openNow }) {
    try {
        // EXACT hos logic: Multiple search methods to get ALL hospitals/clinics
        const baseRequest = {
            location: { lat: userLatLng.lat, lng: userLatLng.lng },
            radius: radiusMeters,
            key: GOOGLE_MAPS_API_KEY
        };

        // Run ALL searches in parallel WITH PAGINATION (EXACT hos behavior - gets up to 60 per search)
        const [
            hospitalByType,
            clinicByKeyword,
            hospitalByKeyword,
            hospitalByText,
            clinicByText,
            medicalClinicByText
        ] = await Promise.allSettled([
            // 1. Nearby search: type="hospital" (with pagination - up to 60 results)
            placesNearbyAll({ ...baseRequest, type: 'hospital' }, 3),
            // 2. Nearby search: keyword="clinic" (with pagination)
            placesNearbyAll({ ...baseRequest, keyword: 'clinic' }, 3),
            // 3. Nearby search: keyword="hospital" (catches hospitals not typed as "hospital")
            placesNearbyAll({ ...baseRequest, keyword: 'hospital' }, 3),
            // 4. Text search: "hospital" (different corpus, often finds missing listings)
            textSearchAll({
                query: 'hospital',
                location: `${userLatLng.lat},${userLatLng.lng}`,
                radius: radiusMeters,
                key: GOOGLE_MAPS_API_KEY
            }, 3),
            // 5. Text search: "clinic"
            textSearchAll({
                query: 'clinic',
                location: `${userLatLng.lat},${userLatLng.lng}`,
                radius: radiusMeters,
                key: GOOGLE_MAPS_API_KEY
            }, 3),
            // 6. Text search: "medical clinic"
            textSearchAll({
                query: 'medical clinic',
                location: `${userLatLng.lat},${userLatLng.lng}`,
                radius: radiusMeters,
                key: GOOGLE_MAPS_API_KEY
            }, 3)
        ]);

        // Merge ALL results (EXACT hos behavior)
        const merged = new Map();
        
        // Process nearby search results (already paginated arrays)
        const nearbyResults = [
            hospitalByType.status === 'fulfilled' ? (Array.isArray(hospitalByType.value) ? hospitalByType.value : []) : [],
            clinicByKeyword.status === 'fulfilled' ? (Array.isArray(clinicByKeyword.value) ? clinicByKeyword.value : []) : [],
            hospitalByKeyword.status === 'fulfilled' ? (Array.isArray(hospitalByKeyword.value) ? hospitalByKeyword.value : []) : []
        ].flat();

        // Process text search results (already paginated arrays)
        const textResults = [
            hospitalByText.status === 'fulfilled' ? (Array.isArray(hospitalByText.value) ? hospitalByText.value : []) : [],
            clinicByText.status === 'fulfilled' ? (Array.isArray(clinicByText.value) ? clinicByText.value : []) : [],
            medicalClinicByText.status === 'fulfilled' ? (Array.isArray(medicalClinicByText.value) ? medicalClinicByText.value : []) : []
        ].flat();

        // Combine all results
        const allResults = [...nearbyResults, ...textResults];

        for (const p of allResults) {
            if (!p?.place_id) continue;
            
            // Apply strict filtering (EXACT from hos)
            if (!isHospitalOrClinicPlace({
                name: p.name,
                types: p.types,
                primaryType: p.types?.[0]
            })) continue;

            // Apply openNow filter if requested
            if (openNow && p.opening_hours && p.opening_hours.open_now === false) continue;

            merged.set(p.place_id, p);
        }

        // Map to items with strict distance filtering
        const items = [];
        for (const p of merged.values()) {
            const it = mapPlaceToItem(p, userLatLng, radiusMeters);
            if (it) items.push(it);
        }

        // Sort by distance (closest first) - EXACT hos behavior
        items.sort((a, b) => a.distanceM - b.distanceM);
        
        console.log(`✅ Found ${items.length} hospitals/clinics (after strict filtering)`);
        return items;

    } catch (error) {
        console.error('❌ Error fetching hospitals:', error.message);
        if (error.response) {
            console.error('❌ Google API Error Response:', JSON.stringify(error.response.data, null, 2));
            console.error('❌ Status:', error.response.status);
            console.error('❌ Status Text:', error.response.statusText);
        }
        if (error.request) {
            console.error('❌ Request made but no response:', error.request);
        }
        return [];
    }
}

// ============================================================================
// ROUTES
// ============================================================================

/**
 * GET /api/v1/hospitals
 * Location-based search (EXACT hos logic)
 * PRIORITY: Location > City (hos only uses location)
 */
router.get('/', authorizeRoles('patient', 'doctor', 'hospital'), async(req, res) => {
    try {
        const { city, latitude, longitude, radius, search, openNow } = req.query;

        // PRIORITY 1: Location-based search (EXACT hos logic - this is what hos uses)
        if (latitude && longitude) {
            const lat = parseFloat(latitude);
            const lon = parseFloat(longitude);
            const radiusMeters = radius ? parseFloat(radius) * 1000 : DEFAULT_RADIUS;
            const filterOpenNow = openNow === 'true';

            if (isNaN(lat) || isNaN(lon)) {
                return res.status(400).json({
                    success: false,
                    error: 'Invalid latitude or longitude'
                });
            }

            const userLatLng = { lat, lng: lon };

            // Fetch hospitals using EXACT hos logic
            let items = await fetchHospitalsAndClinics({
                userLatLng,
                radiusMeters,
                openNow: filterOpenNow
            });

            // Apply search filter if provided
            if (search && items.length > 0) {
                const term = search.toLowerCase();
                items = items.filter(item => {
                    const name = (item.name || '').toLowerCase();
                    const addr = (item.address || '').toLowerCase();
                    return name.includes(term) || addr.includes(term);
                });
            }

            // Format for frontend (NO LIMIT - return ALL results like hos)
            const hospitals = items.map(item => ({
                hospitalId: `GP_${item.placeId}`,
                hospitalName: item.name,
                address: {
                    fullAddress: item.address,
                    street: item.address.split(',')[0] || '',
                    city: item.address.split(',')[1] || '',
                    state: item.address.split(',')[2] || '',
                    country: 'India'
                },
                location: {
                    latitude: item.latLng.lat,
                    longitude: item.latLng.lng
                },
                rating: item.rating,
                user_ratings_total: item.ratingCount,
                isOpen: item.openNow,
                distance: parseFloat((item.distanceM / 1000).toFixed(2)), // km
                distanceM: item.distanceM, // meters
                placeId: item.placeId
            }));

            return res.json({
                success: true,
                count: hospitals.length,
                data: hospitals
            });
        }

        // PRIORITY 2: City search (fallback only)
        if (city) {
            const hospitals = await getHospitalsByCity(city.trim());
            return res.json({
                success: true,
                count: hospitals.length,
                data: hospitals
            });
        }

        // No location or city provided
        return res.status(400).json({
            success: false,
            error: 'Please provide either latitude/longitude or city name'
        });

        const lat = parseFloat(latitude);
        const lon = parseFloat(longitude);
        const radiusMeters = radius ? parseFloat(radius) * 1000 : DEFAULT_RADIUS;
        const filterOpenNow = openNow === 'true';

        if (isNaN(lat) || isNaN(lon)) {
            return res.status(400).json({
                success: false,
                error: 'Invalid latitude or longitude'
            });
        }

        const userLatLng = { lat, lng: lon };

        // Fetch hospitals using EXACT hos logic
        let items = await fetchHospitalsAndClinics({
            userLatLng,
            radiusMeters,
            openNow: filterOpenNow
        });

        // Apply search filter if provided
        if (search && items.length > 0) {
            const term = search.toLowerCase();
            items = items.filter(item => {
                const name = (item.name || '').toLowerCase();
                const addr = (item.address || '').toLowerCase();
                return name.includes(term) || addr.includes(term);
            });
        }

        // Format for frontend (keep existing format)
        const hospitals = items.map(item => ({
            hospitalId: `GP_${item.placeId}`,
            hospitalName: item.name,
            address: {
                fullAddress: item.address,
                street: item.address.split(',')[0] || '',
                city: item.address.split(',')[1] || '',
                state: item.address.split(',')[2] || '',
                country: 'India'
            },
            location: {
                latitude: item.latLng.lat,
                longitude: item.latLng.lng
            },
            rating: item.rating,
            user_ratings_total: item.ratingCount,
            isOpen: item.openNow,
            distance: parseFloat((item.distanceM / 1000).toFixed(2)), // km
            distanceM: item.distanceM, // meters
            placeId: item.placeId
        }));

        res.json({
            success: true,
            count: hospitals.length,
            data: hospitals
        });

    } catch (error) {
        console.error('Hospital search error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to search hospitals',
            message: error.message
        });
    }
});

/**
 * GET /api/v1/hospitals/:hospitalId/doctors
 * Get doctors for a hospital
 */
router.get('/:hospitalId/doctors', authorizeRoles('patient', 'doctor', 'hospital'), async(req, res) => {
    try {
        const { hospitalId } = req.params;
        const { hospitalName } = req.query; // Accept hospital name from query

        // For Google Places hospitals, they won't be in DB - that's OK
        const Appointment = require('../models/Appointment');
        const [hospital, doctors, doctorsWithAppointments] = await Promise.all([
            Hospital.findOne({ hospitalId }).lean(),
            Doctor.find({ hospitalAffiliation: hospitalId })
            .populate('userId', 'name email')
            .lean(),
            // Also get doctors who have appointments with this hospital (even if hospitalAffiliation doesn't match)
            Appointment.distinct('doctorId', { hospitalId: hospitalId })
            .then(async (doctorIds) => {
                if (doctorIds.length === 0) return [];
                return Doctor.find({ doctorId: { $in: doctorIds } })
                    .populate('userId', 'name email')
                    .lean();
            })
        ]);

        // Get hospital name (from query, DB, or fetch from Google Places)
        let actualHospitalName = hospitalName || (hospital ? hospital.hospitalName : null);
        
        // If it's a Google Places hospital and we don't have the name, fetch it
        if (!actualHospitalName && hospitalId.startsWith('GP_')) {
            try {
                const placeId = hospitalId.replace('GP_', '');
                const { Client } = require('@googlemaps/google-maps-services-js');
                const client = new Client({});
                const placeDetails = await client.placeDetails({
                    params: {
                        place_id: placeId,
                        key: GOOGLE_MAPS_API_KEY,
                        fields: ['name']
                    }
                });
                actualHospitalName = placeDetails.data.result?.name || 'Hospital';
            } catch (error) {
                console.error('Error fetching hospital name from Google Places:', error.message);
                actualHospitalName = 'Hospital';
            }
        }

        // Return doctors linked to this hospital ID (NEW APPROACH)
        // Combine doctors with hospitalAffiliation and doctors with appointments
        const allDoctorIds = new Set();
        const allDoctors = [];
        
        // Add doctors with hospitalAffiliation
        doctors.forEach(doc => {
            if (!allDoctorIds.has(doc.doctorId)) {
                allDoctorIds.add(doc.doctorId);
                allDoctors.push(doc);
            }
        });
        
        // Add doctors with appointments (even if hospitalAffiliation doesn't match)
        doctorsWithAppointments.forEach(doc => {
            if (!allDoctorIds.has(doc.doctorId)) {
                allDoctorIds.add(doc.doctorId);
                allDoctors.push(doc);
            }
        });
        
        let doctorList;
        if (allDoctors.length > 0) {
            // Sort by doctorId to ensure consistent ordering (no shuffling)
            doctorList = allDoctors
                .sort((a, b) => (a.doctorId || '').localeCompare(b.doctorId || ''))
                .map(d => formatDoctor(d, hospitalId));
        } else {
            // Assign 3 unassigned doctors to this hospital
            doctorList = await assignDoctorsToHospital(hospitalId);
        }

        res.json({
            success: true,
            data: {
                hospital: {
                    hospitalId: hospitalId,
                    hospitalName: actualHospitalName || (hospital ? hospital.hospitalName : 'Hospital'),
                    address: hospital ? hospital.address : {}
                },
                doctors: doctorList
            }
        });
    } catch (error) {
        console.error('Error fetching doctors:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch doctors',
            message: error.message
        });
    }
});

// ============================================================================
// HELPER FUNCTIONS (keep existing)
// ============================================================================

/**
 * Get hospitals by city (keep existing logic)
 */
async function getHospitalsByCity(city) {
    const cacheKey = `city_${city.toLowerCase()}`;

    if (cache[cacheKey]) {
        const cached = cache[cacheKey];
        if (Date.now() - cached.timestamp < 3600000) {
            console.log(`✅ Serving ${cached.data.length} hospitals from cache for city: ${city}`);
            return cached.data;
        }
    }

    console.log(`🔍 Searching hospitals in city: ${city} using Google Places API`);

    try {
        const response = await client.textSearch({
            params: {
                query: `hospitals in ${city}`,
                key: GOOGLE_MAPS_API_KEY
            }
        });

        const hospitals = processGoogleResults(response.data.results || [], city);

        cache[cacheKey] = {
            data: hospitals,
            timestamp: Date.now()
        };

        console.log(`✅ Found ${hospitals.length} hospitals in ${city}`);
        return hospitals;

    } catch (error) {
        console.error(`❌ Error searching city:`, error.message);
        return [];
    }
}

/**
 * Process Google Places API results (keep existing)
 */
function processGoogleResults(results, cityContext) {
    if (!Array.isArray(results)) return [];

    return results
        .filter(place => {
            const name = (place.name || '').toLowerCase();
            const types = (place.types || []).map(t => t.toLowerCase());

            const medicalKeywords = ['hospital', 'clinic', 'medical', 'health', 'care', 'doctor', 'pharmacy'];
            const medicalTypes = ['hospital', 'doctor', 'pharmacy', 'health', 'dentist', 'physiotherapist'];

            return medicalKeywords.some(kw => name.includes(kw)) ||
                medicalTypes.some(t => types.includes(t));
        })
        .map(place => {
            const name = (place.name || '').trim();
            const address = place.vicinity || place.formatted_address || '';
            const location = place.geometry?.location || {};
            const isClinic = name.toLowerCase().includes('clinic') ||
                (place.types || []).some(t => t.includes('doctor'));

            const addressParts = address.split(',').map(s => s.trim());
            const street = addressParts[0] || '';
            const city = addressParts[1] || cityContext || '';
            const state = addressParts[2] || '';
            const zipCode = addressParts.find(p => /^\d{6}$/.test(p)) || '';

            return {
                hospitalId: `GP_${place.place_id}`,
                hospitalName: name,
                type: isClinic ? 'Clinic' : 'Hospital',
                address: {
                    street: street,
                    city: city,
                    state: state,
                    zipCode: zipCode,
                    country: 'India',
                    fullAddress: address
                },
                location: {
                    latitude: location.lat || 0,
                    longitude: location.lng || 0
                },
                phone: place.formatted_phone_number || place.international_phone_number || '',
                facilities: isClinic ? ['Consultation', 'Pharmacy'] : ['Emergency', 'Pharmacy', 'ICU'],
                rating: place.rating ? parseFloat(place.rating.toFixed(1)) : parseFloat((Math.random() * 1.5 + 3.5).toFixed(1)),
                isOpen: place.opening_hours?.open_now !== undefined ? place.opening_hours.open_now : true
            };
        });
}

/**
 * Format doctor data for API response
 */
function formatDoctor(doctor, hospitalId) {
    return {
        doctorId: doctor.doctorId,
        name: doctor.userId?.name || doctor.name || 'Dr. Unknown',
        email: doctor.userId?.email || doctor.email || '',
        specialization: Array.isArray(doctor.specialization) ?
            doctor.specialization : [doctor.specialization].filter(Boolean),
        experience: doctor.experience || 0,
        consultationFee: doctor.consultationFee || 0,
        availability: doctor.availability || {},
        qualifications: Array.isArray(doctor.qualifications) ?
            doctor.qualifications : [doctor.qualifications].filter(Boolean),
        hospitalAffiliation: hospitalId
    };
}

/**
 * Assign pre-created doctors to a hospital (3 doctors per hospital)
 * Divides 15 pre-created doctors among hospitals
 */
async function assignDoctorsToHospital(hospitalId) {
    try {
        // First check if this hospital already has doctors assigned
        const existingDoctors = await Doctor.find({ hospitalAffiliation: hospitalId })
            .populate('userId', 'name email')
            .sort({ doctorId: 1 })
            .lean();
        
        if (existingDoctors.length > 0) {
            console.log(`✅ Hospital ${hospitalId} already has ${existingDoctors.length} doctors assigned - returning existing doctors`);
            return existingDoctors.map(d => formatDoctor(d, hospitalId));
        }

        // Get all unassigned doctors (hospitalAffiliation is null)
        // Sort by doctorId to ensure consistent ordering (no shuffling)
        const unassignedDoctors = await Doctor.find({ hospitalAffiliation: null })
            .populate('userId', 'name email')
            .sort({ doctorId: 1 }) // Consistent sorting to prevent shuffling
            .limit(3)
            .lean();

        if (unassignedDoctors.length === 0) {
            console.log('⚠️  No unassigned doctors available, all 15 doctors are assigned');
            console.log('⚠️  This hospital will have no doctors (all doctors are already assigned to other hospitals)');
            // DO NOT reassign doctors from other hospitals - this prevents shuffling
            return [];
        }

        // Assign these 3 doctors to the hospital
        const assignedDoctors = [];
        for (const doc of unassignedDoctors) {
            await Doctor.updateOne(
                { _id: doc._id },
                { $set: { hospitalAffiliation: hospitalId } }
            );
            assignedDoctors.push(doc);
            console.log(`✅ Assigned ${doc.userId?.name || doc.name} (${doc.doctorId}) to hospital ${hospitalId}`);
        }

        return assignedDoctors.map(d => formatDoctor(d, hospitalId));
    } catch (error) {
        console.error('❌ Error assigning doctors to hospital:', error.message);
        return [];
    }
}

/**
 * Generate mock doctors for testing
 */
function getMockDoctors(hospitalId) {
    const specs = [
        ['General Practice'],
        ['Cardiology'],
        ['Orthopedics'],
        ['Pediatrics'],
        ['Dermatology'],
        ['Neurology'],
        ['Oncology'],
        ['Psychiatry']
    ];

    return specs.map((spec, idx) => ({
        doctorId: `D${hospitalId}_${idx + 1}`,
        name: `Dr. ${['John', 'Sarah', 'Michael', 'Emily', 'David', 'Lisa', 'Robert', 'Anna'][idx]} ${['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis'][idx]}`,
        email: `doctor${idx + 1}@hospital.com`,
        specialization: spec,
        experience: 5 + idx * 2,
        consultationFee: 500 + idx * 100,
        availability: {},
        qualifications: ['MBBS', 'MD'],
        hospitalAffiliation: hospitalId
    }));
}

module.exports = router;
