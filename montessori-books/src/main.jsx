import React, { lazy, Suspense, useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import HomeStudy from './HomeStudy';
import { readRoute, homeLink } from './guide/routes';
import { guide } from './guide';
import './styles.css';

// Vite removes this branch and its entire import graph from production.
// Alternate studies preserve their original, unreviewed development presentations.
const LegacyStudies = import.meta.env.DEV ? lazy(() => import('./LegacyStudies')) : null;

function App() {
  const [route, setRoute] = useState(readRoute);
  useEffect(() => {
    let previous = readRoute();
    const change = () => {
      const next = readRoute();
      if (next.id !== previous.id || next.age !== previous.age) window.scrollTo(0, 0);
      previous = next;
      setRoute(next);
    };
    window.addEventListener('hashchange', change);
    return () => window.removeEventListener('hashchange', change);
  }, []);
  useEffect(() => {
    const entry = route.id === 'home' && route.entry ? guide.atAge(route.entry, route.age, route.topic) : null;
    const title = entry?.entry.title ?? (route.id === 'home' ? 'A home within reach' : LegacyStudies && route.id !== 'not-found' ? 'Visual studies' : 'Page not found');
    document.title = `${title} · Small beginnings`;
  }, [route]);
  return <>
    <a className="skip-link" href="#main" onClick={event => { event.preventDefault(); document.getElementById('main')?.focus(); }}>Skip to content</a>
    {route.id === 'home' ? <HomeStudy key={route.age} route={route}/>
      : LegacyStudies && route.id !== 'not-found'
        ? <Suspense fallback={<main id="main" tabIndex={-1}>Opening the visual studies…</main>}><LegacyStudies route={route}/></Suspense>
        : <main id="main" tabIndex={-1} className="empty-stage"><h1>Page not found</h1><a href={homeLink({ age: route.age })}>Return to the guide →</a></main>}
  </>;
}

createRoot(document.getElementById('root')).render(<App/>);
