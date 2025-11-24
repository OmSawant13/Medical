const QRCode = require('qrcode');

const generateQRCode = async (appointmentId) => {
  try {
    const qrData = JSON.stringify({
      appointment_id: appointmentId,
      timestamp: Date.now()
    });
    
    const qrCodeDataURL = await QRCode.toDataURL(qrData);
    return qrCodeDataURL;
  } catch (error) {
    throw new Error('Failed to generate QR code');
  }
};

const generateQRCodeString = async (appointmentId) => {
  try {
    const qrData = JSON.stringify({
      appointment_id: appointmentId,
      timestamp: Date.now()
    });
    
    return qrData;
  } catch (error) {
    throw new Error('Failed to generate QR code string');
  }
};

module.exports = { generateQRCode, generateQRCodeString };

