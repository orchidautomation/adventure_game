# Working Improvements Backlog

A curated list of future enhancements to consider. These are not scheduled yet, but are scoped so we can pick them up quickly when ready.

## Performance & Rendering
- Adaptive performance scaler (target 60 fps): dynamically adjust internal render scale up/down based on recent frame times.
- OffscreenCanvas + Worker (where supported): move rendering off the main thread to reduce input/UI jank.
- Optional draw-detail tiers (reduce effects when under load; restore when smooth).
- Frame pacing smoothing: decouple update from draw with a fixed-timestep loop and interpolation.

## Controls & Input
- Gamepad API support (Bluetooth/USB controllers) with remapping UI.
- Customizable touch layout: drag to reposition buttons; save per-device.
- Sensitivity curves for joystick; dead-zone setting; invert Y (if vertical control added later).
- Hold-to-jump option and jump buffering/coyote time to improve feel on touch.

## Mobile UX
- Portrait-optimized layout with larger touch targets and stacked HUD.
- Optional bigger UI preset for accessibility; high-contrast mode and colorblind-friendly palette.
- Haptics tuning presets (subtle/medium/strong) with per-action control (jump/shoot/hit).
- In-game tooltips for powerups; short onboarding carousel for first run.

## Audio
- Volume sliders (SFX/Music) with persistence; mute toggle in top bar.
- Lightweight music loop with dynamic layers based on intensity.
- Reduce iOS audio latency where possible; robust unlock on first interaction.

## PWA & Delivery
- Proper app icons and splash screens for iOS/Android (maskable icons).
- Background sync for queued leaderboard submissions when offline.
- Fine-tuned service worker strategies per asset type; auto-update prompt when a new version is available.

## Leaderboard & Social
- Daily/weekly leaderboards; personal best highlights.
- Share run summary via Web Share API; copy link fallback.
- Friend filter (local list) and anonymized initials-only mode.

## Telemetry (Privacy-Respecting)
- Local-only performance stats (fps histogram, device hints) for QA; opt-in export.
- Crash/exception capture to localStorage with simple export button.

## Dev & QA
- Minimal smoke tests for input, state transitions, and scoring.
- Performance harness script to benchmark level scenes and report fps across scales.

---
Notes
- Current improvements added: touch-first start, UI overlays, wake lock, haptics, dynamic joystick, tap-to-jump zone, render resolution scaling, and anti-stale service worker for HTML/API.
- Prioritize Adaptive Performance first if we need smoother play on mid/low devices.
