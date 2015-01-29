(function(angular, confirm){
	'use strict';
	angular.module('sici')
		.controller('EtiquetaCtrl', [ '$rootScope', '$scope', '$window', '$routeParams', 'Etiqueta',
			function ($rootScope, $scope, $window, $routeParams, Etiqueta) {
				$rootScope.nav = 'etiqueta';
				$window.document.title = 'SICI: Etiquetas';
				$scope.cambios = [];
				$scope.etiquetas = Etiqueta.query();
				$scope.nuevo = new Etiqueta();
				$scope.actualizar = function(regla){
					regla.$update(function(){
						$scope.cambios = [];
					});
				};
				$scope.eliminar = function(regla){
					if (confirm('¿Está seguro? Esta operación no es reversible.'))
					{
						regla.$delete(function(){
							$scope.cambios = [];
							$scope.etiquetas = Etiqueta.query();
						});
					}
				};
				$scope.guardar = function(){
					Etiqueta.save($scope.nuevo, function() {
						$scope.etiquetas = Etiqueta.query();
						$scope.nuevo = new Etiqueta();
					});
				};
			}
		]);
})(angular, confirm);
