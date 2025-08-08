# target-web-demo

A small in-browser demo of `dissect.target`. Allows you to select local targets and inspect them with some basic `dissect.target` utilities, completely client-side.

Functionality includes:

- Showing some basic target information (hostname, domain, IPs, OS version)
- Browsing various plugin outputs in a table or text view
- Browsing the target filesystem in a virtual shell

## Requirements

- npm
- vite

## Getting started

The Makefile + Vite can be used to get up and running quickly. Ensure the following are installed:

- GNU make
- npm
- vite

To start the development server, run:

```bash
make clean
make dev
```

To rebuild the production bundle, run `make`. See `./dist` for compiled bundle.

## Contributing

The Dissect project encourages any contribution to the codebase. To make your contribution fit into the project, please
refer to [the style guide](https://dissect.readthedocs.io/en/latest/contributing/style-guide.html).

## Copyright and license

Dissect is released as open source by Fox-IT (<https://www.fox-it.com>) part of NCC Group Plc
(<https://www.nccgroup.com>).

Developed by the Dissect Team (<dissect@fox-it.com>) and made available at <https://github.com/fox-it/dissect>.

License terms: AGPL3 (<https://www.gnu.org/licenses/agpl-3.0.html>). For more information, see the LICENSE file.
