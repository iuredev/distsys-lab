import { useEffect, useState } from 'react';
import SystemEditorV2 from './components/SystemEditor/SystemEditorV2';
import ReferenceGuide from './components/SystemEditor/ui/ReferenceGuide';

function useHash() {
  const [hash, setHash] = useState(window.location.hash);
  useEffect(() => {
    const onHashChange = () => setHash(window.location.hash);
    window.addEventListener('hashchange', onHashChange);
    return () => window.removeEventListener('hashchange', onHashChange);
  }, []);
  return hash;
}

export default function App() {
  const hash = useHash();
  const isGuide = hash === '#/guide';

  return (
    <div className="min-h-screen bg-tactical-bg overflow-x-hidden dark">
      {isGuide
        ? <ReferenceGuide onClose={() => { window.location.hash = ''; }} />
        : <SystemEditorV2 />
      }
      <div className="fixed bottom-0 left-0 right-0 z-[200] flex items-center justify-center h-5 bg-tactical-bg/80 backdrop-blur-sm border-t border-tactical-line/30 pointer-events-none">
        <span className="font-mono text-[9px] text-tactical-label/50 tracking-wide pointer-events-auto">
          baseado em{' '}
          <a
            href="https://dinamos.net/"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-tactical-label transition-colors underline underline-offset-2"
          >
            dinamos
          </a>
          {' '}by Flávio Mendes
        </span>
      </div>
    </div>
  );
}
