(function (angular, $) {
    'use strict';

    angular.module('sici')
            .controller('IndicadorCtrl', ['$scope', '$routeParams', '$rootScope', '$window', 'Indicador', 'acumulatorFunctions', 'toaster',
                function ($scope, $routeParams, $rootScope, $window, Indicador, acumulatorFunctions, toaster) {
                    $rootScope.nav = 'indicador';
                    $rootScope.setTitle('Indicadores');
                    $scope.functions = acumulatorFunctions;

                    $scope.indicadores = Indicador.query({idjerarquia: $routeParams.idjerarquia});
                    $scope.idindicador = ($routeParams.idindicador) ? ($routeParams.idindicador) : false;
                    
                    $scope.nuevo = new Indicador();
                    $scope.nuevo.idjerarquia = $scope.idjerarquia;
                    $scope.actualizar = function(indicador){
                            indicador.$update(function(){
                                    toaster.pop('success', 'Éxito', 'Indicador actualizado correctamente');
                            });
                    };
                    $scope.eliminar = function(indicador){
                            if ($window.confirm('¿Está seguro? Esta operación no es reversible.')){
                                    indicador.$delete(function(){
                                            $scope.indicadores = Indicador.query({idjerarquia: $routeParams.idjerarquia});
                                            toaster.pop('success', 'Éxito', 'Indicador eliminado correctamente');
                                    });
                            }
                    };
                    $scope.guardar = function(){
                            Indicador.save($scope.nuevo, function() {
                                    $scope.indicadores = Indicador.query({idjerarquia: $routeParams.idjerarquia});
                                    $scope.nuevo = new Indicador();
                                    $scope.nuevo.idjerarquia = $scope.idjerarquia;
                                    toaster.pop('success', 'Éxito', 'Indicador creado correctamente');
                            });
                    };
                    
                }]);

})(angular, $);