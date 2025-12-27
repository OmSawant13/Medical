import React, { useEffect, useRef, useState } from 'react';

interface Hospital {
  hospitalId: string;
  hospitalName: string;
  address?: {
    fullAddress?: string;
    street?: string;
    city?: string;
    state?: string;
  };
  location?: {
    latitude: number;
    longitude: number;
  };
  distance?: number;
  departments?: string[];
}

interface HospitalMapSimpleProps {
  hospitals: Hospital[];
  userLocation?: { latitude: number; longitude: number } | null;
  onHospitalSelect: (hospital: Hospital) => void;
  selectedHospital?: Hospital | null;
}

declare global {
  interface Window {
    L: any;
  }
}

const HospitalMapSimple: React.FC<HospitalMapSimpleProps> = ({
  hospitals,
  userLocation,
  onHospitalSelect,
  selectedHospital
}) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const markersRef = useRef<any[]>([]);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [mapError, setMapError] = useState<string | null>(null);
  const [selectedMarker, setSelectedMarker] = useState<Hospital | null>(null);

  useEffect(() => {
    try {
      // Load Leaflet if not already loaded
      if (window.L) {
        initializeMap();
        return;
      }

      // Load Leaflet CSS
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
      link.onerror = () => {
        console.warn('Failed to load Leaflet CSS');
        setMapError('Failed to load map styles');
      };
      document.head.appendChild(link);

      // Load Leaflet JS
      const script = document.createElement('script');
      script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
      script.async = true;
      script.crossOrigin = 'anonymous';
      
      script.onload = () => {
        try {
          // Fix Leaflet default icon issue
          if (window.L && window.L.Icon && window.L.Icon.Default) {
            delete (window.L.Icon.Default.prototype as any)._getIconUrl;
            window.L.Icon.Default.mergeOptions({
              iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
              iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
              shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
            });
          }
          initializeMap();
        } catch (error) {
          console.error('Error initializing map:', error);
          setMapError('Failed to initialize map');
          setMapLoaded(true); // Mark as loaded to show error state
        }
      };

      script.onerror = (error) => {
        console.error('Failed to load Leaflet script:', error);
        setMapError('Failed to load map library. Please check your internet connection.');
        setMapLoaded(true); // Mark as loaded to show error state
      };

      document.head.appendChild(script);

      return () => {
        try {
          if (script.parentNode) {
            script.parentNode.removeChild(script);
          }
          if (link.parentNode) {
            link.parentNode.removeChild(link);
          }
        } catch (error) {
          // Ignore cleanup errors
        }
      };
    } catch (error) {
      console.error('Error setting up map:', error);
      setMapError('Failed to setup map');
      setMapLoaded(true);
    }
  }, []);

  useEffect(() => {
    if (mapInstanceRef.current && mapLoaded && hospitals.length > 0) {
      updateMarkers();
    }
  }, [hospitals, userLocation, mapLoaded]);

  const initializeMap = () => {
    try {
      if (!mapRef.current || !window.L) {
        setMapError('Map container or library not available');
        setMapLoaded(true);
        return;
      }

      const L = window.L;

      // Default center (Mumbai, India)
      let center: [number, number] = [19.0760, 72.8777];
      
      if (userLocation && 
          typeof userLocation.latitude === 'number' && 
          typeof userLocation.longitude === 'number') {
        center = [userLocation.latitude, userLocation.longitude];
      } else if (hospitals.length > 0 && hospitals[0].location &&
                 typeof hospitals[0].location.latitude === 'number' &&
                 typeof hospitals[0].location.longitude === 'number') {
        center = [
          hospitals[0].location.latitude,
          hospitals[0].location.longitude
        ];
      }

      // Initialize Leaflet map
      const map = L.map(mapRef.current).setView(center, 12);

      // Add FreeIndiaMap tiles (Open-source India-specific maps)
      // Using OpenStreetMap India tiles as FreeIndiaMap alternative
      try {
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors | India Maps',
          maxZoom: 19,
          subdomains: ['a', 'b', 'c'],
          errorTileUrl: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjU2IiBoZWlnaHQ9IjI1NiIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMjU2IiBoZWlnaHQ9IjI1NiIgZmlsbD0iI2VlZSIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMTQiIGZpbGw9IiM5OTkiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGR5PSIuM2VtIj5NYXAgVW5hdmFpbGFibGU8L3RleHQ+PC9zdmc+'
        }).addTo(map);
      } catch (tileError) {
        console.warn('Failed to add tile layer:', tileError);
      }

      mapInstanceRef.current = map;
      setMapLoaded(true);
      setMapError(null);
      updateMarkers();
    } catch (error) {
      console.error('Error initializing map:', error);
      setMapError('Failed to initialize map. Please refresh the page.');
      setMapLoaded(true);
    }
  };

  const updateMarkers = () => {
    if (!mapInstanceRef.current || !window.L) return;

    const L = window.L;
    const map = mapInstanceRef.current;

    // Clear existing markers
    markersRef.current.forEach(marker => {
      map.removeLayer(marker.marker);
      if (marker.popup) {
        marker.marker.closePopup();
      }
    });
    markersRef.current = [];

    const bounds: [number, number][] = [];

    // Add user location marker
    if (userLocation && 
        typeof userLocation.latitude === 'number' && 
        typeof userLocation.longitude === 'number' &&
        !isNaN(userLocation.latitude) &&
        !isNaN(userLocation.longitude) &&
        userLocation.latitude >= -90 && userLocation.latitude <= 90 &&
        userLocation.longitude >= -180 && userLocation.longitude <= 180) {
      const userIcon = L.divIcon({
        className: 'custom-user-marker',
        html: '<div style="background-color: #4285F4; width: 16px; height: 16px; border-radius: 50%; border: 3px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.3);"></div>',
        iconSize: [16, 16],
        iconAnchor: [8, 8]
      });

      const userMarker = L.marker([userLocation.latitude, userLocation.longitude], {
        icon: userIcon,
        title: 'Your Location'
      }).addTo(map);

      bounds.push([userLocation.latitude, userLocation.longitude]);
    }

    // Add hospital markers
    hospitals.forEach((hospital) => {
      if (!hospital.location || 
          typeof hospital.location.latitude !== 'number' || 
          typeof hospital.location.longitude !== 'number' ||
          isNaN(hospital.location.latitude) ||
          isNaN(hospital.location.longitude) ||
          hospital.location.latitude < -90 || hospital.location.latitude > 90 ||
          hospital.location.longitude < -180 || hospital.location.longitude > 180) {
        console.warn('Invalid hospital location:', hospital.hospitalName, hospital.location);
        return;
      }

      const position: [number, number] = [
        hospital.location.latitude,
        hospital.location.longitude
      ];

      // Red marker icon for hospitals
      const hospitalIcon = L.icon({
        iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-red.png',
        iconRetinaUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
        shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
        iconSize: [25, 41],
        iconAnchor: [12, 41],
        popupAnchor: [1, -34],
        shadowSize: [41, 41]
      });

      const marker = L.marker(position, {
        icon: hospitalIcon,
        title: hospital.hospitalName
      }).addTo(map);

      // Popup content
      const popupContent = `
        <div style="padding: 8px; min-width: 200px;">
          <h3 style="font-weight: bold; margin-bottom: 4px; font-size: 14px;">${hospital.hospitalName}</h3>
          <p style="font-size: 12px; color: #666; margin: 4px 0;">
            ${hospital.address?.fullAddress || `${hospital.address?.street || ''}, ${hospital.address?.city || ''}`}
          </p>
          ${hospital.distance ? `<p style="font-size: 12px; color: #4285F4; margin: 4px 0;">📍 ${hospital.distance.toFixed(2)} km away</p>` : ''}
          <p style="font-size: 11px; color: #999; margin-top: 8px;">Click marker to select</p>
        </div>
      `;

      const popup = L.popup({
        maxWidth: 250,
        className: 'hospital-popup'
      }).setContent(popupContent);

      marker.bindPopup(popup);

      marker.on('click', () => {
        // Close other popups
        markersRef.current.forEach(m => {
          if (m.popup) m.marker.closePopup();
        });
        
        popup.openOn(map);
        setSelectedMarker(hospital);
        onHospitalSelect(hospital);
      });

      markersRef.current.push({ marker, popup, hospital });
      bounds.push(position);
    });

    // Fit bounds to show all markers (only if we have valid bounds)
    if (bounds.length > 0) {
      try {
        const boundsObj = L.latLngBounds(bounds);
        // Validate bounds before fitting
        if (boundsObj.isValid()) {
          map.fitBounds(boundsObj, { padding: [50, 50] });
        } else {
          // If bounds are invalid, just set view to first valid location
          const firstValidBound = bounds.find(b => 
            Array.isArray(b) && 
            b.length === 2 && 
            typeof b[0] === 'number' && 
            typeof b[1] === 'number' &&
            !isNaN(b[0]) && 
            !isNaN(b[1]) &&
            b[0] >= -90 && b[0] <= 90 &&
            b[1] >= -180 && b[1] <= 180
          );
          if (firstValidBound) {
            map.setView(firstValidBound as [number, number], 12);
          }
        }
      } catch (error) {
        console.warn('Error fitting bounds:', error);
        // Fallback: set view to user location or default
        if (userLocation) {
          map.setView([userLocation.latitude, userLocation.longitude], 12);
        }
      }
    } else if (userLocation) {
      // If no hospitals but user location exists, center on user
      map.setView([userLocation.latitude, userLocation.longitude], 12);
    }
  };

  // Show error state
  if (mapError) {
    return (
      <div className="w-full h-96 bg-gray-100 rounded-lg flex items-center justify-center border-2 border-dashed border-gray-300">
        <div className="text-center p-4">
          <div className="text-4xl mb-2">🗺️</div>
          <p className="text-gray-700 font-medium mb-2">Map Unavailable</p>
          <p className="text-sm text-gray-600 mb-4">{mapError}</p>
          <button
            onClick={() => {
              setMapError(null);
              setMapLoaded(false);
              window.location.reload();
            }}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full relative">
      <div ref={mapRef} style={{ width: '100%', height: '400px', borderRadius: '8px', zIndex: 1 }} />
      {!mapLoaded && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100 rounded-lg" style={{ zIndex: 2 }}>
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
            <p className="text-gray-600">Loading FreeIndiaMap...</p>
          </div>
        </div>
      )}
      <style>{`
        .custom-user-marker {
          background: transparent;
          border: none;
        }
        .hospital-popup .leaflet-popup-content-wrapper {
          border-radius: 8px;
        }
      `}</style>
    </div>
  );
};

export default HospitalMapSimple;

