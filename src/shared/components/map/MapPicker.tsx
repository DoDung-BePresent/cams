import { useEffect, useState } from 'react';
import {
  MapContainer,
  TileLayer,
  Marker,
  useMapEvents,
  useMap,
} from 'react-leaflet';
import { Input, Button, Space, Typography, message } from 'antd';

/**
 * Icons
 */
import { SearchOutlined, AimOutlined } from '@ant-design/icons';

/**
 * Types
 */
import type { LatLngExpression } from 'leaflet';
import L from 'leaflet';

import { VIETNAM_CITIES } from '@/shared/constants';

const { Text } = Typography;

// Fix Leaflet default marker icon in Vite/Webpack
// eslint-disable-next-line @typescript-eslint/no-explicit-any
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

type MapPickerProps = {
  value?: { lat: number; lng: number } | null;
  onChange?: (location: { lat: number; lng: number }) => void;
  onAddressChange?: (address: string) => void;
  onCityChange?: (city: string | null) => void;
  height?: number;
  isOpen?: boolean;
};
function MapController({ position }: { position: LatLngExpression | null }) {
  const map = useMap();

  useEffect(() => {
    if (position) {
      map.flyTo(position, 15);
    }
  }, [position, map]);

  return null;
}
function ResizeMap({ isOpen }: { isOpen: boolean }) {
  const map = useMap();

  // Invalidate size multiple times to cover modal open animation
  useEffect(() => {
    if (!isOpen) return;
    const delays = [100, 300, 500];
    const timers = delays.map((ms) =>
      setTimeout(() => map.invalidateSize(), ms),
    );
    return () => timers.forEach(clearTimeout);
  }, [isOpen, map]);

  // Also observe the map container for resize changes
  useEffect(() => {
    const container = map.getContainer();
    const observer = new ResizeObserver(() => {
      map.invalidateSize();
    });
    observer.observe(container);
    return () => observer.disconnect();
  }, [map]);

  return null;
}

// Component to handle map clicks
function LocationMarker({
  position,
  setPosition,
}: {
  position: LatLngExpression | null;
  setPosition: (pos: LatLngExpression) => void;
}) {
  useMapEvents({
    click(e) {
      setPosition([e.latlng.lat, e.latlng.lng]);
    },
  });

  return position === null ? null : <Marker position={position} />;
}

export const MapPicker = ({
  value,
  onChange,
  onAddressChange,
  onCityChange,
  height = 400,
  isOpen = true,
}: MapPickerProps) => {
  const [position, setPosition] = useState<LatLngExpression | null>(
    value ? [value.lat, value.lng] : null,
  );
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  // Default center: Ho Chi Minh City
  const defaultCenter: LatLngExpression = [10.8231, 106.6297];

  useEffect(() => {
    if (value) {
      setPosition([value.lat, value.lng]);
    }
  }, [value]);

  const handlePositionChange = (pos: LatLngExpression) => {
    setPosition(pos);
    const [lat, lng] = pos as [number, number];
    onChange?.({ lat, lng });

    // Reverse geocoding to get address
    reverseGeocode(lat, lng);
  };

  // Helper to clean Vietnamese address prefixes
  const cleanCityName = (raw: string): string =>
    raw
      .replace(/^Thành phố\s+/i, '')
      .replace(/^Tỉnh\s+/i, '')
      .replace(/^Thành Phố\s+/i, '')
      .replace(/^TP\.?\s*/i, '')
      .trim();

  // Helper to extract city from Nominatim address, matching against VIETNAM_CITIES
  const extractCityFromAddress = (
    address: Record<string, string>,
    displayName?: string,
  ): string | null => {
    // Nominatim returns various fields depending on the location type
    const possibleCityFields = [
      'city',
      'town',
      'county',
      'state_district',
      'state',
      'province',
    ];

    const cityValues = VIETNAM_CITIES.map((c) => c.value as string);

    // Only return a city that exists in the predefined VIETNAM_CITIES list
    for (const field of possibleCityFields) {
      const raw = address[field];
      if (!raw) continue;
      const cleaned = cleanCityName(raw);
      if (cleaned && cityValues.includes(cleaned)) {
        return cleaned;
      }
    }

    // Fallback: parse display_name comma-separated parts
    if (displayName) {
      const parts = displayName.split(',').map((p) => cleanCityName(p.trim()));
      for (const part of parts) {
        if (part && cityValues.includes(part)) {
          return part;
        }
      }
    }

    return null;
  };

  // Reverse geocoding using Nominatim (OpenStreetMap)
  const reverseGeocode = async (lat: number, lng: number) => {
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&addressdetails=1`,
        {
          headers: {
            'User-Agent': 'CAMS-Store-Management', // Required by Nominatim
          },
        },
      );
      const data = await response.json();

      if (data.display_name) {
        onAddressChange?.(data.display_name);
      }

      // Extract and set city
      if (data.address) {
        const city = extractCityFromAddress(data.address, data.display_name);
        onCityChange?.(city);
      }
    } catch (error) {
      console.error('Reverse geocoding failed:', error);
    }
  };

  // Search location using Nominatim
  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      message.warning('Please enter a location to search!');
      return;
    }

    setIsSearching(true);
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}&limit=1`,
        {
          headers: {
            'User-Agent': 'CAMS-Store-Management',
          },
        },
      );
      const data = await response.json();

      if (data && data.length > 0) {
        const { lat, lon } = data[0];
        const newPos: LatLngExpression = [parseFloat(lat), parseFloat(lon)];
        handlePositionChange(newPos);
      } else {
        message.error('Location not found!');
      }
    } catch (error) {
      message.error('Search failed!');
      console.error('Search error:', error);
    } finally {
      setIsSearching(false);
    }
  };

  // Get user's current location
  const handleGetCurrentLocation = () => {
    if (!navigator.geolocation) {
      message.error('Geolocation is not supported by your browser!');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const newPos: LatLngExpression = [
          position.coords.latitude,
          position.coords.longitude,
        ];
        handlePositionChange(newPos);
      },
      (error) => {
        message.error('Failed to get your location!');
        console.error('Geolocation error:', error);
      },
    );
  };

  return (
    <div>
      {/* Search Bar */}
      <Space.Compact style={{ width: '100%', marginBottom: 8 }}>
        <Input
          placeholder='Search location (e.g., "789 Điện Biên Phủ, Bình Thạnh, HCMC")'
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onPressEnter={handleSearch}
        />
        <Button
          type='primary'
          icon={<SearchOutlined />}
          onClick={handleSearch}
          loading={isSearching}
        >
          Search
        </Button>
        <Button
          icon={<AimOutlined />}
          onClick={handleGetCurrentLocation}
        >
          My Location
        </Button>
      </Space.Compact>

      {/* Map */}
      <MapContainer
        center={position || defaultCenter}
        zoom={13}
        style={{ height, width: '100%', borderRadius: 8 }}
      >
        <ResizeMap isOpen={isOpen} />
        <MapController position={position} />
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url='https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png'
        />
        <LocationMarker
          position={position}
          setPosition={handlePositionChange}
        />
      </MapContainer>

      {/* Coordinates Display */}
      {position && (
        <div style={{ marginTop: 8 }}>
          <Text type='secondary'>
            Selected: Lat: {(position as [number, number])[0].toFixed(4)}, Lng:{' '}
            {(position as [number, number])[1].toFixed(4)}
          </Text>
        </div>
      )}
    </div>
  );
};
