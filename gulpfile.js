const gulp = require('gulp'),
    sass = require('gulp-sass'),
    csso = require('gulp-csso'),
    gutil = require('gulp-util'),
    clean = require('gulp-clean'),
    merge = require('merge-stream'),
    notify = require('gulp-notify'),
    uglify = require('gulp-uglify'),
    ghPages = require('gulp-gh-pages-will'),
    imagemin = require('gulp-imagemin'),
    sourcemaps = require('gulp-sourcemaps'),
    minifyHTML = require('gulp-minify-html'),
    spritesmith = require('gulp.spritesmith'),
    autoprefixer = require('gulp-autoprefixer'),
    fileinclude = require('gulp-file-include'),
    browserSync = require('browser-sync').create();


// запуск сервера
gulp.task('server', function() {
    browserSync.init({
        server: {
            baseDir: "./assets"
        },
        port: "7777"
    });

    gulp.watch(['./pages/**/*.html', './templates/**/*.html']).on('change', browserSync.reload);
    gulp.watch('./js/**/*.js').on('change', browserSync.reload);

    gulp.watch(['./templates/**/*.html', './pages/**/*.html'], ['fileinclude']);
    gulp.watch('./sass/**/*', ['sass']);
});

// компіляція sass/scss в css
gulp.task('sass', function() {
    gulp.src(['./sass/**/*.scss', './sass/**/*.sass'])
        .pipe(sourcemaps.init())
        .pipe(
            sass({ outputStyle: 'expanded' })
            .on('error', gutil.log)
        )
        .on('error', notify.onError())
        .pipe(sourcemaps.write())
        .pipe(gulp.dest('./assets/css/'))
        .pipe(browserSync.stream());
});

// збірка сторінки з шаблонів
gulp.task('fileinclude', function() {
    gulp.src('./pages/**/*.html')
        .pipe(fileinclude({
            prefix: '@@',
            basepath: '@file'
        })
        .on('error', gutil.log))
        .on('error', notify.onError())
        .pipe(gulp.dest('./assets/'))
});

// зтиснення svg, png, jpeg
gulp.task('minify:img', function() {
    // беремо всі картинки крім папки де лежать картинки для спрайту
    return gulp.src(['./assets/images/**/*'])
        .pipe(imagemin().on('error', gutil.log))
        .pipe(gulp.dest('./public/images/'));
});

// зтиснення css
gulp.task('minify:css', function() {
    gulp.src('./css/**/*.css')
        .pipe(autoprefixer({
            browsers: ['last 30 versions'],
            cascade: false
        }))
        .pipe(csso())
        .pipe(gulp.dest('./public/css/'));
});

// зтиснення js
gulp.task('minify:js', function() {
    gulp.src('./assets/js/**/*.js')
        .pipe(uglify())
        .pipe(gulp.dest('./public/js/'));
});

// зтиснення html
gulp.task('minify:html', function() {
    var opts = {
        conditionals: true,
        spare: true
    };

    return gulp.src(['./assets/**/*.html'])
        .pipe(minifyHTML(opts))
        .pipe(gulp.dest('./public/'));
});

// видалити папку public
gulp.task('clean', function() {
    return gulp.src(['./public', './assets'], { read: false }).pipe(clean());
});

// створення спрайту з картинок з папки images/sprite
gulp.task('sprite', function() {
    var spriteData = gulp.src('./images/sprite/*.png').pipe(
        spritesmith({
            imgName: 'sprite.png',
            cssName: '_icon-mixin.scss',
            retinaImgName: 'sprite@2x.png',
            retinaSrcFilter: ['images/sprite/*@2x.png'],
            cssVarMap: function(sprite) {
                sprite.name = 'icon-' + sprite.name;
            }
        })
    );

    var imgStream = spriteData.img.pipe(gulp.dest('./assets/images/'));
    var cssStream = spriteData.css.pipe(gulp.dest('./sass/'));

    return merge(imgStream, cssStream);
});

gulp.task('img', function() {
    return gulp.src(['./images/**/*'])
        .pipe(gulp.dest('./assets/images/'));
});

// публікація на gh-pages
gulp.task('deploy', function() {
    return gulp.src(['./public/**/*']).pipe(ghPages());
});

// при виклику в терміналі команди gulp, буде запущені задачі 
// server - для запупуску сервера, 
// sass - для компіляції sass в css, тому що браузер 
// не розуміє попередній синтаксис,
// fileinclude - для того щоб з маленьких шаблонів зібрати повну сторінку
gulp.task('default', ['server', 'build']);
gulp.task('build', ['sprite', 'sass', 'fileinclude', 'img']);

// при виклику команди gulp production
// будуть стиснуті всі ресурси в папку public
// після чого командою gulp deploy їх можна опублікувати на github
gulp.task('production', ['sprite', 'sass', 'fileinclude', 'minify:html', 'minify:css', 'minify:js', 'minify:img']);
