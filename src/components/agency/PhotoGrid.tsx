import { useState, useRef } from 'react';
import { GripVertical } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PhotoGridProps {
  imageUrls: string[];
  editable?: boolean;
  onChange?: (urls: string[]) => void;
}

export function PhotoGrid({ imageUrls, editable = false, onChange }: PhotoGridProps) {
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [overIndex, setOverIndex] = useState<number | null>(null);
  const dragRef = useRef<number | null>(null);

  if (!imageUrls || imageUrls.length === 0) {
    return (
      <div className="p-4 rounded-lg bg-muted/30 text-center text-sm text-muted-foreground">
        No photos extracted
      </div>
    );
  }

  const handleDragStart = (idx: number) => {
    dragRef.current = idx;
    setDragIndex(idx);
  };

  const handleDragOver = (e: React.DragEvent, idx: number) => {
    e.preventDefault();
    setOverIndex(idx);
  };

  const handleDrop = (idx: number) => {
    const from = dragRef.current;
    if (from == null || from === idx) {
      setDragIndex(null);
      setOverIndex(null);
      return;
    }
    const updated = [...imageUrls];
    const [moved] = updated.splice(from, 1);
    updated.splice(idx, 0, moved);
    onChange?.(updated);
    setDragIndex(null);
    setOverIndex(null);
  };

  return (
    <div className="grid grid-cols-4 gap-2">
      {imageUrls.map((url, idx) => (
        <div
          key={`${url}-${idx}`}
          draggable={editable}
          onDragStart={() => handleDragStart(idx)}
          onDragOver={(e) => handleDragOver(e, idx)}
          onDragEnd={() => { setDragIndex(null); setOverIndex(null); }}
          onDrop={() => handleDrop(idx)}
          className={cn(
            'relative aspect-square rounded-lg overflow-hidden border group',
            editable && 'cursor-grab',
            dragIndex === idx && 'opacity-40',
            overIndex === idx && dragIndex !== idx && 'ring-2 ring-primary',
          )}
        >
          <img src={url} alt={`Photo ${idx + 1}`} className="w-full h-full object-cover" />
          {editable && (
            <div className="absolute top-1 left-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <GripVertical className="h-4 w-4 text-white drop-shadow-md" />
            </div>
          )}
          {idx === 0 && (
            <span className="absolute bottom-1 left-1 text-[10px] bg-primary text-primary-foreground px-1.5 py-0.5 rounded-md font-medium">
              Cover
            </span>
          )}
        </div>
      ))}
    </div>
  );
}
