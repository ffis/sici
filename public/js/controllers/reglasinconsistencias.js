function ReglasInconsistenciasCtrl($rootScope,$scope,$routeParams,ReglasInconsistencias) {
	$scope.cambios = [];
	$scope.inconsistencias =  ReglasInconsistencias.query();
	$scope.actualizar = function(regla){
		regla.$update(function(){
			$scope.cambios = [];
		});
	};
	$scope.eliminar = function(regla){
		if (confirm('¿Está seguro? Esta operación no es reversible.'))
		regla.$delete(function(){
			$scope.cambios = [];
			$scope.inconsistencias =  ReglasInconsistencias.query();
		});
	};
}

ReglasInconsistenciasCtrl.$inject = ['$rootScope','$scope','$routeParams','ReglasInconsistencias'];

