(function(angular){
	'use strict';
	angular.module('sici')
		.controller('CartaPrintableCtrl',
			['EntidadObjeto', 'Objetivo', 'Indicador', '$scope', '$routeParams', '$rootScope', 'Jerarquia',
			function(EntidadObjeto, Objetivo, Indicador, $scope, $routeParams, $rootScope, Jerarquia){
				$scope.indicadores = {};
				$scope.jerarquias = {};
				var loadJerarquia = function(idjerarquia){
					if (typeof $scope.jerarquias[idjerarquia] === 'undefined'){
						$scope.jerarquias[idjerarquia] = Jerarquia.get({id: idjerarquia});
					}
				};
				$scope.cartaservicio = EntidadObjeto.get({'id': $routeParams.idcarta}, function(){
					$scope.loadObjetivos($scope.cartaservicio);
					$rootScope.setTitle($scope.cartaservicio.denominacion);
					$scope.jerarquia = Jerarquia.get({id: $scope.cartaservicio.idjerarquia}, function(){
						$scope.jerarquias[$scope.cartaservicio.idjerarquia] = $scope.jerarquia;
						$scope.jerarquia.ancestros.forEach(loadJerarquia);
					});
				});
				$scope.loadObjetivos = function(cartaservicio){
					var restrictions = { idjerarquia: cartaservicio.idjerarquia, carta: cartaservicio._id };
					var loadIndicador = function(indicador){
						if (typeof $scope.indicadores[indicador] === 'undefined'){
							$scope.indicadores[indicador] = Indicador.get({id: indicador});
						}
					};
					$scope.objetivos = Objetivo.query(restrictions, function(){
						for (var i = 0, j = $scope.objetivos.length; i < j; i++) {
							for (var k = 0, l = $scope.objetivos[i].formulas.length; k < l; k++) {
								$scope.objetivos[i].formulas[k].indicadores.forEach(loadIndicador);
							}
						}
					});
				};
			}]
		);
})(angular);
