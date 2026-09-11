import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import UnifiedApp from './UnifiedApp.tsx';
import './index.css';

const root = document.getElementById('root');
if (!root) throw new Error('No se encontró el elemento root');

createRoot(root).render(
  <StrictMode>
    <UnifiedApp />
  </StrictMode>,
);
