'use client';

import { useState, useEffect } from 'react';
import { Avatar } from '@/components/Avatar';
import { AbsenceBadge } from '@/components/AbsenceBadge';
import { MonthPicker } from '@/components/MonthPicker';

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

  const monthNames = [
    '', 'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December',
  ];

  return (
    <div className="min-h-screen bg-slate-50/50">
      {/* Header */}
      <header className="bg-white border-b border-slate-100 sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-slate-900 flex items-center justify-center">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round">
                <rect x="3" y="4" width="18" height="18" rx="2" />
                <line x1="16" y1="2" x2="16" y2="6" />
                <line x1="8" y1="2" x2="8" y2="6" />
                <line x1="3" y1="10" x2="21" y2="10" />
              </svg>
            </div>
            <div>
              <h1 className="text-lg font-bold text-slate-900 tracking-tight">Absence Tracker</h1>
              <p className="text-xs text-slate-400 -mt-0.5">Monthly absence report</p>
            </div>
          </div>
          <MonthPicker month={month} year={year} onChange={(m, y) => { setMonth(m); setYear(y); }} />
        </div>
      </header>

      {/* Content */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
        {loading ? (
          <div className="flex items-center justify-center py-32">
            <div className="flex flex-col items-center gap-3">
              <div className="w-8 h-8 border-2 border-slate-200 border-t-slate-900 rounded-full animate-spin" />
              <p className="text-sm text-slate-400">Loading report...</p>
            </div>
          </div>
        ) : data.length === 0 ? (
          <div className="text-center py-32 text-slate-400">
            <p className="text-lg font-medium">No projects found</p>
            <p className="text-sm mt-1">Add projects in the admin panel to get started.</p>
          </div>
        ) : (
          <div className="space-y-8">
            {data.map((report, idx) => (
              <div
                key={report.project.id}
                className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden animate-fade-in"
                style={{ animationDelay: `${idx * 80}ms` }}
              >
                {/* Project Header */}
                <div className="px-6 py-5 border-b border-slate-50 flex items-start justify-between">
                  <div>
                    <h2 className="text-xl font-bold text-slate-900">{report.project.name}</h2>
                    <div className="flex items-center gap-4 mt-1.5 text-sm text-slate-400">
                      <span>
                        {String(report.period.month).padStart(2, '0')}.{report.period.year} &middot;{' '}
                        01.{String(report.period.month).padStart(2, '0')} &ndash;{' '}
                        {report.period.last_day}.{String(report.period.month).padStart(2, '0')}
                      </span>
                      <span className="flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-slate-300" />
                        Total Absentees: <span className="font-semibold text-slate-600">{report.total_absentees}</span>
                      </span>
                    </div>
                  </div>
                  {report.project.logo_url && (
                    <img
                      src={report.project.logo_url}
                      alt={report.project.name}
                      className="w-12 h-12 rounded-xl object-contain bg-slate-50 p-1"
                    />
                  )}
                </div>

                {/* Employee Table */}
                {report.employees.length === 0 ? (
                  <div className="px-6 py-12 text-center text-slate-400 text-sm">
                    No absences recorded for this period
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-slate-100">
                          <th className="text-left text-xs font-semibold text-slate-400 uppercase tracking-wider px-6 py-3">
                            Employee Name
                          </th>
                          <th className="text-center text-xs font-semibold text-slate-400 uppercase tracking-wider px-4 py-3 w-28">
                            Days Absent
                          </th>
                          <th className="text-left text-xs font-semibold text-slate-400 uppercase tracking-wider px-6 py-3">
                            Absence Periods
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {report.employees.map((emp, i) => (
                          <tr
                            key={emp.id}
                            className={`border-b border-slate-50 last:border-0 transition-colors hover:bg-slate-50/50 ${
                              i % 2 === 1 ? 'bg-slate-50/30' : ''
                            }`}
                          >
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-3">
                                <Avatar
                                  firstName={emp.first_name}
                                  lastName={emp.last_name}
                                  avatarUrl={emp.avatar_url}
                                />
                                <span className="font-medium text-slate-800 text-sm">
                                  {emp.first_name} {emp.last_name}
                                </span>
                              </div>
                            </td>
                            <td className="px-4 py-4 text-center">
                              <span className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-slate-100 text-sm font-bold text-slate-700">
                                {emp.total_days}
                              </span>
                            </td>
                            <td className="px-6 py-4">
                              <div className="flex flex-wrap gap-1.5">
                                {emp.absences.map((ab) => (
                                  <AbsenceBadge
                                    key={ab.id}
                                    type={ab.type}
                                    dateFrom={ab.date_from}
                                    dateTo={ab.date_to}
                                  />
                                ))}
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                {/* Footer */}
                <div className="px-6 py-3 bg-slate-50/50 border-t border-slate-50">
                  <p className="text-xs text-slate-400">
                    This report includes all absences recorded during {monthNames[report.period.month]} {report.period.year}.
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
