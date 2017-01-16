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
  })
  .run(function($rootScope, Auth, $state) {
    $rootScope.$on('$stateChangeStart', function(event, next) {
      Auth.isLoggedInAsync(function(loggedIn) {
        //check for user authentication
        if (!loggedIn && next.name === 'graphEditor') {
          event.preventDefault();
          $state.go('login');
        }

        //navigate to home if user is already authenticated
        if(loggedIn && next.name === 'graphEditor'){
          event.preventDefault();
          $state.go('graphEditor');
        }
        if(loggedIn && next.name === 'login'){
          event.preventDefault();
          $state.go('graphEditor');
        }

      });
    });
  });
})(angular)
