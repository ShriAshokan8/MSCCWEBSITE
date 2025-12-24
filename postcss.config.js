module.exports = {
  plugins: [
    require('css-declaration-sorter')({
      order: 'smacss'
    }),
    require('cssnano')({
      preset: 'default',
    }),
  ]
}
