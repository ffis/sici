(function(angular){
	'use strict';
	angular.module('sici').controller('CompromisoCtrl',
			['$rootScope', '$scope', 'Objetivo', 'EntidadObjeto', 'COLORES_OBJETIVOS',
			function ($rootScope, $scope, Objetivo, EntidadObjeto, COLORES_OBJETIVOS) {
				$rootScope.nav = 'compromiso';
				$scope.compromisos = Objetivo.query();
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
