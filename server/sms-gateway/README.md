# SMS Gateway — operational README

This is the dev / on-prem self-hosted [`capcom6/sms-gateway`](https://github.com/capcom6/android-sms-gateway) used by **[M01-F09 Phone-First Authentication](../../docs/MODULES.md#m01-f09--phone-first-authentication)** for signup OTPs, password-recovery OTPs, and phone-change OTPs.

> **Dev shortcut — you probably don't need this stack on your laptop.** If you just want to exercise the full M01-F09 flow locally, leave `Sms:Provider` unset (or set `Sms:Provider=console`). In `Development` the API uses [`LogOnlySmsSender`](../FuelFlow.Infrastructure/Services/LogOnlySmsSender.cs), which prints OTPs to the API console — no Firebase, no Android device, no Docker stack needed. The setup below is only required when an environment actually has a working gateway, and is currently superseded for production by the Play-Protect-driven follow-up tracked at [M10-F03-R04](../../docs/MODULES.md#m10-f03--notification-channels).

The gateway has two parts:

1. **Server** — runs in Docker on your machine / VM (this folder).
2. **Android relay** — the [SMS Gateway for Android](https://github.com/capcom6/android-sms-gateway) app installed on a real phone with a Pakistani SIM. The server pushes outgoing messages to the phone via Firebase Cloud Messaging (FCM); the phone actually sends the SMS.

So you need: a docker host, a phone, a SIM with SMS credit, and a Firebase project.

## One-time setup

### 1. Create a Firebase project + service-account credentials

The gateway pushes to the relay device via FCM. Follow the upstream docs:

- <https://sms-gate.app/getting-started/private-server/> → "Firebase setup"

End result: a `fcm-credentials.json` file downloaded from the Firebase console.

Save that file at **`server/sms-gateway/fcm-credentials.json`** — it is mounted into the gateway container by [`server/docker-compose.yml`](../docker-compose.yml) and is git-ignored.

### 2. Create the gateway config

```powershell
cd server/sms-gateway
copy config.example.yml config.yml
```

Edit `config.yml`:

- Replace `private_token` with a random secret (e.g. `openssl rand -hex 32`). The Android app will need this token when you pair it.
- Confirm the MariaDB credentials match [`server/docker-compose.yml`](../docker-compose.yml).

`config.yml` is git-ignored.

### 3. Bring up the stack

```powershell
cd server
docker compose up -d
docker compose logs -f sms-gateway   # wait for "server started" / port 3000 listening
```

The gateway listens at **<http://localhost:3000>** (published to `127.0.0.1` only).

### 4. Install the relay app on your Android phone

- Side-load the APK from <https://github.com/capcom6/android-sms-gateway/releases>.
- In the app, switch to **Private server** mode and point it at `http://<your-dev-host>:3000` with the `private_token` from step 2.
- Pair the device. The gateway UI will list the device as registered.

### 5. Configure the FuelFlow API to talk to the gateway

```powershell
cd server/FuelFlow.Api
dotnet user-secrets set "Sms:Gateway:BaseUrl" "http://localhost:3000"
dotnet user-secrets set "Sms:Gateway:Username" "<device-username>"
dotnet user-secrets set "Sms:Gateway:Password" "<device-password>"
dotnet user-secrets set "Otp:HashPepper" "<32+ char random string>"
```

`Username` / `Password` are the HTTP Basic credentials the gateway shows for each paired device. See [`docs/ENV-MAP.md`](../../docs/ENV-MAP.md) for the full list of `Sms:Gateway:*` and `Otp:*` keys.

### 6. Smoke test

Once the gateway is up, the Android device is paired, and user-secrets are set, you can test the gateway directly:

```bash
curl -u "<device-username>:<device-password>" \
     -H "Content-Type: application/json" \
     -d '{"textMessage":{"text":"FuelFlow gateway test"},"phoneNumbers":["+923001234567"]}' \
     http://localhost:3000/3rdparty/v1/message
```

The phone with the paired relay app should send the SMS within a few seconds. Then trigger the same path via the FuelFlow registration flow (Phase 3+) to confirm the API-to-gateway wiring.

## Notes

- **Production**: do not publish port 3000 publicly; put the gateway behind a reverse proxy with TLS.
- **Cost control**: organization-specific SMS providers are introduced post-onboarding by [M10-F03-R02](../../docs/MODULES.md#m10-f03--notification-channels). This gateway is the platform-default for pre-organization signup ([M01-F09-R10](../../docs/MODULES.md#m01-f09--phone-first-authentication)).
- **Rate limiting**: per-phone and per-IP limits are enforced inside FuelFlow ([M01-F09-R12](../../docs/MODULES.md#m01-f09--phone-first-authentication)), not in the gateway.
- **FCM credential rotation**: drop a new `fcm-credentials.json` in place and `docker compose restart sms-gateway`.
- **`config.yml` and `fcm-credentials.json` are git-ignored** by [`.gitignore`](../../.gitignore). Never commit either.
