import React from 'react';
import { Italic as ItalicsIcon, Type, BedDouble as ThoughtBubble, Navigation, Clock, Heart, Sparkles, Music, Eye } from 'lucide-react';

interface MarkdownToolbarProps {
  onFormat: (type: string) => void;
  disabled?: boolean;
}

const MarkdownToolbar: React.FC<MarkdownToolbarProps> = ({ onFormat, disabled }) => {
  const buttons = [
    { icon: ItalicsIcon, label: 'Stage Direction', format: '_', tooltip: 'Add stage direction (e.g. _smiles warmly_)' },
    { icon: ThoughtBubble, label: 'Inner Thought', format: '>', tooltip: 'Add inner monologue (e.g. > thinking deeply)' },
    { icon: Navigation, label: 'Spatial', format: '~', tooltip: 'Add spatial direction (e.g. ~moves closer~)' },
    { icon: Clock, label: 'Temporal', format: '⌛' , tooltip: 'Add temporal cue (e.g. [time: pauses briefly])' },
    { icon: Heart, label: 'Emotional', format: '♥' , tooltip: 'Add emotional state (e.g. [feeling: excited])' },
    { icon: Sparkles, label: 'Action', format: '⚡' , tooltip: 'Add action (e.g. [action: jumps excitedly])' },
    { icon: Music, label: 'Tone', format: '♪', tooltip: 'Add tone of voice (e.g. [tone: speaking softly])' },
    { icon: Eye, label: 'Perception', format: '[notices: ]', tooltip: 'Add perception (e.g. [notices: the details])' },
    { icon: Type, label: 'Emphasis', format: '**', tooltip: 'Add emphasis (e.g. **very important**)' }
  ];

  const handleClick = (e: React.MouseEvent, format: string) => {
    e.preventDefault(); // Prevent form submission
    onFormat(format);
  };

  return (
    <div className="flex justify-center gap-1 p-2 bg-muted rounded-lg border border-border mb-2">
      {buttons.map(({ icon: Icon, label, format, tooltip }) => (
        <button
          key={label}
          onClick={(e) => handleClick(e, format)}
          type="button" // Explicitly set type to button to prevent form submission
          disabled={disabled}
          className="p-1.5 hover:bg-accent rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed group relative"
          title={tooltip}
        >
          <Icon className="w-4 h-4 text-muted-foreground group-hover:text-accent-foreground" />
          <span className="sr-only">{label}</span>
          <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-popover text-popover-foreground text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none border border-border">
            {tooltip}
          </div>
        </button>
      ))}
    </div>
  );
};

export default MarkdownToolbar;