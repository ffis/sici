(function(angular){
	'use strict';
	angular.module('sici')
		.controller('RegistroActividadCtrl',
			['$rootScope', '$scope', 'RegistroActividad', 'PastelColor',
				function($rootScope, $scope, RegistroActividad, PastelColor){
					$rootScope.setTitle('Registro de actividad');
					$rootScope.nav = 'registroActividad';
					$scope.url = '';
					$scope.usr = '';
					$scope.fecha = '';
					$scope.limit = 20;
					$scope.start = 0;
					$scope.show = function(o){
						$scope.detalles = true;
						$scope.detalless = o;
					};
					$scope.detalles = false;
					$scope.reload = function(){
						$scope.start = parseInt($scope.start, 10);
						$scope.limit = parseInt($scope.limit, 10);
						if ($scope.start < 0){
							$scope.start = 0;
						}
						if ($scope.limit < 0){
							$scope.limit = 40;
						}
						const r = {
							limit: $scope.limit,
							start: $scope.start
						};
						if ($scope.url !== ''){
							r.url = $scope.url;
						}
						if ($scope.usr !== ''){
							r.usr = $scope.usr;
						}
						$scope.registros = RegistroActividad.query(r);
						$scope.detalles = false;
						$scope.detalless = false;
					};
					$scope.firstPage = function(){
						$scope.start = 0;
					};
					$scope.nextPage = function(){
						$scope.start += $scope.limit;
						$scope.reload();
					};
					$scope.previousPage = function(){
						$scope.start -= $scope.limit;
						$scope.reload();
					};
					const usrs = [];
					$scope.getPastel = function(usr){
						let pos = usrs.indexOf(usr);
						if (pos < 0){
							pos = usrs.length;
							usrs.push(usr);
						}
						
						return PastelColor(pos);
					};
					$scope.reload();
				}
			]
		);
})(angular);