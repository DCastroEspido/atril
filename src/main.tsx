import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './styles/fonts.css';
import './styles/tokens.css';
import './styles/app.css';
import { App } from './App';
import { AccountProvider } from './features/account/AccountContext';
import { ToastProvider } from './ui/Toast';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ToastProvider>
      <AccountProvider>
        <App />
      </AccountProvider>
    </ToastProvider>
  </StrictMode>,
);
