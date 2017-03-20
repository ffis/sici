(function(angular){
	'use strict';
	angular.module('sici').controller('UpdateCtrl',
		['$rootScope', '$scope', '$window', '$http', '$q', 'Upload', 'Importacion',
			function ($rootScope, $scope, $window, $http, $q, Upload, Importacion) {
				$rootScope.nav = 'update';
				$scope.actualizando = 0;
				$rootScope.setTitle('Importación');
				$scope.respuestas = Importacion.query();

				function failedfn(err){
					$rootScope.toaster(err.error ? err.error : err, 'error', 'error');
				}

				$scope.remove = function(respuesta){
					if ($window.confirm('¿Está seguro de querer borrar esta importación? Esta operación no es reversible.')){
						$http.delete('/api/v1/public/importacion/' + respuesta._id, {}).then(function(){
							$rootScope.toaster('Importación eliminada');
							$scope.respuestas = Importacion.query();
						}, failedfn);
					}
				};

				$scope.confirm = function(respuesta){
					if ($window.confirm('¿Está seguro de querer aplicar esta importación? Esta operación no es reversible.')){
						$http.post('/api/v1/public/importacion/' + respuesta._id, {}).then(function(){
							$rootScope.toaster('Importación aplicada');
							$scope.respuestas = Importacion.query();
						}, failedfn);
					}
				};

				function successfn() {

					$scope.actualizando = 0;
					$scope.respuestas = Importacion.query();
				}

				$scope.$watch('files', function() {
					if (!$scope.files){
						return;
					}

					//$files: an array of files selected, each file has name, size, and type.
					$scope.actualizando = $scope.files.length;
					var defers = $scope.files.map(function(file){

						return Upload.upload({
							'url': '/api/v1/public/updateByFile',
							'file': file
						});
					});

					$q.all(defers).then(successfn, failedfn);
				});
			}
		]
	);
})(angular);
