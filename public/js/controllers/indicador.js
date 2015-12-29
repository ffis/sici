(function (angular, $) {
    'use strict';

    angular.module('sici')
            .controller('IndicadorCtrl', ['$scope', '$routeParams', '$rootScope', '$window', 'Indicador', 'acumulatorFunctions',
                function ($scope, $routeParams, $rootScope, $window, Indicador, acumulatorFunctions) {
                    $rootScope.nav = 'indicador';
                    $rootScope.setTitle('Indicadores');
                    $scope.functions = acumulatorFunctions;

                    $scope.indicadores = Indicador.query({idjerarquia: $routeParams.idjerarquia});
                    $scope.idindicador = ($routeParams.idindicador) ? ($routeParams.idindicador) : false;
                    
                    $scope.nuevo = new Indicador();
                    $scope.nuevo.idjerarquia = $scope.idjerarquia;
                    $scope.actualizar = function(indicador){
                            indicador.$update(function(){
                                    $rootScope.toaster('Indicador actualizado correctamente', 'Éxito', 'success');
                            });
                    };
                    $scope.eliminar = function(indicador){
                            if ($window.confirm('¿Está seguro? Esta operación no es reversible.')){
                                    indicador.$delete().then(function(){
                                            $scope.indicadores = Indicador.query({idjerarquia: $routeParams.idjerarquia});
                                            $rootScope.toaster('Indicador eliminado correctamente', 'Éxito', 'success');
                                    }, function(error) {
										console.log(error.data.error);
										$rootScope.toaster(error.data.error, 'Error', 'error');
									});
                            }
                    };
                    $scope.guardar = function(){
                            Indicador.save($scope.nuevo, function() {
                                    $scope.indicadores = Indicador.query({idjerarquia: $routeParams.idjerarquia});
                                    $scope.nuevo = new Indicador();
                                    $scope.nuevo.idjerarquia = $scope.idjerarquia;
                                    $rootScope.toaster('Indicador creado correctamente', 'Éxito', 'success');
                            });
                    };
                    
                }]);

})(angular, $);