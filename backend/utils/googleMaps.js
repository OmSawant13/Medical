// Google Maps API Integration Utility
// This will be used when integrating real Google Maps API

const axios = require('axios');

/**
 * Get coordinates from address using Google Maps Geocoding API
 * @param {string} address - Full address string
 * @returns {Promise<{latitude: number, longitude: number}>}
 */
const geocodeAddress = async (address) => {
  try {
    const apiKey = process.env.GOOGLE_MAPS_API_KEY;
    
    if (!apiKey) {
      console.warn('⚠️  Google Maps API key not configured. Using dummy coordinates.');
      // Return dummy coordinates for development
      return {
        latitude: 40.7128 + (Math.random() - 0.5) * 0.1,
        longitude: -74.0060 + (Math.random() - 0.5) * 0.1
      };
    }

    const response = await axios.get('https://maps.googleapis.com/maps/api/geocode/json', {
      params: {
        address: address,
        key: apiKey
      }
    });

    if (response.data.status === 'OK' && response.data.results.length > 0) {
      const location = response.data.results[0].geometry.location;
      return {
        latitude: location.lat,
        longitude: location.lng
      };
    } else {
      throw new Error(`Geocoding failed: ${response.data.status}`);
    }
  } catch (error) {
    console.error('Geocoding Error:', error);
    // Return dummy coordinates on error
    return {
      latitude: 40.7128 + (Math.random() - 0.5) * 0.1,
      longitude: -74.0060 + (Math.random() - 0.5) * 0.1
    };
  }
};

/**
 * Search for nearby hospitals using Google Places API
 * @param {number} latitude - User latitude
 * @param {number} longitude - User longitude
 * @param {number} radius - Search radius in meters
 * @returns {Promise<Array>}
 */
const searchNearbyHospitals = async (latitude, longitude, radius = 5000) => {
  try {
    const apiKey = process.env.GOOGLE_MAPS_API_KEY;
    
    if (!apiKey) {
      console.warn('⚠️  Google Maps API key not configured. Using database hospitals only.');
      return [];
    }

    const response = await axios.get('https://maps.googleapis.com/maps/api/place/nearbysearch/json', {
      params: {
        location: `${latitude},${longitude}`,
        radius: radius,
        type: 'hospital',
        key: apiKey
      }
    });

    if (response.data.status === 'OK') {
      return response.data.results.map(place => ({
        name: place.name,
        address: place.vicinity,
        latitude: place.geometry.location.lat,
        longitude: place.geometry.location.lng,
        place_id: place.place_id,
        rating: place.rating,
        types: place.types
      }));
    } else {
      console.warn(`Places API returned: ${response.data.status}`);
      return [];
    }
  } catch (error) {
    console.error('Places API Error:', error);
    return [];
  }
};

/**
 * Get place details from Google Places API
 * @param {string} placeId - Google Place ID
 * @returns {Promise<Object>}
 */
const getPlaceDetails = async (placeId) => {
  try {
    const apiKey = process.env.GOOGLE_MAPS_API_KEY;
    
    if (!apiKey) {
      return null;
    }

    const response = await axios.get('https://maps.googleapis.com/maps/api/place/details/json', {
      params: {
        place_id: placeId,
        fields: 'name,formatted_address,geometry,formatted_phone_number,website,opening_hours',
        key: apiKey
      }
    });

    if (response.data.status === 'OK') {
      return response.data.result;
    }
    
    return null;
  } catch (error) {
    console.error('Place Details Error:', error);
    return null;
  }
};

module.exports = {
  geocodeAddress,
  searchNearbyHospitals,
  getPlaceDetails
};

