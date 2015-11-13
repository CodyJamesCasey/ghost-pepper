var path        = require('path'),
    sourcemaps  = require('gulp-sourcemaps');

var baseDir = path.join(__dirname, '..');

module.exports = function(gulp) {
    gulp.task('html:build', function() {
        gulp.src(path.join(baseDir, 'client', 'html', '*.html'))
        .pipe(sourcemaps.init())
        .pipe(sourcemaps.write())
        .pipe(gulp.dest(path.join(baseDir, 'dist')));
    });

    gulp.task('html:watch', function() {
        gulp.watch(path.join(baseDir, 'client', 'html', '**', '*'), ['html:build']);
    });

    gulp.task('html', ['html:build', 'html:watch']);
}