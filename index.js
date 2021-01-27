#!/usr/bin/env node
const fs = require('fs')
const path = require('path')

const cli = require('cli')
const browserify = require('browserify')
const { minify } = require('terser')
const glob = require('glob')
const { ncp } = require('ncp')
const tinyify = require('tinyify')

const options = cli.parse({
  output: ['o', 'The folder to output to', 'file'],
  clean: ['c', 'Will delete all files in the output folder first (optional)'],
  optimize: [
    'z',
    'Will run the tinyify plugin with browserify, or the terser plugin if its an es6 module (optional)',
  ],
  ignore: [
    'i',
    `Ignore a comma seperated list of npm modules (optional). E.g. if you dont want to do anything to the foo and bar npm dependencies, use --ignore 'foo, bar'`,
    'string',
  ],
})

if (!options.output) {
  throw new Error('Sunpack Error: --output not set')
}
if (options.clean) {
  if (fs.existsSync(options.output)) fs.rmdirSync(options.output, { recursive: true })
  fs.mkdirSync(options.output)
}

const readJSONFile = filePath => JSON.parse(fs.readFileSync(filePath, { encoding: 'utf-8' }))

const getLibPackagePath = npmLib => path.join(process.cwd(), 'node_modules', npmLib)

const getDirFromFilePath = filePath => (filePath.includes('/') ? path.dirname(filePath) : '')

const getES6LibPackagePath = (npmLib, moduleFilePath) =>
  path.join(process.cwd(), 'node_modules', npmLib, getDirFromFilePath(moduleFilePath))

const getLibPackageJsonPath = npmLib => path.join(getLibPackagePath(npmLib), 'package.json')

const getLibFolderOutputPath = npmLib => path.join(options.output, npmLib)

const createLibFolder = npmLib => fs.mkdirSync(getLibFolderOutputPath(npmLib))

const copyReadymadeBrowserFile = (readyMadeFile, npmLib) =>
  fs.copyFileSync(
    path.join(getLibPackagePath(npmLib), readyMadeFile),
    path.join(getLibFolderOutputPath(npmLib), `${npmLib}.js`)
  )

const isFolderOrJSFile = filename => path.extname(filename) === '.js' || path.extname(filename) === ''

const libsToIgnore = () => (options.ignore ? options.ignore.split(',').map(item => item.trim()) : [])

const { dependencies } = readJSONFile('package.json')

function processES6Module(npmLib, moduleFilePath = '') {
  const es6ModuleDirPath = getES6LibPackagePath(npmLib, moduleFilePath)
  const libFolderOutputPath = getLibFolderOutputPath(npmLib)

  ncp(es6ModuleDirPath, libFolderOutputPath, { filter: isFolderOrJSFile }, function (err) {
    if (err) {
      return console.error(err)
    }
    if (!options.optimize) return
    glob(`${getLibFolderOutputPath(npmLib)}/**/*.js`, { nonull: false }, function (err, files) {
      if (err) throw err
      files.forEach(file => {
        const code = fs.readFileSync(file, 'utf8')
        minify(code)
          .then(({ code }) => fs.writeFileSync(file, code))
          .catch(err => console.error(err))
      })
    })
  })
}

function browserifyDependency(npmLib) {
  const filePath = path.join(getLibFolderOutputPath(npmLib), `${npmLib}.js`)

  fs.writeFileSync(filePath, `require("${npmLib}")`)

  browserify({ plugin: options.optimize ? [tinyify] : [] })
    .add(filePath)
    .bundle((err, buffer) => {
      if (err) throw err
      fs.writeFileSync(filePath, buffer)
    })
}

Object.keys(dependencies).forEach(npmLib => {
  if (libsToIgnore().includes(npmLib)) return
  createLibFolder(npmLib)

  const libPackageJson = readJSONFile(getLibPackageJsonPath(npmLib))

  if (libPackageJson.type === 'module' || libPackageJson.module)
    return processES6Module(npmLib, libPackageJson.module)
  if (libPackageJson.browser) return copyReadymadeBrowserFile(libPackageJson.browser, npmLib)
  if (libPackageJson.jsdelivr) return copyReadymadeBrowserFile(libPackageJson.jsdelivr, npmLib)
  if (libPackageJson.unpkg) return copyReadymadeBrowserFile(libPackageJson.unpkg, npmLib)

  browserifyDependency(npmLib)
})
