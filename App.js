import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { StatusBar } from 'expo-status-bar';
import CameraScreen from './src/screens/CameraScreen';
import ARScreen from './src/screens/ARScreen';

const Stack = createStackNavigator();

export default function App() {
  return (
    <NavigationContainer>
      <StatusBar style="light" hidden />
      <Stack.Navigator screenOptions={{ headerShown: false, animation: 'fade' }}>
        <Stack.Screen name="Camera" component={CameraScreen} />
        <Stack.Screen name="AR" component={ARScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
