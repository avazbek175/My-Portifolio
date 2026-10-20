import {
  createContext,
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

import { apiFetch } from '@/lib/api';
import type { PublicContent } from '@/lib/cms-types';
import { buildSiteContent } from '@/lib/site-content';
import type { ContentContextValue } from './ContentContext.types';

const ContentContext = createContext<ContentContextValue | null>(null);

export const ContentProvider = ({ children }: { children: ReactNode }) => {
  const [data, setData] = useState<PublicContent | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [nonce, setNonce] = useState(0);

  const reload = useCallback(() => setNonce((value) => value + 1), []);

  useEffect(() => {
    const controller = new AbortController();
    let active = true;

    apiFetch<PublicContent>('/api/public/content', { signal: controller.signal })
      .then((response) => {
        if (!active) return;
        setData(response);
        setError(null);
      })
      .catch((cause: unknown) => {
        if (!active || controller.signal.aborted) return;
        setError(cause instanceof Error ? cause.message : 'Failed to load content');
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
      controller.abort();
    };
  }, [nonce]);

  const content = useMemo(() => buildSiteContent(data), [data]);

  const value = useMemo(
    () => ({ content, loading, error, reload }),
    [content, loading, error, reload],
  );

  return <ContentContext.Provider value={value}>{children}</ContentContext.Provider>;
};

export { ContentContext };
export type { ContentContextValue };
