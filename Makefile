.DELETE_ON_ERROR:

PYODIDE_RELEASE := $(shell npm pkg get dependencies.pyodide | tr -d '"')
APP_SOURCE := $(shell find src -type f ! -path 'src/worker/*')

.PHONY: all
all: build

.PHONY: build
build: dist/index.html

.PHONY: install
install: node_modules/pyodide/whl

.PHONY: dev
dev: node_modules/pyodide/whl
	npm run dev

.PHONY: clean
clean:
	rm -rf dist node_modules || true

.PHONY: clean-downloads
clean-downloads:
	rm -rf pyodide-$(PYODIDE_RELEASE).tar.bz2 pyodide || true

node_modules: ./package.json
	npm install --legacy-peer-deps

pyodide-$(PYODIDE_RELEASE).tar.bz2:
	curl -L https://github.com/pyodide/pyodide/releases/download/$(PYODIDE_RELEASE)/$@ -o $@

node_modules/pyodide/whl: pyodide-$(PYODIDE_RELEASE).tar.bz2 | node_modules
	mkdir -p $@ && tar -xvjf $< -C $@ --strip-components=1

dist/index.html: $(APP_SOURCE) node_modules/pyodide/whl
	npm run build
