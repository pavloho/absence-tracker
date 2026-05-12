'use client';

import { useState, useEffect, useCallback } from 'react';
import { Modal } from '@/components/Modal';
import { IconPlus, IconPencil, IconTrash } from '@tabler/icons-react';

interface Project {
  id: number;
  name: string;
  logo_url: string | null;
}

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Project | null>(null);
  const [name, setName] = useState('');
  const [logoUrl, setLogoUrl] = useState('');

  const fetchProjects = useCallback(async () => {
    const res = await fetch('/api/projects');
    const data = await res.json();
    setProjects(data);
    setLoading(false);
  }, []);

  useEffect(() => { fetchProjects(); }, [fetchProjects]);

  const openCreate = () => {
    setEditing(null);
    setName('');
    setLogoUrl('');
    setModalOpen(true);
  };

  const openEdit = (p: Project) => {
    setEditing(p);
    setName(p.name);
    setLogoUrl(p.logo_url || '');
    setModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editing) {
      await fetch(`/api/projects/${editing.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, logo_url: logoUrl || null }),
      });
    } else {
      await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, logo_url: logoUrl || null }),
      });
    }
    setModalOpen(false);
    fetchProjects();
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Delete this project? All associated absences will be removed.')) return;
    await fetch(`/api/projects/${id}`, { method: 'DELETE' });
    fetchProjects();
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Projects</h1>
          <p className="text-sm text-slate-400 mt-0.5">Manage your client projects</p>
        </div>
        <button
          onClick={openCreate}
          className="bg-slate-900 text-white px-4 py-2.5 rounded-xl text-sm font-semibold hover:bg-slate-800 transition-colors flex items-center gap-2"
        >
          <IconPlus size={16} />
          Add Project
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="w-8 h-8 border-2 border-slate-200 border-t-slate-900 rounded-full animate-spin" />
        </div>
      ) : projects.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-100 p-12 text-center">
          <p className="text-slate-400">No projects yet. Create your first project.</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {projects.map((p) => (
            <div
              key={p.id}
              className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  {p.logo_url ? (
                    <img src={p.logo_url} alt="" className="w-10 h-10 rounded-xl object-contain bg-slate-50 p-0.5" />
                  ) : (
                    <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-400 font-bold text-sm">
                      {p.name.charAt(0)}
                    </div>
                  )}
                  <h3 className="font-semibold text-slate-900">{p.name}</h3>
                </div>
              </div>
              <div className="flex gap-2 mt-4 pt-4 border-t border-slate-50">
                <button
                  onClick={() => openEdit(p)}
                  className="text-xs font-medium text-slate-400 hover:text-slate-700 transition-colors px-3 py-1.5 rounded-lg hover:bg-slate-50"
                >
                  Edit
                </button>
                <button
                  onClick={() => handleDelete(p.id)}
                  className="text-xs font-medium text-slate-400 hover:text-red-500 transition-colors px-3 py-1.5 rounded-lg hover:bg-red-50"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Edit Project' : 'New Project'}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Project Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-300"
              placeholder="e.g. SEO AI"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Logo URL <span className="text-slate-400 font-normal">(optional)</span></label>
            <input
              type="url"
              value={logoUrl}
              onChange={(e) => setLogoUrl(e.target.value)}
              className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-300"
              placeholder="https://example.com/logo.png"
            />
          </div>
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={() => setModalOpen(false)}
              className="flex-1 px-4 py-2.5 border border-slate-200 rounded-xl text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 bg-slate-900 text-white px-4 py-2.5 rounded-xl text-sm font-semibold hover:bg-slate-800 transition-colors"
            >
              {editing ? 'Save Changes' : 'Create Project'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
