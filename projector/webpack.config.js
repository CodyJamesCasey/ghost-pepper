var path              = require('path');
var webpack           = require('webpack');
var HtmlWebpackPlugin = require('html-webpack-plugin');

var SRC_PATH    = path.join(__dirname, 'src');
var BUILD_PATH  = path.join(__dirname, '..', 'dist');
var HTML_OPTS   = {
  filename: 'projector.html',
  title:    'Ghost Pepper Projector',
  inject:   true,
  minify:   { collapseWhitespace: true, },
  templateContent: `
    <!DOCTYPE html>
    <html>
      <head>
        <meta http-equiv="Content-type" content="text/html; charset=utf-8"/>
        <link rel="apple-touch-icon" href="/static/apple-touch-icon.png">
        <link rel="icon" type="image/png" href="/static/favicon-196x196.png" sizes="196x196">
        <title>{%= o.htmlWebpackPlugin.options.title %}</title>
      </head>
      <body>
      </body>
    </html>
  `
};
module.exports = {
  quiet:    true,
  context:  SRC_PATH,
  entry:    [path.join(SRC_PATH, 'main.js')],
  resolve:  {
    root:       SRC_PATH,
    extensions: ['', '.js', '.jsx']
  },
  output:   {
    path:       BUILD_PATH,
    filename:   'projector.js',
    publicPath: '/static/'
  },
  plugins: [new HtmlWebpackPlugin(HTML_OPTS)],
  module:   {
    loaders:  [
      {
        test:     /\.(png|woff|woff2|eot|ttf|svg)$/,
        loader:   'url-loader?limit=100000'
      },
      {
        test:     /\.css$/,
        loaders:  ['style', 'css']
      },
      {
        test:     /\.scss$/,
        loaders:  ['style', 'css', 'sass?&includePaths[]=' + encodeURIComponent(SRC_PATH)]
      },
      {
        test:     /\.jsx?$/,
        exclude:  /node_modules/,
        loader:   'babel',
        query:    {
          optional: [
            'runtime',
            'es7.asyncFunctions',
            'es7.decorators',
            'es7.classProperties'
          ]
        }
      }
    ]
  }
};
