module.exports = function(grunt) {

	var distDir = "./dist/";
	var distArchive = "./dist/ext.zip";

	// Project configuration.
	grunt.initConfig({
		pkg: grunt.file.readJSON('package.json'),
		clean: {
			dist: [distDir + '**', distArchive]
		},
		copy: {
			dist: {
				files: [
					{ 
						expand: true, 
						src: [
							'{js,images,_locales,panes,css}/**',
							'*.{js,html}',
							'!Gruntfile.js',
							'LICENSE.txt',
							'NOTICE'],
						dest: distDir
					}
				]	
			}
		},
		usebanner: {
			dist: {
				options: {
					position: 'top',
					banner: '/* Copyright 2017+ Joel Thornton <sidewise@joelpt.net> See LICENSE.txt for license details. */',
					linebreak: true
				},
				files: {
					src: [distDir + '**/*.js', '!**/jquery/*', ]
				}
			}
		},
		compress: {
			dist: {
				options: {
					archive: distArchive
				},
				files: [
					{ 
						expand: true,
						cwd: distDir,
						src: ['**/*' ], 
						dest: '/' 
					}
				]
			}

		}
	});

	grunt.loadNpmTasks('grunt-contrib-clean');
	grunt.loadNpmTasks('grunt-contrib-compress');
	grunt.loadNpmTasks('grunt-contrib-copy');
	grunt.loadNpmTasks('grunt-banner');

	// Default task(s).
	grunt.registerTask('default', ['clean', 'copy', 'usebanner', 'compress']);

};
