# personal-site

Etan Berkowitz's personal site, "Arcade Floor" design. Plain HTML, CSS and JS: no framework, no build step, no npm.

```
index.html     markup
style.css      layout + static styles
main.js        all behavior (reel, lever, floaters, coins, name draw-in)
assets/        icons (line-art SVGs) and pixel cursors
.nojekyll      tells GitHub Pages to serve files as-is
```

External requests: Libre Franklin from Google Fonts, and the contact form posting to [Web3Forms](https://web3forms.com).

## contact form

A tiny "message · 10 coins" tab hangs off the bottom of the cabinet. It lights up once you've caught 10 coins, and sending costs 10 (`COST` in `main.js`). If you're short, it tells you to go catch some. The coin gate is a joke, not spam protection.

The tab opens a native `<dialog>` with a form that posts to Web3Forms, which forwards it to Etan's inbox. No address appears in the page. The `access_key` in `index.html` is public by design; it can only send to the account owner. Spam is handled by a hidden `botcheck` honeypot plus Web3Forms' own filtering. If spam gets through, turn on hCaptcha in the Web3Forms dashboard (free) and add their widget to the form.

## old site

`old/` is a frozen copy of the previous allberknobite.com, taken as-is from the live site. The only changes are relative asset paths (so it works from a subfolder) and a small "old ○ new" switch at the bottom of `old/index.html` that links back. On the new site, catching 20 coins (`SWITCH_AT` in `main.js`) makes a "??? · 20 coins" tab fold down under the cabinet. Feeding it 20 coins turns it into the "new ○ old" switch. Nothing is remembered, so it has to be earned again on every page load.

## search + sharing

- `og.png` (1200×630) is the link-preview image for Slack, iMessage, X, LinkedIn, etc. It's a static picture, so if you change the look a lot, swap it for a new screenshot at the same size.
- `favicon.svg` is the coin icon. `favicon.ico` and `apple-touch-icon.png` are PNG renders of it for older browsers, crawlers and iPhone home screens.
- `old/` has `noindex`, so Google only shows the new site.

## edit

- **words in the reel:** `WORDS` at the top of `main.js` (word, payline icon, cursor, background pattern)
- **speech bubbles:** `SAYS` in `main.js`
- **ticker text:** the two identical `<span>`s in `index.html`
- **floater count / bubble + jackpot frequency:** `FLOATERS`, `EVERY`, `JACKPOT` in `main.js`

## run locally

`main.js` is an ES module, so open it through a local server rather than double-clicking the file:

```bash
python3 -m http.server 8000
```

then visit http://localhost:8000.

## deploy (GitHub Pages)

1. Push this folder to a GitHub repo (name it `<username>.github.io` to serve at that root URL).
2. Repo → Settings → Pages → Source: **Deploy from a branch**, branch `main`, folder `/ (root)`.
3. For a custom domain, add it under Settings → Pages; GitHub creates the `CNAME` file for you.

## accessibility

- With `prefers-reduced-motion`, everything goes calm: no ticker, bursts or shakes, and floaters freeze (but can still be caught).
- The reel is a real `<button>`; ← / → spin from anywhere; new words are announced through a polite live region.
