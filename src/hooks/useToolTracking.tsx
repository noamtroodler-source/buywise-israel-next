import { useCallback, useRef, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

const SESSION_KEY = 'analytics_session_id';

function getSessionId(): string {
  return sessionStorage.getItem(SESSION_KEY) || 'unknown';
}

// Bucket numeric values for privacy
function bucketValue(value: number, buckets: number[]): string {
  for (let i = 0; i < buckets.length; i++) {
    if (value <= buckets[i]) {
      return i === 0 ? `<${buckets[i]}` : `${buckets[i-1]}-${buckets[i]}`;
    }
  }
  return `>${buckets[buckets.length - 1]}`;
}

const PRICE_BUCKETS = [500000, 1000000, 2000000, 3000000, 5000000, 10000000, 20000000];
const SIZE_BUCKETS = [50, 75, 100, 125, 150, 200, 300];

interface ToolRunState {
  runId: string | null;
  toolName: string;
  startedAt: Date;
  currentStep: number;
  stepName: string;
  relatedListingId?: string;
}

export function useToolTracking(toolName: string, relatedListingId?: string) {
  const { user } = useAuth();
  const stateRef = useRef<ToolRunState | null>(null);
  const stepStartRef = useRef<Date>(new Date());

  // Start tracking when component mounts
  useEffect(() => {
    startToolRun();

    return () => {
      // Mark as abandoned if not completed
      if (stateRef.current?.runId) {
        completeToolRun('abandoned');
      }
    };
  }, [toolName]);

  const startToolRun = useCallback(async () => {
    const sessionId = getSessionId();
    
    try {
      const { data, error } = await supabase
        .from('tool_runs')
        .insert({
          session_id: sessionId,
          user_id: user?.id || null,
          tool_name: toolName,
          started_at: new Date().toISOString(),
          related_listing_id: relatedListingId || null,
        })
        .select('id')
        .single();

      if (data) {
        stateRef.current = {
          runId: data.id,
          toolName,
          startedAt: new Date(),
          currentStep: 0,
          stepName: 'initial',
          relatedListingId,
        };
        stepStartRef.current = new Date();
      }
    } catch (error) {
      console.debug('Tool run start error:', error);
    }
  }, [toolName, relatedListingId, user]);

  const trackStepChange = useCallback(async (stepName: string, inputsAtStep?: Record<string, any>) => {
    if (!stateRef.current?.runId) return;

    const now = new Date();
    
    try {
      // Record exit of previous step
      if (stateRef.current.currentStep > 0) {
        await supabase.from('tool_step_events').insert({
          tool_run_id: stateRef.current.runId,
          step_name: stateRef.current.stepName,
          step_order: stateRef.current.currentStep,
          entered_at: stepStartRef.current.toISOString(),
          exited_at: now.toISOString(),
          abandoned: false,
        });
      }

      // Start new step
      stateRef.current.currentStep++;
      stateRef.current.stepName = stepName;
      stepStartRef.current = now;

      // Record new step entry
      await supabase.from('tool_step_events').insert({
        tool_run_id: stateRef.current.runId,
        step_name: stepName,
        step_order: stateRef.current.currentStep,
        entered_at: now.toISOString(),
        inputs_at_step: inputsAtStep || null,
      });
    } catch (error) {
      console.debug('Step tracking error:', error);
    }
  }, []);

  const completeToolRun = useCallback(async (
    status: 'completed' | 'abandoned' | 'error',
    inputs?: Record<string, any>,
    outputs?: Record<string, any>,
    nextAction?: string
  ) => {
    if (!stateRef.current?.runId) return;

    const now = new Date();
    const runId = stateRef.current.runId;

    // Bucket sensitive inputs for privacy
    const bucketedInputs = inputs ? {
      ...inputs,
      propertyPrice: inputs.propertyPrice ? bucketValue(inputs.propertyPrice, PRICE_BUCKETS) : undefined,
      price: inputs.price ? bucketValue(inputs.price, PRICE_BUCKETS) : undefined,
      size: inputs.size ? bucketValue(inputs.size, SIZE_BUCKETS) : undefined,
    } : null;

    try {
      // Mark current step as completed/abandoned
      await supabase.from('tool_step_events')
        .update({
          exited_at: now.toISOString(),
          abandoned: status === 'abandoned',
        })
        .eq('tool_run_id', runId)
        .is('exited_at', null);

      // Update tool run record
      await supabase.from('tool_runs')
        .update({
          completed_at: now.toISOString(),
          completion_status: status,
          inputs_json: bucketedInputs,
          outputs_summary_json: outputs || null,
          next_action: nextAction || null,
        })
        .eq('id', runId);

      stateRef.current = null;
    } catch (error) {
      console.debug('Tool run completion error:', error);
    }
  }, []);

  const trackCalculation = useCallback((inputs: Record<string, any>, outputs: Record<string, any>) => {
    // Just update the current inputs/outputs without completing
    // This allows tracking intermediate calculations
    if (!stateRef.current?.runId) return;

    const bucketedInputs = {
      ...inputs,
      propertyPrice: inputs.propertyPrice ? bucketValue(inputs.propertyPrice, PRICE_BUCKETS) : undefined,
      price: inputs.price ? bucketValue(inputs.price, PRICE_BUCKETS) : undefined,
      size: inputs.size ? bucketValue(inputs.size, SIZE_BUCKETS) : undefined,
    };

    supabase.from('tool_runs')
      .update({
        inputs_json: bucketedInputs,
        outputs_summary_json: outputs,
      })
      .eq('id', stateRef.current.runId)
      .then(() => {});
  }, []);

  return {
    trackStepChange,
    completeToolRun,
    trackCalculation,
    getRunId: () => stateRef.current?.runId,
  };
}
