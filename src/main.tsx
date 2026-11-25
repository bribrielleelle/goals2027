import {createRoot} from 'react-dom/client';
import AuthApp from './auth/AuthApp.tsx';
import './index.css';

createRoot(document.getElementById('root')!).render(<AuthApp />);
