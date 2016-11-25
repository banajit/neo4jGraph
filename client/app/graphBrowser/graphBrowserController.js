'use strict';

(function (angular) {

  function graphBrowserCtrl($scope, $mdSidenav, CONSTANTS, $timeout, neo4jSrv) {
    $scope.toggleLeft = buildToggler('left');
      $scope.toggleRight = buildToggler('right');
      function buildToggler(componentId) {
        return function() {
          $mdSidenav(componentId).toggle();
        }
      }
      $scope.searchMaster = {};
      // ******************************
      // Load all configurations for graphdb access and leftsidebar
      // ******************************
      CONSTANTS.getConfig().success(function (data) {
         CONSTANTS.setStateVariable('config', data);
         var serverConfig = data.neo4jConfig;
         var params = {};
         /*var query = 'CALL db.propertyKeys();'
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
         }, timeout);*/
         $scope.searchMaster['propertiesKeys'] = data.searchPropertyKeys;
      });

      // ******************************
      // Search query for populating autocomplete box
      // ******************************
      $scope.loadValuesByProperty = function(queryStrn, propertyKey) {
         var config = CONSTANTS.getStateVariable('config');
         var serverConfig = config.neo4jConfig;
         var query = 'MATCH(s: SystemName) WHERE s.' + propertyKey + ' =~ "' + queryStrn + '.*" return s;';
         console.log(query);
         return neo4jSrv.executeCypherQuery(serverConfig, query).then(function(data) {
           var results = [];
           angular.forEach(data.results[0].data, function(Rvalue, Rkey){
             //var queryVal = {display:Rvalue.row[0][propertyKey], value:Rvalue.row[0][propertyKey]};
             results.push(Rvalue.row[0][propertyKey]);
           });
           var unique = results.filter(function(elem, index, self) {
               return index == self.indexOf(elem);
           })
           return unique;
         });

      }
  }

  angular.module('neo4jApp')
    .controller('graphBrowserCtrl', graphBrowserCtrl);

})(angular)
