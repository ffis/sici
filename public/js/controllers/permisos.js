
function intersect_safe(a, b)
{
  var ai=0, bi=0;
  var result = new Array();

  while( ai < a.length && bi < b.length )
  {
     if      (a[ai] < b[bi] ){ ai++; }
     else if (a[ai] > b[bi] ){ bi++; }
     else /* they're equal */
     {
       result.push(a[ai]);
       ai++;
       bi++;
     }
  }

  return result;
}

function PermisoCtrl($rootScope,$scope,$location,$window,Arbol,Session,PermisosList,PersonasSearchList,ProcedimientoList,PermisosProcedimientoList,PermisosDirectosProcedimientoList, Jerarquia, Permiso, PersonasByPuesto, PersonasByLogin) {
	$rootScope.nav = 'permisos';
	$window.document.title ='SICI: Permisos';

	$scope.arbol = Arbol.query();
	$scope.oculto = false;	
	$scope.is_show_recursive_users = false;
	$scope.is_show_inherited_users = false;
	$scope.show_responsables = true;
	$scope.show_form_add_permiso = false;
	$scope.personas_plazas = [];
	$scope.persona_o_plaza = null;
	$scope.show_details_permiso = false;
	$scope.logincarm = "";
	$scope.plaza = "";
	$scope.procedimiento_seleccionado;
	$scope.seleccionado_organica = false;	
	$scope.nodo_jerarquia = null;
	
	$scope.addPermiso = function() {
		if ($scope.seleccionado !== 'undefined') {
			$scope.show_form_add_permiso = true;
			$scope.logincarm = "";
			$scope.plaza = "";
		}
	}	

	$scope.show_recursive_users = function(){
		$scope.is_show_recursive_users = true;
		$scope.is_show_inherited_users = false;
		
		if ($scope.seleccionado_organica) $scope.setSeleccionado($scope.seleccionado);		
		else $scope.setProcSeleccionado($scope.procedimiento_seleccionado);		
	}

	$scope.show_inherited_users	 = function(){
		$scope.is_show_inherited_users = true;
		$scope.is_show_recursive_users = false;
		
		if ($scope.seleccionado_organica) $scope.setSeleccionado($scope.seleccionado);		
		else $scope.setProcSeleccionado($scope.procedimiento_seleccionado);		
	}
	
	$scope.show_normal = function(){
		$scope.is_show_recursive_users = false;
		$scope.is_show_inherited_users = false;

		if ($scope.seleccionado_organica) $scope.setSeleccionado($scope.seleccionado);		
		else $scope.setProcSeleccionado($scope.procedimiento_seleccionado);
	}
	
	$scope.crearpermiso = function() {		
		var logintrim = $scope.logincarm.replace(/^\s+|\s+$/gm,'');
		var plazatrim = $scope.plaza.replace(/^\s+|\s+$/gm,'');
		if ( (logintrim || plazatrim) && $scope.seleccionado && $scope.grantoption )
		{
			var permiso = {};
			permiso.codplaza = plazatrim;
			permiso.login=logintrim;
			//// COMPROBAR SI ES SOBRE PROCEDIMIENTO O 
			//// SOBRE NODO JERARQUÍA
			if ($scope.grantoption) permiso.grantoption = true;
			permiso.superuser = 0;
			if ($scope.seleccionado_organica && $scope.seleccionado) {				
				permiso.jerarquiadirectalectura = [ $scope.seleccionado.id ];
				if ($scope.w_option) permiso.jerarquiadirectaescritura = [ $scope.seleccionado.id ];
				permiso.procedimientodirectalectura = [];
				permiso.procedimientodirectaescritura = [];
			} else if ($procedimiento_seleccionado) {
				permiso.jerarquiadirectaescritura = [ ];
				permiso.jerarquiadirectalectura = [ ];
				permiso.procedimientodirectalectura = [ $scope.procedimiento_seleccionado.codigo ];
				if ($scope.w_option) permiso.procedimientodirectaescritura = [ $scope.procedimiento_seleccionado.codigo ];
			}
			Permiso.create(permiso);
		} else {
			alert('No puede crear el usuario. Debe especificar login carm ó codigo de plaza');
		}		
	}
	
	$scope.value_searched_login_plaza = false;
	$scope.found_login_plaza = false;
	
	$scope.searched_login_plaza = function() {
		return $scope.value_searched_login_plaza;
	};
	
	$scope.clear_searched_login_plaza = function() {
		$scope.value_searched_login_plaza = false;
		$scope.found_login_plaza = false;
		$scope.buscado_nombre = "";
		$scope.buscado_apellidos = "";
		$scope.buscado_genero = "";
		$scope.buscado_telefono = "";
		$scope.buscado_encontrado = false;
	};
	
	$scope.login_search_login_plaza = function () { console.log("hoa"); plaza=""; $scope.search_login_plaza(); };
	$scope.plaza_search_login_plaza = function () { console.log("hoa"); logincarm=""; $scope.search_login_plaza(); };
	$scope.search_login_plaza = function () {
		if ($scope.logincarm) $scope.logincarm = $scope.logincarm.replace(/^\s+|\s+$/gm,'');
		if ($scope.plaza) $scope.plaza = $scope.plaza.replace(/^\s+|\s+$/gm,'');
		$scope.value_searched_login_plaza = true;	
		$scope.found_login_plaza = false;		
		if ($scope.logincarm &&  $scope.logincarm !="")
			$scope.personas_encontradas = PersonasByLogin.query({"login":$scope.logincarm}, function(){
				if ($scope.personas_encontradas.length>0) {
					$scope.buscado_encontrado = true;
					$scope.found_login_plaza = true;
				}
			});
		else if ($scope.plaza && $scope.plaza != "") 
			$scope.personas_encontradas = PersonasByPuesto.query({"cod_plaza":$scope.plaza}, function(){
				if ($scope.personas_encontradas.length>0) {
					$scope.buscado_encontrado = true;
					$scope.found_login_plaza = true;
				}
			});
	};
	
	$scope.not_found_login_plaza = function() {
		return $scope.value_searched_login_plaza && !$scope.found_login_plaza;
	};
	
	
	$scope.eliminarPermiso = function() {
		alert('No implementado');
	}
	
	$scope.searchUser = function(){
		alert('No implementado');
	}
	
	$scope.eliminarResponable = function(procedimiento, responsable) {
		alert('Función no implementada');
	};
	
	$scope.showDetailsPermiso = function(){
		$scope.show_details_permiso = true;
		$scope.seleccionado = false;		
	}
	
	$scope.jerarquia = [];
	$scope.jerarquia = $scope.jerarquia.concat($rootScope.session.permisoscalculados.jerarquialectura);
	$scope.jerarquia = $scope.jerarquia.concat($rootScope.session.permisoscalculados.jerarquiaescritura);
	$scope.superuser = $rootScope.session.permisoscalculados.superuser;
	
	/*
	if (!$rootScope.session.permisoscalculados || !Array.isArray($rootScope.session.permisoscalculados) || $rootScope.session.permisoscalculados.length==0 )
	var pc = PermisosCalculados.query({},function(){
		var spermisoscalculados = JSON.stringify(pc);
		$rootScope.session.permisoscalculados = JSON.parse(spermisoscalculados);
		$scope.jerarquia = $rootScope.session.permisoscalculados.jerarquialectura;
		$scope.superuser = $rootScope.session.permisoscalculados.superuser;
		console.log($rootScope.session.permisoscalculados);		
	});*/
	
	$scope.filtrojerarquia = function(item) {
		if ($scope.jerarquia.indexOf(item.id)!=-1 )
			return true;		
		if (item.nodes) for(var i=0;i<item.nodes.length;i++) 
			if ($scope.filtrojerarquia(item.nodes[i])) 
				return true;		
		return false;
	};

	$scope.cacheobjetos = {
		fecha : new Date()
	};
	
	$scope.getObjetoPermiso = function(permiso) {
		if ($scope.seleccionado_organica){ 
			if ($scope.seleccionado && $scope.nodo_jerarquia) {				
				var objeto = -1;
				var distancia = 1000000;
				var s_array_busqueda = "";
				
				if ($scope.is_show_inherited_users)
					s_array_busqueda = "ancestros";
				else if ($scope.is_show_recursive_users)
					s_array_busqueda = "descendientes";
							
				if ( permiso.jerarquiadirectalectura.indexOf( $scope.seleccionado.id ) !== -1 
					|| permiso.jerarquiadirectaescritura.indexOf( $scope.seleccionado.id ) !== -1
					)
					return $scope.seleccionado;
					
				var objs = [];
				if (Array.isArray(permiso.jerarquiadirectalectura) && 
					Array.isArray(permiso.jerarquiadirectaescritura) &&
					Array.isArray($scope.nodo_jerarquia[s_array_busqueda]))
						objs = intersect_safe(permiso.jerarquiadirectalectura.concat(permiso.jerarquiadirectaescritura),$scope.nodo_jerarquia[s_array_busqueda]);
				else  {
					console.error("Error, alguno de los arrays no es tal");
					return objs;
				}
				
				var resultado = [];
				for(var i=0;i<objs.length;i++){
					resultado[i] = Jerarquia.query({"idjerarquia":objs[i]}, function(){
						console.log(resultado[i]);
					});
				}				
				return resultado;
			} 		
		} 
	};
	
	
	$scope.filtrosocultos = false;
	$scope.setSeleccionado = function(seleccionad){
		if (seleccionad) {
			$scope.setSeleccionGenerico();			
			$scope.seleccionado = seleccionad;
			$scope.seleccionado_organica = true;
			$rootScope.setTitle(seleccionad.title); 
			//$scope.procedimientos = ProcedimientoList.query({idjerarquia:seleccionad.id}); 
			console.log("recursivo: "+$scope.is_show_recursive_users+" ; heredado: "+$scope.is_show_inherited_users);
			$scope.permisostotales = PermisosList.query({"idjerarquia":seleccionad.id, 'recursivo':($scope.is_show_recursive_users?1:($scope.is_show_inherited_users?2:0))}, function() {
				$scope.permisos = $scope.permisostotales.permisos;
				$scope.procedimientos = $scope.permisostotales.procedimientos;
			});		
			$scope.nodo_jerarquia = Jerarquia.query({"idjerarquia":$scope.seleccionado.id});
			// si no están cargados los procedimientos del nodo actual, los cargamos
			if (!$scope.seleccionado.procedimientos) for(var i=0;i<$scope.arbol.length;i++) {
				$scope.loadProcedimientos($scope.seleccionado, $scope.arbol[i]);
			}
		}
	};
		
	$scope.setProcSeleccionado = function(procedimiento)
	{
		if (procedimiento) {
			$scope.setSeleccionGenerico();
			$scope.procedimiento_seleccionado = procedimiento;
			$scope.seleccionado_organica = false;
			$rootScope.setTitle('['+procedimiento.codigo+'] '+procedimiento.description);
			var procesar_permisos_procedimiento = function(){
				$scope.permisos = $scope.permisostotales;
				$scope.procedimientos = [procedimiento];
			} ;
			if ($scope.is_show_inherited_users) {
				console.log("Recuperando permisos hacia arriba");
				$scope.permisostotales = PermisosProcedimientoList.query({'codigoprocedimiento':$scope.procedimiento_seleccionado.codigo}, procesar_permisos_procedimiento);			
			} else {
				console.log("Recuperando permisos directos");
				$scope.permisostotales = PermisosDirectosProcedimientoList.query({'codigoprocedimiento':$scope.procedimiento_seleccionado.codigo}, procesar_permisos_procedimiento );			
			}
		}
	}
	
	$scope.setSeleccionGenerico = function(){
		$scope.show_form_add_permiso = false;
		$scope.cumplimentados = 0;
		$scope.count = 1;
		$scope.persona_o_plaza = '';
		$scope.show_details_permiso=false;
	}
		
	$scope.loadProcedimientos = function(seleccionado, nodo){
		if (!seleccionado.procedimientos) {
			if (seleccionado.id == nodo.id) {
				// cargamos los procedimientos directamente asignados a este nodo. No recursivamente.
				console.log("Asignando procedimientos");
				seleccionado.procedimientos = ProcedimientoList.query({"idjerarquia":seleccionado.id,"recursivo":0}, function(ps){
					console.log("Recuperados "+ps.length);
					console.log(ps);
				});				
			} else {
				if (nodo.nodes) for(var i=0;i<nodo.nodes.length;i++)
				{
					$scope.loadProcedimientos(seleccionado, nodo.nodes[i]);
				}
			}
		} else console.log("Ya están cargados");
	}

	$scope.colorText = $rootScope.colorText;
	
	$scope.isR = function(permiso) {
		return true;
	}
	
	$scope.isW = function(permiso) {
		if ($scope.seleccionado_organica)
			return typeof $scope.seleccionado !== 'undefined' 
				&& typeof $scope.seleccionado.id !== 'undefined' 
				&& typeof permiso.jerarquiadirectaescritura !== 'undefined'
				&& Array.isArray(permiso.jerarquiaescritura)
				&& permiso.jerarquiaescritura.indexOf($scope.seleccionado.id)!==-1;
		else
			return typeof $scope.procedimiento_seleccionado !== 'undefined'
				&& $scope.procedimiento_seleccionado.codigo !== 'undefined'
				&& permiso.procedimientodirectaescritura !== 'undefined'
				&& Array.isArray(permiso.procedimientoescritura) 
				&& permiso.procedimientoescritura.indexOf($scope.procedimiento_seleccionado.codigo)!==-1;
	}

	$scope.isP = function(permiso) {
		return typeof permiso.grantoption !== 'undefined' 
			&& permiso.grantoption > 0;
	}

	$scope.clickHandler = function(e){
	   e.preventDefault();
	}	
	
	$scope.changeW = function(permiso) {
		if ($scope.isW(permiso)) {
			switch ($scope.seleccionado_organica) {
				case true:
						if (Array.isArray(permiso.jerarquiadirectaescritura))
							permiso.jerarquiadirectaescritura.splice(permiso.jerarquiadirectaescritura.indexOf($scope.seleccionado.id),1);
					break;
				case false:
						if (Array.isArray(permiso.procedimientodirectaescritura))
							permiso.procedimientodirectaescritura.splice(permiso.procedimientodirectaescritura.indexOf($scope.procedimiento_seleccionado.codigo),1);
					break;			
			}
		} else {
			switch ($scope.seleccionado_organica) {
				case true:
						if (Array.isArray(permiso.jerarquiadirectaescritura))
							permiso.jerarquiadirectaescritura.push($scope.seleccionado.id);
						else permiso.jerarquiadirectaescritura = [ $scope.seleccionado.id ];
					break;
				case false:
						if (Array.isArray(permiso.procedimientodirectaescritura))
							permiso.procedimientodirectaescritura.push($scope.procedimiento_seleccionado.codigo);
						else permiso.procedimientodirectaescritura = [$scope.procedimiento_seleccionado.codigo];
					break;			
			}
		}		
		alert('No salvado. por implementar');
	}
	
	$scope.changeP = function(permiso) {
		permiso.grantoption = !permiso.grantoption;
		alert('No salvado. por implementar');
	}
	

	
	$scope.isFiltroSelected= function(filtro,key,fa){
		return (typeof filtro[key] != 'undefined' && fa.name==filtro[key]);
	};


	
	var personas_plazas_aux = PersonasSearchList.query({},function(err,data){
		$scope.personas_plazas=[];
		for(var i=0;i<personas_plazas_aux.length;i++)
		{
			$scope.personas_plazas.push(personas_plazas_aux[i].data);
		}
	});
	
    
	
}
PermisoCtrl.$inject = ['$rootScope','$scope','$location','$window','Arbol','Session','PermisosList','PersonasSearchList','ProcedimientoList','PermisosProcedimientoList','PermisosDirectosProcedimientoList','Jerarquia','Permiso', 'PersonasByPuesto', 'PersonasByLogin'];
