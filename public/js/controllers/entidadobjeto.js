(function(angular){
	'use strict';
	angular.module('sici')
		.controller('EntidadObjetoCtrl', ['$rootScope', '$scope', '$routeParams', '$window', '$http', 'EntidadObjeto', 'ObjetivoStats',
			function ($rootScope, $scope, $routeParams, $window, $http, EntidadObjeto, ObjetivoStats) {
				$rootScope.nav = 'EntidadObjeto';
				$rootScope.setTitle('Entidad Objeto');
				$scope.entidades = false;
				$scope.filtro = '';
				$scope.objetivostats = ObjetivoStats.query();
				$scope.getCount = function(_id){
					for (var i = 0, j = $scope.objetivostats.length; i < j; i++){
						if ($scope.objetivostats[i]._id === _id){
							return $scope.objetivostats[i].count;
						}
					}
					return 0;
				};
				$scope.getFormulasStats = function(_id){
					for (var i = 0, j = $scope.objetivostats.length; i < j; i++){
						if ($scope.objetivostats[i]._id === _id){
							var formsOK = 0, forms = 0;
							for (var k = 0, l = $scope.objetivostats[i].formulas.length; k < l; k++){
								for (var q = 0, w = $scope.objetivostats[i].formulas[k].length; q < w; q++ ){
									if ($scope.objetivostats[i].formulas[k][q] !== '[]'){
										formsOK++;
									}
									forms++;
								}
							}
							return formsOK + '/' + forms;
						}
					}
					return '0/0';
				};

				$scope.load = function(){
					$scope.entidades = EntidadObjeto.query();
				};
				$scope.load();
				$scope.actualizar = function(entidadobjeto, clave){
					entidadobjeto[clave] = entidadobjeto[clave].trim();
					entidadobjeto.$update().then(function(){
						$scope.cambios = [];
						$rootScope.toaster('Carta de servicios actualizada');
					}, function(err){
						$rootScope.toaster('Carta de servicios fallida: ' + err.data.error, 'Error', 'error');
					});
				};
				$scope.download = function(entidadobjeto){
					$http.post('/api/v2/public/testDownloadCarta/' + entidadobjeto._id, {}).then(function(dato){
						$rootScope.toaster('Carta de servicios importada correctamente. Registrados ' + dato.data.objetivos.length + ' objetivos y ' + dato.data.indicadoresobtenidos.length + ' indicador/es.');
					}, function(err){
						if (err.data && err.data.error){
							$rootScope.toaster('Carta de servicios fallida: ' + err.data.error, 'Error', 'error');
						} else {
							$rootScope.toaster('Carta de servicios fallida', 'Error', 'error');
						}
					});
				};

				$scope.dropCarta = function(entidadobjeto){
					$http.post('/api/v2/public/dropCarta/' + entidadobjeto._id, {}).then(function(){
						$rootScope.toaster('Carta de servicios reseteada correctamente');
					}, function(err){
						if (err.data && err.data.error){
							$rootScope.toaster('Carta de servicios fallida: ' + err.data.error, 'Error', 'error');
						} else {
							$rootScope.toaster('Carta de servicios fallida', 'Error', 'error');
						}
					});
				};

			}
		]);
})(angular);
