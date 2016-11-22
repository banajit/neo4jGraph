/**
 * Created by banajit on 11/11/2016.
 */

'use strict';

(function (angular) {

angular.module('neo4jApp')
  .filter('trustAsResourceUrl', ['$sce', function($sce) {
        return function(val) {
            return $sce.trustAsResourceUrl(val);
        };
    }])

})(angular)
