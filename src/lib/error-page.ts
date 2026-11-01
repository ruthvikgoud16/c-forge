export function renderErrorPage(): string {
  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <title>CForge did not load</title>
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <style>
      body { font: 15px/1.5 ui-sans-serif, system-ui, -apple-system, sans-serif; background: #f4eee6; color: #1c1612; display: grid; place-items: center; min-height: 100vh; margin: 0; padding: 1.5rem; }
      .card { max-width: 28rem; width: 100%; text-align: center; padding: 2rem; border-radius: 2rem; background: rgba(255,255,255,.55); border: 1px solid rgba(255,255,255,.7); box-shadow: 0 18px 40px rgba(80,40,10,.08); backdrop-filter: blur(16px); }
      .eyebrow { letter-spacing: .16em; text-transform: uppercase; font-size: 11px; color: #b45309; margin: 0 0 .5rem; }
      h1 { font-size: 1.75rem; margin: 0 0 .75rem; }
      p { color: #5c534c; margin: 0 0 1.5rem; }
      .actions { display: flex; gap: .75rem; justify-content: center; flex-wrap: wrap; }
      a, button { padding: .6rem 1.1rem; border-radius: 999px; font: inherit; cursor: pointer; text-decoration: none; border: 1px solid transparent; }
      .primary { background: linear-gradient(135deg,#c26a2d,#d4532a); color: #fff; }
      .secondary { background: rgba(255,255,255,.7); color: #1c1612; border-color: rgba(194,106,45,.25); }
    </style>
  </head>
  <body>
    <div class="card">
      <p class="eyebrow">CForge</p>
      <h1>This page did not load</h1>
      <p>The original API or this screen failed. No catalog, progress, or faculty counts were invented.</p>
      <div class="actions">
        <button class="primary" onclick="location.reload()">Try again</button>
        <a class="secondary" href="/">Go home</a>
      </div>
    </div>
  </body>
</html>`;
}
