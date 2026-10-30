import { useEffect, useRef, useState } from 'react';
import type { ActivityCalendar } from '../../src/lib/word-activity-core.mjs';
import type { WeatherDataService } from './lib/weatherData';

const number = (value: number) => value.toLocaleString('en-US');

export function WordActivity({ service, refreshToken }: { service: WeatherDataService; refreshToken: number }) {
  const [calendar, setCalendar] = useState<ActivityCalendar | null>(null);
  const [error, setError] = useState(false);
  const scroll = useRef<HTMLDivElement>(null);
  useEffect(() => {
    let cancelled = false;
    const refresh = () => void service.wordActivity().then(value => {
      if (!cancelled) { setCalendar(value); setError(false); }
    }).catch(() => { if (!cancelled) setError(true); });
    refresh();
    const timer = window.setInterval(refresh, 60000);
    return () => { cancelled = true; window.clearInterval(timer); };
  }, [service, refreshToken]);
  const endDate = calendar?.endDate;
  useEffect(() => {
    if (scroll.current) scroll.current.scrollLeft = scroll.current.scrollWidth;
  }, [endDate]);
  if (error) return <p className="word-activity-status">Writing activity unavailable. Check that Git is available and the vault is in its repository.</p>;
  if (!calendar) return <p className="word-activity-status">Loading writing activity…</p>;
  const today = calendar.weeks.flatMap(week => week.days).find(day => day.date === calendar.endDate)!;
  return (
    <section className="word-activity" aria-label="Writing activity">
      <p className="word-activity-total"><strong>{number(today.touched)}</strong> words touched today</p>
      <p className="word-activity-breakdown">{number(today.added)} added · {number(today.edited)} edited · {number(today.removed)} removed</p>
      <div className="word-activity-scroll" ref={scroll} tabIndex={0} role="region" aria-label="Writing activity over the past year">
        <div className="word-activity-calendar">
          {calendar.weeks.map((week, index) => <div className="word-activity-week" key={index}>
            <span className="word-activity-month">{week.monthLabel}</span>
            {week.days.map(day => <span key={day.date} className={`word-activity-cell level-${day.level}${day.future ? ' future' : ''}`}
              tabIndex={day.future ? undefined : 0} role={day.future ? undefined : 'img'}
              aria-label={day.future ? undefined : `${day.label}: ${number(day.touched)} words touched; ${number(day.added)} added, ${number(day.edited)} edited, ${number(day.removed)} removed`}
              title={day.future ? undefined : `${day.label}: ${number(day.touched)} words touched`} />)}
          </div>)}
        </div>
      </div>
      <p className="word-activity-caption">Includes saved changes since the last commit.</p>
    </section>
  );
}
