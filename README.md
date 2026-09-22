# Retro95 Portfolio

A self-contained local edition of the Retro95 portfolio, including the BIOS
startup sequence, animated password screen, desktop, project pages, images,
fonts, audio, and supporting runtime assets.

## Run locally

Double-click `start-local.command`, or run:

```sh
python3 -m http.server 4173
```

Then open <http://127.0.0.1:4173/>.

The password fills automatically. Press Enter or click Confirm to open the
desktop.

## Admin portal

Open `/admin/` to edit profile details, wallpaper, social links, projects, and
music. The editor is password-protected and stores published content in Upstash
Redis through Vercel Functions.

In Vercel, install the Upstash Redis Marketplace integration and add:

- `ADMIN_PASSWORD`: the password used to sign in to `/admin/`
- `ADMIN_SECRET`: a long random value used to sign session cookies
- `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN`: added automatically
  when the Upstash integration is connected. The older `KV_REST_API_URL` and
  `KV_REST_API_TOKEN` names are supported too.

Redeploy after adding the variables.

## Deploy to Vercel

Import this GitHub repository into Vercel and keep the Framework Preset set to
`Other`. The site is static and does not need a build command or environment
variables. Use the repository root as the Root Directory.
