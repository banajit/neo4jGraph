'use strict';

(function (angular) {
  //Loader service
  function loaderService() {
    return {
      show: function (ele) {
        if (ele) {
          angular.element(ele).css('display', 'block');
        } else {
          angular.element('.loader').css('display', 'block');
        }
      },

      hide: function (ele) {
        if (ele) {
          angular.element(ele).css('display', 'none');
        } else {
          angular.element('.loader').css('display', 'none');
        }
      }
    }
  };

  angular.module('neo4jApp')
    .factory('LoaderService', loaderService)

})(angular);
