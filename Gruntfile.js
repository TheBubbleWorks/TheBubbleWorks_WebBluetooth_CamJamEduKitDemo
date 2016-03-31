module.exports = function(grunt) {

	grunt.initConfig({

        pkg: grunt.file.readJSON('package.json'),

        clean: ['dist'],

        copy: {
            app: {
                expand: true,
                cwd: "app/",
                src: ['*.css', 'images/**/*', 'img/**/*', '!Gruntfile.js', 'conf/**/*', 'scripts/**/*', 'elements/**/*', 'styles/**/*', '*.html', 'favicon.ico'],
                dest: 'dist/',
            },


            // manually copy some resources (need look at the Vulcanise options to include these automatically)
            dep_subset: {
                expand: true,
                cwd: "app/bower_components",
                src: ['webcomponentsjs/**/*', 'font-roboto/**/*', 'paper-color-picker/**/*'],
                dest: 'dist/bower_components',
            }

            // There should no need to copy as we vulcanise the included elements into a single elements.html file later
            //bower: {
            //    expand: true,
            //    cwd: "app/bower_components",
            //    src: ['**/*'],
            //    dest: 'dist/bower_components',
            //},
        },

        vulcanize: {
            default: {
                options: {
                    inlineScripts: true,
                    inlineCss: true,
                    stripComments: true,
                },
                files: {
                    'dist/elements/elements.html': 'app/elements/elements.html'
                },
            },
        },

        // see: https://babeljs.io
        // Note: tjis lets the app use features like 'arrow syntax' but doesn't alter any libraries.
        babel: {
            options: {
                sourceMap: true,
                presets: ['es2015']
            },
            dist: {
                files: {
                    'dist/scripts/app.js': 'app/scripts/app.js'
                }
            }
        },

        watch: {
            options: {
                livereload: true,
            },
            files: ['app/**/*', '!app/bower_components/**/*.*'],
            tasks: ['default'],
        },

        connect: {
            server: {
                options: {
                    hostname: '*',
                    port: 3141,
                    protocol: 'https',
                    // Only need these if you want to overide the built-in self-signed certificate
                    //key: grunt.file.read('server.key').toString(),
                    //cert: grunt.file.read('server.crt').toString(),
                    //ca: grunt.file.read('ca.crt').toString(),
                    //keepalive: true,      // don't enable because of subseqeunt 'watch' task
                    base: 'dist'
                },
            },
        },

        'gh-pages': {
            options: {
                base: 'dist'
            },
            src: ['**']
        }
	});


    // Find the development onlt grunt-* dependencies from package.json
    require('matchdep').filterDev('grunt-*').forEach(grunt.loadNpmTasks);
    // The above replaces lots of manual entries:
    //grunt.loadNpmTasks('grunt-contrib-connect')  etc.


    //grunt.registerTask('default', ['clean', 'copy:all']);
    grunt.registerTask('default', ['clean', 'copy:app', 'copy:dep_subset', 'vulcanize']);
    grunt.registerTask('serve', ['default',  'connect:server', 'watch',]);
    grunt.registerTask('publish', ['default', 'gh-pages']);

};
