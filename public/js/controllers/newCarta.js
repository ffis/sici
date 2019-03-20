(function(angular, $){
	'use strict';
	angular.module('sici')
		.controller('NewCartaCtrl', ['$rootScope', '$scope', '$location', '$window', '$http', '$route', '$routeParams', '$timeout', 'ArbolWithEmptyNodes', 'EntidadObjeto','Procedimiento','Jerarquia',
			function ($rootScope, $scope, $location, $window, $http, $route, $routeParams, $timeout, ArbolWithEmptyNodes, EntidadObjeto,Procedimiento, Jerarquia) {
				$rootScope.nav = 'newCarta';
				$rootScope.setTitle('Crear Carta');

				$scope.idjerarquia = $routeParams.idjerarquia ? $routeParams.idjerarquia : false;
				$scope.camposfiltros = ['cod_plaza'];
				$scope.filtros = {};
				$scope.filtro = {};
				$scope.nodoseleccionado = false;
				$scope.padre = '';
				$scope.seleccionado = false;
				$scope.responsable = '';
				$scope.filtrosocultos = false;
	$scope.procedimiento = new Procedimiento();
				$scope.carta = new EntidadObjeto();
				$scope.carta.denominacion = '';
				$scope.carta.responsable = '';
				$scope.carta.tipoentidad = 'CS';
				$scope.carta.url = 'http://';
				$scope.carta.expediente = '';
				$scope.carta.eliminado = false;

				$scope.load = function(){
					$scope.entidades = EntidadObjeto.query( function(){
						$scope.carta.codigo = $scope.entidades.length + 1;
					});
				};



				$scope.guardar = function(){
					if ($scope.carta.denominacion && $scope.seleccionado && $scope.carta.expediente) {
						$scope.carta.idjerarquia = $scope.seleccionado.id;
						$scope.carta.fechaalta = new Date();
						$scope.carta.fechaversion = new Date();
						$scope.carta.fechafin = null;
						$scope.load();
						EntidadObjeto.save($scope.carta).$promise.then(function(){
							$http.get('/api/v1/restricted/fjerarquia').then(function () {
								$window.alert('Carta creada correctamente');

							});

						}, function(err){
							if (err.data && err.data.error){
								$rootScope.toaster('Carta de servicios fallida: ' + err.data.error, 'Error', 'error');
							} else {
								$rootScope.toaster('Carta de servicios fallida', 'Error', 'error');
							}
						});
					} else {
						$window.alert('Una carta debe tener un expediente y una denominación');
							this.router.navigateByUrl('/welcome');
						return;
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
