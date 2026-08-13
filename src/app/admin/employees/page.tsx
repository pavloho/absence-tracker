'use client';

import { useState, useEffect, useCallback } from 'react';
import { Modal } from '@/components/Modal';
import { Avatar } from '@/components/Avatar';
import { IconPlus } from '@tabler/icons-react';
import { ImageUpload } from '@/components/ImageUpload';

interface Project {
  id: number;
  name: string;
}

interface Employee {
  id: number;
  first_name: string;
  last_name: string;
  avatar_url: string | null;
  end_date: string | null;
  projects: Project[];
}

export default function EmployeesPage() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Employee | null>(null);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [endDate, setEndDate] = useState('');
  const [selectedProjects, setSelectedProjects] = useState<number[]>([]);
  const [filterProject, setFilterProject] = useState<string>('');

  const fetchData = useCallback(async () => {
    const [empRes, projRes] = await Promise.all([
      fetch(filterProject ? `/api/employees?project_id=${filterProject}` : '/api/employees'),
      fetch('/api/projects'),
    ]);
    const [empData, projData] = await Promise.all([empRes.json(), projRes.json()]);
    setEmployees(empData);
    setProjects(projData);
    setLoading(false);
  }, [filterProject]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const openCreate = () => {
    setEditing(null);
    setFirstName('');
    setLastName('');
    setAvatarUrl('');
    setEndDate('');
    setSelectedProjects([]);
    setModalOpen(true);
  };

  const openEdit = (emp: Employee) => {
    setEditing(emp);
    setFirstName(emp.first_name);
    setLastName(emp.last_name);
    setAvatarUrl(emp.avatar_url || '');
    setEndDate(emp.end_date || '');
    setSelectedProjects(emp.projects.map((p) => p.id));
    setModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const body = {
      first_name: firstName,
      last_name: lastName,
      avatar_url: avatarUrl || null,
      end_date: endDate || null,
      project_ids: selectedProjects,
    };

    if (editing) {
      await fetch(`/api/employees/${editing.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
    } else {
      await fetch('/api/employees', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
    }
    setModalOpen(false);
    fetchData();
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Delete this employee?')) return;
    await fetch(`/api/employees/${id}`, { method: 'DELETE' });
    fetchData();
  };

  const toggleProject = (pid: number) => {
    setSelectedProjects((prev) =>
      prev.includes(pid) ? prev.filter((x) => x !== pid) : [...prev, pid]
    );
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Employees</h1>
          <p className="text-sm text-slate-500 mt-0.5">Manage employee records and project assignments</p>
        </div>
        <button onClick={openCreate} className="btn btn-primary">
          <IconPlus size={16} />
          Add Employee
        </button>
      </div>

      {/* Filter */}
      <div className="mb-6">
        <select
          value={filterProject}
          onChange={(e) => setFilterProject(e.target.value)}
          className="field-select"
        >
          <option value="">All Projects</option>
          {projects.map((p) => (
            <option key={p.id} value={p.id}>{p.name}</option>
          ))}
        </select>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="w-8 h-8 border-2 border-slate-200 border-t-slate-900 rounded-full animate-spin" />
        </div>
      ) : employees.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-100 p-12 text-center">
          <p className="text-slate-500">No employees yet.</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-100">
                <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-6 py-3">Name</th>
                <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-6 py-3">Projects</th>
                <th className="text-right text-xs font-semibold text-slate-500 uppercase tracking-wider px-6 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {employees.map((emp, i) => (
                <tr key={emp.id} className={`border-b border-slate-50 last:border-0 ${i % 2 === 1 ? 'bg-slate-50/30' : ''}`}>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className={emp.end_date ? 'opacity-50' : ''}>
                        <Avatar firstName={emp.first_name} lastName={emp.last_name} avatarUrl={emp.avatar_url} size={36} />
                      </div>
                      <div>
                        <span className="font-medium text-sm text-slate-800">{emp.first_name} {emp.last_name}</span>
                        {emp.end_date && (
                          <span className="ml-2 inline-flex items-center px-2 py-0.5 bg-slate-100 text-slate-600 rounded-full text-[11px] font-medium">
                            Left {emp.end_date.split('-').reverse().join('.')}
                          </span>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-wrap gap-1.5">
                      {emp.projects.map((p) => (
                        <span key={p.id} className="px-2.5 py-1 bg-slate-100 text-slate-600 rounded-full text-xs font-medium">
                          {p.name}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button
                      onClick={() => openEdit(emp)}
                      className="text-xs font-medium text-slate-500 hover:text-slate-700 transition-colors px-3 py-1.5 rounded-lg hover:bg-slate-50"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(emp.id)}
                      className="text-xs font-medium text-slate-500 hover:text-red-500 transition-colors px-3 py-1.5 rounded-lg hover:bg-red-50"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Edit Employee' : 'New Employee'}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">First Name</label>
              <input
                type="text"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-300"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Last Name</label>
              <input
                type="text"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-300"
                required
              />
            </div>
          </div>
          <ImageUpload label="Avatar" value={avatarUrl} onChange={setAvatarUrl} />
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              Last working day <span className="text-slate-500 font-normal">(if left the company)</span>
            </label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-300"
            />
            {endDate && (
              <p className="text-xs text-slate-500 mt-1.5">
                Absences after this date will be hidden from reports.{' '}
                <button type="button" onClick={() => setEndDate('')} className="text-slate-600 underline hover:text-slate-900">
                  Clear
                </button>
              </p>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Projects</label>
            <div className="flex flex-wrap gap-2">
              {projects.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => toggleProject(p.id)}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
                    selectedProjects.includes(p.id)
                      ? 'bg-slate-900 text-white border-slate-900'
                      : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'
                  }`}
                >
                  {p.name}
                </button>
              ))}
            </div>
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={() => setModalOpen(false)} className="btn btn-secondary flex-1">
              Cancel
            </button>
            <button type="submit" className="btn btn-primary flex-1">
              {editing ? 'Save Changes' : 'Add Employee'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
