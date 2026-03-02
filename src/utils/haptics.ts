import { Haptics, ImpactStyle, NotificationType } from '@capacitor/haptics';

/**
 * Thin wrapper around @capacitor/haptics.
 * Each function is no-throw -- haptics failure never affects gameplay.
 * Call-site gates on isHapticsEnabled; these functions do NOT check preference.
 */

export async function hapticsCorrect(): Promise<void> {
  try {
    await Haptics.impact({ style: ImpactStyle.Light });
  } catch {
    // Haptics unavailable (web, unsupported device) -- silently ignore
  }
}

export async function hapticsIncorrect(): Promise<void> {
  try {
    await Haptics.notification({ type: NotificationType.Warning });
  } catch {
    // Haptics unavailable -- silently ignore
  }
}

export async function hapticsGameOver(): Promise<void> {
  try {
    await Haptics.notification({ type: NotificationType.Error });
  } catch {
    // Haptics unavailable -- silently ignore
  }
}
