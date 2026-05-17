import React, { useContext, useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, TouchableOpacity, Modal } from 'react-native';
import { ChevronLeft, Bell, Calendar, ShieldAlert, CheckCircle2, XCircle, Info } from 'lucide-react-native';
import { AppContext } from '../context/AppContext'; // Assuming AppContext remains in context folder

const NotificationsScreen = ({ navigation }: any) => {
  const { shifts, updateShiftStatus } = useContext(AppContext);
  const [feedback, setFeedback] = useState<{ visible: boolean; title: string; message: string; type: 'success' | 'info' }>({
    visible: false,
    title: '',
    message: '',
    type: 'info',
  });

  // Pending shifts become actionable notifications
  const pendingShifts = shifts.filter(s => s.status === 'Pending');

  const handleAccept = (shiftId: string, day: string) => {
    updateShiftStatus(shiftId, 'Active');
    setFeedback({
      visible: true,
      title: 'Shift Accepted',
      message: `Your shift on ${day} has been accepted and is now active.`,
      type: 'success',
    });
  };

  const handleDecline = (shiftId: string, day: string) => {
    setFeedback({
      visible: true,
      title: 'Shift Declined',
      message: `The ${day} shift has been declined. Admin will be notified for reassignment.`,
      type: 'info',
    });
    updateShiftStatus(shiftId, 'Declined');
  };

  // Static system notifications
  const systemNotifs = [
    { id: 'n1', title: 'Attendance Logged', desc: 'You successfully checked out. Hours rendered have been updated.', time: 'Yesterday', icon: <CheckCircle2 size={20} color="#10B981" />, bg: '#ECFDF5' },
    { id: 'n2', title: 'New Guideline Update', desc: 'Please review the updated SDAO manual on duty hour policies.', time: '2 days ago', icon: <ShieldAlert size={20} color="#F59E0B" />, bg: '#FEF3C7' },
    { id: 'n3', title: 'Shift Starting Soon', desc: 'Your upcoming duty starts in 30 minutes. Please be on time.', time: '3 days ago', icon: <Bell size={20} color="#3B82F6" />, bg: '#EFF6FF' },
  ];

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <ChevronLeft size={24} color="#061D5A" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Notifications</Text>
        <View style={{ width: 34 }} />
      </View>

      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>

        {/* Pending Shift Assignments */}
        {pendingShifts.length > 0 && (
          <>
            <Text style={styles.sectionLabel}>⏳ Action Required</Text>
            {pendingShifts.map(shift => (
              <View key={shift.id} style={styles.card}>
                <View style={[styles.iconBox, { backgroundColor: '#FFF8E7' }]}>
                  <Calendar size={20} color="#F4B333" />
                </View>
                <View style={styles.textContainer}>
                  <Text style={styles.title}>New Schedule Assignment</Text>
                  <Text style={styles.desc}>
                    You have been assigned to {shift.office} on {shift.day}, {shift.startTime} – {shift.endTime}.
                  </Text>
                  <Text style={styles.time}>Pending your response</Text>
                  <View style={styles.actionButtons}>
                    <TouchableOpacity style={styles.acceptBtn} onPress={() => handleAccept(shift.id, shift.day)}>
                      <CheckCircle2 size={14} color="#ffffff" style={{ marginRight: 4 }} />
                      <Text style={styles.acceptBtnText}>Accept</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.declineBtn} onPress={() => handleDecline(shift.id, shift.day)}>
                      <XCircle size={14} color="#DC2626" style={{ marginRight: 4 }} />
                      <Text style={styles.declineBtnText}>Decline</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            ))}
          </>
        )}

        {/* System Notifications */}
        <Text style={styles.sectionLabel}>📣 Recent Activity</Text>
        {systemNotifs.map(notif => (
          <View key={notif.id} style={styles.card}>
            <View style={[styles.iconBox, { backgroundColor: notif.bg }]}>
              {notif.icon}
            </View>
            <View style={styles.textContainer}>
              <Text style={styles.title}>{notif.title}</Text>
              <Text style={styles.desc}>{notif.desc}</Text>
              <Text style={styles.time}>{notif.time}</Text>
            </View>
          </View>
        ))}

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* In-App Feedback Modal */}
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
              <Text style={styles.modalButtonText}>Acknowledge</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#F8FAFC' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 15, backgroundColor: '#ffffff', borderBottomWidth: 1, borderBottomColor: '#E5E7EB' },
  backButton: { padding: 5 },
  headerTitle: { fontSize: 18, fontWeight: 'bold', color: '#061D5A' },
  container: { flex: 1, padding: 20 },
  sectionLabel: { fontSize: 13, fontWeight: '700', color: '#64748B', marginBottom: 12, marginTop: 4 },
  card: { flexDirection: 'row', backgroundColor: '#ffffff', padding: 15, borderRadius: 16, marginBottom: 15, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 },
  iconBox: { width: 48, height: 48, borderRadius: 24, justifyContent: 'center', alignItems: 'center', marginRight: 15, flexShrink: 0 },
  textContainer: { flex: 1 },
  title: { fontSize: 15, fontWeight: 'bold', color: '#111827', marginBottom: 4 },
  desc: { fontSize: 13, color: '#4B5563', marginBottom: 6, lineHeight: 18 },
  time: { fontSize: 12, color: '#9CA3AF' },
  actionButtons: { flexDirection: 'row', marginTop: 10, gap: 8 },
  acceptBtn: { backgroundColor: '#061D5A', paddingVertical: 8, paddingHorizontal: 12, borderRadius: 8, flex: 1, alignItems: 'center', flexDirection: 'row', justifyContent: 'center' },
  acceptBtnText: { color: '#ffffff', fontWeight: 'bold', fontSize: 13 },
  declineBtn: { backgroundColor: '#FEE2E2', paddingVertical: 8, paddingHorizontal: 12, borderRadius: 8, flex: 1, alignItems: 'center', flexDirection: 'row', justifyContent: 'center' },
  declineBtnText: { color: '#DC2626', fontWeight: 'bold', fontSize: 13 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(6,29,90,0.7)', justifyContent: 'center', alignItems: 'center', padding: 20 },
  modalContent: { backgroundColor: '#ffffff', borderRadius: 24, padding: 25, alignItems: 'center', width: '90%', shadowColor: '#000', shadowOpacity: 0.2, shadowRadius: 10, elevation: 10 },
  modalIconBox: { width: 60, height: 60, borderRadius: 30, justifyContent: 'center', alignItems: 'center', marginBottom: 15 },
  modalTitle: { fontSize: 18, fontWeight: 'bold', color: '#061D5A', marginBottom: 8 },
  modalText: { fontSize: 14, color: '#4B5563', textAlign: 'center', lineHeight: 20, marginBottom: 20 },
  modalButton: { backgroundColor: '#061D5A', paddingVertical: 12, paddingHorizontal: 30, borderRadius: 12, width: '100%', alignItems: 'center' },
  modalButtonText: { color: '#ffffff', fontWeight: 'bold' },
});

export default NotificationsScreen;
