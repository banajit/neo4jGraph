'use strict';

(function (angular) {

angular.module('neo4jApp')
  .directive('header', function () {
    return {
      templateUrl: 'components/header/header.html',
      restrict: 'E',
      controller: 'HeaderCtrl'
    };
  });

})(angular)

