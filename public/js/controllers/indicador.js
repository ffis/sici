(function (angular) {
	'use strict';

	angular.module('sici')
			.controller('IndicadorCtrl', ['$scope', '$routeParams', '$rootScope', '$window', '$log', 'Indicador', 'Jerarquia', 'acumulatorFunctions', 'UsosIndicadores',
				function ($scope, $routeParams, $rootScope, $window, $log, Indicador, Jerarquia, acumulatorFunctions, UsosIndicadores) {
					$rootScope.nav = 'indicador';
					$rootScope.setTitle('Indicadores');
					$scope.functions = acumulatorFunctions;
					$scope.cumplimentaciones = {};
					$scope.frecuenciasIndicadores = ['anual', 'mensual', 'bimestral', 'trimestral', 'cuatrimestral', 'semestral', 'bienal', 'discrecional'];
					$scope.tiposIndicadores = ['Conformidad', 'Servicio', 'Satisfacción', 'Gestión', 'Gestión-SICI-Actividad'];
					$scope.idjerarquia = $routeParams.idjerarquia;
					$scope.organismo = Jerarquia.get({id: $scope.idjerarquia });
					$scope.indicadores = Indicador.query({idjerarquia: $scope.idjerarquia}, function(){
						for (var i = 0, j = $scope.indicadores.length; i < j; i++){
							$scope.cumplimentaciones[$scope.indicadores[i]._id] = [];
							for (var anualidad in $scope.indicadores[i].valores){
								$scope.cumplimentaciones[$scope.indicadores[i]._id].push( {
									anualidad: anualidad.replace('a', ''),
									cumplimentado: $rootScope.isIndicadorCumplimentado($scope.indicadores[i], anualidad)
								});
							}
							$scope.cumplimentaciones[$scope.indicadores[i]._id].sort( function(a, b){ return a.anualidad - b.anualidad; } );
						}
					});
					$scope.idindicador = ($routeParams.idindicador) ? ($routeParams.idindicador) : false;
					$scope.usosIndicadores = {};
					UsosIndicadores.query(function(usos){
						for (var i = 0, j = usos.length; i < j; i++){
							$scope.usosIndicadores[ usos[i]._id ] = usos[i].count;
						}
					});


					$scope.nuevo = new Indicador();
					$scope.nuevo.idjerarquia = $scope.idjerarquia;
					$scope.nuevo.nombre = '';
					$scope.actualizar = function(indicador){
						indicador.$update(function(){
							$rootScope.toaster('Indicador actualizado correctamente', 'Éxito', 'success');
						}, function(error) {
							$log.log(error.data.error);
							$rootScope.toaster(error.data.error, 'Error', 'error');
						});
					};
					$scope.eliminar = function(indicador){
						if ($window.confirm('¿Está seguro? Esta operación no es reversible.')){
							indicador.$delete().then(function(){
								$scope.indicadores = Indicador.query({idjerarquia: $scope.idjerarquia});
								$rootScope.toaster('Indicador eliminado correctamente', 'Éxito', 'success');
							}, function(error) {
								$log.log(error.data.error);
								$rootScope.toaster(error.data.error, 'Error', 'error');
							});
						}
					};
					$scope.guardar = function(){
						if ($scope.nuevo.nombre.trim() !== ''){
							$scope.nuevo.nombre = $scope.nuevo.nombre.trim();
							$scope.nuevo.$save().then(function() {
								$scope.indicadores = Indicador.query({idjerarquia: $scope.idjerarquia});
								$scope.nuevo = new Indicador();
								$scope.nuevo.idjerarquia = $scope.idjerarquia;
								$scope.nuevo.nombre = '';
								$rootScope.toaster('Indicador creado correctamente', 'Éxito', 'success');
							}, function(error) {
								$log.log(error.data.error);
								$rootScope.toaster(error.data.error, 'Error', 'error');
							});
						}
					};


				}]);

})(angular);