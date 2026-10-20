import type { SiteContent } from '@/lib/site-content';

export type ContentContextValue = {
  content: SiteContent;
  loading: boolean;
  error: string | null;
  reload: () => void;
};
