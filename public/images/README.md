# Where to put your project photos

The site renders real photos as soon as you add them. Until then it shows a
neutral placeholder. No broken images, no stock photos.

## Project screenshots

Drop your files into the folder matching the project slug:

```
public/images/projects/gmm-mining/
public/images/projects/pharmacy-pos/
public/images/projects/hotel-operations/
public/images/projects/transport-manifests/
public/images/projects/restaurant-pos/
```

Then open `lib/data/projects.ts` and set the paths on that project:

```ts
{
  slug: "gmm-mining",
  // ...
  coverImage: "/images/projects/gmm-mining/cover.jpg",
  gallery: [
    "/images/projects/gmm-mining/screen-1.jpg",
    "/images/projects/gmm-mining/screen-2.jpg",
  ],
}
```

Paths start with `/images/...` and not `public/`. That is how Next.js serves them.

**Cover images** appear on the project card and the detail page hero.
Landscape works best, roughly 4:3 or wider, at least 1200px on the long edge.

**Gallery images** appear as a two-column grid on the detail page. 16:9 works
best. Leave `gallery` off entirely and the section simply won't render.

## Founder photo

Drop a headshot at `public/images/founder.jpg`, then set `photo` in
`lib/data/founder.ts`:

```ts
photo: "/images/founder.jpg",
```

Square crop. Until you set it, the About page shows an initials monogram.

## A note on screenshots

If your systems show real client data, blur or replace it before publishing.
Names, prices, patient records, and stock levels belong to the client, not to
you. Mocked-up demo data usually photographs better anyway.
