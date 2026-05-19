import React, { useContext } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { Mail, Phone, MapPin, ChevronRight, LogOut, Shield, BookOpen, Clock } from 'lucide-react-native';
import { AppContext } from '../context/AppContext'; 

const ProfileScreen = ({ navigation }: any) => {
  const { 
    attendanceLogs = [], 
    isLoading, 
    userProfile,
  } = useContext(AppContext);

  const handleEditProfile = () => {
    Alert.alert('Edit Profile', 'Profile editing is managed by the SDAO office.');
  };

  if (isLoading) {
    return (
      <SafeAreaView style={[styles.safeArea, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color="#F4B333" />
        <Text style={{ color: '#061D5A', marginTop: 16, fontSize: 14, fontWeight: '600' }}>Loading profile...</Text>
      </SafeAreaView>
    );
  }

  if (!userProfile) {
    return (
      <SafeAreaView style={[styles.safeArea, { justifyContent: 'center', alignItems: 'center' }]}>
        <Text style={{ color: '#061D5A', fontSize: 16 }}>No profile data found.</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>My Profile</Text>
      </View>
      <ScrollView showsVerticalScrollIndicator={false} style={styles.scrollView} contentContainerStyle={{ paddingBottom: 60, paddingTop: 20 }}>
        
        {/* Main Profile Card */}
        <View style={styles.profileCard}>
          <View style={styles.avatarContainer}>
            <Text style={styles.avatarText}>{userProfile.name.charAt(0)}</Text>
          </View>
          <View style={styles.profileInfo}>
            <Text style={styles.profileName}>{userProfile.name}</Text>
            <Text style={styles.profileId}>{userProfile.studentId}</Text>
            <View style={styles.badge}>
              <Text style={styles.badgeText}>Student Assistant</Text>
            </View>
          </View>
        </View>

        {/* Personal Information */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Personal Information</Text>
          <View style={styles.infoRow}>
            <View style={styles.infoIconBox}><Mail size={18} color="#3B82F6" /></View>
            <View style={styles.infoTextContainer}>
              <Text style={styles.infoLabel}>Email</Text>
              <Text style={styles.infoValue}>{userProfile.email}</Text>
            </View>
          </View>
          <View style={styles.divider} />
          <TouchableOpacity style={styles.infoRow} onPress={handleEditProfile}>
            <View style={styles.infoIconBox}><Phone size={18} color="#10B981" /></View>
            <View style={styles.infoTextContainer}>
              <Text style={styles.infoLabel}>Phone</Text>
              <Text style={styles.infoValue}>{userProfile.phone}</Text>
            </View>
            <ChevronRight size={16} color="#9CA3AF" />
          </TouchableOpacity>
          <View style={styles.divider} />
          <View style={styles.infoRow}>
            <View style={styles.infoIconBox}><MapPin size={18} color="#F4B333" /></View>
            <View style={styles.infoTextContainer}>
              <Text style={styles.infoLabel}>Campus</Text>
              <Text style={styles.infoValue}>{userProfile.campus}</Text>
            </View>
          </View>
          <View style={styles.divider} />
          <View style={styles.infoRow}>
            <View style={styles.infoIconBox}><Clock size={18} color="#8B5CF6" /></View>
            <View style={styles.infoTextContainer}>
              <Text style={styles.infoLabel}>Total Attendance Logs</Text>
              <Text style={styles.infoValue}>{attendanceLogs.length} records</Text>
            </View>
          </View>
        </View>

        {/* Preferences */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Preferences</Text>
          <TouchableOpacity style={styles.actionRow} onPress={() => Alert.alert('Security', 'Biometric authentication is enabled for this device.')}>
            <View style={[styles.actionIconBox, { backgroundColor: '#ECFDF5' }]}><Shield size={20} color="#059669" /></View>
            <Text style={styles.actionText}>Security & Biometrics</Text>
            <ChevronRight size={20} color="#9CA3AF" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionRow} onPress={() => Alert.alert('SDAO Guidelines', 'Please refer to your SDAO contract and student assistant manual for duty hour policies.')}>
            <View style={[styles.actionIconBox, { backgroundColor: '#FFFBEB' }]}><BookOpen size={20} color="#D97706" /></View>
            <Text style={styles.actionText}>SDAO Guidelines</Text>
            <ChevronRight size={20} color="#9CA3AF" />
          </TouchableOpacity>
        </View>

        {/* Logout */}
        <TouchableOpacity style={styles.logoutButton} onPress={() => navigation.replace('MAA-02_LoginScreen')}>
          <LogOut size={20} color="#EF4444" style={{ marginRight: 8 }} />
          <Text style={styles.logoutText}>Log Out</Text>
        </TouchableOpacity>

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#F8FAFC' },
  header: { padding: 24, backgroundColor: '#061D5A', paddingBottom: 24 },
  headerTitle: { fontSize: 28, fontWeight: 'bold', color: '#ffffff' },
  scrollView: { flex: 1, paddingHorizontal: 20 },
  profileCard: { backgroundColor: '#ffffff', borderRadius: 20, padding: 20, flexDirection: 'row', alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 10, elevation: 5, marginBottom: 20 },
  avatarContainer: { width: 70, height: 70, borderRadius: 35, backgroundColor: '#F4B333', justifyContent: 'center', alignItems: 'center', marginRight: 20 },
  avatarText: { color: '#061D5A', fontSize: 28, fontWeight: 'bold' },
  profileInfo: { flex: 1 },
  profileName: { fontSize: 20, fontWeight: 'bold', color: '#061D5A', marginBottom: 4 },
  profileId: { fontSize: 13, color: '#64748B', marginBottom: 8 },
  badge: { backgroundColor: '#EBF0FF', alignSelf: 'flex-start', paddingHorizontal: 12, paddingVertical: 4, borderRadius: 12 },
  badgeText: { color: '#1E3A8A', fontSize: 12, fontWeight: 'bold' }, 
  section: { backgroundColor: '#ffffff', borderRadius: 20, padding: 20, marginBottom: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 5, elevation: 2 },
  sectionTitle: { fontSize: 16, fontWeight: 'bold', color: '#061D5A', marginBottom: 12 },
  infoRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10 },
  infoIconBox: { width: 40, height: 40, borderRadius: 12, backgroundColor: '#F8FAFC', justifyContent: 'center', alignItems: 'center', marginRight: 15 },
  infoTextContainer: { flex: 1 },
  infoLabel: { fontSize: 12, color: '#9CA3AF', marginBottom: 2 },
  infoValue: { fontSize: 14, color: '#111827', fontWeight: '500' },
  divider: { height: 1, backgroundColor: '#F1F5F9', marginVertical: 2 },
  actionRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12 },
  actionIconBox: { width: 40, height: 40, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginRight: 15 },
  actionText: { flex: 1, fontSize: 15, color: '#111827', fontWeight: '500' },
  logoutButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 16, backgroundColor: '#FEF2F2', borderRadius: 16, marginTop: 4 },
  logoutText: { color: '#EF4444', fontSize: 16, fontWeight: 'bold' },
});

export default ProfileScreen;
