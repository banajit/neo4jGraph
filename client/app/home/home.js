'use strict';

(function (angular) {

angular.module('neo4jApp')
  .config(function($stateProvider) {
    $stateProvider
      .state('home', {
        url: '/home',
        templateUrl: 'app/home/home.html',
        controller: 'HomeCtrl',
        controllerAs: 'Home',
        authenticate: true
      })
  });

})(angular)
