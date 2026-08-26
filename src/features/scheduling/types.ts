export type ServiceType = 'Plumbing' | 'HVAC' | 'Electrical' | 'Drains' | 'Roofing';

export interface TimeRange {
  startTime: string;
  endTime: string;
}

// PSEUDO CODE:
// ShiftBlock = "when this worker is allowed to work".
// Example:
//   shift = { dayOfWeek: 1, startTime: "08:00", endTime: "17:00", breaks: [{ startTime: "12:00", endTime: "13:00" }] }
//
// Why this matters:
//   We do not just check if a worker can do a service type. We also check if they are
//   scheduled to work on that specific weekday and whether the requested booking overlaps with
//   a break, another appointment, or a shift boundary.
export interface ShiftBlock {
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  breaks: TimeRange[];
  working?: boolean;
}

export interface Technician {
  id: string;
  name: string;
  skills: ServiceType[];
  shifts: ShiftBlock[];
  color?: string;
  symbol?: string;
}

// PSEUDO CODE:
// Booking = "a customer request that still needs a technician".
// Example behavior:
//   if technicianId is null, the job is still unassigned and must be matched to a certified tech
//   if technicianId is set, the job is already assigned and should not be treated as free capacity
//
// Why this matters:
//   The app is trying to answer two different questions at the same time:
//   1) Which jobs are open right now?
//   2) Which technicians can still take a job without violating their schedule?
export interface Booking {
  id: string;
  customerName: string;
  customerAddress?: string;
  serviceType: ServiceType;
  date: string;
  startTime: string;
  endTime: string;
  technicianId: string | null;
}

export type ScreenTab = 'settings' | 'calendar' | 'booking';

// PSEUDO CODE:
// SlotStatus = "the final answer for the UI".
// For each hour slot we produce one of these records:
//   {
//     time: "09:00",
//     status: "Available",
//     auditExplanation: "This slot is open because some certified tech has capacity."
//   }
//
// Why this matters:
//   The UI wants both a visual green/red state and a human-readable reason. This lets the user
//   audit whether a slot was blocked by skill coverage, lunch breaks, or existing bookings.
export interface SlotStatus {
  startTime: string;
  endTime: string;
  status: 'Available' | 'Unavailable' | 'OutsideHours';
  auditExplanation: string;
  isBreakException?: boolean;
}

export interface TechnicianAssignmentSuggestion {
  technicianId: string;
  technicianName: string;
  score: number;
  projectedLoad: number;
  clusterSummary: string;
  reasons: string[];
}
