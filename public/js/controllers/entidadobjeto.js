(function(angular){
	'use strict';
	angular.module('sici')
		.controller('EntidadObjetoCtrl', ['$rootScope', '$scope', '$routeParams', '$window', '$http', 'EntidadObjeto',
			function ($rootScope, $scope, $routeParams, $window, $http, EntidadObjeto) {
				$rootScope.nav = 'EntidadObjeto';
				$rootScope.setTitle('Entidad Objeto');
				$scope.entidades = false;
				$scope.filtro = '';

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
						$rootScope.toaster('Carta de servicios fallida: ' + err.data.error , 'Error', 'error');
					});
				};
				$scope.download = function(entidadobjeto){
					$http.post('/api/v2/public/testDownloadCarta/' + entidadobjeto._id, {}).then(function(dato){
						$rootScope.toaster('Carta de servicios importada correctamente. Registrados ' + dato.data.objetivos.length + ' objetivos y ' + dato.data.indicadoresobtenidos.length + ' indicador/es.');
					}, function(err){
						if (err.data && err.data.error){
						$rootScope.toaster('Carta de servicios fallida: ' + err.data.error , 'Error', 'error');
						}else{
							$rootScope.toaster('Carta de servicios fallida', 'Error', 'error');
						}
					});
				};

				$scope.dropCarta = function(entidadobjeto){
					$http.post('/api/v2/public/dropCarta/' + entidadobjeto._id, {}).then(function(dato){
						$rootScope.toaster('Carta de servicios reseteada correctamente');
					}, function(err){
						if (err.data && err.data.error){
							$rootScope.toaster('Carta de servicios fallida: ' + err.data.error , 'Error', 'error');
						}else{
							$rootScope.toaster('Carta de servicios fallida', 'Error', 'error');
						}
					});
				};

			}
		]);
})(angular);
