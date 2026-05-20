/**
 * Deep-interview stage adapter for the default Autopilot loop.
 *
 * Produces a model-facing instruction for the requirements clarification gate.
 */

import type { PipelineStage, StageContext, StageResult } from '../types.js';

export interface DeepInterviewDescriptor {
  task: string;
  cwd: string;
  sessionId?: string;
  instruction: string;
}

export function createDeepInterviewStage(): PipelineStage {
  return {
    name: 'deep-interview',

    async run(ctx: StageContext): Promise<StageResult> {
      const startTime = Date.now();
      const descriptor: DeepInterviewDescriptor = {
        task: ctx.task,
        cwd: ctx.cwd,
        sessionId: ctx.sessionId,
        instruction: buildDeepInterviewInstruction(ctx.task),
      };

      return {
        status: 'completed',
        artifacts: {
          stage: 'deep-interview',
          deepInterviewDescriptor: descriptor,
          instruction: descriptor.instruction,
        },
        duration_ms: Date.now() - startTime,
      };
    },
  };
}

export function buildDeepInterviewInstruction(task: string): string {
  return `$deep-interview ${JSON.stringify(task)}`;
}
