export interface WordCounts { added: number; edited: number; removed: number }
export interface WordChange extends WordCounts { date: string; beforePath?: string | null; afterPath?: string | null; beforeBlob?: string; afterBlob?: string }
export interface ActivityDay extends WordCounts { date: string; label: string; touched: number; level: number; future: boolean }
export interface ActivityCalendar { weeks: { days: ActivityDay[]; monthLabel: string }[]; totals: WordCounts & { touched: number }; activeDays: number; startDate: string; endDate: string }
export const PUBLIC_MARKDOWN_PATHS: string[];
export const WORD_DIFF_ARGS: string[];
export function countMarkdownWords(text: string): number;
export function countWords(text: string): number;
export function getActivityLevel(touched: number): number;
export function parseWordDiffLog(output: string): Map<string, WordCounts>;
export function parseWordDiffChanges(output: string): WordChange[];
export function aggregateWordActivity(changes: WordChange[]): Map<string, WordCounts>;
export function buildCalendar(activity: Map<string, WordCounts>, options?: { today?: string; weekCount?: number }): ActivityCalendar;
