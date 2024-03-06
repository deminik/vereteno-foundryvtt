var gulp = require('gulp');
var sass = require('gulp-sass')(require('sass'));

gulp.task('sass', function (cb) {
    gulp.src('css/vereteno.scss').pipe(sass()).pipe(gulp.dest("./"));
    cb();
});

gulp.task('default', gulp.series('sass', function (cb) {
    gulp.watch('css/*.scss', gulp.series('sass'));
    cb();
}));