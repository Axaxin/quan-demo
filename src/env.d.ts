/// <reference types="astro/client" />
/// <reference types="@astrojs/cloudflare" />

interface Env {
  QUAN_STORE: import('@cloudflare/workers-types').KVNamespace;
}

type Runtime = import('@astrojs/cloudflare').Runtime<Env>;

declare namespace App {
  interface Locals extends Runtime {}
}
