(function(angular){
	'use strict';
	angular.module('sici')
		.controller('RecalculateCtrl', ['$rootScope', '$scope', '$window', '$http',
			function ($rootScope, $scope, $window, $http) {
				$rootScope.nav = 'recalculate';
				$scope.actualizando = 0;
				$rootScope.setTitle('Recalcular');
				$scope.respuestas = [];
				$scope.funcionalidades = [
					{label: 'Procedimientos', fn: [{label: 'Recalcular caché', cmd: '/api/v1/restricted/fprocedimiento'}]},
					{label: 'Jerarquia', fn: [{label: 'Recalcular', cmd: '/api/v1/restricted/fjerarquia'}]},
					{label: 'Permisos', fn: [{label: 'Recalcular', cmd: '/api/v1/restricted/fpermiso'}]}
				//	{label: 'Personas', fn: [{label: 'Recalcular', cmd: '/api/v1/restricted/excelgesper'}]}
				];
				$scope.clasefuncionalidades = 'col-md-' + (12 / $scope.funcionalidades.length).toFixed(0);

				$scope.invoke = function (cmd) {
					if ($scope.actualizando) {
						$window.alert('Espere a que termine la actualización previa');
						return;
					}
					$scope.actualizando++;
					$http.get(cmd).then(function () {
						$scope.actualizando--;
						$scope.respuestas.push({
							clase: 'alert-success',
							mensaje: 'Ha funcionado perfectamente.'
						});
					}, function () {
						$scope.actualizando--;
						$scope.respuestas.push({
							clase: 'alert-warning',
							mensaje: 'Ha fallado.'
						});
					});
				};
			}
		]);
})(angular);
