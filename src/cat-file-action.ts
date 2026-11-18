import { catFileActions } from './pet-assets';

export type CatFileAction = keyof typeof catFileActions;
export type CatFileActionPose = { kind: CatFileAction; frame: number };

function frameTimeline({ durations }: (typeof catFileActions)[CatFileAction]) {
  let duration = 0;
  return durations.map(interval => duration += interval);
}

const frameEnds = {
  shredder: frameTimeline(catFileActions.shredder),
  zip: frameTimeline(catFileActions.zip),
  convert: frameTimeline(catFileActions.convert),
} satisfies Record<CatFileAction, number[]>;

export function catFileActionDuration(kind: CatFileAction) {
  return frameEnds[kind].at(-1)!;
}

export function catFileActionFrameAt(kind: CatFileAction, elapsed: number) {
  const frame = frameEnds[kind].findIndex(end => elapsed < end);
  return frame < 0 ? undefined : frame;
}
