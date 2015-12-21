(function (angular, $) {
    'use strict';

    angular.module('sici')
            .controller('ObjetivoCtrl', ['$rootScope', '$scope', '$routeParams', '$window', 'Objetivo', 'Indicador', 'EntidadObjeto', 'toaster',
                function ($rootScope, $scope, $routeParams, $window, Objetivo, Indicador, EntidadObjeto, toaster) {
                    $rootScope.nav = 'objetivo';
                    $rootScope.setTitle('Objetivos');
                    
                    $scope.colores = [{name: 'Peligro', value: '#C50200'},
                        {name: 'Aviso', value: '#FF7700'},
						{name: 'Normal', value: '#DEDEDE'},
                        {name: 'Éxito', value: '#8DCA2F'}];
					
					$scope.indicadores = [];
                    $scope.idobjetivo = ($routeParams.idobjetivo) ? $routeParams.idobjetivo : false;
                    $scope.objetivo = Objetivo.get({id: $scope.idobjetivo}, function () {
						$scope.carta = EntidadObjeto.get({id: $scope.objetivo.carta}, function() {
							$scope.indicadoresNodo = Indicador.query({idjerarquia: $scope.carta.idjerarquia});
						});
                        for (var k = 0, l = $scope.objetivo.formulas.length; k < l; k++) {
                            for (var i = 0, j = $scope.objetivo.formulas[k].indicadores.length; i < j; i++) {
                                var indicador = $scope.objetivo.formulas[k].indicadores[i];
                                if (typeof $scope.objetivo.formulas[k].indicadores[indicador] === 'undefined') {
                                    $scope.indicadores[indicador] = Indicador.get({id: indicador});
                                }
                            }
                        }
                    });
                    
                    $scope.crearNuevoIntervalo = function (formula) {
                        if (typeof formula.intervalos === 'undefined') {
                            formula.intervalos = [];
                        }
                        formula.intervalos.push({});
                    };

                    $scope.borrarIntervalo = function (formula, intervalo) {
                        console.log("Borro intervalo " + intervalo + " del array ");
                        formula.intervalos.splice(intervalo, 1);
                    };

                    $scope.desvincular = function (indexFormula, indicadorid) {
                        if ($window.confirm('¿Está seguro de desvincular el indicador?')) {
                            $scope.objetivo.formulas[indexFormula].indicadores.splice(indicadorid, 1);
//                            $scope.actualizar();
                        }
                    };

                    $scope.actualizar = function () {
                        $scope.objetivo.$update(function () {
							toaster.pop('success', 'Éxito', 'Objetivo actualizado correctamente');
                        });
                    };
                    
                    $scope.vincularIndicador = function(formula, nuevo) {
						if(formula.indicadores.indexOf(nuevo._id) !== -1) {
							toaster.pop('warning', 'Aviso', 'Ya existe ese indicador en la fórmula');
							return;
						}
                        $scope.indicadores[nuevo._id] = nuevo;
                        formula.indicadores.push(nuevo._id);
                    };
					
					$scope.subirOrden = function(formula, index) {
						if (index === 0) {
							return;
						}
						var indicadorTemporal = formula.indicadores[index-1];
						formula.indicadores[index-1] = formula.indicadores[index];
						formula.indicadores[index] = indicadorTemporal;
					};
					
					$scope.bajarOrden = function(formula, index) {
						if (index >= formula.indicadores.length) {
							return;
						}
						var indicadorTemporal = formula.indicadores[index+1];
						formula.indicadores[index+1] = formula.indicadores[index];
						formula.indicadores[index] = indicadorTemporal;
					};
                }]);

})(angular, $);