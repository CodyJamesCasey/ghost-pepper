var gulp    = require('gulp'),
    nodemon = require('gulp-nodemon'),
    path    = require('path');

gulp.task('server', function() {
  nodemon({
    script: path.join(__dirname, 'server', 'index.js'),
    ignore: ['client/*', 'gulpfile.js']
  });
});