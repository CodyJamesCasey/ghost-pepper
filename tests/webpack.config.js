var path              = require('path');
var webpack           = require('webpack');
var HtmlWebpackPlugin = require('html-webpack-plugin');

var SRC_PATH    = path.join(__dirname);
var BUILD_PATH  = path.join(__dirname, 'dist');
var HTML_OPTS   = {
  filename: 'test.html',
  title:    'Ghost Pepper Tests',
  inject:   true,
  minify:   { collapseWhitespace: true, },
  templateContent: "<!DOCTYPE html>" +
    "<html>" +
      "<head>" +
        "<meta name='viewport' content='width=device-width, initial-scale=1, maximum-scale=1'>" +
        "<meta charset='utf-8'/>" +
        '<link href="https://cdn.rawgit.com/mochajs/mocha/2.2.5/mocha.css" rel="stylesheet" />' +
        "<title>{%= o.htmlWebpackPlugin.options.title %}</title>" +
        '<script src="https://cdn.rawgit.com/mochajs/mocha/2.2.5/mocha.js"></script>' +
      "</head>" +
      "<body>" +
       "<div id='mocha'>" +
       "</div>" +
      "</body>" +
    "</html>"
};

module.exports = {
  quiet:    true,
  context:  SRC_PATH,
  entry:    [path.join(SRC_PATH, 'test.js')],
  resolve:  {
    root:       SRC_PATH,
    extensions: ['', '.js', '.jsx']
  },
  output:   {
    path:       BUILD_PATH,
    filename:   'test.js'
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
