import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { z } from 'zod';
import type {
  Booking,
  ScreenTab,
  ServiceType,
  ShiftBlock,
  SlotStatus,
  Technician,
  TechnicianAssignmentSuggestion,
} from './types';

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
  customerAddress: z.string().optional().default(''),
  serviceType: serviceTypeEnum,
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  startTime: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/),
  endTime: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/),
  technicianId: z.string().nullable(),
});

const DEFAULT_DATE = '2026-08-10';
const STORAGE_KEY = 'broccoli-multi-skill-scheduler-state';
const ROSTER_WORKING_DAYS = [1, 2, 3, 4, 5] as const;
const ROSTER_SHIFT_START = '09:00';
const ROSTER_SHIFT_END = '17:00';
const DEFAULT_LUNCH_BREAK = { startTime: '12:00', endTime: '13:00' };

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

const createDefaultWeekdayShifts = (): ShiftBlock[] => {
  return ROSTER_WORKING_DAYS.map((dayOfWeek) => ({
    dayOfWeek,
    startTime: ROSTER_SHIFT_START,
    endTime: ROSTER_SHIFT_END,
    breaks: [DEFAULT_LUNCH_BREAK],
  }));
};

const addMinutesToTime = (time: string, deltaMinutes: number): string => {
  const [hours, minutes] = time.split(':').map(Number);
  const totalMinutes = hours * 60 + minutes + deltaMinutes;
  const normalizedMinutes = ((totalMinutes % (24 * 60)) + 24 * 60) % (24 * 60);
  const nextHours = Math.floor(normalizedMinutes / 60);
  const nextMinutes = normalizedMinutes % 60;
  return `${String(nextHours).padStart(2, '0')}:${String(nextMinutes).padStart(2, '0')}`;
};

const normalizeAliceLunchDuration = (technicianList: Technician[]): Technician[] => {
  return technicianList.map((technician) => {
    if (technician.id !== 'alice') {
      return technician;
    }

    return {
      ...technician,
      shifts: technician.shifts.map((shift) => {
        const existingLunch = shift.breaks[0] ?? { startTime: '12:00', endTime: '13:00' };
        const lunchStart = existingLunch.startTime;

        return {
          ...shift,
          breaks: [
            {
              ...existingLunch,
              startTime: lunchStart,
              endTime: addMinutesToTime(lunchStart, 60),
            },
            ...shift.breaks.slice(1),
          ],
        };
      }),
    };
  });
};

const initialTechnicians = [
  {
    id: 'dave',
    name: 'Dave',
    skills: ['HVAC', 'Electrical'],
    shifts: createDefaultWeekdayShifts(),
    color: '#1a73e8',
    symbol: '⚡',
  },
  {
    id: 'janet',
    name: 'Janet',
    skills: ['Plumbing', 'Drains'],
    shifts: createDefaultWeekdayShifts(),
    color: '#0f766e',
    symbol: '◌',
  },
  {
    id: 'bob',
    name: 'Bob',
    skills: ['HVAC'],
    shifts: createDefaultWeekdayShifts(),
    color: '#d97706',
    symbol: '✦',
  },
  {
    id: 'alice',
    name: 'Alice',
    skills: ['Roofing'],
    shifts: createDefaultWeekdayShifts(),
    color: '#dc2626',
    symbol: '△',
  },
] satisfies Technician[];

const seededBookingDates = [
  '2026-08-10',
  '2026-08-11',
  '2026-08-12',
  '2026-08-13',
  '2026-08-14',
  '2026-08-17',
  '2026-08-18',
  '2026-08-19',
  '2026-08-20',
  '2026-08-21',
  '2026-08-24',
  '2026-08-25',
  '2026-08-26',
  '2026-08-27',
  '2026-08-28',
] as const;

const seededBookingTemplates: Array<
  Pick<Booking, 'serviceType' | 'startTime' | 'endTime' | 'technicianId'> & {
    customerNameSeedOffset: number;
  }
> = [
  {
    customerNameSeedOffset: 0,
    serviceType: 'Electrical',
    startTime: '09:00',
    endTime: '10:00',
    technicianId: 'dave',
  },
  {
    customerNameSeedOffset: 1,
    serviceType: 'Drains',
    startTime: '09:00',
    endTime: '10:00',
    technicianId: 'janet',
  },
  {
    customerNameSeedOffset: 2,
    serviceType: 'HVAC',
    startTime: '10:00',
    endTime: '11:00',
    technicianId: 'bob',
  },
  {
    customerNameSeedOffset: 3,
    serviceType: 'Roofing',
    startTime: '10:00',
    endTime: '11:00',
    technicianId: 'alice',
  },
  {
    customerNameSeedOffset: 4,
    serviceType: 'Plumbing',
    startTime: '11:00',
    endTime: '12:00',
    technicianId: 'janet',
  },
  {
    customerNameSeedOffset: 5,
    serviceType: 'HVAC',
    startTime: '13:00',
    endTime: '14:00',
    technicianId: 'dave',
  },
  {
    customerNameSeedOffset: 6,
    serviceType: 'HVAC',
    startTime: '14:00',
    endTime: '15:00',
    technicianId: 'bob',
  },
  {
    customerNameSeedOffset: 7,
    serviceType: 'Drains',
    startTime: '15:00',
    endTime: '16:00',
    technicianId: 'janet',
  },
  {
    customerNameSeedOffset: 8,
    serviceType: 'Roofing',
    startTime: '16:00',
    endTime: '17:00',
    technicianId: 'alice',
  },
  {
    customerNameSeedOffset: 9,
    serviceType: 'Plumbing',
    startTime: '15:00',
    endTime: '16:00',
    technicianId: null,
  },
  {
    customerNameSeedOffset: 10,
    serviceType: 'Electrical',
    startTime: '13:00',
    endTime: '14:00',
    technicianId: null,
  },
];

const seededCustomerNames = [
  'Avery Mitchell',
  'Olivia Bennett',
  'Liam Parker',
  'Sophia Reed',
  'Noah Collins',
  'Emma Foster',
  'Mason Hughes',
  'Amelia Brooks',
  'Ethan Price',
  'Harper Sanders',
  'Logan Fisher',
  'Charlotte West',
  'Lucas Bryant',
  'Mia Jenkins',
  'Elijah Ross',
  'Evelyn Ward',
  'James Cooper',
  'Abigail Howard',
  'Benjamin Gray',
  'Ella Peterson',
  'Henry Simmons',
  'Scarlett Powell',
  'Jack Russell',
  'Grace Butler',
  'Samuel Diaz',
  'Chloe Hayes',
  'Owen Barnes',
  'Lily Coleman',
  'Alexander Perry',
  'Aria Henderson',
] as const;

const seededUtahStreets = [
  'Redwood Rd',
  'Wasatch Blvd',
  'State St',
  'Pioneer Rd',
  'Canyon View Dr',
  'Temple View Ln',
  'Cottonwood Way',
  'River Bend Ave',
  'Desert Sage Ct',
  'Summit Ridge Dr',
  'Maple Hollow Rd',
  'Juniper Peak Way',
] as const;

const seededUtahCities = [
  'Salt Lake City',
  'Provo',
  'Ogden',
  'West Jordan',
  'Sandy',
  'Lehi',
  'Orem',
  'St. George',
  'Logan',
  'Draper',
  'Layton',
  'Murray',
] as const;

const seededUtahZipCodes = ['84101', '84604', '84401', '84088', '84070', '84043', '84057', '84770', '84321', '84020', '84041', '84107'] as const;

const initialBookings: Booking[] = seededBookingDates.flatMap((date, dayIndex) =>
  seededBookingTemplates.map((template, templateIndex) => {
    const bookingNumber = dayIndex * seededBookingTemplates.length + templateIndex + 1;
    const nameIndex = (bookingNumber + template.customerNameSeedOffset) % seededCustomerNames.length;
    const street = seededUtahStreets[(templateIndex + dayIndex) % seededUtahStreets.length];
    const cityIndex = (dayIndex * 2 + templateIndex) % seededUtahCities.length;
    const city = seededUtahCities[cityIndex];
    const zip = seededUtahZipCodes[cityIndex % seededUtahZipCodes.length];
    const houseNumber = 110 + bookingNumber * 3;

    return {
      id: `b${bookingNumber}`,
      customerName: seededCustomerNames[nameIndex],
      customerAddress: `${houseNumber} ${street}, ${city}, UT ${zip}`,
      serviceType: template.serviceType,
      date,
      startTime: template.startTime,
      endTime: template.endTime,
      technicianId: template.technicianId,
    };
  }),
);

const toMinutes = (value: string): number => {
  const [hours, minutes] = value.split(':').map(Number);
  return hours * 60 + minutes;
};

const normalizeBreaksToShift = (breaks: ShiftBlock['breaks']): ShiftBlock['breaks'] => {
  const validBreaks = breaks.filter((block) => {
    const startMinutes = toMinutes(block.startTime);
    const endMinutes = toMinutes(block.endTime);
    return (
      startMinutes >= toMinutes(ROSTER_SHIFT_START) &&
      endMinutes <= toMinutes(ROSTER_SHIFT_END) &&
      startMinutes < endMinutes
    );
  });

  return validBreaks.length > 0 ? validBreaks : [DEFAULT_LUNCH_BREAK];
};

const enforceRosterWorkingHours = (technician: Technician): Technician => {
  const shiftsByDay = new Map(technician.shifts.map((shift) => [shift.dayOfWeek, shift]));

  const normalizedShifts: ShiftBlock[] = ROSTER_WORKING_DAYS.map((dayOfWeek) => {
    const existingShift = shiftsByDay.get(dayOfWeek);
    return {
      dayOfWeek,
      startTime: ROSTER_SHIFT_START,
      endTime: ROSTER_SHIFT_END,
      breaks: normalizeBreaksToShift(existingShift?.breaks ?? [DEFAULT_LUNCH_BREAK]),
      working: true,
    };
  });

  return {
    ...technician,
    shifts: normalizedShifts,
  };
};

const enforceRosterDefaults = (technicianList: Technician[]): Technician[] => {
  return technicianList.map((technician) => enforceRosterWorkingHours(technician));
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

const normalizeAddressPart = (value: string): string =>
  value
    .toLowerCase()
    .replace(/\./g, '')
    .replace(/\s+/g, ' ')
    .trim();

const parseAddress = (address?: string): { city: string; zip: string; streetKey: string } => {
  if (!address || address.trim().length === 0) {
    return { city: '', zip: '', streetKey: '' };
  }

  const normalized = normalizeAddressPart(address);
  const parts = normalized.split(',').map((part) => part.trim()).filter(Boolean);
  const firstPart = parts[0] ?? '';
  const secondPart = parts[1] ?? '';
  const zipMatch = normalized.match(/\b\d{5}\b/);

  const streetKey = firstPart
    .replace(/^\d+\s+/, '')
    .replace(/\b(apt|unit|suite|ste)\b.*$/, '')
    .trim();

  return {
    city: secondPart,
    zip: zipMatch?.[0] ?? '',
    streetKey,
  };
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
  getAssignmentSuggestions: (booking: Booking) => TechnicianAssignmentSuggestion[];
  formatDateLabel: (date: string) => string;
  hours: number[];
}

const SchedulerContext = createContext<SchedulerContextValue | null>(null);

export const SchedulerProvider = ({ children }: { children: React.ReactNode }) => {
  const persistedState = useMemo(() => loadPersistedState(), []);

  const [technicians, setTechnicians] = useState<Technician[]>(() => {
    const parsed = z.array(technicianSchema).safeParse(persistedState?.technicians ?? initialTechnicians);
    return parsed.success ? normalizeAliceLunchDuration(enforceRosterDefaults(parsed.data)) : [];
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
    setTechnicians((current) =>
      normalizeAliceLunchDuration([...current, enforceRosterWorkingHours(technicianSchema.parse(technician))]),
    );
  };

  const updateTechnician = (id: string, nextTechnician: Technician) => {
    setTechnicians((current) =>
      normalizeAliceLunchDuration(
        current.map((technician) =>
          technician.id === id ? enforceRosterWorkingHours(technicianSchema.parse(nextTechnician)) : technician
        ),
      ),
    );
  };

  const removeTechnician = (id: string) => {
    setTechnicians((current) => current.filter((technician) => technician.id !== id));
  };

  const addBooking = (booking: Booking) => {
    setBookings((current) => [...current, bookingSchema.parse(booking)]);
  };

  const updateBooking = (id: string, booking: Booking) => {
    const parsedBooking = bookingSchema.safeParse(booking);
    if (!parsedBooking.success) {
      console.error('Failed to update booking: validation error.', {
        bookingId: id,
        issues: parsedBooking.error.issues,
        booking,
      });
      return;
    }

    setBookings((current) =>
      current.map((currentBooking) => (currentBooking.id === id ? parsedBooking.data : currentBooking)),
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
    const certifiedTechnicianIds = new Set(certifiedWorkers.map((technician) => technician.id));
    const assignedBookings = (bookingsByDate.get(date) ?? []).filter(
      (booking) => booking.technicianId !== null && certifiedTechnicianIds.has(booking.technicianId),
    );

    let reservableCapacityHours = 0;
    let unassignedDemandHours = 0;
    let shortageHours = 0;

    for (let hour = 8; hour <= 17; hour += 1) {
      const startTime = `${String(hour).padStart(2, '0')}:00`;
      const endTime = `${String(hour + 1).padStart(2, '0')}:00`;

      const slotEligibleTechnicians = certifiedWorkers.filter((technician) => {
        const shift = getShiftForDay(technician, date);
        if (!shift) {
          return false;
        }

        if (toMinutes(startTime) < toMinutes(shift.startTime) || toMinutes(endTime) > toMinutes(shift.endTime)) {
          return false;
        }

        return !shift.breaks.some((block) => overlaps(startTime, endTime, block.startTime, block.endTime));
      });

      const assignedConflicts = slotEligibleTechnicians.filter((technician) =>
        assignedBookings.some(
          (booking) => booking.technicianId === technician.id && overlaps(booking.startTime, booking.endTime, startTime, endTime),
        ),
      ).length;

      const freeTechnicianHours = Math.max(0, slotEligibleTechnicians.length - assignedConflicts);
      const pendingUnassignedHours = unassignedJobs.filter((booking) =>
        overlaps(booking.startTime, booking.endTime, startTime, endTime),
      ).length;

      reservableCapacityHours += freeTechnicianHours;
      unassignedDemandHours += pendingUnassignedHours;

      if (pendingUnassignedHours > freeTechnicianHours) {
        shortageHours += pendingUnassignedHours - freeTechnicianHours;
      }
    }

    const availableHours = Math.max(0, reservableCapacityHours - unassignedDemandHours);
    const warning =
      shortageHours > 0
        ? `Capacity Alert: ${shortageHours} ${serviceType} technician-hour${shortageHours === 1 ? '' : 's'} are overbooked by unassigned work on ${formatDateLabel(date)}. Assign or reschedule pending jobs before accepting more bookings.`
        : null;

    return { count: unassignedJobs.length, availableHours, warning };
  };

  const getAssignmentSuggestions = (booking: Booking): TechnicianAssignmentSuggestion[] => {
    const eligibleTechnicians = getTechniciansForService(booking.serviceType, booking.date);
    const existingBookingsForDate = bookingsByDate.get(booking.date) ?? [];
    const targetAddress = parseAddress(booking.customerAddress);

    return eligibleTechnicians
      .flatMap((technician): TechnicianAssignmentSuggestion[] => {
        const shift = getShiftForDay(technician, booking.date);
        if (!shift) {
          return [];
        }

        if (
          toMinutes(booking.startTime) < toMinutes(shift.startTime) ||
          toMinutes(booking.endTime) > toMinutes(shift.endTime)
        ) {
          return [];
        }

        const hasBreakConflict = shift.breaks.some((block) =>
          overlaps(booking.startTime, booking.endTime, block.startTime, block.endTime),
        );
        if (hasBreakConflict) {
          return [];
        }

        const technicianBookings = existingBookingsForDate.filter(
          (existingBooking) => existingBooking.technicianId === technician.id && existingBooking.id !== booking.id,
        );

        const hasBookingConflict = technicianBookings.some((existingBooking) =>
          overlaps(existingBooking.startTime, existingBooking.endTime, booking.startTime, booking.endTime),
        );
        if (hasBookingConflict) {
          return [];
        }

        const sameCityCount = technicianBookings.filter((existingBooking) => {
          const existingAddress = parseAddress(existingBooking.customerAddress);
          return !!targetAddress.city && existingAddress.city === targetAddress.city;
        }).length;

        const sameZipCount = technicianBookings.filter((existingBooking) => {
          const existingAddress = parseAddress(existingBooking.customerAddress);
          return !!targetAddress.zip && existingAddress.zip === targetAddress.zip;
        }).length;

        const sameStreetCount = technicianBookings.filter((existingBooking) => {
          const existingAddress = parseAddress(existingBooking.customerAddress);
          return !!targetAddress.streetKey && existingAddress.streetKey === targetAddress.streetKey;
        }).length;

        const projectedLoad = technicianBookings.length + 1;
        const clusterScore = sameCityCount * 4 + sameZipCount * 3 + sameStreetCount * 2;
        const loadPenalty = Math.max(0, projectedLoad - 2) * 1.25;
        const score = clusterScore - loadPenalty;

        const reasons: string[] = [];

        if (sameCityCount > 0) {
          reasons.push(`${sameCityCount} same-city stop${sameCityCount === 1 ? '' : 's'} already on route`);
        }

        if (sameZipCount > 0) {
          reasons.push(`ZIP match with ${sameZipCount} scheduled job${sameZipCount === 1 ? '' : 's'}`);
        }

        if (sameStreetCount > 0) {
          reasons.push('Exact street match found');
        }

        if (reasons.length === 0) {
          reasons.push('No nearby jobs yet; assigned by capacity balance');
        }

        let clusterSummary = 'Balanced route';
        if (sameStreetCount > 0) {
          clusterSummary = 'Strong cluster';
        } else if (sameCityCount > 0 || sameZipCount > 0) {
          clusterSummary = 'Good cluster';
        }

        return [
          {
            technicianId: technician.id,
            technicianName: technician.name,
            score,
            projectedLoad,
            clusterSummary,
            reasons,
          },
        ];
      })
      .sort((left, right) => {
        if (right.score !== left.score) {
          return right.score - left.score;
        }

        if (left.projectedLoad !== right.projectedLoad) {
          return left.projectedLoad - right.projectedLoad;
        }

        return left.technicianName.localeCompare(right.technicianName);
      });
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
          ...slotWindow,
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

      const overlappingUnassignedJobs = unassignedJobs.filter((booking) =>
        overlaps(booking.startTime, booking.endTime, slotWindow.startTime, slotWindow.endTime),
      );
      const unassignedReserveCount = overlappingUnassignedJobs.length;

      let explanation = `${time} is unavailable because all certified technicians are already scheduled or unavailable.`;

      if (availableTechnicians.length > unassignedReserveCount) {
        const matchedTechnician = availableTechnicians[Math.min(unassignedReserveCount, availableTechnicians.length - 1)];
        const reservationMessage =
          unassignedReserveCount > 0
            ? ` ${unassignedReserveCount} pending unassigned ${serviceType} job${unassignedReserveCount === 1 ? ' is' : 's are'} already reserving capacity this hour.`
            : '';

        slots.push({
          ...slotWindow,
          status: 'Available',
          auditExplanation: `${time} is available for a ${serviceType} booking because ${matchedTechnician.name} has open capacity during this hour.${reservationMessage}`,
        });
        continue;
      }

      const outsideHoursWorkers = certifiedWorkers.filter((technician) => {
        const shift = getShiftForDay(technician, date);
        return !shift || toMinutes(slotWindow.startTime) < toMinutes(shift.startTime) || toMinutes(slotWindow.endTime) > toMinutes(shift.endTime);
      });

      if (outsideHoursWorkers.length === certifiedWorkers.length) {
        slots.push({
          ...slotWindow,
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
        if (unassignedReserveCount > 0) {
          explanation = `${time} is not available because ${unassignedReserveCount} unassigned ${serviceType} job${unassignedReserveCount === 1 ? ' is' : 's are'} reserving the remaining certified capacity.`;
        }

        const assignedConflictTechnician = certifiedWorkers.find((technician) =>
          bookingsForDate.some(
            (booking) =>
              booking.technicianId === technician.id &&
              overlaps(booking.startTime, booking.endTime, slotWindow.startTime, slotWindow.endTime),
          ),
        );

        if (assignedConflictTechnician && unassignedReserveCount === 0) {
          explanation = `${time} is not available because ${assignedConflictTechnician.name} is already booked and no other ${serviceType}-certified capacity is free.`;
        }
      }

      slots.push({ ...slotWindow, status: 'Unavailable', auditExplanation: explanation });
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
      getAssignmentSuggestions,
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
