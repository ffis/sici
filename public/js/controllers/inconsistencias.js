(function(angular, $, document, Blob, saveAs){
	'use strict';
	angular.module('sici')
	.controller('InconsistenciasCtrl', ['$rootScope', '$scope', '$routeParams', 'Raw', 'Aggregate', '$timeout',
		function ($rootScope, $scope, $routeParams, Raw, Aggregate, $timeout) {

			$rootScope.nav = 'inconsistencias';
			$scope.oneAtATime = true;
			$scope.camposamostrar = ['codigo', 'denominacion' ];
			$scope.camposmostrados = $scope.camposamostrar;
			$scope.inconsistencias = Raw.query({model: 'reglasinconsistencias'}, function(){ $scope.update(); });
			$scope.seleccionados = {};
			$scope.camposamostrar.forEach(function(campo){
				$scope.seleccionados[campo] = $scope.camposmostrados.indexOf(campo) >= 0;
			});
			$scope.anualidad = new Date().getFullYear();
			$scope.$watch('seleccionados.$', function(){ $scope.update(); });

			$scope.exportXLS = function(idx){
				var blob = new Blob(
					['<meta http-equiv="content-type" content="application/vnd.ms-excel; charset=UTF-8"><table width="100%">' + document.getElementById('tabladatos' + idx).innerHTML + '</table>'], {
					type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=utf-8"
				});
				saveAs(blob, "Report.xls");
			};

			$scope.update = function(){
				$scope.inconsistencias.forEach(function(inconsistencia, i){
					var c = {};
					for(var campoM in $scope.seleccionados)
					{
						c[campoM] = '$' + campoM;
					}

					$scope.inconsistencias[i].datos = Aggregate.query({anualidad: $scope.anualidad, campo: JSON.stringify(c), restriccion: inconsistencia.restriccion},
						function(){
							$timeout(function() {
								angular.element("[data-badge]").each(function(){
									var a = angular.element( this ).find('.panel-heading a');
									var html = '<span class="badge pull-right">' + $(this).data('badge') + '</span>';
									if (angular.element( this ).find('.badge').length === 0 && angular.element( this ).find('tr').length > 0){
										a.append(html);
									}
								});
							}, 500);
						}
					);
				});
			};
		}
	]);
})(angular, $, document, Blob, saveAs);
