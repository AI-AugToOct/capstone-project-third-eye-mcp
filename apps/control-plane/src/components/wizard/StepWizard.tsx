import { useState } from 'react';
import type { ReactNode } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import clsx from 'clsx';

export interface WizardStep {
  id: string;
  title: string;
  description?: string;
  icon?: string;
  content: ReactNode;
  isValid?: boolean;
  canSkip?: boolean;
}

export interface StepWizardProps {
  steps: WizardStep[];
  currentStep: number;
  onStepChange: (stepIndex: number) => void;
  onComplete: () => void;
  onCancel?: () => void;
  className?: string;
  showProgress?: boolean;
  allowStepNavigation?: boolean;
}

export function StepWizard({
  steps,
  currentStep,
  onStepChange,
  onComplete,
  onCancel,
  className,
  showProgress = true,
  allowStepNavigation = true,
}: StepWizardProps) {
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set());

  const currentStepData = steps[currentStep];
  const isFirstStep = currentStep === 0;
  const isLastStep = currentStep === steps.length - 1;

  const handleNext = () => {
    if (isLastStep) {
      onComplete();
    } else {
      setCompletedSteps(prev => new Set([...prev, currentStep]));
      onStepChange(currentStep + 1);
    }
  };

  const handlePrevious = () => {
    if (!isFirstStep) {
      onStepChange(currentStep - 1);
    }
  };

  const handleStepClick = (stepIndex: number) => {
    if (!allowStepNavigation) return;
    if (stepIndex < currentStep || completedSteps.has(stepIndex)) {
      onStepChange(stepIndex);
    }
  };

  const getStepStatus = (stepIndex: number) => {
    if (stepIndex < currentStep || completedSteps.has(stepIndex)) return 'completed';
    if (stepIndex === currentStep) return 'current';
    return 'upcoming';
  };

  return (
    <div className={clsx('space-y-6', className)}>
      {/* Progress Header */}
      {showProgress && (
        <div className="rounded-2xl border border-surface-outline/40 bg-surface-raised/80 p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-xl font-semibold text-white">
                {currentStepData?.title}
              </h2>
              {currentStepData?.description && (
                <p className="text-sm text-slate-300 mt-1">
                  {currentStepData.description}
                </p>
              )}
            </div>
            <div className="text-right">
              <p className="text-xs uppercase tracking-wide text-slate-400">
                Step {currentStep + 1} of {steps.length}
              </p>
              <div className="mt-2 text-xs text-slate-300">
                {Math.round(((currentStep + 1) / steps.length) * 100)}% Complete
              </div>
            </div>
          </div>

          {/* Step Progress Bar */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              {steps.map((step, index) => {
                const status = getStepStatus(index);
                return (
                  <div key={step.id} className="flex items-center">
                    <button
                      type="button"
                      onClick={() => handleStepClick(index)}
                      disabled={!allowStepNavigation || status === 'upcoming'}
                      className={clsx(
                        'relative flex h-8 w-8 items-center justify-center rounded-full text-xs font-semibold transition-all duration-200',
                        status === 'completed' && 'bg-accent-primary text-surface-base shadow-lg',
                        status === 'current' && 'bg-accent-primary/20 text-accent-primary ring-2 ring-accent-primary/50',
                        status === 'upcoming' && 'bg-surface-outline/30 text-slate-400',
                        allowStepNavigation && status !== 'upcoming' && 'hover:scale-110 cursor-pointer'
                      )}
                    >
                      {status === 'completed' ? (
                        <motion.span
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          className="text-xs"
                        >
                          ✓
                        </motion.span>
                      ) : step.icon ? (
                        step.icon
                      ) : (
                        index + 1
                      )}
                    </button>

                    {index < steps.length - 1 && (
                      <div className={clsx(
                        'ml-2 h-0.5 w-12 transition-colors duration-300',
                        status === 'completed' ? 'bg-accent-primary' : 'bg-surface-outline/30'
                      )} />
                    )}
                  </div>
                );
              })}
            </div>

            {/* Step Labels */}
            <div className="flex justify-between text-xs text-slate-400">
              {steps.map((step, index) => (
                <div key={step.id} className={clsx(
                  'flex-1 text-center truncate',
                  getStepStatus(index) === 'current' && 'text-accent-primary font-medium'
                )}>
                  {step.title}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Step Content */}
      <div className="rounded-2xl border border-surface-outline/40 bg-surface-raised/80 shadow-lg">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentStep}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2 }}
            className="p-6"
          >
            {currentStepData?.content}
          </motion.div>
        </AnimatePresence>

        {/* Navigation */}
        <div className="border-t border-surface-outline/30 p-6">
          <div className="flex items-center justify-between">
            <div className="flex gap-3">
              {onCancel && (
                <button
                  type="button"
                  onClick={onCancel}
                  className="rounded-full border border-surface-outline/60 px-4 py-2 text-sm text-slate-300 transition hover:border-accent-danger hover:text-accent-danger"
                >
                  Cancel
                </button>
              )}
              {!isFirstStep && (
                <button
                  type="button"
                  onClick={handlePrevious}
                  className="rounded-full border border-surface-outline/60 px-4 py-2 text-sm text-slate-200 transition hover:border-accent-primary hover:text-accent-primary"
                >
                  ← Previous
                </button>
              )}
            </div>

            <div className="flex gap-3">
              {currentStepData?.canSkip && !isLastStep && (
                <button
                  type="button"
                  onClick={() => onStepChange(currentStep + 1)}
                  className="rounded-full border border-surface-outline/60 px-4 py-2 text-sm text-slate-400 transition hover:border-slate-400 hover:text-slate-200"
                >
                  Skip
                </button>
              )}
              <button
                type="button"
                onClick={handleNext}
                disabled={currentStepData?.isValid === false}
                className="inline-flex items-center gap-2 rounded-full bg-accent-primary px-6 py-2 text-sm font-semibold text-surface-base transition hover:bg-accent-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLastStep ? 'Complete' : 'Next'}
                {!isLastStep && <span>→</span>}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default StepWizard;