'use strict';
(function (angular) {


  function Auth($http, $cookieStore, $q, Config) {
    var currentUser = {};
    var token = $cookieStore && $cookieStore.get('token');


    return {

      /**
       * Authenticate user and save token
       *
       * @param  {Object}   user     - login info
       * @param  {Function} callback - optional
       * @return {Promise}
       */
      login: function (user, callback) {
        var cb = callback || angular.noop;
        var deferred = $q.defer();
        $http({
            method: 'POST',
            url: 'api/authenticate',
            headers: {'Content-Type': 'application/x-www-form-urlencoded'},
            transformRequest: function(obj) {
                var str = [];
                for(var p in obj)
                str.push(encodeURIComponent(p) + "=" + encodeURIComponent(obj[p]));
                return str.join("&");
            },
            data: {user: user.username, password: user.password}
        }).success(function (data) {
            $cookieStore.put('token', data.token);
            deferred.resolve(data);
            return cb();
        }).
        error(function (err) {
          this.logout();
          deferred.reject(err);
          return cb(err);
        }.bind(this));
        return deferred.promise;
      },

      /**
       * Delete access token and user info
       *
       * @param  {Function}
       */
      logout: function () {
        $cookieStore.remove('token');
        currentUser = {};
      },



      /**
       * Waits for currentUser to resolve before checking if user is logged in
       */
      isLoggedInAsync: function (cb) {
        var deferred = $q.defer();
        if(this.getToken()) {
          $http({
              method: 'POST',
              url: 'api/validateToken',
              headers: {'Content-Type': 'application/x-www-form-urlencoded'},
              transformRequest: function(obj) {
                  var str = [];
                  for(var p in obj)
                  str.push(encodeURIComponent(p) + "=" + encodeURIComponent(obj[p]));
                  return str.join("&");
              },
              data: {token: this.getToken()}
          }).success(function (data) {
             cb(true);
          }).
          error(function (err) {
            this.logout();
            deferred.reject(err);
            return cb(err);
          }.bind(this));
        }
        else {
          cb(false);
        }
      },


      /**
       * Get auth token
       */
      getToken: function () {
        return $cookieStore.get('token');
      }
    };
  };

  angular.module('neo4jApp')
    .factory('Auth', Auth)
})(angular);
