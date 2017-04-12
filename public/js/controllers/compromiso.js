(function(angular){
	'use strict';
	angular.module('sici').controller('CompromisoCtrl',
			['$rootScope', '$scope', 'Objetivo',
			function ($rootScope, $scope, Objetivo) {
				$rootScope.nav = 'compromiso';
				$scope.compromisos = Objetivo.query();
			}
		]
	);

})(angular);
