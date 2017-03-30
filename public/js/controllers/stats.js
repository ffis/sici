(function(angular){
	'use strict';
	angular.module('sici')
	.controller('StatsCtrl', ['$rootScope', '$scope', '$window', 'Aggregate',
		function ($rootScope, $scope, $window, Aggregate){
			$rootScope.nav = 'stats';
			$rootScope.setTitle('Estadísticas');
			$scope.graphs = [];
			$scope.campos = ['ancestro_v_2', 'ancestro_v_3', 'ancestro_v_4', 'cod_plaza', 'denominacion', 'codigo'];
			$scope.campo = $scope.campos[0];

			function aux(campo, titulo, anualidad){
				return function(){
					var sum = 0,
						porcumplimentar = 0;
					$scope.tmp.forEach(function(g, i){
						sum += g.count;
						porcumplimentar += g.porcumplimentar;
						$scope.tmp[i].cumplimentadas = g.count - g.porcumplimentar;
					});
					$scope.widthgraph = angular.element(angular.element('.graphid')[0]).width();
					$scope.graphs.push({'data': $scope.tmp, 'sum': sum, 'porcumplimentar': porcumplimentar, 'campo': campo, 'titulo': titulo, 'anualidad': anualidad});
				};
			}

			$scope.newGraph = function(){
				var campo = $scope.campo;
				$scope.tmp = Aggregate.query({'anualidad': $rootScope.anualidad, 'campo': campo}, aux(campo, '', $rootScope.anualidad));
				var index = $scope.campos.indexOf($scope.campo);
				if (index < $scope.campos.length - 1){
					$scope.campo = $scope.campos[index + 1];
				}
			};

			$scope.removeGraph = function(index){
				$scope.graphs.splice(index, 1);
			};

			$scope.addgraph = function(row, graph){
				const titulo = row._id,
					campo = $scope.campo,
					restriccion = graph.campo + ':' + row._id;

				$scope.tmp = Aggregate.query({'anualidad': graph.anualidad, 'campo': $scope.campo, 'restriccion': restriccion}, aux(campo, titulo, graph.anualidad));
			};

			$scope.orden = 'count';
			$scope.ascending = true;

			$scope.xFunction = function () {
				return function (d) {
					var id = d._id ? d._id : '';
					var a = id.replace('CONSEJERIA', 'CONSJ.').replace('ORGANISMO', 'ORG.');
					if (a.length > 20){
						a = a.substring(0, 18) + '…';
					}

					return a;
				};
			};
			$scope.yFunction = function () { return function (d) { return d.count; }; };
			$scope.yFunction2 = function () { return function (d) { return d.porcumplimentar; }; };
			$scope.yFunction3 = function () { return function (d) { return d.cumplimentadas; }; };
			$scope.toolTipContentFunction = function(){ return function(key, x, y) { return '<p>' + y.point._id + ' : ' + parseInt(x, 10) + '</p>'; }; };
			$scope.widthgraph = 0;
		}
	]);
})(angular);
