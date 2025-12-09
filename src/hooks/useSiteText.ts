import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

export function useSiteText(key: string, defaultValue: string) {
  // On commence vide pour éviter d'afficher la valeur par défaut
  // avant de savoir si une valeur existe en base.
  const [value, setValue] = useState('');

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
      } else {
        // Si aucune valeur n'est en base, on retombe sur la valeur par défaut
        setValue(defaultValue);
      }
    }

    load();

    return () => {
      isMounted = false;
    };
  }, [key, defaultValue]);

  return value;
}
