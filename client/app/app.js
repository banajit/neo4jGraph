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
  'ngMessages',
  'ngMdIcons',
  'slickCarousel',
  'ngToast',
  'dndLists',
  'cgBusy'
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
  var configData = $http.get('config.json?ts=' + Date.now(), {cache: false});
  var schema = $http.get('schema.json?ts=' + Date.now(), {cache: false});
  $q.all([configData, schema]).then(function(values) {
      neo4jApp.constant('CONFIG', values[0].data);
      neo4jApp.constant('SCHEMA', values[1].data);
      angular.element(document).ready(function() {
        angular.bootstrap(document, ['neo4jApp']);
      });
  });
})(angular);
function updateNode(node) {
  var scope = angular.element('#nbc-graph-editor').scope();
  jQuery('.sigma-tooltip-editor').remove();
  jQuery('.sigma-tooltip').remove();
  scope.$apply(function () {
    scope.$broadcast('nodeUpdate', node);
  });
}
function deleteNode(node) {
  var scope = angular.element('#nbc-graph-editor').scope();
  jQuery('.sigma-tooltip-editor').remove();
  jQuery('.sigma-tooltip').remove();
  scope.$apply(function () {
    scope.$broadcast('nodeDelete', node);
  });
}

function updateEdge(edge, sourceNode, targetNode) {
  var scope = angular.element('#nbc-graph-editor').scope();
  jQuery('.sigma-tooltip-editor').remove();
  jQuery('.sigma-tooltip').remove();
  var data = {edge:edge, sourceNode:sourceNode, targetNode:targetNode};
  scope.$apply(function () {
    scope.$broadcast('edgeUpdate', data);
  });
}
function deleteEdge(edge, sourceNode, targetNode) {
  var scope = angular.element('#nbc-graph-editor').scope();
  jQuery('.sigma-tooltip-editor').remove();
  jQuery('.sigma-tooltip').remove();
  scope.$apply(function () {
    var data = {edge:edge, sourceNode:sourceNode, targetNode:targetNode};
    scope.$broadcast('edgeDelete', data);
  });
}


