/**
 * SAMS PHP API Service Layer
 * Handles all communication with the PHP backend
 */

import { apiCall, setAuthToken, clearAuthToken } from '../lib/supabase';
import { AttendanceLog, Shift, EvaluationScores } from '../types';

// ─── AUTH ────────────────────────────────────────────────────────────────────

/**
 * Sign in with email and password
 * Expected PHP endpoint: POST /auth/login
 */
export const signIn = async (email: string, password: string) => {
  try {
    const response = await apiCall('auth/login', 'POST', { email, password });
    
    // Store auth token if provided
    if (response.token) {
      setAuthToken(response.token);
    }
    
    return response;
  } catch (error) {
    console.error('Sign in failed:', error);
    throw error;
  }
};

/**
 * Sign out and clear auth token
 * Expected PHP endpoint: POST /auth/logout
 */
export const signOut = async () => {
  try {
    await apiCall('auth/logout', 'POST');
    clearAuthToken();
  } catch (error) {
    console.error('Sign out failed:', error);
    throw error;
  }
};

/**
 * Get current logged-in user
 * Expected PHP endpoint: GET /auth/me
 */
export const getCurrentUser = async () => {
  try {
    const response = await apiCall('auth/me', 'GET');
    return response.user || null;
  } catch (error) {
    console.error('Get current user failed:', error);
    return null;
  }
};

// ─── STUDENT ─────────────────────────────────────────────────────────────────

/**
 * Fetch student profile
 * Expected PHP endpoint: GET /students/{studentId}
 */
export const fetchStudentProfile = async (studentId: string) => {
  try {
    const response = await apiCall(`students/${studentId}`, 'GET');
    return response.data || null;
  } catch (error) {
    console.error('Fetch student profile failed:', error);
    return null;
  }
};

// ─── EVALUATION ───────────────────────────────────────────────────────────────

/**
 * Fetch evaluation scores for a student
 * Expected PHP endpoint: GET /evaluations/{studentId}
 */
export const fetchEvaluation = async (studentId: string): Promise<EvaluationScores | null> => {
  try {
    const response = await apiCall(`evaluations/${studentId}`, 'GET');
    
    // Return evaluation data or default empty scores
    if (response.data) {
      return response.data;
    }
    
    return {
      punctuality: 0,
      workQuality: 0,
      attitude: 0,
      attendance: 0,
      productivity: 0,
      comments: '',
    };
  } catch (error) {
    console.error('Fetch evaluation failed:', error);
    return {
      punctuality: 0,
      workQuality: 0,
      attitude: 0,
      attendance: 0,
      productivity: 0,
      comments: 'Error loading evaluation',
    };
  }
};

// ─── TERM ─────────────────────────────────────────────────────────────────────

/**
 * Fetch current academic term
 * Expected PHP endpoint: GET /terms/current
 */
export const fetchCurrentTerm = async () => {
  try {
    const response = await apiCall('terms/current', 'GET');
    return response.data || null;
  } catch (error) {
    console.error('Fetch current term failed:', error);
    return null;
  }
};

// ─── SHIFTS ───────────────────────────────────────────────────────────────────

/**
 * Fetch all shifts for a student
 * Expected PHP endpoint: GET /shifts?student_id={studentId}
 */
export const fetchShifts = async (studentId: string): Promise<Shift[]> => {
  try {
    const response = await apiCall(`shifts?student_id=${studentId}`, 'GET');
    
    const shifts = response.data || [];
    
    return shifts.map((row: any) => ({
      id: row.id,
      day: row.day,
      startTime: row.start_time ? String(row.start_time).slice(0, 5) : '00:00',
      endTime: row.end_time ? String(row.end_time).slice(0, 5) : '00:00',
      office: row.office,
      status: row.status,
      supervisorName: row.supervisor_name,
    }));
  } catch (error) {
    console.error('Fetch shifts failed:', error);
    return [];
  }
};

/**
 * Update shift status
 * Expected PHP endpoint: PUT /shifts/{shiftId}
 */
export const updateShiftStatus = async (
  shiftId: string,
  status: 'Pending' | 'Active' | 'Declined' | 'Completed'
) => {
  try {
    await apiCall(`shifts/${shiftId}`, 'PUT', { status });
  } catch (error) {
    console.error('Update shift status failed:', error);
    throw error;
  }
};

// ─── ATTENDANCE ───────────────────────────────────────────────────────────────

/**
 * Fetch attendance logs for a student
 * Expected PHP endpoint: GET /attendance?student_id={studentId}
 */
export const fetchAttendanceLogs = async (studentId: string): Promise<AttendanceLog[]> => {
  try {
    const response = await apiCall(`attendance?student_id=${studentId}`, 'GET');
    
    const logs = response.data || [];
    
    return logs.map((row: any) => ({
      id: row.id,
      date: row.date,
      shiftId: row.shift_id,
      checkIn: row.check_in ? String(row.check_in).slice(0, 5) : '--:--',
      checkOut: row.check_out ? String(row.check_out).slice(0, 5) : '--:--',
      hoursRendered: parseFloat(row.hours_rendered ?? 0),
      status: row.status,
    }));
  } catch (error) {
    console.error('Fetch attendance logs failed:', error);
    return [];
  }
};

/**
 * Insert check-in record
 * Expected PHP endpoint: POST /attendance/checkin
 */
export const insertCheckIn = async (
  studentId: string,
  shiftId: string,
  date: string,
  checkIn: string,
  status: 'Active' | 'Late'
): Promise<string> => {
  try {
    const response = await apiCall('attendance/checkin', 'POST', {
      student_id: studentId,
      shift_id: shiftId,
      date,
      check_in: checkIn,
      status,
    });
    
    if (response.id) {
      return response.id;
    }
    
    throw new Error('No attendance log ID returned');
  } catch (error) {
    console.error('Insert check-in failed:', error);
    throw error;
  }
};

/**
 * Update check-out record
 * Expected PHP endpoint: PUT /attendance/{logId}/checkout
 */
export const updateCheckOut = async (
  logId: string,
  checkOut: string,
  hoursRendered: number
) => {
  try {
    await apiCall(`attendance/${logId}/checkout`, 'PUT', {
      check_out: checkOut,
      hours_rendered: hoursRendered,
      status: 'Completed',
    });
  } catch (error) {
    console.error('Update check-out failed:', error);
    throw error;
  }
};

// ─── APPLICATION ──────────────────────────────────────────────────────────────

/**
 * Submit application
 * Expected PHP endpoint: POST /applications
 */
export const submitApplication = async (payload: {
  name: string;
  student_id_number: string;
  email: string;
  course: string;
  gwa: number;
  campus: string;
}) => {
  try {
    const response = await apiCall('applications', 'POST', {
      ...payload,
      status: 'Pending',
    });
    
    return response || null;
  } catch (error) {
    console.error('Submit application failed:', error);
    throw error;
  }
};
