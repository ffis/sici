
function StatsCtrl($rootScope,$scope,$window,Aggregate){
	$rootScope.nav = 'stats';
	$window.document.title ='SICI: Estadísticas';
	$scope.graphs = [];

	$scope.campos = ['Denominacion Nivel 3', 'Denominacion Nivel 2', 'Denominacion Nivel 1', 'Login responsable', 'Nombre responsable','DENOMINACION DEL PROCEDIMIENTO','CODIGO'];
	$scope.campo = $scope.campos[0];

	$scope.newGraph = function(){
		var campo = $scope.campo;
		$scope.tmp  = Aggregate.query({campo: campo},aux(campo,'',null));
	}
	$scope.exportXLS = function(idx){
	    var blob = new Blob(['<meta http-equiv="content-type" content="application/vnd.ms-excel; charset=UTF-8"><table width="100%">'+document.getElementById('tabladatos'+idx).innerHTML+'</table>'], {
            type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=utf-8"
        });
        saveAs(blob, "Report.xls");
	};
	$scope.removeGraph = function(index)
	{
		$scope.graphs.splice(index, 1);
	};

	function aux(campo,titulo,restriccion){
		return function(){
			var sum = 0, porcumplimentar=0;
			$scope.tmp.forEach(function(g,i){
				sum += g.count;
				porcumplimentar+=g.porcumplimentar;
				$scope.tmp[i].cumplimentadas=g.count-g.porcumplimentar;
			});
			$scope.widthgraph = angular.element(angular.element('.graphid')[0]).width();
			$scope.graphs.push({data: $scope.tmp, sum:sum, porcumplimentar:porcumplimentar, campo:campo, titulo:titulo });
		};
	}

	$scope.addgraph = function(row,graph){
		var restriccion = graph.campo+':'+row._id;
		var titulo = row._id;
		var campo = $scope.campo;
		$scope.tmp  = Aggregate.query({campo: $scope.campo,restriccion:restriccion},aux(campo,titulo,restriccion));
	};

	$scope.orden='count';
	$scope.ascending=true;

	$scope.xFunction = function () { return function (d) { var a = d._id.replace('CONSEJERIA',"CONSJ.").replace('ORGANISMO',"ORG."); if (a.length > 20) a=a.substring(0,18)+'...'; return a; }; };
	$scope.yFunction = function () { return function (d) { return d.count; }; };
	$scope.yFunction2 = function () { return function (d) { return d.porcumplimentar; }; };
	$scope.yFunction3 = function () { return function (d) { return d.cumplimentadas; }; };
	$scope.toolTipContentFunction = function(){ return function(key, x, y, e, graph) { return  '<p>'+ y.point._id +' : '+parseInt(x) + '</p>'; }};
	$scope.widthgraph = 0;
}

StatsCtrl.$inject =  ['$rootScope','$scope','$window','Aggregate'];
