import { useState, useEffect } from 'react';
import './index.css';
import TextToSpeech from './components/TextToSpeech';
import { Globe, Volume2 } from 'lucide-react';

function App() {
  const [theme, setTheme] = useState<'light' | 'dark'>('light');

  useEffect(() => {
    // Include required font
    const link = document.createElement('link');
    link.href = 'https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap';
    link.rel = 'stylesheet';
    document.head.appendChild(link);

    // Check system preference for dark mode
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    setTheme(prefersDark ? 'dark' : 'light');

    // Force a repaint on mobile devices to fix potential rendering issues
    setTimeout(() => {
      const root = document.getElementById('root');
      if (root) {
        root.style.opacity = '0.99';
        setTimeout(() => {
          root.style.opacity = '1';
        }, 10);
      }
    }, 300);

    return () => {
      document.head.removeChild(link);
    };
  }, []);

  return (
    <div className={`${theme} min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 text-gray-800 dark:text-gray-200`}>
      <div className="container mx-auto px-4 py-6 md:py-8">
        <header className="mb-6 md:mb-8 text-center">
          <div className="flex items-center justify-center gap-2 mb-2">
            <Volume2 className="h-7 w-7 md:h-8 md:w-8 text-indigo-600 dark:text-indigo-400" />
            <h1 className="text-2xl md:text-3xl font-bold">VocalVista</h1>
          </div>
          <p className="text-sm md:text-base text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
            Convert your text to natural sounding speech in multiple languages and voices
          </p>
        </header>

        <main className="max-w-3xl mx-auto bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden">
          <TextToSpeech />
        </main>

        <footer className="mt-8 md:mt-12 text-center text-xs md:text-sm text-gray-500 dark:text-gray-400">
          <p>Powered by Web Speech API • Free and Open Source</p>
          <div className="flex items-center justify-center gap-1 mt-2">
            <Globe className="h-3 w-3 md:h-4 md:w-4" />
            <p>Supporting multiple languages and voices</p>
          </div>
        </footer>
      </div>
    </div>
  );
}

export default App;
