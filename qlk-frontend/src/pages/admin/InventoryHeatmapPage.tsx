import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet.heat';

// Fix for Leaflet plugins in Vite environment
if (typeof window !== 'undefined') {
  (window as any).L = L;
}

import { gisApi } from '../../api/gis';
import type { MapMarker, HeatmapPoint, DispatchRecommendation } from '../../api/gis';
import { MapPin, User, Package, Navigation, AlertCircle, RefreshCw, QrCode, X, CheckCircle2, Zap, Signal, Clock } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { serviceRequestApi } from '../../api/serviceRequests';

// Local Error Boundary for the Map component
class MapErrorBoundary extends React.Component<{children: React.ReactNode}, {hasError: boolean, error: any}> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error: any) { return { hasError: true, error }; }
  render() {
    if (this.state.hasError) {
      return (
        <div className="w-full h-full flex flex-col items-center justify-center bg-slate-50 p-6 text-center">
          <AlertCircle size={48} className="text-rose-500 mb-4" />
          <h3 className="text-xl font-bold text-slate-800">Lỗi nạp Bản đồ</h3>
          <p className="text-slate-500 mt-2 max-w-md">{this.state.error?.toString()}</p>
          <button onClick={() => window.location.reload()} className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg font-bold">Thử lại</button>
        </div>
      );
    }
    return this.props.children;
  }
}

// Small helper for size issues — MUST be inside MapContainer
const MapResizer = () => {
  const map = useMap();
  useEffect(() => {
    const t1 = setTimeout(() => map.invalidateSize(), 300);
    const t2 = setTimeout(() => map.invalidateSize(), 800);
    const t3 = setTimeout(() => map.invalidateSize(), 1500);
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
  }, [map]);
  return null;
};

// Helper for map events
const MapEvents = ({ onMapClick }: { onMapClick: () => void }) => {
  useMapEvents({ click: () => onMapClick() });
  return null;
};

// Helper for flyTo functionality — MUST be inside MapContainer
const MapController = ({ focusLocation, zoomLevel }: { focusLocation: [number, number] | null, zoomLevel?: number }) => {
  const map = useMap();
  useEffect(() => {
    if (focusLocation) {
      map.flyTo(focusLocation, zoomLevel || 16, { duration: 1.5, easeLinearity: 0.25 });
    }
  }, [focusLocation, map, zoomLevel]);
  return null;
};

// VNPT Cao Lãnh Center
const CAO_LANH_CENTER: [number, number] = [10.4578, 105.6324];

// Fix Leaflet marker icons
// @ts-ignore
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Custom Icons
const technicianIcon = new L.Icon({
  iconUrl: 'https://cdn-icons-png.flaticon.com/512/3063/3063822.png',
  iconSize: [36, 36],
  iconAnchor: [18, 36],
  popupAnchor: [0, -36]
});

const requestPendingIcon = new L.Icon({
  iconUrl: 'https://cdn-icons-png.flaticon.com/512/5695/5695641.png',
  iconSize: [32, 32],
  iconAnchor: [16, 32],
  popupAnchor: [0, -32]
});

// Heatmap Layer Component — MUST be inside MapContainer
const HeatmapLayer = ({ points }: { points: HeatmapPoint[] }) => {
  const map = useMap();

  useEffect(() => {
    if (!map || !points || points.length === 0) return;
    let heatLayer: any = null;
    const timeoutId = setTimeout(() => {
      try {
        map.invalidateSize();
        const validPoints = points
          .filter(p => p && !isNaN(p.latitude) && !isNaN(p.longitude) && p.latitude !== 0 && p.longitude !== 0)
          .map(p => [p.latitude, p.longitude, p.intensity || 1]);
        if (validPoints.length === 0) return;
        const LGlobal = (window as any).L || L;
        if (typeof (LGlobal as any).heatLayer === 'function') {
          heatLayer = (LGlobal as any).heatLayer(validPoints, {
            radius: 30, blur: 20, maxZoom: 17,
            gradient: { 0.3: '#3b82f6', 0.5: '#22d3ee', 0.7: '#84cc16', 0.85: '#facc15', 1: '#ef4444' }
          }).addTo(map);
        }
      } catch (err) {
        console.error('Heatmap rendering error:', err);
      }
    }, 300);
    return () => {
      clearTimeout(timeoutId);
      if (map && heatLayer) {
        try { map.removeLayer(heatLayer); } catch (e) {}
      }
    };
  }, [map, points]);
  return null;
};

const InventoryHeatmapPage: React.FC = () => {
  const [markers, setMarkers] = useState<MapMarker[]>([]);
  const [heatmapPoints, setHeatmapPoints] = useState<HeatmapPoint[]>([]);
  const [selectedRequest, setSelectedRequest] = useState<MapMarker | null>(null);
  const [recommendations, setRecommendations] = useState<DispatchRecommendation[]>([]);
  const [isLoadingRecs, setIsLoadingRecs] = useState(false);
  const [isDispatching, setIsDispatching] = useState<string | null>(null);
  const [showHeatmap, setShowHeatmap] = useState(true);
  const [focusLocation, setFocusLocation] = useState<[number, number] | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchData();
    setTimeout(() => window.dispatchEvent(new Event('resize')), 500);
  }, []);

  const fetchData = async () => {
    setIsLoading(true);
    setError('');
    try {
      const [markersRes, heatmapRes] = await Promise.all([
        gisApi.getMarkers(),
        gisApi.getHeatmap()
      ]);
      setMarkers(markersRes.data);
      setHeatmapPoints(heatmapRes.data || []);
    } catch (err: any) {
      setError(err.response?.status === 401 ? 'Lỗi xác thực (401)' : (err.message || 'Lỗi kết nối API'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleMarkerClick = async (marker: MapMarker) => {
    if (marker.type === 'Request') {
      setSelectedRequest(marker);
      setFocusLocation([marker.latitude, marker.longitude]);
      setIsLoadingRecs(true);
      setRecommendations([]);
      try {
        const res = await gisApi.getRecommendations(marker.id);
        setRecommendations(res.data);
      } catch (error) {
        console.error('Failed to fetch recommendations', error);
      } finally {
        setIsLoadingRecs(false);
      }
    }
  };

  const handleDispatch = async (techId: string, techName: string) => {
    if (!selectedRequest) return;
    setIsDispatching(techId);
    try {
      await serviceRequestApi.assignTechnician(selectedRequest.id, techId);
      await fetchData();
      setSelectedRequest(null);
      setRecommendations([]);
    } catch (error) {
      console.error('Dispatch failed', error);
      alert('Lỗi khi điều phối. Vui lòng thử lại.');
    } finally {
      setIsDispatching(null);
    }
  };

  const requestMarkers = markers.filter(m => m.type === 'Request');
  const techMarkers = markers.filter(m => m.type === 'Technician');
  const validMarkers = markers.filter(m => m.latitude && m.longitude && m.latitude !== 0 && m.longitude !== 0);

  return (
    <MapErrorBoundary>
      <div style={{ height: 'calc(100vh - 84px)', width: '100%', position: 'relative', overflow: 'hidden', background: '#f0f4f8' }}>

        {/* === MAP === */}
        <div style={{ position: 'absolute', inset: 0, zIndex: 0 }}>
          <MapContainer center={CAO_LANH_CENTER} zoom={14} style={{ height: '100%', width: '100%' }} zoomControl={true} scrollWheelZoom={true}>
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            {/* These MUST be inside MapContainer */}
            <MapResizer />
            <MapController focusLocation={focusLocation} zoomLevel={16} />
            <MapEvents onMapClick={() => { setSelectedRequest(null); setRecommendations([]); }} />
            {showHeatmap && heatmapPoints.length > 0 && <HeatmapLayer points={heatmapPoints} />}

            {validMarkers.map(marker => (
              <Marker
                key={`${marker.type}-${marker.id}`}
                position={[marker.latitude, marker.longitude]}
                icon={marker.type === 'Technician' ? technicianIcon : requestPendingIcon}
                eventHandlers={{ click: () => handleMarkerClick(marker) }}
              >
                <Popup className="custom-popup">
                  <div style={{ padding: '12px', minWidth: '200px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                      <div style={{
                        width: '32px', height: '32px', borderRadius: '8px',
                        background: marker.type === 'Technician' ? '#dbeafe' : '#fee2e2',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        color: marker.type === 'Technician' ? '#2563eb' : '#dc2626'
                      }}>
                        {marker.type === 'Technician' ? <User size={16}/> : <MapPin size={16}/>}
                      </div>
                      <div>
                        <div style={{ fontWeight: 700, fontSize: '14px' }}>{marker.name}</div>
                        <div style={{ fontSize: '11px', color: '#64748b', fontWeight: 600, textTransform: 'uppercase' }}>
                          {marker.type === 'Technician' ? 'Kỹ thuật viên' : 'Yêu cầu lắp đặt'}
                        </div>
                      </div>
                    </div>
                    <div style={{ fontSize: '12px', color: '#475569', background: '#f8fafc', padding: '8px', borderRadius: '8px' }}>
                      {marker.description || marker.status || 'Không có mô tả'}
                    </div>
                    {marker.type === 'Request' && (
                      <button
                        onClick={() => handleMarkerClick(marker)}
                        style={{ width: '100%', marginTop: '8px', padding: '8px', background: '#0066CC', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 700, fontSize: '12px', cursor: 'pointer' }}
                      >
                        Xem đề xuất KTV →
                      </button>
                    )}
                    {marker.type === 'Technician' && marker.inventory && Object.keys(marker.inventory).length > 0 && (
                      <div style={{ marginTop: '8px' }}>
                        <div style={{ fontSize: '11px', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <Package size={12}/> Thiết bị trong xe
                        </div>
                        {Object.entries(marker.inventory).map(([item, qty]) => (
                          <div key={item} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', padding: '2px 0' }}>
                            <span style={{ color: '#475569' }}>{item}</span>
                            <span style={{ fontWeight: 700, color: '#0066CC' }}>{qty}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </Popup>
              </Marker>
            ))}
          </MapContainer>
        </div>

        {/* === FLOATING HEADER === */}
        <div style={{ position: 'absolute', top: '16px', left: '16px', right: selectedRequest ? '420px' : '16px', zIndex: 1000, display: 'flex', justifyContent: 'space-between', alignItems: 'center', pointerEvents: 'none', transition: 'right 0.3s ease' }}>
          {/* Left: Title + stats */}
          <div style={{ background: 'rgba(255,255,255,0.92)', backdropFilter: 'blur(16px)', padding: '12px 20px', borderRadius: '16px', boxShadow: '0 8px 32px rgba(0,0,0,0.12)', border: '1px solid rgba(255,255,255,0.6)', pointerEvents: 'auto', display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: 'linear-gradient(135deg, #0066CC, #004499)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', boxShadow: '0 4px 12px rgba(0,102,204,0.4)' }}>
              <Navigation size={20} />
            </div>
            <div>
              <h1 style={{ fontSize: '16px', fontWeight: 800, color: '#0f172a', margin: 0 }}>Bản đồ Điều phối GIS</h1>
              <p style={{ fontSize: '11px', color: '#64748b', margin: 0, fontWeight: 500 }}>VNPT Cao Lãnh • Thời gian thực</p>
            </div>
            <div style={{ width: '1px', height: '36px', background: '#e2e8f0' }} />
            {/* Stats */}
            <div style={{ display: 'flex', gap: '16px' }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '20px', fontWeight: 800, color: '#0066CC' }}>{techMarkers.length}</div>
                <div style={{ fontSize: '10px', color: '#94a3b8', fontWeight: 600, textTransform: 'uppercase' }}>KTV</div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '20px', fontWeight: 800, color: '#ef4444' }}>{requestMarkers.length}</div>
                <div style={{ fontSize: '10px', color: '#94a3b8', fontWeight: 600, textTransform: 'uppercase' }}>Yêu cầu</div>
              </div>
            </div>
            <div style={{ width: '1px', height: '36px', background: '#e2e8f0' }} />
            {/* Heatmap toggle */}
            <div
              onClick={() => setShowHeatmap(!showHeatmap)}
              style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '6px 12px', borderRadius: '20px', cursor: 'pointer', border: '1px solid', transition: 'all 0.2s', fontWeight: 700, fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.05em',
                background: showHeatmap ? '#fff7ed' : '#f8fafc',
                color: showHeatmap ? '#ea580c' : '#94a3b8',
                borderColor: showHeatmap ? '#fed7aa' : '#e2e8f0'
              }}
            >
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: showHeatmap ? '#ea580c' : '#cbd5e1', animation: showHeatmap ? 'pulse 2s infinite' : 'none' }} />
              Bản đồ nhiệt
            </div>
          </div>

          {/* Right: action buttons */}
          <div style={{ display: 'flex', gap: '8px', pointerEvents: 'auto' }}>
            <button
              onClick={fetchData}
              style={{ padding: '10px', background: 'rgba(255,255,255,0.92)', backdropFilter: 'blur(16px)', border: '1px solid rgba(255,255,255,0.6)', borderRadius: '12px', cursor: 'pointer', color: '#0066CC', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
              title="Làm mới dữ liệu"
            >
              <RefreshCw size={18} className={isLoading ? 'animate-spin' : ''} />
            </button>
            <button
              onClick={async () => {
                if (confirm('Đồng bộ lại tọa độ toàn hệ thống từ địa chỉ?')) {
                  await gisApi.refreshGeocoding();
                  fetchData();
                }
              }}
              style={{ padding: '10px 18px', background: 'linear-gradient(135deg, #0066CC, #004499)', color: 'white', border: 'none', borderRadius: '12px', fontWeight: 700, fontSize: '13px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', boxShadow: '0 4px 16px rgba(0,102,204,0.4)' }}
            >
              <QrCode size={16} /> Đồng bộ Smart-GIS
            </button>
          </div>
        </div>

        {/* === DISPATCH SIDEBAR PANEL === */}
        <AnimatePresence>
          {selectedRequest && (
            <motion.div
              initial={{ x: 420, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: 420, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              style={{
                position: 'absolute', top: 0, right: 0, bottom: 0, width: '400px',
                background: 'rgba(255,255,255,0.97)', backdropFilter: 'blur(20px)',
                zIndex: 1000, display: 'flex', flexDirection: 'column',
                boxShadow: '-8px 0 40px rgba(0,0,0,0.15)',
                borderLeft: '1px solid rgba(0,102,204,0.1)'
              }}
            >
              {/* Sidebar Header */}
              <div style={{ padding: '20px', background: 'linear-gradient(135deg, #0066CC, #004499)', color: 'white' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <div style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', opacity: 0.8, marginBottom: '4px' }}>Yêu cầu được chọn</div>
                    <h2 style={{ fontSize: '18px', fontWeight: 800, margin: 0 }}>{selectedRequest.name}</h2>
                    <p style={{ fontSize: '12px', opacity: 0.85, margin: '4px 0 0 0' }}>{selectedRequest.description}</p>
                  </div>
                  <button
                    onClick={() => { setSelectedRequest(null); setRecommendations([]); }}
                    style={{ background: 'rgba(255,255,255,0.15)', border: 'none', borderRadius: '8px', padding: '6px', cursor: 'pointer', color: 'white' }}
                  >
                    <X size={18} />
                  </button>
                </div>
                <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
                  <span style={{ background: 'rgba(255,255,255,0.2)', padding: '3px 10px', borderRadius: '12px', fontSize: '11px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Signal size={10} /> {selectedRequest.status}
                  </span>
                </div>
              </div>

              {/* KTV Recommendations */}
              <div style={{ flex: 1, overflowY: 'auto', padding: '16px' }}>
                <div style={{ fontSize: '12px', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Zap size={14} color="#0066CC" />
                  Đề xuất kỹ thuật viên (Gần nhất)
                </div>

                {isLoadingRecs ? (
                  <div style={{ textAlign: 'center', padding: '40px' }}>
                    <div style={{ width: '40px', height: '40px', border: '3px solid #dbeafe', borderTopColor: '#0066CC', borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto 12px' }} />
                    <p style={{ fontSize: '13px', color: '#94a3b8', fontWeight: 500 }}>Đang tìm kỹ thuật viên phù hợp...</p>
                  </div>
                ) : recommendations.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '40px', color: '#94a3b8' }}>
                    <User size={40} style={{ opacity: 0.2, marginBottom: '12px' }} />
                    <p style={{ fontWeight: 500 }}>Không tìm thấy kỹ thuật viên</p>
                    <p style={{ fontSize: '12px' }}>Hệ thống chưa có dữ liệu KTV</p>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {recommendations.map((rec, idx) => (
                      <motion.div
                        key={rec.technicianId}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: idx * 0.05 }}
                        style={{
                          padding: '14px', borderRadius: '14px',
                          background: '#f8fafc', border: '1.5px solid',
                          borderColor: rec.hasRequiredStock ? '#dbeafe' : '#f1f5f9',
                          boxShadow: rec.hasRequiredStock ? '0 2px 8px rgba(0,102,204,0.08)' : 'none'
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <div style={{ width: '38px', height: '38px', borderRadius: '10px', background: '#dbeafe', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#2563eb', fontWeight: 800, fontSize: '16px' }}>
                              {rec.technicianName.charAt(0)}
                            </div>
                            <div>
                              <div style={{ fontWeight: 700, fontSize: '14px', color: '#0f172a' }}>{rec.technicianName}</div>
                              <div style={{ fontSize: '12px', color: '#0066CC', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}>
                                <Navigation size={11} /> {rec.distanceKm} km
                              </div>
                            </div>
                          </div>
                          <button
                            disabled={isDispatching === rec.technicianId}
                            onClick={() => handleDispatch(rec.technicianId, rec.technicianName)}
                            style={{
                              padding: '8px 16px', borderRadius: '10px', border: 'none', cursor: 'pointer', fontWeight: 800, fontSize: '12px', transition: 'all 0.2s',
                              background: 'linear-gradient(135deg, #0066CC, #004499)',
                              color: 'white', boxShadow: '0 3px 10px rgba(0,102,204,0.3)',
                              opacity: isDispatching ? 0.7 : 1
                            }}
                          >
                            {isDispatching === rec.technicianId ? (
                              <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                <RefreshCw size={12} className="animate-spin" /> Đang giao...
                              </span>
                            ) : (
                              <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                <CheckCircle2 size={12} /> Giao việc
                              </span>
                            )}
                          </button>
                        </div>

                        {/* Inventory of technician */}
                        {Object.keys(rec.currentInventory || {}).length > 0 ? (
                          <div style={{ background: 'white', borderRadius: '8px', padding: '8px 10px', border: '1px solid #e2e8f0' }}>
                            <div style={{ fontSize: '10px', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                              <Package size={11} /> Thiết bị trong xe
                            </div>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                              {Object.entries(rec.currentInventory).map(([item, qty]) => (
                                <span key={item} style={{ fontSize: '11px', background: '#dbeafe', color: '#1d4ed8', padding: '2px 8px', borderRadius: '8px', fontWeight: 600 }}>
                                  {item}: {qty}
                                </span>
                              ))}
                            </div>
                          </div>
                        ) : (
                          <div style={{ fontSize: '11px', color: '#94a3b8', background: '#f8fafc', padding: '6px 10px', borderRadius: '8px', textAlign: 'center' }}>
                            Không có thiết bị trong xe — vẫn có thể điều phối
                          </div>
                        )}
                      </motion.div>
                    ))}
                  </div>
                )}
              </div>

              {/* Sidebar Footer */}
              <div style={{ padding: '12px 16px', borderTop: '1px solid #f1f5f9', background: '#f8fafc' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', color: '#94a3b8' }}>
                  <Clock size={12} />
                  Dữ liệu cập nhật theo thời gian thực • Nhấn vào bản đồ để đóng panel
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* === LEGEND BAR === */}
        <div style={{
          position: 'absolute', bottom: '16px', left: '16px', zIndex: 1000,
          background: 'rgba(255,255,255,0.92)', backdropFilter: 'blur(16px)',
          padding: '10px 16px', borderRadius: '12px',
          boxShadow: '0 4px 16px rgba(0,0,0,0.12)', border: '1px solid rgba(255,255,255,0.6)',
          display: 'flex', gap: '16px', alignItems: 'center'
        }}>
          <span style={{ fontSize: '10px', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Chú giải</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <img src="https://cdn-icons-png.flaticon.com/512/3063/3063822.png" style={{ width: '18px', height: '18px' }} />
            <span style={{ fontSize: '12px', fontWeight: 600, color: '#1d4ed8' }}>Kỹ thuật viên</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <img src="https://cdn-icons-png.flaticon.com/512/5695/5695641.png" style={{ width: '16px', height: '16px' }} />
            <span style={{ fontSize: '12px', fontWeight: 600, color: '#dc2626' }}>Yêu cầu KH</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <div style={{ width: '16px', height: '8px', borderRadius: '4px', background: 'linear-gradient(to right, #3b82f6, #facc15, #ef4444)' }} />
            <span style={{ fontSize: '12px', fontWeight: 600, color: '#64748b' }}>Mật độ yêu cầu</span>
          </div>
        </div>

        {/* Error / No-data panel */}
        {(error || (!isLoading && markers.length === 0)) && (
          <div style={{ position: 'absolute', bottom: '16px', right: selectedRequest ? '420px' : '16px', zIndex: 1000, transition: 'right 0.3s ease' }}>
            <div style={{ background: 'rgba(255,255,255,0.95)', border: '1px solid #fecaca', padding: '16px', borderRadius: '16px', maxWidth: '280px', boxShadow: '0 8px 24px rgba(0,0,0,0.1)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#dc2626', fontWeight: 700, marginBottom: '8px' }}>
                <AlertCircle size={16} /> {error ? 'Lỗi kết nối' : 'Không có dữ liệu'}
              </div>
              {error && <p style={{ fontSize: '12px', color: '#64748b', margin: '0 0 10px' }}>{error}</p>}
              <button
                onClick={async () => { await gisApi.seedDemo(); fetchData(); }}
                style={{ width: '100%', padding: '8px', background: '#1e293b', color: 'white', border: 'none', borderRadius: '8px', fontSize: '12px', fontWeight: 700, cursor: 'pointer' }}
              >
                Reset & Seed Demo Data
              </button>
            </div>
          </div>
        )}

        <style>{`
          @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
          @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.4; } }
          .custom-popup .leaflet-popup-content-wrapper { border-radius: 16px; padding: 0; box-shadow: 0 12px 40px rgba(0,0,0,0.15); overflow: hidden; }
          .custom-popup .leaflet-popup-content { margin: 0; }
          .custom-popup .leaflet-popup-tip { background: white; }
        `}</style>
      </div>
    </MapErrorBoundary>
  );
};

export default InventoryHeatmapPage;
