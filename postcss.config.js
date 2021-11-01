// eslint-disable-next-line @typescript-eslint/no-var-requires
const prefixer = require('postcss-prefix-selector')

module.exports = {
  plugins: [
    prefixer({
      prefix: '.cpaas-comparison',
      transform: (prefix, selector, prefixedSelector, filepath) => {
        if (selector.match(/^(html|body)/)) {
          return selector.replace(/^([^\s]*)/, `$1 ${prefix}`)
        }
        if (filepath.match(/node_modules/)) {
          return selector.replace(/^([^\s]*)/, `${prefix} $1`)
          // return selector // Do not prefix styles imported from node_modules
        }
        // if (selector.startsWith('html') || selector.startsWith('body')) {
        //   return prefix + selector.substring(4)
        // }
        return prefixedSelector
      },
    }),
  ],
}
