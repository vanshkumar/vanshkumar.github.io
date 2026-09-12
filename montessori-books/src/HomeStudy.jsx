import React, { useEffect, useRef } from 'react';
import { stages } from './concepts';
import { guide as defaultGuide } from './guide';
import { books, kindLabels, topics, pageLabel } from './guide/catalog';
import { homeLink, studyLink } from './guide/routes';
import './home.css';

export default function HomeStudy({ route, guide = defaultGuide }) {
  const { age } = route;
  const stage = stages.find(s => s.id === age);
  const openings = guide.openings(age);
  const active = openings.find(item => item.entry.id === (route.idea ?? route.entry)) ?? openings[0];
  const scene = guide.scene(age);
  const topic = topics.find(item => item.id === route.topic);
  const selected = route.entry ? guide.atAge(route.entry, age, route.topic) : null;
  const browsing = Boolean(route.explore || route.topic);
  const home = homeLink({ age, idea: active?.entry.id });
  const explore = homeLink({ age, idea: active?.entry.id, explore: true });
  const viewKey = `${age}/${route.entry ?? ''}/${route.topic ?? ''}/${route.explore}`;
  const previous = useRef(null);

  useEffect(() => {
    const prior = previous.current;
    // A local opening choice changes its headline without scrolling the page.
    if (prior && prior.key !== viewKey) {
      const returningHome = !route.entry && !browsing;
      const target = returningHome
        ? document.getElementById(prior.entry ? 'home-read-entry' : 'home-explore')
        : (!route.entry && prior.entry ? document.getElementById(`entry-link-${prior.entry}`) : null)
          ?? document.getElementById('home-view-title');
      target?.focus({ preventScroll: true });
      if (target) {
        const bounds = target.getBoundingClientRect();
        if (bounds.top < 0 || bounds.bottom > window.innerHeight) target.scrollIntoView({ block: 'start' });
      }
    }
    previous.current = { key: viewKey, entry: route.entry };
  }, [viewKey, route.entry, browsing]);

  return <div className="home-edition theme-home">
    <header className="he-masthead">
      <a href={homeLink({ age })} className="he-brand"><span>small</span> <span>beginnings</span></a>
      <span className="he-bookline">A Montessori companion</span>
      {import.meta.env.DEV && <a className="he-back" href={studyLink('studies', age)}>All studies <span aria-hidden="true">→</span></a>}
    </header>

    <main id="main" tabIndex={-1} className="he-main">
      <section className="he-introduction">
        <h1>A home within reach</h1>
        <div className="he-age-choice">
          <label htmlFor="home-age">Your child’s age</label>
          <select id="home-age" value={age} onChange={event => { window.location.hash = homeLink({ age: event.target.value }); }}>
            {stages.map(s => <option key={s.id} value={s.id}>{s.label}</option>)}
          </select>
        </div>
      </section>

      {route.entry ? selected ? <EntryReading
        entry={selected.entry} placement={selected.placement}
        back={topic ? homeLink({ age, topic: topic.id, idea: active?.entry.id }) : browsing ? explore : home}
        backLabel={topic?.label ?? (browsing ? 'Explore more' : 'Three starting ideas')}
      /> : <UnavailableEntry id={route.entry} age={age} home={home} guide={guide}/>
      : browsing ? <TopicBrowser route={route} activeId={active?.entry.id} home={home} topic={topic} guide={guide}/>
      : active && scene ? <>
        <section className="he-room-section" aria-label="Explore your home">
          <div className="he-room-spread">
            <figure className="he-room-figure" data-layout={scene.layout}>
              <div className="he-room-canvas">
                <h2 id="home-idea-title" className="he-scene-title">{active.entry.title}</h2>
                <img className="he-room-art" src={`${import.meta.env.BASE_URL}${scene.src}`} alt={scene.alt} width={scene.width} height={scene.height}/>
              </div>
              <figcaption><span>{scene.caption}</span><span>Inspired by {books[scene.sourceId].title}</span></figcaption>
            </figure>

            <aside className="he-invitation" aria-label="Three ideas for this age">
              <nav className="he-idea-nav" aria-label="Choose an idea">
                {openings.map(({ entry }, i) => <a key={entry.id} href={homeLink({ age, idea: entry.id })}
                  className={active.entry.id === entry.id ? 'is-active' : ''}
                  aria-current={active.entry.id === entry.id ? 'true' : undefined} aria-controls="home-invitation">
                  <span className="he-idea-index">0{i + 1}</span>{entry.actionLabel}
                </a>)}
              </nav>
              <section id="home-invitation" className="he-reading" aria-labelledby="home-idea-title">
                <p className="he-guide-label">{active.entry.category ?? kindLabels[active.entry.kind]}</p>
                <p className="he-invitation-copy">{active.entry.invitation ?? active.entry.summary}</p>
                {active.entry.cue && <div className="he-observation"><h3>{active.entry.kind === 'invitation' ? 'Start by noticing' : 'In the everyday'}</h3><p>{active.entry.cue}</p></div>}
                <a id="home-read-entry" className="he-read" href={homeLink({ age, entry: active.entry.id, idea: active.entry.id })}>
                  {active.entry.kind === 'invitation' ? 'Try this together' : 'Read more'} <span aria-hidden="true">→</span>
                </a>
              </section>
            </aside>
          </div>
        </section>
        <div className="he-explore-link"><a id="home-explore" href={explore}>Explore more <span aria-hidden="true">→</span></a></div>
      </> : <section className="he-unfinished"><p className="he-kicker">{stage.label}</p><h2>This part of the home<br/>is still taking shape.</h2><p>For now, explore the ideas for 6–9 or 18–24 months.</p><div><a href={homeLink({ age: '6-9' })}>6–9 months ↗</a><a href={homeLink({ age: '18-24' })}>18–24 months ↗</a></div></section>}

      <footer className="he-footer">
        <p>You don’t need a different home. Start with what you have.</p>
        <details className="he-colophon"><summary>About this companion</summary><p>Original summaries inspired by <cite>The Montessori Baby</cite> and <cite>The Montessori Toddler</cite>. Open any idea for its book references. The illustration is an invitation to explore, rather than a room to reproduce. Follow your child’s pace.</p>{import.meta.env.DEV && <a href={studyLink('studies', age)}>See all ten visual studies ↗</a>}</details>
      </footer>
    </main>
  </div>;
}

function TopicBrowser({ route, activeId, home, topic, guide }) {
  const entries = topic ? guide.forTopic(route.age, topic.id) : [];
  const topicNav = useRef(null);
  useEffect(() => {
    const row = topicNav.current;
    const current = row?.querySelector('[aria-current="page"]');
    if (current) row.scrollLeft = current.offsetLeft - row.offsetLeft - (row.clientWidth - current.offsetWidth) / 2;
  }, [topic?.id]);
  return <section className="he-browse">
    <a className="he-return" href={home}>← Three starting ideas</a>
    <div className="he-browse-layout">
      <nav className="he-topics" aria-label="Everyday topics" ref={topicNav}>
        {topics.map(item => <a key={item.id} href={homeLink({ age: route.age, topic: item.id, idea: activeId })}
          aria-current={item.id === topic?.id ? 'page' : undefined}>{item.label}<span aria-hidden="true">→</span></a>)}
      </nav>
      <div className="he-topic-content">
        <h2 id="home-view-title" tabIndex={-1}>{topic?.label ?? (route.topic ? 'Topic not found' : 'Explore more')}</h2>
        {!topic ? <p>{route.topic ? 'Choose one of the everyday topics.' : 'Play, care, connection, home, and family life. Choose a topic to look closer.'}</p>
        : entries.length ? <ul className="he-entry-list">{entries.map(({ entry }) => <li key={entry.id}>
          <a id={`entry-link-${entry.id}`} href={homeLink({ age: route.age, topic: topic.id, entry: entry.id, idea: activeId })}>
            <span className="he-guide-label">{kindLabels[entry.kind]}</span><h3>{entry.title}</h3><p>{entry.summary}</p><span className="he-entry-arrow" aria-hidden="true">↗</span>
          </a>
        </li>)}</ul> : <p>There are no entries here yet. You can explore another topic or return to the starting ideas.</p>}
      </div>
    </div>
  </section>;
}

export function EntryReading({ entry, placement, back, backLabel }) {
  return <article className="he-entry-reading">
    <a className="he-return" href={back}>← {backLabel}</a>
    <div className="he-entry-body">
      <p className="he-guide-label">{kindLabels[entry.kind]}</p>
      <h2 id="home-view-title" tabIndex={-1}>{entry.title}</h2>
      <p className="he-entry-summary">{entry.summary}</p>
      {entry.cue && <section className="he-entry-context"><h3>{entry.kind === 'invitation' ? 'Start by noticing' : 'In the everyday'}</h3><p>{entry.cue}</p></section>}
      {placement.ageContext && <section className="he-entry-context"><h3>Age, interest & context</h3>
        {placement.ageContext.bookAge && <p><span>In the book: </span>{placement.ageContext.bookAge}</p>}
        {placement.ageContext.readiness && <p>{placement.ageContext.readiness}</p>}
        {placement.ageContext.note && <p>{placement.ageContext.note}</p>}
      </section>}
      {entry.detail?.length > 0 && <div className="he-entry-detail">{entry.detail.map((paragraph, i) => <p key={i}>{paragraph}</p>)}</div>}
      {entry.illustration && <figure className="he-key-moment"><img src={`${import.meta.env.BASE_URL}${entry.illustration.src}`} alt={entry.illustration.alt} width={entry.illustration.width} height={entry.illustration.height}/>{entry.illustration.caption && <figcaption>{entry.illustration.caption}</figcaption>}</figure>}
      {entry.steps?.length > 0 && <section className="he-entry-steps"><h3>{entry.kind === 'invitation' ? 'Try it together' : 'In this situation'}</h3><ol>{entry.steps.map((step, i) => <li key={i}>{step}</li>)}</ol></section>}
      {entry.principle && <section className="he-entry-principle"><h3>What’s underneath</h3><p>{entry.principle.text}</p></section>}
      <section className="he-references" aria-labelledby="home-references-title">
        <h3 id="home-references-title">Back to the books</h3>
        <ol>{entry.references.map(reference => <li key={reference.id}>
          <cite>{books[reference.sourceId].title}</cite>
          <p>{reference.section}</p>{reference.locator && <p>{reference.locator}</p>}
          <p>{pageLabel(reference)}</p>
        </li>)}</ol>
        <p className="he-reference-note">Paraphrased for this companion. Illustrations are original and illustrative.</p>
      </section>
    </div>
  </article>;
}

function UnavailableEntry({ id, age, home, guide }) {
  const ages = guide.agesFor(id).filter(candidate => candidate !== age);
  return <section className="he-unfinished">
    <a className="he-return" href={home}>← Back to this age</a>
    <h2 id="home-view-title" tabIndex={-1}>This idea isn’t available here.</h2>
    {ages.length > 0 && <><p>Find it with the ideas for:</p><div>{ages.map(candidate => <a key={candidate} href={homeLink({ age: candidate, entry: id })}>{stages.find(stage => stage.id === candidate).label} ↗</a>)}</div></>}
  </section>;
}
