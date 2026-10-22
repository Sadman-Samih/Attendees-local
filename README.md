# Attendees

A no-login attendance tracker: a static front-end (HTML/CSS/JS) backed by Supabase. Anyone with the URL can mark attendance — click a day to mark **Present**, click again to uncheck.

## Features

- Monthly attendance grid (employees as rows, days as columns)
- Present count per employee
- Sticky name column for mobile horizontal scrolling
- Responsive layout (mobile breakpoint ≤ 600px)
- PWA: installable, works offline for static assets
- Attendance timestamps recorded on save

## Project structure

```
index.html          App shell
css/style.css       Production styles
js/supabase.js      Supabase client config (placeholders)
js/app.js           Grid logic, toggle, event delegation
sw.js               Service worker (cache-first static, network-first API)
manifest.json        PWA manifest
icon.svg            App icon
```

## Setup

1. Create a Supabase project.
2. Create the tables:

   - `employees(id, name)`
   - `attendance_logs(id, employee_id, date, status, created_at)`

   Recommended: add a unique constraint on `(employee_id, date)` in `attendance_logs`.
3. Put your project URL and anon key in `js/supabase.js`.
4. Serve the folder over HTTP(S) (service workers require http(s)), or deploy to Vercel/Netlify.

## Security notes

- The anon key is intentionally client-exposed. Keep RLS enabled and add policies, or restrict writes server-side, if you need real protection.
- Employee names are escaped before rendering; keep that in mind if you extend the UI.
- Pin and add SRI for the CDN-loaded Supabase SDK in production.

## License

See [LICENSE.md](LICENSE.md).