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
						var maxValuePerFormula = 0;
						for (var i = 0, j = $scope.objetivos.length; i < j; i++) {
							for (var k = 0, l = $scope.objetivos[i].formulas.length; k < l; k++) {
								$scope.objetivos[i].formulas[k].indicadores.forEach(loadIndicador);
								/*
								$scope.objetivos[i].formulas[k].valor = {};
								for (var anu in $scope.objetivos[i].formulas[k].valores){
									$scope.objetivos[i].formulas[k].valor[anu] = $scope.objetivos[i].formulas[k].valores[anu][ $scope.objetivos[i].formulas[k].valores[anu].length - 1 ].resultado;
								}
								maxValuePerFormula = 0;
								for (var y = 0, u = $scope.objetivos[i].formulas[k].intervalos.length; y < u; y++){
									if ( $scope.objetivos[i].formulas[k].intervalos[y].max > maxValuePerFormula){
										maxValuePerFormula = $scope.objetivos[i].formulas[k].intervalos[y].max;
									}
								}
								$scope.objetivos[i].formulas[k].uppervalue = Math.max($scope.objetivos[i].formulas[k].valor[anu], $scope.objetivos[i].formulas[k].meta, maxValuePerFormula);
								*/
							}
						}
					});
				};
			}]
		);
})(angular);

