import { useState, useEffect, useRef } from 'react';
import { Info, Languages, Loader, Play, SlidersVertical, Square, Volume2 } from 'lucide-react';

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
  const synth = useRef<SpeechSynthesis | null>(null);

  // Initialize speech synthesis
  useEffect(() => {
    if (typeof window !== 'undefined') {
      synth.current = window.speechSynthesis;
      
      // Function to load voices
      const loadVoices = () => {
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
        }
      }, 2000);
      
      return () => {
        clearTimeout(timeoutId);
        if (synth.current?.speaking) {
          synth.current?.cancel();
        }
      };
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
      utterance.onerror = () => setIsSpeaking(false);
      
      synth.current.speak(utterance);
    }
  };
  
  const stopSpeaking = () => {
    if (synth.current) {
      synth.current.cancel();
      setIsSpeaking(false);
    }
  };
  
  return (
    <div className="p-6">
      <div className="mb-6">
        <div className="flex items-center mb-2">
          <Languages className="mr-2 h-5 w-5 text-indigo-600 dark:text-indigo-400" />
          <label htmlFor="language" className="font-medium">Language</label>
        </div>
        <select
          id="language"
          className="w-full p-3 text-base border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400 focus:border-indigo-500 dark:focus:border-indigo-400 outline-none transition appearance-none min-h-[48px] mobile:min-h-[44px]"
          value={selectedLanguage}
          onChange={(e) => setSelectedLanguage(e.target.value)}
          disabled={loadingVoices}
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
          className="w-full p-3 text-base border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400 focus:border-indigo-500 dark:focus:border-indigo-400 outline-none transition appearance-none min-h-[48px] mobile:min-h-[44px]"
          value={selectedVoice}
          onChange={(e) => setSelectedVoice(e.target.value)}
          disabled={loadingVoices || !selectedLanguage}
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
            className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer accent-indigo-600 dark:accent-indigo-400"
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
            className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer accent-indigo-600 dark:accent-indigo-400"
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
          rows={6}
          className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400 focus:border-indigo-500 dark:focus:border-indigo-400 outline-none transition"
          placeholder="Enter text to convert to speech..."
        />
      </div>
      
      <div className="flex justify-center">
        {!isSpeaking ? (
          <button
            onClick={speak}
            disabled={!text || loadingVoices || !selectedVoice}
            className="flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2 px-6 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
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
            className="flex items-center justify-center gap-2 bg-red-600 hover:bg-red-700 text-white font-medium py-2 px-6 rounded-lg transition"
          >
            <Square className="h-5 w-5" />
            Stop
          </button>
        )}
      </div>
      
      {voices.length === 0 && !loadingVoices && (
        <div className="mt-6 p-4 border border-yellow-300 bg-yellow-50 dark:bg-yellow-900/30 dark:border-yellow-800 rounded-lg">
          <p className="text-yellow-800 dark:text-yellow-200 text-sm">
            No voices detected. Your browser may not support the Web Speech API, or you may need to enable text-to-speech in your device settings.
          </p>
        </div>
      )}
    </div>
  );
};

export default TextToSpeech;
