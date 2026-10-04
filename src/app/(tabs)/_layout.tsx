import { Tabs } from 'expo-router';

// Phase 0 placeholder navigator: the four tabs from docs/SCREENS.md, labels only.
// Phase 3 adds Ionicons (imported per set), theme tokens and the header styling.
export default function TabsLayout() {
  return (
    <Tabs>
      <Tabs.Screen name="index" options={{ title: 'Upcoming' }} />
      <Tabs.Screen name="all" options={{ title: 'All' }} />
      <Tabs.Screen name="subscriptions" options={{ title: 'Subscriptions' }} />
      <Tabs.Screen name="settings" options={{ title: 'Settings' }} />
    </Tabs>
  );
}
