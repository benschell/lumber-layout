# lumber-layout

A node.js-based tool for laying out lumber.

## Dependencies and Installation

This program requires [Node.js](http://nodejs.org). It relies on [node-canvas](https://github.com/Automattic/node-canvas) and therefore requires the dependencies of that module. Please check the [installation instructions](https://github.com/Automattic/node-canvas#installation) for Cairo and other dependencies. Pay attention to the note for El Capitan users if applicable.

Once the dependencies are installed, simply install via `npm`:

```sh
npm install -g lumber-layout
```

### TL;DR

For OSX:

```sh
brew install node # Install node
brew install pkg-config cairo libpng jpeg giflib # Install Cairo and other node-canvas dependencies
xcode-select --install # For El Capitan users
npm install -g lumber-layout
```

## Usage

Then, run the program like this:

```sh
lumber-layout input-file.json
```

## Install from Source

Clone the repo, then install dependencies:

```sh
npm install
```

Then run locally, e.g.:

```sh
./lumber-layout.sh samples/play-kitchen-8x4.json
```

## Input

The program expects an input file of a format like this:

```json
{
    "sheets": {
        "3/4": "48x96",
        "1/4": "48x96"
    },
    "cuts": {
        "3/4 x 11 1/2 x 46 1/2": 1,
        "3/4 x 11 1/2 x 36": 2,
        "1/4 x 11 1/2 x 36": 2
    }
}
```

The `sheets` object describes the available source material. In this case, one is able to procure 3/4" and 1/4" thick sheets that are 48" x 96".

The `cuts` object describes the desired output pieces. In this case, 3 total pieces are desired that are 3/4" thick: 1 that is 11 1/2" x 46 1/2" and 2 that are 11 1/2" x 36". Similarly, 2 pieces are desired that are 1/4" thick, both of them 11 1/2" x 36".

The description above indicates inches, but this really doesn't matter to the program. The units really don't matter to the program itself, so one could easily supply millimeters, centimeters, feet, or any other unit.

# Output

The program generates PNG image files representing options for how to generate the required pieces from given source material sizes. An `output` folder is generated in the current working folder with a folder named after the filename. Inside that folder will be generated a folder corresponding to each algorithm included as part of the tool.
