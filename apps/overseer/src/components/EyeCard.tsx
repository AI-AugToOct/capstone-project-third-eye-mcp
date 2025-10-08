import { motion } from 'framer-motion';
import { formatDistanceToNow } from 'date-fns';
import clsx from 'clsx';
import type { EyeState } from '../types/pipeline';
import sharinganPng from '../assets/eyes/sharingan.png';
import promptHelperPng from '../assets/eyes/prompt-helper.png';
import joganPng from '../assets/eyes/jogan.png';
import rinneganPng from '../assets/eyes/rinnegan.png';
import mangekyoPng from '../assets/eyes/mangekyo.png';
import tenseiganPng from '../assets/eyes/tenseigan.png';
import byakuganPng from '../assets/eyes/byakugan.png';

const eyeAssets: Record<string, string> = {
  SHARINGAN: sharinganPng,
  PROMPT_HELPER: promptHelperPng,
  JOGAN: joganPng,
  RINNEGAN_PLAN: rinneganPng,
  RINNEGAN_REVIEW: rinneganPng,
  RINNEGAN_FINAL: rinneganPng,
  MANGEKYO_SCAFFOLD: mangekyoPng,
  MANGEKYO_IMPL: mangekyoPng,
  MANGEKYO_TESTS: mangekyoPng,
  MANGEKYO_DOCS: mangekyoPng,
  TENSEIGAN: tenseiganPng,
  BYAKUGAN: byakuganPng,
};

const eyeLabels: Record<string, string> = {
  SHARINGAN: 'Sharingan',
  PROMPT_HELPER: 'Prompt Helper',
  JOGAN: 'Jōgan',
  RINNEGAN_PLAN: 'Rinnegan • Plan',
  RINNEGAN_REVIEW: 'Rinnegan • Review',
  RINNEGAN_FINAL: 'Rinnegan • Final',
  MANGEKYO_SCAFFOLD: 'Mangekyō • Scaffold',
  MANGEKYO_IMPL: 'Mangekyō • Implementation',
  MANGEKYO_TESTS: 'Mangekyō • Tests',
  MANGEKYO_DOCS: 'Mangekyō • Docs',
  TENSEIGAN: 'Tenseigan',
  BYAKUGAN: 'Byakugan',
};

const personaMeta: Record<string, { prefix: string; tone: string }> = {
  SHARINGAN: { prefix: 'Itachi', tone: 'text-eye-sharingan' },
  PROMPT_HELPER: { prefix: 'Konan', tone: 'text-eye-prompt' },
  JOGAN: { prefix: 'Boruto', tone: 'text-eye-jogan' },
  RINNEGAN_PLAN: { prefix: 'Nagato', tone: 'text-eye-rinnegan' },
  RINNEGAN_REVIEW: { prefix: 'Nagato', tone: 'text-eye-rinnegan' },
  RINNEGAN_FINAL: { prefix: 'Nagato', tone: 'text-eye-rinnegan' },
  MANGEKYO_SCAFFOLD: { prefix: 'Madara', tone: 'text-eye-mangekyo' },
  MANGEKYO_IMPL: { prefix: 'Madara', tone: 'text-eye-mangekyo' },
  MANGEKYO_TESTS: { prefix: 'Fugaku', tone: 'text-eye-mangekyo' },
  MANGEKYO_DOCS: { prefix: 'Shisui', tone: 'text-eye-mangekyo' },
  TENSEIGAN: { prefix: 'Hamura', tone: 'text-eye-tenseigan' },
  BYAKUGAN: { prefix: 'Hinata', tone: 'text-eye-byakugan' },
};

function statusChip(state?: EyeState) {
  if (!state) return { label: 'Pending', tone: 'bg-slate-700 text-slate-200', humanLabel: 'Waiting for validation' };

  // Convert technical codes to human-readable status
  if (state.ok === true) {
    const humanLabel = state.code?.startsWith('OK_')
      ? 'Validation passed'
      : 'Approved';
    return { label: humanLabel, tone: 'bg-emerald-600/90 text-emerald-50', humanLabel };
  }

  if (state.ok === false) {
    const humanLabel = state.code?.startsWith('E_')
      ? 'Issues found'
      : 'Needs revision';
    return { label: humanLabel, tone: 'bg-rose-600/80 text-rose-50', humanLabel };
  }

  return { label: 'Processing...', tone: 'bg-amber-600/80 text-amber-50', humanLabel: 'Validation in progress' };
}

function formatValidationMessage(state: EyeState, eyeName: string): string {
  if (!state.md) {
    if (state.ok === true) return `${eyeName} validation completed successfully`;
    if (state.ok === false) return `${eyeName} found validation issues`;
    return `${eyeName} is processing your submission`;
  }

  // Clean up markdown and technical jargon
  return state.md
    .replace(/^#{1,6}\s*/, '') // Remove markdown headers
    .replace(/\*\*(.*?)\*\*/g, '$1') // Remove bold markdown
    .replace(/`([^`]+)`/g, '$1') // Remove code backticks
    .split('\n')[0] // Take first line only
    .substring(0, 150); // Limit length
}

export interface EyeCardProps {
  /** Eye identifier, e.g. `SHARINGAN` */
  eye: string;
  /** Latest state for the Eye from realtime pipeline events */
  state?: EyeState;
  /** Invoked when the user wants to open the detail drawer */
  onOpenDetails?: () => void;
  /** Whether persona voice styling is enabled */
  personaMode?: boolean;
  /** Handler when the user clicks "Why not approved" */
  onWhyNotApproved?: () => void;
}

export function EyeCard({ eye, state, onOpenDetails, personaMode = true, onWhyNotApproved }: EyeCardProps) {
  const asset = eyeAssets[eye] ?? sharinganPng;
  const label = eyeLabels[eye] ?? eye;
  const chip = statusChip(state);
  const summary = state ? formatValidationMessage(state, label) : 'Awaiting validation';
  const persona = personaMeta[eye];

  // Get timestamp for "time ago" display
  const timestamp = state?.ts ? new Date(state.ts) : null;
  const timeAgo = timestamp ? formatDistanceToNow(timestamp, { addSuffix: true }) : null;

  return (
    <motion.article
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      className={clsx(
        'group relative flex h-full flex-col gap-4 rounded-2xl border border-brand-outline/50 bg-brand-paperElev/70 p-5 shadow-glass text-left transition',
        'hover:-translate-y-0.5 hover:border-brand-accent/80 focus-within:ring-2 focus-within:ring-brand-accent/50',
      )}
    >
      <header className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="relative">
            <motion.img
              src={asset}
              alt={`${label} eye`}
              width={56}
              height={56}
              className={clsx(
                'h-14 w-14 rounded-full border border-brand-outline/40 object-cover transition-all duration-300',
                personaMode && 'ring-2 ring-brand-accent/30',
                state?.ok === null && 'animate-pulse'
              )}
              animate={state?.ok === null ? { scale: [1, 1.05, 1] } : { scale: 1 }}
              transition={{ duration: 2, repeat: state?.ok === null ? Infinity : 0 }}
            />
            {/* Status indicator dot */}
            {state && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className={clsx(
                  'absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-brand-paper',
                  state.ok === true ? 'bg-green-500' :
                  state.ok === false ? 'bg-red-500' : 'bg-yellow-500'
                )}
              />
            )}
          </div>
          <div className="flex-1">
            <p className="text-xs uppercase tracking-[0.32em] text-brand-accent">
              {personaMode ? 'Persona Voice' : 'Neutral Mode'}
            </p>
            <h3 className="text-lg font-semibold text-white">{label}</h3>
            {timeAgo && (
              <p className="text-xs text-slate-400 mt-1">
                Updated {timeAgo}
              </p>
            )}
          </div>
        </div>
        <motion.span
          key={chip.label}
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className={clsx('rounded-full px-3 py-1 text-xs font-medium whitespace-nowrap', chip.tone)}
        >
          {chip.label}
        </motion.span>
      </header>

      <p className="line-clamp-3 text-sm text-slate-300">
        {personaMode && persona ? (
          <span className={clsx('mr-2 inline-flex items-center gap-1 font-semibold', persona.tone)}>
            <span>✦</span>
            <span>{persona.prefix}</span>
            <span className="text-slate-400">says</span>
          </span>
        ) : null}
        <span>{summary.replace(/###+\s?/g, '')}</span>
      </p>

      <footer className="mt-auto flex items-center justify-between text-xs text-slate-400">
        <div className="flex items-center gap-2">
          {state?.toolVersion ? (
            <span>Tool {state.toolVersion}</span>
          ) : (
            <span>Awaiting output</span>
          )}
          {/* Processing indicator */}
          {state?.ok === null && (
            <motion.div
              className="flex gap-1"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              {Array.from({ length: 3 }).map((_, i) => (
                <motion.div
                  key={i}
                  className="w-1 h-1 bg-brand-accent rounded-full"
                  animate={{
                    opacity: [0.3, 1, 0.3],
                    scale: [1, 1.2, 1]
                  }}
                  transition={{
                    duration: 1.2,
                    repeat: Infinity,
                    delay: i * 0.2
                  }}
                />
              ))}
            </motion.div>
          )}
        </div>
        <button
          type="button"
          onClick={onOpenDetails}
          className="inline-flex items-center gap-1 rounded-full border border-brand-outline/60 px-3 py-1 text-xs text-brand-accent transition hover:border-brand-accent hover:bg-brand-accent/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-accent/40"
        >
          View details
        </button>
      </footer>
      {state?.ok === false && (
        <button
          type="button"
          onClick={onWhyNotApproved}
          className="mt-3 inline-flex items-center gap-2 rounded-full border border-rose-500/50 px-3 py-1 text-xs text-rose-200 transition hover:bg-rose-500/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-500/40"
        >
          ❌ Why not approved?
        </button>
      )}
    </motion.article>
  );
}

export default EyeCard;
