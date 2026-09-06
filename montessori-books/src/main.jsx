import React, { useEffect, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { concepts, stages } from './concepts';
import { content } from './content';
import './styles.css';

const asset = name => `${import.meta.env.BASE_URL}art/${name}.webp`;
const artInfo = {
  baby: 'A baby reaching toward a large soft ball on a floor mat, with an adult nearby.',
  toddler: 'A toddler practicing pouring at a low table beside a caring adult.',
  home: 'An illustrated home with an open play area, low shelf, and child-height table.',
  paper: 'A parent and toddler exploring large wooden blocks together.'
};
function Art({ type='baby', className='', alt, ...props }) { return <img className={`art ${className}`} src={asset(type)} alt={alt ?? artInfo[type]} width="1536" height="1024" {...props}/>; }
const num = n => String(n + 1).padStart(2, '0');
function readRoute() {
  const [id, query=''] = location.hash.replace(/^#\/?/, '').split('?');
  const age = new URLSearchParams(query).get('age');
  return { id, age: stages.some(s => s.id === age) ? age : '6-9' };
}
function link(id, age='6-9') { return `#/${id}?age=${age}`; }

function Index() {
  return <div className="index-page">
    <header className="index-nav"><a href="#" className="wordmark">small beginnings<span className="logo-dot">•</span></a><span>Montessori, by age</span></header>
    <main id="main" tabIndex={-1}>
      <section className="index-intro"><div><p className="eyebrow">TEN WAYS TO SEE THEIR WORLD</p><h1>A little guidance.<br/><em>A little more wonder.</em></h1><p>Ideas from The Montessori Baby and The Montessori Toddler, brought into everyday life. Explore a direction and see what feels right.</p><div className="index-legend"><span className="status-dot"/>Two ages to explore: 6–9 & 18–24 months</div></div><Art type="toddler"/><span className="handwritten intro-note">start small, grow together</span></section>
      <div className="collection-heading"><h2>Choose a way in</h2><span>10 visual studies · same little ideas</span></div>
      <section className="concept-grid" aria-label="Choose a design direction">{concepts.map((c,i) => <a key={c.id} className={`concept-card theme-${c.id}`} href={link(c.id)}>
        <Miniature id={c.id} index={i}/><div className="concept-meta"><span className="concept-number">{num(i)}</span><div><h3>{c.name}</h3><p>{c.descriptor}</p></div><span className="circle-arrow" aria-hidden="true">↗</span></div>
      </a>)}</section>
      <p className="index-footnote">A collection of prototypes. Each direction contains the same six book-grounded ideas, arranged a different way.</p>
    </main><Footer/>
  </div>;
}
function Miniature({ id, index }) {
  return <div className={`mini mini-${id}`} aria-hidden="true"><span className="mini-kicker">{num(index)} / A SMALL BEGINNING</span>
    {id==='windows' && <><div className="mini-title">Their world,<br/><i>opening up.</i></div><div className="mini-window"><Art type="baby" alt=""/></div><div className="mini-lines"><i/><i/><i/></div></>}
    {id==='home' && <><div className="mini-title">Within reach.</div><Art type="home" alt=""/><div className="mini-hotspots"><b>1</b><b>2</b><b>3</b></div></>}
    {id==='paths' && <><div className="mini-title">Follow their<br/><i>curiosity.</i></div><div className="mini-path"><span>Notice</span><span>Explore</span><span>Connect</span></div></>}
    {id==='stars' && <><div className="mini-orbit"><i/><i/><i/><Art type="baby" alt=""/></div><div className="mini-title">Everything connects.</div></>}
    {id==='paper' && <><div className="mini-title">Small invitations.<br/>Big discoveries.</div><Art type="paper" alt=""/></>}
    {id==='rhythms' && <><div className="mini-title">In the moments<br/><i>you already share.</i></div><div className="mini-schedule"><span>A little space</span><span>A little discovery</span><span>A little connection</span></div></>}
    {id==='notebook' && <><div className="mini-title">Look a little closer.</div><Art type="baby" alt=""/><span className="handwritten">what caught your eye?</span><div className="mini-lines"><i/><i/><i/></div></>}
    {id==='ribbon' && <><div className="mini-title">One discovery<br/><i>leads to another.</i></div><div className="mini-ribbon"><span>3</span><span>6</span><span>9</span><span>12</span><span>18</span></div></>}
    {id==='gallery' && <><div className="mini-title">Make room.</div><Art type="toddler" alt=""/><span className="mini-caption">01 — A SMALL INVITATION</span></>}
    {id==='together' && <><div className="mini-title">Let's try,<br/><i>together.</i></div><div className="mini-comic">{[0,1,2].map(n=><div key={n}><Art type="paper" alt=""/><b>{n+1}</b></div>)}</div></>}
  </div>;
}
function Footer() { return <footer className="site-footer"><span>Small beginnings</span><p>An independent companion to the books by Simone Davies and Junnifa Uzodike.<br/>Original summaries and illustrations. Follow your child’s pace.</p><a href="#">All directions ↑</a></footer>; }

function App() {
  const [route,setRoute] = useState(readRoute);
  useEffect(()=>{ const change=()=>{setRoute(readRoute());window.scrollTo(0,0);}; window.addEventListener('hashchange',change); return ()=>window.removeEventListener('hashchange',change); },[]);
  const concept=concepts.find(c=>c.id===route.id);
  useEffect(()=>{document.title=concept?`${concept.name} · Small beginnings`:'Small beginnings · Montessori by age';},[concept]);
  return <><a className="skip-link" href="#main" onClick={e=>{e.preventDefault();document.getElementById("main").focus();}}>Skip to content</a>{concept ? <Study key={`${concept.id}-${route.age}`} concept={concept} age={route.age}/> : <Index/>}</>;
}

function Study({ concept:c, age }) {
  const index=concepts.indexOf(c), stage=stages.find(s=>s.id===age), data=content[age];
  const [selected,setSelected]=useState(null);
  const [active,setActive]=useState(0);
  const [observing,setObserving]=useState(true);
  const ageOptions=useRef(null);
  useEffect(()=>{const row=ageOptions.current;const current=row?.querySelector('[aria-current="page"]');if(current)row.scrollLeft=current.offsetLeft-(row.clientWidth-current.offsetWidth)/2;},[age]);
  const open = item => setSelected(item);
  return <div className={`study theme-${c.id}`}>
    <header className="study-nav"><a className="back-link" href="#">← <span>All directions</span></a><a className="wordmark" href="#">small beginnings<span className="logo-dot">•</span></a><label className="concept-switch"><span className="sr-only">Design direction</span><select value={c.id} onChange={e=>location.hash=link(e.target.value,age)}>{concepts.map((x,i)=><option key={x.id} value={x.id}>{num(i)} · {x.name}</option>)}</select></label></header>
    <main id="main" className="study-main" tabIndex={-1}>
      <div className="study-heading"><p className="eyebrow">{num(index)} / {c.mood}</p><h1>{c.name}<span>.</span></h1><p>{c.descriptor}</p></div>
      <nav className={`age-nav ${c.id==='ribbon'?'age-ribbon':''}`} aria-label="Child's age"><span className="age-label">Their age</span><div className="age-options" ref={ageOptions}>{stages.map(s=><a key={s.id} href={link(c.id,s.id)} className={`${s.id===age?'active':''} ${!s.ready?'preview-age':''}`} aria-current={s.id===age?'page':undefined}>{s.label}{!s.ready&&<span className="sr-only"> — preview only</span>}</a>)}</div></nav>
      {!stage.ready ? <section className="empty-stage"><p className="eyebrow">{stage.label} · COMING INTO FOCUS</p><h2>This little chapter<br/>is still taking shape.</h2><p>The design is ready to explore at two ages. The remaining stages will follow once a direction is chosen.</p><div><a className="pill-button" href={link(c.id,'6-9')}>Explore 6–9 months →</a><a className="text-link" href={link(c.id,'18-24')}>Explore 18–24 months →</a></div></section> : <>
        <div className="stage-context"><p><span className="status-dot"/>{data.intro}</p><span>Three ideas. Start with one.</span></div>
        {c.id==='windows' && <section className="window-layout"><div className="window-feature"><div className="window-feature-copy"><p className="eyebrow">A WORLD WITHIN REACH</p><h2>{data.headline}</h2><p>{data.description}</p><button className="text-link" onClick={()=>open(data.items[0])}>Take a closer look <span>↗</span></button></div><div className="arched-image"><Art type={data.art}/><span className="handwritten">room to discover</span></div></div><div className="three-ideas">{data.items.map((item,i)=><IdeaCard key={item.id} item={item} index={i} open={open}/>)}</div></section>}
        {c.id==='home' && <section className="home-layout"><div className="home-scene"><Art type="home"/><div className="home-caption"><p className="eyebrow">YOUR HOME, AT THEIR HEIGHT</p><h2>A few small changes.<br/>A whole new world.</h2></div>{data.items.map((item,i)=><button key={item.id} className={`hotspot hotspot-${i}`} onClick={()=>open(item)} aria-label={`Explore ${item.title}`}><span>{i+1}</span><b>{item.category}</b></button>)}</div><div className="home-legend">{data.items.map((item,i)=><button key={item.id} onClick={()=>open(item)}><span>{num(i)}</span><div><small>{item.category}</small><h3>{item.title}</h3></div><span>↗</span></button>)}</div><p className="quiet-note">A home is a place to participate. Start with the space you already have.</p></section>}
        {c.id==='paths' && <section className="paths-layout"><div className="paths-intro"><span className="handwritten">there's no single route</span><h2>What draws<br/>them in?</h2><p>{data.description}</p><Art type={data.art}/></div><div className="path-stops">{data.items.map((item,i)=><button className={`path-stop stop-${i}`} key={item.id} onClick={()=>open(item)}><span className="path-node">{num(i)}</span><div><p className="eyebrow">{item.category}</p><h3>{item.title}</h3><p>{item.cue}</p><span className="text-link">Follow this curiosity ↗</span></div></button>)}</div></section>}
        {c.id==='stars' && <section className="constellation"><div className="orbit-ring ring-one"/><div className="orbit-ring ring-two"/><div className="constellation-center"><Art type={data.art}/><p className="handwritten">their growing world</p></div>{data.items.map((item,i)=><button key={item.id} className={`star-point star-${i}`} onClick={()=>open(item)}><span className="star-marker">✦</span><span className="eyebrow">{item.category}</span><h2>{item.title}</h2><p>{item.summary}</p><span className="text-link">Explore this connection ↗</span></button>)}</section>}
        {c.id==='paper' && <section className="paper-layout"><div className="paper-banner"><h2>Make space<br/>for a little<br/><em>discovery.</em></h2><Art type={age==='6-9'?'baby':'paper'}/><span className="paper-label">a little goes a long way</span></div><div className="paper-cards">{data.items.map((item,i)=><div className={`paper-card paper-card-${i}`} key={item.id}><span className="paper-number">{i+1}</span><p className="eyebrow">{item.category}</p><h3>{item.title}</h3><p>{item.summary}</p><button onClick={()=>open(item)} className="round-button" aria-label={`Explore ${item.title}`}>↗</button></div>)}</div></section>}
        {c.id==='rhythms' && <section className="rhythm-layout"><div className="rhythm-rail"><span className="handwritten">when you have a moment...</span><h2>Little moments.<br/>Lasting connection.</h2><div className="moment-buttons" role="group" aria-label="Choose a moment">{data.items.map((item,i)=><button aria-pressed={active===i} className={active===i?'active':''} key={item.id} onClick={()=>setActive(i)}><span>{['◌','◐','●'][i]}</span><div><small>{['Room to explore','Something to try','Time together'][i]}</small><strong>{item.title}</strong></div><b>→</b></button>)}</div><p className="quiet-note">No schedule to follow. Just an invitation when the moment feels right.</p></div><article className="moment-detail"><Art type={active===2?'home':data.art}/><div><p className="eyebrow">{data.items[active].category}</p><h3>{data.items[active].title}</h3><p>{data.items[active].summary}</p><button className="pill-button" onClick={()=>open(data.items[active])}>Bring this into your day ↗</button></div></article></section>}
        {c.id==='notebook' && <section className="notebook-layout"><div className="notebook-cover"><p className="eyebrow">FIELD NOTES / {stage.label}</p><h2>Before we offer,<br/><em>we observe.</em></h2><Art type={data.art}/><p className="handwritten">What are they showing you?</p></div><div className="notebook-pages"><div className="notebook-toggle" role="group" aria-label="Notebook view"><button aria-pressed={observing} onClick={()=>setObserving(true)}>You might notice</button><button aria-pressed={!observing} onClick={()=>setObserving(false)}>You could offer</button></div>{data.items.map((item,i)=><article className="notebook-entry" key={item.id}><span className="handwritten">{num(i)}</span><div><p className="eyebrow">{item.category}</p><h3>{observing?item.cue:item.title}</h3><p>{observing?'Let this be a starting point for watching, rather than something to tick off.':item.summary}</p><button className="text-link" onClick={()=>open(item)}>Read this field note ↗</button></div></article>)}</div></section>}
        {c.id==='ribbon' && <section className="ribbon-layout"><div className="ribbon-hero"><div><p className="eyebrow">HERE, IN THIS SEASON</p><h2>{data.headline}</h2><p>{data.description}</p><span className="handwritten">a different pace for every child</span></div><Art type={data.art}/><div className="ribbon-age-stamp">{age==='6-9'?'6–9':'18–24'}<span>months</span></div></div><div className="ribbon-ideas">{data.items.map((item,i)=><IdeaCard key={item.id} item={item} index={i} open={open}/>)}</div><div className="next-season"><span>Another season, another perspective</span><a className="text-link" href={link(c.id,age==='6-9'?'18-24':'6-9')}>Visit {age==='6-9'?'18–24':'6–9'} months →</a></div></section>}
        {c.id==='gallery' && <section className="gallery-layout"><div className="gallery-stage"><div className="gallery-label"><span>{num(active)} / 03</span><p>{data.items[active].category}</p></div><Art type={active===2?'home':data.art}/><div className="gallery-copy"><h2>{data.items[active].title}</h2><p>{data.items[active].summary}</p><button className="text-link" onClick={()=>open(data.items[active])}>Spend a moment with this idea ↗</button></div></div><div className="gallery-controls"><button className="round-button" aria-label="Previous idea" onClick={()=>setActive((active+2)%3)}>←</button><div>{data.items.map((item,i)=><button className={active===i?'active':''} key={item.id} aria-label={item.title} aria-pressed={active===i} onClick={()=>setActive(i)}><span>{num(i)}</span></button>)}</div><button className="round-button" aria-label="Next idea" onClick={()=>setActive((active+1)%3)}>→</button></div></section>}
        {c.id==='together' && <section className="together-layout"><div className="comic-heading"><h2>A little less telling.<br/><em>A little more showing.</em></h2><div className="comic-choices" role="group" aria-label="Choose an idea">{data.items.map((item,i)=><button key={item.id} aria-pressed={i===active} onClick={()=>setActive(i)}>{num(i)} · {item.title}</button>)}</div></div><div className="comic-strip">{data.items[active].frames.map((frame,i)=><article className={`comic-panel panel-${i}`} key={`${active}-${i}`}><span className="comic-step">{num(i)}</span><div className="comic-art"><Art type={age==='6-9'?'baby':active===2?'home':active===0?'toddler':'paper'} alt=""/></div><h3>{['Notice','Make an invitation','Leave room'][i]}</h3><p>{frame}</p></article>)}</div><div className="comic-bottom"><p>Small moments of respect add up.</p><button className="pill-button" onClick={()=>open(data.items[active])}>The idea behind the moment ↗</button></div></section>}
      </>}
      <div className="study-bottom"><p>Age is a starting point. Your child sets the pace.</p><details className="seed-note"><summary>Behind this direction <span>+</span></summary><p>{c.spark}</p><code>{c.seed}</code><div className="palette">{c.colors.map(color=><span key={color}><i style={{background:color}}/>{color}</span>)}</div></details></div>
      <nav className="study-pagination" aria-label="Compare directions"><a href={link(concepts[(index+9)%10].id,age)}>← {concepts[(index+9)%10].name}</a><span>{num(index)} / 10</span><a href={link(concepts[(index+1)%10].id,age)}>{concepts[(index+1)%10].name} →</a></nav>
    </main><Footer/>
    <IdeaDialog item={selected} close={()=>setSelected(null)}/>
  </div>;
}
function IdeaCard({item,index,open}) { return <button className="idea-card" onClick={()=>open(item)}><div className="idea-top"><span className="idea-number">{num(index)}</span><span className="eyebrow">{item.category}</span><span aria-hidden="true">↗</span></div><h3>{item.title}</h3><p>{item.summary}</p><span className="text-link">A small invitation →</span></button>; }
function IdeaDialog({item,close}) {
  const ref=useRef(null);
  useEffect(()=>{ if(item&&!ref.current.open)ref.current.showModal(); else if(!item&&ref.current.open)ref.current.close(); },[item]);
  return <dialog className="idea-dialog" ref={ref} onCancel={close} onClick={e=>{if(e.target===ref.current)close();}} aria-labelledby="idea-title"><div className="dialog-inner">{item&&<><button className="dialog-close" onClick={close} aria-label="Close idea">×</button><p className="eyebrow">{item.category} / A SMALL INVITATION</p><h2 id="idea-title">{item.title}</h2><p className="dialog-summary">{item.summary}</p><div className="notice-box"><span className="eyebrow">START BY NOTICING</span><p>{item.cue}</p></div><h3>Try it together</h3><ol>{item.steps.map(step=><li key={step}>{step}</li>)}</ol><div className="principle"><h3>What’s underneath</h3><p>{item.principle}</p></div><div className="source"><p className="eyebrow">BACK TO THE BOOK</p><p><cite>{item.source.book}</cite><br/>{item.source.section}<br/>{item.source.pages}</p><small>Paraphrased for this companion. Illustrations are original and illustrative.</small></div></>}</div></dialog>;
}

createRoot(document.getElementById('root')).render(<App/>);
