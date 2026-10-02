import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
// self-hosted variable fonts — only the subsets a page uses are downloaded
import '@fontsource-variable/inter';
import '@fontsource-variable/sora';
import '@fontsource-variable/jetbrains-mono';
import './index.css';
import App from './App';
import { LangProvider } from './lib/i18n';
import { isLowPower } from './lib/anim';
import { applyPalette, applyTheme, defaultTheme, readStoredTheme, resolvePalette } from './lib/theme';
import { config } from './lib/data';

// lets CSS opt out of the expensive compositor effects on phones
if (isLowPower) document.documentElement.classList.add('low-power');

// palette from the admin, then theme: no saved preference → the admin default
applyPalette(resolvePalette(config.theme));
applyTheme(readStoredTheme() ?? defaultTheme);

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <LangProvider>
      <App />
    </LangProvider>
  </StrictMode>,
);
