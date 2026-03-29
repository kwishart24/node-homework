# Node.js Fundamentals

## What is Node.js?

A runtime environment for JavaScript that runs locally on any machine instead of the browser. This way, JavaScript can run without a sandbox and can do anything that you can do in other programming languages with the security protections of the operating system. It's used to build back-end services also called API's.

## How does Node.js differ from running JavaScript in the browser?

1. Console.log statements: Node console.logs to the terminal whereas browser JS console.logs to the web browser dev tools console

2. Differences in syntax: browser JS uses ES Modules (ESM) standard syntax (import/export) whereas Node uses CommonJS (CJS) style (require/exports). Node can still read ESM standard syntax, but the file would need to end in .mjs or add “type”: “module” in your package.js. Browser JS can use CJS in browsers with bundlers (WebPack, Rollup, etc.) or via dynamic import().

3. APIs: browser JS mostly interacts with the DOM or Web Platform APIs in the form of things like Cookies that don’t exist in Node. Node interacts with APIs via modules in the form of things like filesystems that don’s exist in the browser

4. Environment: Node allows you to control the environment through choosing the version of Node to use or other variables of the environment. Whereas browser JS is at the mercy of whatever browser (ie Chrome, Edge) is being used

5. Global Objects: Browser JS interacts with the DOM through the global objects of the web browser like document and window that don’t exist in Node. Node uses global objects like global, process, \_dirname, \_filename, and module.

6. Web Server Sockets: Node can open web server sockets which can’t be done with browser-side JS because it’s forbidden by the browser’s sandbox protections and because the API’s don’t exist there.

7. Safely store secrets: Node can safely store secrets because it runs on a server and not the browser. Server-side code can still be leaked only if the server is compromised

## What is the V8 engine, and how does Node use it?

Node uses V8 to translate the JS code given to it by the coder and executes it in the CPU. Meanwhile, Node provides all the things that V8 lacks to execute the code such as built-in modules and event loops.

## What are some key use cases for Node.js?

1. protoyping in agile development
2. Building superfast and highly scalable services (large enterprise apps like Netflix and PayPal)

## Explain the difference between CommonJS and ES Modules. Give a code example of each.

The big difference between CJS and ESM is that CJS loads everything synchronously at once, pausing the running of code while Node loads that module and runs top-level code. While with ESM you as the coder request what you need and ESM provides just what you've asked for. This means that you can use a top-level await with ESM, but CSJ requires callbacks, Promises, or wrapping to get the same async behavior.

Use CJS for small or simple scripts. Use ESM for tree-shaking or top-level await.

**CommonJS (default in Node.js):**

```js
const { register, logoff } = require("../controllers/userController");
```

**ES Modules (supported in modern Node.js):**

```js
import { useState, useEffect } from "react";
```
