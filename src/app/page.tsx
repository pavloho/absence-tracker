'use client';

import { useState, useEffect } from 'react';
import { Avatar } from '@/components/Avatar';
import { AbsenceBadge } from '@/components/AbsenceBadge';
import { IconChevronLeft, IconChevronRight, IconUsers, IconCalendarEvent } from '@tabler/icons-react';

interface Absence {
  id: number;
  type: string;
  date_from: string;
  date_to: string | null;
}

interface Employee {
  id: number;
  first_name: string;
  last_name: string;
  avatar_url: string | null;
  absences: Absence[];
  total_days: number;
}

interface ProjectReport {
  project: { id: number; name: string; logo_url: string | null };
  period: { start: string; end: string; month: number; year: number; last_day: number };
  employees: Employee[];
  total_absentees: number;
}

const MONTHS = [
  '', 'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

export default function ReportPage() {
  const now = new Date();
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());
  const [data, setData] = useState<ProjectReport[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/report?month=${month}&year=${year}`)
      .then((r) => r.json())
      .then((d) => { setData(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, [month, year]);

  const prevMonth = () => {
    if (month === 1) { setMonth(12); setYear(year - 1); }
    else setMonth(month - 1);
  };

  const nextMonth = () => {
    if (month === 12) { setMonth(1); setYear(year + 1); }
    else setMonth(month + 1);
  };

  const totalAbsent = data.reduce((sum, r) => sum + r.total_absentees, 0);
  const totalDays = data.reduce((sum, r) => r.employees.reduce((s, e) => s + e.total_days, sum), 0);

  return (
    <div className="min-h-screen bg-[#f8f9fb]">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-xl border-b border-slate-200/60 sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-6 py-5 flex items-center justify-between">
          <h1 className="text-[15px] font-semibold text-slate-900 tracking-tight uppercase letter-spacing-wide">
            Absence Report
          </h1>
          <div className="flex items-center gap-1">
            <button
              onClick={prevMonth}
              className="w-9 h-9 flex items-center justify-center rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-all"
            >
              <IconChevronLeft size={18} />
            </button>
            <span className="text-sm font-semibold text-slate-900 min-w-[140px] text-center">
              {MONTHS[month]} {year}
            </span>
            <button
              onClick={nextMonth}
              className="w-9 h-9 flex items-center justify-center rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-all"
            >
              <IconChevronRight size={18} />
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-8">
        {loading ? (
          <div className="flex items-center justify-center py-32">
            <div className="w-5 h-5 border-2 border-slate-200 border-t-slate-600 rounded-full animate-spin" />
          </div>
        ) : data.length === 0 ? (
          <div className="text-center py-32 text-slate-400">
            <p className="text-base font-medium">No projects found</p>
            <p className="text-sm mt-1">Add projects in the admin panel to get started.</p>
          </div>
        ) : (
          <>
            {/* Summary strip */}
            <div className="flex gap-4 mb-8">
              <div className="flex items-center gap-3 bg-white rounded-xl border border-slate-200/60 px-5 py-3.5 shadow-sm">
                <div className="w-9 h-9 rounded-lg bg-slate-900 flex items-center justify-center">
                  <IconUsers size={16} className="text-white" />
                </div>
                <div>
                  <p className="text-[22px] font-bold text-slate-900 leading-none">{totalAbsent}</p>
                  <p className="text-[11px] text-slate-400 font-medium mt-0.5">Employees absent</p>
                </div>
              </div>
              <div className="flex items-center gap-3 bg-white rounded-xl border border-slate-200/60 px-5 py-3.5 shadow-sm">
                <div className="w-9 h-9 rounded-lg bg-slate-900 flex items-center justify-center">
                  <IconCalendarEvent size={16} className="text-white" />
                </div>
                <div>
                  <p className="text-[22px] font-bold text-slate-900 leading-none">{totalDays}</p>
                  <p className="text-[11px] text-slate-400 font-medium mt-0.5">Days total</p>
                </div>
              </div>
            </div>

            {/* Project cards */}
            <div className="space-y-6">
              {data.map((report, idx) => (
                <section
                  key={report.project.id}
                  className="bg-white rounded-2xl border border-slate-200/60 shadow-sm overflow-hidden animate-fade-in"
                  style={{ animationDelay: `${idx * 60}ms` }}
                >
                  {/* Project header */}
                  <div className="px-6 py-4 flex items-center justify-between border-b border-slate-100">
                    <div className="flex items-center gap-3">
                      {report.project.logo_url ? (
                        <img
                          src={report.project.logo_url}
                          alt={report.project.name}
                          className="h-6 w-auto object-contain"
                        />
                      ) : (
                        <span className="text-base font-bold text-slate-900">{report.project.name}</span>
                      )}
                    </div>
                    <div className="flex items-center gap-4 text-[12px] text-slate-400">
                      <span>
                        {report.period.last_day} days &middot; {MONTHS[report.period.month]} {report.period.year}
                      </span>
                      <span className="bg-slate-100 text-slate-600 font-semibold px-2.5 py-1 rounded-md">
                        {report.total_absentees} {report.total_absentees === 1 ? 'person' : 'people'}
                      </span>
                    </div>
                  </div>

                  {/* Employees */}
                  {report.employees.length === 0 ? (
                    <div className="px-6 py-10 text-center text-sm text-slate-400">
                      No absences recorded for this period
                    </div>
                  ) : (
                    <div className="divide-y divide-slate-50">
                      {report.employees.map((emp) => (
                        <div key={emp.id} className="px-6 py-3.5 flex items-center gap-4 hover:bg-slate-50/40 transition-colors">
                          <Avatar
                            firstName={emp.first_name}
                            lastName={emp.last_name}
                            avatarUrl={emp.avatar_url}
                            size={36}
                          />
                          <div className="min-w-[140px]">
                            <p className="text-[13px] font-semibold text-slate-900 leading-tight">
                              {emp.last_name} {emp.first_name}
                            </p>
                            <p className="text-[11px] text-slate-400 mt-0.5">
                              {emp.total_days} {emp.total_days === 1 ? 'day' : 'days'} absent
                            </p>
                          </div>
                          <div className="flex-1 flex flex-wrap gap-1.5 justify-end">
                            {emp.absences.map((ab) => (
                              <AbsenceBadge
                                key={ab.id}
                                type={ab.type}
                                dateFrom={ab.date_from}
                                dateTo={ab.date_to}
                              />
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </section>
              ))}
            </div>

            {/* Footer note */}
            <p className="text-center text-[11px] text-slate-400 mt-8">
              Report generated for {MONTHS[month]} {year} &middot; All recorded absences included
            </p>
          </>
        )}
      </main>
    </div>
  );
}
