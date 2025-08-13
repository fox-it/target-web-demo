import type { PyIterable } from 'pyodide/ffi'
import type { ProxyMarked, Remote } from 'comlink'
import type { Shell, Target } from '../worker/worker'

export type RemoteTarget = Remote<Target & ProxyMarked>
export type RemoteShell = Remote<Shell & ProxyMarked>
export type RemotePyIterator<T> = PyIterable & ProxyMarked & AsyncIterator<T>
