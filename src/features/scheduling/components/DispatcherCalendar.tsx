import {
  AlertTriangle,
  CalendarRange,
  Filter,
  House,
  UserPlus,
  Zap,
  type LucideIcon,
} from 'lucide-react';
import { useEffect, useMemo, useRef, useState, type ComponentProps } from 'react';
import { formatClockTime, useScheduler } from '../useScheduler';
import type { Booking, ServiceType } from '../types';

interface DraggedBreakState {
  technicianId: string;
  breakIndex: number;
  durationMinutes: number;
}

const serviceOptions: ServiceType[] = ['Plumbing', 'HVAC', 'Electrical', 'Drains', 'Roofing'];

const PipeElbowIcon = (props: ComponentProps<'svg'>) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M4 4v9c0 3.3 2.7 6 6 6h10" />
    <line x1="2.5" y1="4" x2="7" y2="4" strokeWidth="2.25" />
    <line x1="18" y1="10.5" x2="18" y2="15.5" strokeWidth="2.25" />
  </svg>
);

const ManholeIcon = (props: ComponentProps<'svg'>) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <circle cx="12" cy="12" r="8.5" />
    <circle cx="12" cy="12" r="3.25" />
    <circle cx="8.5" cy="12" r="1.5" />
    <circle cx="15.5" cy="12" r="1.5" />
    <circle cx="12" cy="8.5" r="1.5" />
    <circle cx="12" cy="15.5" r="1.5" />
    <circle cx="9.2" cy="9.2" r="1.25" />
    <circle cx="14.8" cy="9.2" r="1.25" />
    <circle cx="9.2" cy="14.8" r="1.25" />
    <circle cx="14.8" cy="14.8" r="1.25" />
  </svg>
);

const SnowflakeIcon = (props: ComponentProps<'svg'>) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M12 2v20" />
    <path d="M12 8 8.5 4.5" />
    <path d="M12 8 15.5 4.5" />
    <path d="M12 16 8.5 19.5" />
    <path d="M12 16 15.5 19.5" />
    <path d="M2 12h20" />
    <path d="M8 12 4.5 8.5" />
    <path d="M8 12 4.5 15.5" />
    <path d="M16 12l3.5-3.5" />
    <path d="M16 12l3.5 3.5" />
  </svg>
);

const skillMeta: Record<ServiceType, { icon: LucideIcon; className: string }> = {
  Plumbing: { icon: PipeElbowIcon as unknown as LucideIcon, className: 'border-slate-300 bg-slate-500 text-slate-50' },
  HVAC: { icon: SnowflakeIcon as unknown as LucideIcon, className: 'border-sky-300 bg-sky-500 text-sky-50' },
  Electrical: { icon: Zap, className: 'border-yellow-300 bg-yellow-400 text-yellow-950' },
  Drains: { icon: ManholeIcon as unknown as LucideIcon, className: 'border-emerald-300 bg-emerald-500 text-emerald-50' },
  Roofing: { icon: House, className: 'border-rose-300 bg-rose-500 text-rose-50' },
};

function SkillIconChip({ skill }: { skill: ServiceType }) {
  const Icon = skillMeta[skill].icon;

  return (
    <span
      className={`inline-flex h-5 w-5 items-center justify-center rounded-full border ${skillMeta[skill].className}`}
      title={skill}
      aria-label={skill}
    >
      <Icon className="h-3 w-3" aria-hidden="true" />
    </span>
  );
}

const weekdayLabels = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

const toDateOnly = (value: Date): string => {
  const year = value.getFullYear();
  const month = String(value.getMonth() + 1).padStart(2, '0');
  const date = String(value.getDate()).padStart(2, '0');
  return `${year}-${month}-${date}`;
};

const getMonthGrid = (baseDate: Date): Date[] => {
  const monthStart = new Date(baseDate.getFullYear(), baseDate.getMonth(), 1);
  const monthStartOffset = (monthStart.getDay() + 6) % 7;
  const firstVisibleDate = new Date(monthStart);
  firstVisibleDate.setDate(monthStart.getDate() - monthStartOffset);

  return Array.from({ length: 42 }, (_, index) => {
    const date = new Date(firstVisibleDate);
    date.setDate(firstVisibleDate.getDate() + index);
    return date;
  });
};

const getBookingTone = (booking: Booking, hasConflict: boolean) => {
  const serviceTone = skillMeta[booking.serviceType].className;
  const conflictTone = hasConflict ? 'ring-2 ring-red-300' : '';

  if (booking.technicianId === null) {
    return `${serviceTone} border-dashed ${conflictTone}`;
  }

  return `${serviceTone} ${conflictTone}`;
};

const toMinutes = (value: string): number => {
  const [hours, minutes] = value.split(':').map(Number);
  return hours * 60 + minutes;
};

const toTime = (value: number): string => {
  const normalized = ((value % (24 * 60)) + 24 * 60) % (24 * 60);
  const hours = Math.floor(normalized / 60);
  const minutes = normalized % 60;
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
};

const addMinutes = (value: string, delta: number): string => toTime(toMinutes(value) + delta);

const overlaps = (startA: string, endA: string, startB: string, endB: string): boolean =>
  toMinutes(startA) < toMinutes(endB) && toMinutes(startB) < toMinutes(endA);

export default function DispatcherCalendar() {
  const {
    technicians,
    bookings,
    selectedDate,
    setSelectedDate,
    selectedService,
    getTechniciansForService,
    getUnassignedJobsForDate,
    getCapacityAlert,
    getAssignmentSuggestions,
    formatDateLabel,
    hours,
    updateTechnician,
    updateBooking,
  } = useScheduler();

  const selectedSkill = selectedService;
  const dateInputRef = useRef<HTMLInputElement | null>(null);
  const [assignmentTarget, setAssignmentTarget] = useState<Booking | null>(null);
  const [draggedBookingId, setDraggedBookingId] = useState<string | null>(null);
  const [draggedBreak, setDraggedBreak] = useState<DraggedBreakState | null>(null);
  const [isDraggingBooking, setIsDraggingBooking] = useState(false);
  const [isPressingBooking, setIsPressingBooking] = useState(false);
  const [isDraggingBreak, setIsDraggingBreak] = useState(false);
  const [isPressingBreak, setIsPressingBreak] = useState(false);
  const [isSchedulingAlgorithmExpanded, setIsSchedulingAlgorithmExpanded] = useState(false);
  const [isCapacityAlertExpanded, setIsCapacityAlertExpanded] = useState(false);
  const [calendarMonth, setCalendarMonth] = useState(() => new Date(`${selectedDate}T00:00:00`));
  const [showDatePicker, setShowDatePicker] = useState(false);

  useEffect(() => {
    setCalendarMonth(new Date(`${selectedDate}T00:00:00`));
  }, [selectedDate]);

  useEffect(() => {
    const shouldShowMoveCursor = isDraggingBooking || isPressingBooking || isDraggingBreak || isPressingBreak;

    if (!shouldShowMoveCursor) {
      document.body.style.cursor = '';
      return;
    }

    document.body.style.cursor = 'move';
    return () => {
      document.body.style.cursor = '';
    };
  }, [isDraggingBooking, isPressingBooking, isDraggingBreak, isPressingBreak]);

  const visibleTechs = useMemo(
    () =>
      technicians.filter((tech) =>
        tech.shifts.some((shift) => shift.dayOfWeek === new Date(`${selectedDate}T00:00:00`).getDay()),
      ),
    [selectedDate, technicians],
  );

  const visibleColumns = useMemo<
    Array<{ kind: 'tech'; tech: (typeof visibleTechs)[number] } | { kind: 'unassigned' }>
  >(() => {
    const columns: Array<{ kind: 'tech'; tech: (typeof visibleTechs)[number] } | { kind: 'unassigned' }> =
      visibleTechs.map((tech) => ({ kind: 'tech', tech }));
    const daveIndex = columns.findIndex((column) => column.kind === 'tech' && column.tech.id === 'dave');

    if (daveIndex >= 0) {
      columns.splice(daveIndex, 0, { kind: 'unassigned' });
    }

    return columns;
  }, [visibleTechs]);

  const techColumnWidth = 180;
  const calendarMinWidth = Math.max(760, 90 + visibleColumns.length * techColumnWidth);

  const calendarBookings = useMemo(
    () =>
      bookings
        .filter((booking) => booking.date === selectedDate)
        .sort((left, right) => {
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
        }),
    [bookings, selectedDate],
  );

  const alert = getCapacityAlert(selectedDate, selectedSkill);
  const unassignedJobs = getUnassignedJobsForDate(selectedDate, selectedSkill);
  const totalTechniciansWithSkill = getTechniciansForService(selectedSkill, selectedDate).length;
  const assignedJobsForSkill = bookings.filter(
    (booking) => booking.date === selectedDate && booking.serviceType === selectedSkill && booking.technicianId !== null,
  ).length;
  const unassignedJobsForSkill = unassignedJobs.length;
  const globalAvailability = Math.max(0, totalTechniciansWithSkill - assignedJobsForSkill - unassignedJobsForSkill);
  const activeTechnicianCount = technicians.filter((tech) =>
    tech.shifts.some((shift) => shift.dayOfWeek === new Date(`${selectedDate}T00:00:00`).getDay()),
  ).length;
  const activeBookedHours = bookings
    .filter((booking) => booking.date === selectedDate && booking.technicianId !== null)
    .reduce((sum, booking) => sum + (toMinutes(booking.endTime) - toMinutes(booking.startTime)) / 60, 0);

  const assignTechnician = (technicianId: string) => {
    if (!assignmentTarget) {
      return;
    }

    const technician = technicians.find((tech) => tech.id === technicianId);
    if (!technician || !technician.skills.includes(assignmentTarget.serviceType)) {
      return;
    }

    updateBooking(assignmentTarget.id, {
      ...assignmentTarget,
      technicianId,
    });
    setAssignmentTarget(null);
  };

  const canMoveBookingToSlot = (
    booking: Booking,
    technician: (typeof technicians)[number],
    targetStart: string,
  ) => {
    const targetEnd = addMinutes(targetStart, Math.max(15, toMinutes(booking.endTime) - toMinutes(booking.startTime)));

    if (!technician.skills.includes(booking.serviceType)) {
      return false;
    }

    const shift = technician.shifts.find((block) => block.dayOfWeek === new Date(`${booking.date}T00:00:00`).getDay());
    if (!shift) {
      return false;
    }

    if (toMinutes(targetStart) < toMinutes(shift.startTime) || toMinutes(targetEnd) > toMinutes(shift.endTime)) {
      return false;
    }

    if (shift.breaks.some((block) => overlaps(targetStart, targetEnd, block.startTime, block.endTime))) {
      return false;
    }

    const hasExistingConflict = bookings.some(
      (otherBooking) =>
        otherBooking.id !== booking.id &&
        otherBooking.date === booking.date &&
        otherBooking.technicianId === technician.id &&
        overlaps(otherBooking.startTime, otherBooking.endTime, targetStart, targetEnd),
    );

    return !hasExistingConflict;
  };

  const canMoveBookingToUnassignedSlot = (booking: Booking, targetStart: string) => {
    const targetEnd = addMinutes(targetStart, Math.max(15, toMinutes(booking.endTime) - toMinutes(booking.startTime)));

    const hasExistingConflict = bookings.some(
      (otherBooking) =>
        otherBooking.id !== booking.id &&
        otherBooking.date === booking.date &&
        otherBooking.serviceType === booking.serviceType &&
        otherBooking.technicianId === null &&
        overlaps(otherBooking.startTime, otherBooking.endTime, targetStart, targetEnd),
    );

    return !hasExistingConflict;
  };

  const canMoveBreakToSlot = (
    technician: (typeof technicians)[number],
    breakIndex: number,
    targetStart: string,
    durationMinutes: number,
  ) => {
    const selectedDayOfWeek = new Date(`${selectedDate}T00:00:00`).getDay();
    const shift = technician.shifts.find((block) => block.dayOfWeek === selectedDayOfWeek);

    if (!shift || !shift.breaks[breakIndex]) {
      return false;
    }

    const targetEnd = addMinutes(targetStart, durationMinutes);

    if (toMinutes(targetStart) < toMinutes(shift.startTime) || toMinutes(targetEnd) > toMinutes(shift.endTime)) {
      return false;
    }

    const hasBreakConflict = shift.breaks.some((breakBlock, index) => {
      if (index === breakIndex) {
        return false;
      }

      return overlaps(breakBlock.startTime, breakBlock.endTime, targetStart, targetEnd);
    });

    if (hasBreakConflict) {
      return false;
    }

    const hasBookingConflict = bookings.some(
      (booking) =>
        booking.date === selectedDate &&
        booking.technicianId === technician.id &&
        overlaps(booking.startTime, booking.endTime, targetStart, targetEnd),
    );

    return !hasBookingConflict;
  };

  const handleDropOnTechnician = (technicianId: string, targetStart: string) => {
    if (!draggedBookingId) {
      return;
    }

    const draggedBooking = bookings.find((booking) => booking.id === draggedBookingId);
    if (!draggedBooking) {
      setDraggedBookingId(null);
      return;
    }

    const bookingForSelectedDate =
      draggedBooking.date === selectedDate ? draggedBooking : { ...draggedBooking, date: selectedDate };

    const technician = technicians.find((tech) => tech.id === technicianId);
    if (!technician || !canMoveBookingToSlot(bookingForSelectedDate, technician, targetStart)) {
      setDraggedBookingId(null);
      return;
    }

    const targetEnd = addMinutes(
      targetStart,
      Math.max(15, toMinutes(bookingForSelectedDate.endTime) - toMinutes(bookingForSelectedDate.startTime)),
    );

    updateBooking(bookingForSelectedDate.id, {
      ...bookingForSelectedDate,
      technicianId,
      startTime: targetStart,
      endTime: targetEnd,
    });

    setDraggedBookingId(null);
  };

  const handleDropOnUnassigned = (targetStart: string) => {
    if (!draggedBookingId) {
      return;
    }

    const draggedBooking = bookings.find((booking) => booking.id === draggedBookingId);
    if (!draggedBooking) {
      setDraggedBookingId(null);
      return;
    }

    const bookingForSelectedDate =
      draggedBooking.date === selectedDate ? draggedBooking : { ...draggedBooking, date: selectedDate };

    if (!canMoveBookingToUnassignedSlot(bookingForSelectedDate, targetStart)) {
      setDraggedBookingId(null);
      return;
    }

    const targetEnd = addMinutes(
      targetStart,
      Math.max(15, toMinutes(bookingForSelectedDate.endTime) - toMinutes(bookingForSelectedDate.startTime)),
    );

    updateBooking(bookingForSelectedDate.id, {
      ...bookingForSelectedDate,
      technicianId: null,
      startTime: targetStart,
      endTime: targetEnd,
    });

    setDraggedBookingId(null);
  };

  const handleDropBreakOnTechnician = (technicianId: string, targetStart: string) => {
    if (!draggedBreak) {
      return;
    }

    const selectedDayOfWeek = new Date(`${selectedDate}T00:00:00`).getDay();
    const technician = technicians.find((tech) => tech.id === technicianId);
    if (!technician || technician.id !== draggedBreak.technicianId) {
      setDraggedBreak(null);
      setIsDraggingBreak(false);
      setIsPressingBreak(false);
      return;
    }

    if (!canMoveBreakToSlot(technician, draggedBreak.breakIndex, targetStart, draggedBreak.durationMinutes)) {
      setDraggedBreak(null);
      setIsDraggingBreak(false);
      setIsPressingBreak(false);
      return;
    }

    const shift = technician.shifts.find((block) => block.dayOfWeek === selectedDayOfWeek);
    if (!shift) {
      setDraggedBreak(null);
      setIsDraggingBreak(false);
      setIsPressingBreak(false);
      return;
    }

    const targetEnd = addMinutes(targetStart, draggedBreak.durationMinutes);
    const nextBreaks = [...shift.breaks];
    nextBreaks[draggedBreak.breakIndex] = {
      ...nextBreaks[draggedBreak.breakIndex],
      startTime: targetStart,
      endTime: targetEnd,
    };

    const nextTechnician = {
      ...technician,
      shifts: technician.shifts.map((currentShift) =>
        currentShift.dayOfWeek === selectedDayOfWeek ? { ...currentShift, breaks: nextBreaks } : currentShift,
      ),
    };

    updateTechnician(technician.id, nextTechnician);
    setDraggedBreak(null);
    setIsDraggingBreak(false);
    setIsPressingBreak(false);
  };

  const assignmentSuggestions = useMemo(
    () => (assignmentTarget ? getAssignmentSuggestions(assignmentTarget) : []),
    [assignmentTarget, getAssignmentSuggestions],
  );

  return (
    <div className="font-sans">
      <div className="notebook-surface rounded-[22px] border border-[#dadce0] bg-white p-4 shadow-[0_1px_3px_rgba(60,64,67,0.08),0_12px_28px_rgba(60,64,67,0.05)]" style={{ transform: 'none' }}>
        <div className="mb-3 flex items-center justify-between gap-3">
          <div className="flex-1">
            <div className="max-w-[520px] rounded-xl border border-[#dadce0] bg-[#f8f9fa]">
              <button
                type="button"
                onClick={() => setIsSchedulingAlgorithmExpanded((current) => !current)}
                aria-expanded={isSchedulingAlgorithmExpanded}
                aria-controls="scheduling-algorithm-panel"
                className="flex w-full items-start gap-2 px-2.5 py-2 text-left"
              >
                <div className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-[#dadce0] bg-white text-[#5f6368]">
                  <CalendarRange className="h-3.5 w-3.5" aria-hidden="true" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#5f6368]">Scheduling algorithm</p>
                </div>
              </button>

              <div
                id="scheduling-algorithm-panel"
                className={`overflow-hidden px-3 text-[11px] leading-relaxed text-[#3c4043] transition-[max-height,opacity,padding,border] duration-200 ease-out ${
                  isSchedulingAlgorithmExpanded
                    ? 'max-h-64 border-t border-[#dadce0] pb-3 pt-2 opacity-100'
                    : 'max-h-0 border-t-0 pb-0 pt-0 opacity-0'
                }`}
              >
                <p className="font-medium text-[#202124]">
                  Availability = {totalTechniciansWithSkill} - {assignedJobsForSkill} - {unassignedJobsForSkill}
                </p>
                <p className="mt-0.5 font-semibold text-[#1a73e8]">Remaining capacity: {globalAvailability}</p>
                <p>
                  Global math reserves capacity as soon as a job is booked, even before a technician is chosen.
                </p>
                <p className="mt-1">
                  Assigned jobs consume committed slots, and unassigned jobs consume pending slots for the same skill pool.
                </p>
                <p className="mt-1">
                  This prevents double-booking while keeping technician assignment flexible for dispatch.
                </p>
                <p className="mt-1">
                  Assignment suggestions are ranked by route clustering: same-city and same-zip stops score higher to reduce drive time.
                </p>
                <p className="mt-1">
                  The booking flow and assignment panel both apply this ranking so the top recommendation is always actionable.
                </p>
              </div>
            </div>
          </div>
          <div className="rounded-full border border-[#dadce0] bg-[#f8f9fa] transition hover:border-[#9aa0a6] hover:bg-white focus-within:border-[#1a73e8] focus-within:ring-2 focus-within:ring-[#d2e3fc]">
            <button
              type="button"
              onClick={() => dateInputRef.current?.showPicker?.() ?? dateInputRef.current?.click()}
              className="flex items-center gap-2 px-2.5 py-1.5 text-[11px] font-medium uppercase tracking-[0.14em] text-[#5f6368]"
            >
              <span>{formatDateLabel(selectedDate)}</span>
            </button>
            <input
              ref={dateInputRef}
              type="date"
              value={selectedDate}
              onChange={(event) => setSelectedDate(event.target.value)}
              aria-label="Select schedule date"
              className="sr-only"
            />
          </div>
        </div>

        {alert.warning && (
          <div className="mb-3 rounded-xl border border-amber-300 bg-amber-50 px-3 py-2 text-xs text-amber-900">
            <p className="font-semibold uppercase tracking-[0.08em]">Capacity warning</p>
            <p className="mt-1">{alert.warning}</p>
          </div>
        )}

        <div className="overflow-x-auto overflow-y-visible rounded-[16px] border border-[#dadce0] bg-[#f8f9fa]">
          <div style={{ minWidth: `${calendarMinWidth}px` }}>
            <div
              className="grid border-b border-[#dadce0] bg-[#f8f9fa] text-[11px] font-semibold uppercase tracking-[0.12em] text-[#5f6368]"
              style={{ gridTemplateColumns: `90px repeat(${Math.max(visibleColumns.length, 1)}, minmax(${techColumnWidth}px, 1fr))` }}
            >
              <div className="border-r border-[#dadce0] bg-[#f8f9fa] p-2">Time</div>
              {visibleColumns.map((column) => (
                column.kind === 'unassigned' ? (
                  <div key="unassigned-column" className="border-l border-[#dadce0] bg-[#f8f9fa] p-2 text-center">
                    <div className="flex flex-col items-center gap-1.5">
                      <span className="text-[11px] font-medium text-[#202124]">Unassigned</span>
                      <span className="rounded-full border border-red-200 bg-red-50 px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-[0.12em] text-red-600">
                        {unassignedJobs.length}
                      </span>
                    </div>
                  </div>
                ) : (
                  <div key={column.tech.id} className="border-l border-[#dadce0] bg-[#f8f9fa] p-2 text-center">
                    <div className="flex flex-col items-center gap-1.5">
                      <span className="text-[11px] font-medium text-[#202124]">{column.tech.name}</span>
                      <div className="flex flex-wrap justify-center gap-1">
                        {column.tech.skills.map((skill) => (
                          <SkillIconChip key={`${column.tech.id}-${skill}`} skill={skill} />
                        ))}
                      </div>
                    </div>
                  </div>
                )
              ))}
            </div>

            {hours.map((hour) => {
              const start = `${String(hour).padStart(2, '0')}:00`;
              const end = `${String(hour + 1).padStart(2, '0')}:00`;

              return (
                <div
                  key={hour}
                  className="grid border-b border-[#dadce0] last:border-b-0"
                  style={{ gridTemplateColumns: `90px repeat(${Math.max(visibleColumns.length, 1)}, minmax(${techColumnWidth}px, 1fr))` }}
                >
                  <div className="border-r border-[#dadce0] bg-[#f8f9fa] p-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-[#5f6368]">
                    {formatClockTime(start)}
                  </div>

                  {visibleColumns.map((column) => {
                    if (column.kind === 'unassigned') {
                      const token = calendarBookings.find(
                        (booking) =>
                          booking.technicianId === null &&
                          booking.serviceType === selectedSkill &&
                          booking.startTime >= start &&
                          booking.startTime < end,
                      );
                      const hasUnassignedOverlap = calendarBookings.some(
                        (booking) =>
                          booking.technicianId === null &&
                          booking.serviceType === selectedSkill &&
                          overlaps(booking.startTime, booking.endTime, start, end),
                      );
                      const isUnassignedDropAllowed =
                        !!draggedBookingId &&
                        (() => {
                          const draggedBooking = bookings.find((booking) => booking.id === draggedBookingId);
                          if (!draggedBooking) {
                            return false;
                          }

                          const bookingForSelectedDate =
                            draggedBooking.date === selectedDate ? draggedBooking : { ...draggedBooking, date: selectedDate };

                          return canMoveBookingToUnassignedSlot(bookingForSelectedDate, start);
                        })();

                      return (
                        <div
                          key={`unassigned-${hour}`}
                          className={`relative min-h-[72px] overflow-visible border-l border-[#dadce0] bg-white p-1 ${draggedBookingId ? 'cursor-move' : ''}`}
                          onDragOver={(event) => {
                            if (!draggedBookingId) {
                              return;
                            }

                            const draggedBooking = bookings.find((booking) => booking.id === draggedBookingId);
                            if (!draggedBooking) {
                              return;
                            }

                            const bookingForSelectedDate =
                              draggedBooking.date === selectedDate ? draggedBooking : { ...draggedBooking, date: selectedDate };

                            if (!canMoveBookingToUnassignedSlot(bookingForSelectedDate, start)) {
                              return;
                            }

                            event.preventDefault();
                            event.dataTransfer.dropEffect = 'move';
                          }}
                          onDrop={(event) => {
                            event.preventDefault();
                            if (!draggedBookingId) {
                              return;
                            }

                            handleDropOnUnassigned(start);
                          }}
                        >
                          {!hasUnassignedOverlap && (
                            <div
                              className={`calendar-slot h-full rounded-[10px] border border-dashed ${
                                isUnassignedDropAllowed ? 'border-blue-300 bg-blue-100' : 'border-slate-200 bg-slate-50'
                              }`}
                            />
                          )}

                          {token && (
                            <div
                              draggable
                              onMouseDown={() => setIsPressingBooking(true)}
                              onMouseUp={() => setIsPressingBooking(false)}
                              onDragStart={(event) => {
                                setDraggedBookingId(token.id);
                                setIsPressingBooking(false);
                                setIsDraggingBooking(true);
                                event.dataTransfer.effectAllowed = 'move';
                                event.dataTransfer.setData('text/plain', token.id);
                              }}
                              onDragEnd={() => {
                                setDraggedBookingId(null);
                                setIsDraggingBooking(false);
                                setIsPressingBooking(false);
                              }}
                              className={`absolute left-1 right-1 z-10 ${isPressingBooking || isDraggingBooking ? 'cursor-move' : 'cursor-pointer'}`}
                              style={{
                                top: `${((toMinutes(token.startTime) - toMinutes(start)) / 60) * 100}%`,
                                height: `${((toMinutes(token.endTime) - toMinutes(token.startTime)) / 60) * 100}%`,
                                minHeight: '20px',
                              }}
                            >
                              <button
                                type="button"
                                onClick={() => setAssignmentTarget(token)}
                                aria-label={`${token.customerName} ${token.serviceType} ${formatClockTime(token.startTime)} to ${formatClockTime(token.endTime)}`}
                                data-unassigned-clickable="true"
                                className={`calendar-booking-button flex h-full w-full flex-col items-center justify-center rounded-[10px] border px-1.5 text-center text-[9px] font-semibold shadow-sm transition-all duration-150 ease-out ${
                                  draggedBookingId ? 'ring-2 ring-emerald-300 ring-offset-1 ring-offset-white shadow-[0_0_0_1px_rgba(16,185,129,0.2),0_8px_18px_rgba(16,185,129,0.12)]' : ''
                                } ${getBookingTone(token, false)}`}
                              >
                                <span className="max-w-full truncate text-[8px] leading-tight">{token.customerName}</span>
                                <span className="text-[8px] opacity-90">{formatClockTime(token.startTime)}</span>
                                <span className="sr-only">
                                  {token.customerName} {token.serviceType} {formatClockTime(token.startTime)} to{' '}
                                  {formatClockTime(token.endTime)}
                                </span>
                              </button>
                            </div>
                          )}
                        </div>
                      );
                    }

                    const tech = column.tech;
                    const shift = tech.shifts.find((item) => item.dayOfWeek === new Date(`${selectedDate}T00:00:00`).getDay());
                    const token = calendarBookings.find(
                      (booking) =>
                        booking.technicianId === tech.id &&
                        booking.startTime >= start &&
                        booking.startTime < end,
                    );
                    const isInShift = shift ? shift.startTime <= start && end <= shift.endTime : false;
                    const isOutsideHours = !shift || shift.startTime > start || end > shift.endTime;
                    const overlappingBreaks =
                      shift?.breaks
                        .map((block, breakIndex) => ({ block, breakIndex }))
                        .filter(({ block }) => overlaps(block.startTime, block.endTime, start, end)) ?? [];
                    const hasBreakOverlap = overlappingBreaks.length > 0;
                    const isBooked = calendarBookings.some(
                      (booking) => booking.technicianId === tech.id && overlaps(booking.startTime, booking.endTime, start, end),
                    );
                    const hasConflict =
                      !!token && (!shift || token.startTime < shift.startTime || token.endTime > shift.endTime || hasBreakOverlap);
                    const isBreakDropAllowed =
                      !!draggedBreak &&
                      draggedBreak.technicianId === tech.id &&
                      canMoveBreakToSlot(tech, draggedBreak.breakIndex, start, draggedBreak.durationMinutes);

                    const isDropAllowed = draggedBookingId
                      ? (() => {
                          const draggedBooking = bookings.find((booking) => booking.id === draggedBookingId);
                          if (!draggedBooking) {
                            return false;
                          }

                          const bookingForSelectedDate =
                            draggedBooking.date === selectedDate ? draggedBooking : { ...draggedBooking, date: selectedDate };

                          return canMoveBookingToSlot(bookingForSelectedDate, tech, start);
                        })()
                      : false;

                    return (
                      <div
                        key={`${tech.id}-${start}`}
                        className={`relative min-h-[72px] overflow-visible border-l border-[#dadce0] p-1 ${
                          isOutsideHours && !token ? 'bg-[var(--outside-hours-bg)]' : 'bg-white'
                        } ${isDropAllowed || isBreakDropAllowed ? 'cursor-move' : ''}`}
                        onDragOver={(event) => {
                          if (draggedBreak) {
                            if (!isBreakDropAllowed) {
                              return;
                            }

                            event.preventDefault();
                            event.dataTransfer.dropEffect = 'move';
                            return;
                          }

                          if (!draggedBookingId) {
                            return;
                          }

                          const draggedBooking = bookings.find((booking) => booking.id === draggedBookingId);
                          if (!draggedBooking) {
                            return;
                          }

                          const bookingForSelectedDate =
                            draggedBooking.date === selectedDate ? draggedBooking : { ...draggedBooking, date: selectedDate };

                          if (!canMoveBookingToSlot(bookingForSelectedDate, tech, start)) {
                            return;
                          }

                          event.preventDefault();
                          event.dataTransfer.dropEffect = 'move';
                        }}
                        onDrop={(event) => {
                          event.preventDefault();

                          if (draggedBreak) {
                            handleDropBreakOnTechnician(tech.id, start);
                            return;
                          }

                          handleDropOnTechnician(tech.id, start);
                        }}
                      >
                        {isOutsideHours && !token && (
                          <div
                            className="calendar-slot calendar-slot--off-hours h-full cursor-default pointer-events-none"
                            style={{ backgroundColor: 'var(--outside-hours-bg)', borderColor: 'transparent' }}
                          />
                        )}

                        {isInShift && !token && (
                          <div
                            className={`calendar-slot h-full rounded-[10px] border border-dashed ${
                              hasBreakOverlap
                                ? 'border-amber-200 bg-amber-50'
                                : isDropAllowed
                                  ? 'border-emerald-300 bg-emerald-100'
                                  : 'border-[#c7d2fe] bg-[#eef3fd]'
                            }`}
                          />
                        )}

                        {overlappingBreaks.map(({ block, breakIndex }) => {
                          const breakStartWithinHour = Math.max(toMinutes(block.startTime), toMinutes(start));
                          const breakEndWithinHour = Math.min(toMinutes(block.endTime), toMinutes(end));
                          const blockTopPercent = ((breakStartWithinHour - toMinutes(start)) / 60) * 100;
                          const blockHeightPercent = ((breakEndWithinHour - breakStartWithinHour) / 60) * 100;
                          const isLunchBlock = breakIndex === 0;
                          const breakDurationMinutes = Math.max(15, toMinutes(block.endTime) - toMinutes(block.startTime));
                          const normalizedBreakDuration =
                            isLunchBlock && tech.id === 'alice' ? 60 : breakDurationMinutes;
                          const isBreakBeingDragged =
                            !!draggedBreak &&
                            draggedBreak.technicianId === tech.id &&
                            draggedBreak.breakIndex === breakIndex;

                          if (blockHeightPercent <= 0) {
                            return null;
                          }

                          return (
                            <div
                              key={`${tech.id}-${start}-break-${breakIndex}`}
                              draggable
                              onMouseDown={() => setIsPressingBreak(true)}
                              onMouseUp={() => setIsPressingBreak(false)}
                              onDragStart={(event) => {
                                setDraggedBookingId(null);
                                setDraggedBreak({
                                  technicianId: tech.id,
                                  breakIndex,
                                  durationMinutes: normalizedBreakDuration,
                                });
                                setIsPressingBreak(false);
                                setIsDraggingBreak(true);
                                event.dataTransfer.effectAllowed = 'move';
                                event.dataTransfer.setData('text/plain', `break:${tech.id}:${breakIndex}`);
                              }}
                              onDragEnd={() => {
                                setDraggedBreak(null);
                                setIsDraggingBreak(false);
                                setIsPressingBreak(false);
                              }}
                              className={`absolute left-1 right-1 z-10 flex items-center justify-center rounded-[10px] border border-amber-200 bg-amber-100/95 px-1 text-center shadow-[inset_0_0_0_1px_rgba(245,158,11,0.15)] ${
                                isBreakBeingDragged ? 'cursor-move ring-2 ring-amber-300 opacity-80' : 'cursor-grab'
                              }`}
                              style={{
                                top: `${blockTopPercent}%`,
                                height: `${blockHeightPercent}%`,
                                minHeight: '18px',
                              }}
                              aria-label={isLunchBlock ? 'Lunch break' : 'Break'}
                              title={`${isLunchBlock ? 'Lunch' : 'Break'} ${formatClockTime(block.startTime)}-${formatClockTime(block.endTime)}`}
                            >
                              <span className="truncate text-[8px] font-semibold uppercase tracking-[0.08em] text-amber-900">
                                {isLunchBlock ? 'Lunch' : 'Break'}
                              </span>
                            </div>
                          );
                        })}

                        {token && (
                          <div
                            draggable
                            onMouseDown={() => setIsPressingBooking(true)}
                            onMouseUp={() => setIsPressingBooking(false)}
                            onDragStart={(event) => {
                              setDraggedBookingId(token.id);
                              setIsPressingBooking(false);
                              setIsDraggingBooking(true);
                              event.dataTransfer.effectAllowed = 'move';
                              event.dataTransfer.setData('text/plain', token.id);
                            }}
                            onDragEnd={() => {
                              setDraggedBookingId(null);
                              setIsDraggingBooking(false);
                              setIsPressingBooking(false);
                            }}
                            className={`absolute left-1 right-1 z-20 ${isPressingBooking || isDraggingBooking ? 'cursor-move' : 'cursor-default'}`}
                            style={{
                              top: `${((toMinutes(token.startTime) - toMinutes(start)) / 60) * 100}%`,
                              height: `${((toMinutes(token.endTime) - toMinutes(token.startTime)) / 60) * 100}%`,
                              minHeight: '20px',
                            }}
                          >
                            <button
                              type="button"
                              onClick={() => setAssignmentTarget(token)}
                              aria-label={`${token.customerName} ${token.serviceType} ${formatClockTime(token.startTime)} to ${formatClockTime(token.endTime)}`}
                              className={`calendar-booking-button flex h-full w-full flex-col items-center justify-center rounded-[10px] border px-1.5 text-center text-[9px] font-semibold shadow-sm transition-all duration-150 ease-out ${
                                isDropAllowed ? 'ring-2 ring-emerald-300 ring-offset-1 ring-offset-white shadow-[0_0_0_1px_rgba(16,185,129,0.2),0_8px_18px_rgba(16,185,129,0.12)]' : ''
                              } ${hasConflict ? 'border-[#d93025] ring-2 ring-[#fce8e6]' : 'border-[#dadce0]'} ${getBookingTone(token, hasConflict)}`}
                            >
                              <span className="max-w-full truncate text-[8px] leading-tight">{token.customerName}</span>
                              <span className="text-[8px] opacity-90">{formatClockTime(token.startTime)}</span>
                              <span className="sr-only">
                                {token.customerName} {token.serviceType} {formatClockTime(token.startTime)} to {formatClockTime(token.endTime)}
                              </span>
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {assignmentTarget && (
        <div className="fixed inset-y-0 right-0 z-20 w-full max-w-md border-l border-slate-200 bg-white p-5 shadow-2xl">
          <div className="mb-5 flex items-center justify-between">
            <h3 className="text-xl font-semibold text-slate-900">Assignment panel</h3>
            <button type="button" onClick={() => setAssignmentTarget(null)} className="text-sm text-slate-500">
              Close
            </button>
          </div>

          <p className="text-sm text-slate-600">
            {assignmentTarget.customerName} • {assignmentTarget.serviceType} • {formatClockTime(assignmentTarget.startTime)} - {formatClockTime(assignmentTarget.endTime)}
          </p>
          <p className="mt-1 text-sm text-slate-500">
            Address: {assignmentTarget.customerAddress?.trim() || 'Not provided'}
          </p>

          {assignmentSuggestions[0] && (
            <div className="mt-3 rounded-xl border border-emerald-200 bg-emerald-50 p-3">
              <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-emerald-700">Top recommendation</p>
              <p className="mt-1 text-sm font-semibold text-emerald-900">{assignmentSuggestions[0].technicianName}</p>
              <p className="text-xs text-emerald-800">
                {assignmentSuggestions[0].clusterSummary} · score {assignmentSuggestions[0].score.toFixed(1)}
              </p>
            </div>
          )}

          <div className="mt-5 space-y-3">
            {assignmentSuggestions.map((suggestion, index) => (
              <button
                key={suggestion.technicianId}
                type="button"
                onClick={() => assignTechnician(suggestion.technicianId)}
                className="flex w-full items-center justify-between rounded-xl border border-slate-200 bg-slate-50 p-3 text-left hover:border-sky-300"
              >
                <div>
                  <p className="font-medium text-slate-900">{suggestion.technicianName}</p>
                  <p className="mt-1 text-xs text-slate-500">
                    {suggestion.clusterSummary} · score {suggestion.score.toFixed(1)} · projected jobs {suggestion.projectedLoad}
                  </p>
                  <p className="mt-1 text-xs text-slate-500">{suggestion.reasons.join(' • ')}</p>
                </div>
                <span className="rounded-full bg-emerald-100 px-2 py-1 text-[10px] font-semibold uppercase tracking-wide text-emerald-700">
                  {index === 0 ? 'Best fit' : 'Available'}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
