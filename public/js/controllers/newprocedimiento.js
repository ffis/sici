(function(angular, $){
	'use strict';
	angular.module('sici')
		.controller('NewProcedimientoCtrl', ['$rootScope', '$scope', '$location', '$window', '$routeParams', '$timeout', 'ArbolWithEmptyNodes', 'ProcedimientoList', 'DetalleCarmProcedimiento', 'DetalleCarmProcedimiento2', 'PersonasByPuesto', 'Session', 'Etiqueta', 'PersonasByRegexp', 'Procedimiento',
			function ($rootScope, $scope, $location, $window, $routeParams, $timeout, ArbolWithEmptyNodes, ProcedimientoList, DetalleCarmProcedimiento, DetalleCarmProcedimiento2, PersonasByPuesto, Session, Etiqueta, PersonasByRegexp, Procedimiento) {
				$rootScope.nav = 'procedimiento';
				$window.document.title = 'SICI: Registrar nuevo procedimiento';

				$scope.idjerarquia = $routeParams.idjerarquia ? $routeParams.idjerarquia : false;
				$scope.camposfiltros = ['cod_plaza'];
				$scope.filtros = {};
				$scope.filtro = {};
				$scope.nodoseleccionado = false;
				$scope.padre = '';
				$scope.seleccionado = false;
				$scope.procedimiento = new Procedimiento();
				$scope.responsable = '';
				$scope.filtrosocultos = false;

				///$scope.oallprocedimientos = ProcedimientoList.query({'idjerarquia':seleccionado.id,'recursivo':false});

				$scope.$watch('seleccionado', function(_new, old){
					$scope.oallprocedimientos = ProcedimientoList.query({'idjerarquia': _new.id, 'recursivo': false});
					if ($scope.procedimiento.padre) {
						delete $scope.procedimiento.padre;
						$window.alert('El procedimiento padre debe pertenecer al mismo nodo de la jerarquía. Se obvia campo padre.');
					}
				});

				$scope.$watch('responsable', function(_new, old){
					var partes = _new.split('-');
					$scope.procedimiento.cod_plaza = partes[0];
				});

				$scope.$watch('padre', function( _new, old){
					var value = _new.substring(1, _new.indexOf(']'));
					$scope.procedimiento.padre = value;
			//		$scope.procedimiento.responsable = ( typeof _new.codplaza !== 'undefined' ? _new.codplaza : _new.login );
				});

				$scope.getPersonas = function(viewValue) {
					if (viewValue.length > 2) {
						var p = PersonasByRegexp.query({'regex': viewValue}).$promise;
						return p;
					} else {
						return [];
					}
				};

				$scope.guardar = function(){
					console.log($scope.responsable);
					if ($scope.seleccionado && $scope.procedimiento.denominacion && $scope.procedimiento.codigo && $scope.responsable) {
						Procedimiento.save($scope.procedimiento, function(){
							$window.alert('Procedimiento registrado correctamente. Redirigiendo...');
							$location.path('/procedimiento/' + $scope.procedimiento.codigo);
							/*
							$scope.procedimiento = new Procedimiento();
							$scope.procedimiento.idjerarquia = $scope.seleccionado.id;
							$scope.responsable = '';*/
						}, function(xhr, msg){
							$window.alert('Error durante el registro: ' + msg);
						});
					} else {
						$window.alert('Imposible crear/actualizar el procedimiento. Debe indicar denominación y código');
					}
				};

				$scope.showPersona = function (persona){
					if (persona && persona.login && persona.codplaza && persona.nombre && persona.apellidos){
						return persona.codplaza + '-' + persona.login + '-' + persona.nombre + ' ' + persona.apellidos;
					}
					else{
						return '';
					}
				};

				$scope.showProcedimiento = function (procedimiento){
					if (procedimiento && procedimiento.denominacion && procedimiento.codigo){
						return '[' + procedimiento.codigo + '] ' + procedimiento.denominacion;
					}
					else{
						return '';
					}
				};

				$scope.arbol = ArbolWithEmptyNodes.query(function(){
					if ($scope.idjerarquia){
						$scope.setJerarquiaById($scope.idjerarquia);
					}
				});
				$scope.oculto = false;

				//$scope.jerarquia = Session.create().permisoscalculados.jerarquialectura.concat(Session.create().permisoscalculados.jerarquiaescritura);

				$scope.filtrojerarquia = function(item) {
					//es superusuario, no hace falta filtrar
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

				$scope.isFiltroSelected= function(filtro, key, fa){
					return (typeof filtro[key] !== 'undefined' && fa.name == filtro[key]);
				};
			}
		]);
})(angular, $);
