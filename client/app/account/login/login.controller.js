'use strict';

(function (angular) {

function loginCtrl($scope, Auth, $state, $window) {

  /**
   * controller variables
   */
    var Login = this;
    Login.user = {};
    Login.errors = {};

  /**
   *Login user
   * @param form
   */

    Login.login = function(form) {
      Login.submitted = true;

      if (form.$valid) {
        Auth.login({
          username: Login.user.email,
          password: Login.user.password
        })
        .then(function() {
          // Logged in, redirect to home
          $state.go('graphEditor');
        })
        .catch(function(error) {
            Login.errors.other = error.message;
        });
      }
    };

  }

  angular.module('neo4jApp')
    .controller('LoginCtrl',loginCtrl);
})(angular);
