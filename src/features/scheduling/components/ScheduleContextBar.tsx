import { CalendarDays, Filter } from 'lucide-react';
import { useRef } from 'react';
import { useScheduler } from '../useScheduler';
import type { ServiceType } from '../types';

const serviceOptions: ServiceType[] = ['Plumbing', 'HVAC', 'Electrical', 'Drains', 'Roofing'];

export default function ScheduleContextBar() {
  const { selectedDate, selectedService, setSelectedDate, setSelectedService, formatDateLabel } = useScheduler();
  const dateInputRef = useRef<HTMLInputElement | null>(null);

  return (
    <div className="notebook-surface mb-6 rounded-[20px] border border-[#dadce0] bg-white p-4 shadow-[0_1px_2px_rgba(60,64,67,0.08),0_4px_12px_rgba(60,64,67,0.04)]">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-[#dadce0] bg-[#eef3fd] text-[#1a73e8]">
            <CalendarDays className="h-5 w-5" aria-hidden="true" />
          </div>

          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#5f6368]">Schedule context</p>
            <p className="mt-1 text-2xl font-semibold tracking-[-0.03em] text-[#202124]">{formatDateLabel(selectedDate)}</p>
            <p className="text-base text-[#3c4043]">{selectedService} coverage view</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <label className="flex items-center gap-2 rounded-[12px] border border-[#dadce0] bg-[#f8f9fa] px-3 py-2 text-base text-[#3c4043]">
            <Filter className="h-4 w-4 text-[#5f6368]" aria-hidden="true" />
            <select
              value={selectedService}
              onChange={(event) => setSelectedService(event.target.value as ServiceType)}
              className="bg-transparent text-base text-[#3c4043] outline-none"
            >
              {serviceOptions.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </label>

          <div className="rounded-[12px] border border-[#dadce0] bg-[#f8f9fa] text-base text-[#3c4043]">
            <button
              type="button"
              onClick={() => dateInputRef.current?.showPicker?.() ?? dateInputRef.current?.click()}
              className="block px-3 py-2 text-left"
            >
              <span>{formatDateLabel(selectedDate)}</span>
            </button>
            <input
              ref={dateInputRef}
              type="date"
              value={selectedDate}
              onChange={(event) => setSelectedDate(event.target.value)}
              className="sr-only"
              aria-label="Select schedule date"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
