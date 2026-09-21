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

## Deploy to Vercel

Import this GitHub repository into Vercel and keep the Framework Preset set to
`Other`. The site is static and does not need a build command or environment
variables. Use the repository root as the Root Directory.
