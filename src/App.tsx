import { CalendarDays, ClipboardList, Settings2 } from 'lucide-react';
import CustomerBooking from './features/scheduling/components/CustomerBooking';
import DispatcherCalendar from './features/scheduling/components/DispatcherCalendar';
import TechnicianSettings from './features/scheduling/components/TechnicianSettings';
import { SchedulerProvider, useScheduler } from './features/scheduling/useScheduler';
import type { ScreenTab } from './features/scheduling/types';

const tabs: { id: ScreenTab; label: string; Icon: typeof Settings2 }[] = [
  { id: 'settings', label: 'Roster', Icon: Settings2 },
  { id: 'calendar', label: 'Dispatch calendar', Icon: CalendarDays },
  { id: 'booking', label: 'Customer booking', Icon: ClipboardList },
];

function PlumbingVariant() {
  return (
    <svg viewBox="0 0 160 160" className="h-16 w-16" xmlns="http://www.w3.org/2000/svg" fill="none">
      <rect x="18" y="18" width="124" height="124" rx="28" fill="#F8FAFC" />

      <path d="M38 104H80C98.8 104 114 88.8 114 70V40" stroke="#111827" strokeWidth="12" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M38 104V74" stroke="#111827" strokeWidth="12" strokeLinecap="round" />
      <path d="M114 40H94" stroke="#111827" strokeWidth="12" strokeLinecap="round" />

      <path d="M52 108V79" stroke="#111827" strokeWidth="2.5" strokeLinecap="round" opacity="0.8" />
      <path d="M102 40H80" stroke="#111827" strokeWidth="2.5" strokeLinecap="round" opacity="0.8" />

      <path d="M38 78C38 62 50 50 66 50" stroke="#111827" strokeWidth="10" strokeLinecap="round" opacity="0.9" />
      <path d="M96 42C101 42 106 44 109 48" stroke="#111827" strokeWidth="3" strokeLinecap="round" opacity="0.8" />
    </svg>
  );
}

function AppShell() {
  const { selectedTab, setSelectedTab } = useScheduler();

  return (
    <div className="min-h-screen bg-[var(--page-bg)] p-4 md:p-8">
      <div className="mx-auto max-w-7xl">
        <header className="notebook-surface mb-6 rounded-[22px] border border-[#dadce0] bg-white p-5 shadow-[0_1px_3px_rgba(60,64,67,0.08),0_10px_30px_rgba(60,64,67,0.04)]">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <h1 className="text-3xl font-semibold tracking-[-0.03em] text-[#202124] md:text-4xl">Multi-skill scheduler</h1>
            </div>

            <div className="flex flex-wrap items-center justify-end gap-2">
              {tabs.map(({ id, label, Icon }) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => setSelectedTab(id)}
                  className={`inline-flex items-center gap-2 rounded-[12px] border px-4 py-2.5 text-sm font-medium transition md:text-[15px] ${
                    selectedTab === id
                      ? 'border-[#1a73e8] bg-[#1a73e8] text-white shadow-[0_4px_12px_rgba(26,115,232,0.22)]'
                      : 'border-[#dadce0] bg-white text-[#3c4043] hover:bg-[#f8f9fa]'
                  }`}
                >
                  <Icon className="h-4 w-4" aria-hidden="true" />
                  {label}
                </button>
              ))}
            </div>
          </div>
        </header>

        <main>
          {selectedTab === 'settings' && <TechnicianSettings />}
          {selectedTab === 'calendar' && <DispatcherCalendar />}
          {selectedTab === 'booking' && <CustomerBooking />}
        </main>
      </div>

      <div className="fixed bottom-4 right-4 z-20 rounded-[18px] border border-[#dfe3e8] bg-white/90 p-3 shadow-[0_12px_28px_rgba(15,23,42,0.12)] backdrop-blur-sm">
        <div className="flex h-20 w-20 items-center justify-center rounded-xl bg-white">
          <PlumbingVariant />
        </div>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <SchedulerProvider>
      <AppShell />
    </SchedulerProvider>
  );
}
