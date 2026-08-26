import { useState, useEffect } from 'react';
import {
  Loader2, Plus, ChevronDown, ChevronRight, BookOpen, Clock, Eye, EyeOff,
  Video, FileText, HelpCircle, Presentation, Upload, Link as LinkIcon,
} from 'lucide-react';
import {
  getPhases, createPhase,
  getModulesByPhase, createModule, updateModule,
  getContent, createContent, uploadContent,
} from '@/api/onboarding-lms.api';
import { PageHeader } from '@/components/common';

const MODULE_CATEGORIES = ['Welcome', 'Tools', 'People', 'Compliance', 'Role', 'Growth'];
const CONTENT_TYPES = ['video', 'quiz', 'pdf', 'slides'];
const TYPE_ICON = { video: Video, quiz: HelpCircle, pdf: FileText, slides: Presentation };

export default function OnboardingContent() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [phases, setPhases] = useState([]);

  // phase_id -> modules[] | undefined (not yet fetched)
  const [modulesByPhase, setModulesByPhase] = useState({});
  // module_id -> content[] | undefined
  const [contentByModule, setContentByModule] = useState({});

  const [expandedPhase, setExpandedPhase] = useState({});
  const [expandedModule, setExpandedModule] = useState({});

  const [showPhaseForm, setShowPhaseForm] = useState(false);
  const [phaseForm, setPhaseForm] = useState({ seq: '', label: '', day_offset_start: '', day_offset_end: '' });

  const [moduleFormFor, setModuleFormFor] = useState(null); // phase_id
  const [moduleForm, setModuleForm] = useState({ title: '', category: MODULE_CATEGORIES[0], duration_min: '', sort_order: 0 });

  const [contentModeFor, setContentModeFor] = useState(null); // module_id
  const [contentMode, setContentMode] = useState('link'); // 'link' | 'upload'
  const [linkForm, setLinkForm] = useState({ content_type: 'video', title: '', seq: 0, source_ref: '' });
  const [uploadFile, setUploadFile] = useState(null);
  const [uploadTitle, setUploadTitle] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadPhases();
  }, []);

  const loadPhases = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await getPhases();
      setPhases(response.data.data || []);
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to load curriculum');
    } finally {
      setLoading(false);
    }
  };

  // ==================== PHASES ====================

  const togglePhase = async (phase_id) => {
    setExpandedPhase((prev) => ({ ...prev, [phase_id]: !prev[phase_id] }));
    if (!modulesByPhase[phase_id]) {
      try {
        const response = await getModulesByPhase(phase_id);
        setModulesByPhase((prev) => ({ ...prev, [phase_id]: response.data.data || [] }));
      } catch (err) {
        setModulesByPhase((prev) => ({ ...prev, [phase_id]: [] }));
      }
    }
  };

  const refreshModules = async (phase_id) => {
    const response = await getModulesByPhase(phase_id);
    setModulesByPhase((prev) => ({ ...prev, [phase_id]: response.data.data || [] }));
  };

  const handleCreatePhase = async (e) => {
    e.preventDefault();
    try {
      await createPhase({
        seq: Number(phaseForm.seq),
        label: phaseForm.label,
        day_offset_start: Number(phaseForm.day_offset_start),
        day_offset_end: Number(phaseForm.day_offset_end),
      });
      setShowPhaseForm(false);
      setPhaseForm({ seq: '', label: '', day_offset_start: '', day_offset_end: '' });
      await loadPhases();
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to create phase');
    }
  };

  // ==================== MODULES ====================

  const toggleModule = async (module_id) => {
    setExpandedModule((prev) => ({ ...prev, [module_id]: !prev[module_id] }));
    if (!contentByModule[module_id]) {
      try {
        const response = await getContent(module_id);
        setContentByModule((prev) => ({ ...prev, [module_id]: response.data.data || [] }));
      } catch (err) {
        setContentByModule((prev) => ({ ...prev, [module_id]: [] }));
      }
    }
  };

  const refreshContent = async (module_id) => {
    const response = await getContent(module_id);
    setContentByModule((prev) => ({ ...prev, [module_id]: response.data.data || [] }));
  };

  const handleCreateModule = async (e, phase_id) => {
    e.preventDefault();
    try {
      await createModule(phase_id, {
        title: moduleForm.title,
        category: moduleForm.category,
        duration_min: moduleForm.duration_min ? Number(moduleForm.duration_min) : null,
        sort_order: Number(moduleForm.sort_order) || 0,
      });
      setModuleFormFor(null);
      setModuleForm({ title: '', category: MODULE_CATEGORIES[0], duration_min: '', sort_order: 0 });
      await refreshModules(phase_id);
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to create module');
    }
  };

  const togglePublish = async (module, phase_id) => {
    try {
      await updateModule(module.id, { status: module.status === 'published' ? 'draft' : 'published' });
      await refreshModules(phase_id);
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to update module');
    }
  };

  // ==================== CONTENT ====================

  const handleCreateLink = async (e, module_id) => {
    e.preventDefault();
    setSaving(true);
    try {
      await createContent(module_id, {
        content_type: linkForm.content_type,
        title: linkForm.title,
        seq: Number(linkForm.seq) || 0,
        payload: { source_ref: linkForm.source_ref },
      });
      setContentModeFor(null);
      setLinkForm({ content_type: 'video', title: '', seq: 0, source_ref: '' });
      await refreshContent(module_id);
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to add content item');
    } finally {
      setSaving(false);
    }
  };

  const handleUpload = async (e, module_id) => {
    e.preventDefault();
    if (!uploadFile) return;
    setSaving(true);
    try {
      await uploadContent(module_id, uploadFile, { title: uploadTitle });
      setContentModeFor(null);
      setUploadFile(null);
      setUploadTitle('');
      await refreshContent(module_id);
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to upload file');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center space-y-3">
          <Loader2 className="w-8 h-8 animate-spin mx-auto text-primary" />
          <p className="text-sm text-muted-foreground">Loading curriculum...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <PageHeader
        title="Onboarding"
        highlight="Curriculum"
        subtitle="Build the phases, modules, and content new hires move through."
      />

      {error && (
        <div className="border border-destructive/30 bg-destructive/10 text-destructive text-sm rounded-lg px-4 py-3">
          {error}
        </div>
      )}

      <div className="flex justify-end">
        <button
          onClick={() => setShowPhaseForm((v) => !v)}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium bg-primary text-primary-foreground hover:opacity-90"
        >
          <Plus className="w-4 h-4" /> Add phase
        </button>
      </div>

      {showPhaseForm && (
        <form onSubmit={handleCreatePhase} className="border rounded-lg bg-card p-4 grid grid-cols-4 gap-3 items-end">
          <div>
            <label className="text-xs text-muted-foreground">Order (seq)</label>
            <input
              required type="number" value={phaseForm.seq}
              onChange={(e) => setPhaseForm({ ...phaseForm, seq: e.target.value })}
              className="w-full mt-1 px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
          <div>
            <label className="text-xs text-muted-foreground">Label</label>
            <input
              required value={phaseForm.label} placeholder="Weeks 2-4"
              onChange={(e) => setPhaseForm({ ...phaseForm, label: e.target.value })}
              className="w-full mt-1 px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
          <div>
            <label className="text-xs text-muted-foreground">Day offset start</label>
            <input
              required type="number" value={phaseForm.day_offset_start}
              onChange={(e) => setPhaseForm({ ...phaseForm, day_offset_start: e.target.value })}
              className="w-full mt-1 px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
          <div>
            <label className="text-xs text-muted-foreground">Day offset end</label>
            <input
              required type="number" value={phaseForm.day_offset_end}
              onChange={(e) => setPhaseForm({ ...phaseForm, day_offset_end: e.target.value })}
              className="w-full mt-1 px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
          <div className="col-span-4 flex gap-2 justify-end">
            <button type="button" onClick={() => setShowPhaseForm(false)} className="px-4 py-2 text-sm rounded-lg border">
              Cancel
            </button>
            <button type="submit" className="px-4 py-2 text-sm rounded-lg bg-primary text-primary-foreground">
              Save phase
            </button>
          </div>
        </form>
      )}

      {phases.length === 0 ? (
        <div className="text-center py-12 border rounded-lg bg-card">
          <p className="text-muted-foreground">No phases yet — add the first one to start building the curriculum.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {phases.map((phase) => {
            const phaseOpen = !!expandedPhase[phase.id];
            const modules = modulesByPhase[phase.id];

            return (
              <div key={phase.id} className="border rounded-lg bg-card overflow-hidden">
                <button
                  onClick={() => togglePhase(phase.id)}
                  className="w-full flex items-center justify-between px-4 py-3 hover:bg-muted/30 text-left"
                >
                  <div className="flex items-center gap-3">
                    {phaseOpen ? <ChevronDown className="w-4 h-4 text-muted-foreground" /> : <ChevronRight className="w-4 h-4 text-muted-foreground" />}
                    <span className="text-xs font-medium text-muted-foreground">Seq {phase.seq}</span>
                    <span className="font-medium">{phase.label}</span>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    Day {phase.day_offset_start} to {phase.day_offset_end}
                  </span>
                </button>

                {phaseOpen && (
                  <div className="border-t px-4 py-3 space-y-3">
                    {modules === undefined ? (
                      <div className="text-sm text-muted-foreground py-2">Loading modules...</div>
                    ) : modules.length === 0 ? (
                      <div className="text-sm text-muted-foreground py-2">No modules in this phase yet.</div>
                    ) : (
                      <div className="space-y-2">
                        {modules.map((m) => {
                          const moduleOpen = !!expandedModule[m.id];
                          const items = contentByModule[m.id];

                          return (
                            <div key={m.id} className="border rounded-lg overflow-hidden">
                              <button
                                onClick={() => toggleModule(m.id)}
                                className="w-full flex items-center justify-between px-3 py-2 hover:bg-muted/20 text-left"
                              >
                                <div className="flex items-center gap-3">
                                  {moduleOpen ? <ChevronDown className="w-4 h-4 text-muted-foreground" /> : <ChevronRight className="w-4 h-4 text-muted-foreground" />}
                                  <BookOpen className="w-4 h-4 text-muted-foreground" />
                                  <span className="text-sm font-medium">{m.title}</span>
                                  <span className="text-xs px-2 py-0.5 rounded bg-muted text-muted-foreground">{m.category}</span>
                                  {m.duration_min && (
                                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                                      <Clock className="w-3 h-3" /> {m.duration_min} min
                                    </span>
                                  )}
                                </div>
                                <div className="flex items-center gap-3">
                                  <span
                                    className={`text-xs px-2 py-1 rounded font-medium ${
                                      m.status === 'published' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
                                    }`}
                                  >
                                    {m.status}
                                  </span>
                                  <span
                                    role="button"
                                    onClick={(e) => { e.stopPropagation(); togglePublish(m, phase.id); }}
                                    className="text-xs text-primary hover:underline flex items-center gap-1"
                                  >
                                    {m.status === 'published' ? <><EyeOff className="w-3 h-3" /> Unpublish</> : <><Eye className="w-3 h-3" /> Publish</>}
                                  </span>
                                </div>
                              </button>

                              {moduleOpen && (
                                <div className="border-t px-3 py-3 space-y-3 bg-muted/10">
                                  {items === undefined ? (
                                    <div className="text-sm text-muted-foreground py-1">Loading content...</div>
                                  ) : items.length === 0 ? (
                                    <div className="text-sm text-muted-foreground py-1">No content yet.</div>
                                  ) : (
                                    <div className="space-y-1">
                                      {items.map((item) => {
                                        const Icon = TYPE_ICON[item.content_type] || FileText;
                                        const source = item.payload?.source_ref || item.payload?.original_name || '—';
                                        return (
                                          <div key={item.id} className="flex items-center gap-3 text-sm border-b last:border-0 py-2">
                                            <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded bg-muted text-muted-foreground shrink-0">
                                              <Icon className="w-3 h-3" /> {item.content_type}
                                            </span>
                                            <span className="font-medium">{item.title}</span>
                                            <span className="text-xs text-muted-foreground truncate">{source}</span>
                                          </div>
                                        );
                                      })}
                                    </div>
                                  )}

                                  {contentModeFor === m.id ? (
                                    <div className="border rounded-lg p-3 bg-card space-y-3">
                                      <div className="flex gap-2">
                                        <button
                                          type="button"
                                          onClick={() => setContentMode('link')}
                                          className={`px-3 py-1.5 text-xs rounded-lg border flex items-center gap-1 ${contentMode === 'link' ? 'bg-primary text-primary-foreground' : ''}`}
                                        >
                                          <LinkIcon className="w-3 h-3" /> Link / quiz
                                        </button>
                                        <button
                                          type="button"
                                          onClick={() => setContentMode('upload')}
                                          className={`px-3 py-1.5 text-xs rounded-lg border flex items-center gap-1 ${contentMode === 'upload' ? 'bg-primary text-primary-foreground' : ''}`}
                                        >
                                          <Upload className="w-3 h-3" /> Upload file
                                        </button>
                                      </div>

                                      {contentMode === 'link' ? (
                                        <form onSubmit={(e) => handleCreateLink(e, m.id)} className="grid grid-cols-4 gap-3 items-end">
                                          <div>
                                            <label className="text-xs text-muted-foreground">Type</label>
                                            <select
                                              value={linkForm.content_type}
                                              onChange={(e) => setLinkForm({ ...linkForm, content_type: e.target.value })}
                                              className="w-full mt-1 px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                                            >
                                              {CONTENT_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                                            </select>
                                          </div>
                                          <div className="col-span-2">
                                            <label className="text-xs text-muted-foreground">Title</label>
                                            <input
                                              required value={linkForm.title}
                                              onChange={(e) => setLinkForm({ ...linkForm, title: e.target.value })}
                                              className="w-full mt-1 px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                                            />
                                          </div>
                                          <div>
                                            <label className="text-xs text-muted-foreground">Order (seq)</label>
                                            <input
                                              type="number" value={linkForm.seq}
                                              onChange={(e) => setLinkForm({ ...linkForm, seq: e.target.value })}
                                              className="w-full mt-1 px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                                            />
                                          </div>
                                          <div className="col-span-4">
                                            <label className="text-xs text-muted-foreground">
                                              {linkForm.content_type === 'quiz' ? 'Quiz reference / questions link' : 'Source URL'}
                                            </label>
                                            <input
                                              required value={linkForm.source_ref} placeholder="https://..."
                                              onChange={(e) => setLinkForm({ ...linkForm, source_ref: e.target.value })}
                                              className="w-full mt-1 px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                                            />
                                          </div>
                                          <div className="col-span-4 flex gap-2 justify-end">
                                            <button type="button" onClick={() => setContentModeFor(null)} className="px-4 py-2 text-sm rounded-lg border">
                                              Cancel
                                            </button>
                                            <button type="submit" disabled={saving} className="px-4 py-2 text-sm rounded-lg bg-primary text-primary-foreground disabled:opacity-50">
                                              {saving ? 'Saving...' : 'Add content'}
                                            </button>
                                          </div>
                                        </form>
                                      ) : (
                                        <form onSubmit={(e) => handleUpload(e, m.id)} className="grid grid-cols-4 gap-3 items-end">
                                          <div className="col-span-2">
                                            <label className="text-xs text-muted-foreground">Title (optional — defaults to filename)</label>
                                            <input
                                              value={uploadTitle}
                                              onChange={(e) => setUploadTitle(e.target.value)}
                                              className="w-full mt-1 px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                                            />
                                          </div>
                                          <div className="col-span-2">
                                            <label className="text-xs text-muted-foreground">File (PDF, DOCX, MP4, MOV, or WEBM)</label>
                                            <input
                                              required type="file" accept=".pdf,.docx,.mp4,.mov,.webm"
                                              onChange={(e) => setUploadFile(e.target.files?.[0] || null)}
                                              className="w-full mt-1 text-sm"
                                            />
                                          </div>
                                          <div className="col-span-4 flex gap-2 justify-end">
                                            <button type="button" onClick={() => setContentModeFor(null)} className="px-4 py-2 text-sm rounded-lg border">
                                              Cancel
                                            </button>
                                            <button type="submit" disabled={saving || !uploadFile} className="px-4 py-2 text-sm rounded-lg bg-primary text-primary-foreground disabled:opacity-50">
                                              {saving ? 'Uploading...' : 'Upload'}
                                            </button>
                                          </div>
                                        </form>
                                      )}
                                    </div>
                                  ) : (
                                    <button
                                      onClick={() => { setContentModeFor(m.id); setContentMode('link'); }}
                                      className="inline-flex items-center gap-2 text-sm text-primary hover:underline"
                                    >
                                      <Plus className="w-4 h-4" /> Add content
                                    </button>
                                  )}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}

                    {moduleFormFor === phase.id ? (
                      <form onSubmit={(e) => handleCreateModule(e, phase.id)} className="grid grid-cols-4 gap-3 items-end border rounded-lg p-3 bg-muted/20">
                        <div className="col-span-2">
                          <label className="text-xs text-muted-foreground">Title</label>
                          <input
                            required value={moduleForm.title}
                            onChange={(e) => setModuleForm({ ...moduleForm, title: e.target.value })}
                            className="w-full mt-1 px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                          />
                        </div>
                        <div>
                          <label className="text-xs text-muted-foreground">Category</label>
                          <select
                            value={moduleForm.category}
                            onChange={(e) => setModuleForm({ ...moduleForm, category: e.target.value })}
                            className="w-full mt-1 px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                          >
                            {MODULE_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                          </select>
                        </div>
                        <div>
                          <label className="text-xs text-muted-foreground">Duration (min)</label>
                          <input
                            type="number" value={moduleForm.duration_min}
                            onChange={(e) => setModuleForm({ ...moduleForm, duration_min: e.target.value })}
                            className="w-full mt-1 px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                          />
                        </div>
                        <div className="col-span-4 flex gap-2 justify-end">
                          <button type="button" onClick={() => setModuleFormFor(null)} className="px-4 py-2 text-sm rounded-lg border">
                            Cancel
                          </button>
                          <button type="submit" className="px-4 py-2 text-sm rounded-lg bg-primary text-primary-foreground">
                            Save module
                          </button>
                        </div>
                      </form>
                    ) : (
                      <button
                        onClick={() => setModuleFormFor(phase.id)}
                        className="inline-flex items-center gap-2 text-sm text-primary hover:underline"
                      >
                        <Plus className="w-4 h-4" /> Add module
                      </button>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}