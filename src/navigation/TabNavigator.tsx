/** @types/react */
import * as React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import DashboardScreen from '../screens/MAA-04_DashboardScreen';
import ScheduleScreen from '../screens/MAA-05_ScheduleScreen';
import ScanScreen from '../screens/MAA-06_AttendanceScanScreen';
import ProfileScreen from '../screens/MAA-07_ProfileScreen';
import { Home, Calendar, ClipboardCheck, User } from 'lucide-react-native';

// Define the types for your tab routes
type RootTabParamList = {
  Dashboard: undefined;
  Schedule: undefined;
  Attendance: undefined;
  Profile: undefined;
};

const Tab = createBottomTabNavigator<RootTabParamList>();

const TAB_ICONS: Record<keyof RootTabParamList, React.ComponentType<{ size: number; color: string }>> = {
  Dashboard: Home,
  Schedule: Calendar,
  Attendance: ClipboardCheck,
  Profile: User,
};

const TAB_BAR_STYLE = {
  backgroundColor: '#061D5A',
  borderTopWidth: 1,
  borderTopColor: '#1A365D',
  height: 72,
  paddingBottom: 14,
};

const SCENE_CONTAINER_STYLE = { 
  backgroundColor: '#F7FAFC' 
};

export default function TabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarIcon: ({ color, size }) => {
          const IconComponent = TAB_ICONS[route.name];
          return IconComponent ? <IconComponent size={size} color={color} /> : null;
        },
        tabBarActiveTintColor: '#F4B333',
        tabBarInactiveTintColor: '#A0AEC0',
        tabBarHideOnKeyboard: true,
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '700',
          marginTop: 4,
        },
        tabBarItemStyle: {
          paddingVertical: 10,
        },
        sceneContainerStyle: SCENE_CONTAINER_STYLE,
        tabBarStyle: TAB_BAR_STYLE,
      })}
    >
      <Tab.Screen name="Dashboard" component={DashboardScreen} options={{ tabBarLabel: 'Home' }} />
      <Tab.Screen name="Schedule" component={ScheduleScreen} options={{ tabBarLabel: 'Schedule' }} />
      <Tab.Screen name="Attendance" component={ScanScreen} options={{ tabBarLabel: 'Attendance' }} />
      <Tab.Screen name="Profile" component={ProfileScreen} options={{ tabBarLabel: 'Profile' }} />
    </Tab.Navigator>
  );
}
