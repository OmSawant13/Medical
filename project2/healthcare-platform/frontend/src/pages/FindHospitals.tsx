import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';

// Declare Google Maps types for TypeScript
declare global {
  interface Window {
    google: any;
    initMap: () => void;
  }
}

interface Hospital {
  place_id: string;
  name: string;
  vicinity: string; // Address
  geometry: {
    location: {
      lat: () => number;
      lng: () => number;
    };
  };
  rating?: number;
  user_ratings_total?: number;
  distance?: number; // Calculated distance in km
  isOpen?: boolean;
}

const FindHospitals: React.FC = () => {
  const navigate = useNavigate();
  const mapRef = useRef<HTMLDivElement>(null);
  const [map, setMap] = useState<any>(null);
  const [hospitals, setHospitals] = useState<Hospital[]>([]);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [selectedHospital, setSelectedHospital] = useState<Hospital | null>(null);
  const [loading, setLoading] = useState(false);
  const [scriptLoaded, setScriptLoaded] = useState(false);

  const API_KEY = 'AIzaSyAOVYRIgupAurZup5y1PRh8Ismb1A3lLao'; // Provided API Key

  useEffect(() => {
    // Load Google Maps Script
    if (!window.google) {
      const script = document.createElement('script');
      // NOTE: original page uses geometry.spherical, so include geometry lib
      script.src = `https://maps.googleapis.com/maps/api/js?key=${API_KEY}&libraries=places,geometry&callback=initMap`;
      script.async = true;
      script.defer = true;

      window.initMap = () => {
        setScriptLoaded(true);
      };

      document.head.appendChild(script);
    } else {
      setScriptLoaded(true);
    }

    return () => {
      // Cleanup global callback
      window.initMap = () => { };
    };
  }, []);

  const updateMapMarkers = useCallback((places: Hospital[], mapInstance: any) => {
    const bounds = new window.google.maps.LatLngBounds();

    if (userLocation) {
      bounds.extend(userLocation);
    }

    places.forEach((place) => {
      if (!place.geometry || !place.geometry.location) return;

      const marker = new window.google.maps.Marker({
        map: mapInstance,
        position: place.geometry.location,
        title: place.name,
        animation: window.google.maps.Animation.DROP,
        icon: {
          url: "https://maps.gstatic.com/mapfiles/place_api/icons/v1/png_71/hospital-71.png",
          scaledSize: new window.google.maps.Size(30, 30)
        }
      });

      const infoWindow = new window.google.maps.InfoWindow({
        content: `
          <div style="padding: 5px;">
            <h3 style="font-weight: bold; margin-bottom: 5px;">${place.name}</h3>
            <p style="font-size: 12px; margin-bottom: 5px;">${place.vicinity}</p>
            ${place.distance ? `<p style="font-size: 12px; color: #4285F4;">📍 ${place.distance.toFixed(2)} km</p>` : ''}
          </div>
        `
      });

      marker.addListener("click", () => {
        infoWindow.open(mapInstance, marker);
        setSelectedHospital(place);
      });

      bounds.extend(place.geometry.location);
    });

    if (places.length > 0) {
      mapInstance.fitBounds(bounds);
    }
  }, [userLocation]);

  const searchNearbyHospitals = useCallback((location: { lat: number; lng: number }, service: any, mapInstance: any) => {
    const request = {
      location: location,
      rankBy: window.google.maps.places.RankBy.DISTANCE, // Sort by distance
      type: 'hospital', // Primary search type
      keyword: 'clinic' // Also look for clinics
    };

    service.nearbySearch(request, (results: any[], status: any) => {
      if (status === window.google.maps.places.PlacesServiceStatus.OK && results) {

        // Calculate precise distance for display
        const resultsWithDistance = results.map(place => {
          const placeLoc = place.geometry.location;
          const distanceInMeters = window.google.maps.geometry.spherical.computeDistanceBetween(
            new window.google.maps.LatLng(location.lat, location.lng),
            placeLoc
          );
          return { ...place, distance: distanceInMeters / 1000 };
        });

        // The API with RankBy.DISTANCE already sorts by distance, but we calculate it for display
        setHospitals(resultsWithDistance);
        updateMapMarkers(resultsWithDistance, mapInstance);
      } else {
        console.error('Places search failed:', status);
        setLoading(false);
      }
      setLoading(false);
    });
  }, [updateMapMarkers]);

  const initializeMap = useCallback((center: { lat: number; lng: number }) => {
    if (!mapRef.current) return;

    const mapInstance = new window.google.maps.Map(mapRef.current, {
      center: center,
      zoom: 15,
      mapTypeControl: false,
      fullscreenControl: false,
      streetViewControl: false
    });

    // User location marker
    new window.google.maps.Marker({
      position: center,
      map: mapInstance,
      icon: {
        path: window.google.maps.SymbolPath.CIRCLE,
        scale: 10,
        fillColor: "#4285F4",
        fillOpacity: 1,
        strokeWeight: 2,
        strokeColor: "white",
      },
      title: "Your Location"
    });

    setMap(mapInstance);
    // Use type assertion to tell TypeScript that PlacesService is available
    const service = new (window.google.maps.places.PlacesService as any)(mapInstance);

    searchNearbyHospitals(center, service, mapInstance);
  }, [searchNearbyHospitals]);

  const getUserLocation = useCallback(() => {
    if (navigator.geolocation) {
      setLoading(true);
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const location = {
            lat: position.coords.latitude,
            lng: position.coords.longitude
          };
          setUserLocation(location);
          initializeMap(location);
        },
        (error) => {
          console.error('Location error:', error);
          alert('Could not access location. Defaulting to a central location (Mumbai).');
          // Default to Mumbai
          const defaultLocation = { lat: 19.0760, lng: 72.8777 };
          setUserLocation(defaultLocation);
          initializeMap(defaultLocation);
        }
      );
    } else {
      alert('Geolocation is not supported by this browser.');
      const defaultLocation = { lat: 19.0760, lng: 72.8777 };
      setUserLocation(defaultLocation);
      initializeMap(defaultLocation);
    }
  }, [initializeMap]);

  useEffect(() => {
    if (scriptLoaded) {
      getUserLocation();
    }
  }, [scriptLoaded, getUserLocation]);

  const handleHospitalClick = (hospital: Hospital) => {
    setSelectedHospital(hospital);
    // Pan map to hospital
    if (map && hospital.geometry.location) {
      map.panTo(hospital.geometry.location);
      map.setZoom(17);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">🏥 Find Nearby Hospitals</h1>
              <p className="text-sm text-gray-600 mt-1">
                Location-based hospitals & clinics (Desktop/hos feature)
              </p>
            </div>
            <button
              onClick={() => navigate('/patient-dashboard')}
              className="px-4 py-2 text-gray-600 hover:text-gray-900"
            >
              ← Back to Dashboard
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Map Section */}
          <div className="bg-white rounded-lg shadow-lg overflow-hidden h-[600px] relative">
            <div className="p-4 border-b absolute top-0 left-0 right-0 z-10 bg-white/90 backdrop-blur-sm">
              <h2 className="text-lg font-semibold">📍 Live Map</h2>
            </div>
            <div ref={mapRef} style={{ height: '100%', width: '100%' }} />
            {loading && (
              <div className="absolute inset-0 flex items-center justify-center bg-white/50 z-20">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
              </div>
            )}
          </div>

          {/* Hospitals List */}
          <div className="bg-white rounded-lg shadow-lg flex flex-col h-[600px]">
            <div className="p-4 border-b flex-shrink-0">
              <h2 className="text-lg font-semibold">🏥 Nearby Facilities</h2>
              <p className="text-sm text-gray-600">
                {hospitals.length} result{hospitals.length !== 1 ? 's' : ''} found
              </p>
            </div>

            <div className="overflow-y-auto flex-1 p-2">
              {loading && hospitals.length === 0 ? (
                <div className="p-8 text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
                  <p className="text-gray-600">Finding nearby hospitals...</p>
                </div>
              ) : hospitals.length === 0 ? (
                <div className="p-8 text-center text-gray-500">
                  <p>No hospitals found nearby.</p>
                  <p className="text-sm mt-2">Make sure location services are enabled.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {hospitals.map((hospital) => (
                    <div
                      key={hospital.place_id}
                      onClick={() => handleHospitalClick(hospital)}
                      className={`p-4 rounded-lg border cursor-pointer transition-all ${selectedHospital?.place_id === hospital.place_id
                          ? 'bg-blue-50 border-blue-500 shadow-md transform scale-[1.01]'
                          : 'border-gray-200 hover:bg-gray-50 hover:border-blue-300'
                        }`}
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="font-bold text-gray-900">{hospital.name}</h3>
                          <p className="text-sm text-gray-600 mt-1">{hospital.vicinity}</p>
                          <div className="flex items-center gap-2 mt-2">
                            {hospital.rating && (
                              <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-0.5 rounded flex items-center">
                                ⭐ {hospital.rating} ({hospital.user_ratings_total})
                              </span>
                            )}
                            {hospital.isOpen !== undefined && (
                              <span className={`text-xs px-2 py-0.5 rounded ${hospital.isOpen ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                                {hospital.isOpen ? 'Open Now' : 'Closed'}
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="text-right flex flex-col items-end">
                          {hospital.distance && (
                            <span className="text-lg font-bold text-blue-600">
                              {hospital.distance.toFixed(1)} km
                            </span>
                          )}
                          <button className="mt-2 text-xs bg-blue-600 text-white px-3 py-1.5 rounded-full hover:bg-blue-700 transition-colors">
                            View Map
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FindHospitals;
