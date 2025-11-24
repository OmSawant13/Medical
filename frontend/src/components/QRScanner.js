import React, { useState } from 'react';
import { appointmentAPI } from '../services/api';
import { toast } from 'react-toastify';

const QRScanner = ({ onScanSuccess }) => {
  const [qrData, setQrData] = useState('');

  const handleScan = async () => {
    if (!qrData.trim()) {
      toast.error('Please enter QR code data');
      return;
    }

    try {
      // Parse QR code JSON
      const qrCodeData = JSON.parse(qrData);
      const appointmentId = qrCodeData.appointment_id;
      
      if (!appointmentId) {
        toast.error('Invalid QR code format');
        return;
      }

      const response = await appointmentAPI.scanQR(appointmentId, qrData);
      
      if (onScanSuccess) {
        onScanSuccess(response.data);
      }
      toast.success('QR code scanned successfully!');
      setQrData('');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Invalid QR code or expired');
    }
  };

  return (
    <div className="card">
      <h3>Scan QR Code</h3>
      <div className="form-group">
        <label>QR Code Data</label>
        <textarea
          value={qrData}
          onChange={(e) => setQrData(e.target.value)}
          placeholder="Paste QR code data here or scan with camera"
          rows="4"
        />
      </div>
      <button className="btn btn-primary" onClick={handleScan}>
        Scan QR Code
      </button>
    </div>
  );
};

export default QRScanner;

