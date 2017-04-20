(function(angular){
	'use strict';
	angular.module('sici').controller('CompromisoCtrl',
		['$rootScope', '$scope', 'Objetivo', 'EntidadObjeto', 'COLORES_OBJETIVOS',
			function ($rootScope, $scope, Objetivo, EntidadObjeto, COLORES_OBJETIVOS) {
				$rootScope.nav = 'compromiso';
				$rootScope.setTitle('Compromisos');

				$scope.editable = false;
				$scope.colores = COLORES_OBJETIVOS;
				$scope.selected = false;
				$scope.compromisoSelected = false;
				$scope.indexSelected = false;

				Objetivo.query(function(compromisos){
					compromisos.sort(function(a, b){
						return (a.carta === b.carta) ? a.index - b.index : a.carta.localeCompare(b.carta);
					});
					$scope.compromisos = compromisos;
				});

				EntidadObjeto.query({'tipoentidad': 'CS', 'fields': 'denominacion'}, function(cartas){
					$scope.cartasById = cartas.reduce(function(prev, carta){
						prev[carta._id] = carta;

						return prev;
					}, {});
				});

				$scope.getIntervalo = function(color, intervalos){
					if (intervalos.length > 0){
						for (let i = 0, j = intervalos.length; i < j; i += 1){
							if (intervalos[i].color === color.value){
								return intervalos[i];
							}
						}
					}

					return {};
				};

				$scope.setEditable = function(){
					$scope.editable = !$scope.editable;
				};

				$scope.setSelected = function(s, compromiso, index){
					if ($scope.selected === s){
						$scope.selected = false;
						$scope.compromisoSelected = false;
						$scope.indexSelected = false;
					} else {
						$scope.selected = s;
						$scope.compromisoSelected = compromiso;
						$scope.indexSelected = index;
					}
				};

				$scope.paste = function(dest, compromiso, index){
					console.log($scope.selected, $scope.compromisoSelected, $scope.indexSelected);
					console.log(dest, compromiso, index);

					compromiso.formulas[index].intervalos = $scope.compromisoSelected.formulas[$scope.indexSelected].intervalos;
					compromiso.$update(function () {
						$rootScope.toaster('Objetivo actualizado correctamente', 'Éxito');
					}, function(err){
						$rootScope.toaster(err, 'Error', 'warning');
					});
				};
			}
		]
	);

})(angular);
