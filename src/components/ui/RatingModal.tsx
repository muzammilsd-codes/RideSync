import React, { useState } from 'react';
import { Star, Check, Sparkles, X, HeartHandshake } from 'lucide-react';
import { Button } from './Button';
import { Avatar } from './Avatar';

interface RatingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (score: number, comment: string, tags: string[]) => void;
  rideId: string;
  rateeName: string;
  rateeRole: 'host' | 'passenger';
  rateePhoto?: string;
}

const COMPLIMENT_TAGS = [
  'Punctual',
  'Safe Driving',
  'Clean Car',
  'Great Conversation',
  'Women-Only Verified',
  'Smooth Route',
  'OTP Ready',
  'Eco Hero',
];

export const RatingModal: React.FC<RatingModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  rideId,
  rateeName,
  rateeRole,
  rateePhoto,
}) => {
  const [score, setScore] = useState(5);
  const [hoverScore, setHoverScore] = useState(0);
  const [selectedTags, setSelectedTags] = useState<string[]>(['Punctual', 'Safe Driving']);
  const [comment, setComment] = useState('');

  if (!isOpen) return null;

  const toggleTag = (tag: string) => {
    if (selectedTags.includes(tag)) {
      setSelectedTags(selectedTags.filter((t) => t !== tag));
    } else {
      setSelectedTags([...selectedTags, tag]);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(score, comment, selectedTags);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl p-6 w-full max-w-md shadow-2xl border border-[#E3ECF5] space-y-5 animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-[#E3ECF5]">
          <div className="flex items-center gap-2 text-[#2B8CEB]">
            <HeartHandshake className="w-5 h-5" />
            <span className="text-xs font-bold uppercase tracking-wider">
              Post-Commute Rating (PostgreSQL `ratings`)
            </span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-full text-[#5B6B80] hover:text-[#0F1B2D] hover:bg-[#F5FAFF] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Person being rated */}
        <div className="flex flex-col items-center text-center space-y-2">
          <Avatar name={rateeName} image={rateePhoto} size="xl" className="shadow-soft" />
          <div>
            <h2 className="text-base font-bold text-[#0F1B2D]">How was your commute with {rateeName}?</h2>
            <p className="text-xs text-[#5B6B80]">
              {rateeRole === 'host' ? 'Captain & Vehicle Host' : 'Co-Rider'} • Verified Colleague
            </p>
          </div>
        </div>

        {/* 5-Star Selector */}
        <div className="flex items-center justify-center gap-2 py-2">
          {[1, 2, 3, 4, 5].map((star) => {
            const isFilled = (hoverScore || score) >= star;
            return (
              <button
                key={star}
                type="button"
                onMouseEnter={() => setHoverScore(star)}
                onMouseLeave={() => setHoverScore(0)}
                onClick={() => setScore(star)}
                className="p-1.5 transition-transform hover:scale-115 active:scale-95 focus:outline-none"
                aria-label={`${star} star`}
              >
                <Star
                  className={`w-8 h-8 transition-colors ${
                    isFilled ? 'text-[#FFB800] fill-[#FFB800]' : 'text-[#E3ECF5]'
                  }`}
                />
              </button>
            );
          })}
        </div>
        <p className="text-center text-xs font-semibold text-[#2B8CEB]">
          {score === 5 && '🌟 Outstanding ride! Everything was perfect.'}
          {score === 4 && '👍 Great ride! Smooth & reliable.'}
          {score === 3 && '🙂 Satisfactory commute.'}
          {score <= 2 && '⚠️ Needs improvement.'}
        </p>

        {/* Compliment Tags */}
        <div className="space-y-2">
          <span className="text-[11px] font-bold text-[#5B6B80] uppercase tracking-wider block">
            Select Compliments:
          </span>
          <div className="flex flex-wrap gap-1.5">
            {COMPLIMENT_TAGS.map((tag) => {
              const active = selectedTags.includes(tag);
              return (
                <button
                  key={tag}
                  type="button"
                  onClick={() => toggleTag(tag)}
                  className={`text-xs px-3 py-1 rounded-full font-medium transition-all ${
                    active
                      ? 'bg-[#E8F3FF] text-[#2B8CEB] border border-[#2B8CEB]/40 font-bold'
                      : 'bg-[#F5FAFF] text-[#5B6B80] border border-[#E3ECF5] hover:border-[#2B8CEB]/20'
                  }`}
                >
                  {tag} {active && '✓'}
                </button>
              );
            })}
          </div>
        </div>

        {/* Feedback Comment */}
        <div className="space-y-1.5">
          <label className="text-[11px] font-bold text-[#5B6B80] uppercase tracking-wider block">
            Colleague Feedback:
          </label>
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="e.g. Prompt arrival at Mindspace gate, smooth driving, very safe!"
            rows={2}
            className="w-full bg-[#F5FAFF] border border-[#E3ECF5] rounded-xl p-3 text-xs text-[#0F1B2D] placeholder-[#5B6B80] focus:outline-none focus:border-[#2B8CEB] transition-all resize-none"
          />
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 pt-1">
          <Button variant="secondary" size="md" onClick={onClose} className="flex-1">
            Skip
          </Button>
          <Button
            variant="primary"
            size="md"
            onClick={handleSubmit}
            className="flex-1 font-bold shadow-soft"
          >
            Submit Peer Rating
          </Button>
        </div>
      </div>
    </div>
  );
};
