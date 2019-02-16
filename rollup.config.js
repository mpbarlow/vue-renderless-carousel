import buble from 'rollup-plugin-buble'
import commonjs from 'rollup-plugin-commonjs'
import resolve from 'rollup-plugin-node-resolve'
import { terser } from 'rollup-plugin-terser'
import vue from 'rollup-plugin-vue'

const common = {
  input: 'src/index.js',
  plugins: [
    commonjs(),
    resolve(),
    vue({
      css: true,
      compileTemplate: true
    }),
    buble(),
    terser()
  ]
}

const exports = 'named'
const external = ['element-resize-detector']
const name = 'VueRenderlessCarousel'

const outputs = [
  {
    external,
    output: {
      exports,
      file: `dist/index.umd.js`,
      format: 'umd',
      globals: {
        'element-resize-detector': 'elementResizeDetectorMaker'
      },
      name
    }
  },
  {
    external,
    output: {
      exports,
      file: `dist/index.esm.js`,
      format: 'es',
      name
    }
  },
  {
    output: {
      exports,
      file: `dist/index.min.js`,
      format: 'iife',
      name
    }
  }
]

export default outputs.map(output => ({ ...common, ...output }))
