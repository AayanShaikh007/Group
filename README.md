# Group Together

A replacement for the Group prototype: a private Android gathering app with group invites, persistent membership, shared meeting details, chat, a member map, and opt-in foreground location sharing. No subscriptions or accounts.

## Requirements

- Node.js 24 (the server uses built-in SQLite)
- npm
- Android phone with Expo Go compatible with Expo SDK 57, or an Android SDK/emulator for a development build. Compatible Expo Go versions are available at https://expo.dev/go.

## Run it

From this folder:

```sh
npm ci
npm run server
```

In another terminal:

```sh
npm start
```

On an Android emulator, the default server address is `http://10.0.2.2:8787`. On a physical phone, use your computer's LAN address, for example `http://192.168.1.20:8787`. Both devices must be on the same Wi-Fi, and the computer must allow inbound access to port 8787. Enter the address under **Connection settings** before creating or joining. Do not use `localhost` on a phone. Alternatively copy `.env.example` to `.env` and set `EXPO_PUBLIC_API_URL` before starting Expo.

Open the Expo QR code on your phone. Create a group, share its code, and join from a second phone connected to the same server. Messages update within about three seconds while the app is active. The web preview (`npm run web`) can test the group and chat flows alongside a phone; its map buttons open Google Maps.

## Android build

`npm run android` generates and runs a native development build when Java and the Android SDK are installed. A standalone Android build's embedded Google map requires your own Google Maps Android API key and the Maps SDK for Android enabled. Set the `GOOGLE_MAPS_ANDROID_API_KEY` environment variable before generating that build; `app.config.js` supplies it to the map plugin. Restrict the key to your Android package and signing certificate. Expo Go provides the map configuration for its own binary. See the [official Expo map setup](https://docs.expo.dev/versions/latest/sdk/map-view/). Use an HTTPS server for standalone builds; the HTTP local-network setup is intended for Expo Go.

For an APK using Expo's build service, install EAS CLI, sign in to your own Expo account, run `eas build:configure`, and then `eas build --platform android --profile preview`. A preview profile is supplied in `eas.json`. This has not been run or published by Codex.

## Server and data

The server stores data at `server/data/group.sqlite`; keep and back up this directory. `PORT` changes its default port 8787; `DATA_DIR` changes the storage directory. One server instance serves all groups. It must stay running for separate devices to communicate. No existing Firebase project or credentials are used.

Membership uses random bearer tokens, stored in Android SecureStore (browser local storage for web previews). The server stores only token hashes and derives every group request from the authenticated member. Invite codes grant admission to a group, so share them with intended members. Members can have the same display name; their identities remain distinct. Leaving invalidates the membership. Creator rights transfer to the next member. The last member leaving deletes the group and its messages.

Location is off by default. It requires permission and a deliberate tap. Updates stop when the app goes into the background and the app requests deletion of the last location. If deletion cannot reach the server, that location stops being returned after two minutes. Sharing does not automatically resume. The API returns the latest 200 messages; older messages remain in the database. Offline actions are not queued.

## Public use

The supplied setup works on a trusted local network. Before distributing to people on other networks, host the server behind HTTPS and set `EXPO_PUBLIC_API_URL` to that public endpoint. An HTTPS web preview also requires an HTTPS API endpoint. The built-in limiter uses connection IPs, so configure rate limiting at your reverse proxy as well. This first version does not include push notifications, account recovery, moderation, background tracking, or invite rotation.

## Verify

```sh
npm test
npm run typecheck
npx expo export --platform android
```

Server integration tests cover two-member communication, group isolation, validation, creator permissions, location expiry/removal, leaving, rate limiting, and persistence across restart. Device checks still needed: permission denial, location sharing/background stop, map rendering, keyboard behavior, and two physical phones. A successful JavaScript export does not establish those hardware behaviors.

### Verification in this workspace

- All 3 server integration tests passed.
- TypeScript checks passed.
- Android Hermes bytecode and web bundles exported successfully on Expo SDK 57.
- Browser visual inspection was blocked by the local-preview browser permission check.
- No Android SDK, Java runtime, or device bridge was available here; an APK has not been built or tested.
- Dependency audit reports 23 findings in the Expo/React Native dependency tree (16 high, 7 moderate). The dependency-free Node server is separate from that tree. The audit's suggested major-version downgrades were not applied. Review upstream fixes before a public release.
