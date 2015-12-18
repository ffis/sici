(function (angular, $) {
    'use strict';

    angular.module('sici')
            .controller('ObjetivoCtrl', ['$rootScope', '$scope', '$routeParams', '$window', 'Objetivo', 'Indicador',
                function ($rootScope, $scope, $routeParams, $window, Objetivo, Indicador) {
                    $rootScope.nav = 'objetivo';
                    $rootScope.setTitle('Objetivos');
                    
                    $scope.colores = [{name: 'Peligro', value: 'danger'},
                        {name: 'Aviso', value: 'warning'},
                        {name: 'Éxito', value: 'success'}];
                    
                    $scope.indicadores = [];
                    $scope.idobjetivo = ($routeParams.idobjetivo) ? $routeParams.idobjetivo : false;
                    $scope.objetivo = Objetivo.get({id: $scope.idobjetivo}, function () {
                        for (var k = 0, l = $scope.objetivo.formulas.length; k < l; k++) {
                            $scope.indicadores[k] = {};
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
                        console.log(formula.intervalos);
                        formula.intervalos.splice(intervalo, 1);
                    };

                    $scope.desvincular = function (indexFormula, indicadorid) {
                        if ($window.confirm('¿Está seguro de desvincular el indicador?')) {
                            $scope.objetivo.formulas[indexFormula].indicadores.splice(indicadorid, 1);
                            console.log($scope.indicadores[indexFormula]);
                            $scope.actualizar();
                        }
                    };

                    $scope.actualizar = function () {
                        $scope.objetivo.$update(function () {

                        });
                    };

                }]);

})(angular, $);