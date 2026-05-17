import React, { useContext } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { User, Mail, Phone, MapPin, ChevronRight, LogOut, Shield, BookOpen, Clock, History, Star, MessageSquare, Flame } from 'lucide-react-native';
import { AppContext } from '../context/AppContext'; // Assuming AppContext remains in context folder

const ProfileScreen = ({ navigation }: any) => {
  const { 
    totalRenderedHours = 0, 
    totalRequiredHours = 0, 
    weeklyRenderedHours = 0,
    daysStreak = 0, 
    attendanceLogs = [], 
    shifts = [], 
    progressInfo = { progressPercent: 0, status: 'NOT_STARTED', renderedHours: 0, requiredHours: 120, isAtRisk: false, deficit: 0, expectedByNow: 0 }, 
    isLoading, // Get isLoading from context
    userProfile,
    updateProfile,
    error, // Get error from context
  } = useContext(AppContext);

  // Shuffle history: declined shifts
  const declinedShifts = (shifts || []).filter(s => s.status === 'Declined');

  const handleEditProfile = () => {
    Alert.alert('Edit Profile', 'Profile editing is managed by the SDAO office.');
  };

  const completedShifts = shifts.filter(s => s.status === 'Completed');
  const activeShifts = shifts.filter(s => s.status === 'Active');

  if (isLoading) {
    return (
      <SafeAreaView style={[styles.safeArea, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color="#F4B333" />
        <Text style={{ color: '#061D5A', marginTop: 16, fontSize: 14, fontWeight: '600' }}>Loading profile...</Text>
      </SafeAreaView>
    );
  }

  const hasTermGoal = (progressInfo.requiredHours || 0) > 0;
  const progressPercent = hasTermGoal ? Math.min(100, Math.round(progressInfo.progressPercent)) : 0;

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 60 }}>
      {/* Header */}
      <View style={styles.statsRow}>
              <View style={styles.statBoxBlue}>
                <View style={styles.statBoxContent}>
                  <View>
                    <Text style={styles.statNumberYellow}>{weeklyRenderedHours} <Text style={{ fontSize: 14, color: '#ffffff', fontWeight: 'bold' }}>/ {userProfile?.weeklyHoursGoal || 8}h</Text></Text>
                    <Text style={styles.statLabelWhite}>This Week</Text>
                  </View>
                  <Clock size={32} color="#93C5FD" opacity={0.8} />
                </View>
              </View>

              <View style={styles.statBoxGold}>
                <View style={styles.statBoxContent}>
                  <View>
                    <Text style={styles.statNumberRed}>{daysStreak}</Text>
                    <Text style={styles.statLabelDark}>Days Streak</Text>
                  </View>
                  <Flame size={32} color="#DC2626" />
                </View>
              </View>
            </View>
          <Text style={styles.sectionTitle}>Term Progress</Text>
          <View style={styles.statsRow}>
            <View style={styles.statBox}>
              <Text style={styles.statValue}>{totalRenderedHours}h</Text>
              <Text style={styles.statLabel}>Rendered</Text>
            </View>
            <View style={[styles.statBox, { borderLeftWidth: 1, borderRightWidth: 1, borderColor: '#E5E7EB' }]}>
              <Text style={styles.statValue}>{hasTermGoal ? `${Math.max(0, totalRequiredHours - totalRenderedHours).toFixed(1).replace(/\.0$/, '')}h` : '-'}</Text>
              <Text style={styles.statLabel}>{hasTermGoal ? 'Remaining' : 'No term goal'}</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={styles.statValue}>{daysStreak}</Text>
              <Text style={styles.statLabel}>Day Streak</Text>
            </View>
          </View>
          {/* Progress bar */}
            <View style={{ marginTop: 16 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 }}>
              <Text style={{ fontSize: 12, color: '#64748B', fontWeight: '600' }}>Overall Progress</Text>
              {hasTermGoal ? (
                <Text style={{ fontSize: 12, color: '#061D5A', fontWeight: 'bold' }}>{progressPercent}%</Text>
              ) : (
                <Text style={{ fontSize: 12, color: '#061D5A', fontWeight: 'bold' }}>{totalRenderedHours}h</Text>
              )}
            </View>
            {hasTermGoal ? (
              <View style={{ height: 8, backgroundColor: '#E5E7EB', borderRadius: 4 }}>
                <View style={{ height: 8, backgroundColor: progressPercent >= 100 ? '#10B981' : '#3B82F6', borderRadius: 4, width: `${progressPercent}%` }} />
              </View>
            ) : null}
            <Text style={{ fontSize: 11, color: '#9CA3AF', marginTop: 6 }}>{hasTermGoal ? `${totalRenderedHours} / ${progressInfo.requiredHours}h · 1st Semester 2025-2026` : `${totalRenderedHours} total hours`}</Text>
          </View>
        </View>

        {/* Shuffle History */}
        <View style={[styles.section, { marginTop: 16 }]}>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 15 }}>
            <History size={18} color="#061D5A" style={{ marginRight: 8 }} />
            <Text style={styles.sectionTitle}>Shuffle History</Text>
          </View>
          {declinedShifts.length > 0 ? declinedShifts.map(shift => (
            <View key={shift.id} style={styles.historyRow}>
              <View style={[styles.historyDot, { backgroundColor: '#EF4444' }]} />
              <View style={{ flex: 1 }}>
                <Text style={styles.historyTitle}>{shift.day} · {shift.startTime} - {shift.endTime}</Text>
                <Text style={styles.historySubtitle}>{shift.office} · Declined</Text>
              </View>
            </View>
          )) : (
            <Text style={{ color: '#9CA3AF', fontSize: 13, textAlign: 'center', paddingVertical: 10 }}>No declined shifts yet.</Text>
          )}
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
              <Text style={styles.infoLabel}>Attendance Logs</Text>
              <Text style={styles.infoValue}>{attendanceLogs.length} total records</Text>
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
  header: { padding: 24, backgroundColor: '#061D5A', paddingBottom: 40 },
  headerTitle: { fontSize: 24, fontWeight: 'bold', color: '#ffffff' },
  scrollView: { flex: 1, paddingHorizontal: 20, marginTop: -20 },
  profileCard: { backgroundColor: '#ffffff', borderRadius: 20, padding: 20, flexDirection: 'row', alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 10, elevation: 5, marginBottom: 20 },
  avatarContainer: { width: 70, height: 70, borderRadius: 35, backgroundColor: '#F4B333', justifyContent: 'center', alignItems: 'center', marginRight: 20 },
  avatarText: { color: '#061D5A', fontSize: 28, fontWeight: 'bold' },
  profileInfo: { flex: 1 },
  profileName: { fontSize: 20, fontWeight: 'bold', color: '#061D5A', marginBottom: 4 },
  profileId: { fontSize: 13, color: '#64748B', marginBottom: 8 },
  badge: { backgroundColor: '#EBF0FF', alignSelf: 'flex-start', paddingHorizontal: 12, paddingVertical: 4, borderRadius: 12 },
  badgeText: { color: '#1E3A8A', fontSize: 12, fontWeight: 'bold' }, 
  section: { backgroundColor: '#ffffff', borderRadius: 20, padding: 20, marginBottom: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 5, elevation: 2 },
  sectionTitle: { fontSize: 16, fontWeight: 'bold', color: '#061D5A', marginBottom: 12 }, // Fix #14
  statsRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 12 },
  statBox: { flex: 1, alignItems: 'center', paddingVertical: 8 },
  statValue: { fontSize: 22, fontWeight: '900', color: '#061D5A' },
  statLabel: { fontSize: 11, color: '#64748B', marginTop: 2 },
  historyRow: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 12 },
  historyDot: { width: 10, height: 10, borderRadius: 5, marginTop: 4, marginRight: 12 },
  historyTitle: { fontSize: 14, fontWeight: '600', color: '#111827' },
  historySubtitle: { fontSize: 12, color: '#6B7280', marginTop: 2 },
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
