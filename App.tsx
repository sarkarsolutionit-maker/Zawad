
import React, { useState, useRef, useCallback } from 'react';
import { VoiceSelector } from './components/VoiceSelector';
import { VoiceName, AppMode } from './types';
import { generateSpeech } from './services/geminiService';
import { decode, decodeAudioData, audioBufferToWav } from './utils/audioUtils';

const PlayIcon: React.FC = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
    <path fillRule="evenodd" d="M4.5 5.653c0-1.426 1.529-2.33 2.779-1.643l11.54 6.647c1.295.742 1.295 2.545 0 3.286L7.279 20.99c-1.25.717-2.779-.217-2.779-1.643V5.653z" clipRule="evenodd" />
  </svg>
);

const PauseIcon: React.FC = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
    <path fillRule="evenodd" d="M6.75 5.25a.75.75 0 01.75.75v12a.75.75 0 01-1.5 0v-12a.75.75 0 01.75-.75zm9 0a.75.75 0 01.75.75v12a.75.75 0 01-1.5 0v-12a.75.75 0 01.75-.75z" clipRule="evenodd" />
  </svg>
);

const SparkleIcon: React.FC = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 mr-2">
      <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09ZM18.259 8.715 18 9.75l-.259-1.035a3.375 3.375 0 0 0-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 0 0 2.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 0 0 2.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 0 0-2.456 2.456Z" />
  </svg>
);

const DownloadIcon: React.FC = () => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3" />
    </svg>
);

const TrashIcon: React.FC = () => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
        <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.134-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.067-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
    </svg>
);


const App: React.FC = () => {
  const [mode, setMode] = useState<AppMode>(AppMode.SINGLE);
  const [text, setText] = useState<string>('Hello! This is Gemini Text-to-Speech. Try typing something here and I will read it for you.');
  const [selectedVoice1, setSelectedVoice1] = useState<VoiceName>(VoiceName.ZEPHYR);
  const [selectedVoice2, setSelectedVoice2] = useState<VoiceName>(VoiceName.PUCK);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [audioBuffer, setAudioBuffer] = useState<AudioBuffer | null>(null);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);

  const audioContextRef = useRef<AudioContext | null>(null);
  const sourceNodeRef = useRef<AudioBufferSourceNode | null>(null);

  const stopPlayback = useCallback(() => {
    if (sourceNodeRef.current) {
      sourceNodeRef.current.onended = null;
      sourceNodeRef.current.stop();
      sourceNodeRef.current = null;
    }
    setIsPlaying(false);
  }, []);

  const handleGenerateSpeech = async () => {
    if (!text.trim()) {
      setError('Please enter some text to generate speech.');
      return;
    }

    stopPlayback();
    setIsLoading(true);
    setError(null);
    setAudioBuffer(null);

    try {
      const base64Audio = await generateSpeech(text, mode, selectedVoice1, selectedVoice2);
      
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
      }
      const audioData = decode(base64Audio);
      const buffer = await decodeAudioData(audioData, audioContextRef.current, 24000, 1);
      setAudioBuffer(buffer);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'An unknown error occurred.');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePlayPause = () => {
    if (isPlaying) {
      stopPlayback();
    } else if (audioBuffer && audioContextRef.current) {
      const source = audioContextRef.current.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(audioContextRef.current.destination);
      
      source.onended = () => {
        setIsPlaying(false);
        sourceNodeRef.current = null;
      };
      
      source.start(0);
      sourceNodeRef.current = source;
      setIsPlaying(true);
    }
  };
  
  const handleDownload = () => {
    if (!audioBuffer) return;
    const wavBlob = audioBufferToWav(audioBuffer);
    const url = URL.createObjectURL(wavBlob);
    const a = document.createElement('a');
    a.style.display = 'none';
    a.href = url;
    a.download = 'gemini-speech.wav';
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  };
  
  const handleClear = () => {
    stopPlayback();
    setAudioBuffer(null);
  };
  
  const handleModeChange = (newMode: AppMode) => {
    setMode(newMode);
    handleClear();
    if (newMode === AppMode.SINGLE) {
        setText('Hello! This is Gemini Text-to-Speech. Try typing something here and I will read it for you.');
    } else {
        setText("Speaker A: Hi there! How can I help you today?\nSpeaker B: I'd like to know more about multi-speaker text-to-speech.");
    }
  };

  const multiSpeakerPlaceholder = "Enter a conversation script. Use 'Speaker A:' and 'Speaker B:' to assign lines. E.g.,\nSpeaker A: Hello!\nSpeaker B: Hi, how are you?";
  
  return (
    <div className="bg-gray-900 text-white min-h-screen flex flex-col items-center justify-center p-4 font-sans">
      <div className="w-full max-w-2xl bg-gray-800 rounded-2xl shadow-lg p-6 md:p-8 space-y-6">
        <header className="text-center">
          <h1 className="text-3xl md:text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-500">
            Gemini Text-to-Speech
          </h1>
          <p className="text-gray-400 mt-2">Bring your text to life with generative AI voices.</p>
        </header>

        <div className="space-y-4">
            <div className="flex justify-center bg-gray-700 rounded-lg p-1">
                <button
                    onClick={() => handleModeChange(AppMode.SINGLE)}
                    className={`px-4 py-2 text-sm font-medium rounded-md w-1/2 transition-colors ${mode === AppMode.SINGLE ? 'bg-blue-600 text-white' : 'text-gray-300 hover:bg-gray-600'}`}
                >
                    Single Speaker
                </button>
                <button
                    onClick={() => handleModeChange(AppMode.MULTI)}
                    className={`px-4 py-2 text-sm font-medium rounded-md w-1/2 transition-colors ${mode === AppMode.MULTI ? 'bg-blue-600 text-white' : 'text-gray-300 hover:bg-gray-600'}`}
                >
                    Multi-Speaker
                </button>
            </div>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder={mode === AppMode.SINGLE ? 'Enter text here...' : multiSpeakerPlaceholder}
            className="w-full h-40 p-4 bg-gray-700 border border-gray-600 rounded-lg resize-none focus:ring-2 focus:ring-blue-500 focus:outline-none transition"
            disabled={isLoading}
          />
          {mode === AppMode.SINGLE ? (
              <VoiceSelector
                  selectedVoice={selectedVoice1}
                  onVoiceChange={setSelectedVoice1}
                  disabled={isLoading}
              />
          ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <VoiceSelector
                      label="Speaker A Voice"
                      selectedVoice={selectedVoice1}
                      onVoiceChange={setSelectedVoice1}
                      disabled={isLoading}
                  />
                  <VoiceSelector
                      label="Speaker B Voice"
                      selectedVoice={selectedVoice2}
                      onVoiceChange={setSelectedVoice2}
                      disabled={isLoading}
                  />
              </div>
          )}
        </div>
        
        {error && <div className="bg-red-900/50 text-red-300 p-3 rounded-lg text-sm">{error}</div>}

        <div className="flex flex-col sm:flex-row items-center gap-4">
          <button
            onClick={handleGenerateSpeech}
            disabled={isLoading || !text.trim()}
            className="w-full sm:w-auto flex-grow bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800 disabled:cursor-not-allowed disabled:text-gray-400 text-white font-bold py-3 px-6 rounded-lg flex items-center justify-center transition-all duration-300 transform hover:scale-105 disabled:scale-100"
          >
            {isLoading ? (
              <>
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Generating...
              </>
            ) : (
                <>
                <SparkleIcon/>
                Generate Speech
                </>
            )}
          </button>
            {audioBuffer && (
             <div className="flex items-center gap-2">
                 <button
                     onClick={handlePlayPause}
                     className="bg-gray-600 hover:bg-gray-500 text-white font-bold p-3 rounded-lg flex items-center justify-center transition"
                     aria-label={isPlaying ? 'Pause audio' : 'Play audio'}
                 >
                     {isPlaying ? <PauseIcon /> : <PlayIcon />}
                 </button>
                 <button
                     onClick={handleDownload}
                     className="bg-gray-600 hover:bg-gray-500 text-white font-bold p-3 rounded-lg flex items-center justify-center transition"
                     aria-label="Download audio"
                 >
                     <DownloadIcon />
                 </button>
                 <button
                     onClick={handleClear}
                     className="bg-red-700 hover:bg-red-600 text-white font-bold p-3 rounded-lg flex items-center justify-center transition"
                     aria-label="Clear audio"
                 >
                     <TrashIcon />
                 </button>
             </div>
           )}
        </div>
      </div>
      <footer className="text-center mt-8 text-gray-500 text-sm">
        <p>Powered by Google Gemini</p>
      </footer>
    </div>
  );
};

export default App;
