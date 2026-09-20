import { useState, useEffect } from 'react';
import {
  Loader2, Plus, ChevronDown, ChevronRight, ChevronUp, BookOpen, Clock,
  Eye, EyeOff, Video, FileText, Presentation, MessageSquare, Upload,
  Link as LinkIcon, Download, ExternalLink, X,
} from 'lucide-react';
import {
  getPhases, createPhase, reorderPhases,
  getModulesByPhase, createModule, updateModule,
  getContent, createContent, uploadContent, updateContent, downloadContentFile,
} from '@/api/onboarding-lms.api';
import { PageHeader } from '@/components/common';

const CONTENT_TYPES = ['video', 'pdf', 'slides'];
const TYPE_ICON = { video: Video, pdf: FileText, slides: Presentation, text: MessageSquare };

function computePhaseOffsets(existingPhases, durationDays, beforeStart) {
  const duration = Number(durationDays) || 0;
  if (beforeStart && existingPhases.length === 0) {
    const day_offset_end = 0;
    return { day_offset_start: day_offset_end - duration + 1, day_offset_end };
  }
  const prev = existingPhases[existingPhases.length - 1];
  const day_offset_start = prev ? prev.day_offset_end + 1 : 1;
  return { day_offset_start, day_offset_end: day_offset_start + duration - 1 };
}

function Modal({ title, onClose, children }) {
  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-white rounded-xl shadow-xl w-full max-w-lg p-6" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-lg">{title}</h3>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
            <X className="w-4 h-4" />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

function Field({ label, children }) {
  return (
    <div className="space-y-1">
      <label className="text-xs font-medium text-muted-foreground">{label}</label>
      {children}
    </div>
  );
}

const inputClass = "w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary";

export default function OnboardingContent() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [phases, setPhases] = useState([]);
  const [modulesByPhase, setModulesByPhase] = useState({});
  const [contentByModule, setContentByModule] = useState({});
  const [expandedPhase, setExpandedPhase] = useState({});
  const [expandedModule, setExpandedModule] = useState({});
  const [saving, setSaving] = useState(false);

  // modal: null | { type: 'phase' } | { type: 'module', phaseId } | { type: 'content', moduleId }
  const [modal, setModal] = useState(null);

  const [phaseForm, setPhaseForm] = useState({ label: '', duration_days: '', before_start: false });
  const [moduleForm, setModuleForm] = useState({ title: '', duration_min: '' });
  const [contentTab, setContentTab] = useState('text');
  const [contentForm, setContentForm] = useState({ content_type: 'video', title: '', source_ref: '', body_text: '' });
  const [uploadFile, setUploadFile] = useState(null);
  const [uploadTitle, setUploadTitle] = useState('');

  useEffect(() => { loadPhases(); }, []);

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

  const closeModal = () => {
    setModal(null);
    setPhaseForm({ label: '', duration_days: '', before_start: false });
    setModuleForm({ title: '', duration_min: '' });
    setContentTab('text');
    setContentForm({ content_type: 'video', title: '', source_ref: '', body_text: '' });
    setUploadFile(null);
    setUploadTitle('');
  };

  // ==================== PHASES ====================

  const togglePhase = async (phase_id) => {
    setExpandedPhase((prev) => ({ ...prev, [phase_id]: !prev[phase_id] }));
    if (!modulesByPhase[phase_id]) {
      try {
        const response = await getModulesByPhase(phase_id);
        setModulesByPhase((prev) => ({ ...prev, [phase_id]: response.data.data || [] }));
      } catch {
        setModulesByPhase((prev) => ({ ...prev, [phase_id]: [] }));
      }
    }
  };

  const refreshModules = async (phase_id) => {
    const response = await getModulesByPhase(phase_id);
    setModulesByPhase((prev) => ({ ...prev, [phase_id]: response.data.data || [] }));
  };

  const phasePreview = phaseForm.duration_days
    ? computePhaseOffsets(phases, phaseForm.duration_days, phaseForm.before_start)
    : null;

  const handleCreatePhase = async (e) => {
    e.preventDefault();
    const duration = Number(phaseForm.duration_days);
    if (!duration || duration < 1) {
      setError('Duration must be at least 1 day');
      return;
    }
    setSaving(true);
    try {
      const { day_offset_start, day_offset_end } = computePhaseOffsets(phases, duration, phaseForm.before_start);
      await createPhase({
        seq: phases.length + 1,
        label: phaseForm.label,
        day_offset_start,
        day_offset_end,
      });
      closeModal();
      await loadPhases();
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to create phase');
    } finally {
      setSaving(false);
    }
  };

  const movePhase = async (index, direction) => {
    const target = index + direction;
    if (target < 0 || target >= phases.length) return;
  
    const reordered = [...phases];
    [reordered[index], reordered[target]] = [reordered[target], reordered[index]];
  
    try {
      await reorderPhases(reordered.map((p) => p.id));
      await loadPhases();
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to reorder phases');
    }
  };

  // ==================== MODULES ====================

  const toggleModule = async (module_id) => {
    setExpandedModule((prev) => ({ ...prev, [module_id]: !prev[module_id] }));
    if (!contentByModule[module_id]) {
      try {
        const response = await getContent(module_id);
        setContentByModule((prev) => ({ ...prev, [module_id]: response.data.data || [] }));
      } catch {
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
    setSaving(true);
    try {
      const existing = modulesByPhase[phase_id] || [];
      await createModule(phase_id, {
        title: moduleForm.title,
        duration_min: moduleForm.duration_min ? Number(moduleForm.duration_min) : null,
        sort_order: existing.length,
      });
      closeModal();
      await refreshModules(phase_id);
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to create module');
    } finally {
      setSaving(false);
    }
  };

  const moveModule = async (phase_id, index, direction) => {
    const modules = modulesByPhase[phase_id] || [];
    const target = index + direction;
    if (target < 0 || target >= modules.length) return;
    const a = modules[index];
    const b = modules[target];
    try {
      await Promise.all([
        updateModule(a.id, { sort_order: b.sort_order }),
        updateModule(b.id, { sort_order: a.sort_order }),
      ]);
      await refreshModules(phase_id);
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to reorder modules');
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

  const handleCreateContent = async (e, module_id) => {
    e.preventDefault();
    setSaving(true);
    try {
      const existing = contentByModule[module_id] || [];
      if (contentTab === 'upload') {
        if (!uploadFile) { setSaving(false); return; }
        await uploadContent(module_id, uploadFile, { title: uploadTitle, seq: existing.length });
      } else if (contentTab === 'text') {
        await createContent(module_id, {
          content_type: 'text',
          title: contentForm.title,
          seq: existing.length,
          payload: { body_text: contentForm.body_text },
        });
      } else {
        await createContent(module_id, {
          content_type: contentForm.content_type,
          title: contentForm.title,
          seq: existing.length,
          payload: { source_ref: contentForm.source_ref },
        });
      }
      closeModal();
      await refreshContent(module_id);
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to add content');
    } finally {
      setSaving(false);
    }
  };

  const moveContent = async (module_id, index, direction) => {
    const items = contentByModule[module_id] || [];
    const target = index + direction;
    if (target < 0 || target >= items.length) return;
    const a = items[index];
    const b = items[target];
    try {
      await Promise.all([
        updateContent(a.id, { seq: b.seq }),
        updateContent(b.id, { seq: a.seq }),
      ]);
      await refreshContent(module_id);
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to reorder content');
    }
  };

  const handleDownload = async (item) => {
    try {
      const response = await downloadContentFile(item.id);
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const a = document.createElement('a');
      a.href = url;
      a.download = item.payload?.original_name || item.title;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      setError('Failed to download file');
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
      <div className="flex items-start justify-between">
        <PageHeader
          title="Onboarding"
          highlight="Curriculum"
          subtitle="Build the phases, modules, and content new hires move through."
        />
        <button
          onClick={() => setModal({ type: 'phase' })}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium bg-primary text-primary-foreground hover:opacity-90"
        >
          <Plus className="w-4 h-4" /> Add phase
        </button>
      </div>

      {error && (
        <div className="border border-destructive/30 bg-destructive/10 text-destructive text-sm rounded-lg px-4 py-3 flex justify-between items-center">
          {error}
          <button onClick={() => setError(null)} className="text-destructive"><X className="w-4 h-4" /></button>
        </div>
      )}

      {phases.length === 0 ? (
        <div className="text-center py-12 border rounded-lg bg-card">
          <p className="text-muted-foreground">No phases yet — add the first one to start building the curriculum.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {phases.map((phase, phaseIndex) => {
            const phaseOpen = !!expandedPhase[phase.id];
            const modules = modulesByPhase[phase.id];

            return (
              <div key={phase.id} className="border rounded-lg bg-card overflow-hidden">
                <div className="w-full flex items-center justify-between px-4 py-3 hover:bg-muted/30">
                  <button onClick={() => togglePhase(phase.id)} className="flex items-center gap-3 text-left flex-1">
                    {phaseOpen ? <ChevronDown className="w-4 h-4 text-muted-foreground" /> : <ChevronRight className="w-4 h-4 text-muted-foreground" />}
                    <span className="font-medium">{phase.label}</span>
                    <span className="text-xs text-muted-foreground">
                      Day {phase.day_offset_start} to {phase.day_offset_end}
                    </span>
                  </button>
                  <div className="flex items-center gap-1">
                    <button
                      disabled={phaseIndex === 0}
                      onClick={() => movePhase(phaseIndex, -1)}
                      className="p-1 rounded hover:bg-muted disabled:opacity-30 disabled:cursor-not-allowed"
                      title="Move up"
                    >
                      <ChevronUp className="w-4 h-4" />
                    </button>
                    <button
                      disabled={phaseIndex === phases.length - 1}
                      onClick={() => movePhase(phaseIndex, 1)}
                      className="p-1 rounded hover:bg-muted disabled:opacity-30 disabled:cursor-not-allowed"
                      title="Move down"
                    >
                      <ChevronDown className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {phaseOpen && (
                  <div className="border-t px-4 py-3 space-y-3">
                    {modules === undefined ? (
                      <div className="text-sm text-muted-foreground py-2">Loading modules...</div>
                    ) : modules.length === 0 ? (
                      <div className="text-sm text-muted-foreground py-2">No modules in this phase yet.</div>
                    ) : (
                      <div className="space-y-2">
                        {modules.map((m, moduleIndex) => {
                          const moduleOpen = !!expandedModule[m.id];
                          const items = contentByModule[m.id];

                          return (
                            <div key={m.id} className="border rounded-lg overflow-hidden">
                              <div className="w-full flex items-center justify-between px-3 py-2 hover:bg-muted/20">
                                <button onClick={() => toggleModule(m.id)} className="flex items-center gap-3 text-left flex-1">
                                  {moduleOpen ? <ChevronDown className="w-4 h-4 text-muted-foreground" /> : <ChevronRight className="w-4 h-4 text-muted-foreground" />}
                                  <BookOpen className="w-4 h-4 text-muted-foreground" />
                                  <span className="text-sm font-medium">{m.title}</span>
                                  {m.duration_min && (
                                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                                      <Clock className="w-3 h-3" /> {m.duration_min} min
                                    </span>
                                  )}
                                </button>
                                <div className="flex items-center gap-2">
                                  <span className={`text-xs px-2 py-1 rounded font-medium ${m.status === 'published' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}`}>
                                    {m.status}
                                  </span>
                                  <button onClick={() => togglePublish(m, phase.id)} className="text-xs text-primary hover:underline flex items-center gap-1">
                                    {m.status === 'published' ? <><EyeOff className="w-3 h-3" /> Unpublish</> : <><Eye className="w-3 h-3" /> Publish</>}
                                  </button>
                                  <button disabled={moduleIndex === 0} onClick={() => moveModule(phase.id, moduleIndex, -1)} className="p-1 rounded hover:bg-muted disabled:opacity-30" title="Move up">
                                    <ChevronUp className="w-3.5 h-3.5" />
                                  </button>
                                  <button disabled={moduleIndex === modules.length - 1} onClick={() => moveModule(phase.id, moduleIndex, 1)} className="p-1 rounded hover:bg-muted disabled:opacity-30" title="Move down">
                                    <ChevronDown className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </div>

                              {moduleOpen && (
                                <div className="border-t px-3 py-3 space-y-3 bg-muted/10">
                                  {items === undefined ? (
                                    <div className="text-sm text-muted-foreground py-1">Loading content...</div>
                                  ) : items.length === 0 ? (
                                    <div className="text-sm text-muted-foreground py-1">No content yet.</div>
                                  ) : (
                                    <div className="space-y-1">
                                      {items.map((item, itemIndex) => {
                                        const Icon = TYPE_ICON[item.content_type] || FileText;
                                        const isUploadedFile = !!item.payload?.original_name;
                                        const isExternalLink = !isUploadedFile && !!item.payload?.source_ref;

                                        return (
                                          <div key={item.id} className="flex items-center gap-3 text-sm border-b last:border-0 py-2">
                                            <Icon className="w-4 h-4 text-muted-foreground shrink-0" />
                                            <div className="flex-1 min-w-0">
                                              <div className="font-medium">{item.title}</div>
                                              {item.content_type === 'text' && (
                                                <div className="text-xs text-muted-foreground truncate">{item.payload?.body_text}</div>
                                              )}
                                            </div>
                                            {isUploadedFile && (
                                              <button onClick={() => handleDownload(item)} className="text-xs text-primary hover:underline flex items-center gap-1 shrink-0">
                                                <Download className="w-3 h-3" /> Download
                                              </button>
                                            )}
                                            {isExternalLink && (
                                              <a href={item.payload.source_ref} target="_blank" rel="noopener noreferrer" className="text-xs text-primary hover:underline flex items-center gap-1 shrink-0">
                                                <ExternalLink className="w-3 h-3" /> Open link
                                              </a>
                                            )}
                                            <div className="flex items-center gap-1 shrink-0">
                                              <button disabled={itemIndex === 0} onClick={() => moveContent(m.id, itemIndex, -1)} className="p-1 rounded hover:bg-muted disabled:opacity-30" title="Move up">
                                                <ChevronUp className="w-3.5 h-3.5" />
                                              </button>
                                              <button disabled={itemIndex === items.length - 1} onClick={() => moveContent(m.id, itemIndex, 1)} className="p-1 rounded hover:bg-muted disabled:opacity-30" title="Move down">
                                                <ChevronDown className="w-3.5 h-3.5" />
                                              </button>
                                            </div>
                                          </div>
                                        );
                                      })}
                                    </div>
                                  )}

                                  <button
                                    onClick={() => setModal({ type: 'content', moduleId: m.id })}
                                    className="inline-flex items-center gap-2 text-sm text-primary hover:underline"
                                  >
                                    <Plus className="w-4 h-4" /> Add content
                                  </button>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}

                    <button
                      onClick={() => setModal({ type: 'module', phaseId: phase.id })}
                      className="inline-flex items-center gap-2 text-sm text-primary hover:underline"
                    >
                      <Plus className="w-4 h-4" /> Add module
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* ==================== ADD PHASE MODAL ==================== */}
      {modal?.type === 'phase' && (
        <Modal title="Add phase" onClose={closeModal}>
          <form onSubmit={handleCreatePhase} className="space-y-4">
            <Field label="Label">
              <input
                required autoFocus value={phaseForm.label} placeholder="e.g. Foundation, Weeks 2-4"
                onChange={(e) => setPhaseForm({ ...phaseForm, label: e.target.value })}
                className={inputClass}
              />
            </Field>
            <Field label="Duration (days)">
              <input
                required type="number" min="1" value={phaseForm.duration_days}
                onChange={(e) => setPhaseForm({ ...phaseForm, duration_days: e.target.value })}
                className={inputClass}
              />
            </Field>
            {phases.length === 0 && (
              <label className="flex items-center gap-2 text-sm text-muted-foreground">
                <input
                  type="checkbox" checked={phaseForm.before_start}
                  onChange={(e) => setPhaseForm({ ...phaseForm, before_start: e.target.checked })}
                />
                This phase runs before the hire's start date (pre-boarding)
              </label>
            )}
            {phasePreview && (
              <p className="text-xs text-muted-foreground bg-muted/40 rounded-lg px-3 py-2">
                This phase will run from <strong>Day {phasePreview.day_offset_start}</strong> to{' '}
                <strong>Day {phasePreview.day_offset_end}</strong> of the hire's timeline (Day 1 = their first day).
              </p>
            )}
            <div className="flex gap-2 justify-end pt-2">
              <button type="button" onClick={closeModal} className="px-4 py-2 text-sm rounded-lg border">Cancel</button>
              <button type="submit" disabled={saving} className="px-4 py-2 text-sm rounded-lg bg-primary text-primary-foreground disabled:opacity-50">
                {saving ? 'Saving...' : 'Save phase'}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {modal?.type === 'module' && (
        <Modal title="Add module" onClose={closeModal}>
          <form onSubmit={(e) => handleCreateModule(e, modal.phaseId)} className="space-y-4">
            <Field label="Title">
              <input
                required autoFocus value={moduleForm.title}
                onChange={(e) => setModuleForm({ ...moduleForm, title: e.target.value })}
                className={inputClass}
              />
            </Field>
            <Field label="Duration (minutes)">
              <input
                type="number" min="0" value={moduleForm.duration_min}
                onChange={(e) => setModuleForm({ ...moduleForm, duration_min: e.target.value })}
                className={inputClass}
              />
            </Field>
            <div className="flex gap-2 justify-end pt-2">
              <button type="button" onClick={closeModal} className="px-4 py-2 text-sm rounded-lg border">Cancel</button>
              <button type="submit" disabled={saving} className="px-4 py-2 text-sm rounded-lg bg-primary text-primary-foreground disabled:opacity-50">
                {saving ? 'Saving...' : 'Save module'}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {modal?.type === 'content' && (
        <Modal title="Add content" onClose={closeModal}>
          <div className="flex gap-2 mb-4">
            <button type="button" onClick={() => setContentTab('text')} className={`px-3 py-1.5 text-xs rounded-lg border flex items-center gap-1 ${contentTab === 'text' ? 'bg-primary text-primary-foreground' : ''}`}>
              <MessageSquare className="w-3 h-3" /> Text
            </button>
            <button type="button" onClick={() => setContentTab('link')} className={`px-3 py-1.5 text-xs rounded-lg border flex items-center gap-1 ${contentTab === 'link' ? 'bg-primary text-primary-foreground' : ''}`}>
              <LinkIcon className="w-3 h-3" /> Link
            </button>
            <button type="button" onClick={() => setContentTab('upload')} className={`px-3 py-1.5 text-xs rounded-lg border flex items-center gap-1 ${contentTab === 'upload' ? 'bg-primary text-primary-foreground' : ''}`}>
              <Upload className="w-3 h-3" /> Upload file
            </button>
          </div>

          <form onSubmit={(e) => handleCreateContent(e, modal.moduleId)} className="space-y-4">
            {contentTab === 'text' && (
              <>
                <Field label="Title">
                  <input required autoFocus value={contentForm.title} placeholder="e.g. A note from your manager"
                    onChange={(e) => setContentForm({ ...contentForm, title: e.target.value })} className={inputClass} />
                </Field>
                <Field label="Text">
                  <textarea required rows={4} value={contentForm.body_text}
                    onChange={(e) => setContentForm({ ...contentForm, body_text: e.target.value })} className={inputClass} />
                </Field>
              </>
            )}

            {contentTab === 'link' && (
              <>
                <Field label="Type">
                  <select value={contentForm.content_type} onChange={(e) => setContentForm({ ...contentForm, content_type: e.target.value })} className={inputClass}>
                    {CONTENT_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                  </select>
                </Field>
                <Field label="Title">
                  <input required value={contentForm.title}
                    onChange={(e) => setContentForm({ ...contentForm, title: e.target.value })} className={inputClass} />
                </Field>
                <Field label="Source URL">
                  <input required value={contentForm.source_ref} placeholder="https://..."
                    onChange={(e) => setContentForm({ ...contentForm, source_ref: e.target.value })} className={inputClass} />
                </Field>
                {contentForm.content_type === 'slides' && (
                  <p className="text-xs text-muted-foreground">
                    Slide decks can only be linked (e.g. Google Slides or PowerPoint Online share link) — direct .pptx upload isn't supported yet.
                  </p>
                )}
              </>
            )}

            {contentTab === 'upload' && (
              <>
                <Field label="Title (optional — defaults to filename)">
                  <input value={uploadTitle} onChange={(e) => setUploadTitle(e.target.value)} className={inputClass} />
                </Field>
                <Field label="File (PDF, DOCX, MP4, MOV, or WEBM)">
                  <input required type="file" accept=".pdf,.docx,.mp4,.mov,.webm"
                    onChange={(e) => setUploadFile(e.target.files?.[0] || null)} className="text-sm" />
                </Field>
              </>
            )}

            <div className="flex gap-2 justify-end pt-2">
              <button type="button" onClick={closeModal} className="px-4 py-2 text-sm rounded-lg border">Cancel</button>
              <button
                type="submit"
                disabled={saving || (contentTab === 'upload' && !uploadFile)}
                className="px-4 py-2 text-sm rounded-lg bg-primary text-primary-foreground disabled:opacity-50"
              >
                {saving ? 'Saving...' : 'Add content'}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}