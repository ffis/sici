
function InconsistenciasCtrl($rootScope,$scope,$routeParams,Raw,Aggregate) {
	$rootScope.nav = 'inconsistencias';
	$scope.oneAtATime = true;
	$scope.camposamostrar = ['CODIGO', 'DENOMINACION DEL PROCEDIMIENTO', 'Denominacion Nivel 3', 'Denominacion Nivel 2', 'Denominacion Nivel 1', 'Login responsable', 'Nombre responsable'];
	$scope.camposmostrados = ['CODIGO', 'DENOMINACION DEL PROCEDIMIENTO', 'Denominacion Nivel 3', 'Denominacion Nivel 2', 'Denominacion Nivel 1', 'Login responsable', 'Nombre responsable'];
	$scope.inconsistencias =  Raw.query({model: 'reglasinconsistencias'}, function(){ $scope.update(); });
	$scope.seleccionados = {};
	$scope.camposamostrar.forEach(function(campo){
		$scope.seleccionados[campo] = $scope.camposmostrados.indexOf(campo)>=0;
	});

	$scope.$watch('seleccionados.$',function(){ $scope.update(); });

	$scope.exportXLS = function(idx){
	    var blob = new Blob(['<meta http-equiv="content-type" content="application/vnd.ms-excel; charset=UTF-8"><table width="100%">'+document.getElementById('tabladatos'+idx).innerHTML+'</table>'], {
            type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=utf-8"
        });
        saveAs(blob, "Report.xls");
	};

	$scope.update = function(){
		$scope.inconsistencias.forEach(function(a,i){
			var c = {};
			for(var campo in $scope.seleccionados)
			{
				if ($scope.seleccionados[campo])
					c[campo] = '$'+campo;
			}
			var campo = JSON.stringify(c);
			$scope.inconsistencias[i].datos = Aggregate.query({campo: campo,restriccion:a.restriccion},
				function(){

		setTimeout(function() {
			angular.element("[data-badge]").each(function(){
				var a = angular.element( $(this) ).find('.panel-heading a');
				var html = '<span class="badge pull-right">'+ $(this).data('badge') +'</span>';
				if (angular.element( $(this) ).find('.badge').length==0 && angular.element( $(this) ).find('tr').length>0)
					a.append(html);
			})
		}, 500);

				});
		});

	};
	
}

InconsistenciasCtrl.$inject = ['$rootScope','$scope','$routeParams','Raw','Aggregate'];

