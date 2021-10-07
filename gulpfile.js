const gulp = require ('gulp');
const $ = require('gulp-load-plugins')();
// var jade = require('gulp-jade');
var sass = require('gulp-sass')(require('sass'));
// //出錯的地方要繼續
// var plumber = require('gulp-plumber');
// //自動加前綴詞
// var postcss = require('gulp-postcss');
var autoprefixer = require('autoprefixer');
// plungins 定要作用在 gulp的功能中才行 autoprefixer算是postcss 套件  要留著
   //把有功能的地方加錢字號 
var mainBowerFiles = require('main-bower-files');
var browserSync = require('browser-sync').create();
const cleanCSS = require('gulp-clean-css');
const minimist = require('minimist');
//判斷開發環境與成品繳交
var parseArgs = require('minimist')
var envOptions ={
  string:'env',
  default:{env:'develop'}
}
var options = minimist(process.argv.slice(2),envOptions)
console.log(options)
//var imagemin = require('gulp-imagemin');
//import imagemin from 'gulp-imagemin';

const ghPages = require('gulp-gh-pages');


//{allowEmpty: true}即使手動刪除 仍然繼續執行 避免出錯停止
gulp.task('clean', function () {
  return gulp.src(['./.tmp','./public'], {allowEmpty: true}, {read: false})
      .pipe($.clean());
});


gulp.task('copyHTML',function(){
    return gulp.src('./source/**/*.html')
    .pipe(gulp.dest('./public/'))
});

//新版要加done
gulp.task('jade', function(done) {
    //var YOUR_LOCALS = {};
   
    gulp.src('./source/**/*.jade')
      .pipe($.plumber())
      .pipe($.jade({
        //locals: YOUR_LOCALS
        pretty: true
      }))
      .pipe(gulp.dest('./public/'))
      .pipe(browserSync.stream())//輸出後重新整理
      done();
  });




//sass 編譯的部分
gulp.task('sass',function(done){

  var plugins = [
    autoprefixer({overrideBrowserslist: ['last 3 version','> 5%','ie 8']}),
];

 return gulp.src('./source/scss/**/*.scss')
    .pipe($.plumber())
    .pipe($.sourcemaps.init())
    .pipe(sass(
      {
        includePaths:['./node_modules/bootstrap/scss']
      }
    )
    .on('error',sass.logError))
    // 以上sass已編譯完成
    .pipe($.postcss(plugins)) //添加前綴詞的套件
    //用if的方式讓變成開發者模式的時候不要壓縮
    .pipe($.if(options.env==='production', cleanCSS() ))//css壓縮
    .pipe($.sourcemaps.write('.'))
    .pipe(gulp.dest('./public/css'))
    .pipe(browserSync.stream())//輸出後重新整理
    done();
});


//Babel ES6 編譯
gulp.task('babel', () =>
    gulp.src('./source/js/**/*.js')
        .pipe($.sourcemaps.init())
        .pipe($.babel({
            presets: ['@babel/env']
        }))
        .pipe($.concat('all.js'))
        .pipe($.if(options.env==='production',$.uglify(
          {
            compress:{
              drop_console:true
              //讓console的內容不要出現
            }
          }
        )))//js 壓縮
        .pipe($.sourcemaps.write('.'))
        .pipe(gulp.dest('./public/js'))
        .pipe(browserSync.stream())//輸出後重新整理
);

//套件管理工具
 
gulp.task('bower', function() {
    return gulp.src(mainBowerFiles())
        .pipe(gulp.dest('./.tmp/vendors'))
});

//先執行完bower再執行 venderJs這個task 所以gulp下面不用再加 ,
gulp.task('vendorJs',gulp.series('bower',function(){
  return gulp.src('./.tmp/vendors/**/**.js')
     .pipe($.concat('vendors.js'))
     .pipe($.if(options.env==='production',$.uglify()))//js 壓縮
     .pipe(gulp.dest('./public/js'))
}));


gulp.task('browser-sync', function() {
  browserSync.init({
      server: {
          baseDir: "./public"
      },
      reloadDebounce: 2000
      //間隔兩秒再重新整理
  });
});

//gulp-imagemin 壓縮圖片

// gulp.task('image-min',()=> 
//    gulp.src('./source/images/*')
//   .pipe($.if(options.env ==='production', imagemin()))
//   .pipe(gulp.dest('./public/images'))
//  );


//自動繼續執行上述任務 都可加上 .pipe(browserSync.stream());//輸出後重新整理
gulp.task('watch',function(done){
    gulp.watch('./source/scss/**/*.scss',gulp.series('sass'));
    gulp.watch('./source/*.jade', gulp.series('jade'));
    gulp.watch('./source/js/**/*.js',gulp.series('babel'));
    done();
});

//發佈到網路上
gulp.task('deploy', () => { 
  return gulp.src('./public/**/*')
    .pipe(ghPages());
  });



//綜合指令，只要打一個gulp就可以執行以上任務
// gulp.task('default', ['jade','sass','watch']);
gulp.task('default',gulp.parallel('jade','sass','babel','vendorJs','browser-sync','watch'));



//準備交付的檔案，後面會有依序處理的流程=>'browser-sync','watch' 這兩個不用，因為是協助開發使用
gulp.task('build', gulp.series('clean',gulp.parallel('jade','sass','babel','vendorJs')));
