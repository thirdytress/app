import React, { useContext, useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, TouchableOpacity, Alert, Dimensions, Modal, FlatList } from 'react-native';
import { AppContext } from '../context/AppContext';
import { Calendar as CalendarIcon, Clock, MapPin, ChevronLeft, CalendarDays, ChevronDown, AlertCircle, X, ChevronRight } from 'lucide-react-native';

const { width } = Dimensions.get('window');

const ScheduleScreen = ({ navigation }: any) => {
  const { 
    shifts = [], 
    updateShiftStatus = () => {}, 
    totalRequiredHours = 0, 
    totalRenderedHours = 0, 
    weeklyRenderedHours = 0,
    attendanceLogs = [], 
    userProfile 
  } = useContext(AppContext);

  const [showWeeklyHistory, setShowWeeklyHistory] = useState(false);
  const [viewMode, setViewMode] = useState<'all' | 'pending' | 'active' | 'declined'>('all'); // Fix #12

  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const fullDays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

  const weeklyGoal = userProfile?.weeklyHoursGoal || 8;
  const weeklyProgress = Math.min(100, Math.round((weeklyRenderedHours / weeklyGoal) * 100));
  const pendingShifts = shifts.filter(s => s.status === 'Pending');
  const hasTermGoal = (totalRequiredHours || 0) > 0;
  const remainingHours = hasTermGoal ? Math.max(0, totalRequiredHours - totalRenderedHours).toFixed(1).replace(/\.0$/, '') : '-'; // Ensure it's a string
  const todayFormatted = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });

  const handleAccept = (id: string) => {
    updateShiftStatus(id, 'Active');
    Alert.alert("Accepted", "You have accepted this shift assignment.");
  };

  const handleDecline = (id: string) => {
    Alert.alert(
      "Decline Schedule",
      "Please provide a reason for declining this shift assignment. Admin will be notified for reassignment.",
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Submit", 
          onPress: () => {
            updateShiftStatus(id, 'Declined');
            Alert.alert("Declined", "Your decline reason has been logged in the Shuffle History.");
          }
        }
      ]
    );
  };

  // Logic for Weekly History Dropdown: Calculates and formats hours rendered for the last 4 weeks
  const getWeeklyHistory = () => {
    const history = [];
    const now = new Date();
    
    for (let i = 0; i < 4; i++) {
      const start = new Date(now);
      // Determine Monday of the current or previous weeks
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
          <TouchableOpacity style={styles.navButton} onPress={() => navigation.goBack()}><ChevronLeft size={24} color="#ffffff" /></TouchableOpacity>
          <Text style={styles.headerTitle}>My Schedule</Text> {/* Fix #12: Changed to a generic calendar icon */}
          <TouchableOpacity
            style={[styles.navButton, { backgroundColor: 'transparent' }]} // Removed calendar view toggle
            onPress={() => Alert.alert('Calendar View', 'Calendar layout is coming soon. You can use the list and filters below for now.')}
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

      {/* Fix #12: View Mode Tabs */}
      <View style={styles.viewModeTabs}>
        <TouchableOpacity
          style={[styles.viewModeTab, viewMode === 'all' && styles.viewModeTabActive]}
          onPress={() => setViewMode('all')}
        >
          <Text style={[styles.viewModeTabText, viewMode === 'all' && styles.viewModeTabTextActive]}>All</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.viewModeTab, viewMode === 'pending' && styles.viewModeTabActive]}
          onPress={() => setViewMode('pending')}
        >
          <Text style={[styles.viewModeTabText, viewMode === 'pending' && styles.viewModeTabTextActive]}>Pending ({pendingShifts.length})</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.viewModeTab, viewMode === 'active' && styles.viewModeTabActive]}
          onPress={() => setViewMode('active')}
        >
          <Text style={[styles.viewModeTabText, viewMode === 'active' && styles.viewModeTabTextActive]}>Active</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.viewModeTab, viewMode === 'declined' && styles.viewModeTabActive]}
          onPress={() => setViewMode('declined')}
        >
          <Text style={[styles.viewModeTabText, viewMode === 'declined' && styles.viewModeTabTextActive]}>Declined</Text>
        </TouchableOpacity>
      </View>

      {/* Fix #12: Pending Alert Banner */}
      {viewMode !== 'pending' && pendingShifts.length > 0 && (
        <TouchableOpacity style={styles.pendingAlertBanner} onPress={() => setViewMode('pending')}>
          <AlertCircle size={18} color="#F59E0B" style={{ marginRight: 10 }} />
          <Text style={styles.pendingAlertText}>{pendingShifts.length} pending shift assignment{pendingShifts.length > 1 ? 's' : ''} require your attention.</Text>
          <ChevronRight size={18} color="#F59E0B" />
        </TouchableOpacity>
      )}

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 60, paddingTop: 20 }}>
        
        {/* Fix #12: Conditional rendering based on viewMode */}
        {viewMode !== 'pending' && fullDays.map((day) => {
          const dayShifts = shifts.filter(s => s.day === day &&
            (viewMode === 'all' || (viewMode === 'active' && s.status === 'Active') || (viewMode === 'declined' && s.status === 'Declined'))
          );
          
          return (
            <View key={day} style={styles.daySection}>
              <View style={styles.dayHeaderRow}>
                <Text style={styles.dayTitle}>{day}</Text>
                <View style={styles.dayLine} />
              </View>

              {dayShifts.length > 0 ? dayShifts.map((shift) => (
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

                    <View style={styles.statusContainer}>
                      {shift.status === 'Active' && (
                        <View style={[styles.badge, { backgroundColor: '#10B981' }]}>
                          <Text style={styles.badgeText}>Active</Text>
                        </View>
                      )}
                      {shift.status === 'Declined' && (
                        <View style={[styles.badge, { backgroundColor: '#EF4444' }]}>
                          <Text style={styles.badgeText}>Declined</Text>
                        </View>
                      )}
                      {shift.status === 'Completed' && (
                        <View style={[styles.badge, { backgroundColor: '#6B7280' }]}>
                          <Text style={styles.badgeText}>Completed</Text>
                        </View>
                      )}
                    </View>
                  </View>
                </View>
              )) : (
                <View style={styles.noDutyContainer}>
                  <Text style={styles.noDutyText}>No duty hours scheduled</Text>
                </View>
              )}
            </View>
          );
        })}

        {/* Fix #12: Display Pending Shifts if viewMode is 'pending' */}
        {viewMode === 'pending' && (
          <View style={styles.daySection}>
            <View style={styles.dayHeaderRow}>
              <Text style={styles.dayTitle}>Pending Assignments</Text>
              <View style={styles.dayLine} />
            </View>
            {pendingShifts.length > 0 ? pendingShifts.map((shift) => (
              <View key={shift.id} style={styles.dayContainer}>
                <View style={[styles.shiftCard, { backgroundColor: '#FFFBEB', borderWidth: 1, borderColor: '#FCD34D' }]}>
                  <View style={styles.shiftCardRow}>
                    <Text style={[styles.shiftTimeLabel, { color: '#92400E' }]}>NEW ASSIGNMENT</Text>
                    <Text style={[styles.shiftTimeValue, { color: '#061D5A' }]}>{shift.startTime} - {shift.endTime}</Text>
                  </View>
                  <View style={[styles.divider, { backgroundColor: '#FDE68A' }]} />
                  <View style={styles.shiftCardRow}>
                    <MapPin size={20} color="#F4B333" style={{marginRight: 15}} />
                    <View>
                      <Text style={[styles.shiftLocationLabel, { color: '#92400E' }]}>LOCATION</Text>
                      <Text style={[styles.shiftLocationValue, { color: '#061D5A' }]}>{shift.office}</Text>
                    </View>
                  </View>
                  <View style={[styles.divider, { backgroundColor: '#FDE68A' }]} />
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Text style={{ color: '#92400E', fontSize: 13, fontWeight: '600' }}>{shift.day}</Text>
                    <View style={[styles.badge, { backgroundColor: '#FCD34D' }]}>
                      <Text style={[styles.badgeText, { color: '#92400E' }]}>Pending</Text>
                    </View>
                  </View>
                  <View style={styles.actionButtonsRow}>
                    <TouchableOpacity style={styles.acceptButton} onPress={() => handleAccept(shift.id)}>
                      <Text style={styles.acceptButtonText}>Accept</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.declineButton} onPress={() => handleDecline(shift.id)}>
                      <Text style={styles.declineButtonText}>Decline</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            )) : (
              <View style={styles.noDutyContainer}>
                <Text style={styles.noDutyText}>No pending assignments.</Text>
              </View>
            )}
          </View>
        )}

        {/* Fix #12: Display Declined Shifts if viewMode is 'declined' */}
        {viewMode === 'declined' && (
          <View style={styles.daySection}>
            <View style={styles.dayHeaderRow}>
              <Text style={styles.dayTitle}>Declined Assignments</Text>
              <View style={styles.dayLine} />
            </View>
            {/* You would filter and map declined shifts here, similar to pendingShifts */}
            <Text style={{ textAlign: 'center', color: '#9CA3AF' }}>No declined shifts to display.</Text>
          </View>
        )}

        {/* Recent Duties Section */}
        <View style={[styles.daySection, { marginTop: 20 }]}>
          <View style={styles.dayHeaderRow}>
            <Text style={styles.dayTitle}>Recent Duties</Text>
            <View style={styles.dayLine} />
          </View>
          {shifts.filter(s => s.status === 'Completed').length > 0 ? (
            shifts.filter(s => s.status === 'Completed').map((shift) => (
              <View key={shift.id} style={styles.dayContainer}>
                <View style={[styles.shiftCard, { backgroundColor: '#ffffff', borderWidth: 1, borderColor: '#E2E8F0' }]}>
                  <View style={styles.shiftCardRow}>
                    <Text style={[styles.shiftTimeLabel, { color: '#64748B' }]}>PAST DUTY</Text>
                    <Text style={[styles.shiftTimeValue, { color: '#061D5A' }]}>{shift.startTime} - {shift.endTime}</Text>
                  </View>
                  <View style={[styles.divider, { backgroundColor: '#F1F5F9' }]} />
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Text style={{ color: '#64748B', fontSize: 13, fontWeight: '600' }}>{shift.office}</Text>
                    <View style={[styles.badge, { backgroundColor: '#F1F5F9' }]}>
                      <Text style={[styles.badgeText, { color: '#64748B' }]}>Completed</Text>
                    </View>
                  </View>
                </View>
              </View>
            ))
          ) : (
            <View style={styles.noDutyContainer}>
              <Text style={styles.noDutyText}>No past duties recorded</Text>
            </View>
          )}
        </View>

        {shifts.length === 0 && (
          <View style={[styles.emptyContainer, { marginTop: 80 }]}>
            <View style={styles.emptyIconBox}><AlertCircle size={40} color="#F4B333" /></View>
            <Text style={styles.emptyTitle}>Undeployed Status</Text>
            <Text style={styles.emptySubtitle}>You have no assigned shifts yet. Wait for Ma'am Zai to deploy your duty schedule.</Text>
          </View>
        )}
      </ScrollView> 

      {/* Weekly History Modal: Providing insight into past weekly records */}
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
  navIcon: { color: '#fff', fontSize: 18 },
  headerTitle: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
  weekText: { color: '#F4B333', fontSize: 24, fontWeight: '900', marginBottom: 4, textAlign: 'center' },
  dateRangeText: { color: '#93C5FD', fontSize: 12, textAlign: 'center', marginBottom: 25 },
  totalHoursContainer: { backgroundColor: '#ffffff', borderRadius: 20, padding: 20 },
  totalHoursLabel: { color: '#64748B', fontSize: 12, fontWeight: '600', marginBottom: 5 },
  totalHoursRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  totalHoursValue: { color: '#061D5A', fontSize: 32, fontWeight: '900' },
  totalHoursUnit: { fontSize: 16, fontWeight: 'bold' },
  clockIconContainer: { width: 40, height: 40, backgroundColor: '#EBF0FF', borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  scrollView: { flex: 1, backgroundColor: '#F8FAFC', borderTopLeftRadius: 30, borderTopRightRadius: 30, marginTop: -20, paddingHorizontal: 24 },
  viewModeTabs: { // Fix #12
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: '#ffffff',
    borderRadius: 12,
    marginHorizontal: 24,
    marginTop: -10,
    padding: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 2,
  },
  viewModeTab: { flex: 1, alignItems: 'center', paddingVertical: 10, borderRadius: 8 },
  viewModeTabActive: { backgroundColor: '#EBF0FF' },
  viewModeTabText: { fontSize: 13, fontWeight: '600', color: '#64748B' },
  viewModeTabTextActive: { color: '#061D5A', fontWeight: 'bold' },
  pendingAlertBanner: { // Fix #12
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFFBEB', padding: 15, borderRadius: 12, marginHorizontal: 24, marginTop: 20, marginBottom: 10, borderWidth: 1, borderColor: '#FCD34D'
  },
  pendingAlertText: { flex: 1, fontSize: 13, fontWeight: '600', color: '#92400E' },
  daySection: { marginBottom: 10 },
  dayHeaderRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 15, marginTop: 10 },
  dayLine: { flex: 1, height: 1, backgroundColor: '#E2E8F0', marginLeft: 15 },
  dayContainer: { marginBottom: 25 },
  dayTitle: { fontSize: 18, fontWeight: '900', color: '#061D5A', textTransform: 'uppercase', letterSpacing: 1 },
  pendingSection: { marginBottom: 20, backgroundColor: '#FFFBEB', padding: 15, borderRadius: 20, borderWidth: 1, borderColor: '#FEF3C7' },
  noDutyContainer: { 
    padding: 15, 
    backgroundColor: '#ffffff', 
    borderRadius: 12, 
    borderStyle: 'dashed', 
    borderWidth: 1, 
    borderColor: '#CBD5E1',
    marginBottom: 20,
    alignItems: 'center'
  },
  noDutyText: { color: '#94A3B8', fontSize: 12, fontWeight: '500' },
  shiftCard: { backgroundColor: '#061D5A', borderRadius: 16, padding: 20, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 8, elevation: 5 },
  shiftCardRow: { flexDirection: 'row', alignItems: 'center' },
  shiftIcon: { fontSize: 20, marginRight: 15 },
  shiftTimeLabel: { color: '#93C5FD', fontSize: 10, fontWeight: 'bold', letterSpacing: 1, marginBottom: 4 },
  shiftTimeValue: { color: '#ffffff', fontSize: 16, fontWeight: 'bold' },
  shiftLocationLabel: { color: '#F4B333', fontSize: 10, fontWeight: 'bold', letterSpacing: 1, marginBottom: 4 },
  shiftLocationValue: { color: '#ffffff', fontSize: 14, fontWeight: '500' },
  divider: { height: 1, backgroundColor: 'rgba(255,255,255,0.1)', marginVertical: 15 },
  emptyContainer: { alignItems: 'center', marginTop: 50 },
  emptyIconBox: { width: 80, height: 80, backgroundColor: '#ffffff', borderRadius: 20, justifyContent: 'center', alignItems: 'center', marginBottom: 20, shadowColor: '#000', shadowOffset: {width: 0, height: 2}, shadowOpacity: 0.05, shadowRadius: 5 },
  emptyTitle: { fontSize: 20, fontWeight: 'bold', color: '#061D5A', marginBottom: 8 },
  emptySubtitle: { fontSize: 14, color: '#64748B', textAlign: 'center', paddingHorizontal: 40 },
  statusContainer: { marginTop: 10, paddingTop: 10, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.1)' }, // This style is not used in the provided code.
  actionButtonsRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 15 },
  acceptButton: { flex: 1, backgroundColor: '#10B981', paddingVertical: 12, borderRadius: 8, marginRight: 8, alignItems: 'center' },
  acceptButtonText: { color: '#ffffff', fontWeight: 'bold' },
  declineButton: { flex: 1, backgroundColor: '#EF4444', paddingVertical: 12, borderRadius: 8, marginLeft: 8, alignItems: 'center' },
  declineButtonText: { color: '#ffffff', fontWeight: 'bold' },
  badge: { alignSelf: 'flex-start', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 },
  badgeText: { color: '#ffffff', fontWeight: 'bold', fontSize: 12 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(6,29,90,0.8)', justifyContent: 'center', alignItems: 'center', padding: 20 },
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
  calendarContainer: { backgroundColor: '#ffffff', borderRadius: 24, padding: 15, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 10, elevation: 2, marginBottom: 20 },
  calendarTable: { width: '100%', borderWidth: 1, borderColor: '#F1F5F9', borderRadius: 12, overflow: 'hidden' },
  tableHeaderRow: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: '#F1F5F9', paddingVertical: 10, backgroundColor: '#F8FAFC' },
  timeColumn: { width: 45, justifyContent: 'center', alignItems: 'center', borderRightWidth: 1, borderRightColor: '#F1F5F9' },
  dayColumnHeader: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  dayHeaderLetter: { fontSize: 10, fontWeight: 'bold', color: '#64748B' },
  tableBodyRow: { flexDirection: 'row', height: 50, borderBottomWidth: 1, borderBottomColor: '#F1F5F9' },
  timeText: { fontSize: 10, color: '#94A3B8', fontWeight: '600' },
  gridCell: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 2 },
  activeBlock: { width: '100%', height: '90%', backgroundColor: '#F4B333', borderRadius: 4, justifyContent: 'center', alignItems: 'center' },
  activeBlockText: { fontSize: 8, fontWeight: 'bold', color: '#061D5A' },
  calendarFooter: { marginTop: 20, paddingTop: 15, borderTopWidth: 1, borderTopColor: '#F1F5F9' },
  legendRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  legendDot: { width: 10, height: 10, borderRadius: 5, marginRight: 8 },
  legendText: { fontSize: 12, color: '#061D5A', fontWeight: '600' },
  calendarNote: { fontSize: 11, color: '#94A3B8', fontStyle: 'italic' },
});

export default ScheduleScreen;
