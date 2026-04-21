import React, { useEffect, useRef } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { X, Camera, AlertCircle, Plus } from 'lucide-react';

interface QRScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onScanSuccess: (decodedText: string) => void;
}

const QRScannerModal: React.FC<QRScannerModalProps> = ({ isOpen, onClose, onScanSuccess }) => {
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const regionId = "qr-reader";

  useEffect(() => {
    if (isOpen) {
      const startScanner = async () => {
        try {
          const scanner = new Html5Qrcode(regionId);
          scannerRef.current = scanner;

          const config = {
            fps: 10,
            qrbox: { width: 250, height: 250 },
            aspectRatio: 1.0
          };

          await scanner.start(
            { facingMode: "environment" },
            config,
            (decodedText) => {
              onScanSuccess(decodedText);
              stopScanner();
              onClose();
            },
            () => {
              // Ignore frames with no QR code
            }
          );
        } catch (err) {
          console.error("Failed to start scanner:", err);
        }
      };

      // Slight delay to ensure the container is rendered
      const timer = setTimeout(startScanner, 300);
      return () => {
        clearTimeout(timer);
        stopScanner();
      };
    }
  }, [isOpen]);

  const stopScanner = async () => {
    if (scannerRef.current && scannerRef.current.isScanning) {
      try {
        await scannerRef.current.stop();
        scannerRef.current = null;
      } catch (err) {
        console.error("Failed to stop scanner:", err);
      }
    }
  };

  if (!isOpen) return null;

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0,0,0,0.85)',
      backdropFilter: 'blur(8px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 2000
    }} onClick={onClose}>
      <div 
        className="card animate-scale-in" 
        style={{ width: '450px', padding: '24px', position: 'relative' }} 
        onClick={e => e.stopPropagation()}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Camera size={20} color="var(--primary)" />
            <h3 style={{ fontSize: '18px', fontWeight: 800 }}>Quét mã QR sản phẩm</h3>
          </div>
          <button 
            onClick={onClose} 
            style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
          >
            <X size={20} />
          </button>
        </div>

        <div 
          id={regionId} 
          style={{ 
            width: '100%', 
            borderRadius: '16px', 
            overflow: 'hidden', 
            background: 'black',
            aspectRatio: '1/1',
            border: '2px solid rgba(255,255,255,0.1)',
            position: 'relative'
          }}
        >
          {/* Overlay for processing or errors could go here */}
        </div>

        <div style={{ marginTop: '20px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ flex: 1, height: '1px', background: 'var(--border)' }}></div>
            <span style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 600 }}>HOẶC</span>
            <div style={{ flex: 1, height: '1px', background: 'var(--border)' }}></div>
          </div>

          <label 
            className="action-btn" 
            style={{ 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center', 
              gap: '10px', 
              cursor: 'pointer',
              padding: '14px',
              fontWeight: 700,
              background: 'white',
              border: '2px dashed var(--primary-light)',
              color: 'var(--primary)',
              transition: 'all 0.2s'
            }}
          >
            <Plus size={18} />
            Chọn ảnh từ thiết bị
            <input 
              type="file" 
              accept="image/*" 
              hidden 
              onChange={async (e) => {
                const file = e.target.files?.[0];
                if (!file) return;

                try {
                  const html5QrCode = new Html5Qrcode(regionId);
                  const decodedText = await html5QrCode.scanFile(file, true);
                  onScanSuccess(decodedText);
                  onClose();
                } catch (err) {
                  console.error("File scan failed:", err);
                  alert("Không tìm thấy mã QR trong ảnh này. Vui lòng thử ảnh khác.");
                }
              }} 
            />
          </label>
        </div>

        <div style={{ marginTop: '20px', padding: '12px', background: 'var(--primary-lighter)', borderRadius: '12px', border: '1px solid var(--border)', display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
          <AlertCircle size={16} color="var(--primary)" style={{ marginTop: '2px' }} />
          <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: '1.5' }}>
            Bạn có thể đưa mã QR vào camera hoặc tải ảnh có chứa mã QR lên để hệ thống nhận diện.
          </p>
        </div>

        <button 
          onClick={onClose} 
          className="action-btn" 
          style={{ width: '100%', marginTop: '20px', padding: '14px', fontWeight: 600, color: 'var(--error)', borderColor: 'var(--error-light)' }}
        >
          Hủy bỏ
        </button>
      </div>
    </div>
  );
};

export default QRScannerModal;
