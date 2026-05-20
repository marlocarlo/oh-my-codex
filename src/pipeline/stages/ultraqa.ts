/**
 * UltraQA stage adapter for the default Autopilot loop.
 *
 * Produces a model-facing instruction for adversarial QA after clean review.
 */

import type { PipelineStage, StageContext, StageResult } from '../types.js';

export interface UltraqaStageOptions {
  /** Optional QA verdict injected by tests or runtime adapters. */
  clean?: boolean;

  /** Whether QA was explicitly skipped for a documented low-risk condition. */
  skipped?: boolean;

  /** Human-readable QA summary or skip reason. */
  summary?: string;
}

export interface UltraqaDescriptor {
  task: string;
  cwd: string;
  sessionId?: string;
  ultragoalArtifacts: Record<string, unknown>;
  codeReviewArtifacts: Record<string, unknown>;
  instruction: string;
}

export interface UltraqaVerdict {
  clean: boolean;
  skipped: boolean;
  summary: string;
}

export function createUltraqaStage(options: UltraqaStageOptions = {}): PipelineStage {
  return {
    name: 'ultraqa',

    async run(ctx: StageContext): Promise<StageResult> {
      const startTime = Date.now();
      const descriptor: UltraqaDescriptor = {
        task: ctx.task,
        cwd: ctx.cwd,
        sessionId: ctx.sessionId,
        ultragoalArtifacts: (ctx.artifacts.ultragoal as Record<string, unknown> | undefined) ?? {},
        codeReviewArtifacts: (ctx.artifacts['code-review'] as Record<string, unknown> | undefined) ?? {},
        instruction: buildUltraqaInstruction(ctx.task),
      };
      const hasQaEvidence = options.clean !== undefined || options.skipped !== undefined;
      const skipped = options.skipped ?? false;
      const clean = hasQaEvidence ? (options.clean ?? skipped) : false;
      const verdict: UltraqaVerdict = {
        clean,
        skipped,
        summary: options.summary ?? (hasQaEvidence
          ? (clean ? 'UltraQA gate clean.' : 'UltraQA found issues; return to ralplan.')
          : 'UltraQA evidence missing; fail closed and return to ralplan.'),
      };

      return {
        status: 'completed',
        artifacts: {
          stage: 'ultraqa',
          ultraqaDescriptor: descriptor,
          qa_verdict: verdict,
          return_to_ralplan_reason: clean ? null : verdict.summary,
          instruction: descriptor.instruction,
        },
        duration_ms: Date.now() - startTime,
      };
    },
  };
}

export function buildUltraqaInstruction(task: string): string {
  return `$ultraqa ${JSON.stringify(task)}`;
}
