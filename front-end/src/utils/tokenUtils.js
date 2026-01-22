/**
 * Decode JWT token without verification (client-side only)
 * Note: This only decodes the payload, it doesn't verify the signature
 */
export const decodeToken = (token) => {
  try {
    if (!token) return null;
    
    const base64Url = token.split('.')[1];
    if (!base64Url) return null;
    
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    
    return JSON.parse(jsonPayload);
  } catch (error) {
    console.error('Error decoding token:', error);
    return null;
  }
};

/**
 * Check if token is expired
 */
export const isTokenExpired = (token) => {
  if (!token) return true;
  
  const decoded = decodeToken(token);
  if (!decoded || !decoded.exp) return true;
  
  // exp is in seconds, Date.now() is in milliseconds
  const currentTime = Date.now() / 1000;
  return decoded.exp < currentTime;
};

/**
 * Get time until token expires (in milliseconds)
 */
export const getTokenExpirationTime = (token) => {
  if (!token) return 0;
  
  const decoded = decodeToken(token);
  if (!decoded || !decoded.exp) return 0;
  
  // exp is in seconds, convert to milliseconds
  const expirationTime = decoded.exp * 1000;
  const currentTime = Date.now();
  
  return Math.max(0, expirationTime - currentTime);
};

