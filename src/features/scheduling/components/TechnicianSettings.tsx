import {
  CalendarDays,
  Check,
  Clock3,
  House,
  PencilLine,
  Plus,
  Trash2,
  Zap,
  type LucideIcon,
} from 'lucide-react';
import { useEffect, useMemo, useState, type ComponentProps } from 'react';
import { formatClockTime, useScheduler } from '../useScheduler';
import type { ServiceType, ShiftBlock, Technician } from '../types';

const serviceOptions: ServiceType[] = ['Plumbing', 'HVAC', 'Electrical', 'Drains', 'Roofing'];
const dayLabels = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

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
  return (
    <span
      className={`inline-flex items-center rounded-full border font-semibold ${skillMeta[skill].className} ${
        compact ? 'px-1.5 py-0.5 text-[9px]' : 'px-2 py-0.5 text-[10px]'
      }`}
    >
      {skill}
    </span>
  );
}

const timeToMinutes = (value: string): number => {
  const [hours, minutes] = value.split(':').map(Number);
  return hours * 60 + minutes;
};

const emptyShift = {
  dayOfWeek: 1,
  startTime: '08:00',
  endTime: '17:00',
  breaks: [{ startTime: '12:00', endTime: '13:00' }],
  working: true,
};

const buildShiftDraft = (shift?: Partial<ShiftBlock>, dayOfWeek = 1): ShiftBlock => ({
  dayOfWeek,
  startTime: shift?.startTime ?? '08:00',
  endTime: shift?.endTime ?? '17:00',
  breaks: shift?.breaks ?? [{ startTime: '12:00', endTime: '13:00' }],
  working: shift?.working ?? true,
});

const getShiftValidationMessage = (draft: ShiftBlock): string | null => {
  if (!draft.working) {
    return 'This technician is marked off for this day and will not be scheduled.';
  }

  if (timeToMinutes(draft.startTime) >= timeToMinutes(draft.endTime)) {
    return 'Start time must be before the end time.';
  }

  const invalidBreak = draft.breaks.some(
    (breakBlock) =>
      timeToMinutes(breakBlock.startTime) < timeToMinutes(draft.startTime) ||
      timeToMinutes(breakBlock.endTime) > timeToMinutes(draft.endTime),
  );

  if (invalidBreak) {
    return 'Break times must be within the scheduled shift.';
  }

  return null;
};

export default function TechnicianSettings() {
  const { technicians, updateTechnician, addTechnician, removeTechnician, selectedDate } = useScheduler();
  const [selectedId, setSelectedId] = useState<string>(technicians[0]?.id ?? '');
  const [draftName, setDraftName] = useState(technicians[0]?.name ?? '');
  const [selectedSkills, setSelectedSkills] = useState<ServiceType[]>(technicians[0]?.skills ?? []);
  const [selectedDays, setSelectedDays] = useState<number[]>(technicians[0]?.shifts.map((shift) => shift.dayOfWeek) ?? [1]);
  const [selectedShiftDay, setSelectedShiftDay] = useState<number>(technicians[0]?.shifts[0]?.dayOfWeek ?? 1);
  const [dayShiftDrafts, setDayShiftDrafts] = useState<Record<number, ShiftBlock>>(() => {
    const initialShift = technicians[0]?.shifts[0] ?? emptyShift;
    return { [initialShift.dayOfWeek]: buildShiftDraft(initialShift, initialShift.dayOfWeek) };
  });
  const [isEditing, setIsEditing] = useState(false);

  const selectedTechnician = useMemo(
    () => technicians.find((technician) => technician.id === selectedId) ?? technicians[0],
    [technicians, selectedId],
  );

  const visibleShift = useMemo(
    () => selectedTechnician?.shifts.find((shift) => shift.dayOfWeek === selectedShiftDay) ?? selectedTechnician?.shifts[0] ?? null,
    [selectedShiftDay, selectedTechnician],
  );

  const activeShiftDraft = dayShiftDrafts[selectedShiftDay] ?? buildShiftDraft(undefined, selectedShiftDay);
  const shiftValidationMessage = getShiftValidationMessage(activeShiftDraft);

  const syncSelectedTechnician = (next: Technician | undefined) => {
    if (!next) {
      return;
    }

    const nextDays = next.shifts.length > 0 ? next.shifts.map((shift) => shift.dayOfWeek) : [1];
    const calendarDayOfWeek = new Date(`${selectedDate}T00:00:00`).getDay();
    const preferredDay = nextDays.includes(calendarDayOfWeek) ? calendarDayOfWeek : nextDays[0] ?? 1;
    const nextDrafts = Object.fromEntries(
      next.shifts.length > 0
        ? next.shifts.map((shift) => [shift.dayOfWeek, buildShiftDraft(shift, shift.dayOfWeek)])
        : [[1, buildShiftDraft(undefined, 1)]],
    );

    setSelectedId(next.id);
    setDraftName(next.name);
    setSelectedSkills(next.skills);
    setSelectedDays(nextDays);
    setSelectedShiftDay(preferredDay);
    setDayShiftDrafts(nextDrafts);
  };

  useEffect(() => {
    if (!selectedTechnician) {
      return;
    }

    const calendarDayOfWeek = new Date(`${selectedDate}T00:00:00`).getDay();
    const nextDays = selectedTechnician.shifts.map((shift) => shift.dayOfWeek);
    const nextActiveDay = nextDays.includes(calendarDayOfWeek) ? calendarDayOfWeek : nextDays[0] ?? 1;

    setSelectedShiftDay((current) => {
      if (current === nextActiveDay) {
        return current;
      }

      return nextActiveDay;
    });

    setDayShiftDrafts((current) => {
      const existingDraft = current[nextActiveDay] ?? buildShiftDraft(selectedTechnician.shifts.find((shift) => shift.dayOfWeek === nextActiveDay), nextActiveDay);
      return {
        ...current,
        [nextActiveDay]: existingDraft,
      };
    });
  }, [selectedDate, selectedTechnician]);

  const handleSelectTechnician = (technicianId: string) => {
    const found = technicians.find((technician) => technician.id === technicianId);
    syncSelectedTechnician(found);
    setIsEditing(false);
  };

  const handleSkillToggle = (serviceType: ServiceType) => {
    setSelectedSkills((current) =>
      current.includes(serviceType)
        ? current.filter((value) => value !== serviceType)
        : [...current, serviceType],
    );
  };

  const handleDayToggle = (dayOfWeek: number) => {
    setSelectedDays((current) => {
      const next = current.includes(dayOfWeek)
        ? current.filter((value) => value !== dayOfWeek)
        : [...current, dayOfWeek];
      const sorted = [...next].sort((left, right) => left - right);

      if (sorted.length === 0) {
        setSelectedShiftDay(1);
        return sorted;
      }

      const nextActiveDay = sorted.includes(dayOfWeek) ? dayOfWeek : sorted[0];
      setSelectedShiftDay(nextActiveDay);
      return sorted;
    });

    setDayShiftDrafts((current) => ({
      ...current,
      [dayOfWeek]: current[dayOfWeek] ?? buildShiftDraft(undefined, dayOfWeek),
    }));
  };

  const updateBreakBlock = (index: number, field: 'startTime' | 'endTime', value: string) => {
    setDayShiftDrafts((current) => {
      const currentDraft = current[selectedShiftDay] ?? buildShiftDraft(undefined, selectedShiftDay);
      const nextBreaks = [...currentDraft.breaks];
      if (!nextBreaks[index]) {
        nextBreaks[index] = { startTime: '15:00', endTime: '15:15' };
      }

      nextBreaks[index] = { ...nextBreaks[index], [field]: value };
      return { ...current, [selectedShiftDay]: { ...currentDraft, breaks: nextBreaks } };
    });
  };

  const addBreakBlock = () => {
    setDayShiftDrafts((current) => {
      const currentDraft = current[selectedShiftDay] ?? buildShiftDraft(undefined, selectedShiftDay);
      return {
        ...current,
        [selectedShiftDay]: {
          ...currentDraft,
          breaks: [...currentDraft.breaks, { startTime: '15:00', endTime: '15:15' }],
        },
      };
    });
  };

  const removeBreakBlock = (index: number) => {
    setDayShiftDrafts((current) => {
      const currentDraft = current[selectedShiftDay] ?? buildShiftDraft(undefined, selectedShiftDay);
      return {
        ...current,
        [selectedShiftDay]: {
          ...currentDraft,
          breaks: currentDraft.breaks.filter((_, breakIndex) => breakIndex !== index),
        },
      };
    });
  };

  const handleSave = () => {
    if (!selectedTechnician) {
      return;
    }

    const trimmedName = draftName.trim();
    if (!trimmedName) {
      return;
    }

    if (shiftValidationMessage) {
      return;
    }

    const nextShifts = selectedDays.flatMap((dayOfWeek) => {
      const draftForDay = dayShiftDrafts[dayOfWeek] ?? buildShiftDraft(undefined, dayOfWeek);
      if (!draftForDay.working) {
        return [];
      }

      return [{
        ...draftForDay,
        dayOfWeek,
        breaks: draftForDay.breaks,
        working: true,
      }];
    });

    const nextTechnician: Technician = {
      ...selectedTechnician,
      name: trimmedName,
      skills: selectedSkills,
      shifts: nextShifts,
    };

    updateTechnician(selectedTechnician.id, nextTechnician);
    setDraftName(trimmedName);
    setSelectedShiftDay(selectedShiftDay);
    setIsEditing(false);
  };

  const handleAdd = () => {
    const nextTechnician: Technician = {
      id: `tech-${Date.now()}`,
      name: `New Technician ${technicians.length + 1}`,
      skills: ['HVAC'],
      shifts: [emptyShift],
    };

    addTechnician(nextTechnician);
    syncSelectedTechnician(nextTechnician);
    setIsEditing(true);
  };

  const handleRemoveTechnician = (technicianId: string) => {
    const technicianToRemove = technicians.find((technician) => technician.id === technicianId);

    if (!technicianToRemove) {
      return;
    }

    const shouldRemove = window.confirm(`Are you sure you want to remove ${technicianToRemove.name} from the roster?`);
    if (!shouldRemove) {
      return;
    }

    const remainingTechnicians = technicians.filter((technician) => technician.id !== technicianId);
    removeTechnician(technicianId);

    if (selectedTechnician?.id !== technicianId) {
      return;
    }

    if (remainingTechnicians.length > 0) {
      syncSelectedTechnician(remainingTechnicians[0]);
      return;
    }

    setSelectedId('');
    setDraftName('');
    setSelectedSkills([]);
    setSelectedDays([1]);
    setSelectedShiftDay(1);
    setDayShiftDrafts({ 1: buildShiftDraft(undefined, 1) });
  };

  return (
    <div className="grid gap-5 lg:grid-cols-[220px_minmax(0,1fr)]">
      <aside className="notebook-surface flex min-h-[420px] flex-col rounded-[20px] border border-[#dadce0] bg-white p-3 shadow-[0_1px_2px_rgba(60,64,67,0.08),0_4px_12px_rgba(60,64,67,0.04)]">
        <div className="mb-3 pb-2">
          <h2 className="text-[1.5rem] font-semibold tracking-[-0.03em] text-[#202124]">Roster</h2>
        </div>

        <div className="flex-1 space-y-1">
          {technicians.map((technician) => (
            <div
              key={technician.id}
              role="button"
              tabIndex={0}
              onClick={() => handleSelectTechnician(technician.id)}
              onKeyDown={(event) => {
                if (event.key === 'Enter' || event.key === ' ') {
                  event.preventDefault();
                  handleSelectTechnician(technician.id);
                }
              }}
              className={`w-full cursor-pointer rounded-[12px] px-3 py-2 text-left transition ${
                selectedTechnician?.id === technician.id ? 'bg-[#eef3fd]' : 'bg-white hover:bg-[#f8f9fa]'
              }`}
            >
              <span className="block text-[1.1rem] font-medium text-[#202124]">{technician.name}</span>
            </div>
          ))}
        </div>

        <div className="mt-3 border-t border-[#dadce0] pt-3">
          <button
            type="button"
            onClick={handleAdd}
            className="inline-flex w-full items-center justify-center gap-2 rounded-[12px] border border-[#dadce0] bg-[#eef3fd] px-3 py-2.5 text-sm font-medium text-[#1a73e8] transition hover:bg-[#e8f0fe]"
          >
            <Plus className="h-4 w-4" aria-hidden="true" />
            Add technician
          </button>
        </div>
      </aside>

      <section className="notebook-surface rounded-[20px] border border-[#dadce0] bg-white p-4 shadow-[0_1px_2px_rgba(60,64,67,0.08),0_4px_12px_rgba(60,64,67,0.04)]">
        {selectedTechnician ? (
          <>
            <div className="mb-4 border-b border-[#dadce0] pb-3">
              <div className="flex items-center justify-between gap-4">
                <div className="flex min-w-0 items-center gap-3">
                  <div className="min-w-0">
                    <p className="text-[9px] font-semibold uppercase tracking-[0.2em] text-[#5f6368]">Technician</p>
                    <div className="flex items-center gap-2">
                      <h2 className="text-[2rem] font-semibold tracking-[-0.04em] text-[#202124]">{selectedTechnician.name}</h2>
                    </div>
                  </div>
                </div>

                {!isEditing ? (
                  <button
                    type="button"
                    onClick={() => setIsEditing(true)}
                    className="inline-flex items-center gap-2 rounded-[10px] border border-[#dadce0] bg-white px-3 py-2 text-sm font-medium text-[#3c4043] transition hover:bg-[#f8f9fa]"
                  >
                    <PencilLine className="h-4 w-4" aria-hidden="true" />
                    Edit
                  </button>
                ) : null}
              </div>
            </div>

            <div className="overflow-hidden rounded-[18px] border border-[#dadce0] bg-[#f8f9fa]">
              {isEditing ? (
                <div className="space-y-4 p-3">
                  <div className="grid grid-cols-[120px_minmax(0,1fr)] items-center gap-4">
                    <span className="text-[1.05rem] font-medium text-[#202124]">Name</span>
                    <input
                      type="text"
                      value={draftName}
                      onChange={(event) => setDraftName(event.target.value)}
                      placeholder="Technician name"
                      className="rounded-[10px] border border-[#dadce0] bg-white px-2 py-1.5 text-sm text-[#202124] focus:border-[#1a73e8] focus:outline-none focus:ring-2 focus:ring-[#d2e3fc]"
                    />
                  </div>

                  <div className="grid grid-cols-[120px_minmax(0,1fr)] items-start gap-4">
                    <span className="text-[1.05rem] font-medium text-[#202124]">Skills</span>
                    <div className="flex flex-wrap gap-2">
                      {serviceOptions.map((skill) => {
                        const active = selectedSkills.includes(skill);
                        return (
                          <button
                            key={skill}
                            type="button"
                            onClick={() => handleSkillToggle(skill)}
                            className={`rounded-full border px-2 py-1 text-[10px] font-semibold transition ${
                              active
                                ? 'border-[#1a73e8] bg-[#e8f0fe] text-[#174ea6]'
                                : 'border-[#dadce0] bg-white text-[#3c4043] hover:border-[#c4c7c5]'
                            }`}
                          >
                            {skill}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div className="grid grid-cols-[120px_minmax(0,1fr)] items-start gap-4">
                    <span className="text-[1.05rem] font-medium text-[#202124]">Days</span>
                    <div className="flex flex-wrap gap-2">
                      {dayLabels.map((label, index) => {
                        const active = selectedDays.includes(index);
                        return (
                          <button
                            key={label}
                            type="button"
                            onClick={() => handleDayToggle(index)}
                            className={`rounded-full border px-2 py-1 text-[10px] font-semibold transition ${
                              active
                                ? 'border-[#1a73e8] bg-[#e8f0fe] text-[#174ea6]'
                                : 'border-[#dadce0] bg-white text-[#3c4043] hover:border-[#c4c7c5]'
                            }`}
                          >
                            {label}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div className="grid grid-cols-[120px_minmax(0,1fr)] items-center gap-4">
                    <span className="text-[1.05rem] font-medium text-[#202124]">Shift</span>
                    <div className="flex flex-wrap items-center gap-3">
                      <select
                        value={selectedShiftDay}
                        onChange={(event) => {
                          const nextDay = Number(event.target.value);
                          setSelectedShiftDay(nextDay);
                          setDayShiftDrafts((current) => ({
                            ...current,
                            [nextDay]: current[nextDay] ?? buildShiftDraft(undefined, nextDay),
                          }));
                        }}
                        className="rounded-[10px] border border-[#dadce0] bg-white px-2 py-1.5 text-sm text-[#202124] focus:border-[#1a73e8] focus:outline-none focus:ring-2 focus:ring-[#d2e3fc]"
                        disabled={selectedDays.length === 0}
                      >
                        {selectedDays.length > 0 ? (
                          selectedDays.map((dayOfWeek) => (
                            <option key={dayOfWeek} value={dayOfWeek}>
                              {dayLabels[dayOfWeek]}
                            </option>
                          ))
                        ) : (
                          <option value={1}>No days selected</option>
                        )}
                      </select>

                      <div className="flex items-center gap-2">
                        <input
                          type="time"
                          value={activeShiftDraft.startTime}
                          onChange={(event) =>
                            setDayShiftDrafts((current) => ({
                              ...current,
                              [selectedShiftDay]: { ...activeShiftDraft, startTime: event.target.value },
                            }))
                          }
                          className="rounded-[10px] border border-[#dadce0] bg-white px-2 py-1.5 text-sm text-[#202124]"
                        />
                        <span className="text-sm text-[#5f6368]">to</span>
                        <input
                          type="time"
                          value={activeShiftDraft.endTime}
                          onChange={(event) =>
                            setDayShiftDrafts((current) => ({
                              ...current,
                              [selectedShiftDay]: { ...activeShiftDraft, endTime: event.target.value },
                            }))
                          }
                          className="rounded-[10px] border border-[#dadce0] bg-white px-2 py-1.5 text-sm text-[#202124]"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-[120px_minmax(0,1fr)] items-center gap-4">
                    <span className="text-[1.05rem] font-medium text-[#202124]">Lunch</span>
                    <div className="flex items-center gap-2">
                      <input
                        type="time"
                        value={activeShiftDraft.breaks[0]?.startTime ?? '12:00'}
                        onChange={(event) =>
                          setDayShiftDrafts((current) => {
                            const currentDraft = current[selectedShiftDay] ?? buildShiftDraft(undefined, selectedShiftDay);
                            const nextBreaks = [...currentDraft.breaks];
                            const lunch = nextBreaks[0] ?? { startTime: '12:00', endTime: '13:00' };
                            nextBreaks[0] = { ...lunch, startTime: event.target.value };
                            return { ...current, [selectedShiftDay]: { ...currentDraft, breaks: nextBreaks } };
                          })
                        }
                        className="rounded-[10px] border border-[#dadce0] bg-white px-2 py-1.5 text-sm text-[#202124]"
                      />
                      <span className="text-sm text-[#5f6368]">to</span>
                      <input
                        type="time"
                        value={activeShiftDraft.breaks[0]?.endTime ?? '13:00'}
                        onChange={(event) =>
                          setDayShiftDrafts((current) => {
                            const currentDraft = current[selectedShiftDay] ?? buildShiftDraft(undefined, selectedShiftDay);
                            const nextBreaks = [...currentDraft.breaks];
                            const lunch = nextBreaks[0] ?? { startTime: '12:00', endTime: '13:00' };
                            nextBreaks[0] = { ...lunch, endTime: event.target.value };
                            return { ...current, [selectedShiftDay]: { ...currentDraft, breaks: nextBreaks } };
                          })
                        }
                        className="rounded-[10px] border border-[#dadce0] bg-white px-2 py-1.5 text-sm text-[#202124]"
                      />
                      <button
                        type="button"
                        onClick={() =>
                          setDayShiftDrafts((current) => {
                            const currentDraft = current[selectedShiftDay] ?? buildShiftDraft(undefined, selectedShiftDay);
                            return { ...current, [selectedShiftDay]: { ...currentDraft, breaks: currentDraft.breaks.slice(1) } };
                          })
                        }
                        className="rounded-[10px] border border-[#dadce0] bg-white px-2 py-1 text-[10px] font-medium text-[#3c4043] hover:bg-[#f1f3f4]"
                      >
                        Clear
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-[120px_minmax(0,1fr)] items-start gap-4">
                    <span className="text-[1.05rem] font-medium text-[#202124]">Break</span>
                    <div className="space-y-2">
                      {activeShiftDraft.breaks.slice(1).length > 0 ? (
                        activeShiftDraft.breaks.slice(1).map((breakBlock, index) => (
                          <div key={`${breakBlock.startTime}-${breakBlock.endTime}-${index}`} className="flex items-center gap-2">
                            <input
                              type="time"
                              value={breakBlock.startTime}
                              onChange={(event) => updateBreakBlock(index, 'startTime', event.target.value)}
                              className="rounded-[10px] border border-[#dadce0] bg-white px-2 py-1.5 text-sm text-[#202124]"
                            />
                            <span className="text-sm text-[#5f6368]">to</span>
                            <input
                              type="time"
                              value={breakBlock.endTime}
                              onChange={(event) => updateBreakBlock(index, 'endTime', event.target.value)}
                              className="rounded-[10px] border border-[#dadce0] bg-white px-2 py-1.5 text-sm text-[#202124]"
                            />
                            <button
                              type="button"
                              onClick={() => removeBreakBlock(index)}
                              className="rounded-[10px] border border-[#dadce0] bg-white p-1.5 text-[#5f6368] hover:bg-[#f1f3f4]"
                              aria-label="Remove additional break"
                            >
                              <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                            </button>
                          </div>
                        ))
                      ) : (
                        <span className="text-[1rem] text-[#5f6368]">None</span>
                      )}
                      <button
                        type="button"
                        onClick={addBreakBlock}
                        className="inline-flex items-center gap-1 rounded-[10px] border border-[#dadce0] bg-white px-2 py-1 text-[10px] font-medium text-[#1a73e8] hover:bg-[#eef3fd]"
                      >
                        <Plus className="h-3 w-3" aria-hidden="true" />
                        Add break
                      </button>
                    </div>
                  </div>

                  {shiftValidationMessage ? <p className="text-sm text-[#d93025]">{shiftValidationMessage}</p> : null}
                </div>
              ) : (
                <div className="space-y-2 p-3">
                  <div className="grid grid-cols-[120px_minmax(0,1fr)] items-center gap-4 border-b border-[#dadce0] pb-2">
                    <span className="text-[1.05rem] font-medium text-[#202124]">Skills</span>
                    <div className="flex flex-wrap gap-2">
                      {selectedSkills.length > 0 ? (
                        selectedSkills.map((skill) => <SkillBadge key={skill} skill={skill} />)
                      ) : (
                        <span className="text-[1rem] text-[#5f6368]">No skills</span>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-[120px_minmax(0,1fr)] items-center gap-4 border-b border-[#dadce0] pb-2">
                    <span className="text-[1.05rem] font-medium text-[#202124]">Days</span>
                    <div className="text-[1.05rem] text-[#3c4043]">
                      {selectedTechnician.shifts.length > 0 ? selectedTechnician.shifts.map((shift) => dayLabels[shift.dayOfWeek]).join(', ') : 'No days'}
                    </div>
                  </div>

                  <div className="grid grid-cols-[120px_minmax(0,1fr)] items-center gap-4 border-b border-[#dadce0] pb-2">
                    <span className="text-[1.05rem] font-medium text-[#202124]">Day</span>
                    <label className="flex items-center gap-2">
                      <select
                        value={selectedShiftDay}
                        onChange={(event) => setSelectedShiftDay(Number(event.target.value))}
                        className="rounded-[10px] border border-[#dadce0] bg-white px-2 py-1.5 text-sm text-[#202124] focus:border-[#1a73e8] focus:outline-none focus:ring-2 focus:ring-[#d2e3fc]"
                        disabled={selectedTechnician.shifts.length === 0}
                      >
                        {selectedTechnician.shifts.length > 0 ? (
                          selectedTechnician.shifts.map((shift) => (
                            <option key={shift.dayOfWeek} value={shift.dayOfWeek}>
                              {dayLabels[shift.dayOfWeek]}
                            </option>
                          ))
                        ) : (
                          <option value={1}>No days selected</option>
                        )}
                      </select>
                    </label>
                  </div>

                  <div className="grid grid-cols-[120px_minmax(0,1fr)] items-center gap-4 border-b border-[#dadce0] pb-2">
                    <span className="text-[1.05rem] font-medium text-[#202124]">Shift</span>
                    <div className="text-[1.05rem] text-[#3c4043]">
                      {visibleShift ? `${formatClockTime(visibleShift.startTime)}–${formatClockTime(visibleShift.endTime)}` : 'No shift'}
                    </div>
                  </div>

                  <div className="grid grid-cols-[120px_minmax(0,1fr)] items-center gap-4 border-b border-[#dadce0] pb-2">
                    <span className="text-[1.05rem] font-medium text-[#202124]">Lunch</span>
                    <div className="text-[1.05rem] text-[#3c4043]">
                      {visibleShift?.breaks[0] ? `${formatClockTime(visibleShift.breaks[0].startTime)}–${formatClockTime(visibleShift.breaks[0].endTime)}` : 'None'}
                    </div>
                  </div>

                  <div className="grid grid-cols-[120px_minmax(0,1fr)] items-center gap-4 border-b border-[#dadce0] pb-2">
                    <span className="text-[1.05rem] font-medium text-[#202124]">Break</span>
                    <div className="text-[1.05rem] text-[#3c4043]">
                      {visibleShift?.breaks.slice(1).map((breakBlock) => `${formatClockTime(breakBlock.startTime)}–${formatClockTime(breakBlock.endTime)}`).join(', ') || 'None'}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {isEditing ? (
              <div className="mt-4 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => handleRemoveTechnician(selectedTechnician.id)}
                  className="rounded-[10px] border border-[#f1b8b8] bg-[#fff1f1] px-2.5 py-1.5 text-[10px] font-medium text-[#d93025]"
                >
                  Remove
                </button>
                <button
                  type="button"
                  onClick={handleSave}
                  className="rounded-[10px] border border-[#1a73e8] bg-[#1a73e8] px-2.5 py-1.5 text-[10px] font-medium text-white hover:bg-[#1765cc]"
                >
                  Save
                </button>
              </div>
            ) : null}
          </>
        ) : (
          <div>No technician selected.</div>
        )}
      </section>
    </div>
  );
}
