import { useContext } from 'react';
import { ContentContext } from './ContentContext';
import type { ContentContextValue } from './ContentContext.types';

export const useSiteContent = (): ContentContextValue['content'] => {
  const context = useContext(ContentContext);
  if (!context) {
    throw new Error('useSiteContent must be used within a ContentProvider');
  }
  return context.content;
};

export const useContentStatus = (): Pick<ContentContextValue, 'loading' | 'error' | 'reload'> => {
  const context = useContext(ContentContext);
  if (!context) {
    throw new Error('useContentStatus must be used within a ContentProvider');
  }
  const { loading, error, reload } = context;
  return { loading, error, reload };
};
