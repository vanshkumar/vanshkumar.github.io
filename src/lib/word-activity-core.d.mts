export interface WordCounts { added: number; edited: number; removed: number }
export interface ActivityDay extends WordCounts { date: string; label: string; touched: number; level: number; future: boolean }
export interface ActivityCalendar { weeks: { days: ActivityDay[]; monthLabel: string }[]; totals: WordCounts & { touched: number }; activeDays: number; startDate: string; endDate: string }
export const PUBLIC_MARKDOWN_PATHS: string[];
export function countWords(text: string): number;
export function getActivityLevel(touched: number): number;
export function parseWordDiffLog(output: string): Map<string, WordCounts>;
export function buildCalendar(activity: Map<string, WordCounts>, options?: { today?: string; weekCount?: number }): ActivityCalendar;
