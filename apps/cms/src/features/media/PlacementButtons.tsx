import type { ImagePlacement } from '@coastal-talk-news/types';
import {
  Divider,
  ToolbarButton,
} from '../../components/editor/ToolbarButton.js';
import { PlacementIcon } from './PlacementIcon.js';

interface Option {
  value: ImagePlacement;
  label: string;
}

/** The picture on a line of its own. */
const ALIGNMENTS: Option[] = [
  { value: 'left', label: 'Image on the left' },
  { value: 'center', label: 'Image centred' },
  { value: 'right', label: 'Image on the right' },
];

/** The picture at one side, with the text running alongside it. */
const WRAPS: Option[] = [
  { value: 'float-left', label: 'Left, text wraps around' },
  { value: 'float-right', label: 'Right, text wraps around' },
];

interface PlacementButtonsProps {
  value: ImagePlacement;
  onChange: (placement: ImagePlacement) => void;
}

export function PlacementButtons({ value, onChange }: PlacementButtonsProps) {
  const group = (label: string, options: Option[]) => (
    <div className="flex items-center gap-0.5" role="group" aria-label={label}>
      {options.map((option) => (
        <ToolbarButton
          key={option.value}
          label={option.label}
          active={value === option.value}
          onClick={() => onChange(option.value)}
        >
          <PlacementIcon placement={option.value} />
        </ToolbarButton>
      ))}
    </div>
  );

  return (
    <div className="flex items-center">
      {group('Alignment', ALIGNMENTS)}
      <Divider />
      {group('Text wrap', WRAPS)}
    </div>
  );
}
