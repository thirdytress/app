import React, { createContext, useState, useEffect, useCallback } from 'react';
import { Alert, Platform } from 'react-native';
// import * as samsService from '../services/samsService'; // Temporarily commented out as per previous instructions
import { Shift, AttendanceLog, ProgressInfo, EvaluationScores, ApplicationFormState } from '../types';

interface UserProfile {
  name: string;
  studentId: string;
  program: string;
  email: string;
  phone: string;
  campus: string;
  weeklyHoursGoal: number; // MAA-03: Derived from application form selection
}

interface AppContextProps {
  shifts: Shift[];
  attendanceLogs: AttendanceLog[];
  totalRequiredHours: number;
  totalRenderedHours: number;
  weeklyRenderedHours: number;
  dailyTargetHours: number;
  todayRenderedHours: number;
  daysStreak: number;
  attendanceCounts: { present: number; late: number; absent: number; total: number };
  progressInfo: ProgressInfo;
  activeShift: Shift | null;
  accountStatus: 'ACTIVE' | 'PENDING' | 'REJECTED';
  userProfile: UserProfile;
  evaluation: EvaluationScores;
  isLoading: boolean;
  error: string | null;
  updateShiftStatus: (shiftId: string, status: Shift['status']) => void;
  refreshData: () => Promise<void>;
  checkIn: (shiftId: string, method: 'fingerprint') => boolean;
  checkOut: (logId: string, method: 'fingerprint') => boolean;
  updateProfile: (data: Partial<UserProfile>) => void;
  applicationForm: ApplicationFormState;
  updateApplicationForm: (data: Partial<ApplicationFormState>) => void;
  resetGoalsAndSchedule: (opts?: { weeklyGoal?: number; startDate?: string; weeks?: number }) => void;
}

export const AppContext = createContext<AppContextProps>({} as AppContextProps);

export const AppProvider = ({ children }: { children: React.ReactNode }) => {
  // Logic: Weekly goal depends on user's application. Term is configurable (default 16 weeks).
  const WEEKS_PER_SEMESTER = 16;
  const [weeklyGoal, setWeeklyGoal] = useState(8); // baseline weekly hours

  // Semester dates and required hours as state so they can be reset
  const today = new Date();
  const [semesterStartDate, setSemesterStartDate] = useState<Date>(new Date(today.getFullYear(), today.getMonth(), today.getDate()));
  const [semesterEndDate, setSemesterEndDate] = useState<Date>(new Date(today.getFullYear(), today.getMonth(), today.getDate() + (WEEKS_PER_SEMESTER * 7)));
  // Default to 0 (no term cap). When >0, UI will treat it as a goal cap.
  const [totalRequiredHours, setTotalRequiredHours] = useState<number>(0);

  // MAA-07: User Profile State
  const [userProfile, setUserProfile] = useState<UserProfile>({
    name: 'Student Assistant',
    studentId: '2024-00001',
    program: 'BS Information Technology',
    email: 'user@example.com',
    phone: '+63 912 345 6789',
    campus: 'NU Lipa',
    weeklyHoursGoal: 8,
  });

  const [accountStatus, setAccountStatus] = useState<'ACTIVE' | 'PENDING' | 'REJECTED'>('ACTIVE');
  const [shifts, setShifts] = useState<Shift[]>([]);

  // Helper for MAA-06: Relative dates for attendance logs
  const getRelDate = (daysAgo: number) => {
    const d = new Date();
    d.setDate(d.getDate() - daysAgo);
    return d.toISOString().split('T')[0];
  };

  const [attendanceLogs, setAttendanceLogs] = useState<AttendanceLog[]>([]);

  const [studentId, setStudentId] = useState<string | null>('mock-student-uuid-123');

  const [evaluation] = useState<EvaluationScores>({
    punctuality: 4.5,
    workQuality: 4.8,
    attitude: 5.0,
    attendance: 4.2,
    productivity: 4.6,
    comments: "No evaluation recorded yet.",
  });

  const [activeShift, setActiveShift] = useState<Shift | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // MAA-03 Application Form State (Fix #10)
  const [applicationForm, setApplicationForm] = useState<ApplicationFormState>({
    firstName: '',
    lastName: '',
    studentId: '',
    degreeProgram: '',
    yearLevel: '',
    phoneNumber: '',
    email: '',
    gwa: '',
    term: '',
    skillsExperience: '',
    availability: { Monday: { morning: false, afternoon: false }, Tuesday: { morning: false, afternoon: false }, Wednesday: { morning: false, afternoon: false }, Thursday: { morning: false, afternoon: false }, Friday: { morning: false, afternoon: false } },
    corFile: null, gradesFile: null, otherDocs: null,
  });

  // No automatic required-hours cap by default. Use `resetGoalsAndSchedule` to set term caps if desired.

  const loadDashboard = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // For testing, directly set studentId and accountStatus
      // In a real application, these would be fetched after authentication.
      setStudentId('mock-student-uuid-123');
      setAccountStatus('ACTIVE');
      
      // The shifts and attendanceLogs are already initialized in useState with mock data.
      // We don't need to fetch them from samsService for this testing scenario.
      // If `refreshData` is called, it will re-evaluate the active shift based on the current `shifts` state.

      // Determine active shift for today based on the mock shifts
      const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
      const todayDay = days[new Date().getDay()];
      const foundShift = shifts.find((shift: Shift) => shift.day === todayDay);
      setActiveShift(foundShift || null);

      // No need for an else block as we are directly setting mock data.
      // The previous else block was for when profile was not found, which is now bypassed.
      // If we were to re-enable fetching, this block would be relevant again.
      // else {
      //   setStudentId(null);
      //   setAttendanceLogs([]);
      //   setShifts([]);
      // }

    } catch (err) {
      console.error('Dashboard load failed:', err);
      setError('Failed to load dashboard. Please try again.');
      // No need to re-throw if we are mocking data and bypassing service calls.
      // throw err; // Re-throw so LoginScreen catches the failure
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadDashboard();
  }, []); // Empty dependency array means this runs once on mount

  // This useEffect will now correctly react to changes in the `shifts` state,
  // which is initialized with mock data.
  useEffect(() => {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const todayDay = days[new Date().getDay()];
    const foundShift = shifts.find(shift => shift.day === todayDay);
    setActiveShift(foundShift || null);
  }, [shifts]); // Re-run if shifts change (e.g., via updateShiftStatus)

  // Compute total rendered hours from actual check-in/check-out timestamps
  const computeRenderedHours = (records: AttendanceLog[]): number => {
    let totalMinutes = 0;
    records.forEach(record => {
      if (record.status === 'Absent') return;
      if (!record.checkIn || !record.checkOut) return;
      const timeIn = new Date(`${record.date}T${record.checkIn}`);
      const timeOut = new Date(`${record.date}T${record.checkOut}`);
      const minutesRendered = (timeOut.getTime() - timeIn.getTime()) / (1000 * 60);
      if (minutesRendered <= 0) return;
      totalMinutes += minutesRendered;
    });
    return parseFloat((totalMinutes / 60).toFixed(2));
  };

  const totalRenderedHours = computeRenderedHours(attendanceLogs);

  // Logic for Weekly Progress and At Risk Flagging
  const getWeeklyStats = () => {
    const now = new Date();
    const dayOfWeek = now.getDay(); // 0 is Sunday
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1)); // Set to Monday
    startOfWeek.setHours(0, 0, 0, 0);

    const weeklyLogs = attendanceLogs.filter(log => new Date(log.date) >= startOfWeek);
    const renderedThisWeek = computeRenderedHours(weeklyLogs);
    
    // Check for any absences in the entire term
    const hasAbsences = attendanceLogs.some(log => log.status === 'Absent');
    
    // Check if goal is still reachable this week
    // Logic: If today is late in the week (e.g., Friday/Saturday) and progress is low
    const dayOfSem = Math.floor((now.getTime() - startOfWeek.getTime()) / (1000 * 60 * 60 * 24));
    const remainingDaysInWeek = 6 - dayOfSem;
    
    // Mock check: If we need more hours than possible in remaining days (max 8h/day)
    const needed = weeklyGoal - renderedThisWeek;
    const isUnattainable = needed > (remainingDaysInWeek + 1) * 8; 

    return {
      renderedThisWeek,
      isAtRisk: hasAbsences || isUnattainable,
      status: now > semesterEndDate ? 'SEMESTER_ENDED' : now < semesterStartDate ? 'NOT_STARTED' : 'IN_PROGRESS'
    };
  };

  const { renderedThisWeek, isAtRisk, status } = getWeeklyStats();

  const checkAtRiskStatus = (): ProgressInfo => {
    // If there is no term cap (totalRequiredHours <= 0) we don't compute percent-based progress.
    if (totalRequiredHours <= 0) {
      // Keep tracking rendered hours but mark status as IN_PROGRESS when term active
      if (status === 'NOT_STARTED') {
        return { isAtRisk: false, status: 'NOT_STARTED', progressPercent: 0, renderedHours: totalRenderedHours, requiredHours: totalRequiredHours, expectedByNow: 0, deficit: 0 };
      }
      return { isAtRisk: false, status: 'IN_PROGRESS', progressPercent: 0, renderedHours: totalRenderedHours, requiredHours: totalRequiredHours, expectedByNow: 0, deficit: 0 };
    }

    const progressPercent = parseFloat(((totalRenderedHours / totalRequiredHours) * 100).toFixed(2));

    if (status === 'NOT_STARTED') {
      return { isAtRisk: false, status: 'NOT_STARTED', progressPercent: 0, renderedHours: totalRenderedHours, requiredHours: totalRequiredHours, expectedByNow: 0, deficit: 0 };
    }
    if (totalRenderedHours >= totalRequiredHours) {
      return { isAtRisk: false, status: 'COMPLETED', progressPercent: 100, renderedHours: totalRenderedHours, requiredHours: totalRequiredHours, expectedByNow: totalRequiredHours, deficit: 0 };
    }
    if (status === 'SEMESTER_ENDED') {
      return { isAtRisk: totalRenderedHours < totalRequiredHours, status: 'SEMESTER_ENDED', progressPercent, renderedHours: totalRenderedHours, requiredHours: totalRequiredHours, expectedByNow: totalRequiredHours, deficit: totalRequiredHours - totalRenderedHours };
    }

    // Flagging happens only on Absence or unreachable Weekly Goal
    if (isAtRisk) {
      return { isAtRisk: true, status: 'AT_RISK', progressPercent, renderedHours: totalRenderedHours, requiredHours: totalRequiredHours, expectedByNow: 0, deficit: 0 };
    }

    if (progressPercent >= 80) {
      return { isAtRisk: false, status: 'NEARLY_DONE', progressPercent, renderedHours: totalRenderedHours, requiredHours: totalRequiredHours, expectedByNow: 0, deficit: 0 };
    }
    return { isAtRisk: false, status: 'ON_TRACK', progressPercent, renderedHours: totalRenderedHours, requiredHours: totalRequiredHours, expectedByNow: 0, deficit: 0 };
  };

  const progressInfo = checkAtRiskStatus();

  // Logic for MAA-04: Calculate streak based on consecutive completed/late logs
  const sortedLogs = [...attendanceLogs].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  let streak = 0;
  for (const log of sortedLogs) {
    if (log.status === 'Completed' || log.status === 'Late' || log.status === 'Active') streak++;
    else if (log.status === 'Absent') break;
  }

  const attendanceCounts = attendanceLogs.reduce(
    (acc, log) => {
      if (log.status === 'Completed') acc.present++;
      if (log.status === 'Late') acc.late++;
      if (log.status === 'Absent') acc.absent++;
      return acc;
    },
    { present: 0, late: 0, absent: 0, total: 0 }
  );
  attendanceCounts.total = attendanceLogs.length; // Correctly count all logs

  const remainingHours = Math.max(0, totalRequiredHours - totalRenderedHours);
  const remainingDays = Math.max(1, Math.ceil((semesterEndDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)));
  const dailyTargetHours = parseFloat((remainingHours / remainingDays).toFixed(2));

  const todayIso = new Date().toISOString().split('T')[0];
  const todayRenderedHours = parseFloat(
    (attendanceLogs
      .filter(log => log.date === todayIso && log.status !== 'Absent' && log.checkIn && log.checkOut)
      .reduce((sum, log) => {
        const timeIn = new Date(`${log.date}T${log.checkIn}`);
        const timeOut = new Date(`${log.date}T${log.checkOut}`);
        const mins = (timeOut.getTime() - timeIn.getTime()) / (1000 * 60);
        return sum + (mins > 0 ? mins : 0);
      }, 0) / 60
    ).toFixed(2)
  );

  const validateAuth = (method: 'fingerprint') => {
    if (method === 'fingerprint') {
      return true; // Mock fingerprint validation success
    }
    return false;
  };

  const updateShiftStatus = async (shiftId: string, status: Shift['status']) => {
    try {
      // Mock update for testing
      setShifts(prev => prev.map(s => s.id === shiftId ? { ...s, status } : s));
      // In a real app: await samsService.updateShiftStatus(shiftId, status);
    } catch (err) {
      Alert.alert('Error', 'Failed to update shift status.');
    }
  };

  const checkIn = useCallback((shiftId: string, method: 'fingerprint') => {
    if (!validateAuth(method)) return false;
    if (!studentId) return false;

    const now = new Date();
    const dateStr = now.toISOString().split('T')[0];
    const timeStr = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
    const shift = shifts.find(s => s.id === shiftId);
    let status: 'Active' | 'Late' = 'Active';

    if (shift) {
      const [sh, sm] = shift.startTime.split(':').map(Number);
      const shiftStartTotalMinutes = sh * 60 + sm;
      const currentTotalMinutes = now.getHours() * 60 + now.getMinutes();

      // Flag as Late if checking in 15 minutes or more after shift start
      if (currentTotalMinutes >= shiftStartTotalMinutes + 15) {
        status = 'Late';
      }
    }

    // Mock check-in
    // samsService.insertCheckIn(studentId, shiftId, dateStr, timeStr, status)
    //   .then(() => loadDashboard())
    //   .catch(() => Alert.alert('Sync Error', 'Check-in recorded locally but failed to sync with server.'));

    // Optimistic update for UI responsiveness
    const localLog: AttendanceLog = { id: `temp_${Date.now()}`, date: dateStr, checkIn: timeStr, checkOut: null, hoursRendered: 0, status };
    setAttendanceLogs([localLog, ...attendanceLogs]);
    
    // Re-evaluate dashboard state after check-in
    loadDashboard();

    return true;
  }, [studentId, shifts, attendanceLogs, loadDashboard]); // Added dependencies for useCallback

  const checkOut = useCallback((logId: string, method: 'fingerprint') => {
    if (!validateAuth(method)) return false;

    setAttendanceLogs(logs => logs.map(log => {
      if (log.id === logId) {
        const now = new Date(); // Define now here for checkOut
        const outH = now.getHours();
        const outM = now.getMinutes();
        const checkOutTime = `${outH.toString().padStart(2, '0')}:${outM.toString().padStart(2, '0')}`;

        // Compute hours from actual check-in to check-out
        const [inH, inM] = log.checkIn.split(':').map(Number);
        const minutesRendered = (outH * 60 + outM) - (inH * 60 + inM);
        const totalHours = minutesRendered > 0 ? parseFloat((minutesRendered / 60).toFixed(2)) : 0;

        // Mock update
        // samsService.updateCheckOut(logId, checkOutTime, totalHours)
        //   .catch(() => console.error('Sync checkout failed'));

        return { ...log, checkOut: checkOutTime, hoursRendered: totalHours, status: 'Completed' as const };
      }
      return log;
    }));

    loadDashboard();
    return true;
  }, [attendanceLogs, loadDashboard]); // Added dependencies for useCallback

  // MAA-07: Logic for limited profile editing
  const updateProfile = (data: Partial<UserProfile>) => {
    setUserProfile(prev => ({ ...prev, ...data }));
    if (data.weeklyHoursGoal) setWeeklyGoal(data.weeklyHoursGoal);
  };

  const resetGoalsAndSchedule = (opts?: { weeklyGoal?: number; startDate?: string; weeks?: number }) => {
    const newWeekly = opts?.weeklyGoal ?? 8;
    const weeks = opts?.weeks ?? WEEKS_PER_SEMESTER;
    const start = opts?.startDate ? new Date(opts.startDate) : new Date();

    setWeeklyGoal(newWeekly);
    setUserProfile(prev => ({ ...prev, weeklyHoursGoal: newWeekly }));
    setSemesterStartDate(new Date(start.getFullYear(), start.getMonth(), start.getDate()));
    setSemesterEndDate(new Date(start.getFullYear(), start.getMonth(), start.getDate() + (weeks * 7)));
    setTotalRequiredHours(newWeekly * weeks);

    // Clear existing schedule and logs
    setShifts([]);
    setAttendanceLogs([]);
  };

  // Update application form state (Fix #10)
  const updateApplicationForm = (data: Partial<ApplicationFormState>) => {
    setApplicationForm(prev => ({ ...prev, ...data }));
  };

  return (
    <AppContext.Provider value={{
      shifts,
      attendanceLogs,
      totalRequiredHours,
      totalRenderedHours,
      weeklyRenderedHours: renderedThisWeek,
      dailyTargetHours,
      todayRenderedHours,
      daysStreak: streak,
      attendanceCounts,
      progressInfo,
      activeShift,
      accountStatus,
      userProfile,
      evaluation,
      isLoading,
      error,
      updateShiftStatus,
      refreshData: loadDashboard,
      checkIn,
      checkOut,
      updateProfile,
      resetGoalsAndSchedule,
      applicationForm,
      updateApplicationForm,
    }}>
      {children}
    </AppContext.Provider>
  );
};
