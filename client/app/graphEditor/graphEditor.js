'use strict';

(function (angular) {

angular.module('neo4jApp')
  .config(function($stateProvider) {
    $stateProvider
      .state('graphEditor', {
        url: '/graphEditor',
        templateUrl: 'app/graphEditor/graphEditor.html',
        controller: 'graphEditorCtrl',
        controllerAs: 'graphEditorCtrl'
      })
  });

})(angular)
