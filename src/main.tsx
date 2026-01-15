/**
 * Node modules
 */
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';

/**
 * CSS
 */
import './index.css';

/**
 * App
 */
import App from './App.tsx';

/**
 * Providers
 */
import { AppProvider } from '@/providers/app-provider.tsx';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AppProvider>
      <App />
    </AppProvider>
  </StrictMode>,
);
