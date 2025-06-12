import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import { sha256 } from "js-sha256";
import { ApiKey, DeviceLocation, UserProfile } from "../types";
import { getDeviceLocation } from "../utils/location";

interface SecurityContextType {
  isAuthenticated: boolean;
  currentProfile: UserProfile | null;
  login: (key: string) => Promise<boolean>;
  logout: () => void;
  apiKeys: ApiKey[];
  addApiKey: (key: string, name: string, expiresAt: string) => Promise<void>;
  removeApiKey: (id: string) => void;
  getDeviceFingerprint: () => string;
}

const SecurityContext = createContext<SecurityContextType | undefined>(
  undefined
);

export const useSecurity = () => {
  const context = useContext(SecurityContext);
  if (!context) {
    throw new Error("useSecurity must be used within a SecurityProvider");
  }
  return context;
};

export const SecurityProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentProfile, setCurrentProfile] = useState<UserProfile | null>(
    null
  );
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([]);

  const getDeviceFingerprint = (): string => {
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    if (ctx) {
      ctx.textBaseline = "top";
      ctx.font = "14px Arial";
      ctx.fillText("Device fingerprint", 2, 2);
    }

    const fingerprint = [
      navigator.userAgent,
      navigator.language,
      screen.width + "x" + screen.height,
      new Date().getTimezoneOffset(),
      canvas.toDataURL(),
      navigator.hardwareConcurrency || 0,
      (navigator as any).deviceMemory || 0,
    ].join("|");

    return sha256(fingerprint);
  };

  const isKeyExpired = (expiresAt: string): boolean => {
    return new Date() > new Date(expiresAt);
  };

  const getDaysUntilExpiry = (expiresAt: string): number => {
    const now = new Date();
    const expiry = new Date(expiresAt);
    const diffTime = expiry.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return Math.max(0, diffDays);
  };

  useEffect(() => {
    const initializeKeys = async () => {
      const savedKeys = localStorage.getItem("secureApiKeys");
      if (savedKeys) {
        try {
          const parsedKeys = JSON.parse(savedKeys);
          setApiKeys(parsedKeys);
        } catch (e) {
          console.error("Failed to parse saved keys");
          await initializeDefaultKeys();
        }
      } else {
        await initializeDefaultKeys();
      }

      // Check authentication status
      const authStatus = sessionStorage.getItem("isAuthenticated");
      const savedProfile = sessionStorage.getItem("currentProfile");

      if (authStatus === "true" && savedProfile) {
        try {
          const profile = JSON.parse(savedProfile);
          if (!isKeyExpired(profile.expiresAt)) {
            setIsAuthenticated(true);
            setCurrentProfile({
              ...profile,
              isExpired: false,
              daysUntilExpiry: getDaysUntilExpiry(profile.expiresAt),
            });
          } else {
            // Key expired, logout
            logout();
          }
        } catch (e) {
          console.error("Failed to parse saved profile");
          logout();
        }
      }
    };

    initializeKeys();
  }, []);

  const initializeDefaultKeys = async () => {
    const location = await getDeviceLocation();
    const now = new Date();
    const defaultExpiry = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000); // 30 days from now

    const defaultKeys: ApiKey[] = [
      {
        id: "1",
        key: "DEMO-KEY-2024",
        name: "Demo User",
        deviceId: "",
        deviceLocation: location,
        createdAt: now.toISOString(),
        expiresAt: defaultExpiry.toISOString(),
        isActive: true,
      },
      {
        id: "2",
        key: "SECURE-ACCESS-123",
        name: "Test User",
        deviceId: "",
        deviceLocation: location,
        createdAt: now.toISOString(),
        expiresAt: defaultExpiry.toISOString(),
        isActive: true,
      },
    ];

    setApiKeys(defaultKeys);
    localStorage.setItem("secureApiKeys", JSON.stringify(defaultKeys));
  };

  const login = async (key: string): Promise<boolean> => {
    const deviceId = getDeviceFingerprint();
    const location = await getDeviceLocation();
    const foundKey = apiKeys.find(k => k.key === key && k.isActive);

    if (foundKey) {
      // Check if key is expired
      if (isKeyExpired(foundKey.expiresAt)) {
        alert("This access key has expired!");
        return false;
      }

      if (foundKey.deviceId === "" || foundKey.deviceId === deviceId) {
        // Bind key to device if not already bound
        if (foundKey.deviceId === "") {
          const updatedKeys = apiKeys.map(k =>
            k.id === foundKey.id
              ? {
                  ...k,
                  deviceId,
                  deviceLocation: location,
                  lastUsed: new Date().toISOString(),
                }
              : k
          );
          setApiKeys(updatedKeys);
          localStorage.setItem("secureApiKeys", JSON.stringify(updatedKeys));
        } else {
          // Update last used time
          const updatedKeys = apiKeys.map(k =>
            k.id === foundKey.id
              ? { ...k, lastUsed: new Date().toISOString() }
              : k
          );
          setApiKeys(updatedKeys);
          localStorage.setItem("secureApiKeys", JSON.stringify(updatedKeys));
        }

        const profile: UserProfile = {
          keyId: foundKey.id,
          keyName: foundKey.name,
          createdAt: foundKey.createdAt,
          expiresAt: foundKey.expiresAt,
          deviceLocation: foundKey.deviceLocation || location,
          isExpired: false,
          daysUntilExpiry: getDaysUntilExpiry(foundKey.expiresAt),
        };

        setCurrentProfile(profile);
        setIsAuthenticated(true);
        sessionStorage.setItem("isAuthenticated", "true");
        sessionStorage.setItem("currentProfile", JSON.stringify(profile));
        return true;
      } else {
        alert("This key is already bound to another device!");
        return false;
      }
    }
    return false;
  };

  const logout = () => {
    setIsAuthenticated(false);
    setCurrentProfile(null);
    sessionStorage.removeItem("isAuthenticated");
    sessionStorage.removeItem("currentProfile");
  };

  const addApiKey = async (key: string, name: string, expiresAt: string) => {
    const location = await getDeviceLocation();
    const newKey: ApiKey = {
      id: Date.now().toString(),
      key,
      name,
      deviceId: "",
      deviceLocation: location,
      createdAt: new Date().toISOString(),
      expiresAt,
      isActive: true,
    };
    const updatedKeys = [...apiKeys, newKey];
    setApiKeys(updatedKeys);
    localStorage.setItem("secureApiKeys", JSON.stringify(updatedKeys));
  };

  const removeApiKey = (id: string) => {
    const updatedKeys = apiKeys.filter(k => k.id !== id);
    setApiKeys(updatedKeys);
    localStorage.setItem("secureApiKeys", JSON.stringify(updatedKeys));
  };

  return (
    <SecurityContext.Provider
      value={{
        isAuthenticated,
        currentProfile,
        login,
        logout,
        apiKeys,
        addApiKey,
        removeApiKey,
        getDeviceFingerprint,
      }}
    >
      {children}
    </SecurityContext.Provider>
  );
};
