import React, { useContext, useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity, ScrollView, Modal } from 'react-native';
import { AppContext } from '../context/AppContext';
import { CheckCircle2, Calendar as CalendarIcon, Clock, MapPin, Info, ClipboardList, UserCheck, X, XCircle, Fingerprint } from 'lucide-react-native';

const AttendanceRecordsScreen = ({ navigation }: any) => {
  const { activeShift, shifts, attendanceLogs, attendanceCounts } = useContext(AppContext);
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
        <Text style={styles.headerSubtitle}>View logs from SDAO thumbmark scanner</Text>
      </View>

      <ScrollView style={styles.container} showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 60 }}>

        {/* Important Notice Banner */}
        <View style={styles.warningBanner}>
          <View style={styles.warningIconBox}>
            <Info size={20} color="#F4B333" />
          </View>
          <Text style={styles.warningBannerText}>
            <Text style={{ fontWeight: 'bold' }}>IMPORTANT: </Text>
            All duty attendance time-in and time-out must be done in Ma'am Zai's office.
          </Text>
        </View>

        {/* Real-time Status Card */}
        {activeShift ? (
          <View style={[styles.activeShiftCard, isCheckedIn && { backgroundColor: '#061D5A' }]}>
            <View style={styles.cardHeader}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <Text style={[
                  styles.badgeText,
                  isCheckedIn && { backgroundColor: 'rgba(59,130,246,0.3)', color: '#93C5FD' }
                ]}>
                  {isCheckedIn ? 'ACTIVE SESSION' : isDutyComplete ? 'COMPLETED TODAY' : 'PENDING CHECK-IN'}
                </Text>

                {isLate && (
                  <View style={styles.lateBadgeCorner}>
                    <Clock size={12} color="#ffffff" style={{ marginRight: 4 }} />
                    <Text style={styles.lateBadgeText}>LATE</Text>
                  </View>
                )}
              </View>
              <Text style={[styles.shiftTitle, (isCheckedIn || isLate) && { color: '#10B981' }]}>
                {isCheckedIn ? 'Currently on Duty' : isDutyComplete ? 'Duty Completed' : (isLate ? 'Late for Duty' : 'Ready for Duty')}
              </Text>
            </View>

            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
              <Clock size={16} color={isCheckedIn ? '#93C5FD' : '#061D5A'} style={{ marginRight: 8 }} />
              <Text style={[styles.officeText, isCheckedIn && { color: '#DBEAFE' }]}>{activeShift.startTime} - {activeShift.endTime}</Text>
            </View>

            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
              <MapPin size={16} color={isCheckedIn ? '#F4B333' : '#061D5A'} style={{ marginRight: 8 }} />
              <Text style={[styles.officeText, isCheckedIn && { color: '#DBEAFE' }]}>{activeShift.office}</Text>
            </View>

            {isCheckedIn && activeLog && (
              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16 }}>
                <CheckCircle2 size={16} color={isCheckedIn ? '#10B981' : '#061D5A'} style={{ marginRight: 8 }} />
                <Text style={[styles.officeText, isCheckedIn && { color: '#10B981', fontWeight: 'bold' }]}>
                  Logged in at {activeLog.checkIn}
                </Text>
              </View>
            )}

            <View style={styles.scannerInfoBox}>
              <Fingerprint size={20} color={isCheckedIn ? '#93C5FD' : '#64748B'} style={{ marginRight: 10 }} />
              <Text style={{ flex: 1, color: isCheckedIn ? '#DBEAFE' : '#64748B', fontSize: 12, lineHeight: 18 }}>
                {isCheckedIn
                  ? "Remember to thumbmark at SDAO when your shift ends."
                  : isDutyComplete
                    ? "Both time-in and time-out successfully synced from SDAO scanner."
                    : "Please proceed to SDAO and use the thumbmark scanner to log your attendance."}
              </Text>
            </View>
          </View>
        ) : (
          <View style={[styles.activeShiftCard, { backgroundColor: '#F1F5F9', shadowColor: 'transparent', borderWidth: 1, borderColor: '#E2E8F0' }]}>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 10 }}>
              <Info size={20} color="#64748B" style={{ marginRight: 8 }} />
              <Text style={[styles.shiftTitle, { color: '#64748B', fontSize: 18 }]}>No Duty Today</Text>
            </View>
            <Text style={[styles.officeText, { color: '#64748B', fontSize: 13, lineHeight: 20 }]}>
              You do not have any active shift scheduled for today. Check your Term Schedule for more details.
            </Text>
          </View>
        )}

        {/* Attendance Breakdown */}
        <View style={styles.activityHeader}>
          <Text style={styles.activityTitle}>Attendance Record</Text>
        </View>
        <View style={styles.breakdownCard}>
          <View style={styles.statsGrid}>
            <View style={styles.statItem}>
              <View style={[styles.statIconBox, { backgroundColor: '#ECFDF5' }]}>
                <CheckCircle2 size={20} color="#10B981" />
              </View>
              <View>
                <Text style={styles.statValue}>{attendanceCounts.present}</Text>
                <Text style={styles.statLabel}>Completed</Text>
              </View>
            </View>

            <View style={styles.statItem}>
              <View style={[styles.statIconBox, { backgroundColor: '#FFFBEB' }]}>
                <Clock size={20} color="#F59E0B" />
              </View>
              <View>
                <Text style={styles.statValue}>{attendanceCounts.late}</Text>
                <Text style={styles.statLabel}>Late</Text>
              </View>
            </View>

            <View style={styles.statItem}>
              <View style={[styles.statIconBox, { backgroundColor: '#FEF2F2' }]}>
                <XCircle size={20} color="#EF4444" />
              </View>
              <View>
                <Text style={styles.statValue}>{attendanceCounts.absent}</Text>
                <Text style={styles.statLabel}>Absent</Text>
              </View>
            </View>

            <View style={styles.statItem}>
              <View style={[styles.statIconBox, { backgroundColor: '#F0F9FF' }]}>
                <ClipboardList size={20} color="#0EA5E9" />
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
          <Text style={styles.activityTitle}>Recent Logs</Text>
        </View>

        <View style={styles.activityList}>
          {attendanceLogs.length > 0 ? attendanceLogs.slice(0, 10).map((log, index) => (
            <React.Fragment key={log.id}>
              <TouchableOpacity style={styles.activityItem} onPress={() => showLogDetails(log)}>
                <View style={styles.activityDetails}>
                  <Text style={styles.dateText}>{new Date(log.date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</Text>
                  <Text style={styles.timeText}>IN: {log.checkIn}  •  OUT: {log.checkOut || 'Pending'}</Text>
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
              {index < Math.min(attendanceLogs.length - 1, 9) && <View style={styles.divider} />}
            </React.Fragment>
          )) : (
            <Text style={{ textAlign: 'center', color: '#9CA3AF', padding: 20 }}>No scanner records found.</Text>
          )}
        </View>
      </ScrollView>

      {/* Log Details Modal */}
      <Modal visible={detailsModal.visible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { padding: 0, overflow: 'hidden' }]}>
            <View style={styles.detailsHeader}>
              <Text style={styles.detailsHeaderTitle}>SDAO Scanner Log</Text>
              <TouchableOpacity onPress={() => setDetailsModal({ ...detailsModal, visible: false })}>
                <X size={20} color="#061D5A" />
              </TouchableOpacity>
            </View>

            <View style={{ padding: 25 }}>
              <View style={styles.detailSection}>
                <Text style={styles.detailLabel}>DATE RECORDED</Text>
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
                  <Text style={styles.detailLabel}>FINAL STATUS</Text>
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
                  <Text style={styles.detailLabel}>HOURS CREDITED</Text>
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
  safeArea: { flex: 1, backgroundColor: '#061D5A' },
  header: { paddingHorizontal: 24, paddingTop: 20, paddingBottom: 30 },
  headerTitle: { fontSize: 28, fontWeight: '800', color: '#ffffff', marginBottom: 4 },
  headerSubtitle: { fontSize: 14, color: '#93C5FD', fontWeight: '500' },
  container: { flex: 1, backgroundColor: '#F8FAFC', borderTopLeftRadius: 32, borderTopRightRadius: 32, paddingHorizontal: 24, paddingTop: 25 },
  warningBanner: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFFBEB', padding: 16, borderRadius: 16, marginBottom: 20, borderWidth: 1, borderColor: '#FEF3C7', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 5, elevation: 2 },
  warningIconBox: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#FEF3C7', justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  warningBannerText: { flex: 1, color: '#92400E', fontSize: 13, lineHeight: 20 },
  activeShiftCard: { backgroundColor: '#F4B333', borderRadius: 24, padding: 24, marginBottom: 30, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 10, elevation: 5 },
  cardHeader: { marginBottom: 16 },
  badgeText: { fontSize: 10, fontWeight: '800', color: '#061D5A', backgroundColor: 'rgba(255,255,255,0.5)', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10, alignSelf: 'flex-start' },
  shiftTitle: { fontSize: 24, fontWeight: '900', color: '#061D5A', marginTop: 10 },
  officeText: { fontSize: 14, fontWeight: '600', color: '#061D5A' },
  scannerInfoBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.05)', padding: 12, borderRadius: 12, marginTop: 16 },
  activityHeader: { marginBottom: 15, flexDirection: 'row', alignItems: 'center' },
  activityTitle: { fontSize: 18, fontWeight: '800', color: '#061D5A' },
  activityList: { backgroundColor: '#ffffff', borderRadius: 24, padding: 20, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 10, elevation: 2, marginBottom: 30 },
  activityItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  activityDetails: { flex: 1 },
  dateText: { fontSize: 15, fontWeight: '800', color: '#1E3A8A', marginBottom: 6 },
  timeText: { fontSize: 12, color: '#64748B', marginBottom: 8, fontWeight: '600' },
  statusBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#ECFDF5', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12, alignSelf: 'flex-start' },
  statusText: { color: '#10B981', fontSize: 10, fontWeight: '800' },
  hoursText: { fontSize: 22, fontWeight: '900', color: '#F4B333' },
  breakdownCard: { backgroundColor: '#ffffff', borderRadius: 24, padding: 16, marginBottom: 30, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 10, elevation: 3, borderWidth: 1, borderColor: '#F1F5F9' },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap' },
  statItem: { width: '50%', flexDirection: 'row', alignItems: 'center', padding: 12 },
  statIconBox: { width: 40, height: 40, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  statValue: { fontSize: 20, fontWeight: '900', color: '#061D5A' },
  statLabel: { fontSize: 12, color: '#64748B', fontWeight: '600', marginTop: 2 },
  lateBadgeCorner: { backgroundColor: '#EF4444', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10, flexDirection: 'row', alignItems: 'center' },
  lateBadgeText: { color: '#ffffff', fontSize: 10, fontWeight: '800' },
  divider: { height: 1, backgroundColor: '#F1F5F9', marginVertical: 16 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(6,29,90,0.7)', justifyContent: 'center', alignItems: 'center', padding: 20 },
  modalContent: { backgroundColor: '#ffffff', borderRadius: 24, alignItems: 'center', width: '95%', shadowColor: '#000', shadowOpacity: 0.2, shadowRadius: 10, elevation: 10 },
  modalButton: { backgroundColor: '#061D5A', paddingVertical: 14, paddingHorizontal: 30, borderRadius: 16, width: '100%', alignItems: 'center', marginTop: 10 },
  modalButtonText: { color: '#ffffff', fontWeight: 'bold', fontSize: 16 },
  detailsHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, borderBottomWidth: 1, borderBottomColor: '#F1F5F9', backgroundColor: '#F8FAFC' },
  detailsHeaderTitle: { fontSize: 18, fontWeight: '800', color: '#061D5A' },
  detailSection: { marginBottom: 20, flex: 1 },
  detailGrid: { flexDirection: 'row', gap: 20 },
  detailLabel: { fontSize: 11, fontWeight: '800', color: '#64748B', letterSpacing: 1, marginBottom: 6 },
  detailValue: { fontSize: 16, fontWeight: '700', color: '#061D5A' },
});

export default AttendanceRecordsScreen;
