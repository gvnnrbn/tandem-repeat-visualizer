import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import 'pdbe-molstar/build/pdbe-molstar-light.css'; 

createRoot(document.getElementById('root')!).render(
  <App />
)