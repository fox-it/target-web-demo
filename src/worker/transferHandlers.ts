import * as Comlink from 'comlink'
import type { PyIterator } from 'pyodide/ffi'

const pyproxyAttrsSymbol = Symbol('pyproxy.attrs')

export const pyIteratorHandler: Comlink.TransferHandler<PyIterator, MessagePort> = {
    canHandle: (obj): obj is any => {
        return (
            obj !== null &&
            typeof obj === 'object' &&
            !Array.isArray(obj) &&
            Symbol.iterator in obj &&
            pyproxyAttrsSymbol in obj
        )
    },
    serialize: (obj) => {
        const { port1, port2 } = new MessageChannel()
        Comlink.expose(obj, port1)
        return [port2, [port2]]
    },
    deserialize: (port) => {
        port.start()
        return new Proxy(Comlink.wrap(port, {}) as object, {
            get: (target: any, key) => {
                if (key === Symbol.asyncIterator) {
                    return async function* () {
                        while (true) {
                            const nextObj = await target.next()
                            if (nextObj.done) {
                                return nextObj.value
                            }
                            yield nextObj.value
                        }
                    }
                } else return target[key]
            },
            has: (target, prop) => {
                if (prop === Symbol.asyncIterator) return true
                else return prop in target
            },
        })
    },
}
