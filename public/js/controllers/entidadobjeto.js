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
					entidadobjeto.$update(function(){
						$scope.cambios = [];
					});
				};
				$scope.download = function(entidadobjeto){
					$http.get('/api/v2/public/testDownloadCarta/' + entidadobjeto._id, function(dato){
						console.log(dato);
					});
				};
			}
		]);
})(angular);
