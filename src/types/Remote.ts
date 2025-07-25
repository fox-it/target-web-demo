import type { ProxyMarked, Remote } from 'comlink'
import type { Shell, Target } from '../worker/worker'
export type RemoteTarget = Remote<Target & ProxyMarked>
export type RemoteShell = Remote<Shell & ProxyMarked>
