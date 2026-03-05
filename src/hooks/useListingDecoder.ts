import { useState, useCallback, useRef, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface PropertySummary {
  price?: string;
  rooms?: string;
  bedrooms?: string;
  sqm?: string;
  floor?: string;
  total_floors?: string;
  property_type?: string;
  city?: string;
  neighborhood?: string;
  year_built?: string;
  condition?: string;
  parking?: string;
  entry_date?: string;
}

export interface MissingField {
  field_name: string;
  why_it_matters: string;
  risk_level: 'high' | 'medium' | 'low';
}

export interface HebrewTerm {
  term: string;
  transliteration: string;
  meaning: string;
  buyer_context: string;
}

export interface RedFlag {
  flag: string;
  explanation: string;
  severity: 'high' | 'medium' | 'low';
}

export interface QuestionToAsk {
  question: string;
  why_ask: string;
}

export interface MarketContext {
  city_name: string;
  average_price: number | null;
  average_price_sqm: number | null;
  yoy_price_change: number | null;
  median_apartment_price: number | null;
  gross_yield_percent: number | null;
}

export interface DecodedListing {
  property_summary: PropertySummary;
  missing_fields: MissingField[];
  translation: string;
  hebrew_terms: HebrewTerm[];
  red_flags: RedFlag[];
  questions_to_ask: QuestionToAsk[];
  detected_city: string;
}

export interface DecoderResult {
  result: DecodedListing;
  market_context: MarketContext | null;
  images: string[];
  screenshot: string | null;
  usage: { used: number; limit: number };
}

export type LoadingStep = 'scraping' | 'analyzing' | 'matching' | null;

const LOADING_STEPS: { step: LoadingStep; label: string; progress: number; duration: number }[] = [
  { step: 'scraping', label: 'Scraping listing page…', progress: 25, duration: 2500 },
  { step: 'analyzing', label: 'Translating & analyzing…', progress: 60, duration: 4000 },
  { step: 'matching', label: 'Matching market data…', progress: 90, duration: 1500 },
];

function getSessionId(): string {
  let id = localStorage.getItem('listing_decoder_session');
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem('listing_decoder_session', id);
  }
  return id;
}

export function useListingDecoder() {
  const [url, setUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [data, setData] = useState<DecoderResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loadingStep, setLoadingStep] = useState<LoadingStep>(null);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const timerRef = useRef<ReturnType<typeof setTimeout>[]>([]);

  // Clean up timers
  useEffect(() => {
    return () => {
      timerRef.current.forEach(clearTimeout);
    };
  }, []);

  const startLoadingSequence = useCallback(() => {
    timerRef.current.forEach(clearTimeout);
    timerRef.current = [];
    
    let elapsed = 0;
    LOADING_STEPS.forEach(({ step, progress, duration }) => {
      const timer = setTimeout(() => {
        setLoadingStep(step);
        setLoadingProgress(progress);
      }, elapsed);
      timerRef.current.push(timer);
      elapsed += duration;
    });
  }, []);

  const stopLoadingSequence = useCallback(() => {
    timerRef.current.forEach(clearTimeout);
    timerRef.current = [];
    setLoadingStep(null);
    setLoadingProgress(100);
  }, []);

  const analyze = useCallback(async () => {
    if (!url.trim()) {
      toast.error('Please paste a listing URL');
      return;
    }

    setIsLoading(true);
    setError(null);
    setData(null);
    setLoadingProgress(5);
    startLoadingSequence();

    try {
      const { data: { user } } = await supabase.auth.getUser();
      const sessionId = getSessionId();

      const { data: fnData, error: fnError } = await supabase.functions.invoke(
        'decode-listing',
        {
          body: {
            url: url.trim(),
            session_id: sessionId,
            user_id: user?.id || null,
          },
        }
      );

      if (fnError) {
        throw new Error(fnError.message || 'Analysis failed');
      }

      if (fnData?.error) {
        if (fnData.usage) {
          setData((prev) => prev ? { ...prev, usage: fnData.usage } : null);
        }
        throw new Error(fnData.error);
      }

      stopLoadingSequence();
      setData(fnData as DecoderResult);
    } catch (err: any) {
      const msg = err?.message || 'Something went wrong';
      setError(msg);
      toast.error(msg);
      stopLoadingSequence();
    } finally {
      setIsLoading(false);
    }
  }, [url, startLoadingSequence, stopLoadingSequence]);

  const saveAnalysis = useCallback(async () => {
    if (!data) return;

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      toast.error('Sign in to save analyses');
      return;
    }

    const { error: saveErr } = await supabase
      .from('saved_listing_analyses')
      .insert({
        user_id: user.id,
        source_url: url,
        decoded_result: data.result as any,
        detected_city: data.result.detected_city || null,
      });

    if (saveErr) {
      toast.error('Failed to save');
    } else {
      toast.success('Analysis saved to your account');
    }
  }, [data, url]);

  const reset = useCallback(() => {
    setUrl('');
    setData(null);
    setError(null);
    setLoadingStep(null);
    setLoadingProgress(0);
  }, []);

  return {
    url,
    setUrl,
    isLoading,
    data,
    error,
    loadingStep,
    loadingProgress,
    analyze,
    saveAnalysis,
    reset,
  };
}
