import React, { useContext, useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity, ScrollView, Modal, Alert } from 'react-native';
import { AppContext } from '../context/AppContext'; // Assuming AppContext remains in context folder
import { CheckCircle2, Calendar as CalendarIcon, Clock, MapPin, Info, ClipboardList, UserCheck, X, XCircle } from 'lucide-react-native';

const ScanScreen = ({ navigation }: any) => {
  const { activeShift, shifts, attendanceLogs, attendanceCounts } = useContext(AppContext);
  const [feedback, setFeedback] = useState<{ visible: boolean; title: string; message: string; type: 'success' | 'info' }>({
    visible: false,
    title: '',
    message: '',
    type: 'info',
  });
  const [detailsModal, setDetailsModal] = useState<{ visible: boolean; log: any | null; shift: any | null }>({
    visible: false,
    log: null,
    shift: null
  });

  const now = new Date();
  const todayIso = now.toISOString().split('T')[0];
  const activeLog = attendanceLogs.find(log => log.date === todayIso && !log.checkOut);
  const isCheckedIn = !!activeLog;
  const isDutyComplete = attendanceLogs.some(log => log.date === todayIso && log.status === 'Completed');

  // Logic to determine if user is late (either already checked in late, OR hasn't checked in but it's 15+ mins past start)
  let isLate = activeLog?.status === 'Late';
  if (activeShift) {
    const [sh, sm] = activeShift.startTime.split(':').map(Number);
    const shiftStartTotalMinutes = sh * 60 + sm;

    if (isCheckedIn && activeLog?.checkIn) {
      const [ch, cm] = activeLog.checkIn.split(':').map(Number);
      const checkInTotalMinutes = ch * 60 + cm;
      if (checkInTotalMinutes >= shiftStartTotalMinutes + 15) {
        isLate = true;
      }
    } else if (!isCheckedIn && !isDutyComplete) {
      const currentTotalMinutes = now.getHours() * 60 + now.getMinutes();
      if (currentTotalMinutes >= shiftStartTotalMinutes + 15) {
        isLate = true;
      }
    }
  }

  const showLogDetails = (log: any) => {
    const shift = shifts.find(s => s.id === log.shiftId);
    setDetailsModal({
      visible: true,
      log,
      shift: shift || null
    });
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Attendance</Text>
        <Text style={styles.headerSubtitle}>View your duty logs</Text>
      </View>

      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        {/* Active Shift Card */}
        {activeShift ? (
          <View style={[styles.activeShiftCard, isCheckedIn && { backgroundColor: '#061D5A' }]}>
            <View style={styles.cardHeader}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <Text style={[
                  styles.badgeText, 
                  { marginBottom: 0 },
                  isCheckedIn && { backgroundColor: 'rgba(59,130,246,0.3)', color: '#93C5FD' }
                ]}>
                  {isCheckedIn ? 'ACTIVE DUTY' : isDutyComplete ? 'COMPLETED' : 'TODAY\'S SHIFT'}
                </Text>

                {isLate && (
                  <View style={styles.lateBadgeCorner}>
                    <Clock size={12} color="#ffffff" style={{ marginRight: 4 }} />
                    <Text style={styles.lateBadgeText}>LATE</Text>
                  </View>
                )}
              </View>
              <View style={styles.statusIndicator}>
                <Text style={[styles.shiftTitle, (isCheckedIn || isLate) && { color: '#10B981' }]}>
                  {isCheckedIn ? 'On Duty' : isDutyComplete ? 'Duty Complete' : (isLate ? 'On Duty' : 'Ready to Check In')}
                </Text>
                <View style={[styles.greenDot, (isCheckedIn || isDutyComplete || isLate) && { backgroundColor: '#10B981' }, (!isCheckedIn && !isDutyComplete && !isLate) && { backgroundColor: '#6B7280' }]} />
              </View>
            </View>

            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 6 }}>
              <Clock size={14} color={isCheckedIn ? '#93C5FD' : '#061D5A'} style={{ marginRight: 6 }} />
              <Text style={[styles.officeText, { marginBottom: 0 }, isCheckedIn && { color: '#DBEAFE' }]}>{activeShift.startTime} - {activeShift.endTime}</Text>
            </View>

            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 6 }}>
              <MapPin size={14} color={isCheckedIn ? '#F4B333' : '#061D5A'} style={{ marginRight: 6 }} />
              <Text style={[styles.officeText, { marginBottom: 0 }, isCheckedIn && { color: '#DBEAFE' }]}>{activeShift.office}</Text>
            </View>

            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
              <UserCheck size={14} color={isCheckedIn ? '#93C5FD' : '#061D5A'} style={{ marginRight: 6 }} />
              <Text style={[styles.officeText, { marginBottom: 0 }, isCheckedIn && { color: '#DBEAFE' }]}>
                Supervisor: {activeShift.supervisorName || 'SDAO Supervisor'}
              </Text>
            </View>

            {isCheckedIn && activeLog && (
              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
                <CheckCircle2 size={14} color={isCheckedIn ? '#93C5FD' : '#061D5A'} style={{ marginRight: 6 }} />
                <Text style={[styles.officeText, { marginBottom: 0 }, isCheckedIn && { color: '#DBEAFE' }]}>
                  Checked in at {activeLog.checkIn}
                </Text>
              </View>
            )}

            {isDutyComplete ? (
              <View style={[styles.scanButton, { backgroundColor: '#10B981', shadowColor: 'transparent' }]}>
                <CheckCircle2 size={18} color="#ffffff" style={{ marginRight: 8 }} />
                <Text style={styles.scanButtonText}>Duty Complete</Text>
              </View>
            ) : (
              <View style={[styles.scanButton, { backgroundColor: '#64748B', shadowColor: 'transparent' }]}>
                <Info size={18} color="#ffffff" style={{ marginRight: 8 }} />
                <Text style={styles.scanButtonText}>Use Office Biometrics</Text>
              </View>
            )}
            <Text style={{ color: isCheckedIn ? '#93C5FD' : '#061D5A', fontSize: 11, textAlign: 'center', marginTop: 12, fontWeight: '600' }}>
              Scanner located in Maam Zai's Office
            </Text>
          </View>
        ) : (
          <View style={[styles.activeShiftCard, { backgroundColor: '#E5E7EB', shadowColor: 'transparent' }]}>
            <Text style={styles.shiftTitle}>No Active Shift</Text>
            <Text style={[styles.officeText, { marginTop: 10, color: '#6B7280' }]}>Check your schedule for your next duty hours.</Text>
          </View>
        )}

        {/* Attendance Breakdown */}
        <View style={styles.activityHeader}>
          <ClipboardList size={20} color="#061D5A" style={{ marginRight: 8 }} />
          <Text style={styles.activityTitle}>Attendance Breakdown</Text>
        </View>
        <View style={styles.breakdownCard}>
          <View style={styles.statsGrid}>
            <View style={styles.statItem}>
              <View style={[styles.statIconBox, { backgroundColor: '#ECFDF5' }]}>
                <CheckCircle2 size={16} color="#10B981" />
              </View>
              <View>
                <Text style={styles.statValue}>{attendanceCounts.present}</Text>
                <Text style={styles.statLabel}>Completed</Text>
              </View>
            </View>
            
            <View style={styles.statItem}>
              <View style={[styles.statIconBox, { backgroundColor: '#FFFBEB' }]}>
                <Clock size={16} color="#F59E0B" />
              </View>
              <View>
                <Text style={styles.statValue}>{attendanceCounts.late}</Text>
                <Text style={styles.statLabel}>Late</Text>
              </View>
            </View>

            <View style={styles.statItem}>
              <View style={[styles.statIconBox, { backgroundColor: '#FEF2F2' }]}>
                <XCircle size={16} color="#EF4444" />
              </View>
              <View>
                <Text style={styles.statValue}>{attendanceCounts.absent}</Text>
                <Text style={styles.statLabel}>Absent</Text>
              </View>
            </View>

            <View style={styles.statItem}>
              <View style={[styles.statIconBox, { backgroundColor: '#F0F9FF' }]}>
                <ClipboardList size={16} color="#0EA5E9" />
              </View>
              <View>
                <Text style={styles.statValue}>{attendanceCounts.total}</Text>
                <Text style={styles.statLabel}>Total Days</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Recent Activity */}
        <View style={styles.activityHeader}>
          <Clock size={20} color="#061D5A" style={{ marginRight: 8 }} />
          <Text style={styles.activityTitle}>Recent Activity</Text>
        </View>

        <View style={styles.activityList}>
          {attendanceLogs.length > 0 ? attendanceLogs.slice(0, 5).map((log, index) => (
            <React.Fragment key={log.id}>
              <TouchableOpacity style={styles.activityItem} onPress={() => showLogDetails(log)}>
                <View style={styles.activityDetails}>
                  <Text style={styles.dateText}>{new Date(log.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</Text>
                  <Text style={styles.timeText}>IN {log.checkIn} - OUT {log.checkOut || 'Pending'}</Text>
                  <View style={[
                    styles.statusBadge,
                    log.status === 'Late' && { backgroundColor: '#FFFBEB' },
                    log.status === 'Absent' && { backgroundColor: '#FEF2F2' }
                  ]}>
                    {log.status === 'Late' ? <Clock size={12} color="#F59E0B" style={{ marginRight: 4 }} /> : <CheckCircle2 size={12} color={log.status === 'Completed' || log.status === 'Active' ? "#10B981" : "#EF4444"} style={{ marginRight: 4 }} />}
                    <Text style={[styles.statusText, log.status === 'Late' && { color: '#F59E0B' }, log.status !== 'Completed' && log.status !== 'Active' && log.status !== 'Late' && { color: '#EF4444' }]}>{log.status}</Text>
                  </View>
                </View>
                <Text style={styles.hoursText}>{log.hoursRendered}h</Text>
              </TouchableOpacity>
              {index < Math.min(attendanceLogs.length - 1, 4) && <View style={styles.divider} />}
            </React.Fragment>
          )) : (
            <Text style={{ textAlign: 'center', color: '#9CA3AF' }}>No records found.</Text>
          )}
        </View>
      </ScrollView>

      {/* In-App Attendance Feedback Card */}
      <Modal visible={feedback.visible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={[styles.modalIconBox, { backgroundColor: feedback.type === 'success' ? '#ECFDF5' : '#EBF0FF' }]}>
              {feedback.type === 'success' ? <CheckCircle2 size={32} color="#10B981" /> : <Info size={32} color="#3B82F6" />}
            </View>
            <Text style={styles.modalTitle}>{feedback.title}</Text>
            <Text style={styles.modalText}>{feedback.message}</Text>
            <TouchableOpacity
              style={styles.modalButton}
              onPress={() => setFeedback({ ...feedback, visible: false })}
            >
              <Text style={styles.modalButtonText}>Okay</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Log Details Modal */}
      <Modal visible={detailsModal.visible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { padding: 0, overflow: 'hidden' }]}>
            <View style={styles.detailsHeader}>
              <Text style={styles.detailsHeaderTitle}>Attendance Details</Text>
              <TouchableOpacity onPress={() => setDetailsModal({ ...detailsModal, visible: false })}>
                <X size={20} color="#061D5A" />
              </TouchableOpacity>
            </View>
            
            <View style={{ padding: 25 }}>
              <View style={styles.detailSection}>
                <Text style={styles.detailLabel}>DATE</Text>
                <Text style={styles.detailValue}>
                  {detailsModal.log ? new Date(detailsModal.log.date).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' }) : '--'}
                </Text>
              </View>

              <View style={styles.detailGrid}>
                <View style={styles.detailSection}>
                  <Text style={styles.detailLabel}>OFFICE</Text>
                  <Text style={styles.detailValue}>{detailsModal.shift?.office || 'SDAO'}</Text>
                </View>
                <View style={styles.detailSection}>
                  <Text style={styles.detailLabel}>SUPERVISOR</Text>
                  <Text style={styles.detailValue}>{detailsModal.shift?.supervisorName || 'SDAO Admin'}</Text>
                </View>
              </View>

              <View style={styles.detailGrid}>
                <View style={styles.detailSection}>
                  <Text style={styles.detailLabel}>TIME IN</Text>
                  <Text style={styles.detailValue}>{detailsModal.log?.checkIn || '--:--'}</Text>
                </View>
                <View style={styles.detailSection}>
                  <Text style={styles.detailLabel}>TIME OUT</Text>
                  <Text style={styles.detailValue}>{detailsModal.log?.checkOut || 'Pending'}</Text>
                </View>
              </View>

              <View style={styles.detailGrid}>
                <View style={styles.detailSection}>
                  <Text style={styles.detailLabel}>STATUS</Text>
                  <View style={[
                    styles.statusBadge, 
                    { marginTop: 4 },
                    detailsModal.log?.status === 'Late' && { backgroundColor: '#FFFBEB' },
                    detailsModal.log?.status === 'Absent' && { backgroundColor: '#FEF2F2' }
                  ]}>
                    <Text style={[styles.statusText, detailsModal.log?.status === 'Late' && { color: '#F59E0B' }, (detailsModal.log?.status !== 'Completed' && detailsModal.log?.status !== 'Active' && detailsModal.log?.status !== 'Late') && { color: '#EF4444' }]}>
                      {detailsModal.log?.status}
                    </Text>
                  </View>
                </View>
                <View style={styles.detailSection}>
                  <Text style={styles.detailLabel}>HOURS RENDERED</Text>
                  <Text style={[styles.detailValue, { color: '#F4B333', fontSize: 24 }]}>{detailsModal.log?.hoursRendered || '0'}h</Text>
                </View>
              </View>

              <TouchableOpacity style={styles.modalButton} onPress={() => setDetailsModal({ ...detailsModal, visible: false })}>
                <Text style={styles.modalButtonText}>Close</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#061D5A',
  },
  header: {
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 30,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#93C5FD',
  },
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    paddingHorizontal: 24,
    paddingTop: 30,
  },
  activeShiftCard: {
    backgroundColor: '#F4B333',
    borderRadius: 24,
    padding: 24,
    marginBottom: 30,
    shadowColor: '#F4B333',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  cardHeader: {
    marginBottom: 10,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#061D5A',
    backgroundColor: 'rgba(255,255,255,0.5)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
    alignSelf: 'flex-start',
    marginBottom: 8,
  },
  statusIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  shiftTitle: {
    fontSize: 22,
    fontWeight: '900',
    color: '#061D5A',
  },
  greenDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#10B981',
    marginLeft: 8,
  },
  officeText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#061D5A',
    marginBottom: 20,
  },
  scanButton: {
    backgroundColor: '#10B981',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    height: 56,
    borderRadius: 28,
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
    marginTop: 10,
  },
  scanButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  activityHeader: {
    marginBottom: 15,
    flexDirection: 'row',
    alignItems: 'center',
  },
  activityTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#061D5A',
  },
  activityList: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 2,
    marginBottom: 30,
  },
  activityItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  activityDetails: {
    flex: 1,
  },
  dateText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#061D5A',
    marginBottom: 4,
  },
  timeText: {
    fontSize: 12,
    color: '#64748B',
    marginBottom: 8,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  statusText: {
    color: '#10B981',
    fontSize: 10,
    fontWeight: 'bold',
  },
  hoursText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#F4B333',
  },
  breakdownCard: {
    backgroundColor: '#ffffff',
    borderRadius: 24,
    padding: 12,
    marginBottom: 30,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap' },
  statItem: {
    width: '50%',
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
  },
  statIconBox: { width: 36, height: 36, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  statValue: { fontSize: 18, fontWeight: '900', color: '#061D5A' },
  statLabel: { fontSize: 11, color: '#64748B', fontWeight: '600', marginTop: 1 },
  countsGrid: { flexDirection: 'row', justifyContent: 'space-between', gap: 10, marginBottom: 30 },
  lateWarningBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(239, 68, 68, 0.2)',
    padding: 10,
    borderRadius: 12,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.4)',
  },
  lateWarningText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '600',
  },
  lateBadgeCorner: {
    backgroundColor: '#EF4444',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
  },
  lateBadgeText: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: '800',
  },
  divider: {
    height: 1,
    backgroundColor: '#F1F5F9',
    marginVertical: 15,
  },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(6,29,90,0.7)', justifyContent: 'center', alignItems: 'center', padding: 20 },
  modalContent: { backgroundColor: '#ffffff', borderRadius: 24, padding: 25, alignItems: 'center', width: '90%', shadowColor: '#000', shadowOpacity: 0.2, shadowRadius: 10, elevation: 10 },
  modalIconBox: { width: 60, height: 60, borderRadius: 30, justifyContent: 'center', alignItems: 'center', marginBottom: 15 },
  modalTitle: { fontSize: 18, fontWeight: 'bold', color: '#061D5A', marginBottom: 8 },
  modalText: { fontSize: 14, color: '#4B5563', textAlign: 'center', lineHeight: 20, marginBottom: 20 },
  modalButton: { backgroundColor: '#061D5A', paddingVertical: 12, paddingHorizontal: 30, borderRadius: 12, width: '100%', alignItems: 'center' },
  modalButtonText: { color: '#ffffff', fontWeight: 'bold' },
  detailsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    backgroundColor: '#F8FAFC'
  },
  detailsHeaderTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#061D5A',
  },
  detailSection: {
    marginBottom: 20,
    flex: 1,
  },
  detailGrid: {
    flexDirection: 'row',
    gap: 20,
  },
  detailLabel: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#64748B',
    letterSpacing: 1,
    marginBottom: 4,
  },
  detailValue: {
    fontSize: 15,
    fontWeight: '600',
    color: '#061D5A',
  },
});

export default ScanScreen;
