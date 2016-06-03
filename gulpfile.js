'use strict';

var gulp = require('gulp');
var nunjucksRender = require('gulp-nunjucks-render');
var sass = require('gulp-sass');
var concatCss = require('gulp-concat-css');
var autoprefixer = require('gulp-autoprefixer');
var exec = require('child_process').exec;
var browserify = require('browserify');
var uglify = require('gulp-uglify');
var source = require('vinyl-source-stream');
var gutil = require('gulp-util');
var watchify = require('watchify');
var notify = require('gulp-notify');
var livereload = require('gulp-livereload');
var minifyCss = require('gulp-minify-css');
var streamify = require('gulp-streamify');

gulp.task('server', function (cb) {
  exec('node server.js', function (err, stdout, stderr) {
    console.log(stdout);
    console.log(stderr);
    cb(err);
  });
});

gulp.task('nunjucks', function() {
  // Gets .html and .nunjucks files in pages
  return gulp.src('app/pages/**/*.+(html|nunjucks)')
  // Renders template with nunjucks
  .pipe(nunjucksRender({
      path: ['app/templates']
    }))
  // output files in app folder
  .pipe(gulp.dest('app/build'))
  .pipe(livereload());
});

gulp.task('sass', function() {
  return gulp.src('app/css/scss/app.scss')
      .pipe(sass())
      .pipe(autoprefixer({
            browsers: ['last 2 versions'],
            cascade: false
        }))
      .pipe(concatCss('style.css'))
  	  .pipe(gulp.dest('app/build'))
      .pipe(livereload());
});

function handleErrors() {
  var args = Array.prototype.slice.call(arguments);
  notify.onError({
    title: 'Compile Error',
    message: '<%= error.message %>'
  }).apply(this, args);
  this.emit('end'); // Keep gulp from hanging on this task
}

function buildWatchScript(file) {

  var props = {
    entries: [file],
    debug : true,
  };

  var bundler = watchify(browserify(props));

  function rebundle() {
    var stream = bundler.bundle();
    return stream
      .on('error', handleErrors)
      .pipe(source("bundle.js"))
      .pipe(gulp.dest('app/build/'))
      .pipe(livereload());
  }

  bundler.on('update', function() {
    rebundle();
    gutil.log('Rebundle...');
  });

  return rebundle();
}

gulp.task('watch', function() {
  livereload.listen();
  gulp.watch('app/css/scss/*.scss', ['sass']);
  gulp.watch('app/pages/**/*.+(html|nunjucks)', ['nunjucks']);
  return buildWatchScript('app/js/app.js');
});

gulp.task('sass-build', function() {
  return gulp.src('app/css/scss/app.scss')
      .pipe(sass())
      .pipe(autoprefixer({
            browsers: ['last 2 versions'],
            cascade: false
        }))
      .pipe(concatCss('style.css'))
      .pipe(minifyCss({compatibility: 'ie8'}))
      .pipe(gulp.dest('app/build'));
});

function buildProdScript(file) {

  var props = {
    entries: [file],
    debug : true,
  };

  var bundler = watchify(browserify(props));

  function rebundle() {
    var stream = bundler.bundle();
    return stream
      .on('error', handleErrors)
      .pipe(source("bundle.js"))
      .pipe(streamify(uglify()))
      .pipe(gulp.dest('app/build/'));
  }

  bundler.on('update', function() {
    rebundle();
    gutil.log('Rebundle...');
  });

  return rebundle();
}

gulp.task('js-build', function() {
  return buildProdScript('app/js/app.js');
});


gulp.task('default', ['nunjucks', 'sass', 'watch', 'server']);

gulp.task('prod', ['nunjucks', 'sass-build', 'js-build', 'server']);