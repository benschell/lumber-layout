# lumber-layout

A node.js-based tool for laying out lumber.

## Usage

Clone the repo, then install dependencies:

```sh
npm install
```

Then, run the program like this:

```sh
./lumber-layout.js samples/play-kitchen-8x4.json
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
