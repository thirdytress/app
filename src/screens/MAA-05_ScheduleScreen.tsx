import React, { useContext, useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, TouchableOpacity, Alert, Dimensions, Modal } from 'react-native';
import { AppContext } from '../context/AppContext';
import { Clock, MapPin, ChevronLeft, CalendarDays, ChevronDown, AlertCircle, X } from 'lucide-react-native';

const { width } = Dimensions.get('window');

const ScheduleScreen = ({ navigation }: any) => {
  const { 
    shifts = [], 
    totalRequiredHours = 0, 
    totalRenderedHours = 0, 
    weeklyRenderedHours = 0,
    attendanceLogs = [], 
    userProfile 
  } = useContext(AppContext);

  const [showWeeklyHistory, setShowWeeklyHistory] = useState(false);
  const fullDays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

  const weeklyGoal = userProfile?.weeklyHoursGoal || 8;
  const weeklyProgress = Math.min(100, Math.round((weeklyRenderedHours / weeklyGoal) * 100));
  const hasTermGoal = (totalRequiredHours || 0) > 0;
  const remainingHours = hasTermGoal ? Math.max(0, totalRequiredHours - totalRenderedHours).toFixed(1).replace(/\.0$/, '') : '-';
  const todayFormatted = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });

  // Filter only active/finalized shifts for the schedule since it is finalized by SDAO
  const activeShifts = shifts.filter(s => s.status === 'Active' || s.status === 'Completed');

  const getWeeklyHistory = () => {
    const history = [];
    const now = new Date();
    
    for (let i = 0; i < 4; i++) {
      const start = new Date(now);
      const currentDay = now.getDay(); // 0 is Sunday
      const diffToMonday = (currentDay === 0 ? -6 : 1) - currentDay;
      start.setDate(now.getDate() + diffToMonday - (i * 7));
      start.setHours(0, 0, 0, 0);
      
      const end = new Date(start);
      end.setDate(start.getDate() + 6);
      end.setHours(23, 59, 59, 999);

      const weeklyLogs = attendanceLogs.filter(log => {
        const logDate = new Date(log.date);
        return logDate >= start && logDate <= end;
      });

      let totalMins = 0;
      weeklyLogs.forEach(record => {
        if (record.status === 'Absent' || !record.checkIn || !record.checkOut) return;
        const [inH, inM] = record.checkIn.split(':').map(Number);
        const [outH, outM] = record.checkOut.split(':').map(Number);
        totalMins += (outH * 60 + outM) - (inH * 60 + inM);
      });

      history.push({
        label: i === 0 ? 'This Week' : `Week of ${start.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`,
        hours: parseFloat((totalMins / 60).toFixed(1))
      });
    }
    return history;
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <View style={styles.headerRow}>
          <TouchableOpacity style={styles.navButton} onPress={() => navigation.goBack()}>
            <ChevronLeft size={24} color="#ffffff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Term Schedule</Text>
          <TouchableOpacity
            style={[styles.navButton, { backgroundColor: 'transparent' }]} 
            onPress={() => Alert.alert('Calendar View', 'Calendar layout is coming soon.')}
          >
            <CalendarDays size={20} color="#ffffff" />
          </TouchableOpacity>
        </View>
        <TouchableOpacity 
          style={{flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginBottom: 4}}
          onPress={() => setShowWeeklyHistory(true)}
        >
          <Text style={[styles.weekText, {marginBottom: 0, marginRight: 4}]}>Weekly Progress</Text>
          <ChevronDown size={24} color="#F4B333" />
        </TouchableOpacity>
        <Text style={styles.dateRangeText}>{todayFormatted}</Text>
        
        <View style={styles.totalHoursContainer}>
          <Text style={styles.totalHoursLabel}>Weekly target progress for {weeklyGoal}h goal</Text>
          <View style={styles.totalHoursRow}>
            <Text style={styles.totalHoursValue}>{weeklyRenderedHours} <Text style={styles.totalHoursUnit}>/ {weeklyGoal}h</Text></Text>
            <View style={styles.clockIconContainer}><Clock size={20} color="#3B82F6" /></View>
          </View>
          {/* Weekly progress bar */}
          <View style={{ height: 6, backgroundColor: '#E5E7EB', borderRadius: 3, marginTop: 12 }}>
            <View style={{ height: 6, backgroundColor: weeklyProgress >= 100 ? '#10B981' : '#3B82F6', borderRadius: 3, width: `${weeklyProgress}%` }} />
          </View>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 8 }}>
            <Text style={{ fontSize: 11, color: '#64748B' }}>Week Goal: {weeklyGoal}h</Text>
            <Text style={{ fontSize: 11, color: '#64748B' }}>{hasTermGoal ? `Term Remaining: ${remainingHours}h` : 'No term goal set'}</Text>
          </View>
        </View>
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 60, paddingTop: 24 }}>
        
        {fullDays.map((day) => {
          const dayShifts = activeShifts.filter(s => s.day === day);
          
          if (dayShifts.length === 0) return null;

          return (
            <View key={day} style={styles.daySection}>
              <View style={styles.dayHeaderRow}>
                <Text style={styles.dayTitle}>{day}</Text>
                <View style={styles.dayLine} />
              </View>

              {dayShifts.map((shift) => (
                <View key={shift.id} style={styles.dayContainer}>
                  <View style={styles.shiftCard}>
                    <View style={styles.shiftCardRow}>
                      <Text style={styles.shiftTimeLabel}>TIME</Text>
                      <Text style={styles.shiftTimeValue}>{shift.startTime} - {shift.endTime}</Text>
                    </View>
                    <View style={styles.divider} />
                    <View style={styles.shiftCardRow}>
                      <MapPin size={20} color="#F4B333" style={{marginRight: 15}} />
                      <View>
                        <Text style={styles.shiftLocationLabel}>LOCATION</Text>
                        <Text style={styles.shiftLocationValue}>{shift.office}</Text>
                      </View>
                    </View>
                  </View>
                </View>
              ))}
            </View>
          );
        })}

        {activeShifts.length === 0 && (
          <View style={[styles.emptyContainer, { marginTop: 80 }]}>
            <View style={styles.emptyIconBox}><AlertCircle size={40} color="#F4B333" /></View>
            <Text style={styles.emptyTitle}>Undeployed Status</Text>
            <Text style={styles.emptySubtitle}>You have no assigned shifts yet. Wait for the SDAO Administrator to finalize your term schedule.</Text>
          </View>
        )}
      </ScrollView> 

      {/* Weekly History Modal */}
      <Modal visible={showWeeklyHistory} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Weekly History</Text>
              <TouchableOpacity onPress={() => setShowWeeklyHistory(false)}>
                <X size={24} color="#061D5A" />
              </TouchableOpacity>
            </View>
            
            <View style={styles.historyList}>
              {getWeeklyHistory().map((item, index) => (
                <View key={index} style={styles.historyItem}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.historyLabel}>{item.label}</Text>
                    <View style={styles.historyBarContainer}>
                      <View style={[styles.historyBarFill, { width: `${Math.min(100, (item.hours / weeklyGoal) * 100)}%` }]} />
                    </View>
                  </View>
                  <View style={styles.historyHoursBox}>
                    <Text style={styles.historyHoursText}>{item.hours}h</Text>
                    <Text style={styles.historyTargetText}>/ {weeklyGoal}h</Text>
                  </View>
                </View>
              ))}
            </View>

            <TouchableOpacity style={styles.closeButton} onPress={() => setShowWeeklyHistory(false)}>
              <Text style={styles.closeButtonText}>Done</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#061D5A' },
  header: { padding: 20, paddingBottom: 30 },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  navButton: { width: 40, height: 40, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 20 },
  headerTitle: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
  weekText: { color: '#F4B333', fontSize: 24, fontWeight: '900', marginBottom: 4, textAlign: 'center' },
  dateRangeText: { color: '#93C5FD', fontSize: 12, textAlign: 'center', marginBottom: 25 },
  totalHoursContainer: { backgroundColor: '#ffffff', borderRadius: 20, padding: 20 },
  totalHoursLabel: { color: '#64748B', fontSize: 12, fontWeight: '600', marginBottom: 5 },
  totalHoursRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  totalHoursValue: { color: '#061D5A', fontSize: 32, fontWeight: '900' },
  totalHoursUnit: { fontSize: 16, fontWeight: 'bold' },
  clockIconContainer: { width: 40, height: 40, backgroundColor: '#EBF0FF', borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  scrollView: { flex: 1, backgroundColor: '#F8FAFC', borderTopLeftRadius: 32, borderTopRightRadius: 32, paddingHorizontal: 24 },
  daySection: { marginBottom: 10 },
  dayHeaderRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 15, marginTop: 10 },
  dayLine: { flex: 1, height: 1, backgroundColor: '#E2E8F0', marginLeft: 15 },
  dayContainer: { marginBottom: 20 },
  dayTitle: { fontSize: 16, fontWeight: '800', color: '#1E3A8A', textTransform: 'uppercase', letterSpacing: 1 },
  shiftCard: { backgroundColor: '#ffffff', borderRadius: 16, padding: 20, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 5, elevation: 2, borderWidth: 1, borderColor: '#F1F5F9' },
  shiftCardRow: { flexDirection: 'row', alignItems: 'center' },
  shiftTimeLabel: { color: '#64748B', fontSize: 10, fontWeight: 'bold', letterSpacing: 1, marginBottom: 4 },
  shiftTimeValue: { color: '#061D5A', fontSize: 16, fontWeight: '800' },
  shiftLocationLabel: { color: '#64748B', fontSize: 10, fontWeight: 'bold', letterSpacing: 1, marginBottom: 4 },
  shiftLocationValue: { color: '#061D5A', fontSize: 14, fontWeight: '600' },
  divider: { height: 1, backgroundColor: '#F1F5F9', marginVertical: 15 },
  emptyContainer: { alignItems: 'center', marginTop: 50 },
  emptyIconBox: { width: 80, height: 80, backgroundColor: '#ffffff', borderRadius: 20, justifyContent: 'center', alignItems: 'center', marginBottom: 20, shadowColor: '#000', shadowOffset: {width: 0, height: 2}, shadowOpacity: 0.05, shadowRadius: 5 },
  emptyTitle: { fontSize: 20, fontWeight: 'bold', color: '#061D5A', marginBottom: 8 },
  emptySubtitle: { fontSize: 14, color: '#64748B', textAlign: 'center', paddingHorizontal: 40 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(6,29,90,0.6)', justifyContent: 'center', alignItems: 'center', padding: 20 },
  modalContent: { backgroundColor: '#ffffff', borderRadius: 24, padding: 25, width: '90%', shadowColor: '#000', shadowOpacity: 0.2, shadowRadius: 10, elevation: 10 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 25 },
  modalTitle: { fontSize: 20, fontWeight: 'bold', color: '#061D5A' },
  historyList: { marginBottom: 10 },
  historyItem: { flexDirection: 'row', alignItems: 'center', marginBottom: 22 },
  historyLabel: { fontSize: 11, fontWeight: '700', color: '#64748B', marginBottom: 6, textTransform: 'uppercase' },
  historyBarContainer: { height: 8, backgroundColor: '#F1F5F9', borderRadius: 4, flex: 1, marginRight: 15 },
  historyBarFill: { height: 8, backgroundColor: '#F4B333', borderRadius: 4 },
  historyHoursBox: { alignItems: 'flex-end', minWidth: 65 },
  historyHoursText: { fontSize: 18, fontWeight: '900', color: '#061D5A' },
  historyTargetText: { fontSize: 11, color: '#94A3B8', fontWeight: '600' },
  closeButton: { backgroundColor: '#061D5A', paddingVertical: 14, borderRadius: 16, marginTop: 15, alignItems: 'center' },
  closeButtonText: { color: '#ffffff', fontWeight: 'bold', fontSize: 15 },
});

export default ScheduleScreen;
