import React, { useEffect, useState } from 'react';
import { Box, CheckCircle2, Film, Layers, RefreshCw, Save, Sparkles } from 'lucide-react';
import { invalidatePublicCmsCache } from '../../hooks/usePublicCms';
import { resolveCmsMediaUrl } from '../../content/siteCatalog';
import { adminFetch } from '../../utils/adminSession';
import type {
  AdminLocaleCode,
  PublishStatus,
  StorySceneOverride,
} from '../../utils/cmsSync';
import {
  AdminConfirmModal,
  AdminStatusBadge,
  type AdminToastMessage,
} from './AdminUiPrimitives';

export interface GlbInspectionRecord {
  id: string;
  filePath: string;
  exists: boolean;
  validGlb: boolean;
  byteLength: number;
  gltfVersion: number | null;
  meshesCount: number;
  primitivesCount: number;
  skinsCount: number;
  jointsCount: number;
  morphTargetCount: number;
  morphTargetNames: string[];
  animationCount: number;
  animationNames: string[];
  materialsCount: number;
}

interface AdminStoryStudioPanelProps {
  scenes: StorySceneOverride[];
  glbs: GlbInspectionRecord[];
  canWrite: boolean;
  onRefresh: () => void;
  onToast: (toast: Omit<AdminToastMessage, 'id'>) => void;
}

function formatByteSize(bytes: number): string {
  if (bytes >= 1024 * 1024) {
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  }
  return `${(bytes / 1024).toFixed(1)} KB`;
}

export const AdminStoryStudioPanel: React.FC<AdminStoryStudioPanelProps> = ({
  scenes,
  glbs,
  canWrite,
  onRefresh,
  onToast,
}) => {
  const [subTab, setSubTab] = useState<'scenes' | 'glbs'>('scenes');
  const [selectedSceneId, setSelectedSceneId] = useState<string>(() => scenes[0]?.id ?? '');
  const [locale, setLocale] = useState<AdminLocaleCode>('en');
  const [draftScene, setDraftScene] = useState<StorySceneOverride | null>(null);
  const [confirmPublishOpen, setConfirmPublishOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!selectedSceneId && scenes[0]) {
      setSelectedSceneId(scenes[0].id);
    }
  }, [scenes, selectedSceneId]);

  useEffect(() => {
    const match = scenes.find((s) => s.id === selectedSceneId) ?? scenes[0] ?? null;
    if (match) {
      setDraftScene(JSON.parse(JSON.stringify(match)) as StorySceneOverride);
    } else {
      setDraftScene(null);
    }
  }, [scenes, selectedSceneId]);

  const persistScene = async (scene: StorySceneOverride) => {
    setSaving(true);
    try {
      const res = await adminFetch(`/api/admin/story/scenes/${encodeURIComponent(scene.id)}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: scene.title,
          chapterTag: scene.chapterTag,
          dialogue: scene.dialogue,
          narration: scene.narration,
          primaryImageUrl: scene.primaryImageUrl,
          audioUrl: scene.audioUrl || '',
          status: scene.status,
        }),
      });
      const json = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) throw new Error(json.error || 'Could not update story scene.');
      invalidatePublicCmsCache();
      setConfirmPublishOpen(false);
      onToast({
        kind: 'success',
        title: `Scene ${scene.sceneNumber} Saved`,
        detail:
          scene.status === 'published'
            ? 'Live /story narrative & overrides refreshed.'
            : 'Saved as non-public draft override.',
      });
      onRefresh();
    } catch (err) {
      onToast({
        kind: 'error',
        title: 'Story Scene Save Failed',
        detail: err instanceof Error ? err.message : 'Unable to save scene.',
      });
    } finally {
      setSaving(false);
    }
  };

  const validGlbCount = glbs.filter((g) => g.exists && g.validGlb).length;
  const totalMeshes = glbs.reduce((sum, g) => sum + g.meshesCount, 0);
  const totalClips = glbs.reduce((sum, g) => sum + g.animationCount, 0);

  return (
    <div className="space-y-5">
      {/* Sub-tab Switcher */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[var(--color-border)] bg-[var(--surface-elevated)] p-3.5">
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            data-testid="story-tab-scenes"
            onClick={() => setSubTab('scenes')}
            className={`inline-flex items-center gap-2 min-h-[38px] px-4 rounded-lg text-xs font-semibold cursor-pointer ${
              subTab === 'scenes'
                ? 'bg-[#17233A] text-[#F5E2B5] dark:bg-[#D5AF62] dark:text-[#171717]'
                : 'border border-[var(--color-border)] text-[var(--color-ink)] hover:border-[var(--color-bronze)]'
            }`}
          >
            <Film className="w-3.5 h-3.5" />
            <span>15 Story Scenes ({scenes.length})</span>
          </button>
          <button
            type="button"
            data-testid="story-tab-glbs"
            onClick={() => setSubTab('glbs')}
            className={`inline-flex items-center gap-2 min-h-[38px] px-4 rounded-lg text-xs font-semibold cursor-pointer ${
              subTab === 'glbs'
                ? 'bg-[#17233A] text-[#F5E2B5] dark:bg-[#D5AF62] dark:text-[#171717]'
                : 'border border-[var(--color-border)] text-[var(--color-ink)] hover:border-[var(--color-bronze)]'
            }`}
          >
            <Box className="w-3.5 h-3.5" />
            <span>8 GLB 3D Character Inspector ({validGlbCount}/{glbs.length})</span>
          </button>
        </div>

        <button
          type="button"
          onClick={onRefresh}
          className="inline-flex items-center gap-1.5 min-h-[36px] px-3.5 rounded-lg border border-[var(--color-border)] text-xs font-medium hover:border-[var(--color-bronze)] cursor-pointer"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Re-Inspect Assets</span>
        </button>
      </div>

      {/* 15 Story Scenes Studio */}
      {subTab === 'scenes' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          {/* Scene Rail */}
          <div className="lg:col-span-4 rounded-xl border border-[var(--color-border)] bg-[var(--surface-elevated)] overflow-hidden">
            <div className="px-4 py-3 border-b border-[var(--color-border)] flex items-center justify-between">
              <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--color-bronze)]">
                Kurukshetra Chapters
              </span>
              <span className="text-[11px] font-mono tabular-nums text-[var(--color-muted)]">
                {scenes.length} Scenes
              </span>
            </div>
            <div className="divide-y divide-[var(--color-border)] max-h-[640px] overflow-y-auto">
              {scenes.map((scene) => {
                const active = scene.id === (draftScene?.id ?? selectedSceneId);
                return (
                  <button
                    key={scene.id}
                    type="button"
                    data-testid={`story-scene-select-${scene.sceneNumber}`}
                    onClick={() => setSelectedSceneId(scene.id)}
                    className={`w-full text-left px-4 py-3 transition-colors cursor-pointer space-y-1 ${
                      active
                        ? 'bg-[#D5AF62]/15 text-[var(--color-ink)]'
                        : 'hover:bg-[#D5AF62]/5 text-[var(--color-ink)]'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[11px] font-mono font-semibold text-[var(--color-bronze)] tabular-nums">
                        Scene {String(scene.sceneNumber).padStart(2, '0')} · {scene.chapterTag}
                      </span>
                      <AdminStatusBadge status={scene.status} />
                    </div>
                    <p className="text-xs font-semibold line-clamp-1">
                      {scene.title.en || `Scene ${scene.sceneNumber}`}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Scene Inspector & Editor */}
          <div className="lg:col-span-8">
            {!draftScene ? (
              <div className="rounded-xl border border-[var(--color-border)] bg-[var(--surface-elevated)] p-10 text-center text-sm text-[var(--color-muted)]">
                Select a scene to customize its title, narration, dialogue, audio, or status.
              </div>
            ) : (
              <div className="rounded-xl border border-[var(--color-border)] bg-[var(--surface-elevated)] p-5 sm:p-6 space-y-5">
                <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-[var(--color-border)]">
                  <div>
                    <p className="text-[11px] font-mono uppercase tracking-[0.12em] text-[var(--color-bronze)]">
                      Scene {draftScene.sceneNumber} of 15 · Route /story
                    </p>
                    <h3 className="font-editorial text-2xl text-[var(--color-ink)]">
                      {draftScene.title.en || `Scene ${draftScene.sceneNumber}`}
                    </h3>
                  </div>

                  {/* Locale Tabs */}
                  <div className="inline-flex items-center rounded-lg border border-[var(--color-border)] p-0.5 bg-[var(--color-canvas)]">
                    {(['en', 'hi', 'te'] as AdminLocaleCode[]).map((loc) => (
                      <button
                        key={loc}
                        type="button"
                        onClick={() => setLocale(loc)}
                        className={`px-3 py-1 rounded text-xs font-mono uppercase cursor-pointer ${
                          locale === loc
                            ? 'bg-[#17233A] text-[#F5E2B5] dark:bg-[#D5AF62] dark:text-[#171717] font-semibold'
                            : 'text-[var(--color-muted)]'
                        }`}
                      >
                        {loc}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <label className="space-y-1 block">
                    <span className="text-[var(--color-muted)]">
                      Scene Title ({locale.toUpperCase()})
                    </span>
                    <input
                      type="text"
                      disabled={!canWrite}
                      value={draftScene.title[locale] ?? ''}
                      onChange={(e) =>
                        setDraftScene((prev) =>
                          prev
                            ? { ...prev, title: { ...prev.title, [locale]: e.target.value } }
                            : prev,
                        )
                      }
                      placeholder={draftScene.title.en}
                      className="w-full min-h-[38px] px-3 rounded-lg border border-[var(--color-border)] bg-[var(--color-canvas)]"
                    />
                  </label>

                  <label className="space-y-1 block">
                    <span className="text-[var(--color-muted)]">Chapter / Gita Tag</span>
                    <input
                      type="text"
                      disabled={!canWrite}
                      value={draftScene.chapterTag}
                      onChange={(e) =>
                        setDraftScene((prev) =>
                          prev ? { ...prev, chapterTag: e.target.value } : prev,
                        )
                      }
                      className="w-full min-h-[38px] px-3 rounded-lg border border-[var(--color-border)] bg-[var(--color-canvas)]"
                    />
                  </label>

                  <label className="space-y-1 block sm:col-span-2">
                    <span className="text-[var(--color-muted)]">
                      Narrative Synopsis ({locale.toUpperCase()})
                    </span>
                    <textarea
                      rows={3}
                      disabled={!canWrite}
                      value={draftScene.narration[locale] ?? ''}
                      onChange={(e) =>
                        setDraftScene((prev) =>
                          prev
                            ? {
                                ...prev,
                                narration: { ...prev.narration, [locale]: e.target.value },
                              }
                            : prev,
                        )
                      }
                      placeholder={draftScene.narration.en}
                      className="w-full p-3 rounded-lg border border-[var(--color-border)] bg-[var(--color-canvas)] leading-relaxed"
                    />
                  </label>

                  <label className="space-y-1 block sm:col-span-2">
                    <span className="text-[var(--color-muted)]">
                      Sacred Dialogue / Spoken Cue ({locale.toUpperCase()})
                    </span>
                    <textarea
                      rows={3}
                      disabled={!canWrite}
                      value={draftScene.dialogue[locale] ?? ''}
                      onChange={(e) =>
                        setDraftScene((prev) =>
                          prev
                            ? {
                                ...prev,
                                dialogue: { ...prev.dialogue, [locale]: e.target.value },
                              }
                            : prev,
                        )
                      }
                      placeholder={draftScene.dialogue.en}
                      className="w-full p-3 rounded-lg border border-[var(--color-border)] bg-[var(--color-canvas)] leading-relaxed"
                    />
                  </label>

                  <label className="space-y-1 block">
                    <span className="text-[var(--color-muted)]">Primary Backdrop Image URL</span>
                    <input
                      type="text"
                      disabled={!canWrite}
                      value={draftScene.primaryImageUrl}
                      onChange={(e) =>
                        setDraftScene((prev) =>
                          prev ? { ...prev, primaryImageUrl: e.target.value } : prev,
                        )
                      }
                      className="w-full min-h-[38px] px-3 rounded-lg border border-[var(--color-border)] bg-[var(--color-canvas)] font-mono text-[11px]"
                    />
                  </label>

                  <label className="space-y-1 block">
                    <span className="text-[var(--color-muted)]">Narration Audio URL (Optional)</span>
                    <input
                      type="text"
                      disabled={!canWrite}
                      value={draftScene.audioUrl ?? ''}
                      onChange={(e) =>
                        setDraftScene((prev) =>
                          prev ? { ...prev, audioUrl: e.target.value } : prev,
                        )
                      }
                      placeholder="/uploads/scene-audio.mp3"
                      className="w-full min-h-[38px] px-3 rounded-lg border border-[var(--color-border)] bg-[var(--color-canvas)] font-mono text-[11px]"
                    />
                  </label>

                  <label className="space-y-1 block">
                    <span className="text-[var(--color-muted)]">Publication Status</span>
                    <select
                      disabled={!canWrite}
                      value={draftScene.status}
                      onChange={(e) =>
                        setDraftScene((prev) =>
                          prev ? { ...prev, status: e.target.value as PublishStatus } : prev,
                        )
                      }
                      className="w-full min-h-[38px] px-3 rounded-lg border border-[var(--color-border)] bg-[var(--color-canvas)]"
                    >
                      <option value="published">Published (Live on /story)</option>
                      <option value="pending-review">Pending Review</option>
                      <option value="draft">Draft (Hidden from /story)</option>
                    </select>
                  </label>
                </div>

                {draftScene.primaryImageUrl && (
                  <div className="rounded-lg border border-[var(--color-border)] bg-[var(--color-canvas)] p-3 flex items-center gap-4">
                    <img
                      src={resolveCmsMediaUrl(draftScene.primaryImageUrl, draftScene.primaryImageUrl)}
                      alt={draftScene.title.en}
                      className="w-28 h-16 object-cover rounded border border-[var(--color-border)] shrink-0"
                    />
                    <div className="min-w-0 text-xs">
                      <p className="font-medium text-[var(--color-ink)]">Backdrop Preview</p>
                      <p className="text-[11px] font-mono text-[var(--color-muted)] truncate">
                        {draftScene.primaryImageUrl}
                      </p>
                    </div>
                  </div>
                )}

                {canWrite && (
                  <div className="pt-2 flex flex-wrap items-center justify-end gap-3 border-t border-[var(--color-border)]">
                    <button
                      type="button"
                      disabled={saving}
                      data-testid="story-scene-save-btn"
                      onClick={() => {
                        if (draftScene.status === 'published') {
                          setConfirmPublishOpen(true);
                        } else {
                          void persistScene(draftScene);
                        }
                      }}
                      className="inline-flex items-center gap-2 min-h-[38px] px-5 rounded-lg royal-gold-surface text-xs font-semibold cursor-pointer disabled:opacity-50"
                    >
                      <Save className="w-3.5 h-3.5" />
                      <span>
                        {draftScene.status === 'published' ? 'Publish Scene Live' : 'Save Scene Draft'}
                      </span>
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* 8 GLB Binary Asset Inspector */}
      {subTab === 'glbs' && (
        <div className="space-y-4">
          <div className="rounded-xl border border-[var(--color-border)] bg-[var(--surface-elevated)] p-5 flex flex-wrap items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-[var(--color-bronze)]">
                <Sparkles className="w-4 h-4" />
                <span>Real-Time Server GLB Binary Header Audit</span>
              </div>
              <p className="text-xs text-[var(--color-muted)]">
                Direct binary inspection of all 8 Three.js character &amp; mount rigs stored in{' '}
                <code className="font-mono">/public/assets/story/characters/</code>. All WebGL shaders and animations remain preserved.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-4 text-xs tabular-nums">
              <div className="px-3.5 py-2 rounded-lg border border-[var(--color-border)] bg-[var(--color-canvas)]">
                <span className="text-[var(--color-muted)] block text-[10px] uppercase">Validated Rigs</span>
                <strong className="text-sm font-mono">
                  {validGlbCount} / {glbs.length}
                </strong>
              </div>
              <div className="px-3.5 py-2 rounded-lg border border-[var(--color-border)] bg-[var(--color-canvas)]">
                <span className="text-[var(--color-muted)] block text-[10px] uppercase">Total Meshes</span>
                <strong className="text-sm font-mono">{totalMeshes}</strong>
              </div>
              <div className="px-3.5 py-2 rounded-lg border border-[var(--color-border)] bg-[var(--color-canvas)]">
                <span className="text-[var(--color-muted)] block text-[10px] uppercase">Animation Clips</span>
                <strong className="text-sm font-mono">{totalClips}</strong>
              </div>
            </div>
          </div>

          <div
            data-testid="glb-inspector-grid"
            className="grid grid-cols-1 md:grid-cols-2 gap-4"
          >
            {glbs.map((model) => (
              <div
                key={model.id}
                data-testid={`glb-card-${model.id}`}
                className="rounded-xl border border-[var(--color-border)] bg-[var(--surface-elevated)] p-5 space-y-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 space-y-0.5">
                    <div className="flex items-center gap-2">
                      <Layers className="w-4 h-4 text-[var(--color-bronze)] shrink-0" />
                      <h4 className="font-editorial text-xl text-[var(--color-ink)] capitalize">
                        {model.id.replace(/_/g, ' ')}
                      </h4>
                    </div>
                    <p className="text-[11px] font-mono text-[var(--color-muted)] break-all">
                      {model.filePath}
                    </p>
                  </div>
                  <AdminStatusBadge
                    status={model.exists && model.validGlb ? 'verified' : 'flagged'}
                  />
                </div>

                <div className="grid grid-cols-3 gap-2.5 text-xs tabular-nums">
                  <div className="rounded-lg border border-[var(--color-border)] bg-[var(--color-canvas)] p-2.5">
                    <span className="text-[10px] uppercase text-[var(--color-muted)] block">
                      Binary Size
                    </span>
                    <strong className="font-mono text-[var(--color-ink)]">
                      {model.exists ? formatByteSize(model.byteLength) : 'Missing'}
                    </strong>
                  </div>
                  <div className="rounded-lg border border-[var(--color-border)] bg-[var(--color-canvas)] p-2.5">
                    <span className="text-[10px] uppercase text-[var(--color-muted)] block">
                      Meshes / Prim
                    </span>
                    <strong className="font-mono text-[var(--color-ink)]">
                      {model.meshesCount} / {model.primitivesCount}
                    </strong>
                  </div>
                  <div className="rounded-lg border border-[var(--color-border)] bg-[var(--color-canvas)] p-2.5">
                    <span className="text-[10px] uppercase text-[var(--color-muted)] block">
                      Skins / Joints
                    </span>
                    <strong className="font-mono text-[var(--color-ink)]">
                      {model.skinsCount} / {model.jointsCount}
                    </strong>
                  </div>
                  <div className="rounded-lg border border-[var(--color-border)] bg-[var(--color-canvas)] p-2.5">
                    <span className="text-[10px] uppercase text-[var(--color-muted)] block">
                      Materials
                    </span>
                    <strong className="font-mono text-[var(--color-ink)]">
                      {model.materialsCount}
                    </strong>
                  </div>
                  <div className="rounded-lg border border-[var(--color-border)] bg-[var(--color-canvas)] p-2.5">
                    <span className="text-[10px] uppercase text-[var(--color-muted)] block">
                      Morph Targets
                    </span>
                    <strong className="font-mono text-[var(--color-ink)]">
                      {model.morphTargetCount}
                    </strong>
                  </div>
                  <div className="rounded-lg border border-[var(--color-border)] bg-[var(--color-canvas)] p-2.5">
                    <span className="text-[10px] uppercase text-[var(--color-muted)] block">
                      Clips (v{model.gltfVersion ?? '—'})
                    </span>
                    <strong className="font-mono text-[var(--color-ink)]">
                      {model.animationCount}
                    </strong>
                  </div>
                </div>

                {(model.animationNames.length > 0 || model.morphTargetNames.length > 0) && (
                  <div className="pt-2 border-t border-[var(--color-border)] space-y-1.5 text-[11px] text-[var(--color-muted)]">
                    {model.animationNames.length > 0 && (
                      <p>
                        <strong className="text-[var(--color-ink)]">Animations:</strong>{' '}
                        {model.animationNames.slice(0, 6).join(', ')}
                        {model.animationNames.length > 6
                          ? ` (+${model.animationNames.length - 6} more)`
                          : ''}
                      </p>
                    )}
                    {model.morphTargetNames.length > 0 && (
                      <p>
                        <strong className="text-[var(--color-ink)]">Morph Targets:</strong>{' '}
                        {model.morphTargetNames.slice(0, 6).join(', ')}
                        {model.morphTargetNames.length > 6
                          ? ` (+${model.morphTargetNames.length - 6} more)`
                          : ''}
                      </p>
                    )}
                  </div>
                )}

                {model.exists && model.validGlb && (
                  <div className="flex items-center gap-1.5 text-[11px] text-emerald-700 dark:text-emerald-300">
                    <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                    <span>glTF Binary Magic Header Verified (Protected Asset)</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      <AdminConfirmModal
        open={confirmPublishOpen}
        title={`Publish Story Scene ${draftScene?.sceneNumber ?? ''} Live`}
        description="This updates the published 3D story narration and chapter caption visible to public visitors on /story. Your Three.js 3D models and lighting remain unchanged."
        targetSummary={draftScene ? `Scene ${draftScene.sceneNumber}: ${draftScene.title.en}` : ''}
        confirmLabel="Publish Live to /story"
        tone="publish"
        busy={saving}
        onCancel={() => setConfirmPublishOpen(false)}
        onConfirm={() => {
          if (draftScene) void persistScene(draftScene);
        }}
      />
    </div>
  );
};
