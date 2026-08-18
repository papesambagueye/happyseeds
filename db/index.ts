import 'server-only'
import { cache } from 'react'
import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'

function emptyThenable<T>(value: T) {
  return Promise.resolve(value)
}

function emptyQueryBuilder() {
  const resolved = () => emptyThenable([])
  const builder: Record<string, any> = {
    from: () => builder,
    where: () => builder,
    orderBy: () => resolved(),
    limit: () => resolved(),
    innerJoin: () => builder,
    leftJoin: () => builder,
    values: () => emptyThenable(undefined),
    then: (onFulfilled?: any, onRejected?: any) => resolved().then(onFulfilled, onRejected),
    catch: (onRejected?: any) => resolved().catch(onRejected),
    finally: (onFinally?: any) => resolved().finally(onFinally),
  }
  return builder
}

function emptyDb() {
  const api: Record<string, any> = {
    select: () => emptyQueryBuilder(),
    insert: () => ({ values: () => emptyThenable(undefined) }),
    update: () => ({ set: () => ({ where: () => emptyThenable(undefined) }) }),
    delete: () => ({ where: () => emptyThenable(undefined) }),
  }
  return api
}

// Create one postgres client PER REQUEST, scoped via React's `cache()`.
//
// Do NOT cache the client on `globalThis`: Cloudflare Workers (workerd) forbids
// reusing an I/O object (the DB socket) created in one request from another
// request. A cross-request cached client makes concurrent requests on a freshly
// spun-up isolate await a connection promise that belongs to a different
// request's context, which the runtime flags as "hung" and returns as
// Error 1101 (it self-heals once the connection is established, hence the
// intermittent failures right after a deploy or on isolate cold-start).
//
// `cache()` scopes the client to a single request: reused within the request
// (so the lazy proxy below does not open a new connection on every property
// access), and discarded between requests (no illegal cross-request reuse).
const getClient = cache(() => {
  if (!process.env.DATABASE_URL) {
    return null
  }
  return postgres(process.env.DATABASE_URL, {
    prepare: false,
    max: 1,
    idle_timeout: 20,
  })
})

function getDb() {
  const client = getClient()
  return client ? drizzle(client) : emptyDb()
}

// Lazy proxy: the DB connection is only established at runtime (not at build /
// module-eval time) and is resolved per request through `getClient()`.
export const db = new Proxy({} as ReturnType<typeof getDb>, {
  get(_target, prop: string | symbol) {
    return (getDb() as unknown as Record<string | symbol, unknown>)[prop]
  },
})
