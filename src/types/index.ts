export interface ApiKey {
  id: string;
  key: string;
  name: string;
  deviceId: string;
  deviceLocation?: DeviceLocation;
  createdAt: string;
  expiresAt: string;
  isActive: boolean;
  lastUsed?: string;
}

export interface DeviceLocation {
  country?: string;
  region?: string;
  city?: string;
  ip?: string;
  timezone?: string;
}

export interface UserProfile {
  keyId: string;
  keyName: string;
  createdAt: string;
  expiresAt: string;
  deviceLocation?: DeviceLocation;
  isExpired: boolean;
  daysUntilExpiry: number;
}