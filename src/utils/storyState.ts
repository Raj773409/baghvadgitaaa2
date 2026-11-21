export type PlaybackSpeed = 0.75 | 1 | 1.25 | 1.5;

export const PLAYBACK_SPEEDS: ReadonlyArray<PlaybackSpeed> = [0.75, 1, 1.25, 1.5];

export const TOTAL_STORY_SCENES = 15;

export const STORY_PROGRESS_STORAGE_KEY = 'eternal_story_progress_v1';

export interface StoryProgressState {
  currentSceneIndex: number; // 0..14
  visitedSceneIds: string[];
  completedSceneIds: string[];
  playbackSpeed: PlaybackSpeed;
  captionsEnabled: boolean;
  updatedAt: number;
}

export function clampSceneIndex(index: number, total = TOTAL_STORY_SCENES): number {
  if (!Number.isFinite(index)) return 0;
  return Math.max(0, Math.min(total - 1, Math.round(index)));
}

export function getNextSceneIndex(current: number, total = TOTAL_STORY_SCENES): number | null {
  const safe = clampSceneIndex(current, total);
  return safe < total - 1 ? safe + 1 : null;
}

export function getPrevSceneIndex(current: number, total = TOTAL_STORY_SCENES): number | null {
  const safe = clampSceneIndex(current, total);
  return safe > 0 ? safe - 1 : null;
}

export function isValidPlaybackSpeed(value: unknown): value is PlaybackSpeed {
  return value === 0.75 || value === 1 || value === 1.25 || value === 1.5;
}

export function advanceSceneElapsedMs(
  currentElapsedMs: number,
  deltaMs: number,
  speed: PlaybackSpeed,
  durationMs: number,
): { elapsedMs: number; completed: boolean } {
  const safeDelta = Math.max(0, Number.isFinite(deltaMs) ? deltaMs : 0);
  const safeDuration = Math.max(1000, durationMs);
  const next = currentElapsedMs + safeDelta * speed;
  if (next >= safeDuration) {
    return { elapsedMs: safeDuration, completed: true };
  }
  return { elapsedMs: next, completed: false };
}

export function computeStoryOverallProgressPct(
  currentSceneIndex: number,
  sceneProgressRatio: number,
  total = TOTAL_STORY_SCENES,
): number {
  const safeIndex = clampSceneIndex(currentSceneIndex, total);
  const clampedRatio = Math.max(0, Math.min(1, Number.isFinite(sceneProgressRatio) ? sceneProgressRatio : 0));
  return ((safeIndex + clampedRatio) / total) * 100;
}

export function getActiveCueIndex(
  elapsedMs: number,
  durationMs: number,
  cueCount: number,
): number {
  if (cueCount <= 1) return 0;
  const safeDuration = Math.max(1000, durationMs);
  const ratio = Math.max(0, Math.min(0.9999, elapsedMs / safeDuration));
  return Math.min(cueCount - 1, Math.floor(ratio * cueCount));
}

export function createDefaultStoryProgress(initialSceneId = 'scene-01'): StoryProgressState {
  return {
    currentSceneIndex: 0,
    visitedSceneIds: [initialSceneId],
    completedSceneIds: [],
    playbackSpeed: 1,
    captionsEnabled: true,
    updatedAt: Date.now(),
  };
}

export function recordSceneVisited(
  state: StoryProgressState,
  sceneIndex: number,
  sceneId: string,
): StoryProgressState {
  const clamped = clampSceneIndex(sceneIndex);
  const visitedSet = new Set(state.visitedSceneIds);
  visitedSet.add(sceneId);
  return {
    ...state,
    currentSceneIndex: clamped,
    visitedSceneIds: Array.from(visitedSet),
    updatedAt: Date.now(),
  };
}

export function recordSceneCompleted(
  state: StoryProgressState,
  sceneId: string,
): StoryProgressState {
  const completedSet = new Set(state.completedSceneIds);
  completedSet.add(sceneId);
  const visitedSet = new Set(state.visitedSceneIds);
  visitedSet.add(sceneId);
  return {
    ...state,
    visitedSceneIds: Array.from(visitedSet),
    completedSceneIds: Array.from(completedSet),
    updatedAt: Date.now(),
  };
}

export function serializeStoryProgress(state: StoryProgressState): string {
  return JSON.stringify(state);
}

export function deserializeStoryProgress(
  raw: string | null | undefined,
  validSceneIds: ReadonlyArray<string>,
): StoryProgressState {
  const defaultId = validSceneIds[0] ?? 'scene-01';
  if (!raw) return createDefaultStoryProgress(defaultId);

  try {
    const parsed = JSON.parse(raw) as Partial<StoryProgressState>;
    const validSet = new Set(validSceneIds);
    const currentSceneIndex = clampSceneIndex(
      typeof parsed.currentSceneIndex === 'number' ? parsed.currentSceneIndex : 0,
      validSceneIds.length || TOTAL_STORY_SCENES,
    );
    const visitedSceneIds = Array.isArray(parsed.visitedSceneIds)
      ? Array.from(new Set(parsed.visitedSceneIds.filter((id): id is string => typeof id === 'string' && validSet.has(id))))
      : [defaultId];
    const completedSceneIds = Array.isArray(parsed.completedSceneIds)
      ? Array.from(new Set(parsed.completedSceneIds.filter((id): id is string => typeof id === 'string' && validSet.has(id))))
      : [];

    if (visitedSceneIds.length === 0) {
      visitedSceneIds.push(defaultId);
    }

    return {
      currentSceneIndex,
      visitedSceneIds,
      completedSceneIds,
      playbackSpeed: isValidPlaybackSpeed(parsed.playbackSpeed) ? parsed.playbackSpeed : 1,
      captionsEnabled: typeof parsed.captionsEnabled === 'boolean' ? parsed.captionsEnabled : true,
      updatedAt: typeof parsed.updatedAt === 'number' ? parsed.updatedAt : Date.now(),
    };
  } catch {
    return createDefaultStoryProgress(defaultId);
  }
}

export function parseStorySceneParam(search: string, total = TOTAL_STORY_SCENES): number | null {
  const params = new URLSearchParams(search);
  const raw = params.get('scene')?.trim();
  if (!raw || !/^\d+$/.test(raw)) return null;
  const parsed = Number.parseInt(raw, 10);
  if (parsed < 1 || parsed > total) return null;
  return parsed - 1;
}
