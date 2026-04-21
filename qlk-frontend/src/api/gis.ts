import client from './client';

export interface MapMarker {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  type: 'Request' | 'Technician';
  status: string;
  description?: string;
  inventory?: Record<string, number>;
}

export interface HeatmapPoint {
  latitude: number;
  longitude: number;
  intensity: number;
}

export interface DispatchRecommendation {
  technicianId: string;
  technicianName: string;
  distanceKm: number;
  hasRequiredStock: boolean;
  currentInventory: Record<string, number>;
}

export const gisApi = {
  getMarkers: () => client.get<MapMarker[]>('/gis/markers'),
  getHeatmap: () => client.get<HeatmapPoint[]>('/gis/heatmap'),
  getRecommendations: (requestId: string) => client.get<DispatchRecommendation[]>(`/gis/recommendations/${requestId}`),
  updateLocation: (lat: number, lng: number) => client.post('/gis/location', { latitude: lat, longitude: lng }),
  seedDemo: () => client.post('/gis/seed-demo'),
  refreshGeocoding: () => client.post('/gis/refresh-geocoding'),
};
