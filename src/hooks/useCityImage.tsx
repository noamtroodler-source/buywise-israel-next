import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export function useCityImage(cityName: string | undefined, citySlug: string | undefined, highlights: string[] | null) {
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!cityName || !citySlug) return;

    const generateImage = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const { data, error: fnError } = await supabase.functions.invoke('generate-city-image', {
          body: { cityName, citySlug, highlights },
        });

        if (fnError) {
          throw fnError;
        }

        if (data?.imageUrl) {
          setImageUrl(data.imageUrl);
        }
      } catch (err) {
        console.error('Error generating city image:', err);
        setError(err instanceof Error ? err.message : 'Failed to generate image');
      } finally {
        setIsLoading(false);
      }
    };

    generateImage();
  }, [cityName, citySlug, highlights]);

  return { imageUrl, isLoading, error };
}
