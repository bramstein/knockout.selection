module.exports = function (grunt) {
  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),
    connect: {
      server: {
        options: {
          base: "",
          port: 9999
        }
      }
    },
    watch: {},
    exec: {
      browserstacktest: {
        command: 'browserstack-test -u $BROWSERSTACK_USERNAME -p $BROWSERSTACK_PASSWORD -k $BROWSERSTACK_KEY -b browsers.json http://localhost:9999/test/index.html'
      }
    }
  });

  grunt.loadNpmTasks('grunt-contrib-connect');
  grunt.loadNpmTasks('grunt-exec');

  grunt.registerTask('browsertest', ['connect', 'exec:browserstacktest']);
};
