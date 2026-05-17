import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import LoginScreen from '../screens/MAA-02_LoginScreen';
import NotificationsScreen from '../screens/NotificationsScreen';
import TabNavigator from './TabNavigator';


const Stack = createNativeStackNavigator();

export default function AppNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }} initialRouteName="MAA-02_LoginScreen">
      <Stack.Screen name="MAA-02_LoginScreen" component={LoginScreen} />
      <Stack.Screen name="Main" component={TabNavigator} />
      <Stack.Screen name="Notifications" component={NotificationsScreen} />
    </Stack.Navigator>
  );
}
