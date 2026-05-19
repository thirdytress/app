import React, { useContext, useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, TouchableOpacity, ActivityIndicator, RefreshControl, Alert, Modal } from 'react-native';
import { Bell, User, Clock, Flame, MapPin, Fingerprint, AlertTriangle, CheckCircle2, UserCheck, Trophy, XCircle, ClipboardList, Calendar, X } from 'lucide-react-native';
import { AppContext } from '../context/AppContext'; // Assuming AppContext remains in context folder

const DashboardScreen = ({ navigation }: any) => {
  const context = useContext(AppContext);

  // Safety check: Ensure context is available
  if (!context || Object.keys(context).length === 0) {
    return (
      <SafeAreaView style={[styles.safeArea, { justifyContent: 'center', alignItems: 'center' }]}>
        <AlertTriangle size={48} color="#EF4444" />
        <Text style={{ color: '#061D5A', marginTop: 16, textAlign: 'center' }}>Error: App Context not initialized.</Text>
      </SafeAreaView>
    );
  }

  const {
    shifts = [],
    attendanceLogs = [],
    totalRequiredHours = 0,
    totalRenderedHours = 0,
    weeklyRenderedHours = 0,
    daysStreak = 0,
    activeShift = null,
    progressInfo = { progressPercent: 0, status: 'NOT_STARTED', renderedHours: 0, requiredHours: 128, isAtRisk: false, deficit: 0, expectedByNow: 0 },
    isLoading = false,
    userProfile,
    error = null,
    refreshData
  } = context;

  const [detailsModal, setDetailsModal] = useState<{ visible: boolean; log: any | null; shift: any | null }>({
    visible: false,
    log: null,
    shift: null
  });

  const pendingShifts = shifts.filter((s: any) => s.status === 'Pending');

  if (isLoading) {
    return (
      <SafeAreaView style={[styles.safeArea, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color="#F4B333" />
        <Text style={{ color: '#061D5A', marginTop: 16, fontSize: 14, fontWeight: '600' }}>Loading dashboard...</Text>
      </SafeAreaView>
    );
  }

  // Error state
  if (error) {
    return (
      <SafeAreaView style={[styles.safeArea, { justifyContent: 'center', alignItems: 'center', paddingHorizontal: 40 }]}>
        <AlertTriangle size={48} color="#EF4444" />
        <Text style={{ color: '#061D5A', marginTop: 16, fontSize: 16, fontWeight: 'bold', textAlign: 'center' }}>{error}</Text>
      </SafeAreaView>
    );
  }

  const hasTermGoal = (totalRequiredHours || 0) > 0;
  const progressPercentage = hasTermGoal ? Math.min(100, Math.round(progressInfo.progressPercent)) : 0;
  const remainingHours = hasTermGoal ? Math.max(0, totalRequiredHours - totalRenderedHours).toFixed(1).replace(/\.0$/, '') : '-';
  const tasksCompleted = attendanceLogs.length; // Simplified for demo
  const now = new Date();
  const todayIso = now.toISOString().split('T')[0];

  const activeLog = attendanceLogs.find((log: any) => log.date === todayIso && !log.checkOut);
  const isCheckedIn = !!activeLog;
  const isDutyComplete = attendanceLogs.some((log: any) => log.date === todayIso && log.status === 'Completed');

  // Logic to determine if user is late (checked in late OR hasn't checked in but 15+ mins past start)
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

  // Get upcoming shifts (Active status, excluding today's active shift)
  const upcomingShifts = shifts.filter((s: any) => s.id !== activeShift?.id && s.status === 'Active');

  // Combine attendance and shift actions for Recent Activity
  const combinedActivities = [
    ...attendanceLogs.map((log: any) => ({ ...log, activityType: 'attendance' })),
    ...shifts.filter((s: any) => s.status === 'Active' || s.status === 'Declined')
             .map((s: any) => ({ 
               ...s, 
               activityType: 'shift', 
               date: todayIso // In a real app, this should match the shift's specific date
             }))
  ].sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const showActivityDetails = (item: any) => {
    if (item.activityType === 'attendance') {
      const shift = shifts.find(s => s.id === item.shiftId);
      setDetailsModal({
        visible: true,
        log: item,
        shift: shift || null
      });
    } else {
      setDetailsModal({
        visible: true,
        log: null,
        shift: item
      });
    }
  };

  let progressBarColor = '#3B82F6'; // Default BLUE
  let progressMessage = 'Keep up the great work!';
  let progressText = `${progressInfo.renderedHours} / ${progressInfo.requiredHours}h`;
  let showTrophy = false;

  switch (progressInfo.status) {
    case 'NOT_STARTED':
      progressBarColor = '#3B82F6'; // BLUE
      progressText = `0 / ${progressInfo.requiredHours}h`;
      progressMessage = 'Semester has not started yet.';
      showTrophy = false;
      break;
    case 'AT_RISK':
      progressBarColor = '#EF4444'; // RED
      progressMessage = 'You need to catch up on hours.';
      showTrophy = false;
      break;
    case 'ON_TRACK':
      progressBarColor = '#3B82F6'; // BLUE
      progressMessage = 'Keep up the great work! \u2600\uFE0F';
      showTrophy = false;
      break;
    case 'NEARLY_DONE':
      progressBarColor = '#3B82F6'; // BLUE
      progressMessage = 'Almost there! Keep going \uD83D\uDCAA';
      showTrophy = false;
      break;
    case 'COMPLETED':
      progressBarColor = '#10B981'; // GREEN
      progressMessage = 'Duty hours completed! \uD83C\uDFC6';
      showTrophy = true;
      break;
    case 'SEMESTER_ENDED':
      progressBarColor = progressInfo.renderedHours >= progressInfo.requiredHours ? '#10B981' : '#EF4444';
      progressMessage = progressInfo.renderedHours >= progressInfo.requiredHours
        ? 'Term completed! \uD83C\uDFC6'
        : 'Semester ended. Hours incomplete.';
      showTrophy = progressInfo.renderedHours >= progressInfo.requiredHours;
      break;
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Header Section */}
      <View style={styles.header}>
        <View style={styles.headerTopRow}>
          <View>
            <Text style={styles.greeting}>WELCOME BACK!</Text>
            <Text style={styles.name}>{userProfile?.name || 'Student Assistant'}</Text>
            <Text style={styles.studentInfo}>{userProfile?.studentId || 'SAMS Dashboard'} • {userProfile?.campus || 'NU Lipa'}</Text>
          </View>
          <View style={styles.headerActions}>
            <TouchableOpacity 
              style={styles.iconBtn} 
              onPress={() => navigation.navigate('Notifications')}>
              <Bell size={20} color="#ffffff" />
              {pendingShifts.length > 0 && (
                <View style={styles.notifBadge}>
                  <Text style={styles.notifBadgeText}>{pendingShifts.length}</Text>
                </View>
              )}
            </TouchableOpacity>
            <TouchableOpacity style={styles.iconBtn} onPress={() => navigation.navigate('Profile')}>
              <User size={20} color="#ffffff" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Weekly Rendered Hours vs Scheduled (MAA-03 Spec) */}
        <View style={styles.weeklyCard}>
          <View style={styles.weeklyHeader}>
            <Text style={styles.weeklyTitle}>This Week's Progress</Text>
            <Clock size={20} color="#F4B333" />
          </View>
          <View style={styles.weeklyContent}>
            <Text style={styles.weeklyHoursLarge}>{weeklyRenderedHours}</Text>
            <Text style={styles.weeklyHoursTotal}> / {userProfile?.weeklyHoursGoal || 8} hrs</Text>
          </View>
          <View style={styles.weeklyProgressBarBg}>
            <View style={[styles.weeklyProgressBarFill, { width: `${Math.min(100, (weeklyRenderedHours / (userProfile?.weeklyHoursGoal || 8)) * 100)}%` }]} />
          </View>
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={isLoading} onRefresh={refreshData} tintColor="#F4B333" />
        }
      >
        {/* Pending Notifications (MAA-03 Spec) */}
        {pendingShifts.length > 0 && (
          <TouchableOpacity style={styles.notifBanner} onPress={() => navigation.navigate('Notifications')}>
            <View style={styles.notifIconContainerBanner}>
              <Bell size={20} color="#F4B333" />
            </View>
            <View style={styles.notifTextContainerBanner}>
              <Text style={styles.notifBannerTitle}>You have {pendingShifts.length} pending notification{pendingShifts.length > 1 ? 's' : ''}</Text>
              <Text style={styles.notifBannerSub}>Tap to view details</Text>
            </View>
          </TouchableOpacity>
        )}

        {/* SECTION 1: ACTIONABLE STATUS (Urgent/Immediate) */}
        {activeShift ? (() => {
          return (
            <View style={styles.upNextCard}>
              <View style={styles.upNextBadge}>
                <View style={{ flex: 1, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                  <View style={styles.statusIndicatorPill}>
                    <View style={[styles.statusDot, { backgroundColor: (isCheckedIn || isDutyComplete || isLate) ? '#10B981' : '#061D5A' }]} />
                    <Text style={styles.upNextBadgeText}>
                      {isCheckedIn ? 'CURRENTLY ON DUTY' : isDutyComplete ? 'DUTY COMPLETED' : 'TODAY\'S SCHEDULE'}
                    </Text>
                  </View>

                  {isLate && (
                    <View style={styles.lateBadgeCorner}>
                      <Clock size={12} color="#ffffff" style={{ marginRight: 4 }} />
                      <Text style={styles.lateBadgeText}>LATE</Text>
                    </View>
                  )}
                </View>
              </View>

              <Text style={[styles.todayTitle, (isCheckedIn || isLate) && { color: '#10B981' }]}>
                {isCheckedIn ? 'Active Session' : isDutyComplete ? 'Duty Complete' : (isLate ? 'On Duty' : 'Daily Shift')}
              </Text>

              <View style={styles.shiftDetailsContainer}>
                <View style={styles.shiftDetailRow}>
                  <Clock size={16} color="#061D5A" style={{ marginRight: 8 }} />
                  <Text style={styles.shiftText}>{activeShift.startTime} - {activeShift.endTime}</Text>
                </View>

                {(isCheckedIn && activeLog) && (
                  <View style={styles.shiftDetailRow}>
                    <CheckCircle2 size={16} color="#061D5A" style={{ marginRight: 8 }} />
                    <Text style={styles.shiftText}>Started at {activeLog.checkIn}</Text>
                  </View>
                )}

                <View style={styles.shiftDetailRow}>
                  <MapPin size={16} color="#061D5A" style={{ marginRight: 8 }} />
                  <Text style={styles.shiftText}>
                    {activeShift.office} (Maam Zai's Office)
                  </Text>
                </View>

                <View style={styles.shiftDetailRow}>
                  <UserCheck size={16} color="#061D5A" style={{ marginRight: 8 }} />
                  <Text style={styles.shiftText}>{activeShift.supervisorName || 'SDAO Supervisor'}</Text>
                </View>
              </View>

              {isDutyComplete ? (
                <View style={styles.completedActions}>
                  <View style={[styles.checkInButton, { backgroundColor: '#10B981', marginTop: 0 }]}>
                    <CheckCircle2 size={18} color="#ffffff" style={{ marginRight: 8 }} />
                    <Text style={styles.checkInButtonText}>Logged Successfully</Text>
                  </View>
                </View>
              ) : (
                <TouchableOpacity
                  style={styles.checkInButton}
                  onPress={() => navigation.navigate('Attendance')}
                >
                  <ClipboardList size={18} color="#ffffff" style={{ marginRight: 8 }} />
                  <Text style={styles.checkInButtonText}>
                    {isCheckedIn ? 'View Session Details' : 'View Attendance Status'}
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          );
        })() : (
          <View style={[styles.upNextCard, { backgroundColor: '#F1F5F9', shadowColor: 'transparent', borderWidth: 1, borderColor: '#E2E8F0' }]}>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 10 }}>
              <AlertTriangle size={18} color="#64748B" style={{ marginRight: 8 }} />
              <Text style={[styles.upNextBadgeText, { backgroundColor: '#E2E8F0' }]}>STATUS: UNDEPLOYED</Text>
            </View>
            <Text style={styles.todayTitle}>You are currently undeployed</Text>
            <Text style={[styles.shiftText, { color: '#64748B', lineHeight: 20 }]}>
              Wait for Ma'am Zai to deploy your duties and assignments.
            </Text>
          </View>
        )}

        {/* SECTION 2: PERFORMANCE OVERVIEW (Goal Tracking) */}
        <View style={[styles.sectionHeader, { marginTop: 20 }]}>
          <Text style={styles.sectionTitle}>Term Progress</Text>
          {showTrophy && <View style={styles.trophyIcon}><Trophy size={18} color="#F4B333" /></View>}
        </View>

        {/* At Risk Warning - Contextually placed near progress */}
        {/* {progressInfo.isAtRisk && (
          <View style={styles.atRiskCard}>
            <AlertTriangle size={20} color="#DC2626" style={{ marginRight: 12 }} />
            <View style={{ flex: 1 }}>
              <Text style={styles.atRiskTitle}>Behind Schedule</Text>
              <Text style={styles.atRiskText}>Action required: You have an absence or your weekly goal is unattainable.</Text>
            </View>
          </View>
        )} */}

        <View style={styles.progressCard}>
          <View style={styles.progressRow}>
            <View>
              <Text style={styles.progressValue}>{totalRenderedHours}{hasTermGoal ? <Text style={styles.progressTotal}>/ {totalRequiredHours}h</Text> : <Text style={styles.progressTotal}> total hours</Text>}</Text>
              <Text style={styles.sectionSubtitle}>{progressMessage}</Text>
            </View>
            {hasTermGoal && (
              <View style={styles.percentageBadge}>
                <Text style={styles.progressPercent}>{progressPercentage}%</Text>
              </View>
            )}
          </View>

          {hasTermGoal && (
            <View style={styles.progressBarContainer}>
              <View style={[styles.progressBarFill, { width: `${progressPercentage}%`, backgroundColor: progressBarColor }]} />
            </View>
          )}

          <View style={styles.progressStatsRow}>
            <View style={styles.progressStatItem}>
              <Text style={styles.progressStatValueBlue}>{hasTermGoal ? `${remainingHours}h` : '-'}</Text>
              <Text style={styles.progressStatLabel}>{hasTermGoal ? 'Remaining' : 'No term goal'}</Text>
            </View>
            <View style={styles.progressStatDivider} />
            <View style={styles.progressStatItem}>
              <Text style={styles.progressStatValueGold}>{tasksCompleted}</Text>
              <Text style={styles.progressStatLabel}>Duties</Text>
            </View>
          </View>
        </View>

        {/* SECTION 3: ATTENDANCE METRICS (Details) */}
        {isDutyComplete && (
          <View style={styles.successFeedbackBanner}>
            <CheckCircle2 size={18} color="#065F46" />
            <Text style={styles.successFeedbackText}>Great job! Your duty hours for today have been successfully logged.</Text>
          </View>
        )}

        {/* SECTION: UP NEXT */}
        {upcomingShifts.length > 0 && (
          <>
            <View style={[styles.sectionHeader, { marginTop: 10 }]}>
              <Text style={styles.sectionTitle}>Up Next</Text>
              <TouchableOpacity onPress={() => navigation.navigate('Schedule')}>
                <Text style={styles.viewAllText}>View Schedule</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.activityCard}>
              {upcomingShifts.slice(0, 2).map((shift, index) => (
                <React.Fragment key={shift.id}>
                  <View style={styles.activityItem}>
                    <View style={styles.activityIconBlue}><Calendar size={20} color="#3B82F6" /></View>
                    <View style={styles.activityTextContainer}>
                      <Text style={styles.activityDate}>{shift.day}</Text>
                      <Text style={styles.activityDesc}>{shift.startTime} - {shift.endTime} • {shift.office}</Text>
                    </View>
                  </View>
                  {index < Math.min(upcomingShifts.length - 1, 1) && <View style={styles.activityDivider} />}
                </React.Fragment>
              ))}
            </View>
          </>
        )}

        {/* SECTION 4: HISTORICAL DATA */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Recent Activity</Text>
          <TouchableOpacity onPress={() => navigation.navigate('Attendance')}>
            <Text style={styles.viewAllText}>View All</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.activityCard}>
          {combinedActivities.length > 0 ? combinedActivities.slice(0, 5).map((item: any, index: number) => {
            const isAttendance = item.activityType === 'attendance';
            return (
              <React.Fragment key={item.id}>
                <TouchableOpacity style={styles.activityItem} onPress={() => showActivityDetails(item)}>
                  <View style={styles.activityIconBlue}>
                    {isAttendance ? (
                      item.status === 'Completed' ? <CheckCircle2 size={20} color="#3B82F6" /> :
                      item.status === 'Late' ? <Clock size={20} color="#F59E0B" /> :
                      item.status === 'Absent' ? <XCircle size={20} color="#EF4444" /> :
                      <Clock size={20} color="#10B981" />
                    ) : (
                      item.status === 'Active' ? <Calendar size={20} color="#10B981" /> :
                      <XCircle size={20} color="#EF4444" />
                    )}
                  </View>
                  <View style={styles.activityTextContainer}>
                    <Text style={styles.activityDate}>
                      {isAttendance 
                        ? `${item.checkIn || '--:--'}`
                        : item.day}
                    </Text>
                    <Text style={styles.activityDesc}>
                      {isAttendance ? `${item.status}` : `Schedule ${item.status === 'Active' ? 'Approved' : 'Declined'}`}
                    </Text>
                  </View>
                </TouchableOpacity>
                {index < Math.min(combinedActivities.length - 1, 4) && <View style={styles.activityDivider} />}
              </React.Fragment>
            );
          }) : (
            <Text style={{ textAlign: 'center', color: '#9CA3AF' }}>No recent activity.</Text>
          )}
        </View>

        {/* Bottom Actions */}
        <View style={styles.bottomActionsRow}> 
          <TouchableOpacity style={styles.actionCard} onPress={() => navigation.navigate('Schedule')}>
            <View style={styles.actionCardIconBlue}><Calendar size={24} color="#3B82F6" /></View>
            <Text style={styles.actionCardTitle}>Full Schedule</Text>
            <Text style={styles.actionCardDesc}>View all shifts</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionCard} onPress={() => navigation.navigate('Profile')}>
            <View style={styles.actionCardIconGold}><User size={24} color="#F4B333" /></View>
            <Text style={styles.actionCardTitle}>My Profile</Text>
            <Text style={styles.actionCardDesc}>Account details</Text>
          </TouchableOpacity>
        </View>

        <View style={{ height: 30 }} />
      </ScrollView>

      {/* Log Details Modal */}
      <Modal visible={detailsModal.visible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { padding: 0, overflow: 'hidden' }]}>
            <View style={styles.detailsHeader}>
              <Text style={styles.detailsHeaderTitle}>
                {detailsModal.log ? 'Attendance Details' : 'Schedule Details'}
              </Text>
              <TouchableOpacity onPress={() => setDetailsModal({ ...detailsModal, visible: false })}>
                <X size={20} color="#061D5A" />
              </TouchableOpacity>
            </View>
            
            <View style={{ padding: 25 }}>
              <View style={styles.detailSection}>
                <Text style={styles.detailLabel}>DATE</Text>
                <Text style={styles.detailValue}>
                  {detailsModal.log 
                    ? new Date(detailsModal.log.date).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' }) 
                    : detailsModal.shift?.day || '--'}
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
                  <Text style={styles.detailLabel}>{detailsModal.log ? 'TIME IN' : 'START TIME'}</Text>
                  <Text style={styles.detailValue}>{detailsModal.log?.checkIn || detailsModal.shift?.startTime || '--:--'}</Text>
                </View>
                <View style={styles.detailSection}>
                  <Text style={styles.detailLabel}>{detailsModal.log ? 'TIME OUT' : 'END TIME'}</Text>
                  <Text style={styles.detailValue}>{detailsModal.log?.checkOut || detailsModal.shift?.endTime || (detailsModal.log ? 'Pending' : '--:--')}</Text>
                </View>
              </View>

              <View style={styles.detailGrid}>
                <View style={styles.detailSection}>
                  <Text style={styles.detailLabel}>STATUS</Text>
                  <View style={[
                    styles.statusBadgeSmall, 
                    { marginTop: 4 },
                (detailsModal.log?.status === 'Late' || detailsModal.shift?.status === 'Pending') && { backgroundColor: '#FFFBEB' },
                (detailsModal.log?.status === 'Absent' || detailsModal.shift?.status === 'Declined') && { backgroundColor: '#FEF2F2' }
                  ]}>
                    <Text style={[styles.statusTextSmall, 
                      (detailsModal.log?.status === 'Late' || detailsModal.shift?.status === 'Pending') && { color: '#F59E0B' }, 
                      (detailsModal.log?.status === 'Absent' || detailsModal.shift?.status === 'Declined') && { color: '#EF4444' }
                    ]}>
                  {detailsModal.log?.status || (detailsModal.shift?.status === 'Active' ? 'Approved' : detailsModal.shift?.status) || '--'}
                    </Text>
                  </View>
                </View>
                {detailsModal.log && <View style={styles.detailSection}>
                  <Text style={styles.detailLabel}>HOURS RENDERED</Text>
                  <Text style={[styles.detailValue, { color: '#F4B333', fontSize: 24 }]}>{detailsModal.log?.hoursRendered || '0'}h</Text>
                </View>}
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
    backgroundColor: '#F8FAFC',
  },
  header: {
    backgroundColor: '#061D5A',
    paddingHorizontal: 20,
    paddingTop: 15,
    paddingBottom: 25,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
  },
  headerTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  greeting: {
    color: '#93C5FD',
    fontSize: 10,
    fontWeight: 'bold',
    letterSpacing: 1,
    marginBottom: 4,
  },
  name: {
    color: '#ffffff',
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  studentInfo: {
    color: '#DBEAFE',
    fontSize: 12,
  },
  headerActions: {
    flexDirection: 'row',
    gap: 10,
  },
  notifBadge: {
    position: 'absolute',
    top: -2,
    right: -2,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#EF4444',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 2,
    borderWidth: 1.5,
    borderColor: '#061D5A',
    zIndex: 1,
  },
  notifBadgeText: {
    color: '#ffffff',
    fontSize: 9,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  iconBtn: {
    width: 36,
    height: 36,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  weeklyCard: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  weeklyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  weeklyTitle: {
    color: '#93C5FD',
    fontSize: 14,
    fontWeight: '600',
  },
  weeklyContent: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 15,
  },
  weeklyHoursLarge: {
    color: '#ffffff',
    fontSize: 40,
    fontWeight: '900',
  },
  weeklyHoursTotal: {
    color: '#D1D5DB',
    fontSize: 18,
    fontWeight: '600',
  },
  weeklyProgressBarBg: {
    height: 8,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 4,
  },
  weeklyProgressBarFill: {
    height: 8,
    backgroundColor: '#F4B333',
    borderRadius: 4,
  },
  notifBanner: {
    backgroundColor: '#ffffff',
    marginHorizontal: 20,
    marginTop: 15,
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 3,
    borderLeftWidth: 4,
    borderLeftColor: '#F4B333',
  },
  notifIconContainerBanner: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFFBEB',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  notifTextContainerBanner: {
    flex: 1,
  },
  notifBannerTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#061D5A',
  },
  notifBannerSub: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  scrollView: {
    flex: 1,
    marginTop: -15, // Overlap the curved header
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 10,
  },
  upNextCard: {
    backgroundColor: '#F4B333',
    borderRadius: 20,
    padding: 18,
    marginHorizontal: 20,
    marginTop: 15,
    marginBottom: 20,
    shadowColor: '#F4B333',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  upNextBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  upNextBadgeText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#061D5A',
    backgroundColor: 'rgba(255,255,255,0.5)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
    marginRight: 8,
    overflow: 'hidden',
  },
  statusIndicatorPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(6, 29, 90, 0.05)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 6,
  },
  upNextBadgeTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#061D5A',
  },
  shiftDetailsContainer: {
    marginBottom: 10,
  },
  todayTitle: {
    fontSize: 24,
    fontWeight: '900',
    color: '#061D5A',
    marginBottom: 12,
  },
  shiftDetailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  shiftIcon: {
    fontSize: 16,
    marginRight: 8,
  },
  shiftText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#061D5A',
  },
  checkInButton: {
    backgroundColor: '#061D5A',
    flexDirection: 'row',
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 15,
  },
  checkInButtonIcon: {
    fontSize: 18,
    marginRight: 8,
  },
  checkInButtonText: {
    color: '#ffffff',
    fontWeight: 'bold',
    fontSize: 14,
  },
  completedActions: {},
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: '#061D5A',
  },
  sectionSubtitle: {
    fontSize: 11,
    color: '#6B7280',
    marginTop: 2,
  },
  trophyIcon: {
    width: 32,
    height: 32,
    backgroundColor: '#FFF8E7',
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  viewAllText: {
    color: '#3B82F6',
    fontSize: 12,
    fontWeight: '600',
  },
  progressCard: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 20,
    marginBottom: 25,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 2,
  },
  progressRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginBottom: 10,
  },
  percentageBadge: {
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  progressValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#061D5A',
  },
  progressTotal: {
    fontSize: 14,
    color: '#9CA3AF',
    fontWeight: 'normal',
  },
  progressPercent: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#10B981',
  },
  progressBarContainer: {
    height: 8,
    backgroundColor: '#E5E7EB',
    borderRadius: 4,
    marginBottom: 20,
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#3B82F6',
    borderRadius: 4,
  },
  progressStatsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  progressStatItem: {
    alignItems: 'center',
    flex: 1,
  },
  progressStatDivider: {
    width: 1,
    height: 30,
    backgroundColor: '#E5E7EB',
  },
  progressStatValueBlue: { fontSize: 18, fontWeight: 'bold', color: '#061D5A' },
  progressStatValueGold: { fontSize: 18, fontWeight: 'bold', color: '#F4B333' },
  progressStatValueGreen: { fontSize: 18, fontWeight: 'bold', color: '#10B981' },
  progressStatLabel: {
    fontSize: 10,
    color: '#6B7280',
    marginTop: 4,
  },
  activityCard: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 2,
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  activityIconBlue: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#EBF0FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  activityTextContainer: {
    flex: 1,
  },
  activityDate: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#061D5A',
  },
  activityDesc: {
    fontSize: 12,
    color: '#6B7280',
  },
  activityDuration: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#F4B333',
  },
  activityDivider: {
    height: 1,
    backgroundColor: '#F3F4F6',
    marginVertical: 12,
    marginLeft: 48,
  },
  bottomActionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 15,
  },
  actionCard: {
    flex: 1,
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 15,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  actionCardIconBlue: {
    width: 44,
    height: 44,
    backgroundColor: '#EBF0FF',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  actionCardIconGold: {
    width: 44,
    height: 44,
    backgroundColor: '#FFF8E7',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  actionCardTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#061D5A',
    marginBottom: 4,
  },
  actionCardDesc: {
    fontSize: 10,
    color: '#6B7280',
  },
  atRiskCard: {
    backgroundColor: '#FEF2F2',
    borderColor: '#FEE2E2',
    borderWidth: 1,
    borderRadius: 16,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  atRiskTitle: {
    fontSize: 14,
    fontWeight: '900',
    color: '#991B1B',
    marginBottom: 2,
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
  atRiskText: {
    fontSize: 12,
    color: '#B91C1C',
    lineHeight: 18,
  },
  successFeedbackBanner: {
    flexDirection: 'row',
    backgroundColor: '#D1FAE5',
    padding: 12,
    borderRadius: 16,
    marginBottom: 20,
    alignItems: 'center',
    borderColor: '#A7F3D0',
    borderWidth: 1,
  },
  successFeedbackText: { color: '#065F46', fontSize: 12, fontWeight: '600', marginLeft: 8, flex: 1 },
  countsGridContainer: { marginBottom: 30 },
  countsGrid: { flexDirection: 'row', justifyContent: 'space-between', gap: 10 },
  countCard: { flex: 1, backgroundColor: '#ffffff', borderRadius: 20, padding: 12, alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 5, elevation: 2 },
  countIconBox: { width: 28, height: 28, borderRadius: 14, justifyContent: 'center', alignItems: 'center', marginBottom: 8 },
  countValue: { fontSize: 16, fontWeight: '900', color: '#061D5A' },
  countLabel: { fontSize: 10, color: '#64748B', fontWeight: '600', marginTop: 2 },
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
  statusBadgeSmall: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  statusTextSmall: {
    color: '#10B981',
    fontSize: 10,
    fontWeight: 'bold',
  },
  notifContainer: {
    marginBottom: 20,
  },
  notifCard: {
    flexDirection: 'row',
    backgroundColor: '#ffffff',
    padding: 15,
    borderRadius: 16,
    marginTop: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  notifIconBox: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  notifTextContainer: {
    flex: 1,
  },
  notifTitle: { fontSize: 14, fontWeight: 'bold', color: '#111827', marginBottom: 2 },
  notifDesc: { fontSize: 12, color: '#4B5563', marginBottom: 10 },
  notifActionButtons: { flexDirection: 'row', gap: 8 },
  notifAcceptBtn: {
    backgroundColor: '#061D5A',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
  },
  notifAcceptBtnText: { color: '#ffffff', fontWeight: 'bold', fontSize: 12 },
  notifDeclineBtn: {
    backgroundColor: '#FEE2E2',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
  },
  notifDeclineBtnText: { color: '#DC2626', fontWeight: 'bold', fontSize: 12 },
});

export default DashboardScreen;
