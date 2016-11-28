'use strict';

(function (angular) {

angular.module('neo4jApp', [
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
  'ngToast'
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
})(angular);
