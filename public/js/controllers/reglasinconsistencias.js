(function(angular){
	'use strict';
	angular.module('sici')
		.controller('ReglasInconsistenciasCtrl', ['$rootScope', '$scope', '$window', '$routeParams', 'ReglasInconsistencias',
			function ($rootScope, $scope, $window, $routeParams, ReglasInconsistencias) {
				$window.document.title = 'SICI: Reglas Inconsistencias';
				$scope.cambios = [];
				$scope.inconsistencias = ReglasInconsistencias.query();
				$scope.nuevo = new ReglasInconsistencias();
				$scope.actualizar = function(regla){
					regla.$update(function(){
						$scope.cambios = [];
					});
				};
				$scope.eliminar = function(regla){
					if ($window.confirm('¿Está seguro? Esta operación no es reversible.')){
						regla.$delete(function(){
							$scope.cambios = [];
							$scope.inconsistencias = ReglasInconsistencias.query();
						});
					}
				};
				$scope.guardar = function(){
					ReglasInconsistencias.save($scope.nuevo, function() {
						$scope.inconsistencias = ReglasInconsistencias.query();
						$scope.nuevo = new ReglasInconsistencias();
					});
				};
			}
		]);
})(angular);
