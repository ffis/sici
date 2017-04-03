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

				return function(datoscargados){
					const labels = datoscargados.map($scope.label);
					const data1 = datoscargados.map(function(g){ return g.count; });
					const data2 = datoscargados.map(function(g){ return g.porcumplimentar; });
					const data3 = datoscargados.map(function(g){ return g.count - g.porcumplimentar; });
					
					const sum = data1.reduce(function(p, v){ return p + v; }, 0);
					const porcumplimentar = data2.reduce(function(p, v){ return p + v; }, 0);
					datoscargados.forEach(function(g){
						g.cumplimentadas = g.count - g.porcumplimentar;
					});
					//$scope.widthgraph = angular.element(angular.element('.graphid')[0]).width();
					$scope.graphs.push({'data': datoscargados, 'data1': data1, 'data2': data2, 'data3': data3, 'labels': labels, 'sum': sum, 'porcumplimentar': porcumplimentar, 'campo': campo, 'titulo': titulo, 'anualidad': anualidad});
				};
			}

			$scope.newGraph = function(){
				const campo = $scope.campo;
				Aggregate.query({'anualidad': $rootScope.getIntAnualidad(), 'campo': campo}, aux(campo, '', $rootScope.getIntAnualidad()));
				const index = $scope.campos.indexOf($scope.campo);
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

				Aggregate.query({'anualidad': graph.anualidad, 'campo': $scope.campo, 'restriccion': restriccion}, aux(campo, titulo, graph.anualidad));
			};

			$scope.orden = 'count';
			$scope.ascending = true;

			$scope.label = function (d) {
				const id = d._id ? d._id.replace('CONSEJERIA', 'CONSJ.').replace('ORGANISMO', 'ORG.') : '';

				return (id.length > 20) ? id.substring(0, 18) + '…' : id;
			};


			$scope.options = {
				'legend': {
					'display': true
				}
			};

		}
	]);
})(angular);
