#!/usr/bin/env node
/* Builds site/ from content/ - no dependencies.
   Run: node build.mjs
   Edit the text in content/*.json and content/legal/*.html, then rebuild. */
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = dirname(fileURLToPath(import.meta.url));
const read = (p) => readFileSync(join(root, p), 'utf8');
const json = (p) => JSON.parse(read(p));
const write = (p, s) => { const f = join(root, p); mkdirSync(dirname(f), { recursive: true }); writeFileSync(f, s); console.log('wrote', p); };

const ARTIFACT = process.env.ARTIFACT === '1'; // claude.ai artifact preview build (inlined CSS/JS, no skeleton on the main page, no map embed)
const OUT = ARTIFACT ? 'artifact' : 'site';
const SITE_URL = process.env.SITE_URL || 'https://www.cumbernauldlaw.co.uk';
const FORM_ENDPOINT = process.env.FORM_ENDPOINT || ''; // e.g. https://formspree.io/f/xxxxxxx
const YEAR = new Date().getFullYear();

const css = read('site/assets/site.css');
const js = read('site/assets/site.js');
const firm = json('content/firm.json');
const people = json('content/people.json');
const services = json('content/services.json');

const nb = (s) => String(s).replace(/ /g, '\u00a0');
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const initials = (name) => name.split(/\s+/).filter(Boolean).map((w) => w[0]).filter((c) => /[A-Z]/.test(c)).slice(0, 2).join('');

/* ---------- shared pieces ---------- */
const svgDefs = `<svg class="svg-defs" aria-hidden="true" focusable="false">
  <defs>
    <linearGradient id="gPlum" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#69265a"/><stop offset="1" stop-color="#b96cab"/></linearGradient>
    <linearGradient id="gSilver" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#bfbabe"/><stop offset="1" stop-color="#ebe9eb"/></linearGradient>
  </defs>
</svg>`;
const markSvg = (cls = 'brand__mark') => `<svg class="${cls}" viewBox="0 0 100 100" aria-hidden="true" focusable="false">
  <rect class="t-plum" x="0" y="0" width="47" height="47" rx="2" fill="url(#gPlum)"/>
  <rect class="t-silver" x="53" y="0" width="47" height="47" rx="2" fill="url(#gSilver)"/>
  <rect class="t-silver" x="0" y="53" width="47" height="47" rx="2" fill="url(#gSilver)"/>
  <rect class="t-plum" x="53" y="53" width="47" height="47" rx="2" fill="url(#gPlum)"/>
</svg>`;

const brand = (href) => `<a class="brand" href="${href}" aria-label="The Cumbernauld Law Practice, home">
  ${markSvg()}
  <span class="brand__name">The Cumbernauld <span>Law Practice</span></span>
</a>`;

const icon = {
  phone: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2z"/></svg>',
  pin: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 21s7-6.2 7-11.5A7 7 0 0 0 5 9.5C5 14.8 12 21 12 21z"/><circle cx="12" cy="9.5" r="2.5"/></svg>',
  clock: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>',
  scale: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 3v18M4 21h16M6 7h12M6 7l-3 7a3 3 0 0 0 6 0L6 7zm12 0l-3 7a3 3 0 0 0 6 0l-3-7z"/></svg>',
  plus: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M12 5v14M5 12h14"/></svg>',
  arrow: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6"/></svg>',
  join: '<svg class="merger__join" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M12 5v14M5 12h14"/></svg>',
  facebook: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M13.5 22v-8h2.7l.4-3.2h-3.1V8.8c0-.9.3-1.6 1.6-1.6h1.7V4.3c-.3 0-1.3-.1-2.5-.1-2.5 0-4.1 1.5-4.1 4.2v2.4H7.4V14h2.8v8h3.3z"/></svg>',
  linkedin: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6.5 8.5H3V21h3.5V8.5zM4.75 3a2 2 0 1 0 0 4 2 2 0 0 0 0-4zM21 13.3c0-3.6-1.9-5.2-4.5-5.2-2 0-2.9 1.1-3.4 1.9V8.5H9.6V21h3.5v-6.6c0-1.8.3-3.4 2.5-3.4 2.1 0 2.1 2 2.1 3.5V21H21v-7.7z"/></svg>',
  x: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M17.5 3h3.1l-6.8 7.8L22 21h-6.2l-4.9-6.4L5.3 21H2.2l7.3-8.3L2 3h6.4l4.4 5.8L17.5 3zm-1.1 16.2h1.7L7.1 4.7H5.3l11.1 14.5z"/></svg>'
};

const homeHref = (mode) => mode === 'static' ? (ARTIFACT ? '../index.html' : '../') : '';
const headerHtml = (mode) => `${svgDefs}
<a class="skip-link" href="#main">Skip to content</a>
<header class="site-header${mode === 'static' ? ' is-static' : ''}">
  <div class="container">
    ${brand(mode === 'static' ? (ARTIFACT ? '../index.html#top' : '../') : '#top')}
    <nav class="site-nav" aria-label="Main">
      <ul class="site-nav__links">
        <li><a href="${homeHref(mode)}#about">About</a></li>
        <li><a href="${homeHref(mode)}#services">What we do</a></li>
        <li><a href="${homeHref(mode)}#people">People</a></li>
        <li><a href="${homeHref(mode)}#contact">Contact</a></li>
        <li class="site-nav__indicator" aria-hidden="true"></li>
      </ul>
      <a class="btn btn--small btn--phone" href="${firm.phoneHref}">${icon.phone}<span>${nb(esc(firm.phone))}</span></a>
    </nav>
    <button class="menu-toggle" type="button" aria-expanded="false" aria-controls="mobile-menu" aria-label="Open menu"><span></span><span></span><span></span></button>
  </div>
</header>
<nav class="mobile-menu" id="mobile-menu" aria-label="Menu">
  <ul>
    <li><a href="${homeHref(mode)}#about">About</a></li>
    <li><a href="${homeHref(mode)}#services">What we do</a></li>
    <li><a href="${homeHref(mode)}#people">People</a></li>
    <li><a href="${homeHref(mode)}#contact">Contact</a></li>
  </ul>
  <div class="mobile-menu__meta">
    <a class="btn btn--light" href="${firm.phoneHref}">${icon.phone}<span>Call ${nb(esc(firm.phone))}</span></a>
    <p>${esc(firm.address.line1)}, ${esc(firm.address.town)} ${esc(firm.address.postcode)}</p>
    <p>${esc(firm.hours[0].days)}, ${esc(firm.hours[0].times)}</p>
  </div>
</nav>`;

const legalPages = [
  { slug: 'privacy', title: 'Privacy notice' },
  { slug: 'cookies', title: 'Cookies' },
  { slug: 'disclaimer', title: 'Disclaimer' },
  { slug: 'accessibility', title: 'Accessibility' },
  { slug: 'anti-money-laundering', title: 'Anti-money laundering' }
];

const footerHtml = (prefix) => `
<footer class="site-footer">
  <div class="container">
    <div class="footer__grid">
      <div class="footer__brand">
        ${brand((ARTIFACT && prefix ? prefix + 'index.html' : prefix) + '#top')}
        <p>${esc(firm.tagline)}</p>
        <p>A full general practice legal service, including civil and criminal legal aid where it applies.</p>
        <div class="social">
          <a href="${firm.social.facebook}" aria-label="Facebook" rel="noopener">${icon.facebook}</a>
          <a href="${firm.social.linkedin}" aria-label="LinkedIn" rel="noopener">${icon.linkedin}</a>
          <a href="${firm.social.twitter}" aria-label="X, formerly Twitter" rel="noopener">${icon.x}</a>
        </div>
      </div>
      <div class="footer__col">
        <h2>Find us</h2>
        <address>${esc(firm.address.line1)}<br>${esc(firm.address.town)}<br>${esc(firm.address.postcode)}</address>
        <ul>
          <li><a href="${firm.phoneHref}">${nb(esc(firm.phone))}</a></li>
          <li>Fax ${nb(esc(firm.fax))}</li>
          <li>${esc(firm.hours[0].days)}<br>${esc(firm.hours[0].times)}</li>
        </ul>
      </div>
      <div class="footer__col">
        <h2>Policies</h2>
        <ul>
          ${legalPages.map((p) => `<li><a href="${prefix}legal/${p.slug}.html">${esc(p.title)}</a></li>`).join('\n          ')}
        </ul>
      </div>
    </div>
    <div class="footer__bottom">
      <p>&copy; 2017-${YEAR} The Cumbernauld Law Practice. All rights reserved.</p>
      <p class="footer__badge"><img src="${prefix}assets/img/law-society-member.png" alt="" width="96" height="56" loading="lazy"><span>Members of the Law Society of Scotland</span></p>
    </div>
  </div>
</footer>
${ARTIFACT ? `<script>${js}</script>` : `<script src="${prefix}assets/site.js" defer></script>`}`;

const fontsLink = `<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Jost:wght@300;400;500;600&family=Source+Serif+4:ital,wght@0,400;0,600;1,400&display=swap">`;
const artifactHead = ({ title }) => `<title>${esc(title)}</title>
<meta name="claude:viewport-fit-sides" content="cover">
${fontsLink}
<style>${css}</style>`;
const headHtml = ({ title, description, prefix, canonical, jsonld, noindex }) => `<!doctype html>
<html lang="en-GB">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(title)}</title>
<meta name="description" content="${esc(description)}">
<link rel="canonical" href="${canonical}">
<meta name="theme-color" content="#69265a">${noindex ? '\n<meta name="robots" content="noindex">' : ''}
<meta property="og:type" content="website">
<meta property="og:site_name" content="The Cumbernauld Law Practice">
<meta property="og:title" content="${esc(title)}">
<meta property="og:description" content="${esc(description)}">
<meta property="og:image" content="${SITE_URL}/assets/img/og-image.png">
<meta property="og:url" content="${canonical}">
<meta name="twitter:card" content="summary_large_image">
<link rel="icon" href="${prefix}assets/img/favicon.ico" sizes="any">
<link rel="icon" href="${prefix}assets/img/favicon-32.png" type="image/png">
<link rel="apple-touch-icon" href="${prefix}assets/img/apple-touch-icon.png">
${fontsLink}
${ARTIFACT ? `<style>${css}</style>` : `<link rel="stylesheet" href="${prefix}assets/site.css">`}
${jsonld ? `<script type="application/ld+json">${JSON.stringify(jsonld)}</script>` : ''}
</head>`;

/* ---------- home page ---------- */
const jsonld = {
  '@context': 'https://schema.org',
  '@type': 'LegalService',
  name: firm.name,
  url: SITE_URL + '/',
  telephone: '+44 1236 731911',
  faxNumber: '+44 1236 730038',
  address: { '@type': 'PostalAddress', streetAddress: firm.address.line1, addressLocality: firm.address.town, postalCode: firm.address.postcode, addressCountry: 'GB' },
  geo: { '@type': 'GeoCoordinates', latitude: firm.mapLatLng[0], longitude: firm.mapLatLng[1] },
  openingHoursSpecification: [
    { '@type': 'OpeningHoursSpecification', dayOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'], opens: '09:00', closes: '13:00' },
    { '@type': 'OpeningHoursSpecification', dayOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'], opens: '14:00', closes: '17:00' }
  ],
  areaServed: ['Cumbernauld', ...firm.alsoServes],
  sameAs: Object.values(firm.social),
  foundingDate: '2017-05-01',
  memberOf: { '@type': 'Organization', name: 'Law Society of Scotland' }
};

const serviceTiles = services.map((s, i) => {
  const tone = (i === 0 || i === 3) ? 'plum' : 'silver';
  return `<button class="service-tile service-tile--${tone}" type="button" id="svc-${s.slug}" data-panel-source="#tpl-${s.slug}" aria-controls="services-panel">
    <span class="service-tile__cue">${icon.plus}</span>
    <span class="service-tile__title">${esc(s.title)}</span>
    <span class="service-tile__summary">${esc(s.summary)}</span>
  </button>`;
}).join('\n');

const serviceTemplates = services.map((s) => `<template id="tpl-${s.slug}">
  <div>
    <h3>${esc(s.title)}</h3>
    <p>${esc(s.intro)}</p>
  </div>
  <ul class="check-list" aria-label="${esc(s.title)}: what is included">
    ${s.items.map((it) => `<li>${esc(it)}</li>`).join('\n    ')}
  </ul>
  <div class="panel__actions">
    <a class="btn" href="${firm.phoneHref}">${icon.phone}<span>Call ${nb(esc(firm.phone))}</span></a>
    <a class="btn btn--ghost" href="#contact">Send an enquiry</a>
    <button class="btn btn--ghost btn--small panel__close" type="button">Close</button>
  </div>
</template>`).join('\n');

const personCard = (p, i) => {
  const tones = ['', ' person__mono--silver', ' person__mono--magenta', ' person__mono--silver'];
  const mono = 'person__mono' + tones[i % tones.length];
  if (p.photo) {
    return `<button class="person" type="button" id="person-${p.slug}" data-panel-source="#tpl-${p.slug}" aria-controls="people-panel">
    <span class="person__photo"><picture><source srcset="assets/img/${p.photo}.webp" type="image/webp"><img src="assets/img/${p.photo}.jpg" alt="" width="720" height="720" loading="lazy"></picture></span>
    <span class="person__cue" aria-hidden="true">${icon.plus}</span>
    <span class="person__body">
      <span class="person__name">${esc(p.name)}</span>
      <span class="person__role">${esc(p.role)}</span>
    </span>
  </button>`;
  }
  return `<button class="person person--compact" type="button" id="person-${p.slug}" data-panel-source="#tpl-${p.slug}" aria-controls="people-panel">
    <span class="${mono}" aria-hidden="true">${esc(initials(p.name))}</span>
    <span class="person__body">
      <span class="person__name">${esc(p.name)}</span>
      <span class="person__role">${esc(p.role)}</span>
    </span>
    <span class="person__cue" aria-hidden="true">${icon.plus}</span>
  </button>`;
};

const personTemplate = (p) => {
  const mono = p.group === 'lawyers' ? 'person__mono' : 'person__mono person__mono--silver';
  const visual = p.photo
    ? `<picture><source srcset="assets/img/${p.photo}.webp" type="image/webp"><img src="assets/img/${p.photo}.jpg" alt="${esc(p.name)}" width="200" height="200"></picture>`
    : `<div class="${mono}" aria-hidden="true">${esc(initials(p.name))}</div>`;
  return `<template id="tpl-${p.slug}">
  ${visual}
  <div>
    <div class="person-detail__head"><h3>${esc(p.name)}</h3><p>${esc(p.role)}</p></div>
    ${p.bio.map((b) => `<p>${esc(b)}</p>`).join('\n    ')}
    ${p.qualifications.length ? `<ul class="person-detail__quals" aria-label="Qualifications">${p.qualifications.map((q) => `<li>${esc(q)}</li>`).join('')}</ul>` : ''}
    <div class="panel__actions person-detail__actions">
      <a class="btn btn--small" href="#contact">Get in touch ${icon.arrow}</a>
      <button class="btn btn--ghost btn--small panel__close" type="button">Close</button>
    </div>
  </div>
</template>`;
};

const lawyers = people.filter((p) => p.group === 'lawyers');
const support = people.filter((p) => p.group === 'support');

const homeMeta = {
  title: ARTIFACT ? 'The Cumbernauld Law Practice' : 'The Cumbernauld Law Practice - Solicitors in Cumbernauld',
  description: 'Solicitors in Cumbernauld for family law, court and criminal work, conveyancing, wills, executries and powers of attorney. Civil and criminal legal aid available. 30 Ettrick Walk, Cumbernauld. Call 01236 731911.',
  prefix: '',
  canonical: SITE_URL + '/',
  jsonld
};
const home = `${ARTIFACT ? artifactHead(homeMeta) : headHtml(homeMeta) + '\n<body>'}
<div id="top"></div>
${headerHtml('home')}

<main id="main">
  <section class="hero" aria-labelledby="hero-title">
    <canvas class="hero__field" aria-hidden="true"></canvas>
    <div class="hero__scrim" aria-hidden="true"></div>
    <div class="container">
      <div class="hero__inner on-dark">
        <p class="hero__kicker">${esc(firm.tagline)}</p>
        <h1 id="hero-title">Solicitors who know Cumbernauld.</h1>
        <p class="lead">Family law, court work, house moves, wills and powers of attorney, from a local practice formed by two long-standing Cumbernauld firms. Civil and criminal legal aid where you qualify.</p>
        <div class="hero__actions">
          <a class="btn btn--light" href="${firm.phoneHref}">${icon.phone}<span>Call ${nb(esc(firm.phone))}</span></a>
          <a class="btn btn--outline-light" href="#contact">Send an enquiry ${icon.arrow}</a>
        </div>
        <p class="hero__note"><strong>${esc(firm.address.line1)}, Cumbernauld town centre.</strong> ${esc(firm.hours[0].days)}, 9 to 1 and 2 to 5.</p>
      </div>
    </div>
  </section>

  <section class="section section--paper" id="about" aria-labelledby="about-title">
    <div class="container">
      <div class="section__head">
        <h2 id="about-title">Two long-standing Cumbernauld firms, one practice.</h2>
        <p class="lead">Fourteen people in one office on Ettrick Walk, so the person who answers the phone will know your matter.</p>
      </div>
      <div class="about__grid">
        <div class="about__story">
          <p>${esc(firm.about)}</p>
          <p>Six solicitors and trainees work alongside a support team of eight. We handle most matters in-house, and where a case needs a specialist we refer it to another firm at no cost to you.</p>
          <p>Whether it is a divorce, a court date, a house purchase or a will, you will deal with people who live and work here and who know how things are done locally. We are members of the Law Society of Scotland, and we also act for clients in ${esc(firm.alsoServes.slice(0, -1).join(', '))} and ${esc(firm.alsoServes.slice(-1)[0])}.</p>
        </div>
        <div>
          <div class="merge-mark" role="img" aria-label="Barrowman and Partners and Ian S Smart and Company became The Cumbernauld Law Practice on 1 May 2017">
            <div class="merge-mark__tile merge-mark__tile--plum"><small>Long-standing Cumbernauld practice</small><strong>Barrowman &amp; Partners</strong></div>
            <div class="merge-mark__tile merge-mark__tile--silver"><small>Cumbernauld, from 1991</small><strong>Ian S Smart &amp; Company</strong></div>
            <div class="merge-mark__tile merge-mark__tile--silver"><small>Joined on</small><strong>1 May 2017</strong></div>
            <div class="merge-mark__tile merge-mark__tile--plum merge-mark__tile--result"><small>Today</small><strong>The Cumbernauld Law Practice</strong></div>
          </div>
          <p class="merge-mark__caption">The four tiles of the firm's mark: two practices, one date, one name.</p>
        </div>
      </div>
    </div>
  </section>

  <section class="section section--plum" id="services" aria-labelledby="services-title">
    <div class="container">
      <div class="section__head">
        <h2 id="services-title">What we do.</h2>
        <p class="lead">Most of what a household needs, under one roof. Choose an area to see what is included.</p>
      </div>
      <div class="services__grid">
        ${serviceTiles}
        <div class="panel" id="services-panel" aria-live="polite">
          <div><div class="panel__inner"><div class="panel__card"></div></div></div>
        </div>
      </div>
      <p class="services__aid"><strong>Legal aid:</strong> civil and criminal legal aid is available through the practice where you qualify. We will tell you early on whether it is likely to apply.</p>
      ${serviceTemplates}
    </div>
  </section>

  <section class="section section--silver" id="people" aria-labelledby="people-title">
    <div class="container">
      <div class="section__head">
        <h2 id="people-title">The people you will deal with.</h2>
        <p class="lead">Select anyone to read what they do and who they work with.</p>
      </div>
      <div class="tabs" role="tablist" aria-label="Team">
        <button class="tab" role="tab" id="tab-lawyers" aria-selected="true" aria-controls="grid-lawyers" tabindex="0">Our solicitors <small>${lawyers.length}</small></button>
        <button class="tab" role="tab" id="tab-support" aria-selected="false" aria-controls="grid-support" tabindex="-1">Our support team <small>${support.length}</small></button>
      </div>
      <div class="people__grid" id="grid-lawyers" role="tabpanel" aria-labelledby="tab-lawyers">
        ${lawyers.map(personCard).join('\n')}
      </div>
      <div class="people__grid" id="grid-support" role="tabpanel" aria-labelledby="tab-support" hidden>
        ${support.map(personCard).join('\n')}
      </div>
      <div class="panel people__panel" id="people-panel" aria-live="polite">
        <div><div class="panel__inner"><div class="panel__card"></div></div></div>
      </div>
      ${people.map(personTemplate).join('\n')}
    </div>
  </section>

  <section class="section section--deep on-dark" id="contact" aria-labelledby="contact-title">
    <div class="container">
      <div class="section__head">
        <h2 id="contact-title">Talk to us.</h2>
        <p class="lead">Call, visit, or send a short enquiry. We are open ${esc(firm.hours[0].days)}.</p>
      </div>
      <div class="contact__grid">
        <div class="contact__info">
          <a class="contact__phone" href="${firm.phoneHref}">${nb(esc(firm.phone))}</a>
          <dl class="details">
            <div>
              <dt>Open</dt>
              <dd class="details__big">${esc(firm.hours[0].days)}, ${esc(firm.hours[0].times)}</dd>
            </div>
            <div>
              <dt>Visit</dt>
              <dd><address>${esc(firm.address.line1)}, ${esc(firm.address.town)}, ${esc(firm.address.postcode)}</address><small>${esc(firm.address.note)}</small></dd>
            </div>
          </dl>
          <div class="map">
            ${ARTIFACT ? '' : `<div class="map__placeholder">
              <p>The map is from Google and loads only when you ask for it.</p>
              <div><button class="btn btn--light btn--small" type="button" data-map-load data-map-query="${esc(firm.mapQuery)}">Show map</button></div>
            </div>`}
            <div class="map__links">
              <a href="https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(firm.mapQuery)}" rel="noopener">Open in Google Maps</a>
              <a href="https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(firm.mapQuery)}" rel="noopener">Get directions</a>
            </div>
          </div>
        </div>
        <form class="form" id="enquiry-form" method="post" action="${FORM_ENDPOINT || '#'}" data-endpoint="${FORM_ENDPOINT}" novalidate>
          <h3>Send an enquiry</h3>
          <p>Tell us briefly what you need and we will get back to you during office hours.</p>
          <div class="form__row form__row--2">
            <div class="field"><label for="first-name">First name</label><input id="first-name" name="first_name" autocomplete="given-name" required><p class="field__error" id="err-first-name">Please enter your first name.</p></div>
            <div class="field"><label for="last-name">Last name</label><input id="last-name" name="last_name" autocomplete="family-name" required><p class="field__error" id="err-last-name">Please enter your last name.</p></div>
          </div>
          <div class="form__row form__row--2">
            <div class="field"><label for="email">Email</label><input id="email" name="email" type="email" autocomplete="email" required><p class="field__error" id="err-email">Please enter an email address we can reply to.</p></div>
            <div class="field"><label for="phone">Phone <small>(optional)</small></label><input id="phone" name="phone" type="tel" autocomplete="tel"></div>
          </div>
          <div class="form__row">
            <div class="field">
              <label for="message">How can we help?</label>
              <textarea id="message" name="message" required aria-describedby="message-help" data-describedby="message-help"></textarea>
              <p class="field__count">0 of 100 words</p>
              <p class="field__error" id="err-message" data-required="Please tell us briefly how we can help.">Please tell us briefly how we can help.</p>
              <p class="field__help" id="message-help">${esc(firm.formConfidentialityNote.split('. ')[0])}. ${esc(firm.formHelp[0])}</p>
              <details class="field__more">
                <summary>Why we ask this</summary>
                <p>${esc(firm.formConfidentialityNote.split('. ').slice(1).join('. '))} ${esc(firm.formHelp[1])}</p>
              </details>
            </div>
          </div>
          <div class="form__row">
            <fieldset class="fieldset">
              <legend>Best time to contact you <small>(optional)</small></legend>
              <div class="choices">
                <label class="choice"><input type="checkbox" name="best_time" value="Morning"><span>Morning</span></label>
                <label class="choice"><input type="checkbox" name="best_time" value="Afternoon"><span>Afternoon</span></label>
                <label class="choice"><input type="checkbox" name="best_time" value="Evening"><span>Evening</span></label>
              </div>
            </fieldset>
          </div>
          <div class="form__foot">
            <button class="btn" type="submit">Send enquiry</button>
            <p>We use what you send only to reply to you. See our <a href="legal/privacy.html">privacy notice</a>.</p>
          </div>
          <div class="form__status" tabindex="-1" aria-live="polite"></div>
          <noscript><p class="form__noscript">This form needs JavaScript. Please call ${nb(esc(firm.phone))} instead.</p></noscript>
        </form>
      </div>
    </div>
  </section>
</main>

<div class="call-bar" aria-hidden="true">
  <a class="btn" href="${firm.phoneHref}" tabindex="-1">${icon.phone}<span>Call ${nb(esc(firm.phone))}</span></a>
</div>

${footerHtml('')}
${ARTIFACT ? '' : '</body>\n</html>'}
`;

write(OUT + '/index.html', home);

/* ---------- legal pages ---------- */
for (const page of legalPages) {
  const body = read(`content/legal/${page.slug}.html`).trim();
  const html = `${headHtml({
    title: `${page.title} - The Cumbernauld Law Practice`,
    description: `${page.title} for The Cumbernauld Law Practice, solicitors in Cumbernauld.`,
    prefix: '../',
    canonical: `${SITE_URL}/legal/${page.slug}.html`
  })}
<body>
${headerHtml('static')}
<main id="main" class="section legal">
  <div class="container legal__grid">
    <nav class="legal__index" aria-label="Policies">
      <p class="legal__index-title">Policies</p>
      <ul>
        ${legalPages.map((p) => `<li><a href="${p.slug}.html"${p.slug === page.slug ? ' aria-current="page"' : ''}>${esc(p.title)}</a></li>`).join('\n        ')}
      </ul>
    </nav>
    <article class="legal__body">
      ${body}
      ${page.slug === 'privacy' ? '' : `<p class="legal__updated">Last reviewed ${new Date().toLocaleDateString('en-GB', { month: 'long', year: 'numeric' })}.</p>`}
    </article>
  </div>
</main>
${footerHtml('../')}
</body>
</html>
`;
  write(`${OUT}/legal/${page.slug}.html`, html);
}

/* ---------- robots and sitemap ---------- */
if (!ARTIFACT) {
write('site/robots.txt', `User-agent: *\nAllow: /\nSitemap: ${SITE_URL}/sitemap.xml\n`);
write('site/sitemap.xml', `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url><loc>${SITE_URL}/</loc></url>
${legalPages.map((p) => `  <url><loc>${SITE_URL}/legal/${p.slug}.html</loc></url>`).join('\n')}
</urlset>
`);
write('site/404.html', `${headHtml({ title: 'Page not found - The Cumbernauld Law Practice', description: 'Page not found.', prefix: '/', canonical: SITE_URL + '/404.html', noindex: true })}
<body>
${headerHtml('static').replace(/\.\.\//g, '/')}
<main id="main" class="section legal"><div class="container"><article class="legal__body"><h1>That page is not here.</h1><p>The address may have changed. <a href="/">Go to the home page</a> or call ${nb(esc(firm.phone))}.</p></article></div></main>
${footerHtml('/')}
</body>
</html>
`);
}
