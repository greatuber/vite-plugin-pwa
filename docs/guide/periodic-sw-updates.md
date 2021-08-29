---
title: Periodic Service Worker Updates | Guide
---

# Periodic Service Worker Updates

As explained in [Manual Updates](https://developers.google.com/web/fundamentals/primers/service-workers/lifecycle#manual_updates) <outbound-link />
entry on `The Service Worker Lifecycle`, you can use this code to configure periodic service worker updates on your 
application on your `main.ts` or `main.js`:

<details>
  <summary><strong>main.ts / main.js</strong> code</summary>

```ts
import { registerSW } from 'virtual:pwa-register'

const intervalMS = 60 * 60 * 1000

const updateSW = registerSW({
  onRegistered(r) {
    r && setInterval(() => {
      r.update()
    }, intervalMS)
  }
})
```
</details>

The interval must be in milliseconds, in the example above it is configured to check the service worker every hour.

<HeuristicWorkboxWindow />
