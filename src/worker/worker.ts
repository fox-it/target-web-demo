/// <reference lib="webworker" />
console.log('Worker started')
import * as Comlink from 'comlink'
import { loadPyodide, type PyodideAPI } from 'pyodide'
import type { PyCallable, PyProxy } from 'pyodide/ffi'
import { pyIteratorHandler, targetHandler, targetMarker } from './transferHandlers'

// I suck at JavaScript/TypeScript, so just run most of the code in Python
const PLUGIN_FINDER_CODE = `
from pyodide.ffi import to_js

from dissect.target import plugin


def _record_functions(p):
    result = set()

    if p is None:
        return result

    namespace = f"{p.__namespace__}." if p.__namespace__ else ""
    for fname in p.__functions__:
        try:
            klass = p.__class__ if isinstance(p, plugin.Plugin) else p
            if getattr(klass, fname).__output__ == "record":
                result.add(f"{namespace}{fname}")
        except Exception:
            pass

    return result


def find_plugins(target):
    result = _record_functions(target._os_plugin)
    for desc in plugin.find_functions("*", target=target, compatibility=True, ignore_load_errors=True)[0]:
        if desc.output == "record" and not any(kwargs.get("required", False) for _, kwargs in desc.args):
            result.add(desc.name)

    return to_js(sorted(list(result)))


find_plugins
`

const PLUGIN_EXECUTOR_CODE = `
import base64
import traceback
from datetime import datetime

from js import Date, Object
from pyodide.ffi import to_js

from flow.record.base import Record, RecordDescriptor
from flow.record import fieldtypes

from dissect.target.tools.utils import execute_function_on_target
from dissect.target.plugin import find_functions


class JsRecordPacker:
    def __init__(self):
        self.descriptors = {}

    def register(self, desc, notify=False):
        if not isinstance(desc, RecordDescriptor):
            raise Exception("Expected Record Descriptor")

        # Descriptor already known
        if desc.identifier in self.descriptors:
            return

        # versioned record descriptor
        self.descriptors[desc.identifier] = desc

        # for older non versioned records
        self.descriptors[desc.name] = desc

    def pack_obj(self, obj, *args, **kwargs):
        serial = None

        if isinstance(obj, Record):
            serial = obj._packdict()
            serial['_type'] = 'record'
            serial['_recorddescriptor'] = obj._desc.identifier
        if isinstance(obj, RecordDescriptor):
            serial = {
                '_type': 'recorddescriptor',
                '_data': obj._pack(),
            }
        if isinstance(obj, datetime):
            serial = obj.strftime("%Y-%m-%dT%H:%M:%S.%f")
        if isinstance(obj, fieldtypes.digest):
            serial = {
                "md5": obj.md5,
                "sha1": obj.sha1,
                "sha256": obj.sha256,
            }
        if isinstance(obj, (fieldtypes.net.ipaddress, fieldtypes.net.ipnetwork)):
            serial = str(obj)
        if isinstance(obj, bytes):
            serial = base64.b64encode(obj).decode()

        if serial is not None:
            return self.pack(serial)

        raise Exception("Unpackable type " + str(type(obj)))

    def pack(self, obj):
        return to_js(obj, dict_converter=Object.fromEntries, default_converter=self.pack_obj)


def object_packer(it):
    p = JsRecordPacker()
    for rec in it:
        if rec._desc.identifier not in p.descriptors:
            p.register(rec._desc)
            yield p.pack(rec._desc)

        yield p.pack(rec)


def line_packer(it):
    # Small adoptation from adapter/line.py
    count = 0
    for rec in it:
        rdict = rec._asdict()
        count += 1
        yield f"--[ RECORD {count} ]--"
        if rdict:
            template = f"{{:>{max(len(k) for k in rdict.keys())}}} = {{}}"
        for (key, value) in rdict.items():
            yield template.format(key, value)


def execute(target, func, format="object"):
    for func_def in find_functions(func, target)[0]:
        try:
            tmp = execute_function_on_target(target, func_def)
            output, value = tmp[0], tmp[1]
        except Exception:
            traceback.print_exc()
            continue

        if output == "default":
            if isinstance(value, datetime):
                value = str(value)
            value = to_js(value)
        elif output == "record":
            if format == "object":
                value = object_packer(value)
            elif format == "text":
                value = map(str, value)
            elif format == "line":
                value = line_packer(value)

        return value
    return None


execute
`

const TARGET_SHELL_CODE = `
from dissect.target.tools import shell

# Monkeypatch ANSI colors back to normal
shell.ANSI_COLORS = shell.AnsiColors.as_dict()

# Remove some commands which don't function properly
VERBOTEN = ["less", "python", "registry"]

class WebCli(shell.TargetCli):
    pass

for cmd in VERBOTEN:
    def empty(self, *args, **kwargs):
        print("This command is not available in the web interface")
        return False

    if hasattr(WebCli, f"do_{cmd}"):
        setattr(WebCli, f"do_{cmd}", empty)
    if hasattr(WebCli, f"cmd_{cmd}"):
        setattr(WebCli, f"cmd_{cmd}", empty)

WebCli
`

class MappedFile {
    public file
    public path

    private static reader = new FileReaderSync()
    private static deviceMajor = 1337
    private static deviceMinor = 0

    constructor(file: File, path: string) {
        this.file = file
        this.path = path
    }

    public map() {
        let deviceId = FS.makedev(MappedFile.deviceMajor, MappedFile.deviceMinor++)
        FS.mkdev(this.path, deviceId)

        const self = this

        FS.registerDevice(deviceId, {
            read: function (_: any, buffer: Uint8Array, offset: number, length: number, position: number) {
                let blob = self.file.slice(position, position + length)
                let buf = new Uint8Array(MappedFile.reader.readAsArrayBuffer(blob))
                buffer.set(buf, offset)
                return buf.length
            },
            llseek: function (stream: any, offset: number, whence: number) {
                let position = offset
                if (whence === 1) {
                    position += stream.position
                } else if (whence === 2) {
                    position += self.file.size
                }
                if (position < 0) {
                    throw new FS.ErrnoError(22)
                }
                return position
            },
        })
    }

    public unmap() {
        FS.unlink(this.path)
    }
}

export class Shell {
    private target
    private shell

    constructor(target: PyProxy) {
        this.target = target
        this.shell = targetCli(this.target)
    }

    public get prompt() {
        return this.shell.prompt
    }

    public cmd(value: string) {
        let stdout = new Uint8Array()
        py.setStdout({
            write: (buffer: Uint8Array) => {
                stdout = new Uint8Array([...stdout, ...buffer])
                return buffer.length
            },
        })
        py.setStderr({
            write: (buffer: Uint8Array) => {
                stdout = new Uint8Array([...stdout, ...buffer])
                return buffer.length
            },
        })

        try {
            this.shell.onecmd(value)
        } catch (error) {
            console.error(error)
        }

        py.setStdout()
        py.setStderr()

        return [this.shell.prompt, stdout]
    }
}

export class Target {
    private target
    private shell: Shell | null = null
    public path: string

    constructor(target: PyProxy) {
        this.target = target
        this.path = target.path.toString()
    }

    static open(path: string) {
        const pyTarget = py.pyimport('dissect.target.target').Target
        return new Target(pyTarget.open(path))
    }

    static *openAll(path: string) {
        const pyTarget = py.pyimport('dissect.target.target').Target
        for (let target of pyTarget.open_all(path)) {
            yield new Target(target)
        }
    }

    public execute(func: string, format = 'object') {
        console.log(`Executing function ${func} on target ${this.path} with format ${format}`)
        let result = pluginExecutor(this.target, func, format)
        console.log(`Result of execution:`, result)
        return result
    }

    public allRecordFunctions() {
        return pluginFinder(this.target) as string[]
    }

    public cli() {
        return Comlink.proxy(this.shell || (this.shell = new Shell(this.target)))
    }

    public destroy() {
        this.target.destroy()
    }
}

let py: PyodideAPI
let FS: any
let pluginFinder: PyCallable
let pluginExecutor: PyCallable
let targetCli: PyCallable
let broadcast = new BroadcastChannel('worker')

export class Api {
    private files: Map<string, MappedFile> = new Map()
    private targets: Map<string, Target> = new Map()

    public async load() {
        broadcast.postMessage('Loading Pyodide...')

        await loadPyodide({
            indexURL: '/assets',
            fsInit: async (pyodideFS: any) => {
                FS = pyodideFS
                FS.mkdir('/t/')
            },
        })
            .then(async (pyodide: PyodideAPI) => {
                py = pyodide

                broadcast.postMessage('Loading packages...')
                console.log('Loading packages')
                await py.loadPackage('micropip')
                const pip = py.pyimport('micropip')

                broadcast.postMessage('Installing packages...')
                console.log('Installing dissect.fve and dependencies')
                await pip.install(['pycryptodome', 'argon2-cffi'])
                await pip.install('dissect.fve', false, false)

                console.log('Installing dissect and dependencies')
                await pip.add_mock_package('fusepy', '0.0.0')
                await pip.install('dissect', { pre: true })

                broadcast.postMessage('Preparing Python environment...')

                console.log('Preparing plugin finder and executor code')
                pluginFinder = py.runPython(PLUGIN_FINDER_CODE)
                pluginExecutor = py.runPython(PLUGIN_EXECUTOR_CODE)
                targetCli = py.runPython(TARGET_SHELL_CODE)

                broadcast.postMessage('Done!')
                console.log('Done loading pyodide and packages')

                return pyodide
            })
            .catch((err: any) => {
                broadcast.postMessage('Error loading Pyodide! Please check the console for details.')
                console.error('Error loading pyodide:', err)
                throw err
            })
    }

    public runPython(script: string) {
        return py.runPython(script)
    }

    public mapFile(file: File) {
        console.log(`Mapping file ${file.name}`)

        if (!this.files.has(file.name)) {
            const mappedFile = new MappedFile(file, `/t/${file.name}`)
            mappedFile.map()

            this.files.set(file.name, mappedFile)
        }
    }

    public unmapFile(file: File) {
        console.log(`Unmapping file ${file.name}`)

        if (this.files.has(file.name)) {
            this.files.get(file.name)?.unmap()
            this.files.delete(file.name)
        }
    }

    public unmapFiles() {
        console.log('Unmapping all files')
        for (let mappedFile of this.files.values()) {
            mappedFile.unmap()
        }
        this.files.clear()
    }

    public openTarget(path: string) {
        console.log(`Opening target at ${path}`)
        const target = Target.open(path)
        this.targets.set(target.path, target)
        return Comlink.proxy(target)
    }

    public openAllTargets(path: string) {
        console.log(`Opening all targets at ${path}`)
        for (let target of Target.openAll(path)) {
            this.targets.set(target.path, target)
        }
    }

    public getTargets() {
        return Array.from(this.targets).map(Comlink.proxy)
    }
}

Comlink.transferHandlers.set('pyIterator', pyIteratorHandler)
Comlink.expose(new Api())
