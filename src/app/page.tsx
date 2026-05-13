'use client';

import { useState, useEffect } from 'react';
import { Avatar } from '@/components/Avatar';
import { AbsenceBadge } from '@/components/AbsenceBadge';
import { IconChevronLeft, IconChevronRight } from '@tabler/icons-react';

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
  total_employees: number;
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
  const [activeProject, setActiveProject] = useState<number | null>(null);

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

  return (
    <div className="min-h-screen bg-[#f5f6f8]">
      {/* Header */}
      <header className="bg-white border-b border-slate-200/70 sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-3 sm:py-4 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 sm:gap-4 min-w-0">
            <h1 className="text-[11px] sm:text-[13px] font-bold text-slate-500 tracking-[0.08em] uppercase shrink-0">
              Absence Report
            </h1>
            {!loading && data.length > 1 && (
              <select
                value={activeProject ?? ''}
                onChange={(e) => setActiveProject(e.target.value ? Number(e.target.value) : null)}
                className="px-2 sm:px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs sm:text-sm font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-slate-900/10 cursor-pointer min-w-0"
              >
                <option value="">All projects</option>
                {data.map((report) => (
                  <option key={report.project.id} value={report.project.id}>
                    {report.project.name}
                  </option>
                ))}
              </select>
            )}
          </div>
          <div className="flex items-center gap-0.5 shrink-0">
            <button
              onClick={prevMonth}
              className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
            >
              <IconChevronLeft size={16} />
            </button>
            <span className="text-xs sm:text-sm font-bold text-slate-900 min-w-[100px] sm:min-w-[130px] text-center tracking-tight">
              {MONTHS[month]} {year}
            </span>
            <button
              onClick={nextMonth}
              className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
            >
              <IconChevronRight size={16} />
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-3 sm:px-6 py-4 sm:py-8">
        {loading ? (
          <div className="flex items-center justify-center py-32">
            <div className="w-5 h-5 border-2 border-slate-300 border-t-slate-600 rounded-full animate-spin" />
          </div>
        ) : data.length === 0 ? (
          <div className="text-center py-32 text-slate-400">
            <p className="text-base font-medium">No projects found</p>
            <p className="text-sm mt-1">Add projects in the admin panel to get started.</p>
          </div>
        ) : (
          <div className="space-y-4 sm:space-y-6">
            {data.filter((r) => activeProject === null || r.project.id === activeProject).map((report, idx) => {
              const totalProjectDays = report.employees.reduce((s, e) => s + e.total_days, 0);

              return (
                <section
                  key={report.project.id}
                  className="bg-white rounded-2xl border border-slate-200/70 overflow-hidden animate-fade-in"
                  style={{ animationDelay: `${idx * 60}ms` }}
                >
                  {/* Project header */}
                  <div className="px-4 sm:px-6 py-3 sm:py-4 border-b border-slate-100 flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-3">
                      {report.project.logo_url ? (
                        <img
                          src={report.project.logo_url}
                          alt={report.project.name}
                          className="w-[90px] h-auto"
                        />
                      ) : (
                        <span className="text-base font-bold text-slate-900">{report.project.name}</span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 text-[11px] sm:text-[12px]">
                      <span className="bg-slate-100 text-slate-600 font-semibold px-2 py-0.5 rounded-md">
                        {report.total_absentees} of {report.total_employees} absent
                      </span>
                      <span className="bg-slate-100 text-slate-600 font-semibold px-2 py-0.5 rounded-md">
                        {totalProjectDays} {totalProjectDays === 1 ? 'day' : 'days'} total
                      </span>
                    </div>
                  </div>

                  {/* Employee list */}
                  {report.employees.length === 0 ? (
                    <div className="px-4 sm:px-6 py-10 text-center text-sm text-slate-400">
                      No absences recorded for this period
                    </div>
                  ) : (
                    <>
                      {/* Table header - hidden on mobile */}
                      <div className="hidden sm:flex px-6 py-2 items-center gap-3 text-[11px] font-semibold text-slate-400 uppercase tracking-wider border-b border-slate-50">
                        <div className="w-[220px] shrink-0">Employee</div>
                        <div className="w-[52px] shrink-0 text-center">Days</div>
                        <div className="flex-1 text-right">Absences</div>
                      </div>

                      {/* Rows - desktop: horizontal, mobile: stacked */}
                      <div className="divide-y divide-slate-50">
                        {report.employees.map((emp) => (
                          <div key={emp.id} className="px-4 sm:px-6 py-3 hover:bg-slate-50/50 transition-colors">
                            {/* Desktop layout */}
                            <div className="hidden sm:flex items-start gap-3">
                              <div className="flex items-center gap-3 w-[220px] shrink-0 min-w-0 pt-0.5">
                                <Avatar
                                  firstName={emp.first_name}
                                  lastName={emp.last_name}
                                  avatarUrl={emp.avatar_url}
                                  size={34}
                                />
                                <span className="text-[13px] font-semibold text-slate-800 truncate">
                                  {emp.last_name} {emp.first_name}
                                </span>
                              </div>
                              <div className="w-[52px] shrink-0 flex justify-center pt-0.5">
                                <span className="inline-flex items-center justify-center min-w-[28px] h-7 rounded-md bg-slate-100 text-slate-700 text-[13px] font-bold px-1.5">
                                  {emp.total_days}
                                </span>
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

                            {/* Mobile layout */}
                            <div className="sm:hidden">
                              <div className="flex items-center gap-3">
                                <Avatar
                                  firstName={emp.first_name}
                                  lastName={emp.last_name}
                                  avatarUrl={emp.avatar_url}
                                  size={32}
                                />
                                <span className="text-[13px] font-semibold text-slate-800 flex-1 truncate">
                                  {emp.last_name} {emp.first_name}
                                </span>
                                <span className="inline-flex items-center justify-center min-w-[24px] h-6 rounded-md bg-slate-100 text-slate-700 text-[12px] font-bold px-1.5 shrink-0">
                                  {emp.total_days}d
                                </span>
                              </div>
                              <div className="flex flex-wrap gap-1.5 mt-2 ml-11">
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
                          </div>
                        ))}
                      </div>
                    </>
                  )}
                </section>
              );
            })}

            <p className="text-center text-[11px] text-slate-400 pt-2">
              All absences recorded during {MONTHS[month]} {year}
            </p>
          </div>
        )}
      </main>
    </div>
  );
}
