/** ActionChips.tsx — Quick conversational action chips */

import React from 'react';

interface Chip {
  icon: string;
  label: string;
  query: string;
}

interface ActionChipsProps {
  onSelect: (query: string) => void;
  visible: boolean;
}

const CHIPS: Chip[] = [
  { icon: '🌾', label: 'Crop Insurance (PMFBY)', query: 'Tell me about PMFBY crop insurance' },
  { icon: '🤝', label: 'Cooperative / PACS Membership', query: 'How to join PACS cooperative society?' },
  { icon: '⚖️', label: 'Cooperative Bylaws & Legal Rules', query: 'What are cooperative bylaws and my legal rights?' },
  { icon: '📄', label: 'Inspect Circular / Poster', query: 'Read this circular or poster for me' },
  { icon: '💳', label: 'Kisan Credit Card (KCC)', query: 'Tell me about Kisan Credit Card KCC' },
  { icon: '🧑‍🌾', label: 'PM-KISAN Scheme', query: 'What is PM-KISAN scheme and how to register?' },
];

export default function ActionChips({ onSelect, visible }: ActionChipsProps) {
  if (!visible) return null;
  return (
    <div className="flex flex-wrap gap-2 px-4 pb-2 animate-slideUp">
      {CHIPS.map((chip) => (
        <button
          key={chip.query}
          onClick={() => onSelect(chip.query)}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm text-slate-300 glass-card
            hover:border-emerald-500/40 hover:text-emerald-300 hover:bg-emerald-500/5
            transition-all duration-200 active:scale-95 border border-transparent"
        >
          <span>{chip.icon}</span>
          <span className="hidden sm:inline">{chip.label}</span>
        </button>
      ))}
    </div>
  );
}
