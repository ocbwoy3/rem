# REM
The PrikolsHub Killer.

REM is built and tested on Linux, I will not be adding Windows support.

## Get started

> [!TIP]
> You do not need to configure REM again, if you updated it. However, you should check for any new entries in the example configuration files, so you can fill them out. You will still need to run `post_update.sh`.

Copy the template `.env.template` to `.env` with `cp .env.example .env`, then configure it. Also do the same with `config_default.json -> config.json`.

You must enable Developer Mode in Discord's settings in order to be able to copy Channel IDs.

After all of that, run the provided `post_update.sh`, which will install all dependencies, configure the database, then build it.

```
sudo chmod +x post_update.sh
./post_update.sh
```
Add `run.sh` to PM2 or a systemd service.

## Hosting REM

As previously mentioned in [Get Started](#get-started), you can run REM using PM2 or with a systemd service.

For an easier setup process, run `npm run setup`.

However if you plan on hosting it, I recommend you to use cloudflared to allow external connections (If you don't have port forwarding). You must also specify `RootURL` in `config.json`, however DO NOT append `/xrpc` to the URL, so it's something like `https://df721e.us-east.host.ocbwoy3.dev`

## How to setup Handles

