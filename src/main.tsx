import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App';
import { LangProvider } from './lib/i18n';
import { isLowPower } from './lib/anim';

// lets CSS opt out of the expensive compositor effects on phones
if (isLowPower) document.documentElement.classList.add('low-power');

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <LangProvider>
      <App />
    </LangProvider>
  </StrictMode>,
);
