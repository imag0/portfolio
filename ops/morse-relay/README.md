# MorseChat VPS relay

This is the storage and cross-device communication backend for `/morse`.

The browser calls the portfolio API route at `/api/morse`. That Next route reads
`MORSE_RELAY_INTERNAL_URL`; if unset it uses:

```text
https://api.echlon.dev:20208/morse-api
```

## Install on the VPS

```bash
mkdir -p /opt/morse-relay /var/lib/morse-relay
cp morse_relay.py /opt/morse-relay/morse_relay.py
cp morse-relay.service /etc/systemd/system/morse-relay.service
systemctl daemon-reload
systemctl enable --now morse-relay
curl http://127.0.0.1:20210/health
```

## Reverse proxy

The server already exposes HTTPS on `api.echlon.dev:20208`. Add a
`/morse-api/` location that proxies to `http://127.0.0.1:20210`.

If the VPS uses a different public path, set this in the portfolio deployment:

```text
MORSE_RELAY_INTERNAL_URL=https://your-host.example:PORT/morse-api
```
