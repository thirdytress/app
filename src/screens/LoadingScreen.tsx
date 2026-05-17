import React, { useEffect } from 'react';
import { View, ActivityIndicator, StyleSheet, StatusBar, Text } from 'react-native';
import { GraduationCap } from 'lucide-react-native';

/**
 * LoadingScreen
 * A professional loading state that matches the app's brand colors.
 */
const LoadingScreen = ({ navigation }: any) => {
  useEffect(() => {
    // Simulate initial data loading or splash delay
    const timer = setTimeout(() => {
      navigation.replace('MAA-02_LoginScreen');
    }, 2500);

    return () => clearTimeout(timer);
  }, [navigation]);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#061D5A" />
      <View style={styles.content}>
        <View style={styles.logoContainer}>
          <GraduationCap size={80} color="#F4B333" />
        </View>
        <Text style={styles.title}>SAMS</Text>
        <Text style={styles.subtitle}>Student Assistant Management System</Text>
        <ActivityIndicator size="large" color="#F4B333" style={styles.loader} />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#061D5A',
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoContainer: {
    marginBottom: 10,
  },
  title: {
    fontSize: 48,
    fontWeight: '900',
    color: '#ffffff',
    letterSpacing: 4,
  },
  subtitle: {
    fontSize: 14,
    color: '#93C5FD',
    marginTop: 4,
    fontWeight: '600',
  },
  loader: {
    marginTop: 50,
  },
});

export default LoadingScreen;