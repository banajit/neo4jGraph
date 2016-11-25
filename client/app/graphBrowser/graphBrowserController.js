'use strict';

(function (angular) {

  function graphBrowserCtrl($scope, $mdSidenav, CONSTANTS) {
    $scope.toggleLeft = buildToggler('left');
      $scope.toggleRight = buildToggler('right');
      function buildToggler(componentId) {
        return function() {
          $mdSidenav(componentId).toggle();
        }
      }
      CONSTANTS.getConfig().success(function (data) {
         var serverConfig = data.neo4jConfig;
         var params = {};
         var query = 'CALL db.propertyKeys();'
         var neo4j = { url: serverConfig.serverUrl, user: serverConfig.user, password: serverConfig.password };
         var endpoint = '/db/data/transaction/commit', timeout = -1;
         var data = JSON.stringify({
           "statements": [
               {
                   "statement": query,
                   "params": {},
                   "includeStats": false
               }
           ]
         });
         sigma.neo4j.send(neo4j, endpoint, 'POST', data,
         function(data) {
            console.log('cypher', data);
            angular.forEach(data.results[0].data, function(value, key){
              console.log('cypher', value.row[0]);
            });
         }, timeout);
      });

  }

  angular.module('neo4jApp')
    .controller('graphBrowserCtrl', graphBrowserCtrl);

})(angular)
