'use strict';

(function (angular) {

  function signUpCtrl($scope, Auth, $state, $window) {

    /**
     * controller varibles
     */
    var SignUp = this;
    SignUp.user = {};
    SignUp.errors = {};

    /**
     * Signup user
     * @param form
     */
    SignUp.register = function (form) {
      SignUp.submitted = true;

      if (form.$valid) {
        Auth.createUser(SignUp.user)
          .then(function () {
            // Account created, redirect to home
            $state.go('home');
          })
          .catch(function (err) {
            err = err.data;
            $scope.errors = {};

          });
      }
    };

  }

  angular.module('neo4jApp')
    .controller('SignUpCtrl', signUpCtrl);;

})(angular)
