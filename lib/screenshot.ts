// Client helpers for the table screenshots and promo images

// Loads an image through the Next image optimizer (same origin), as a data URL html-to-image and canvases can draw
export async function fetchAsDataUrl(src: string, width = 64): Promise<string> {
  try {
    const res = await fetch(`/_next/image?url=${encodeURIComponent(src)}&w=${width}&q=75`);
    if (!res.ok) return '';
    const blob = await res.blob();
    return await new Promise<string>(resolve => {
      const reader = new FileReader();
      reader.onloadend = () => resolve((reader.result as string) || '');
      reader.onerror = () => resolve('');
      reader.readAsDataURL(blob);
    });
  } catch {
    return '';
  }
}

// Image src -> data URL, for the images that could be loaded
export async function fetchDataUrlMap(srcs: Iterable<string>): Promise<Record<string, string>> {
  const entries = await Promise.all(
    [...new Set(srcs)].filter(Boolean).map(async src => [src, await fetchAsDataUrl(src)] as const)
  );
  return Object.fromEntries(entries.filter(([, dataUrl]) => dataUrl));
}

// PNG data URL of a rendered off-screen screenshot template
export async function captureAsPng(element: HTMLElement): Promise<string> {
  const { toPng } = await import('html-to-image');
  const isDark = document.documentElement.classList.contains('dark');
  return toPng(element, {
    pixelRatio: 2,
    backgroundColor: isDark ? 'rgb(19,19,20)' : '#ffffff',
    style: { position: 'static', top: 'auto', left: 'auto', overflow: 'hidden' },
  });
}
