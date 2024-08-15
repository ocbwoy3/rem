# REM
The PrikolsHub Killer.

**REM is built and tested on Linux, support for Windows is not guaranteed.**

### How to get started

> [!TIP]
> You do not need to configure REM again, if you updated it. However, you should check for any new entries in the example configuration files, so you can fill them out. You will still need to run `post_update.sh` in order to update the database, install new dependencies and build REM.
Configure all settings in `config.json`, then copy the template `.env.template` to `.env` with `cp .env.example .env`, then configure it.

After all of that, run the provided `post_update.sh`, which will install all dependencies, configure the database, then build it.

```
sudo chmod +x post_update.sh
./post_update.sh
```

### Now what?

Add `run.sh` to PM2 or a systemd service.