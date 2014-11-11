function ReglasInconsistenciasCtrl($rootScope,$scope,$routeParams,ReglasInconsistencias) {
	$window.document.title ='SICI: Reglas Inconsistencias';
	$scope.cambios = [];
	$scope.inconsistencias =  ReglasInconsistencias.query();
	$scope.nuevo =  new ReglasInconsistencias();
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
	$scope.guardar = function(regla){
		ReglasInconsistencias.save($scope.nuevo, function() {
			$scope.inconsistencias = ReglasInconsistencias.query();
			$scope.nuevo = new ReglasInconsistencias();
		});
	}
}

ReglasInconsistenciasCtrl.$inject = ['$rootScope','$scope','$routeParams','ReglasInconsistencias'];
