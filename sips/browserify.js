var path        = require('path'),
    browserify  = require('browserify'),
    watchify    = require('watchify'),
    babelify    = require('babelify'),
    source      = require('vinyl-source-stream')

var baseDir = path.join(__dirname, '..');

module.exports = function(gulp) {
    // Compiles the public js
    gulp.task('browserify', function() {
        var bundler = browserify({
            paths: [
                path.join(baseDir, 'node_modules'),   // For node modules
                path.join(baseDir, 'client')  // The js source directory
            ]
        });
        bundler.transform(babelify)
            .add(path.join(baseDir, 'client', 'js', 'main.js'))
            .bundle()
            .pipe(source(path.join(baseDir, 'main.js')))
            .pipe(gulp.dest(path.join(baseDir, 'dist')));
    });

    gulp.task('watchify-client', function() {
        var bundler = browserify({
            paths: [
                path.join(baseDir, 'node_modules'),   // For node modules
                path.join(baseDir, 'client')  // The js source directory
            ]
        });
        bundler.transform(babelify);
        bundler = watchify(bundler);
        bundler.on('update', function() {
                bundler.bundle()
                    .pipe(source(path.join(baseDir, 'main.js')))
                    .pipe(gulp.dest(path.join(baseDir, 'dist')));
            })
            .add(path.join(baseDir, 'client', 'js', 'main.js'))
            .bundle()
            .pipe(source(path.join(baseDir, 'main.js')))
            .pipe(gulp.dest(path.join(baseDir, 'dist')));
    });

    gulp.task('watchify-pi', function() {
        var bundler = browserify({
            paths: [
                path.join(baseDir, 'node_modules'),   // For node modules
                path.join(baseDir, 'client')  // The js source directory
            ]
        });
        bundler.transform(babelify);
        bundler = watchify(bundler);
        bundler.on('update', function() {
                bundler.bundle()
                    .pipe(source(path.join(baseDir, 'ghost-pepper.js')))
                    .pipe(gulp.dest(path.join(baseDir, 'dist')));
            })
            .add(path.join(baseDir, 'client', 'js', 'ghost-pepper.js'))
            .bundle()
            .pipe(source(path.join(baseDir, 'ghost-pepper.js')))
            .pipe(gulp.dest(path.join(baseDir, 'dist')));
    });


}