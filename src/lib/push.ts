// Push notifications for the team app. The server sends through Expo's push service
// with data { kind, link? }; link is a member-portal path, so we map it to a screen here.
import Constants from 'expo-constants';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import { router } from 'expo-router';
import { useEffect } from 'react';
import { Platform } from 'react-native';

import { Me } from '@/api/endpoints';

import { storage } from './storage';

const TOKEN_KEY = 'fw.pushToken';

if (Platform.OS !== 'web') {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({ shouldShowBanner: true, shouldShowList: true, shouldPlaySound: true, shouldSetBadge: false }),
  });
}

async function pushToken(): Promise<string | null> {
  if (Platform.OS === 'web' || !Device.isDevice) return null;
  const projectId = Constants.expoConfig?.extra?.eas?.projectId as string | undefined;
  if (!projectId) return null; // builds without EAS_PROJECT_ID can't get an Expo token
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', { name: 'Team', importance: Notifications.AndroidImportance.HIGH });
  }
  let { status } = await Notifications.getPermissionsAsync();
  if (status !== 'granted') status = (await Notifications.requestPermissionsAsync()).status;
  if (status !== 'granted') return null;
  return (await Notifications.getExpoPushTokenAsync({ projectId })).data;
}

/** Tells the server where to reach this phone. Safe to call on every sign-in. */
export async function registerForPush() {
  try {
    const token = await pushToken();
    if (!token) return;
    await Me.registerDevice(token, Platform.OS === 'ios' ? 'ios' : 'android');
    await storage.set(TOKEN_KEY, token);
  } catch {
    /* no permission or offline: try again next sign-in */
  }
}

/** Stops pushes to this phone. Call while the session is still valid. */
export async function forgetPushDevice() {
  const token = await storage.get(TOKEN_KEY);
  if (!token) return;
  await storage.remove(TOKEN_KEY);
  await Me.forgetDevice(token).catch(() => undefined);
}

function screenFor(data: Record<string, unknown> | undefined): string {
  const link = typeof data?.link === 'string' ? data.link : '';
  const assignment = /^\/app\/serving\/([^/?#]+)/.exec(link);
  if (assignment) return `/assignment/${assignment[1]}`;
  // Every other team notice (new rota, event changes, announcements) is about the schedule.
  return '/schedule';
}

/** Opens the right screen when a notification is tapped, including the one that launched the app. */
export function useNotificationTaps(enabled: boolean) {
  useEffect(() => {
    if (!enabled || Platform.OS === 'web') return;
    const open = (r: Notifications.NotificationResponse | null) => {
      if (r) router.push(screenFor(r.notification.request.content.data) as never);
    };
    void Notifications.getLastNotificationResponseAsync().then(open);
    const sub = Notifications.addNotificationResponseReceivedListener(open);
    return () => sub.remove();
  }, [enabled]);
}
