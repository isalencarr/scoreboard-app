// react-scan precisa ser carregado antes de react-dom; no build de produção
// este módulo é substituído por um stub vazio (ver vite.config.js).
import './lib/reactScan'

import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>
)
