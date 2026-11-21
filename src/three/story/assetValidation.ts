import type { CharacterAssetId, CharacterAssetManifestEntry } from './assetManifest';

export interface LoadedModelInspection {
  hasSkeleton: boolean;
  boneNames: string[];
  morphTargetNames: string[];
  meshCount: number;
  triangleCount: number;
  clipNames: string[];
}

export interface ClipResolutionResult {
  requestedClip: string;
  resolvedClip: string | null;
  usedFallback: boolean;
  isMissing: boolean;
  reason?: string;
}

export interface AssetValidationRecord {
  id: CharacterAssetId;
  priority: CharacterAssetManifestEntry['priority'];
  name: string;
  filePath: string;
  status: 'valid' | 'degraded-fallback' | 'missing-asset';
  hasSkeleton: boolean;
  boneCount: number;
  missingBones: string[];
  morphTargetNames: string[];
  missingMorphTargets: string[];
  meshCount: number;
  triangleCount: number;
  availableClips: string[];
  missingClips: string[];
  fallbackMappings: Record<string, string>;
  errorMessage?: string;
}

export function resolveAnimationClipSafely(
  requestedClip: string,
  availableClips: ReadonlyArray<string>,
  fallbackMap: Record<string, string>,
): ClipResolutionResult {
  if (availableClips.includes(requestedClip)) {
    return {
      requestedClip,
      resolvedClip: requestedClip,
      usedFallback: false,
      isMissing: false,
    };
  }

  // Follow explicit fallback chain without silently guessing unrelated animations
  let candidate: string | undefined = fallbackMap[requestedClip];
  const visited = new Set<string>([requestedClip]);
  while (candidate && !visited.has(candidate)) {
    if (availableClips.includes(candidate)) {
      return {
        requestedClip,
        resolvedClip: candidate,
        usedFallback: true,
        isMissing: true,
        reason: `Missing clip "${requestedClip}"; using configured fallback "${candidate}".`,
      };
    }
    visited.add(candidate);
    candidate = fallbackMap[candidate];
  }

  return {
    requestedClip,
    resolvedClip: null,
    usedFallback: false,
    isMissing: true,
    reason: `Missing clip "${requestedClip}" and no configured fallback clip exists in GLB.`,
  };
}

export function validateLoadedCharacterAsset(
  manifestEntry: CharacterAssetManifestEntry,
  inspection: LoadedModelInspection | null,
  loadError?: string,
): AssetValidationRecord {
  if (!inspection || loadError) {
    return {
      id: manifestEntry.id,
      priority: manifestEntry.priority,
      name: manifestEntry.name,
      filePath: manifestEntry.filePath,
      status: 'missing-asset',
      hasSkeleton: false,
      boneCount: 0,
      missingBones: [...manifestEntry.expectedBones],
      morphTargetNames: [],
      missingMorphTargets: [...manifestEntry.expectedMorphTargets],
      meshCount: 0,
      triangleCount: 0,
      availableClips: [],
      missingClips: [...manifestEntry.expectedClips],
      fallbackMappings: {},
      errorMessage: loadError ?? 'Asset failed to load.',
    };
  }

  const missingBones = manifestEntry.expectedBones.filter(
    (bone) => !inspection.boneNames.includes(bone),
  );
  const missingMorphTargets = manifestEntry.expectedMorphTargets.filter(
    (mt) => !inspection.morphTargetNames.includes(mt),
  );
  const missingClips: string[] = [];
  const fallbackMappings: Record<string, string> = {};

  for (const clip of manifestEntry.expectedClips) {
    const resolved = resolveAnimationClipSafely(
      clip,
      inspection.clipNames,
      manifestEntry.fallbackClipMap,
    );
    if (resolved.isMissing) {
      missingClips.push(clip);
      if (resolved.resolvedClip) {
        fallbackMappings[clip] = resolved.resolvedClip;
      }
    }
  }

  const skeletonOk = !manifestEntry.skeletonRequired || inspection.hasSkeleton;
  const morphsOk =
    !manifestEntry.morphTargetsRequired || missingMorphTargets.length === 0;
  const hasIssues =
    !skeletonOk ||
    !morphsOk ||
    missingBones.length > 0 ||
    missingClips.length > 0;

  return {
    id: manifestEntry.id,
    priority: manifestEntry.priority,
    name: manifestEntry.name,
    filePath: manifestEntry.filePath,
    status: hasIssues ? 'degraded-fallback' : 'valid',
    hasSkeleton: inspection.hasSkeleton,
    boneCount: inspection.boneNames.length,
    missingBones,
    morphTargetNames: [...inspection.morphTargetNames],
    missingMorphTargets,
    meshCount: inspection.meshCount,
    triangleCount: inspection.triangleCount,
    availableClips: [...inspection.clipNames],
    missingClips,
    fallbackMappings,
  };
}
