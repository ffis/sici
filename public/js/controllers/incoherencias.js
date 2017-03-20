(function(angular){
	'use strict';
	angular.module('sici')
		.controller('IncoherenciasCtrl', ['$rootScope', '$scope', '$window', 'ProcedimientoList', 'Raw',
			function ($rootScope, $scope, $window, ProcedimientoList, Raw) {

				$rootScope.nav = 'errors';
				$scope.mostrartodos = '1';
				$scope.idsencomun = false;
				$rootScope.setTitle('Incoherencias');
				$scope.anualidad = new Date().getFullYear();

				var camposprocedimiento = [
					'codigo', 'denominacion',
					'ancestros.id',	'ancestros.nombrelargo',
					'periodos.a' + $scope.anualidad + '.plazo_maximo_resolver',
					'periodos.a' + $scope.anualidad + '.plazo_maximo_responder',
					'periodos.a' + $scope.anualidad + '.plazo_CS_ANS_naturales',
					'periodos.a' + $scope.anualidad + '.plazo_CS_ANS_habiles',
					'periodos.a' + $scope.anualidad + '.totalsolicitudes'
				];
				$scope.camposexcel = [
					'periodos.a' + $scope.anualidad + '.plazo_maximo_resolver',
					'periodos.a' + $scope.anualidad + '.plazo_maximo_responder',
					'periodos.a' + $scope.anualidad + '.plazo_CS_ANS_naturales',
					'periodos.a' + $scope.anualidad + '.plazo_CS_ANS_habiles'
				];
				//$scope.camposguia = ['titulo'];
				$scope.camposguia = [];
				$scope.camposcrawled = ['any.Código y denominación', 'any.Plazo de resolución'];

				$scope.procedimiento = ProcedimientoList.query({'idjerarquia': 1, 'fields': camposprocedimiento.join(' ')},
					function(){
						if (!$scope.idsencomun){ $scope.idsencomun = {}; }
						$scope.procedimiento.forEach(function(p){
							if (typeof $scope.idsencomun['id' + p.codigo] === 'undefined'){
								$scope.idsencomun['id' + parseInt(p.codigo, 10)] = {'id': parseInt(p.codigo, 10), 'procedimiento': p};
							} else {
								$scope.idsencomun['id' + parseInt(p.codigo, 10)].procedimiento = p;
							}
						});
					});

				$scope.crawled = Raw.query({'model': 'crawled', 'fields': ['id', 'jerarquia', 'any'].join(' ')}, function(){
					if (!$scope.idsencomun){ $scope.idsencomun = {}; }
					$scope.crawled.forEach(function(p){
						if (typeof $scope.idsencomun['id' + parseInt(p.id, 10)] === 'undefined'){
							$scope.idsencomun['id' + parseInt(p.id, 10)] = {id: parseInt(p.id, 10), 'crawled': p};
						} else {
							$scope.idsencomun['id' + parseInt(p.id, 10)].crawled = p;
						}
					});
				});

				$scope.toDays = function(str){
					var n = parseInt(str.replace('\r', ' ').replace('\n', ' ').trim(), 10);
					if (str.indexOf('Mes') !== -1){ n *= 30; }

					return n;
				};
				$scope.parseInt = function(n){ return (n && n !== '') ? parseInt(n, 10) : 0; };
				$scope.testwarning = function(row){
					if (!row.crawled || !row.crawled.any || !row.crawled.any['Plazo de resolución']){ return true; }
					if (!row.procedimiento ){ return true; }
					var sum =
						$scope.parseInt(row.procedimiento.periodos['a' + $scope.anualidad].plazo_maximo_resolver) +
						$scope.parseInt(row.procedimiento.periodos['a' + $scope.anualidad].plazo_maximo_responder) +
						$scope.parseInt(row.procedimiento.periodos['a' + $scope.anualidad].plazo_CS_ANS_naturales) +
						$scope.parseInt(row.procedimiento.periodos['a' + $scope.anualidad].plazo_CS_ANS_habiles);
					var	plazo = $scope.toDays( row.crawled.any['Plazo de resolución']);

					return (sum !== plazo);
				};
			}
]);
})(angular);
