# The Cumbernauld Law Practice - website

A new site for [The Cumbernauld Law Practice](https://www.cumbernauldlaw.co.uk), built from the firm's own mark: plum, magenta and silver tiles. Static HTML, CSS and vanilla JavaScript. No frameworks, no cookies, no analytics.

## What is in here

```
site/               The built website. This is what gets published.
  index.html        Home: hero, about, what we do, people, contact
  legal/            Privacy, cookies, disclaimer, accessibility, anti-money laundering
  404.html          Not-found page
  assets/site.css   Styles (design tokens are at the top of the file)
  assets/site.js    Behaviour: hero tile field, navigation, panels, tabs, map, form
  assets/img/       Portraits, Law Society badge, favicons, share image
content/            The words. Edit these, then rebuild.
  firm.json         Address, phone, hours, social links, form wording
  people.json       Everyone in the firm: name, role, focus, bio, photo
  services.json     The four practice areas
  legal/*.html      The policy page bodies
  editorial-notes.md  Every change made to the published wording, and what the firm should confirm
build.mjs           Turns content/ into site/. Node, no dependencies.
render.yaml         Render deployment blueprint
tools/shoot.py      Screenshots the site for review (Playwright)
```

## Editing the site

1. Change the text in `content/`.
2. Run `node build.mjs` (Node 18 or later).
3. Open `site/index.html` in a browser to check it.

Portraits go in `site/assets/img/` as square `slug.jpg` and `slug.webp` (720 x 720 works well), and the person's `"photo"` in `people.json` is set to that slug. People without a photo get a monogram tile automatically.

## Deploying on Render

The site is a Render **static site**. Render needs a Git repository (GitHub, GitLab or Bitbucket) to deploy from.

**Option A: one click.** Push this folder to a public repository, then open

```
https://render.com/deploy?repo=https://github.com/<owner>/<repo>
```

Render reads `render.yaml`, builds with `node build.mjs` and publishes `site/`.

**Option B: by hand.** In the Render dashboard choose New, then Static Site, connect the repository, and set Build Command to `node build.mjs` and Publish Directory to `site`.

Two environment variables are optional and can be set in the Render dashboard:

- `SITE_URL` - the public address, used for canonical links, the sitemap and the share image (defaults to `https://www.cumbernauldlaw.co.uk`).
- `FORM_ENDPOINT` - see below.

When the firm is happy, point `cumbernauldlaw.com` and `www.cumbernauldlaw.co.uk` at Render under the site's Custom Domains; Render issues the TLS certificate.

## Making the enquiry form send

The form is wired but has nowhere to send to until an endpoint is set. Until then it validates, then tells the visitor to phone. To switch it on:

1. Create a form at [formspree.io](https://formspree.io) (or any service that accepts a POST and returns JSON), pointing at the firm's inbox.
2. Set `FORM_ENDPOINT` to the form's URL (for example `https://formspree.io/f/abcdwxyz`) in Render, or run `FORM_ENDPOINT=... node build.mjs` locally.

No other code change is needed.

## Decisions worth knowing

- The office photograph from the old site is not used.
- There is no cookie banner because the site sets no cookies. The Google Map on the contact page loads only when the visitor presses "Show map".
- The old site's COVID-19 closure notice, its three unlinked orphan pages and its generic cookie policy were dropped.
- The privacy notice is a draft for the firm to review; it is marked as such on the page.
- The firm should confirm the items listed in `content/editorial-notes.md`: the office number (30 or 28-30 Ettrick Walk), the opening hours (the live site shows 9 to 1 and 2 to 5), the spelling of two surnames, the DX number, and an email address for the site.
