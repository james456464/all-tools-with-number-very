import { DeviceLocation } from '../types';

export const getDeviceLocation = async (): Promise<DeviceLocation> => {
  try {
    // Try to get location from IP geolocation service
    const response = await fetch('https://ipapi.co/json/');
    if (response.ok) {
      const data = await response.json();
      return {
        country: data.country_name || 'Unknown',
        region: data.region || 'Unknown',
        city: data.city || 'Unknown',
        ip: data.ip || 'Unknown',
        timezone: data.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone
      };
    }
  } catch (error) {
    console.warn('Failed to get location from IP service');
  }

  // Fallback to basic timezone info
  return {
    country: 'Unknown',
    region: 'Unknown',
    city: 'Unknown',
    ip: 'Unknown',
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
  };
};

export const formatLocation = (location?: DeviceLocation): string => {
  if (!location) return 'Unknown Location';
  
  const parts = [location.city, location.region, location.country]
    .filter(part => part && part !== 'Unknown');
  
  return parts.length > 0 ? parts.join(', ') : 'Unknown Location';
};