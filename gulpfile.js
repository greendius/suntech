var gulp = require('gulp');
var browserSync = require('browser-sync');
var postcss = require('gulp-postcss');
var stylus = require('gulp-stylus');

var lost = require('lost');
var rucksack = require('rucksack-css');

var exec = require('child_process').exec;
var uglify = require('gulp-uglify');
var gulpif = require('gulp-if');
var concat = require("gulp-concat");
var sourcemaps = require('gulp-sourcemaps');
var runSequence = require('run-sequence');

var axis = require('axis');
var cssnano = require('cssnano');
var rupture = require('rupture');

var plumber = require('gulp-plumber');


/**
 * Project Configuration
 * =====================
 */

var prod = false,
	basePath = 'src',
	vendorPath = basePath + '/_assets/_vendor',
	jsplugins = [
		vendorPath + '/jquery/dist/jquery.js',
	];

/**
 * Build the Jekyll Site
 */
gulp.task('jekyll-build', function () {
	exec('jekyll build', function(err, stdout, stderr) {
		browserSync.notify('jekyll build');
		browserSync.reload();
	});
});

/**
 * Rebuild Jekyll & do page reload
 */
gulp.task('jekyll-rebuild', ['jekyll-build'], function () {
	browserSync.reload();
});

/**
 * Wait for jekyll-build, then launch the Server
 */
gulp.task('browser-sync', ['styl', 'jekyll-build'], function() {
	console.log('enter bs')
	browserSync({
		server: {
			baseDir: 'web'
		}
	});
});


/**
 * Compile files from _scss into both _site/css (for live injecting) and site (for future jekyll builds)
 */
gulp.task('styl', function () {
	var processors = [
		//autoprefixer({ browsers: ['last 2 versions']})
		lost,
		rucksack({
			autoprefixer: true
		})
		//cssnano()
	];

	return gulp.src(basePath + '/_assets/_styl/main.styl')
		.on('error', function (err) {
		console.error('Error!', err.message);
	})

	.pipe(plumber())
	.pipe(stylus({
		'include css': true,
		use: [axis(), rupture()]
	}))

	.pipe(postcss(processors))
	.pipe(gulp.dest('web/css'))
	/*.pipe(sourcemaps.write())*/
	.pipe(browserSync.reload({stream:true}))
	.pipe(gulp.dest(basePath + '/css'))
});

/**
* Concat compress js
*/
gulp.task('js', function() {
	return gulp.src(basePath + '/_assets/_js/**/*.js')
		.pipe(gulpif(prod, uglify({
			preserveComments: 'some'
		})))
		.pipe(concat('script.js'))
		.pipe(gulp.dest(basePath + '/js'));
});


/**
* Concat compress js
*/
gulp.task('js:vendor', function() {
	return gulp.src(jsplugins)
		.pipe(uglify())
		.pipe(concat('vendor.js'))
		.pipe(gulp.dest(basePath + '/js'));
});


/**
 * Watch scss files for changes & recompile
 * Watch html/md files, run jekyll & reload BrowserSync
 */
gulp.task('watch', function () {
	gulp.watch(basePath + '/_assets/_js/**/*.js', ['js', 'jekyll-build']);
	gulp.watch(basePath + '/_assets/_styl/**/*.styl', ['styl']);
	gulp.watch(basePath + '/**/*.html', ['jekyll-rebuild']);
	gulp.watch(basePath + '/**/*.md', ['jekyll-rebuild']);
	gulp.watch(basePath + '/img/**/*', ['jekyll-rebuild']);
});

/**
 * Default task, running just `gulp` will compile the sass,
 * compile the jekyll site, launch BrowserSync & watch files.
 */
gulp.task('default', ['browser-sync', 'watch']);


/**
* Gulp Prod
* =========
* Prod
*/

gulp.task('prod', function() {
	prod = true;
	runSequence('styl', 'js', 'js:vendor', 'jekyll-build')
});
