import { useMemo, useState } from 'react';
import { Check, Command, X } from 'lucide-react';
import { useScheduler } from '../useScheduler';
import type { ServiceType, Technician } from '../types';

type CommandDraft = {
  kind: 'availability' | 'skill' | 'booking' | 'clarify';
  technicianName?: string;
  dayName?: string;
  skill?: ServiceType;
  serviceType?: ServiceType;
  customerName?: string;
  time?: string;
  date?: string;
  message: string;
};

const serviceOptions: ServiceType[] = ['Plumbing', 'HVAC', 'Electrical', 'Drains', 'Roofing'];
const dayMap: Record<string, number> = {
  sunday: 0,
  monday: 1,
  tuesday: 2,
  wednesday: 3,
  thursday: 4,
  friday: 5,
  saturday: 6,
};

const normalizeDayName = (value?: string): string | undefined => {
  if (!value) {
    return undefined;
  }

  const trimmed = value.trim().toLowerCase().replace(/[.,!?]+$/g, '');
  if (!trimmed) {
    return undefined;
  }

  const withoutPlural = trimmed.endsWith('s') ? trimmed.slice(0, -1) : trimmed;
  return dayMap[withoutPlural] !== undefined ? withoutPlural : undefined;
};

const parseDispatcherCommand = (value: string): CommandDraft => {
  const command = value.trim();

  if (!command) {
    return { kind: 'clarify', message: 'I need a command to act on. Try “Dave is out on Tuesdays for the next month.”' };
  }

  const normalized = command.toLowerCase();

  const availabilityMatch = command.match(
    /^(.+?)\s+is\s+out\s+on\s+([a-z]+(?:\s+and\s+[a-z]+)?)(?:\s+for\s+the\s+next\s+(?:\d+\s+)?(?:weeks?|months?))?$/i,
  );
  if (availabilityMatch) {
    const technicianName = availabilityMatch[1]?.trim();
    const dayName = availabilityMatch[2]?.trim();
    return {
      kind: 'availability',
      technicianName,
      dayName,
      message: `I understood you want to mark ${technicianName} as unavailable on ${dayName}. Did I get this right?`,
    };
  }

  const skillMatch = command.match(/(.+?)\s+finished\s+their\s+(.+?)\s+certification/i);
  if (skillMatch) {
    const technicianName = skillMatch[1]?.trim();
    const skillName = skillMatch[2]?.trim();
    const skill = serviceOptions.find((option) => option.toLowerCase() === skillName.toLowerCase());
    return {
      kind: 'skill',
      technicianName,
      skill,
      message: skill
        ? `I understood you want to add ${skill} to ${technicianName}. Did I get this right?`
        : `I understood you want to update ${technicianName}'s skills. I need a valid service type like Plumbing or HVAC.`,
    };
  }

  const bookingMatch = command.match(/schedule\s+(.+?)\s+for\s+(.+?)\s+at\s+(\d{1,2}(?::\d{2})?\s*(?:am|pm)?)\s+on\s+(.+)/i);
  if (bookingMatch) {
    const serviceType = serviceOptions.find((option) => option.toLowerCase() === bookingMatch[1]?.trim().toLowerCase());
    const customerName = bookingMatch[2]?.trim();
    const time = bookingMatch[3]?.trim();
    const dateText = bookingMatch[4]?.trim();

    return {
      kind: 'booking',
      serviceType,
      customerName,
      time,
      date: dateText,
      message: serviceType
        ? `I understood you want to schedule ${serviceType} for ${customerName} at ${time} on ${dateText}. Did I get this right?`
        : `I understood you want to create a booking for ${customerName}, but I need a valid service type.`,
    };
  }

  if (normalized.includes('mark') && normalized.includes('out')) {
    return {
      kind: 'clarify',
      message: 'I can mark that technician as out, but I need a bit more info: which day or date range will they be unavailable?',
    };
  }

  return {
    kind: 'clarify',
    message: 'I can help with technician availability, skill updates, or booking creation. Try one of the examples above.',
  };
};

export default function AssistantCommandBar() {
  const { technicians, updateTechnician, addBooking, selectedDate, selectedService, setSelectedService } = useScheduler();
  const [inputValue, setInputValue] = useState('');
  const [draft, setDraft] = useState<CommandDraft | null>(null);

  const parsedCommand = useMemo(() => parseDispatcherCommand(inputValue), [inputValue]);

  const handleSubmit = () => {
    setDraft(parsedCommand);
  };

  const confirmChange = () => {
    if (!draft) {
      return;
    }

    if (draft.kind === 'availability') {
      const technician = technicians.find(
        (item) => item.name.toLowerCase() === draft.technicianName?.toLowerCase(),
      );
      const normalizedDay = normalizeDayName(draft.dayName);
      const dayIndex = normalizedDay ? dayMap[normalizedDay] : undefined;

      if (!technician || dayIndex === undefined) {
        setDraft({
          kind: 'clarify',
          message: `I could not match ${draft.technicianName ?? 'that technician'} to a known roster entry or a valid day name.`,
        });
        return;
      }

      const nextTechnician: Technician = {
        ...technician,
        shifts: technician.shifts.filter((shift) => shift.dayOfWeek !== dayIndex),
      };
      updateTechnician(technician.id, nextTechnician);
      setDraft(null);
      setInputValue('');
      return;
    }

    if (draft.kind === 'skill') {
      const technician = technicians.find(
        (item) => item.name.toLowerCase() === draft.technicianName?.toLowerCase(),
      );
      if (!technician || !draft.skill) {
        setDraft({
          kind: 'clarify',
          message: `I could not update ${draft.technicianName ?? 'that technician'} because the skill or technician was not recognized.`,
        });
        return;
      }

      const nextTechnician: Technician = {
        ...technician,
        skills: technician.skills.includes(draft.skill) ? technician.skills : [...technician.skills, draft.skill],
      };
      updateTechnician(technician.id, nextTechnician);
      setDraft(null);
      setInputValue('');
      return;
    }

    if (draft.kind === 'booking') {
      if (!draft.serviceType || !draft.customerName || !draft.time) {
        setDraft({
          kind: 'clarify',
          message: 'I need a valid service type, customer name, and time for a booking command.',
        });
        return;
      }

      const normalizedTime = draft.time.trim().toLowerCase();
      const meridiem = normalizedTime.includes('pm') ? 'pm' : normalizedTime.includes('am') ? 'am' : null;
      const timeOnly = normalizedTime.replace(/\s*(am|pm)/i, '');
      const [startHourRaw, startMinuteRaw = '0'] = timeOnly.split(':').map((value) => value.trim());
      let startHour = Number(startHourRaw);
      const startMinute = Number(startMinuteRaw);

      if (meridiem === 'pm' && startHour < 12) {
        startHour += 12;
      }
      if (meridiem === 'am' && startHour === 12) {
        startHour = 0;
      }

      const startMinutes = startHour * 60 + startMinute;
      const endMinutes = startMinutes + 60;
      const startTime = `${String(Math.floor(startMinutes / 60)).padStart(2, '0')}:${String(startMinutes % 60).padStart(2, '0')}`;
      const endTime = `${String(Math.floor(endMinutes / 60)).padStart(2, '0')}:${String(endMinutes % 60).padStart(2, '0')}`;

      addBooking({
        id: `cmd-${Date.now()}`,
        customerName: draft.customerName,
        serviceType: draft.serviceType,
        date: selectedDate,
        startTime,
        endTime,
        technicianId: null,
      });

      if (draft.serviceType !== selectedService) {
        setSelectedService(draft.serviceType);
      }

      setDraft(null);
      setInputValue('');
      return;
    }

    setDraft(null);
    setInputValue('');
  };

  return (
    <div className="rounded-[var(--radius)] border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex flex-col gap-3 md:flex-row md:items-center">
        <div className="flex h-11 w-11 items-center justify-center rounded-[var(--radius)] bg-sky-100 text-sky-700">
          <Command className="h-5 w-5" aria-hidden="true" />
        </div>
        <div className="flex-1">
          <label htmlFor="assistant-command" className="sr-only">
            Dispatcher command
          </label>
          <input
            id="assistant-command"
            value={inputValue}
            onChange={(event) => setInputValue(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter') {
                handleSubmit();
              }
            }}
            placeholder=""
            className="w-full rounded-[var(--radius)] border border-slate-300 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none ring-0 transition focus:border-sky-400"
          />
        </div>
        <button
          type="button"
          onClick={handleSubmit}
          className="inline-flex items-center justify-center rounded-[var(--radius)] bg-slate-900 px-4 py-3 text-sm font-medium text-white"
        >
          Parse
        </button>
      </div>
    </div>
  );
}
