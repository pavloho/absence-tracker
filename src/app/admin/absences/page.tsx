'use client';

import { useState, useEffect, useCallback } from 'react';
import { Modal } from '@/components/Modal';
import { Avatar } from '@/components/Avatar';
import { AbsenceBadge } from '@/components/AbsenceBadge';
import { IconPlus, IconCalendarPlus, IconPencil, IconTrash, IconConfetti, IconThermometer, IconPlane } from '@tabler/icons-react';

interface Project { id: number; name: string; }
interface Employee { id: number; first_name: string; last_name: string; avatar_url: string | null; projects: { id: number; name: string }[]; }
interface Absence {
  id: number;
  employee_id: number;
  project_id: number;
  type: string;
  date_from: string;
  date_to: string | null;
  first_name: string;
  last_name: string;
  avatar_url: string | null;
  project_name: string;
}

export default function AbsencesPage() {
  const now = new Date();
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());
  const [projectFilter, setProjectFilter] = useState('');
  const [projects, setProjects] = useState<Project[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [absences, setAbsences] = useState<Absence[]>([]);
  const [loading, setLoading] = useState(true);

  const [modalOpen, setModalOpen] = useState(false);
  const [bulkModalOpen, setBulkModalOpen] = useState(false);
  const [editing, setEditing] = useState<Absence | null>(null);

  const [formEmployeeId, setFormEmployeeId] = useState('');
  const [formProjectId, setFormProjectId] = useState('');
  const [formType, setFormType] = useState('Holiday');
  const [formDateFrom, setFormDateFrom] = useState('');
  const [formDateTo, setFormDateTo] = useState('');
  const [formDates, setFormDates] = useState<string[]>([]);
  const [formDateMode, setFormDateMode] = useState<'range' | 'multiple'>('range');

  const [bulkProjectId, setBulkProjectId] = useState('');
  const [bulkType, setBulkType] = useState('Holiday');
  const [bulkDate, setBulkDate] = useState('');

  const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];

  const fetchData = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (projectFilter) params.set('project_id', projectFilter);
    params.set('month', String(month));
    params.set('year', String(year));

    const [absRes, projRes, empRes] = await Promise.all([
      fetch(`/api/absences?${params}`),
      fetch('/api/projects'),
      fetch(projectFilter ? `/api/employees?project_id=${projectFilter}` : '/api/employees'),
    ]);
    const [absData, projData, empData] = await Promise.all([absRes.json(), projRes.json(), empRes.json()]);
    setAbsences(absData);
    setProjects(projData);
    setEmployees(empData);
    setLoading(false);
  }, [month, year, projectFilter]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleEmployeeChange = (empId: string) => {
    setFormEmployeeId(empId);
    if (empId) {
      const emp = employees.find((e) => e.id === Number(empId));
      if (emp && emp.projects?.length === 1) {
        setFormProjectId(String(emp.projects[0].id));
      }
    }
  };

  const addDate = (date: string) => {
    if (date && !formDates.includes(date)) {
      setFormDates((prev) => [...prev, date].sort());
    }
  };

  const removeDate = (date: string) => {
    setFormDates((prev) => prev.filter((d) => d !== date));
  };

  const openCreate = () => {
    setEditing(null);
    setFormEmployeeId('');
    setFormProjectId(projectFilter || '');
    setFormType('Holiday');
    setFormDateFrom('');
    setFormDateTo('');
    setFormDates([]);
    setFormDateMode('range');
    setModalOpen(true);
  };

  const openEdit = (ab: Absence) => {
    setEditing(ab);
    setFormEmployeeId(String(ab.employee_id));
    setFormProjectId(String(ab.project_id));
    setFormType(ab.type);
    setFormDateFrom(ab.date_from.split('T')[0]);
    setFormDateTo(ab.date_to ? ab.date_to.split('T')[0] : '');
    setModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (editing) {
      await fetch(`/api/absences/${editing.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          employee_id: Number(formEmployeeId),
          project_id: Number(formProjectId),
          type: formType,
          date_from: formDateFrom,
          date_to: formDateTo || null,
        }),
      });
    } else if (formDateMode === 'multiple' && formDates.length > 0) {
      await Promise.all(
        formDates.map((date) =>
          fetch('/api/absences', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              employee_id: Number(formEmployeeId),
              project_id: Number(formProjectId),
              type: formType,
              date_from: date,
              date_to: null,
            }),
          })
        )
      );
    } else {
      await fetch('/api/absences', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          employee_id: Number(formEmployeeId),
          project_id: Number(formProjectId),
          type: formType,
          date_from: formDateFrom,
          date_to: formDateTo || null,
        }),
      });
    }
    setModalOpen(false);
    fetchData();
  };

  const handleBulk = async (e: React.FormEvent) => {
    e.preventDefault();
    await fetch('/api/absences/bulk', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        project_id: Number(bulkProjectId),
        type: bulkType,
        date_from: bulkDate,
        date_to: null,
      }),
    });
    setBulkModalOpen(false);
    fetchData();
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Delete this absence record?')) return;
    await fetch(`/api/absences/${id}`, { method: 'DELETE' });
    fetchData();
  };

  const filteredEmployees = formProjectId
    ? employees.filter((e) => e.projects?.some((p) => p.id === Number(formProjectId)))
    : employees;

  const years = [];
  for (let y = now.getFullYear() - 2; y <= now.getFullYear() + 1; y++) years.push(y);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Absences</h1>
          <p className="text-sm text-slate-400 mt-0.5">Record and manage employee absences</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => { setBulkProjectId(projectFilter || (projects[0]?.id ? String(projects[0].id) : '')); setBulkDate(''); setBulkType('Holiday'); setBulkModalOpen(true); }}
            className="border border-slate-200 text-slate-700 px-4 py-2.5 rounded-xl text-sm font-medium hover:bg-slate-50 transition-colors flex items-center gap-2"
          >
            <IconCalendarPlus size={16} />
            Add Holiday for All
          </button>
          <button
            onClick={openCreate}
            className="bg-slate-900 text-white px-4 py-2.5 rounded-xl text-sm font-semibold hover:bg-slate-800 transition-colors flex items-center gap-2"
          >
            <IconPlus size={16} />
            Add Absence
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-3 mb-6">
        <select
          value={projectFilter}
          onChange={(e) => setProjectFilter(e.target.value)}
          className="px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-medium text-slate-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-slate-900/10"
        >
          <option value="">All Projects</option>
          {projects.map((p) => (
            <option key={p.id} value={p.id}>{p.name}</option>
          ))}
        </select>
        <select
          value={month}
          onChange={(e) => setMonth(Number(e.target.value))}
          className="px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-medium text-slate-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-slate-900/10"
        >
          {MONTHS.map((name, i) => (
            <option key={i} value={i + 1}>{name}</option>
          ))}
        </select>
        <select
          value={year}
          onChange={(e) => setYear(Number(e.target.value))}
          className="px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-medium text-slate-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-slate-900/10"
        >
          {years.map((y) => (
            <option key={y} value={y}>{y}</option>
          ))}
        </select>
      </div>

      {/* Timeline */}
      {loading ? (
        <div className="flex justify-center py-20">
          <div className="w-8 h-8 border-2 border-slate-200 border-t-slate-900 rounded-full animate-spin" />
        </div>
      ) : absences.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-100 p-12 text-center">
          <p className="text-slate-400">No absences for {MONTHS[month - 1]} {year}.</p>
        </div>
      ) : (() => {
        const daysInMonth = new Date(year, month, 0).getDate();
        const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);

        const TYPE_COLORS: Record<string, { cell: string; dot: string; icon: React.ReactNode; legendIcon: React.ReactNode }> = {
          Holiday: { cell: 'bg-blue-500', dot: 'bg-blue-500', icon: <IconConfetti size={13} className="text-white" />, legendIcon: <IconConfetti size={14} className="text-blue-500" /> },
          'Sick Leave': { cell: 'bg-red-500', dot: 'bg-red-500', icon: <IconThermometer size={13} className="text-white" />, legendIcon: <IconThermometer size={14} className="text-red-500" /> },
          Vacation: { cell: 'bg-emerald-500', dot: 'bg-emerald-500', icon: <IconPlane size={13} className="text-white" />, legendIcon: <IconPlane size={14} className="text-emerald-500" /> },
        };

        const today = new Date();
        const isCurrentMonth = today.getMonth() + 1 === month && today.getFullYear() === year;
        const todayDate = today.getDate();

        // Group absences by employee+project, build per-day map for each
        type Row = {
          key: string;
          employee: { id: number; first_name: string; last_name: string; avatar_url: string | null };
          project: string;
          dayAbsence: Map<number, Absence>;
        };
        const rowMap = new Map<string, Row>();
        absences.forEach((ab) => {
          const key = `${ab.employee_id}-${ab.project_id}`;
          if (!rowMap.has(key)) {
            rowMap.set(key, {
              key,
              employee: { id: ab.employee_id, first_name: ab.first_name, last_name: ab.last_name, avatar_url: ab.avatar_url },
              project: ab.project_name,
              dayAbsence: new Map(),
            });
          }
          const row = rowMap.get(key)!;
          const from = new Date(ab.date_from.split('T')[0] + 'T00:00:00');
          const to = ab.date_to ? new Date(ab.date_to.split('T')[0] + 'T00:00:00') : from;
          const cursor = new Date(from);
          while (cursor <= to) {
            if (cursor.getMonth() + 1 === month && cursor.getFullYear() === year) {
              row.dayAbsence.set(cursor.getDate(), ab);
            }
            cursor.setDate(cursor.getDate() + 1);
          }
        });
        const rows = Array.from(rowMap.values()).sort((a, b) =>
          a.employee.last_name.trim().localeCompare(b.employee.last_name.trim())
        );

        const isWeekend = (day: number) => {
          const dow = new Date(year, month - 1, day).getDay();
          return dow === 0 || dow === 6;
        };

        const CELL_W = 32;
        const ROW_H = 44;
        const WEEKDAY_ABBR = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

        // Merge consecutive same-absence days into segments per row
        const rowSegments = rows.map((row) => {
          const segments: { startDay: number; endDay: number; ab: Absence }[] = [];
          let d = 1;
          while (d <= daysInMonth) {
            const ab = row.dayAbsence.get(d);
            if (!ab) { d++; continue; }
            let end = d;
            while (end + 1 <= daysInMonth && row.dayAbsence.get(end + 1)?.id === ab.id) end++;
            segments.push({ startDay: d, endDay: end, ab });
            d = end + 1;
          }
          return { row, segments };
        });

        return (
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <div className="min-w-max">
                {/* Header row with day numbers */}
                <div className="flex border-b border-slate-100 sticky top-0 bg-white z-10">
                  <div className="w-[200px] shrink-0 px-4 py-2 text-xs font-semibold text-slate-400 uppercase tracking-wider sticky left-0 bg-white border-r border-slate-100">
                    Employee
                  </div>
                  {days.map((day) => {
                    const weekend = isWeekend(day);
                    const isToday = isCurrentMonth && day === todayDate;
                    return (
                      <div
                        key={day}
                        className={`shrink-0 py-1.5 text-center border-r border-slate-200/70 last:border-r-0 ${
                          weekend ? 'bg-slate-100' : ''
                        }`}
                        style={{ width: CELL_W }}
                      >
                        <div className={`text-[11px] font-semibold ${weekend ? 'text-slate-400' : 'text-slate-600'}`}>
                          <span className={isToday ? 'inline-flex items-center justify-center w-5 h-5 rounded-full bg-slate-900 text-white' : ''}>
                            {day}
                          </span>
                        </div>
                        <div className={`text-[9px] font-medium uppercase tracking-tight ${weekend ? 'text-slate-300' : 'text-slate-400'}`}>
                          {WEEKDAY_ABBR[new Date(year, month - 1, day).getDay()]}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Employee rows */}
                {rowSegments.map(({ row, segments }, ri) => (
                  <div key={row.key} className={`flex border-b border-slate-50 last:border-0 ${ri % 2 === 1 ? 'bg-slate-50/30' : ''}`}>
                    <div className={`w-[200px] shrink-0 px-4 flex items-center gap-2 sticky left-0 border-r border-slate-100 ${ri % 2 === 1 ? 'bg-slate-50' : 'bg-white'}`} style={{ height: ROW_H }}>
                      <Avatar firstName={row.employee.first_name} lastName={row.employee.last_name} avatarUrl={row.employee.avatar_url} size={28} />
                      <div className="min-w-0">
                        <div className="text-xs font-semibold text-slate-800 truncate">{row.employee.last_name} {row.employee.first_name}</div>
                        <div className="text-[10px] text-slate-400 truncate">{row.project}</div>
                      </div>
                    </div>
                    <div className="relative shrink-0" style={{ width: daysInMonth * CELL_W, height: ROW_H }}>
                      {/* Day grid background */}
                      <div className="absolute inset-0 flex">
                        {days.map((day) => (
                          <div key={day} className={`shrink-0 border-r border-slate-100 last:border-r-0 ${isWeekend(day) ? 'bg-slate-100/80' : ''}`} style={{ width: CELL_W }} />
                        ))}
                      </div>
                      {/* Absence bars */}
                      {segments.map((seg) => {
                        const colors = TYPE_COLORS[seg.ab.type] || TYPE_COLORS.Holiday;
                        const span = seg.endDay - seg.startDay + 1;
                        const left = (seg.startDay - 1) * CELL_W + 3;
                        const width = span * CELL_W - 6;
                        return (
                          <div
                            key={`${seg.ab.id}-${seg.startDay}`}
                            onClick={() => openEdit(seg.ab)}
                            title={`${seg.ab.first_name} ${seg.ab.last_name} · ${seg.ab.type}`}
                            className={`group absolute top-1/2 -translate-y-1/2 h-7 rounded-md ${colors.cell} flex items-center gap-1 px-1.5 cursor-pointer hover:ring-2 hover:ring-offset-1 hover:ring-slate-300 transition-all overflow-hidden`}
                            style={{ left, width }}
                          >
                            <span className="shrink-0">{colors.icon}</span>
                            {span > 1 && (
                              <span className="text-[11px] font-bold text-white whitespace-nowrap">{span} days</span>
                            )}
                            <div className="absolute left-0 top-full mt-1 z-20 hidden group-hover:block">
                              <div className="bg-white rounded-xl shadow-lg border border-slate-200 p-2.5 min-w-[180px]">
                                <div className="text-xs font-semibold text-slate-800 mb-1">{seg.ab.first_name} {seg.ab.last_name}</div>
                                <div className="mb-2"><AbsenceBadge type={seg.ab.type} dateFrom={seg.ab.date_from} dateTo={seg.ab.date_to} /></div>
                                <div className="flex gap-1 border-t border-slate-100 pt-1.5">
                                  <button onClick={(e) => { e.stopPropagation(); openEdit(seg.ab); }} className="flex items-center gap-1 text-xs text-slate-500 hover:text-slate-800 px-2 py-1 rounded-lg hover:bg-slate-50 cursor-pointer">
                                    <IconPencil size={12} /> Edit
                                  </button>
                                  <button onClick={(e) => { e.stopPropagation(); handleDelete(seg.ab.id); }} className="flex items-center gap-1 text-xs text-slate-500 hover:text-red-600 px-2 py-1 rounded-lg hover:bg-red-50 cursor-pointer">
                                    <IconTrash size={12} /> Delete
                                  </button>
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Legend */}
            <div className="px-4 py-3 border-t border-slate-100 bg-slate-50/50 flex items-center gap-4">
              {Object.entries(TYPE_COLORS).map(([type, colors]) => (
                <div key={type} className="flex items-center gap-1.5">
                  {colors.legendIcon}
                  <span className="text-xs text-slate-500">{type}</span>
                </div>
              ))}
              <span className="text-xs text-slate-400 ml-auto">{rows.length} employee{rows.length !== 1 ? 's' : ''} · {absences.length} absence{absences.length !== 1 ? 's' : ''}</span>
            </div>
          </div>
        );
      })()}

      {/* Add/Edit Modal */}
      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Edit Absence' : 'Add Absence'}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Employee</label>
            <select
              value={formEmployeeId}
              onChange={(e) => handleEmployeeChange(e.target.value)}
              className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-slate-900/10"
              required
            >
              <option value="">Select employee...</option>
              {employees.map((e) => (
                <option key={e.id} value={e.id}>{e.first_name} {e.last_name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Project</label>
            <select
              value={formProjectId}
              onChange={(e) => setFormProjectId(e.target.value)}
              className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-slate-900/10"
              required
            >
              <option value="">Select project...</option>
              {(formEmployeeId
                ? employees.find((e) => e.id === Number(formEmployeeId))?.projects || []
                : projects
              ).map((p) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Type</label>
            <select
              value={formType}
              onChange={(e) => setFormType(e.target.value)}
              className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-slate-900/10"
            >
              <option value="Holiday">Holiday</option>
              <option value="Sick Leave">Sick Leave</option>
              <option value="Vacation">Vacation</option>
            </select>
          </div>

          {!editing && (
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Date mode</label>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setFormDateMode('range')}
                  className={`flex-1 px-3 py-2 rounded-xl text-xs font-medium border transition-all ${
                    formDateMode === 'range'
                      ? 'bg-slate-900 text-white border-slate-900'
                      : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'
                  }`}
                >
                  Single / Range
                </button>
                <button
                  type="button"
                  onClick={() => setFormDateMode('multiple')}
                  className={`flex-1 px-3 py-2 rounded-xl text-xs font-medium border transition-all ${
                    formDateMode === 'multiple'
                      ? 'bg-slate-900 text-white border-slate-900'
                      : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'
                  }`}
                >
                  Multiple dates
                </button>
              </div>
            </div>
          )}

          {editing || formDateMode === 'range' ? (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Date From</label>
                <input
                  type="date"
                  value={formDateFrom}
                  onChange={(e) => setFormDateFrom(e.target.value)}
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-slate-900/10"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Date To <span className="text-slate-400 font-normal">(optional)</span></label>
                <input
                  type="date"
                  value={formDateTo}
                  onChange={(e) => setFormDateTo(e.target.value)}
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-slate-900/10"
                />
              </div>
            </div>
          ) : (
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Dates</label>
              <div className="flex gap-2 mb-2">
                <input
                  type="date"
                  id="multiDateInput"
                  className="flex-1 px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-slate-900/10"
                />
                <button
                  type="button"
                  onClick={() => {
                    const input = document.getElementById('multiDateInput') as HTMLInputElement;
                    if (input?.value) { addDate(input.value); input.value = ''; }
                  }}
                  className="px-4 py-2.5 bg-slate-900 text-white rounded-xl text-sm font-medium hover:bg-slate-800 transition-colors"
                >
                  Add
                </button>
              </div>
              {formDates.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {formDates.map((d) => (
                    <span key={d} className="inline-flex items-center gap-1 px-2.5 py-1 bg-slate-100 text-slate-700 rounded-full text-xs font-medium">
                      {d}
                      <button type="button" onClick={() => removeDate(d)} className="text-slate-400 hover:text-red-500 transition-colors">
                        &times;
                      </button>
                    </span>
                  ))}
                </div>
              )}
              {formDates.length === 0 && (
                <p className="text-xs text-slate-400">Pick dates and click Add</p>
              )}
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={() => setModalOpen(false)} className="flex-1 px-4 py-2.5 border border-slate-200 rounded-xl text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors">
              Cancel
            </button>
            <button
              type="submit"
              disabled={formDateMode === 'multiple' && !editing && formDates.length === 0}
              className="flex-1 bg-slate-900 text-white px-4 py-2.5 rounded-xl text-sm font-semibold hover:bg-slate-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {editing ? 'Save Changes' : formDateMode === 'multiple' && formDates.length > 1 ? `Add ${formDates.length} Absences` : 'Add Absence'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Bulk Modal */}
      <Modal open={bulkModalOpen} onClose={() => setBulkModalOpen(false)} title="Add Holiday for All Employees">
        <form onSubmit={handleBulk} className="space-y-4">
          <p className="text-sm text-slate-500">This will add a holiday for every employee assigned to the selected project.</p>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Project</label>
            <select
              value={bulkProjectId}
              onChange={(e) => setBulkProjectId(e.target.value)}
              className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-slate-900/10"
              required
            >
              <option value="">Select project...</option>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Type</label>
            <select
              value={bulkType}
              onChange={(e) => setBulkType(e.target.value)}
              className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-slate-900/10"
            >
              <option value="Holiday">Holiday</option>
              <option value="Sick Leave">Sick Leave</option>
              <option value="Vacation">Vacation</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Date</label>
            <input
              type="date"
              value={bulkDate}
              onChange={(e) => setBulkDate(e.target.value)}
              className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-slate-900/10"
              required
            />
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={() => setBulkModalOpen(false)} className="flex-1 px-4 py-2.5 border border-slate-200 rounded-xl text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors">
              Cancel
            </button>
            <button type="submit" className="flex-1 bg-slate-900 text-white px-4 py-2.5 rounded-xl text-sm font-semibold hover:bg-slate-800 transition-colors">
              Add for All
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
