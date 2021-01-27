## Sunpack: like snowpack but far worse.

Sunpack converts or moves your npm dependencies from the node_modules directory to a directory you specify to make them usable in the browser.

Sunpacks works the following way:
* If your npm dependency is an es6 module, it copies the .js files from its node_modules folder to the output folder you specify. It can also compress the output using [terser](https://www.npmjs.com/package/terser).
* If your npm dependency is a common js module, it uses browserify to convert it for use in the browser and outputs it to the folder specified. It can also compress the output using [tinify](https://www.npmjs.com/package/tinyify).
* If your npm dependency comes with a ready made file for use in the browser, it will just copy that to the specified folder.

### FAQ
* Has this been thouroughly tested?
  * No!
* When should I use this?
  * When you are not using a bundler like wepback, rollup et.al.

### Usage:
```
Usage:
  sunpack [OPTIONS] [ARGS]

Options: 
  -o, --output FILE      The folder to output to
  -c, --clean            Will delete all files in the output folder first (optional) 
  -z, --optimize         Will run the tinyify plugin with browserify, or the 
                         terser plugin if its an es6 module (optional) 
  -i, --ignore STRING    Ignore a comma seperated list of npm modules (optional). 
                         E.g. if you dont want to do anything to the 
                         foo and bar npm dependencies, use --ignore 'foo, bar' 
  -h, --help             Display help and usage details


```