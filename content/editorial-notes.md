# Editorial notes

Source: `/home/claude/research/content.md` (sections 3, 4, 5, 6, 9 and 11.6). Nothing was fetched from the live site.

## Changes made to published wording

### People (`people.json`)

- Names re-cased from the published headings: David hOGG to David Hogg, jessica small to Jessica Small, CAROLINE MCGRATH to Caroline McGrath, JENNIFER ADAM to Jennifer Adam, CAROL MCDONALD to Carol McDonald, ELISE MCQUEEN to Elise McQueen, marc smith to Marc Smith, katelyn lundy to Katelyn Lundy, Zara mcqueen to Zara McQueen.
- SUZANNE MaCDONALD set as Suzanne MacDonald. Carol is published as "McDonald" and Suzanne as "MaCDONALD", so the firm should confirm Suzanne’s spelling.
- Lisa’s surname standardised as O’Neil (the heading form, with the first letter capitalised and a curly apostrophe). "O’Neill" in Carol’s bio and "O’Neil" in David’s bio now read "O’Neil". The slug is `lisa-oneil`.
- Typos fixed: "prinicipal" to "principal" (Ian), "alongisde" to "alongside" (Carol).
- "(!)" removed from Jennifer’s bio. A comma was added after "Ian S Smart & Co" so the sentence still reads correctly ("Having started ... Ian S Smart & Co, she obtained ...").
- "client’s" changed to "clients" (Caroline, plural).
- Yvonne’s bio: "Ms Gardner" changed to "Miss Gardner" so the bio is consistent.
- "our" removed before a full name where it read awkwardly (six places): "supporting our Sharon Gardner" (Caroline), "supports our Lisa O’Neil" and "alongside our Sharon Gardner" (David), "assists our Sharon Gardner" (Jessica), "alongside our Lisa O’Neill" (Carol), "alongside our Caroline McGrath" (Zara). "our" is kept before departments ("our court department") and in "our former senior partner", "our principal point of contact" and similar.
- Straight apostrophes in Lisa’s and Ian’s bios changed to curly apostrophes.
- Bios split into one to three short paragraphs (stored as arrays of strings). No sentence was reworded. All dates are exactly as published, including the 2026 dates.
- `role`, `focus` and `qualifications` are new short fields derived strictly from each bio. They are not published wording. Where no qualification is stated, `qualifications` is an empty array. Sharon’s role line follows the suggested "Partner and family law solicitor"; her bio also says she is overall managing partner.
- `photo` is set only for the seven people with portraits; the other seven are `null`.

### Services (`services.json`)

- Titles set as instructed. Published headings kept in `publishedTitle`: "Family law", "Litigation (including crime)", "Private Client Work" and "Everything else!".
- "Redundancy Agreements" changed to "Redundancy agreements" (sentence case). All other items are as published, with curly apostrophe in "Children’s panel referrals".
- A colon was added after "This includes" in the court and criminal intro, to match the other three intros, which all end in a colon.
- `summary` lines are new text (14 words or fewer each), written from the items. The family law line is the example supplied in the brief.

### Firm (`firm.json`)

- `formed` is "1 May 2017"; `about` keeps the published "1st May 2017" because it is verbatim.
- Telephone changed from "01236-731911" to "01236 731911" and fax from "01236-730038" to "01236 730038". `phoneHref` is `tel:+441236731911`; the live site’s link, `tel:+01236731911`, is not a valid international number.
- Opening hours "9:00 am - 1:00pm, 2:00pm - 5:00 pm" normalised to "9:00 am to 1:00 pm and 2:00 pm to 5:00 pm".
- Address note: the brackets were removed. Wording is otherwise as published.
- `formIntro` (two sentences), `formHelp` (the two word-limit sentences) and `formConfidentialityNote` (the confidentiality text, both sentences) are all verbatim. The brief did not say which sentences each key should hold, so the split is my reading; `formIntro` is an extra key added so no published form wording is lost.

### Legal pages (`legal/`)

- `accessibility.html`: browser list, "IE 8+", "iPhone model 4" and "Android 4.4" removed and replaced with a statement that the site works in current Chrome, Edge, Firefox and Safari on desktop and mobile. A closing "Difficulty using this website" section gives the telephone number. The Limitations, Navigation and Readability paragraphs are verbatim.
- `anti-money-laundering.html`: "on going" to "ongoing"; "thereafter monitored" to "thereafter monitors clients". Otherwise verbatim.
- `disclaimer.html`: "reliability suitability" to "reliability, suitability". Otherwise verbatim.
- `cookies.html`: the published template wording is not reused. It is replaced with a new short policy: no site cookies, no analytics, Google Map loaded only on request, how to manage cookies, and the telephone number for questions.
- `privacy.html`: new plain-English draft for the practice to review (about 260 words). It names no registration number and no data protection officer.

### Not carried over

- The stored COVID-19 announcement (not displayed on the live site).
- The orphan pages /home-alt (Squarespace demo content), /alt-home and /contact-1.
- The cookie consent bar text ("an enhances site experience") and its Accept Cookies button. The new cookie statement says the site itself sets no cookies.
- The stale footer line "Copyright © 2017-2020". A current copyright year needs to be chosen by the firm.
- The email address amrit@cumbernauldlaw.co.uk from the old cookie policy.

## Inconsistencies and points for the firm to confirm

- **Two addresses.** Homepage and /contact give "30 Ettrick Walk"; the orphan /contact-1 gives "28-30 Ettrick Walk". The live address (30) is used.
- **Two sets of opening hours.** Homepage and /contact: Monday to Friday, 9:00 am to 1:00 pm and 2:00 pm to 5:00 pm. /contact-1: Monday to Friday, 9:00am to 5:00pm. The live hours (with the lunch closure) are used.
- **Lisa’s surname.** Published three ways: "O’neil" (heading), "O’Neill" (Carol’s bio) and "O’Neil" (David’s bio). O’Neil is used throughout; Lisa should confirm.
- **"30 years" and "80 years".** The homepage meta description says "over 30 years"; the alt text on the orphan /alt-home says "OVER 80 YEARS". The firm was formed on 1 May 2017 by combining two practices, and neither figure can be checked from the site. Neither is used.
- **DX number.** DX 500520 appears only on /contact-1. It is not in `firm.json`. The firm should confirm whether it is current.
- **No email address.** None is published on the homepage or contact page. The only address is an individual’s email in the old cookie policy, for someone not listed in the People section. The firm should say whether a general enquiries address should be published.
- **Cookie policy.** The published policy says the site uses Google Analytics, but no analytics tag is in the markup. It also contains template wording ("As we sell products"). The new policy says the site sets no cookies and uses no analytics; this must be rechecked once the new site is built, including how the enquiry form is submitted and whether any fonts or scripts load from third parties.
- **2026 dates in bios.** David: "graduated from the University of Strathclyde in 2026 and officially joined as our Trainee Solicitor in June of that year". Jessica: joined as a Legal Assistant in April 2026 and graduated in May 2026. Kept exactly as published; the firm should confirm they are right.
- **Unnamed portraits.** The portraits for Suzanne MacDonald and Yvonne Stewart are unnamed image files, matched to the names by their position in the HTML (content.md section 5). Confirm before use.
- **Ian S Smart’s bio.** He is described as "recently retired" and also as acting as a "non-practising" legal consultant. His former firm is "Ian S Smart & Co." in his bio and "Ian S Smart & Company" elsewhere. Left as published.
- **Referrals "at no cost".** "A network of referrals to other specialist firms, all at no cost to the client" could be read as the referral being free or the other firms’ work being free. The firm may want to clarify.
- **Section name.** The Private client intro refers to "our litigation work", but the Litigation section is now titled "Court and criminal work". Left as published.
- **Commercial conveyancing.** It is listed under Private client in the published services. Kept in that order.
- **Accessibility statement.** The "no known limitations" sentence is the published wording. It describes the old site, so it should be rechecked against the new site before publication.
- **Privacy notice draft.** The 12-month retention period for enquiries not taken forward is a placeholder figure for the firm to confirm. The firm may need to add its ICO registration details if it has them.
- **Gaps in the source.** No Law Society of Scotland firm number, complaints procedure, professional indemnity insurance statement, VAT or company number is published. The footer lists "Terms & Conditions" but no such page exists; no Terms text was written.

## Left as published (possible further edits, not applied)

Edits were limited to the list in the brief. These look like errors but were left unchanged:

- Lisa’s bio: "domestic conveyance and executry work" (probably "domestic conveyancing").
- David’s bio and Elise’s bio: "although, deals with ..." and "although, predominantly contributes ..." (stray comma after "although").
- Accessibility: "‘Tab+Shift’" (the usual key combination is Shift+Tab).
- Disclaimer: "does not necessarily imply a recommendation or endorse the views expressed within them" (grammar).
- Homepage text: "Cumbernauld based" (probably "Cumbernauld-based").

## Later changes (design review)

- Service titles on the site are "Family law", "Court and crime", "Homes, wills and executries" and "Specialist referrals". The published headings are kept in `publishedTitle`.
- The "Everything else!" intro was rewritten in plain words: "A small firm cannot cover every area of the law, so we keep a network of specialist firms we can refer you to, at no cost to you." The meaning is unchanged.
- The focus tags were dropped from the people cards because they repeated the role line.
