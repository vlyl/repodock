import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './App';
import '@/ui/theme/tokens.css';
import '@/ui/components/controls.css';
import '@/ui/dock/segments.css';
import '@/ui/dock/history.css';
import './popup.css';

const container = document.getElementById('root');
if (container) {
  createRoot(container).render(
    <StrictMode>
      <App />
    </StrictMode>,
  );
}
