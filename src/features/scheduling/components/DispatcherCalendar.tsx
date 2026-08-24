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

function SkillBadge({ skill, compact = false }: { skill: ServiceType; compact?: boolean }) {
  const Icon = skillMeta[skill].icon;

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border font-semibold ${skillMeta[skill].className} ${
        compact ? 'px-1.5 py-0.5 text-[9px]' : 'px-2 py-0.5 text-[10px]'
      }`}
    >
      <Icon className="h-3 w-3" aria-hidden="true" />
      {skill}
    </span>
  );
}

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
    formatDateLabel,
    hours,
    updateBooking,
    updateTechnician,
  } = useScheduler();

  const selectedSkill = selectedService;
  const dateInputRef = useRef<HTMLInputElement | null>(null);
  const [assignmentTarget, setAssignmentTarget] = useState<Booking | null>(null);
  const [draggedBookingId, setDraggedBookingId] = useState<string | null>(null);
  const [draggedBreak, setDraggedBreak] = useState<{ technicianId: string; breakIndex: number } | null>(null);
  const [isDraggingBooking, setIsDraggingBooking] = useState(false);
  const [isPressingBooking, setIsPressingBooking] = useState(false);
  const [isCapacityAlertExpanded, setIsCapacityAlertExpanded] = useState(false);
  const [calendarMonth, setCalendarMonth] = useState(() => new Date(`${selectedDate}T00:00:00`));
  const [showDatePicker, setShowDatePicker] = useState(false);

  useEffect(() => {
    setCalendarMonth(new Date(`${selectedDate}T00:00:00`));
  }, [selectedDate]);

  useEffect(() => {
    const shouldShowMoveCursor = isDraggingBooking || isPressingBooking;

    if (!shouldShowMoveCursor) {
      document.body.style.cursor = '';
      return;
    }

    document.body.style.cursor = 'move';
    return () => {
      document.body.style.cursor = '';
    };
  }, [isDraggingBooking, isPressingBooking]);

  const visibleTechs = useMemo(
    () =>
      technicians.filter((tech) =>
        tech.shifts.some((shift) => shift.dayOfWeek === new Date(`${selectedDate}T00:00:00`).getDay()),
      ),
    [selectedDate, technicians],
  );

  const techColumnWidth = 180;
  const calendarMinWidth = Math.max(760, 90 + visibleTechs.length * techColumnWidth);

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
  const activeTechnicianCount = technicians.filter((tech) =>
    tech.shifts.some((shift) => shift.dayOfWeek === new Date(`${selectedDate}T00:00:00`).getDay()),
  ).length;
  const activeBookedHours = bookings
    .filter((booking) => booking.date === selectedDate && booking.technicianId !== null)
    .reduce(
      (sum, booking) =>
        sum + (Number.parseInt(booking.endTime.slice(0, 2), 10) - Number.parseInt(booking.startTime.slice(0, 2), 10)),
      0,
    );

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
    targetEnd: string,
  ) => {
    if (!technician.skills.includes(booking.serviceType)) {
      return false;
    }

    const shift = technician.shifts.find((block) => block.dayOfWeek === new Date(`${booking.date}T00:00:00`).getDay());
    if (!shift) {
      return false;
    }

    const toMinutes = (value: string) => {
      const [hours, minutes] = value.split(':').map(Number);
      return hours * 60 + minutes;
    };

    const overlaps = (startA: string, endA: string, startB: string, endB: string): boolean =>
      toMinutes(startA) < toMinutes(endB) && toMinutes(startB) < toMinutes(endA);

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

  const canMoveBreakToSlot = (
    technician: (typeof technicians)[number],
    breakIndex: number,
    targetStart: string,
    targetEnd: string,
  ) => {
    const shift = technician.shifts.find((block) => block.dayOfWeek === new Date(`${selectedDate}T00:00:00`).getDay());
    if (!shift) {
      return false;
    }

    const toMinutes = (value: string) => {
      const [hours, minutes] = value.split(':').map(Number);
      return hours * 60 + minutes;
    };

    const overlaps = (startA: string, endA: string, startB: string, endB: string): boolean =>
      toMinutes(startA) < toMinutes(endB) && toMinutes(startB) < toMinutes(endA);

    if (toMinutes(targetStart) < toMinutes(shift.startTime) || toMinutes(targetEnd) > toMinutes(shift.endTime)) {
      return false;
    }

    if (shift.breaks.some((block, index) => index !== breakIndex && overlaps(targetStart, targetEnd, block.startTime, block.endTime))) {
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

  const handleDropOnTechnician = (technicianId: string, targetStart: string, targetEnd: string) => {
    if (!draggedBookingId) {
      return;
    }

    const draggedBooking = bookings.find((booking) => booking.id === draggedBookingId);
    if (!draggedBooking) {
      setDraggedBookingId(null);
      return;
    }

    const technician = technicians.find((tech) => tech.id === technicianId);
    if (!technician || !canMoveBookingToSlot(draggedBooking, technician, targetStart, targetEnd)) {
      setDraggedBookingId(null);
      return;
    }

    updateBooking(draggedBooking.id, {
      ...draggedBooking,
      technicianId,
      startTime: targetStart,
      endTime: targetEnd,
    });

    setDraggedBookingId(null);
  };

  const handleDropBreakOnTechnician = (technicianId: string, targetStart: string, targetEnd: string) => {
    if (!draggedBreak || draggedBreak.technicianId !== technicianId) {
      return;
    }

    const technician = technicians.find((tech) => tech.id === technicianId);
    if (!technician) {
      setDraggedBreak(null);
      return;
    }

    if (!canMoveBreakToSlot(technician, draggedBreak.breakIndex, targetStart, targetEnd)) {
      setDraggedBreak(null);
      return;
    }

    const shift = technician.shifts.find((block) => block.dayOfWeek === new Date(`${selectedDate}T00:00:00`).getDay());
    if (!shift) {
      setDraggedBreak(null);
      return;
    }

    const nextBreaks = shift.breaks.map((block, index) =>
      index === draggedBreak.breakIndex ? { ...block, startTime: targetStart, endTime: targetEnd } : block,
    );

    updateTechnician(technician.id, {
      ...technician,
      shifts: technician.shifts.map((block) =>
        block.dayOfWeek === new Date(`${selectedDate}T00:00:00`).getDay() ? { ...block, breaks: nextBreaks } : block,
      ),
    });

    setDraggedBreak(null);
  };

  const assignmentTechnicians = useMemo(
    () =>
      assignmentTarget
        ? technicians.filter(
            (tech) =>
              tech.skills.includes(assignmentTarget.serviceType) &&
              tech.shifts.some((shift) => shift.dayOfWeek === new Date(`${assignmentTarget.date}T00:00:00`).getDay()),
          )
        : [],
    [assignmentTarget, technicians],
  );

  return (
    <div className="font-sans">
      <div className="notebook-surface rounded-[22px] border border-[#dadce0] bg-white p-4 shadow-[0_1px_3px_rgba(60,64,67,0.08),0_12px_28px_rgba(60,64,67,0.05)]" style={{ transform: 'none' }}>
        <div className="mb-3 flex items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2 text-[9px] font-medium uppercase tracking-[0.12em] text-[#5f6368]">
            <div className="flex items-center gap-1.5 rounded-full border border-[#c7d2fe] bg-[#eef3fd] px-2 py-1">
              <span className="h-2.5 w-2.5 rounded border border-dashed border-[#93c5fd] bg-[#dbeafe]" />
              Working
            </div>
            <div className="flex items-center gap-1.5 rounded-full border border-[#facc15] bg-[#fef3c7] px-2 py-1">
              <span className="h-2.5 w-2.5 rounded border border-[#f59e0b] bg-[#fef3c7]" />
              Break
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

        <div className="overflow-x-auto overflow-y-visible rounded-[16px] border border-[#dadce0] bg-[#f8f9fa]">
          <div style={{ minWidth: `${calendarMinWidth}px` }}>
            <div
              className="grid border-b border-[#dadce0] bg-[#f8f9fa] text-[11px] font-semibold uppercase tracking-[0.12em] text-[#5f6368]"
              style={{ gridTemplateColumns: `90px repeat(${Math.max(visibleTechs.length, 1)}, minmax(${techColumnWidth}px, 1fr))` }}
            >
              <div className="border-r border-[#dadce0] bg-[#f8f9fa] p-2">Time</div>
              {visibleTechs.map((tech) => (
                <div key={tech.id} className="border-l border-[#dadce0] bg-[#f8f9fa] p-2 text-center">
                  <div className="flex flex-col items-center gap-1.5">
                    <span className="text-[11px] font-medium text-[#202124]">{tech.name}</span>
                    <div className="flex flex-wrap justify-center gap-1">
                      {tech.skills.map((skill) => (
                        <SkillIconChip key={`${tech.id}-${skill}`} skill={skill} />
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {hours.map((hour) => {
              const start = `${String(hour).padStart(2, '0')}:00`;
              const end = `${String(hour + 1).padStart(2, '0')}:00`;

              return (
                <div
                  key={hour}
                  className="grid border-b border-[#dadce0] last:border-b-0"
                  style={{ gridTemplateColumns: `90px repeat(${Math.max(visibleTechs.length, 1)}, minmax(${techColumnWidth}px, 1fr))` }}
                >
                  <div className="border-r border-[#dadce0] bg-[#f8f9fa] p-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-[#5f6368]">
                    {formatClockTime(`${String(hour).padStart(2, '0')}:00`)}
                  </div>

                  {visibleTechs.map((tech) => {
                    const shift = tech.shifts.find((item) => item.dayOfWeek === new Date(`${selectedDate}T00:00:00`).getDay());
                    const token = calendarBookings.find(
                      (booking) => booking.technicianId === tech.id && booking.startTime <= start && booking.endTime > start,
                    );
                    const isInShift = shift ? shift.startTime <= start && end <= shift.endTime : false;
                    const isOutsideHours = !shift || shift.startTime > start || end > shift.endTime;
                    const matchedBreak = shift?.breaks.find((block) => start >= block.startTime && end <= block.endTime);
                    const breakWindow = matchedBreak !== undefined;
                    const isBooked = token !== undefined;
                    const hasConflict =
                      isBooked && (!shift || token.startTime < shift.startTime || token.endTime > shift.endTime || !!breakWindow);

                    const isDropAllowed = draggedBookingId
                      ? (() => {
                          const draggedBooking = bookings.find((booking) => booking.id === draggedBookingId);
                          if (!draggedBooking) {
                            return false;
                          }

                          return canMoveBookingToSlot(draggedBooking, tech, start, end);
                        })()
                      : draggedBreak && draggedBreak.technicianId === tech.id
                        ? canMoveBreakToSlot(tech, draggedBreak.breakIndex, start, end)
                        : false;

                    return (
                      <div
                        key={`${tech.id}-${hour}`}
                        className={`relative min-h-[72px] border-l border-[#dadce0] ${
                          isOutsideHours && !breakWindow && !token ? 'bg-[var(--outside-hours-bg)]' : 'bg-white'
                        } p-1 ${isDropAllowed ? 'cursor-move bg-slate-50' : ''}`}
                        onDragOver={(event) => {
                          if (draggedBreak) {
                            if (draggedBreak.technicianId !== tech.id) {
                              return;
                            }

                            if (!canMoveBreakToSlot(tech, draggedBreak.breakIndex, start, end)) {
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

                          if (!canMoveBookingToSlot(draggedBooking, tech, start, end)) {
                            return;
                          }

                          event.preventDefault();
                          event.dataTransfer.dropEffect = 'move';
                        }}
                        onDrop={(event) => {
                          event.preventDefault();

                          if (draggedBreak) {
                            handleDropBreakOnTechnician(tech.id, start, end);
                            return;
                          }

                          handleDropOnTechnician(tech.id, start, end);
                        }}
                      >
                        {isOutsideHours && !breakWindow && !token && (
                          <div
                            className="calendar-slot calendar-slot--off-hours h-full cursor-default pointer-events-none"
                            style={{ backgroundColor: 'var(--outside-hours-bg)', borderColor: 'transparent' }}
                          />
                        )}

                        {isInShift && !breakWindow && !token && (
                          <div className="calendar-slot h-full rounded-[10px] border border-dashed border-[#c7d2fe] bg-[#eef3fd]" />
                        )}

                        {breakWindow && matchedBreak && (
                          <div
                            draggable
                            onMouseDown={() => setIsPressingBooking(true)}
                            onMouseUp={() => setIsPressingBooking(false)}
                            onDragStart={(event) => {
                              const breakIndex = shift?.breaks.indexOf(matchedBreak) ?? 0;
                              setDraggedBreak({ technicianId: tech.id, breakIndex });
                              setDraggedBookingId(null);
                              setIsPressingBooking(false);
                              setIsDraggingBooking(true);
                              event.dataTransfer.effectAllowed = 'move';
                              event.dataTransfer.setData('text/plain', `${tech.id}:${breakIndex}`);
                            }}
                            onDragEnd={() => {
                              setDraggedBreak(null);
                              setIsDraggingBooking(false);
                              setIsPressingBooking(false);
                            }}
                            className={`calendar-slot flex h-full items-center justify-center rounded-[10px] border border-[#facc15] bg-[#fef3c7] text-[9px] uppercase tracking-[0.12em] text-[#92400e] ${isPressingBooking || isDraggingBooking ? 'cursor-move' : ''}`}
                          >
                            {shift?.breaks.indexOf(matchedBreak) === 0 ? 'Lunch' : 'Break'}
                          </div>
                        )}

                        {token && (
                          <button
                            type="button"
                            draggable
                            onMouseDown={() => setIsPressingBooking(true)}
                            onMouseUp={() => setIsPressingBooking(false)}
                            onDragStart={(event) => {
                              setDraggedBookingId(token.id);
                              setDraggedBreak(null);
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
                            onClick={() => setAssignmentTarget(token)}
                            aria-label={`${token.customerName} ${token.serviceType} ${formatClockTime(token.startTime)} to ${formatClockTime(token.endTime)}`}
                            className={`calendar-booking-button flex h-full w-full items-center justify-center rounded-[10px] border px-1 text-[9px] font-semibold uppercase tracking-[0.1em] shadow-sm transition-all duration-150 ease-out ${isPressingBooking || isDraggingBooking ? 'cursor-move' : 'cursor-default'} ${hasConflict ? 'border-[#d93025] ring-2 ring-[#fce8e6]' : 'border-[#dadce0]'} ${getBookingTone(token, hasConflict)}`}
                          >
                            {token.serviceType}
                          </button>
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

          <div className="mt-5 space-y-3">
            {assignmentTechnicians.map((tech) => (
              <button
                key={tech.id}
                type="button"
                onClick={() => assignTechnician(tech.id)}
                className="flex w-full items-center justify-between rounded-xl border border-slate-200 bg-slate-50 p-3 text-left hover:border-sky-300"
              >
                <div>
                  <p className="font-medium text-slate-900">{tech.name}</p>
                  <div className="mt-1 flex flex-wrap gap-1">
                    {tech.skills.map((skill) => (
                      <SkillBadge key={`${tech.id}-${skill}`} skill={skill} compact />
                    ))}
                  </div>
                </div>
                <span className="rounded-full bg-emerald-100 px-2 py-1 text-[10px] font-semibold uppercase tracking-wide text-emerald-700">
                  Available
                </span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
