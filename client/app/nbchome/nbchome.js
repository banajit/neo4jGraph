'use strict';

(function (angular) {

angular.module('neo4jApp')
  .config(function($stateProvider) {
    $stateProvider
      .state('nbcomeCtrl', {
        url: '/',
        templateUrl: 'app/nbchome/nbchome.html',
        controller: 'nbcomeCtrl',
        controllerAs: 'Home',
        authenticate: true,
      })
  });

})(angular)
