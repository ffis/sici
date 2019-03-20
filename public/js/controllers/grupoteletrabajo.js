(function(angular, $){
	'use strict';
	angular.module('sici')
		.controller('GrupoTeletrabajoCtrl', ['$rootScope', '$scope', '$location', '$window', '$http', '$route', '$routeParams', '$timeout', 'ArbolWithEmptyNodes', 'ProcedimientoList', 'DetalleCarmProcedimiento', 'DetalleCarmProcedimiento2', 'Procedimiento','Jerarquia', 'RecalculateJerarquia',
			function ($rootScope, $scope, $location, $window, $http, $route, $routeParams, $timeout, ArbolWithEmptyNodes, ProcedimientoList, DetalleCarmProcedimiento, DetalleCarmProcedimiento2, Procedimiento, Jerarquia, RecalculateJerarquia) {
				$rootScope.nav = 'procedimiento';
				$rootScope.setTitle('Crear Grupo');

				$scope.idjerarquia = $routeParams.idjerarquia ? $routeParams.idjerarquia : false;
				$scope.camposfiltros = ['cod_plaza'];
				$scope.filtros = {};
				$scope.filtro = {};
				$scope.nodoseleccionado = false;
				$scope.padre = '';
				$scope.seleccionado = false;
				$scope.procedimiento = new Procedimiento();
				$scope.filtrosocultos = false;

				$scope.jerarquia = new Jerarquia();
/*
				$scope.$watch('seleccionado', function(_new){
					$scope.oallprocedimientos = ProcedimientoList.query({'idjerarquia': _new.id, 'recursivo': false});
					if ($scope.procedimiento.padre) {
						delete $scope.procedimiento.padre;
						$window.alert('El procedimiento padre debe pertenecer al mismo nodo de la jerarquía. Se obvia campo padre.');
					}
				});
*/

				$scope.guardar = function(){
					if ($scope.seleccionado && $scope.jerarquia.nombre && $scope.jerarquia.id && $scope.jerarquia.nombrelargo && parseInt($scope.jerarquia.id) > 0) {
						Jerarquia.get({id: $scope.jerarquia.id}).$promise.then(function(res) {
							if (parseInt(res.id) === parseInt($scope.jerarquia.id)) {
								alert('Ya existe un nodo con ese identificador');
							} else {

									 $scope.jerarquia.ancestro = $scope.seleccionado.id;
									 $scope.jerarquia.ancestros = $scope.seleccionado.ancestros;   //
									 Jerarquia.save($scope.jerarquia, function(){
										 RecalculateJerarquia.query().$promise.then(function () {
											 $window.alert('Grupo registrado correctamente. Actualizando árbol de organismos.');
											 $route.reload();
										 }, function(err) {
											 console.error(err);
											 $window.alert('Se ha producido un error recalculando datos.');
										 });
									});
							}
						}, function(err) {
							if (err.details) {
								$window.alert('Ha habido un error de conexión');
							}

					});

					} else {
						$window.alert('Imposible crear el grupo. Debe indicar todos los campos solicitados.');
					}
				};

				$scope.arbol = ArbolWithEmptyNodes.query(function(){
					if ($scope.idjerarquia){
						$scope.setJerarquiaById($scope.idjerarquia);
					}
				});
				$scope.oculto = false;

				$scope.filtrojerarquia = function() {
					/* function(item) es superusuario, no hace falta filtrar */
					return true;
				};

				$scope.setSeleccionado = function(seleccionad){
					if (seleccionad) {
						$scope.seleccionado = seleccionad;
						$rootScope.setTitle(seleccionad.title);
						$scope.cumplimentados = 0;
						$scope.count = 1;
						$scope.procedimiento.idjerarquia = seleccionad.id;
						$timeout(function(){
							$('body').animate({scrollTop: $('#detallesjerarquiaproc').offset().top}, 'slow');
						}, 20);
					}
				};

				$scope.isFiltroSelected = function(filtro, key, fa){
					return (typeof filtro[key] !== 'undefined' && fa.name === filtro[key]);
				};
			}
		]);
})(angular, $);
