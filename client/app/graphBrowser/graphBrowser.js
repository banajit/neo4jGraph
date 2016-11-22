'use strict';

(function (angular) {

angular.module('neo4jApp')
  .config(function($stateProvider) {
    $stateProvider
      .state('graphBrowser', {
        url: '/graphBrowser',
        templateUrl: 'app/graphBrowser/graphBrowser.html',
        controller: 'graphBrowserCtrl',
        controllerAs: 'graphBrowserCtrl'
      })
  });

})(angular)
