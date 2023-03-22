const gulp = require("gulp");
const gulpIf = require("gulp-if");
const browserSync = require("browser-sync").create();
const sass = require("gulp-sass")(require("sass"));
const htmlmin = require("gulp-htmlmin");
const cssmin = require("gulp-cssmin");
const uglify = require("gulp-uglify");
const concat = require("gulp-concat");
const merge = require("merge-stream");
const jsImport = require("gulp-js-import");
const sourcemaps = require("gulp-sourcemaps");
const htmlPartial = require("gulp-html-partial");
const clean = require("gulp-clean");

const isProd = process.env.NODE_ENV === "prod";

const htmlFile = ["src/*.html"];

function html() {
  return gulp
    .src(htmlFile)
    .pipe(
      htmlPartial({
        basePath: "src/partials/",
      })
    )
    .pipe(
      gulpIf(
        isProd,
        htmlmin({
          collapseWhitespace: true,
        })
      )
    )
    .pipe(gulp.dest("dist"))
    .pipe(browserSync.stream({ match: "**/*.html" }));
}

function css() {
  return gulp
    .src("src/scss/**/*")
    .pipe(gulpIf(!isProd, sourcemaps.init()))
    .pipe(
      sass({
        includePaths: ["node_modules"],
      }).on("error", sass.logError)
    )
    .pipe(gulpIf(!isProd, sourcemaps.write()))
    .pipe(gulpIf(isProd, cssmin()))
    .pipe(gulp.dest("dist/css/"))
    .pipe(browserSync.stream({ match: "**/*.css" }));
}

function js() {
  return gulp
    .src("src/js/*.js")
    .pipe(
      jsImport({
        hideConsole: true,
      })
    )
    .pipe(gulpIf(isProd, uglify()))
    .pipe(gulp.dest("dist/js"))
    .pipe(browserSync.stream({ match: "**/*.js" }));
}

function img() {
  return gulp
    .src("src/images/**/*")

    .pipe(gulp.dest("dist/images"))
    .pipe(browserSync.stream());
}

function serve() {
  browserSync.init({
    open: true,
    server: "./dist",
  });
}

function browserSyncReload(done) {
  browserSync.reload();
  done();
}

//Bring third party dependencies from node_modules into vendor directory
function modules() {
  //Bootstrap
  var bootstrap = gulp
    .src("./node_modules/bootstrap/dist/js/bootstrap.min.js")
    .pipe(gulpIf(isProd, uglify()))
    .pipe(gulp.dest("./src/vendor"))
    .pipe(gulp.dest("./dist/vendor"));

  //Bootstrap-Icons
  var bootstrapIcons = gulp
    .src("./node_modules/bootstrap-icons/font/**/*")
    .pipe(gulpIf(isProd, uglify()))
    .pipe(gulp.dest("./src/vendor/bootstrap-icons/"))
    .pipe(gulp.dest("./dist/vendor/bootstrap-icons/"));
  //jQuery
  var jquery = gulp
    .src([
      "./node_modules/jquery/dist/jquery.min.js",
      "!./node_modules/jquery/dist/core.js",
    ])
    .pipe(gulpIf(isProd, uglify()))
    .pipe(gulp.dest("./src/vendor"))
    .pipe(gulp.dest("./dist/vendor"));

  //Popper
  var popper = gulp
    .src("./node_modules/@popperjs/core/dist/cjs/popper.js")
    .pipe(gulp.dest("./src/vendor"))
    .pipe(gulp.dest("./dist/vendor"));

  return merge(
    bootstrap,
    jquery,
    popper,
    bootstrapIcons,
  );
}
function watchFiles() {
  gulp.watch("src/**/*.html", gulp.series(html, browserSyncReload));
  gulp.watch("src/**/*.scss", gulp.series(css, browserSyncReload));
  gulp.watch("src/**/*.js", gulp.series(js, browserSyncReload));
  gulp.watch("src/images/**/*.*", gulp.series(img));

  return;
}

function del() {
  return gulp.src("dist/*", { read: false }).pipe(clean());
}

exports.css = css;
exports.html = html;
exports.js = js;
exports.modules = modules;
exports.del = del;
exports.serve = gulp.parallel(html, css, js, modules, img, watchFiles, serve);
exports.default = gulp.series(del, html, css, js, img, modules);