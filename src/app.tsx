import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { Cartogram } from './visualization/cartogram';

function App() {
    return (
        <Cartogram />
    );
}

createRoot(document.getElementById('root')!).render(
    <StrictMode>
        <App />
    </StrictMode>,
);

