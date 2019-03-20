(function(angular, $){
	'use strict';
	angular.module('sici')
		.controller('NewCompromisoCtrl', ['$rootScope', '$scope', '$location', '$window', '$http', '$route', '$routeParams', '$timeout', 'Objetivo','PersonasByRegexp', 'EntidadObjeto',
			function ($rootScope, $scope, $location, $window, $http, $route, $routeParams, $timeout, Objetivo,PersonasByRegexp, EntidadObjeto) {
				$rootScope.nav = 'newCompromiso';
				$rootScope.setTitle('Crear Compromiso');

				$scope.objetivo = new Objetivo();
				$scope.objetivo.denominacion = '';
				$scope.objetivo.carta = '';
				$scope.objetivo.estado = 'Publicado';
				$scope.objetivo.index = 0;
				$scope.objetivo.objetivoestrategico = 1;
				$scope.objetivo.formulas = [];
				$scope.carta = '';

				$scope.cartas = EntidadObjeto.query(function(data) {
				});

				$scope.guardar = function(){
					if ($scope.objetivo.denominacion && $scope.carta) {
						$scope.objetivo.carta = $scope.carta._id;
						Objetivo.save($scope.objetivo, function(){
								//alert(JSON.stringify(data));
						/*		if ($window.confirm('El Compromiso se ha registrado correctamente. ¿Desea  editar el nuevo compromiso?')){
									$location.path("/objetivo/" + $scope.objetivo._id);
								} else {
									//$route.reload();
								}*/
								$window.alert('Compromiso creado correctamente');
								$route.reload();
							});
						} else {
							$window.alert('Imposible crear/actualizar el objetivo. Debe indicar denominación y carta');
						}

				};
			}
		]);
})(angular, $);
