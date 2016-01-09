'use strict';

var gulp            = require('gulp')
  , _               = require('lodash')
  , bower           = require('main-bower-files')
  , bowerNormalizer = require('gulp-bower-normalize')
  , rename          = require('gulp-rename')
  , install         = require('gulp-install')
  , watch           = require('gulp-watch')
  , babel           = require('gulp-babel')
  , uglify          = require('gulp-uglify')
  , gutil           = require('gulp-util')
  , gulpif          = require('gulp-if')
  , rjs             = require('gulp-requirejs-optimize')
  , twig_compile    = require('twig-compile')
  , sourcemaps      = require('gulp-sourcemaps')
  , sass            = require('gulp-sass')
  , autoprefixer    = require('gulp-autoprefixer')
  , cmq             = require('gulp-merge-media-queries')
  , progeny         = require('gulp-progeny')
  , minifyCss       = require('gulp-minify-css')
  , browserSync     = require('browser-sync')
  , minimatch       = require("minimatch");


var logger = function (prefix) {
  return require('gulp-print')(function (filepath) {
    return prefix + ': ' + filepath;
  });
};

var env = process.env.NODE_ENV || process.env.SYMFONY_ENV || 'dev';
var config = {
  ENV:              env,
  dependencies:     {
    js:          {
      minify:     env !== 'dev',
      paths:      {
        '': ['./frontend/javascripts']
      },
      extensions: ['js', 'es6'],
      babel:      {
        options: {
          modules: 'amd'
        }
      }
    },
    views:       {
      paths:      {
        '': ['./frontend/templates']
      },
      extensions: ['twig'],
      options:    {
        module:         'amd',
        twig:           'twig',
        compileOptions: {
          viewPrefix: 'views/'
        }
      }
    },
    stylesheets: {
      path:         './frontend/stylesheets',
      extensions:   ['scss', 'css'],
      autoprefixer: [
        "last 2 version",
        "ie 10",
        "ios 6",
        "android 4"
      ]
    },
    fonts:       {
      path:       './frontend/fonts',
      extensions: ['eot', 'svg', 'ttf', 'woff', 'woff2']
    },
    images:      {
      path:       './frontend/images',
      extensions: ['svg', 'jpg', 'jpeg', 'png']
    },
    bootstrap: {
      path: './frontend/bootstrap'
    }
  },
  browsersync:      {
    watch: [
      __dirname + '/views/*.twig',
      __dirname + '/public/dependencies/css/*.css'
    ]
  },
  BOWER_JSON:       './bower.json',
  BOWER_COMPONENTS: './bower_components',
  DEST_PATH:        './public/dependencies'
};

var handleRename = (function (config) {
  return rename(function (file) {
    if (!config[file.basename]) {
      return;
    }
    file.basename = config[file.basename];
  });
})(_.merge({overrides: {renames: {}}}, require(config.BOWER_JSON)).overrides.renames);


/**
 * @param {Array<String>} extensions
 * @param {String} path
 * @return {Array<String>}
 */
function getPaths(path, extensions) {
  return _.map(extensions, function (ext) {
    return path + '/**/*.' + ext;
  })
}

/**
 * @param {Array<String>} paths
 * @param {String} path
 * @return {boolean|String}
 */
function matchPath(paths, path) {
  var found;
  return _.any(paths, function (v) {
      found = v;
      return minimatch(path, v);
    }) && found;
}
/**
 * @param {String} pathBlob
 * @return {String}
 */
function getBase(pathBlob) {
  return pathBlob.replace(/\/\*\*\/\*\..*/, '');
}

gulp.task('bower:dependencies', ['bower:install'], function () {
  return gulp.src(bower(), {base: config.BOWER_COMPONENTS})
    .pipe(bowerNormalizer({bowerJson: config.BOWER_JSON, flatten: true}))
    .pipe(logger('bower'))
    .pipe(handleRename)
    .pipe(gulpif(function (file) {
      return config.dependencies.js.minify && require('path').parse(file.path).ext === '.js';
    }, uglify()))
    .on('error', function () {
      console.error(arguments);
    })
    .pipe(gulp.dest(config.DEST_PATH));
});

gulp.task('bower:install', function () {
  return gulp.src([config.BOWER_JSON])
    .pipe(install());
});

(function (handle) {
  var conf = config.dependencies.stylesheets, paths = getPaths(conf.path, conf.extensions);
  gulp.task('dependencies:stylesheets:watch', ['dependencies:stylesheets:build'], function () {
    return watch(paths, function (file) {
      return handle(conf, file.path);
    });
  });
  gulp.task('dependencies:stylesheets:build', [], function () {
    return handle(conf, paths);
  });
})(function (conf, paths) {
  return gulp.src(paths, {
    base: conf.path
  })
    .pipe(progeny({
      regexp:         /^\s*@import\s*['"]?([^'"]+)['"]?/,
      prefix:         '_',
      extensionsList: ['scss'],
      multipass:      [
        /@import[^;]+;/g,
        /\s*['"][^'"]+['"]\s*,?/g,
        /(?:['"])([^'"]+)/
      ]
    }))
    .pipe(sourcemaps.init())
    .pipe(sass())
    .on('error', gutil.log)
    .pipe(autoprefixer(conf.autoprefixer))
    .pipe(cmq())
    .pipe(gulpif(config.dependencies.js.minify, minifyCss()))
    .pipe(sourcemaps.write())
    .pipe(logger('stylesheets'))
    .pipe(gulp.dest(config.DEST_PATH + '/css'));
});

(function (handle) {
  var conf = config.dependencies.fonts, paths = getPaths(conf.path, conf.extensions);
  gulp.task('dependencies:fonts:watch', ['dependencies:fonts:build'], function () {
    return watch(paths, function (file) {
      return handle(conf, file.path);
    });
  });
  gulp.task('dependencies:fonts:build', [], function () {
    return handle(conf, paths);
  });
})(function (conf, paths) {
  return gulp.src(paths, {base: conf.path})
    .pipe(logger('fonts'))
    .pipe(gulp.dest(config.DEST_PATH + '/fonts'));
});

(function (handle) {
  var conf = config.dependencies.images, paths = getPaths(conf.path, conf.extensions);
  gulp.task('dependencies:images:watch', ['dependencies:images:build'], function () {
    return watch(paths, function (file) {
      return handle(conf, file.path);
    });
  });
  gulp.task('dependencies:images:build', [], function () {
    return handle(conf, paths);
  });
})(function (conf, paths) {
  return gulp.src(paths, {base: conf.path})
    .pipe(logger('images'))
    .pipe(gulp.dest(config.DEST_PATH + '/images'));
});

(function (handle) {
  var conf = config.dependencies.js;
  _.each(conf.paths, function (v, key) {
    if (!_.isArray(v)) {
      conf.paths[key] = [v];
    }
    conf.paths[key] = _.reduce(conf.paths[key], function (result, path, key) {
      if (path.indexOf('./') === 0) {
        path = path.slice(1);
      }
      if (path.indexOf(__dirname) !== 0) {
        path = __dirname + path;
      }
      return _.union(result, getPaths(path, conf.extensions));
    }, []);
  });
  gulp.task('dependencies:js:build', ['bower:dependencies'], function () {
    var result = [];
    _.each(conf.paths, function (paths, dest) {
      _.each(paths, function (path) {
        //console.log('path: ', path, '  dest: ', dest)
        result.push(handle(conf, path, dest));
      })
    });

    return Promise.all(result);
  });
  gulp.task('dependencies:js:watch', ['dependencies:js:build'], function () {
    var watchPaths = _.reduce(conf.paths, function (result, paths, key) {
      return _.union(result, paths);
    }, []);
    return watch(watchPaths, function (file) {
      _.each(conf.paths, function (paths, dest) {
        var base = matchPath(paths, file.path);
        if (base) {
          base = getBase(base);
          //console.log(file.path, dest, base)
          return handle(conf, file.path, dest, base)
        }
      });
    });
  });
})(function (conf, path, dest, base) {
  return new Promise(function (resolve, reject) {
    var rejecting = function () {
      console.error(arguments);
      reject(arguments)
    };
    gulp.src(path, {base: base})
      .on('error', rejecting)
      .pipe(gulpif('**/*.es6', babel(conf.babel.options)))
      .on('error', rejecting)
      .pipe(gulpif(conf.minify, uglify()))
      .on('error', rejecting)
      .pipe(logger('js'))
      .pipe(gulp.dest(config.DEST_PATH + '/js/' + dest))
      .on('error', rejecting)
      .on('end', resolve)
  });
});

(function (handle) {
  twig_compile.setTwig(require('twig'));
  var conf           = config.dependencies.views,
  watchBasePaths = [];
  conf.options.compileOptions.lookPaths = [];

  _.each(conf.paths, function (v, dest) {
    if (!_.isArray(v)) {
      conf.paths[dest] = [v];
    }
    conf.paths[dest] = _.reduce(conf.paths[dest], function (result, path) {
      conf.options.compileOptions.lookPaths.push(__dirname + path);//?!
      watchBasePaths.push({path: __dirname + path, dest: dest});
      return _.union(result, getPaths(__dirname + path, conf.extensions));
    }, []);
  });

  gulp.task('dependencies:views:build', function () {
    var result = [];
    _.each(conf.paths, function (paths, dest) {
      _.each(paths, function (path) {
        result.push(handle(conf, path, dest));
      })
    });

    return Promise.all(result);
  });

  gulp.task('dependencies:views:watch', ['dependencies:views:build'], function () {
    var watchPaths = _.reduce(conf.paths, function (result, paths, key) {
      return _.union(result, paths);
    }, []);
    conf.options.compileOptions.resetId = true;
    return watch(watchPaths, function (file) {
      _.each(watchBasePaths, function (v) {
        var path = v.path, dest = v.dest;
        if (file.path.indexOf(path) === 0) {
          return handle(conf, file.path, dest, path)
        }
      });
    });
  });
})(function (conf, paths, dest, base) {
  var conf = _.merge({}, conf);
  conf.options.compileOptions.id = function (file) {
    return dest + file.relative
  };
  return new Promise(function (resolve, reject) {
    var rejecting = function () {
      console.error(arguments);
      reject(arguments)
    };
    gulp.src(paths, {base: base})
      .on('error', rejecting)
      .pipe(twig_compile(conf.options))
      .on('error', rejecting)
      .pipe(gulpif(conf.minify, uglify()))
      .on('error', rejecting)
      .pipe(logger('views'))
      .pipe(gulp.dest(config.DEST_PATH + '/js/' + conf.options.compileOptions.viewPrefix + dest))
      .on('error', rejecting)
      .on('end', resolve);
  });
});

gulp.task('browsersync', function () {
  var conf = config.browsersync;
  browserSync.create();
  browserSync.init();
  gulp.watch(conf.watch).on('change', browserSync.reload)
});
gulp.task('watch/sync', [
  'browsersync',
  'watch'
], _.noop);

gulp.task('bootstrap', function(){
  var conf = config.dependencies.bootstrap;
  gulp.src(conf.path + '/**/*', {base: conf.path})
    .pipe(gulp.dest(config.DEST_PATH + '/bootstrap'))
});
gulp.task('watch', [
  'dependencies:js:watch',
  'dependencies:views:watch',
  'dependencies:stylesheets:watch',
  'dependencies:fonts:watch',
  'dependencies:images:watch'
], _.noop);
gulp.task('default', [
  'bower:dependencies',
  'bootstrap',
  'dependencies:js:build',
  'dependencies:stylesheets:build',
  'dependencies:views:build',
  'dependencies:fonts:build',
  'dependencies:images:build'
], _.noop);
