import {
  Calendar,
  CheckCircle2,
  ChevronDown,
  Clock3,
  House,
  ShieldAlert,
  User,
  Zap,
  type LucideIcon,
} from 'lucide-react';
import { useEffect, useMemo, useState, type ComponentProps } from 'react';
import { formatClockTime, useScheduler } from '../useScheduler';
import type { ServiceType, SlotStatus, Technician } from '../types';

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

const skillMeta: Record<ServiceType, { icon: LucideIcon; className: string; softClassName: string }> = {
  Plumbing: { icon: PipeElbowIcon as unknown as LucideIcon, className: 'border-slate-300 bg-slate-600 text-slate-50', softClassName: 'border-slate-200 bg-slate-50 text-slate-700' },
  HVAC: { icon: SnowflakeIcon as unknown as LucideIcon, className: 'border-sky-300 bg-sky-600 text-sky-50', softClassName: 'border-sky-200 bg-sky-50 text-sky-700' },
  Electrical: { icon: Zap, className: 'border-amber-300 bg-amber-500 text-amber-950', softClassName: 'border-amber-200 bg-amber-50 text-amber-700' },
  Drains: { icon: ManholeIcon as unknown as LucideIcon, className: 'border-emerald-300 bg-emerald-600 text-emerald-50', softClassName: 'border-emerald-200 bg-emerald-50 text-emerald-700' },
  Roofing: { icon: House, className: 'border-rose-300 bg-rose-500 text-rose-50', softClassName: 'border-rose-200 bg-rose-50 text-rose-700' },
};

function ServiceBadge({ skill, compact = false }: { skill: ServiceType; compact?: boolean }) {
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

const overlaps = (startA: string, endA: string, startB: string, endB: string): boolean => {
  const toMinutes = (value: string) => {
    const [hours, minutes] = value.split(':').map(Number);
    return hours * 60 + minutes;
  };

  return toMinutes(startA) < toMinutes(endB) && toMinutes(startB) < toMinutes(endA);
};

export default function CustomerBooking() {
  const {
    bookings,
    selectedDate,
    selectedService,
    getSlotsForService,
    getTechniciansForService,
    addBooking,
    setSelectedDate,
    setSelectedService,
  } = useScheduler();
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [customerName, setCustomerName] = useState('');
  const [status, setStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [bookedAppointment, setBookedAppointment] = useState<{
    customerName: string;
    serviceType: ServiceType;
    date: string;
    startTime: string;
    endTime: string;
    technicianName: string;
  } | null>(null);
  const [expandedSections, setExpandedSections] = useState({ service: true, appointment: false });
  const [hasChosenService, setHasChosenService] = useState(false);

  const buildGoogleCalendarUrl = (appointment: {
    customerName: string;
    serviceType: ServiceType;
    date: string;
    startTime: string;
    endTime: string;
    technicianName: string;
  }) => {
    const startDate = new Date(`${appointment.date}T${appointment.startTime}:00`);
    const endDate = new Date(`${appointment.date}T${appointment.endTime}:00`);

    const formatGoogleDate = (date: Date) => {
      const utcDate = new Date(date.toISOString());
      return utcDate.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}Z$/, 'Z');
    };

    const params = new URLSearchParams({
      action: 'TEMPLATE',
      text: `${appointment.customerName} - ${appointment.serviceType} service`,
      dates: `${formatGoogleDate(startDate)}/${formatGoogleDate(endDate)}`,
      details: `Service: ${appointment.serviceType}\nTechnician: ${appointment.technicianName}\nCustomer: ${appointment.customerName}`,
      location: 'Home service appointment',
    });

    return `https://calendar.google.com/calendar/render?${params.toString()}`;
  };

  const toDateOnly = (value: Date): string => {
    const year = value.getFullYear();
    const month = String(value.getMonth() + 1).padStart(2, '0');
    const day = String(value.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const appointmentTimeSections = useMemo(() => {
    const sections: Array<{
      date: string;
      label: string;
      availableSlots: Array<{ time: string; status: 'Available'; auditExplanation: string }>;
    }> = [];
    let totalVisibleSlots = 0;
    const baseDate = new Date(`${selectedDate}T00:00:00`);

    for (let index = 0; index < 14; index += 1) {
      const nextDate = new Date(baseDate);
      nextDate.setDate(baseDate.getDate() + index);
      const dateValue = toDateOnly(nextDate);
      const daySlots = getSlotsForService(dateValue, selectedService).filter(
        (slot): slot is { time: string; status: 'Available'; auditExplanation: string } => slot.status === 'Available',
      );

      if (daySlots.length === 0) {
        continue;
      }

      const remainingCapacity = 5 - totalVisibleSlots;
      const nextDaySlots = remainingCapacity <= 0 ? [] : daySlots.slice(0, remainingCapacity);

      sections.push({
        date: dateValue,
        label: new Date(`${dateValue}T00:00:00`).toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' }),
        availableSlots: nextDaySlots,
      });

      totalVisibleSlots += nextDaySlots.length;

      if (totalVisibleSlots >= 5) {
        break;
      }
    }

    return sections;
  }, [getSlotsForService, selectedDate, selectedService]);

  const selectedDayLabel = useMemo(
    () => new Date(`${selectedDate}T00:00:00`).toLocaleDateString('en-US', { weekday: 'long' }),
    [selectedDate],
  );

  const slots = useMemo(() => getSlotsForService(selectedDate, selectedService), [getSlotsForService, selectedDate, selectedService]);
  const certifiedTechnicians = useMemo(
    () => getTechniciansForService(selectedService, selectedDate),
    [getTechniciansForService, selectedDate, selectedService],
  );

  const technicianForSelectedSlot = useMemo<Technician | null>(() => {
    if (!selectedTime) {
      return null;
    }

    const [startHour] = selectedTime.split(':').map(Number);
    const start = selectedTime;
    const end = `${String(startHour + 1).padStart(2, '0')}:00`;

    return (
      certifiedTechnicians.find((technician) => {
        const shift = technician.shifts.find((block) => block.dayOfWeek === new Date(`${selectedDate}T00:00:00`).getDay());
        if (!shift) {
          return false;
        }

        if (start < shift.startTime || end > shift.endTime) {
          return false;
        }

        if (shift.breaks.some((block) => overlaps(start, end, block.startTime, block.endTime))) {
          return false;
        }

        return !bookings.some(
          (booking) =>
            booking.date === selectedDate &&
            booking.technicianId === technician.id &&
            overlaps(booking.startTime, booking.endTime, start, end),
        );
      }) ?? null
    );
  }, [bookings, certifiedTechnicians, selectedDate, selectedTime]);

  const toggleSection = (section: 'service' | 'appointment') => {
    setExpandedSections((current) => ({ ...current, [section]: !current[section] }));
  };

  const formatBookingDate = (dateString: string) => {
    const date = new Date(`${dateString}T00:00:00`);
    const ordinal = (day: number) => {
      if (day % 100 >= 11 && day % 100 <= 13) return 'th';
      switch (day % 10) {
        case 1: return 'st';
        case 2: return 'nd';
        case 3: return 'rd';
        default: return 'th';
      }
    };

    const weekday = date.toLocaleDateString('en-US', { weekday: 'long' });
    return `${weekday} the ${date.getDate()}${ordinal(date.getDate())}`;
  };

  const formatBookingTime = (timeString: string) => {
    const [rawHours, minutes] = timeString.split(':').map(Number);
    const suffix = rawHours >= 12 ? 'pm' : 'am';
    const normalizedHours = rawHours % 12 || 12;
    return `${normalizedHours}${minutes === 0 ? '' : `:${String(minutes).padStart(2, '0')}`}${suffix}`;
  };

  const handleBookAppointment = () => {
    if (!selectedTime) {
      setStatus({ type: 'error', message: 'Please choose an available appointment time first.' });
      return;
    }

    if (!customerName.trim()) {
      setStatus({ type: 'error', message: 'Please enter your name before confirming the booking.' });
      return;
    }

    if (!technicianForSelectedSlot) {
      setStatus({ type: 'error', message: 'That slot is no longer available. Please choose another time.' });
      return;
    }

    const [startHour] = selectedTime.split(':').map(Number);
    const endTime = `${String(startHour + 1).padStart(2, '0')}:00`;

    addBooking({
      id: `booking-${Date.now()}`,
      customerName: customerName.trim(),
      serviceType: selectedService,
      date: selectedDate,
      startTime: selectedTime,
      endTime,
      technicianId: technicianForSelectedSlot.id,
    });

    const appointment = {
      customerName: customerName.trim(),
      serviceType: selectedService,
      date: selectedDate,
      startTime: selectedTime,
      endTime,
      technicianName: technicianForSelectedSlot.name,
    };

    setBookedAppointment(appointment);
    setStatus({
      type: 'success',
      message: `${appointment.customerName} is booked for ${appointment.serviceType} on ${appointment.date} at ${formatClockTime(appointment.startTime)} with ${appointment.technicianName}.`,
    });
    setCustomerName('');
    setSelectedTime(null);
  };

  return (
    <div className="mx-auto max-w-4xl">
      <div className="rounded-[28px] border border-[#e7ebf0] bg-white p-3 shadow-[0_18px_40px_rgba(15,23,42,0.08)] sm:p-5">
        <div className="overflow-hidden rounded-[22px] border border-[#e7ebf0] bg-white">
          <div className="divide-y divide-[#edf2f7]">
            <div className="bg-white">
              <button
                type="button"
                onClick={() => toggleSection('service')}
                className="flex w-full items-center justify-between gap-3 px-5 py-4 text-left"
                aria-expanded={expandedSections.service}
              >
                <div className="flex items-center gap-3">
                  <span className="flex h-7 w-7 items-center justify-center rounded-full bg-sky-100 text-[11px] font-semibold text-sky-700">
                    1
                  </span>
                  <span className="text-base font-medium text-slate-700">Choose service type</span>
                </div>
                <ChevronDown className={`h-4 w-4 text-slate-500 transition ${expandedSections.service ? 'rotate-180' : ''}`} />
              </button>

              {expandedSections.service && (
                <div className="px-5 pb-5 pt-1">
                  <div className="flex flex-wrap gap-3 sm:gap-4">
                    {serviceOptions.map((service) => {
                      const isSelected = selectedService === service;
                      const Icon = skillMeta[service].icon;

                      return (
                        <button
                          key={service}
                          type="button"
                          onClick={() => {
                            setSelectedService(service);
                            setSelectedTime(null);
                            setStatus(null);
                            setHasChosenService(true);
                            setExpandedSections({ service: true, appointment: true });
                          }}
                          className={`inline-flex items-center gap-2 rounded-full border px-2.5 py-1.5 text-left text-sm transition ${
                            isSelected
                              ? 'border-sky-600 bg-sky-600 text-white shadow-sm'
                              : 'border-slate-200 bg-white text-slate-600 hover:border-sky-200 hover:bg-sky-50 hover:text-sky-700'
                          }`}
                        >
                          <span
                            className={`inline-flex h-7 w-7 items-center justify-center rounded-full border ${
                              isSelected ? 'border-white/60 bg-white/15 text-white' : skillMeta[service].softClassName
                            }`}
                          >
                            <Icon className="h-3.5 w-3.5" aria-hidden="true" />
                          </span>
                          <span>{service}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {hasChosenService && (
              <div className="bg-white">
                <button
                  type="button"
                  onClick={() => toggleSection('appointment')}
                  className="flex w-full items-center justify-between gap-3 px-5 py-4 text-left"
                  aria-expanded={expandedSections.appointment}
                >
                  <div className="flex items-center gap-3">
                    <span className="flex h-7 w-7 items-center justify-center rounded-full bg-sky-100 text-[11px] font-semibold text-sky-700">
                      2
                    </span>
                    <span className="text-base font-medium text-slate-700">Choose date and time</span>
                  </div>
                  <ChevronDown className={`h-4 w-4 text-slate-500 transition ${expandedSections.appointment ? 'rotate-180' : ''}`} />
                </button>

                {expandedSections.appointment && (
                  <div className="px-5 pb-5 pt-1">
                    <div className="space-y-3">
                      {appointmentTimeSections.length > 0 ? (
                        appointmentTimeSections.map(({ date, label, availableSlots }) => {
                          const isSelected = selectedDate === date;
                          const weekdayLabel = new Date(`${date}T00:00:00`).toLocaleDateString('en-US', { weekday: 'short' });

                          return (
                            <div
                              key={date}
                              className={`rounded-[20px] border ${
                                isSelected ? 'border-sky-200 bg-sky-50/70' : 'border-slate-200 bg-white'
                              }`}
                            >
                              <button
                                type="button"
                                onClick={() => {
                                  setSelectedDate(date);
                                  setSelectedTime(null);
                                  setStatus(null);
                                }}
                                className="flex w-full items-center justify-between gap-3 px-3 py-3 text-left transition text-slate-700 hover:bg-sky-50/60"
                              >
                                <div>
                                  <div className="text-sm font-semibold text-slate-800">{weekdayLabel}</div>
                                  <div className="text-xs text-slate-500">{label}</div>
                                </div>
                                <span className="rounded-full border border-slate-200 bg-white px-2 py-0.5 text-[11px] font-medium text-slate-600">
                                  {availableSlots.length} open
                                </span>
                              </button>

                              {isSelected && (
                                <div className="border-t border-slate-200 px-3 pb-3 pt-3">
                                  <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                                    {availableSlots.map((slot) => {
                                      const formattedTime = formatClockTime(slot.time);
                                      const isSelectedTime = selectedTime === slot.time;

                                      return (
                                        <button
                                          key={`${date}-${slot.time}`}
                                          type="button"
                                          onClick={() => {
                                            setSelectedDate(date);
                                            setSelectedTime(slot.time);
                                            setStatus(null);
                                          }}
                                          className={`rounded-[var(--radius)] border px-3 py-2 text-left text-base transition ${
                                            isSelectedTime
                                              ? 'border-sky-600 bg-sky-600 text-white'
                                              : 'border-slate-200 bg-white text-slate-600 hover:border-sky-200 hover:bg-sky-50 hover:text-sky-700'
                                          }`}
                                        >
                                          <div className="flex items-center justify-between gap-2">
                                            <span>{formattedTime}</span>
                                            <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
                                          </div>
                                        </button>
                                      );
                                    })}
                                  </div>
                                </div>
                              )}
                            </div>
                          );
                        })
                      ) : (
                        <p className="rounded-[20px] border border-slate-200 bg-slate-50 px-3 py-4 text-sm text-slate-500">
                          No appointment times are available in the next few days for this service.
                        </p>
                      )}
                    </div>

                    {selectedDate && (
                      <p className="mt-4 text-sm text-slate-600">
                        Selected day: <span className="font-semibold text-slate-800">{selectedDayLabel}</span>
                      </p>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          {status && (
            <div className="border-t border-[#edf2f7] bg-white px-5 py-4">
              <div
                className={`rounded-xl border px-3 py-2 text-sm ${
                  status.type === 'success'
                    ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
                    : 'border-rose-200 bg-rose-50 text-rose-700'
                }`}
              >
                {status.message}

                {status.type === 'success' && bookedAppointment && (
                  <a
                    href={buildGoogleCalendarUrl(bookedAppointment)}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-[var(--radius)] border border-emerald-300 bg-white px-4 py-2.5 font-medium text-emerald-700 transition hover:bg-emerald-50"
                  >
                    <Calendar className="h-4 w-4" aria-hidden="true" />
                    Add to Google Calendar
                  </a>
                )}
              </div>
            </div>
          )}

          {selectedTime && technicianForSelectedSlot && (
            <div className="border-t border-[#edf2f7] bg-white px-5 py-4">
              <div className="rounded-[18px] border border-slate-200 bg-slate-50 p-4 shadow-sm">
                <div className="flex items-end justify-between gap-4">
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-500">Selected</p>
                    <p className="mt-2 text-lg font-semibold text-slate-800">
                      {formatClockTime(selectedTime)} - {formatClockTime(`${String(Number.parseInt(selectedTime.slice(0, 2), 10) + 1).padStart(2, '0')}:00`)}
                    </p>
                  </div>
                  <div className="flex justify-end">
                    <div className={`rounded-full border px-2.5 py-1 text-xs font-medium ${skillMeta[selectedService].className}`}>
                      Technician: {technicianForSelectedSlot.name}
                    </div>
                  </div>
                </div>

                <label htmlFor="customer-name" className="mt-4 block text-sm font-medium text-slate-700">
                  Your name
                  <div className="relative mt-2">
                    <User className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-slate-400" aria-hidden="true" />
                    <input
                      id="customer-name"
                      type="text"
                      value={customerName}
                      onChange={(event) => setCustomerName(event.target.value)}
                      placeholder="Enter your name"
                      className="w-full rounded-[var(--radius)] border border-slate-300 bg-white py-2.5 pl-9 pr-3 text-sm text-slate-900 outline-none transition focus:border-sky-400"
                    />
                  </div>
                </label>

                <button
                  type="button"
                  onClick={handleBookAppointment}
                  className="mt-4 inline-flex w-full items-center justify-center rounded-[var(--radius)] bg-sky-600 px-4 py-3 text-sm font-medium text-white transition hover:bg-sky-500"
                >
                  Book this appointment
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
