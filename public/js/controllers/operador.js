(function(angular){
	'use strict';
	angular.module('sici')
		.controller('OperadorCtrl', [ '$rootScope', '$scope', '$window', '$routeParams', 'Operador',
			function ($rootScope, $scope, $window, $routeParams, Operador) {
				$rootScope.nav = 'operador';
				$rootScope.setTitle('Operadores');
				$scope.cambios = [];
				$scope.operadores = Operador.query();
				$scope.nuevo = new Operador();
				$scope.actualizar = function(regla){
					regla.$update(function(){
						$scope.cambios = [];
					});
				};
				$scope.eliminar = function(regla){
					if ($window.confirm('¿Está seguro? Esta operación no es reversible.'))
					{
						regla.$delete(function(){
							$scope.cambios = [];
							$scope.operadores = Operador.query();
						});
					}
				};
				$scope.guardar = function(){
					Operador.save($scope.nuevo, function() {
						$scope.operadores = Operador.query();
						$scope.nuevo = new Operador();
					});
				};
			}
		]);
})(angular);
