'use strict';

(function (angular) {

var neo4jApp = angular.module('neo4jApp', [
  'ngCookies',
  'ngResource',
  'ngSanitize',
  'ui.router',
  'ui.bootstrap',
  'ngAnimate',
  'ngAria',
  'ngMaterial',
  'ngMdIcons',
  'slickCarousel',
  'ngToast',
  'dndLists'
])
  .config(function ($stateProvider, $urlRouterProvider, $locationProvider, $httpProvider) {
    $urlRouterProvider
      .otherwise('/home');
    $locationProvider.html5Mode(true);
    $httpProvider.interceptors.push('authInterceptor');
  })
  .run(['$rootScope', '$state', function ($rootScope, $state) {
    //Load config file
   /* CONSTANTS.getConfig().success(function (data) {
      CONSTANTS.setStateVariable('neo4jConfig', data);
    });*/
    // Redirect to login if route requires auth and the user is not logged in

  }]);
  var initInjector = angular.injector(['ng']);
  var $http = initInjector.get('$http');
  var $q = initInjector.get('$q');
  var configData = $http.get('config.json', {cache: false});
  var schema = $http.get('schema.json', {cache: false});
  $q.all([configData, schema]).then(function(values) {
      neo4jApp.constant('CONFIG', values[0].data);
      neo4jApp.constant('SCHEMA', values[1].data);
      angular.element(document).ready(function() {
        angular.bootstrap(document, ['neo4jApp']);
      });
  });
  /*$http.get('config.json').then(
    function (response) {
      neo4jApp.constant('CONFIG', response.data);
      angular.element(document).ready(function() {
        angular.bootstrap(document, ['neo4jApp']);
      });
    }
  );*/
})(angular);
