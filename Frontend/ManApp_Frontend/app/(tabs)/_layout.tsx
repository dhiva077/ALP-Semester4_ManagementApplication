import { Tabs } from 'expo-router';
import CustomTabBar from '../../components/navigation/CustomTabBar';

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{ headerShown: false }}
      tabBar={(props) => <CustomTabBar {...props} />}
    >
      <Tabs.Screen name="dashboard" />
      <Tabs.Screen name="penyimpanan" />

      <Tabs.Screen 
        name="checklist" 
        options={{
          href: null,
          tabBarLabel: 'penyimpanan',
        }} 
      />

      <Tabs.Screen name="tambah-event" />
      <Tabs.Screen name="profil" />
    </Tabs>
  );
}