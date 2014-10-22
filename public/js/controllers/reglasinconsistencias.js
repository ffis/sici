function ReglasInconsistenciasCtrl($rootScope,$scope,$routeParams,Raw) {

	$scope.inconsistencias =  Raw.query({model: 'reglasinconsistencias'});
	
}

ReglasInconsistenciasCtrl.$inject = ['$rootScope','$scope','$routeParams','Raw'];

