import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export interface KillSwitchState {
  disabledTabs: string[];
  disabledDomains: string[];
  disabledModes: string[];
  loading: boolean;
}

export function useKillSwitch(): KillSwitchState {
  const [disabledTabs, setDisabledTabs] = useState<string[]>([]);
  const [disabledDomains, setDisabledDomains] = useState<string[]>([]);
  const [disabledModes, setDisabledModes] = useState<string[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    let mounted = true;

    const fetchFlags = async () => {
      try {
        const { data, error } = await supabase
          .from('platform_config')
          .select('key, value')
          .in('key', ['killswitch_tabs', 'killswitch_domains', 'killswitch_modes']);

        if (!error && data && mounted) {
          for (const item of data) {
            const val = item.value as any;
            if (item.key === 'killswitch_tabs' && Array.isArray(val?.disabled)) {
              setDisabledTabs(val.disabled);
            } else if (item.key === 'killswitch_domains' && Array.isArray(val?.disabled)) {
              setDisabledDomains(val.disabled);
            } else if (item.key === 'killswitch_modes' && Array.isArray(val?.disabled)) {
              setDisabledModes(val.disabled);
            }
          }
        }
      } catch (err) {
        console.warn('Failed to load killswitch platform config:', err);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    fetchFlags();

    return () => {
      mounted = false;
    };
  }, []);

  return {
    disabledTabs,
    disabledDomains,
    disabledModes,
    loading,
  };
}
