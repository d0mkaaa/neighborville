/**
 * Extract the real client IP address from request, handling proxy headers
 * @param {Request} req - Express request object
 * @returns {string} - Real client IP address
 */
export const getRealIP = (req) => {
  const forwardedFor = req.headers['x-forwarded-for'];
  const realIP = req.headers['x-real-ip'];
  const cfConnectingIP = req.headers['cf-connecting-ip'];
  const xForwardedFor = req.headers['x-forwarded-for'];
  
  if (forwardedFor) {
    const ips = forwardedFor.split(',').map(ip => ip.trim());
    const clientIP = ips[0];
    if (clientIP && !isPrivateIP(clientIP)) {
      return clientIP;
    }
  }
  
  if (realIP && !isPrivateIP(realIP)) {
    return realIP;
  }
  
  if (cfConnectingIP && !isPrivateIP(cfConnectingIP)) {
    return cfConnectingIP;
  }
  
  if (req.ip && !isPrivateIP(req.ip)) {
    return req.ip;
  }
  
  return req.connection?.remoteAddress || req.socket?.remoteAddress || 'unknown';
};

/**
 * Check if an IP address is private/local
 * @param {string} ip - IP address to check
 * @returns {boolean} - True if private IP
 */
const isPrivateIP = (ip) => {
  if (!ip || ip === 'unknown') return true;
  
  const cleanIP = ip.replace(/^::ffff:/, '');
  
  const privateRanges = [
    /^10\./,                    
    /^172\.(1[6-9]|2[0-9]|3[0-1])\./, 
    /^192\.168\./,              
    /^127\./,                   
    /^169\.254\./,              
    /^::1$/,                    
    /^fe80:/,                   
    /^fc00:/,                   
    /^fd00:/  
  ];
  
  return privateRanges.some(range => range.test(cleanIP));
}; 