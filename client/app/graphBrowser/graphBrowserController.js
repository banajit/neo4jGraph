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
            var tempKeys = [];
            angular.forEach(data.results[0].data, function(value, key){
              //console.log('cypher', value.row[0]);
              //$scope.searchMaster['propertiesKeys'] = data.searchPropertyKeys;
              tempKeys.push(value.row[0]);
            });
            $scope.searchMaster['propertiesKeys'] = tempKeys;
         }, timeout);

      });

      // ******************************
      // Search query for populating autocomplete box
      // ******************************
      $scope.loadValuesByProperty = function(queryStrn, propertyKey) {
         var config = CONSTANTS.getStateVariable('config');
         var serverConfig = config.neo4jConfig;
         var query = 'MATCH(s) WHERE s.' + propertyKey + ' =~ "' + queryStrn + '.*" return s;';
         console.log('Property Value Search = ', query);
         return neo4jSrv.executeCypherQuery(serverConfig, query).then(function(data) {
           var results = [];
           angular.forEach(data.results[0].data, function(Rvalue, Rkey){
             results.push(Rvalue.row[0][propertyKey]);
           });
           var unique = results.filter(function(elem, index, self) {
               return index == self.indexOf(elem);
           })
           return unique;
         });

      }
      // ******************************
      // Filter graph on search form submit
      // ******************************
      $scope.selectedItem = {};
      $scope.filterGraph = function() {
        var conditions = [], whereCond = '';
        angular.forEach($scope.selectedItem, function(value, key){
          if(value !== null) {
            var cond = 'n.' + key + ' = ' + '"' + value + '"';
            conditions.push(cond);
          }
        });
        if(conditions.length>0) {
          whereCond = ' WHERE ' + conditions.join(' AND ');
        }
        //var query = 'MATCH (n) ' + whereCond + ' MATCH ()-[r]->() RETURN n,r';
        var query = 'MATCH (n)-[r]-(m) ' + whereCond + ' RETURN n,r,m';
        console.log('Search Query = ', query);
        var config = CONSTANTS.getStateVariable('config');
        var serverConfig = config.neo4jConfig;
        var graphMetaInfo = {serverConfig:serverConfig, neo4jQuery:query};
        $scope.toggleLeft();
        $scope.$broadcast('refreshGraph', graphMetaInfo);
      }
      //Reset graph
      $scope.resetGraph = function() {
        var query = 'MATCH (n) MATCH ()-[r]->() RETURN n,r';
        var config = CONSTANTS.getStateVariable('config');
        var serverConfig = config.neo4jConfig;
        var graphMetaInfo = {serverConfig:serverConfig, neo4jQuery:query};
        $scope.$broadcast('refreshGraph', graphMetaInfo);
        $timeout(function () {
           $scope.toggleLeft();
        }, 10);
        $scope.searchForm.$setPristine();
        $scope.searchForm.$setUntouched();
        $scope.selectedItem = {};
      }
  }

  angular.module('neo4jApp')
    .controller('graphBrowserCtrl', graphBrowserCtrl);

})(angular)
