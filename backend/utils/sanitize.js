// Strips out any keys starting with $ or containing . from req.body
// This prevents MongoDB operator injection attacks like { "$gt": "" }
function sanitizeBody(req, res, next) {
    if (req.body && typeof req.body === 'object') {
      req.body = sanitizeObject(req.body);
    }
    next();
  }
  
  function sanitizeObject(obj) {
    if (Array.isArray(obj)) return obj.map(sanitizeObject);
    if (typeof obj !== 'object' || obj === null) return obj;
  
    const clean = {};
    for (const key of Object.keys(obj)) {
      if (key.startsWith('$') || key.includes('.')) continue; // drop dangerous keys
      clean[key] = sanitizeObject(obj[key]);
    }
    return clean;
  }
  
  module.exports = { sanitizeBody };