import type { ReadingMode } from '@/types';

/** Reading-mode options shared by the library modals and the reader toolbar. */
export const READING_MODE_OPTIONS: { id: ReadingMode; label: string }[] = [
    { id: 'vertical', label: 'Vertical Scroll' },
    { id: 'webtoon', label: 'Webtoon (gapless)' },
    { id: 'horizontal_ltr', label: 'Horizontal (L → R)' },
    { id: 'horizontal_rtl', label: 'Horizontal (R → L)' },
];

export const DEFAULT_READING_MODE: ReadingMode = 'vertical';
