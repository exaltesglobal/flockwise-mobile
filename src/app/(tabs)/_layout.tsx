import Ionicons from '@expo/vector-icons/Ionicons';
import { Tabs } from 'expo-router/js-tabs';
import { useEffect, type ComponentProps } from 'react';

import { useT, type StringKey } from '@/i18n';
import { registerForPush, useNotificationTaps } from '@/lib/push';
import { Fonts, usePalette } from '@/theme';

type IconName = ComponentProps<typeof Ionicons>['name'];

const TABS: { name: string; label: StringKey; icon: IconName; iconActive: IconName }[] = [
  { name: 'schedule', label: 'tabSchedule', icon: 'calendar-outline', iconActive: 'calendar' },
  { name: 'team', label: 'tabTeam', icon: 'chatbubbles-outline', iconActive: 'chatbubbles' },
  { name: 'tasks', label: 'tabTasks', icon: 'checkbox-outline', iconActive: 'checkbox' },
  { name: 'away', label: 'tabAway', icon: 'airplane-outline', iconActive: 'airplane' },
  { name: 'me', label: 'tabMe', icon: 'person-circle-outline', iconActive: 'person-circle' },
];

export default function TabLayout() {
  const c = usePalette();
  const { t } = useT();
  // The tabs only show once signed in with a final password, so this is the moment to ask for pushes.
  useEffect(() => void registerForPush(), []);
  useNotificationTaps(true);
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: c.primary,
        tabBarInactiveTintColor: c.textMuted,
        tabBarStyle: { backgroundColor: c.card, borderTopColor: c.border },
        tabBarLabelStyle: { fontFamily: Fonts.displayMedium, fontSize: 11 },
      }}>
      {TABS.map((tab) => (
        <Tabs.Screen
          key={tab.name}
          name={tab.name}
          options={{
            title: t(tab.label),
            tabBarIcon: ({ color, size, focused }) => <Ionicons name={focused ? tab.iconActive : tab.icon} color={color as string} size={size} />,
          }}
        />
      ))}
    </Tabs>
  );
}
