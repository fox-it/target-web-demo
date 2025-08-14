import * as Comlink from 'comlink'
import { pyIteratorHandler } from './transferHandlers'
import type { Api } from './worker'

Comlink.transferHandlers.set('pyIterator', pyIteratorHandler)
export default Comlink.wrap<Api>(
    new Worker(new URL('../worker/worker.ts', import.meta.url), {
        type: 'module',
    }),
)
