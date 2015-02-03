(function(angular){
	'use strict';
	angular.module('sici')
	.controller('UpdateCtrl', ['$rootScope', '$scope', '$window', '$log', '$http', '$upload', 'Importacion',
		function ($rootScope, $scope, $window, $log, $http, $upload, Importacion) {
			$rootScope.nav = 'update';
			$scope.actualizando = 0;
			$window.document.title = 'SICI - Importación';
			$scope.respuestas = Importacion.query();

			$scope.remove = function(respuesta){
				if ($window.confirm('¿Está seguro de querer borrar esta importación? Esta operación no es reversible.')){
					//respuesta.$delete(function(){ $scope.respuestas = Importacion.query(); });
					$http.delete('/api/v1/public/importacion/' + respuesta._id, {}).success(function(){
						$scope.respuestas = Importacion.query();
					});
				}
			};

			$scope.confirm = function(respuesta){
				if ($window.confirm('¿Está seguro de querer aplicar esta importación? Esta operación no es reversible.')){
					$http.post('/api/v1/public/importacion/' + respuesta._id, {}).success(function(){
						$scope.respuestas = Importacion.query();
					});
				}
			};
			$scope.$watch('files', function() {
				if (!$scope.files){ return; }
				var $files = $scope.files;
				$log.log($files);
			//$files: an array of files selected, each file has name, size, and type.
				var progressfn = function(evt) {
					if (evt && evt.total){
						console.log('percent: ' + parseInt(100.0 * evt.loaded / evt.total));
					}
				};
				var successfn = function(data) {
					// file is uploaded successfully
					$log.log('Del servidor al cliente:' + data);
					$scope.actualizando--;
					$scope.respuestas = Importacion.query();
				};

				for (var i = 0; i < $files.length; i++) {
					var file = $files[i];
					$scope.actualizando++;
					$log.debug($upload);

					$scope.upload = $upload.upload({
						url: '/api/v1/public/updateByFile',
						file: file
					}).progress(progressfn).success(successfn);
				}
			});
	}]);
})(angular);
