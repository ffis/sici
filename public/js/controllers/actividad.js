function ActividadCtrl($rootScope,$scope,$location,$window,$routeParams, Arbol, ProcedimientoList,DetalleCarmProcedimiento,DetalleCarmProcedimiento2, PersonasByPuesto, Session) {
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
	$scope.anualidad = new Date().getFullYear();
	$scope.mesanterior = new Date().getMonth()-1;
	
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

	$scope.jerarquia = Session.create().permisoscalculados.jerarquialectura.concat(Session.create().permisoscalculados.jerarquiaescritura);
	
	$scope.filtrojerarquia = function(item) {
		if ($scope.jerarquia.indexOf(item.id)!=-1 )
			return true;		
		if (item.nodes){
			for(var i=0;i<item.nodes.length;i++) 
				if ($scope.filtrojerarquia(item.nodes[i])) 
					return true;		
		}
		return false;
	};
	
	$scope.filtrosocultos = false;
	$scope.setSeleccionado = function(seleccionad){
			if (seleccionad) {
				$scope.seleccionado = seleccionad;
				$rootScope.setTitle(seleccionad.title); 
				$scope.procedimientos = ProcedimientoList.query({idjerarquia:seleccionad.id, fields:camposProcedimientos.join(' ')}); 
				$scope.cumplimentados = 0;
				$scope.count = 1;
				$("body").animate({scrollTop: $('#detallesjerarquia').offset().top}, "slow");
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
	

	
}
ActividadCtrl.$inject = ['$rootScope','$scope','$location','$window','$routeParams','Arbol','ProcedimientoList','DetalleCarmProcedimiento','DetalleCarmProcedimiento2','PersonasByPuesto','Session'];
