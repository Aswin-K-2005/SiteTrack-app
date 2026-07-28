const DEVICE_ID_KEY = "sitetrack_device_id";

export async function getOrCreateDeviceId() {
  let deviceId = null;
  let deviceName = "Unknown Device";

  let Device = null;
  let Preferences = null;

  try {
    const pkg = "@capacitor/device";
    const devMod = await import(/* @vite-ignore */ pkg);
    Device = devMod.Device;
  } catch (err) {
    // Web fallback
  }

  try {
    const pkg = "@capacitor/preferences";
    const prefMod = await import(/* @vite-ignore */ pkg);
    Preferences = prefMod.Preferences;
  } catch (err) {
    // Web fallback
  }

  // 1. Try reading from persistent Capacitor Preferences (Keychain / Keystore)
  if (Preferences) {
    try {
      const { value } = await Preferences.get({ key: DEVICE_ID_KEY });
      if (value) {
        deviceId = value;
      }
    } catch (err) {
      console.warn("Could not read device ID from Preferences", err);
    }
  }

  // 2. Fallback to localStorage if Preferences was empty
  if (!deviceId) {
    try {
      deviceId = localStorage.getItem(DEVICE_ID_KEY);
    } catch (e) {
      // Ignore
    }
  }

  // 3. Try to get native device hardware identifier from @capacitor/device
  if (Device) {
    try {
      const idObj = await Device.getId();
      if (idObj && idObj.identifier) {
        deviceId = idObj.identifier;
      }
      const info = await Device.getInfo();
      if (info) {
        const model = info.model || info.name || "Device";
        const os = info.operatingSystem || info.platform || "";
        const osVersion = info.osVersion || "";
        deviceName = `${model} (${os} ${osVersion})`.trim();
      }
    } catch (err) {
      // Web fallback below
    }
  }

  if (deviceName === "Unknown Device") {
    const userAgent = typeof navigator !== "undefined" ? navigator.userAgent : "";
    if (userAgent.includes("iPhone")) deviceName = "iPhone";
    else if (userAgent.includes("Android")) deviceName = "Android Phone";
    else deviceName = "Web Browser";
  }

  // 4. If still no device ID (e.g. web browser first launch), generate persistent UUID
  if (!deviceId) {
    if (typeof crypto !== "undefined" && crypto.randomUUID) {
      deviceId = crypto.randomUUID();
    } else {
      deviceId = "dev-" + Math.random().toString(36).substring(2, 15) + Date.now().toString(36);
    }
  }

  // 5. Persist the device ID back to Preferences & localStorage for future launches
  if (Preferences) {
    try {
      await Preferences.set({ key: DEVICE_ID_KEY, value: deviceId });
    } catch (err) {
      // Ignore
    }
  }
  try {
    localStorage.setItem(DEVICE_ID_KEY, deviceId);
  } catch (err) {
    // Ignore
  }

  return { deviceId, deviceName };
}
