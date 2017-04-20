(function(angular){
	'use strict';
	angular.module('sici').controller('CompromisoCtrl',
			['$rootScope', '$scope', 'Objetivo', 'EntidadObjeto', 'COLORES_OBJETIVOS',
			function ($rootScope, $scope, Objetivo, EntidadObjeto, COLORES_OBJETIVOS) {
				$rootScope.nav = 'compromiso';
				Objetivo.query(function(compromisos){
					compromisos.sort(function(a, b){
						return (a.carta === b.carta) ? a.index - b.index : a.carta - b.carta;
					});
					$scope.compromisos = compromisos;
				});
				EntidadObjeto.query({'tipoentidad': 'CS', 'fields': 'denominacion'}, function(cartas){
					$scope.cartasById = cartas.reduce(function(prev, carta){
						prev[carta._id] = carta;

						return prev;
					}, {});
				});
				$scope.colores = COLORES_OBJETIVOS;
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
			}
		]
	);

})(angular);
