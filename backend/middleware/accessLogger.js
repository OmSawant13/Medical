const AccessLog = require('../models/AccessLog');

const logAccess = async (req, res, next) => {
  // Store original json method
  const originalJson = res.json.bind(res);
  
  // Override json method to log after response
  res.json = function(data) {
    // Only log if user is authenticated and accessing patient data
    if (req.user && req.params.patientId) {
      logAccessAsync(req, req.params.patientId, 'view_profile', 'patient_profile', req.params.patientId);
    }
    return originalJson(data);
  };
  
  next();
};

const logAccessAsync = async (req, patientId, accessType, resourceType, resourceId) => {
  try {
    await AccessLog.create({
      patient_id: patientId,
      accessed_by: req.user.user_id,
      access_type: accessType,
      resource_type: resourceType,
      resource_id: resourceId,
      ip_address: req.ip || req.connection.remoteAddress,
      user_agent: req.get('user-agent')
    });
  } catch (error) {
    console.error('Error logging access:', error);
    // Don't throw error, just log it
  }
};

const logAccessSync = async (patientId, accessedBy, accessType, resourceType, resourceId, req) => {
  try {
    await AccessLog.create({
      patient_id: patientId,
      accessed_by: accessedBy,
      access_type: accessType,
      resource_type: resourceType,
      resource_id: resourceId,
      ip_address: req?.ip || req?.connection?.remoteAddress,
      user_agent: req?.get('user-agent')
    });
  } catch (error) {
    console.error('Error logging access:', error);
  }
};

module.exports = { logAccess, logAccessSync };

