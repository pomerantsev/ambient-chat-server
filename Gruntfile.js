module.exports = function (grunt) {
  grunt.loadNpmTasks('grunt-mocha-test');

  grunt.initConfig({
    mochaTest: {
      src: ['test/**/*.js']
    }
  });

  grunt.registerTask('default', 'mochaTest');
};
