import { useState, useEffect, useRef } from 'react';
import { Info, Languages, Loader, Play, SlidersVertical, Smartphone, Square, Volume2 } from 'lucide-react';

interface Voice {
  name: string;
  lang: string;
  localService: boolean;
  default: boolean;
  voiceURI: string;
}

const TextToSpeech = () => {
  const [text, setText] = useState<string>('Hello! This is a text-to-speech converter. You can type any text here and have it spoken in different languages and voices.');
  const [voices, setVoices] = useState<Voice[]>([]);
  const [selectedVoice, setSelectedVoice] = useState<string>('');
  const [rate, setRate] = useState<number>(1);
  const [pitch, setPitch] = useState<number>(1);
  const [languages, setLanguages] = useState<{ [key: string]: Voice[] }>({});
  const [selectedLanguage, setSelectedLanguage] = useState<string>('');
  const [isSpeaking, setIsSpeaking] = useState<boolean>(false);
  const [loadingVoices, setLoadingVoices] = useState<boolean>(true);
  const [isMobile, setIsMobile] = useState<boolean>(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const synth = useRef<SpeechSynthesis | null>(null);

  // Check if device is mobile
  useEffect(() => {
    const checkMobile = () => {
      const userAgent = navigator.userAgent.toLowerCase();
      const isMobileDevice = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(userAgent);
      setIsMobile(isMobileDevice);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => {
      window.removeEventListener('resize', checkMobile);
    };
  }, []);

  // Initialize speech synthesis
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        synth.current = window.speechSynthesis;
        
        // Function to load voices
        const loadVoices = () => {
          try {
            const availableVoices = synth.current?.getVoices() || [];
            if (availableVoices.length > 0) {
              setLoadingVoices(false);
              setVoices(availableVoices as Voice[]);
              
              // Group voices by language
              const langGroups: { [key: string]: Voice[] } = {};
              availableVoices.forEach((voice: Voice) => {
                const langCode = voice.lang.split('-')[0];
                const langName = new Intl.DisplayNames([navigator.language], { type: 'language' }).of(langCode) || langCode;
                const langKey = `${langName} (${langCode})`;
                
                if (!langGroups[langKey]) {
                  langGroups[langKey] = [];
                }
                langGroups[langKey].push(voice);
              });
              
              setLanguages(langGroups);
              
              // Set default language and voice
              if (Object.keys(langGroups).length > 0) {
                const defaultLang = Object.keys(langGroups)[0];
                setSelectedLanguage(defaultLang);
                if (langGroups[defaultLang].length > 0) {
                  setSelectedVoice(langGroups[defaultLang][0].name);
                }
              }
              
              setApiError(null);
            } else {
              // If no voices available after load, set error
              if (!loadingVoices) {
                setApiError("No voices detected. This may be due to browser restrictions on mobile.");
              }
            }
          } catch (err) {
            console.error("Error loading voices:", err);
            setApiError("Error loading voices. Your browser may have limited TTS support.");
            setLoadingVoices(false);
          }
        };
        
        // Load voices
        loadVoices();
        
        // Chrome loads voices asynchronously
        if (synth.current?.onvoiceschanged !== undefined) {
          synth.current.onvoiceschanged = loadVoices;
        }
        
        // Check if voices loaded after a timeout
        const timeoutId = setTimeout(() => {
          if (voices.length === 0) {
            loadVoices();
          }
          if (voices.length === 0) {
            setLoadingVoices(false);
            if (!apiError) {
              setApiError("Unable to load voices. This may be due to browser restrictions.");
            }
          }
        }, 3000);
        
        return () => {
          clearTimeout(timeoutId);
          if (synth.current?.speaking) {
            synth.current?.cancel();
          }
        };
      } catch (err) {
        console.error("Speech synthesis initialization error:", err);
        setApiError("Your browser doesn't support the Web Speech API or has limited functionality.");
        setLoadingVoices(false);
      }
    }
  }, []);
  
  // Update available voices when language changes
  useEffect(() => {
    if (selectedLanguage && languages[selectedLanguage]?.length > 0) {
      setSelectedVoice(languages[selectedLanguage][0].name);
    }
  }, [selectedLanguage, languages]);
  
  // Handle speech synthesis
  const speak = () => {
    if (synth.current && text) {
      try {
        // Cancel any ongoing speech
        if (synth.current.speaking) {
          synth.current.cancel();
        }
        
        const utterance = new SpeechSynthesisUtterance(text);
        
        // Find the selected voice
        const voice = voices.find(v => v.name === selectedVoice);
        if (voice) {
          utterance.voice = voice as unknown as SpeechSynthesisVoice;
        }
        
        utterance.rate = rate;
        utterance.pitch = pitch;
        
        // Set event handlers
        utterance.onstart = () => setIsSpeaking(true);
        utterance.onend = () => setIsSpeaking(false);
        utterance.onerror = (event) => {
          console.error("Speech synthesis error:", event);
          setIsSpeaking(false);
          setApiError(`Error playing speech: ${event.error}`);
        };
        
        synth.current.speak(utterance);
        setApiError(null);
      } catch (err) {
        console.error("Error during speech synthesis:", err);
        setApiError("Error generating speech. Try a different browser or device.");
      }
    }
  };
  
  const stopSpeaking = () => {
    if (synth.current) {
      synth.current.cancel();
      setIsSpeaking(false);
    }
  };

  // Force dropdown to work properly on iOS
  const focusDropdown = (event: React.MouseEvent<HTMLSelectElement>) => {
    // This helps with iOS Safari issues where select elements don't respond properly
    event.currentTarget.blur();
    event.currentTarget.focus();
  };
  
  return (
    <div className="p-4 md:p-6">
      {isMobile && (
        <div className="mb-6 p-3 border border-blue-300 bg-blue-50 dark:bg-blue-900/30 dark:border-blue-800 rounded-lg">
          <div className="flex items-start">
            <Smartphone className="mt-0.5 h-5 w-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mr-2" />
            <p className="text-blue-800 dark:text-blue-200 text-sm">
              Mobile detected. Some browsers on mobile devices may have limited text-to-speech capabilities. 
              If dropdown menus don't work, try tapping twice or using a different browser.
            </p>
          </div>
        </div>
      )}

      <div className="mb-6">
        <div className="flex items-center mb-2">
          <Languages className="mr-2 h-5 w-5 text-indigo-600 dark:text-indigo-400" />
          <label htmlFor="language" className="font-medium">Language</label>
        </div>
        <select
          id="language"
          className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400 focus:border-indigo-500 dark:focus:border-indigo-400 outline-none transition appearance-none cursor-pointer"
          value={selectedLanguage}
          onChange={(e) => setSelectedLanguage(e.target.value)}
          onClick={focusDropdown}
          disabled={loadingVoices}
          style={{ WebkitAppearance: 'menulist' }}
        >
          {loadingVoices ? (
            <option>Loading languages...</option>
          ) : (
            Object.keys(languages).map((lang) => (
              <option key={lang} value={lang}>
                {lang}
              </option>
            ))
          )}
        </select>
      </div>
      
      <div className="mb-6">
        <div className="flex items-center mb-2">
          <Volume2 className="mr-2 h-5 w-5 text-indigo-600 dark:text-indigo-400" />
          <label htmlFor="voice" className="font-medium">Voice</label>
        </div>
        <select
          id="voice"
          className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400 focus:border-indigo-500 dark:focus:border-indigo-400 outline-none transition appearance-none cursor-pointer"
          value={selectedVoice}
          onChange={(e) => setSelectedVoice(e.target.value)}
          onClick={focusDropdown}
          disabled={loadingVoices || !selectedLanguage}
          style={{ WebkitAppearance: 'menulist' }}
        >
          {loadingVoices ? (
            <option>Loading voices...</option>
          ) : selectedLanguage && languages[selectedLanguage] ? (
            languages[selectedLanguage].map((voice) => (
              <option key={voice.name} value={voice.name}>
                {voice.name} {voice.localService ? "(Local)" : "(Network)"}
              </option>
            ))
          ) : (
            <option>No voices available</option>
          )}
        </select>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div>
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center">
              <SlidersVertical className="mr-2 h-5 w-5 text-indigo-600 dark:text-indigo-400" />
              <label htmlFor="rate" className="font-medium">Rate</label>
            </div>
            <span className="text-sm text-gray-600 dark:text-gray-400">{rate.toFixed(1)}x</span>
          </div>
          <input
            id="rate"
            type="range"
            min="0.5"
            max="2"
            step="0.1"
            value={rate}
            onChange={(e) => setRate(parseFloat(e.target.value))}
            className="w-full h-3 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer accent-indigo-600 dark:accent-indigo-400"
          />
        </div>
        
        <div>
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center">
              <SlidersVertical className="mr-2 h-5 w-5 text-indigo-600 dark:text-indigo-400" />
              <label htmlFor="pitch" className="font-medium">Pitch</label>
            </div>
            <span className="text-sm text-gray-600 dark:text-gray-400">{pitch.toFixed(1)}</span>
          </div>
          <input
            id="pitch"
            type="range"
            min="0.5"
            max="2"
            step="0.1"
            value={pitch}
            onChange={(e) => setPitch(parseFloat(e.target.value))}
            className="w-full h-3 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer accent-indigo-600 dark:accent-indigo-400"
          />
        </div>
      </div>
      
      <div className="mb-6">
        <div className="flex items-center mb-2">
          <Info className="mr-2 h-5 w-5 text-indigo-600 dark:text-indigo-400" />
          <label htmlFor="text" className="font-medium">Text</label>
        </div>
        <textarea
          id="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={5}
          className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400 focus:border-indigo-500 dark:focus:border-indigo-400 outline-none transition"
          placeholder="Enter text to convert to speech..."
        />
      </div>
      
      <div className="flex justify-center">
        {!isSpeaking ? (
          <button
            onClick={speak}
            disabled={!text || loadingVoices || !selectedVoice}
            className="flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-3 px-6 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
            style={{ minWidth: '120px' }}
          >
            {loadingVoices ? (
              <>
                <Loader className="h-5 w-5 animate-spin" />
                Loading...
              </>
            ) : (
              <>
                <Play className="h-5 w-5" />
                Speak
              </>
            )}
          </button>
        ) : (
          <button
            onClick={stopSpeaking}
            className="flex items-center justify-center gap-2 bg-red-600 hover:bg-red-700 text-white font-medium py-3 px-6 rounded-lg transition"
            style={{ minWidth: '120px' }}
          >
            <Square className="h-5 w-5" />
            Stop
          </button>
        )}
      </div>
      
      {apiError && (
        <div className="mt-6 p-4 border border-yellow-300 bg-yellow-50 dark:bg-yellow-900/30 dark:border-yellow-800 rounded-lg">
          <p className="text-yellow-800 dark:text-yellow-200 text-sm">
            {apiError}
          </p>
          {isMobile && (
            <p className="text-yellow-700 dark:text-yellow-300 text-sm mt-2">
              Mobile tip: If you can't select options, try rotating your device to landscape mode or use a desktop browser for full functionality.
            </p>
          )}
        </div>
      )}
      
      {voices.length === 0 && !loadingVoices && !apiError && (
        <div className="mt-6 p-4 border border-yellow-300 bg-yellow-50 dark:bg-yellow-900/30 dark:border-yellow-800 rounded-lg">
          <p className="text-yellow-800 dark:text-yellow-200 text-sm">
            No voices detected. Your browser may not support the Web Speech API, or you may need to enable text-to-speech in your device settings.
            {isMobile && " Mobile browsers often have limited TTS support."}
          </p>
        </div>
      )}
    </div>
  );
};

export default TextToSpeech;
