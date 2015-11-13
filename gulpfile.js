var gulp    = require('gulp'),
    nodemon = require('gulp-nodemon'),
    path    = require('path');

require('./sips/clean')(gulp);
require('./sips/html')(gulp);
require('./sips/less')(gulp);
require('./sips/browserify')(gulp);

gulp.task('server', function() {
  nodemon({
    script: path.join(__dirname, 'server', 'index.js'),
    ignore: ['client/*', 'sips/*', 'gulpfile.js']
  });
});

gulp.task('default', ['clean', 'html', 'less', 'watchify-client', 'watchify-pi', 'server']);