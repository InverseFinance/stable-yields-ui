'use client';

import { useEffect, useState } from 'react';
import { Camera } from 'lucide-react';

export interface GeneratedImage {
  dataUrl: string;
  filename: string;
}

// Camera button with the screenshot options, at the top right of its positioned parent
export function ScreenshotMenu({
  highlightLabel,
  onScreenshot,
  onHighlight,
}: {
  highlightLabel: string;
  onScreenshot: () => void;
  onHighlight: () => void;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [isHidden, setIsHidden] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    const handleEscKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setIsOpen(false);
    };
    window.addEventListener('keydown', handleEscKey);
    return () => window.removeEventListener('keydown', handleEscKey);
  }, [isOpen]);

  const options = [
    { label: 'Screenshot the table', onClick: onScreenshot },
    { label: highlightLabel, onClick: onHighlight },
    { label: isHidden ? 'Show Screenshot button' : 'Hide Screenshot button', onClick: () => setIsHidden(v => !v) },
  ];

  return (
    <div className="absolute -top-3 -right-2 z-20">
      <button
        onClick={() => isHidden ? setIsHidden(false) : setIsOpen(v => !v)}
        style={{ opacity: isHidden ? 0 : 1 }}
        className="flex items-center gap-1.5 text-muted-foreground hover:text-foreground text-xs sm:text-sm transition cursor-pointer"
        title={isHidden ? 'Show Screenshot button' : 'Screenshot options'}
      >
        <Camera size={14} />
        <span className="hidden sm:inline">Screenshot</span>
      </button>
      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
          <div className="absolute top-full right-0 mt-1 bg-container border border-border rounded-lg shadow-lg z-50 min-w-[190px] py-1 text-sm">
            {options.map(option => (
              <button
                key={option.label}
                className="w-full text-left px-3 py-2 text-muted-foreground hover:text-foreground hover:bg-muted/40 transition cursor-pointer"
                onClick={() => { setIsOpen(false); option.onClick(); }}
              >
                {option.label}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

// Shown above a table while picking the row to generate an image for
export function HighlightModeHint({ text, onCancel }: { text: string; onCancel: () => void }) {
  return (
    <div className="flex items-center justify-between mb-2 px-1">
      <p className="text-sm text-muted-foreground">{text}</p>
      <button
        onClick={onCancel}
        className="text-xs text-muted-foreground hover:text-foreground transition cursor-pointer ml-4 shrink-0"
      >
        Cancel
      </button>
    </div>
  );
}

export function ImagePreviewModal({ image, onClose }: { image: GeneratedImage | null; onClose: () => void }) {
  if (!image) return null;
  return (
    <div
      className="fixed inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div
        className="bg-container rounded-xl shadow-2xl overflow-hidden max-w-4xl w-full max-h-[90vh] flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        <div className="overflow-y-auto">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={image.dataUrl} alt="Promo preview" className="w-full" />
        </div>
        <div className="flex gap-3 justify-end p-3 border-t border-border shrink-0">
          <button
            onClick={onClose}
            className="cursor-pointer px-4 py-2 text-sm text-muted-foreground hover:text-foreground transition"
          >
            Close
          </button>
          <a href={image.dataUrl} download={image.filename}>
            <button className="cta-button cursor-pointer px-4 py-2 text-sm text-foreground">
              Download
            </button>
          </a>
        </div>
      </div>
    </div>
  );
}
