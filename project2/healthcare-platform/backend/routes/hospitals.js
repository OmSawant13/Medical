/**
 * Hospitals API entrypoint.
 *
 * NOTE:
 * `backend/server.js` expects `./routes/hospitals`.
 * The actual implementation currently lives in `./routes/hospital.js`.
 * This file is a thin wrapper to keep naming consistent without breaking imports.
 */

module.exports = require('./hospital');


