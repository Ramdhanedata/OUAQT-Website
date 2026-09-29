# SEO: what the code does, and what only you can do

## In the code

- **Titles and descriptions** carry the words owners search for, with the
  place: "logiciel de caisse … en Mauritanie", "برنامج كاشير … في موريتانيا".
  They live in `lib/i18n/dictionaries/*.ts` (`meta`) and `lib/i18n/packs/*.ts`
  (one per trade). The target list is `lib/seo/keywords.ts`.
- **Every page** gets its own canonical, hreflang and share preview through
  `lib/seo/page-metadata.ts`.
- **Structured data**: `Organization` (Nouakchott, Mauritania), `WebSite` (so
  Google shows "OUAQT" and not "ouaqt.com"), `SoftwareApplication`, `FAQPage`,
  and `BreadcrumbList` on the trade pages.
- **Favicon**: `app/favicon.ico` (16/32/48) and `app/icon.png` (192×192).
  Google only shows a favicon whose size is a multiple of 48 px, so keep it
  that way if the logo changes.
- `sitemap.xml`, `robots.txt` and `manifest.webmanifest` are generated.

## Only you can do these (they matter more than any tag)

1. **Google Search Console** (search.google.com/search-console): add the
   domain `ouaqt.com`, verify it (DNS record, or set `GOOGLE_SITE_VERIFICATION`
   in Vercel), submit `https://www.ouaqt.com/sitemap.xml`, then use *URL
   inspection → Request indexing* on the home page and each trade page. This
   is also what makes Google refetch the new favicon and site name; expect a
   few days to a few weeks.
2. **Google Business Profile** (business.google.com): create "OUAQT" in
   Nouakchott, category "Software company", with the website, WhatsApp number,
   hours and the logo. For searches made in Mauritania, this is the single
   biggest lever.
3. **Bing Webmaster Tools**: import from Search Console, or set
   `BING_SITE_VERIFICATION`.
4. **Links from elsewhere**: LinkedIn and Facebook pages linking to
   www.ouaqt.com, Mauritanian business directories, partners, clients' sites,
   local press. Each one counts.
5. **Reviews** on the Business Profile from real clients.
6. **Keep publishing**: a new case study or trade page targets a new search.
