import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

export function useSiteText(key: string, defaultValue: string) {
  const [value, setValue] = useState(defaultValue);

  useEffect(() => {
    let isMounted = true;

    async function load() {
      const { data, error } = await supabase
        .from('site_texts')
        .select('value')
        .eq('key', key)
        .maybeSingle();

      if (!isMounted) return;
      if (!error && data && typeof data.value === 'string' && data.value.trim() !== '') {
        setValue(data.value);
      }
    }

    load();

    return () => {
      isMounted = false;
    };
  }, [key]);

  return value;
}
