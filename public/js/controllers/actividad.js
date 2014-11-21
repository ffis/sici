function ActividadCtrl($q,$rootScope,$scope,$location,$window,$routeParams,$timeout, Arbol, ProcedimientoList,DetalleCarmProcedimiento,DetalleCarmProcedimiento2, PersonasByPuesto, Session, Etiqueta) {
	$rootScope.nav = 'actividad';
	$window.document.title ='SICI: Actividad';
	$scope.idjerarquia = ($routeParams.idjerarquia) ? $routeParams.idjerarquia :false;

	$scope.camposfiltros = ['cod_plaza'];
	$scope.filtros = {};
	$scope.filtro = {};
	$scope.camporesponsable = 'Nombre responsable';
	$scope.responsables = {};
	$scope.procedimientosocultos = false;
	$scope.meses = $rootScope.meses;
	$scope.reverse = false;
	$scope.anualidad = 'a'+new Date().getFullYear();
	$scope.mesanterior = new Date().getMonth()-1;
	$scope.etiquetas = Etiqueta.query(function(){
		$scope.etiquetasPorTipo	= {};
		$scope.etiquetas.forEach(function(etiqueta){
			if (typeof $scope.etiquetasPorTipo[etiqueta.familia] == 'undefined')
			{
				$scope.etiquetasPorTipo[etiqueta.familia] = [];
			}
			$scope.etiquetasPorTipo[etiqueta.familia].push(etiqueta);
		})
		
	});
	
	
	if ($scope.mesanterior < 0)
		$scope.mesanterior = 11;

	var camposProcedimientos = [
		'codigo','denominacion','cod_plaza',
		'ancestros.id','ancestros.nombrelargo',
		'periodos.'+$scope.anualidad+'.totalsolicitudes',
		'periodos.'+$scope.anualidad+'.solicitados'
	]

	$scope.setJerarquiaById = function(idjerarquia){
		var setJ = function(nodo, idjerarquia){
			if (nodo.id == idjerarquia){
				$scope.setSeleccionado(nodo);
				return true;
			}
			
			if (nodo.nodes ==null) return false;
			for(var i=0,j=nodo.nodes.length; i<j;i++){
				if (setJ(nodo.nodes[i], idjerarquia)) {
					return true;
				}
			}
			return false;
		};
		$scope.arbol.forEach(function(nodo,idx){
			setJ(nodo,idjerarquia);
		})
	};
	$scope.arbol = Arbol.query(function(){
		if ($scope.idjerarquia){
			$scope.setJerarquiaById($scope.idjerarquia);
		}
	});
	$scope.oculto = false;
	
	$scope.procedimientos = [];

	var defjerarquia = $q.defer();
	$scope.pjerarquia = defjerarquia.promise;
	$rootScope.jerarquialectura().then(function(j){ 
		$rootScope.jerarquiaescritura().then(function(j2){
			$scope.jerarquia = j.concat(j2);
			defjerarquia.resolve($scope.jerarquia);
		});
	});
	
	/*$scope.filtrojerarquia*/ 
	$scope.fj = function(item) {
		if ($scope.jerarquia.indexOf(item.id)!=-1 )
			return true;		
		if (item.nodes){
			for(var i=0;i<item.nodes.length;i++) 
				if ($scope.filtrojerarquia(item.nodes[i])) 
					return true;		
		}
		return false;
	};
	
	
	$scope.filtrojerarquia = function(item) {
		var def = $q.defer();
		$scope.pjerarquia.then( function(){			
			def.resolve($scope.fj(item));
			$scope.filtrojerarquia = $scope.fj;
		},function(err){def.reject(err);});
		return def.promise;
	}
	
	
	$scope.filtrosocultos = false;
	$scope.setSeleccionado = function(seleccionad){
			if (seleccionad) {
				$scope.seleccionado = seleccionad;
				$rootScope.setTitle(seleccionad.title); 
				$scope.procedimientos = ProcedimientoList.query({idjerarquia:seleccionad.id, fields:camposProcedimientos.join(' ')}); 
				$scope.cumplimentados = 0;
				$scope.count = 1;
				$timeout(function(){
					$("body").animate({scrollTop: $('#detallesjerarquia').offset().top}, "slow");
				}, 20);
			}
		};

	$scope.colorText = $rootScope.colorText;
    
	$scope.cumplimentado = function(procedimiento){
		return (typeof procedimiento.periodos[$scope.anualidad].solicitados === 'object' &&  Math.max.apply(Math, procedimiento.periodos[$scope.anualidad].solicitados) > 0);
	}
	$scope.isFiltroSelected= function(filtro,key,fa){
		return (typeof filtro[key] != 'undefined' && fa.name==filtro[key]);
	}
	$scope.sparkline = function(){
		setTimeout( function(){	$('.sparkline').each(function(){
				var obj = $(this).html();
				try{
					var t = JSON.parse( obj );
					$(this).sparkline( t, {type: 'bar',barColor: '#a94442'}) ; 
				}catch(e){
					/*
					console.error('sparkline mal formed VALUE WAS:'+  t );
					$(this).css('backgroundColor','red');
					*/
				}
			});
		},1);
	}
	$scope.filtrotxtprocedimiento = {};
	$scope.$watch('filtrotxtprocedimiento.$',function(newValue,oldValue){ $scope.sparkline(); });
	$scope.$watch('procedimientosocultos',function(newValue,oldValue){ $scope.sparkline(); });

	$scope.procedimientosfiltrados = [];
	$scope.$watch('filtro',function(newValue,oldValue){
		var result = [];
		$scope.procedimientos.forEach(function(p,j){
			var ok = true;
			for(var campofiltro in $scope.filtro){
				if ($scope.filtro[campofiltro]!='TODOS' && p[campofiltro] != $scope.filtro[campofiltro]){
					ok=false; break;
				}
			}
			if (ok)
				result.push(p);
			/*
			else
				console.info(p);
			*/
		});
		$scope.procedimientosfiltrados = result;

		$scope.sparkline();
		$scope.procedimientosocultos = false;
	}, true);


	
	$scope.cumplimentados = 0;
	$scope.count = 1;
	$scope.$watch('procedimientos.$resolved', function(newValue, oldValue) {

		$scope.procedimientosfiltrados = $scope.procedimientos;
		if (newValue && $scope.procedimientos.length>0)
		{
			$scope.currentPage = 0;
			$scope.responsables = {};
			$scope.filtros = {};
			$scope.filtro = {};
			$scope.cumplimentados = 0;
			$scope.count = $scope.procedimientos.length;
			$scope.procedimientos.forEach(function(p){
				var cumplimentado = $scope.cumplimentado(p);
				cumplimentado && $scope.cumplimentados++;
				for(var i in $scope.camposfiltros){
					var campofiltro = $scope.camposfiltros[i], value = p[campofiltro], name  = p[campofiltro], count = 1;
					if (typeof $scope.filtros[campofiltro] === 'undefined')
						$scope.filtros[campofiltro] = {};
					if (typeof $scope.filtros[campofiltro][value] === 'undefined')
					{
						$scope.filtros[campofiltro][value] = { name: name, value:value, count:count, cumplimentados:cumplimentado ? 1 : 0}
					}else{
						$scope.filtros[campofiltro][value].count = $scope.filtros[campofiltro][value].count+1;
						if (cumplimentado)
							$scope.filtros[campofiltro][value].cumplimentados = $scope.filtros[campofiltro][value].cumplimentados+1;
					}
					$scope.filtros[campofiltro][value].name = $scope.filtros[campofiltro][value].value + ' ('+($scope.filtros[campofiltro][value].cumplimentados)+'/'+($scope.filtros[campofiltro][value].count)+')';
				}
			});
			
			for(var i in $scope.camposfiltros){
				var campofiltro = $scope.camposfiltros[i];
				if (Object.keys($scope.filtros[campofiltro]).length > 1)
				{
					$scope.filtros[campofiltro].TODOS = { name:'TODOS',value:'TODOS', count:0};
					$scope.filtro[campofiltro] = 'TODOS';
				}else{
					for(var a in $scope.filtros[campofiltro])
						$scope.filtro[campofiltro] = $scope.filtros[campofiltro][a].value;
				}
			}

			if (Object.keys($scope.responsables).length > 1)
			{
				$scope.responsables.TODOS = { name:'TODOS',value:'TODOS', count:0};
				$scope.responsable = $scope.responsables.TODOS;
			}else{
				for(var a in $scope.responsables)
					$scope.responsable = $scope.responsables[a];
			}
			$scope.sparkline();
		}
	});
	
	$scope.itemsPerPage = 20;
 	$scope.currentPage = 0;
 	$scope.range = function() {
		var rangeSize = 4;
		var ps = [];
		var start;
		start = $scope.currentPage;
		if ( start > $scope.pageCount()-rangeSize ) {
			start = $scope.pageCount()-rangeSize+1;
		}
		for (var i=start; i<start+rangeSize; i++) {
			if(i>=0) 
				ps.push(i);
		}
		return ps;
	};

	$scope.prevPage = function() {
		if ($scope.currentPage > 0) {
			$scope.currentPage--;
			 $scope.sparkline();
		}
	};
	$scope.DisablePrevPage = function() {
		return $scope.currentPage === 0 ? "disabled" : "";
	};
	$scope.pageCount = function() {
		return Math.ceil($scope.procedimientosfiltrados.length/$scope.itemsPerPage)-1;
	};
	$scope.nextPage = function() {
		if ($scope.currentPage < $scope.pageCount()) {
			$scope.currentPage++;
			$scope.sparkline();
		}
	};
	$scope.DisableNextPage = function() {
		return $scope.currentPage === $scope.pageCount() ? "disabled" : "";
	};
	$scope.setPage = function(n) {
		$scope.currentPage = n;
		$scope.sparkline();
	};
	
}
ActividadCtrl.$inject = ['$q','$rootScope','$scope','$location','$window','$routeParams','$timeout','Arbol','ProcedimientoList','DetalleCarmProcedimiento','DetalleCarmProcedimiento2','PersonasByPuesto','Session', 'Etiqueta'];
