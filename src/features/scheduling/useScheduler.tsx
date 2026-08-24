import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { z } from 'zod';
import type { Booking, ScreenTab, ServiceType, ShiftBlock, SlotStatus, Technician } from './types';

const serviceTypeEnum = z.enum(['Plumbing', 'HVAC', 'Electrical', 'Drains', 'Roofing']);

const timeRangeSchema = z.object({
  startTime: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/),
  endTime: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/),
});

const shiftBlockSchema = z.object({
  dayOfWeek: z.number().int().min(0).max(6),
  startTime: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/),
  endTime: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/),
  breaks: z.array(timeRangeSchema),
  working: z.boolean().optional(),
});

const technicianSchema = z.object({
  id: z.string(),
  name: z.string(),
  skills: z.array(serviceTypeEnum),
  shifts: z.array(shiftBlockSchema),
  color: z.string().optional().default('#1a73e8'),
  symbol: z.string().optional().default('•'),
});

const bookingSchema = z.object({
  id: z.string(),
  customerName: z.string(),
  serviceType: serviceTypeEnum,
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  startTime: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/),
  endTime: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/),
  technicianId: z.string().nullable(),
});

const DEFAULT_DATE = '2026-08-10';
const STORAGE_KEY = 'broccoli-multi-skill-scheduler-state';

const schedulerStateSchema = z.object({
  technicians: z.array(technicianSchema),
  bookings: z.array(bookingSchema),
  selectedTab: z.enum(['settings', 'calendar', 'booking']),
  selectedDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  selectedService: serviceTypeEnum,
});

const loadPersistedState = () => {
  if (typeof window === 'undefined') {
    return null;
  }

  try {
    const rawState = window.localStorage.getItem(STORAGE_KEY);
    if (!rawState) {
      return null;
    }

    const parsed = schedulerStateSchema.safeParse(JSON.parse(rawState));
    return parsed.success ? parsed.data : null;
  } catch {
    return null;
  }
};

const initialTechnicians = [
  {
    id: 'dave',
    name: 'Dave',
    skills: ['HVAC', 'Electrical'],
    shifts: [
      {
        dayOfWeek: 1,
        startTime: '08:00',
        endTime: '17:00',
        breaks: [{ startTime: '12:00', endTime: '13:00' }],
      },
    ],
    color: '#1a73e8',
    symbol: '⚡',
  },
  {
    id: 'janet',
    name: 'Janet',
    skills: ['Plumbing', 'Drains'],
    shifts: [
      {
        dayOfWeek: 1,
        startTime: '08:00',
        endTime: '17:00',
        breaks: [{ startTime: '12:00', endTime: '13:00' }],
      },
    ],
    color: '#0f766e',
    symbol: '◌',
  },
  {
    id: 'bob',
    name: 'Bob',
    skills: ['HVAC'],
    shifts: [
      {
        dayOfWeek: 1,
        startTime: '08:00',
        endTime: '17:00',
        breaks: [{ startTime: '13:00', endTime: '14:00' }],
      },
    ],
    color: '#d97706',
    symbol: '✦',
  },
  {
    id: 'alice',
    name: 'Alice',
    skills: ['Roofing'],
    shifts: [
      {
        dayOfWeek: 1,
        startTime: '09:00',
        endTime: '15:00',
        breaks: [{ startTime: '12:00', endTime: '12:30' }],
      },
    ],
    color: '#dc2626',
    symbol: '△',
  },
] satisfies Technician[];

const initialBookings = [
  {
    id: 'b1',
    customerName: 'John',
    serviceType: 'HVAC',
    date: DEFAULT_DATE,
    startTime: '10:00',
    endTime: '11:00',
    technicianId: 'dave',
  },
  {
    id: 'b2',
    customerName: 'Mary',
    serviceType: 'Plumbing',
    date: DEFAULT_DATE,
    startTime: '11:00',
    endTime: '12:00',
    technicianId: 'janet',
  },
  {
    id: 'b3',
    customerName: 'Frank',
    serviceType: 'HVAC',
    date: DEFAULT_DATE,
    startTime: '14:00',
    endTime: '15:00',
    technicianId: 'bob',
  },
  {
    id: 'b5',
    customerName: 'Helen',
    serviceType: 'Plumbing',
    date: DEFAULT_DATE,
    startTime: '15:00',
    endTime: '16:00',
    technicianId: null,
  },
] satisfies Booking[];

const toMinutes = (value: string): number => {
  const [hours, minutes] = value.split(':').map(Number);
  return hours * 60 + minutes;
};

const overlaps = (startA: string, endA: string, startB: string, endB: string): boolean => {
  return toMinutes(startA) < toMinutes(endB) && toMinutes(startB) < toMinutes(endA);
};

const sortBookingsForDisplay = (left: Booking, right: Booking): number => {
  const leftPriority = left.technicianId === null ? 0 : 1;
  const rightPriority = right.technicianId === null ? 0 : 1;

  if (leftPriority !== rightPriority) {
    return leftPriority - rightPriority;
  }

  const startTimeDifference = left.startTime.localeCompare(right.startTime);
  if (startTimeDifference !== 0) {
    return startTimeDifference;
  }

  return left.endTime.localeCompare(right.endTime);
};

const getDayOfWeek = (dateString: string): number => new Date(`${dateString}T00:00:00`).getDay();

const formatDateLabel = (date: string): string => {
  const parsed = new Date(`${date}T00:00:00`);
  return new Intl.DateTimeFormat('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  }).format(parsed);
};

const formatClockTime = (time: string): string => {
  const [rawHours, minutes] = time.split(':').map(Number);
  const suffix = rawHours >= 12 ? 'PM' : 'AM';
  const normalizedHours = rawHours % 12 || 12;
  return `${normalizedHours}:${String(minutes).padStart(2, '0')} ${suffix}`;
};

const hours = Array.from({ length: 11 }, (_, index) => 8 + index);

const isTechnicianWorkingOnDate = (technician: Technician, targetDate: string): boolean => {
  const dayOfWeek = getDayOfWeek(targetDate);
  return technician.shifts.some((shift) => shift.dayOfWeek === dayOfWeek);
};

const getShiftForDay = (technician: Technician, targetDate: string): ShiftBlock | undefined => {
  const dayOfWeek = getDayOfWeek(targetDate);
  return technician.shifts.find((shift) => shift.dayOfWeek === dayOfWeek);
};

interface SchedulerContextValue {
  technicians: Technician[];
  bookings: Booking[];
  selectedTab: ScreenTab;
  selectedDate: string;
  selectedService: ServiceType;
  bookingsByDate: Map<string, Booking[]>;
  setSelectedTab: (tab: ScreenTab) => void;
  setSelectedDate: (date: string) => void;
  setSelectedService: (service: ServiceType) => void;
  addTechnician: (technician: Technician) => void;
  updateTechnician: (id: string, nextTechnician: Technician) => void;
  removeTechnician: (id: string) => void;
  addBooking: (booking: Booking) => void;
  updateBooking: (id: string, booking: Booking) => void;
  deleteBooking: (id: string) => void;
  getSlotsForService: (date: string, serviceType: ServiceType) => SlotStatus[];
  getTechniciansForService: (serviceType: ServiceType, date: string) => Technician[];
  getUnassignedJobsForDate: (date: string, serviceType: ServiceType) => Booking[];
  getCapacityAlert: (date: string, serviceType: ServiceType) => { count: number; availableHours: number; warning: string | null };
  formatDateLabel: (date: string) => string;
  hours: number[];
}

const SchedulerContext = createContext<SchedulerContextValue | null>(null);

export const SchedulerProvider = ({ children }: { children: React.ReactNode }) => {
  const persistedState = useMemo(() => loadPersistedState(), []);

  const [technicians, setTechnicians] = useState<Technician[]>(() => {
    const parsed = z.array(technicianSchema).safeParse(persistedState?.technicians ?? initialTechnicians);
    return parsed.success ? parsed.data : [];
  });

  const [bookings, setBookings] = useState<Booking[]>(() => {
    const parsed = z.array(bookingSchema).safeParse(persistedState?.bookings ?? initialBookings);
    return parsed.success ? parsed.data : [];
  });

  const [selectedTab, setSelectedTab] = useState<ScreenTab>(() => persistedState?.selectedTab ?? 'booking');
  const [selectedDate, setSelectedDate] = useState<string>(() => persistedState?.selectedDate ?? DEFAULT_DATE);
  const [selectedService, setSelectedService] = useState<ServiceType>(() => persistedState?.selectedService ?? 'HVAC');

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    const payload = { technicians, bookings, selectedTab, selectedDate, selectedService };
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
  }, [technicians, bookings, selectedTab, selectedDate, selectedService]);

  const bookingsByDate = useMemo(() => {
    const map = new Map<string, Booking[]>();
    bookings.forEach((booking) => {
      const existing = map.get(booking.date) ?? [];
      existing.push(booking);
      map.set(booking.date, existing.sort(sortBookingsForDisplay));
    });
    return map;
  }, [bookings]);

  const addTechnician = (technician: Technician) => {
    setTechnicians((current) => [...current, technicianSchema.parse(technician)]);
  };

  const updateTechnician = (id: string, nextTechnician: Technician) => {
    setTechnicians((current) =>
      current.map((technician) => (technician.id === id ? technicianSchema.parse(nextTechnician) : technician)),
    );
  };

  const removeTechnician = (id: string) => {
    setTechnicians((current) => current.filter((technician) => technician.id !== id));
  };

  const addBooking = (booking: Booking) => {
    setBookings((current) => [...current, bookingSchema.parse(booking)]);
  };

  const updateBooking = (id: string, booking: Booking) => {
    setBookings((current) =>
      current.map((currentBooking) => (currentBooking.id === id ? bookingSchema.parse(booking) : currentBooking)),
    );
  };

  const deleteBooking = (id: string) => {
    setBookings((current) => current.filter((booking) => booking.id !== id));
  };

  const getTechniciansForService = (serviceType: ServiceType, date: string): Technician[] => {
    return technicians.filter(
      (technician) => technician.skills.includes(serviceType) && isTechnicianWorkingOnDate(technician, date),
    );
  };

  const getUnassignedJobsForDate = (date: string, serviceType: ServiceType): Booking[] => {
    return (bookingsByDate.get(date) ?? [])
      .filter((booking) => booking.serviceType === serviceType && booking.technicianId === null)
      .sort(sortBookingsForDisplay);
  };

  const getCapacityAlert = (date: string, serviceType: ServiceType) => {
    const certifiedWorkers = getTechniciansForService(serviceType, date);
    const unassignedJobs = getUnassignedJobsForDate(date, serviceType);
    const assignedBookings = (bookingsByDate.get(date) ?? []).filter(
      (booking) => booking.serviceType === serviceType && booking.technicianId !== null,
    );

    const workingCapacity = certifiedWorkers.filter((technician) => !!getShiftForDay(technician, date)).length;
    const availableHours = Math.max(0, workingCapacity - assignedBookings.length - unassignedJobs.length);

    const warning =
      unassignedJobs.length > availableHours
        ? `Capacity Alert: You have ${unassignedJobs.length} unassigned ${serviceType} jobs on ${formatDateLabel(date)} but only ${availableHours} available hours among working ${serviceType} technicians. Some jobs may go unfulfilled.`
        : null;

    return { count: unassignedJobs.length, availableHours, warning };
  };

  const getSlotsForService = (date: string, serviceType: ServiceType): SlotStatus[] => {
    const certifiedWorkers = getTechniciansForService(serviceType, date);
    const bookingsForDate = bookingsByDate.get(date) ?? [];
    const unassignedJobs = getUnassignedJobsForDate(date, serviceType);

    const slots: SlotStatus[] = [];

    for (let hour = 8; hour <= 17; hour += 1) {
      const time = `${String(hour).padStart(2, '0')}:00`;
      const endTime = `${String(hour + 1).padStart(2, '0')}:00`;
      const slotWindow = { startTime: time, endTime };

      if (certifiedWorkers.length === 0) {
        slots.push({
          time,
          status: 'Unavailable',
          auditExplanation: `${time} is not available because no technicians with ${serviceType} certifications are scheduled to work on this day.`,
        });
        continue;
      }

      const availableTechnicians = certifiedWorkers.filter((technician) => {
        const shift = getShiftForDay(technician, date);
        if (!shift) {
          return false;
        }

        if (toMinutes(slotWindow.startTime) < toMinutes(shift.startTime) || toMinutes(slotWindow.endTime) > toMinutes(shift.endTime)) {
          return false;
        }

        const hasBreakConflict = shift.breaks.some((block) => overlaps(slotWindow.startTime, slotWindow.endTime, block.startTime, block.endTime));
        if (hasBreakConflict) {
          return false;
        }

        const hasAssignedBooking = bookingsForDate.some(
          (booking) =>
            booking.technicianId === technician.id &&
            overlaps(booking.startTime, booking.endTime, slotWindow.startTime, slotWindow.endTime),
        );

        if (hasAssignedBooking) {
          return false;
        }

        return true;
      });

      let explanation = `${time} is unavailable because all certified technicians are already scheduled or unavailable.`;

      if (availableTechnicians.length > 0) {
        const matchedTechnician = availableTechnicians[0];
        slots.push({
          time,
          status: 'Available',
          auditExplanation: `${time} is available for a ${serviceType} booking because ${matchedTechnician.name} has open capacity during this hour.`,
        });
        continue;
      }

      const outsideHoursWorkers = certifiedWorkers.filter((technician) => {
        const shift = getShiftForDay(technician, date);
        return !shift || toMinutes(slotWindow.startTime) < toMinutes(shift.startTime) || toMinutes(slotWindow.endTime) > toMinutes(shift.endTime);
      });

      if (outsideHoursWorkers.length === certifiedWorkers.length) {
        slots.push({
          time,
          status: 'OutsideHours',
          auditExplanation: `${time} is not available because it is outside the working hours of our ${serviceType}-certified technicians.`,
        });
        continue;
      }

      const onBreakWorkers = certifiedWorkers.filter((technician) => {
        const shift = getShiftForDay(technician, date);
        if (!shift) {
          return false;
        }
        return shift.breaks.some((block) => overlaps(slotWindow.startTime, slotWindow.endTime, block.startTime, block.endTime));
      });

      if (onBreakWorkers.length === certifiedWorkers.length) {
        explanation = `${time} is not available because all certified technicians are currently on their scheduled lunch breaks.`;
      } else {
        const assignedConflictTechnician = certifiedWorkers.find((technician) =>
          bookingsForDate.some(
            (booking) =>
              booking.technicianId === technician.id &&
              overlaps(booking.startTime, booking.endTime, slotWindow.startTime, slotWindow.endTime),
          ),
        );

        if (assignedConflictTechnician) {
          explanation = `${time} is not available because our only ${serviceType}-certified technician (${assignedConflictTechnician.name}) is already booked.`;
        } else if (unassignedJobs.some((booking) => overlaps(booking.startTime, booking.endTime, slotWindow.startTime, slotWindow.endTime))) {
          explanation = `This slot is unavailable because our remaining certified technicians are reserved for an unassigned ${serviceType} job.`;
        }
      }

      slots.push({ time, status: 'Unavailable', auditExplanation: explanation });
    }

    return slots;
  };

  const value = useMemo<SchedulerContextValue>(
    () => ({
      technicians,
      bookings,
      selectedTab,
      selectedDate,
      selectedService,
      bookingsByDate,
      setSelectedTab,
      setSelectedDate,
      setSelectedService,
      addTechnician,
      updateTechnician,
      removeTechnician,
      addBooking,
      updateBooking,
      deleteBooking,
      getSlotsForService,
      getTechniciansForService,
      getUnassignedJobsForDate,
      getCapacityAlert,
      formatDateLabel,
      hours,
    }),
    [technicians, bookings, selectedTab, selectedDate, selectedService, bookingsByDate],
  );

  return <SchedulerContext.Provider value={value}>{children}</SchedulerContext.Provider>;
};

export const useScheduler = () => {
  const context = useContext(SchedulerContext);

  if (!context) {
    throw new Error('useScheduler must be used inside a SchedulerProvider');
  }

  return context;
};

export { DEFAULT_DATE, formatClockTime, formatDateLabel, getShiftForDay, hours, isTechnicianWorkingOnDate };
