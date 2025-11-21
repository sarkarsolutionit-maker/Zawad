
import React from 'react';
import { VoiceName } from '../types';

interface VoiceSelectorProps {
  selectedVoice: VoiceName;
  onVoiceChange: (voice: VoiceName) => void;
  disabled?: boolean;
  label?: string;
}

export const VoiceSelector: React.FC<VoiceSelectorProps> = ({
  selectedVoice,
  onVoiceChange,
  disabled = false,
  label = 'Select Voice',
}) => {
  const voices = Object.values(VoiceName);
  const selectId = label.replace(/\s+/g, '-').toLowerCase();

  return (
    <div>
      <label htmlFor={selectId} className="block text-sm font-medium text-gray-300 mb-2">
        {label}
      </label>
      <div className="relative w-full">
        <select
          id={selectId}
          value={selectedVoice}
          onChange={(e) => onVoiceChange(e.target.value as VoiceName)}
          disabled={disabled}
          className="w-full bg-gray-700 border border-gray-600 text-white text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block p-2.5 appearance-none disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {voices.map((voice) => (
            <option key={voice} value={voice}>
              {voice}
            </option>
          ))}
        </select>
        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-400">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path>
          </svg>
        </div>
      </div>
    </div>
  );
};
