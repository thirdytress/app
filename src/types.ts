export interface Shift {
  id: string;
  day: string;
  startTime: string;
  endTime: string;
  office: string;
  status: 'Pending' | 'Active' | 'Declined' | 'Completed';
  supervisorName?: string; // Optional, for display
}

export interface AttendanceLog {
  id: string;
  date: string;
  shiftId?: string; // Optional, if a log isn't tied to a specific shift
  checkIn: string;
  checkOut: string | null;
  hoursRendered: number;
  status: 'Active' | 'Late' | 'Completed' | 'Absent';
}

export interface ProgressInfo {
  progressPercent: number;
  status: 'NOT_STARTED' | 'AT_RISK' | 'ON_TRACK' | 'NEARLY_DONE' | 'COMPLETED' | 'SEMESTER_ENDED' | 'IN_PROGRESS';
  renderedHours: number;
  requiredHours: number;
  isAtRisk: boolean;
  deficit: number;
  expectedByNow: number;
}

export interface EvaluationScores {
  punctuality: number;
  workQuality: number;
  attitude: number;
  attendance: number;
  productivity: number;
  comments: string;
}

// Application Form Types
export type DegreeProgram = 'BSIT' | 'BSCS' | 'BSCpE' | 'BSIS' | 'BSEMC' | 'Other';
export type YearLevel = '1st Year' | '2nd Year' | '3rd Year' | '4th Year' | '5th Year';
export type AcademicTerm = '1st Term' | '2nd Term' | '3rd Term';

export interface ApplicationFormState {
  firstName: string;
  lastName: string;
  studentId: string;
  degreeProgram: DegreeProgram | '';
  yearLevel: YearLevel | '';
  phoneNumber: string;
  email: string;
  password?: string; // Password should ideally not be stored in client-side state like this
  confirmPassword?: string;
  gwa: string; // Storing as string for input, convert to number for submission
  term: AcademicTerm | '';
  skillsExperience: string;
  availability: Record<string, { morning: boolean; afternoon: boolean }>;
  corFile: any | null; // Placeholder for file object
  gradesFile: any | null; // Placeholder for file object
  otherDocs: any | null; // Placeholder for file object
}