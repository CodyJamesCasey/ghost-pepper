var gulp    = require('gulp'),
    nodemon = require('gulp-nodemon'),
    path    = require('path');

require('./sips/html')(gulp);
require('./sips/less')(gulp);
require('./sips/browserify')(gulp);

gulp.task('server', function() {
  nodemon({
    script: path.join(__dirname, 'server', 'index.js'),
    ignore: ['client/*', 'gulpfile.js']
  });
});

gulp.task('default', ['html', 'less', 'browserify', 'server']);