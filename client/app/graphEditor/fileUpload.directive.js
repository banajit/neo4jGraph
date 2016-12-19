'use strict';

(function (angular) {

angular.module('neo4jApp')
  .directive('apsUploadFile', function (neo4jSrv, ngToast) {
    return {
      template: '<input id="fileInput" type="file" class="ng-hide"><md-button id="uploadButton" class="md-fab md-mini md-ink-ripple" aria-label="attach_file"><i class="fa fa-paperclip" aria-hidden="true"></i></md-button> <md-input-container  md-no-float><input id="textInput" ng-model="fileName" type="text" placeholder="No file chosen" ng-readonly="true"></md-input-container>',
      restrict: 'E',
      link: function (scope, element, attrs) {
        scope.fileName = scope.node.url;
        var input = $(element[0].querySelector('#fileInput'));
        var button = $(element[0].querySelector('#uploadButton'));
        var textInput = $(element[0].querySelector('#textInput'));

        if (input.length && button.length && textInput.length) {
          button.click(function(e) {
            input.click();
          });
          textInput.click(function(e) {
            input.click();
          });
        }

        input.on('change', function(e) {
          var files = e.target.files;
          if (files[0]) {
            scope.fileName = 'uploads/' + files[0].name;
            scope.node.url = scope.fileName;
          } else {
            scope.fileName = null;
          }
          scope.$apply();
          scope.uploadPromise = neo4jSrv.uploadFile(files[0], 'upload')
            .success(function (d) {
               ngToast.create({
                 className: 'success',
                 content: 'File uploaded successfully.'
               });
            })
            .error(function () {
              return false;
            });
        });
      }
    };
  });

})(angular);
