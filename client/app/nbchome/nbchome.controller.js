'use strict';

(function (angular) {

  function nbcomeCtrl($scope, $mdSidenav, CONSTANTS, Helper, $window, $timeout, $interval) {

    //adjust width for less resolution frame
    var sliderTracker = {};
    $scope.getCaraousalWidth = function(key,width) {
      width = (width == undefined)?$(document).width():width;
      if($('#caraousal-wrapper-' + key).is(':visible')) {
        angular.element('#caraousal-wrapper-' + key).width(width);
      }
      else {
        setCaraousalWidth(key,width);
      }
    }

    function setCaraousalWidth(key,width) {
      if($('#caraousal-wrapper-' + key).is(':visible')) {
       angular.element('#caraousal-wrapper-' + key).width(width);
       angular.element('.neo4j-slider').width($(document).width());
       delete sliderTracker[key];
      }
      else {
        sliderTracker[key] = $timeout(function () {
          setCaraousalWidth(key,width);
        });
      }
    }
    //configure caraousel slider
    var data = CONSTANTS.getConfig();
    var slideConfig = data.slideConfig;
    $scope.caraousalInterval = slideConfig.slideInterval;
    $scope.slides = data.slideUrls;
    //Stop caraousal on mouseover
    angular.element("#main-wrapper").hover(function(){
        $scope.caraousalInterval = -10;
    });


  };

  angular.module('neo4jApp')
    .controller('nbcomeCtrl', nbcomeCtrl)

})(angular)

