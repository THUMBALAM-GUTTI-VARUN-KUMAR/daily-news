import { Capacitor } from '@capacitor/core';
import { Haptics, ImpactStyle, NotificationType } from '@capacitor/haptics';
import { StatusBar, Style } from '@capacitor/status-bar';
import { SplashScreen } from '@capacitor/splash-screen';

export const isNative = Capacitor.isNativePlatform();

export const triggerHaptic = async (type: 'light' | 'medium' | 'heavy' | 'success' | 'warning' = 'light') => {
  if (!isNative) return;
  try {
    if (type === 'light') {
      await Haptics.impact({ style: ImpactStyle.Light });
    } else if (type === 'medium') {
      await Haptics.impact({ style: ImpactStyle.Medium });
    } else if (type === 'heavy') {
      await Haptics.impact({ style: ImpactStyle.Heavy });
    } else if (type === 'success') {
      await Haptics.notification({ type: NotificationType.Success });
    } else if (type === 'warning') {
      await Haptics.notification({ type: NotificationType.Warning });
    }
  } catch {
    // Ignore in browsers where native bridge is not available
  }
};

export const initNativeApp = async () => {
  if (!isNative) return;
  try {
    await SplashScreen.hide();
    // Disable overlay to ensure UI never renders behind battery, clock, or notification icons
    await StatusBar.setOverlaysWebView({ overlay: false });
    await StatusBar.setStyle({ style: Style.Dark });
    await StatusBar.setBackgroundColor({ color: '#FAF7F8' });
  } catch {
    // Graceful fallback
  }
};
