function DetallesCtrl($rootScope,$scope, $routeParams, $window, Procedimiento,DetalleCarmProcedimiento,DetalleCarmProcedimiento2,Raw,Aggregate) {

	$scope.detallesCarm = DetalleCarmProcedimiento.get({codigo:$routeParams.codigo});
	$scope.detallesCarm2 = DetalleCarmProcedimiento2.get({codigo:$routeParams.codigo});		
	$scope.numgraphs = 0;
	$scope.graficasbarras = false;
	$scope.mesActual = (new Date()).getMonth();
	$scope.detallesCarmHTML = true;
	$scope.graphs = false;

	$scope.save 

	$scope.procedimientoSeleccionado = Procedimiento.get({codigo: $routeParams.codigo } ,function(){
		$window.document.title ='SICI: '+$scope.procedimientoSeleccionado.denominacion;
		$scope.anualidad = 0;
		for (var anualidad in $scope.procedimientoSeleccionado.periodos){
			if (parseInt(anualidad) > $scope.anualidad)
				$scope.anualidad = anualidad;	
		}
		if ($scope.procedimientoSeleccionado.ancestros[0].id==1){
			$scope.procedimientoSeleccionado.ancestros.reverse();//TODO: revisar este parche
		}
		
		var cod_plaza = $scope.procedimientoSeleccionado.cod_plaza;
		var graphskeys = [
				{caption:'RESUMEN DE DATOS DE GESTIÓN '+$scope.anualidad,keys:[
					{caption:'Solicitados', vals:'periodos.'+$scope.anualidad+'.solicitados', maxx: $scope.mesActual},
					{caption:'Iniciados', vals:'periodos.'+$scope.anualidad+'.iniciados', maxx: $scope.mesActual},
					{caption:'Pendientes', vals:'periodos.'+$scope.anualidad+'.pendientes', maxx: $scope.mesActual},
					{caption:'Total resueltos', vals:'periodos.'+$scope.anualidad+'.total_resueltos', maxx: $scope.mesActual},
					{caption:'Total resueltos '+($scope.anualidad-1), vals:'periodos.'+($scope.anualidad-1)+'.total_resueltos', maxx: 12},
				]},
				{caption:'RESUELTOS EN PLAZO '+$scope.anualidad,keys:[
					{caption:'En plazo', vals:'periodos.'+$scope.anualidad+'.en_plazo', maxx: $scope.mesActual},
					{caption:'Fuera de plazo', vals:'periodos.'+$scope.anualidad+'.fuera_plazo', maxx: $scope.mesActual},
					]},
				{caption:'DESESTIMIENTOS/RENUNCIAS Y PRESCRITOS/CADUCADOS '+$scope.anualidad,keys:[
					{caption:'Resueltos por Desistimiento/Renuncia/Caducidad (Resp_Ciudadano)', vals:'periodos.'+$scope.anualidad+'.resueltos_desistimiento_renuncia_caducidad', maxx: $scope.mesActual},
					{caption:'Resueltos por Prescripcion/Caducidad (Resp_Admon)', vals:'periodos.'+$scope.anualidad+'.resueltos_prescripcion', maxx: $scope.mesActual},
					]},
				{caption:'QUEJAS Y RECURSOS CONTRA EL PROCEDIMIENTO '+$scope.anualidad,keys:[
					{caption:'Quejas presentadas en el mes', vals:'periodos.'+$scope.anualidad+'.quejas', maxx: $scope.mesActual},
					{caption:'Recursos presentados en el mes', vals:'periodos.'+$scope.anualidad+'.recursos', maxx: $scope.mesActual},
					]},
			];
		$scope.graphskeys = graphskeys;
		$scope.graphs = [];
		$scope.numgraphs = 0;
		graphskeys.forEach(function(g, i){
			var maxvalue = 0;
			var data = [];
			var caption = g.caption;
			g.keys.forEach(function(key,indx){
				var k = $scope.procedimientoSeleccionado;
				var values = [];
				var indexes = key.vals.split('.');
				for(var j in indexes){
					var index = indexes[j];
					if (typeof k[index] == 'undefined') break;
					k = k[index];
				}
				if (typeof k != 'undefined' && k.length >0){
					k.forEach(function (val,idx) {
						try{
						console.log(idx +':'+graphskeys[i].keys[indx].maxx);
					}catch(e){
						console.error(i+':'+indx);
					}
						if (idx < graphskeys[i].keys[indx].maxx  ){
							values.push( [ idx, val] ) ;
							if (maxvalue< val) maxvalue=val;
						}
					});
					data.push(	{ "key": key.caption,"values": values} );
				}else{
					console.log('Index malo:'+indexes);
				}
			})
			var forcey = [0, Math.ceil(maxvalue*1.3) ];
			if (maxvalue>0){
				$scope.graphs.push( { data : data, forcey : forcey, caption:caption } );
				$scope.numgraphs = $scope.numgraphs+1;
			}
		})

		$scope.inconsistencias =  Raw.query({model: 'reglasinconsistencias'},function(){
			$scope.inconsistencias.forEach(function(i,idx){
				var campo = {'codigo':'$codigo'};
				try{
					var restriccion = JSON.parse(i.restriccion);
					restriccion.codigo = $scope.procedimientoSeleccionado.codigo;
					$scope.inconsistencias[idx].datos = Aggregate.query({ campo : JSON.stringify(campo), restriccion:JSON.stringify(restriccion)});
				}catch(exception){
					console.error('La restricción '+i.restriccion+' no es correcta');
				}
			});
		});
	} );	
	$scope.attrspar = [
		'codigo', 'denominacion', 'tipo', 'cod_plaza', 'fecha_creacion', 'fecha_version', /* 'fecha_fin', */
	];
	$scope.attrsanualidad = ['pendientes_iniciales','periodoscerrados',
		'plazo_CS_ANS_habiles','plazo_CS_ANS_naturales','plazo_maximo_resolver','plazo_maximo_responder'];
		
	$scope.attrstabla = [
		'solicitados',
		'iniciados','periodos_cerrados',
		'quejas','recursos',
		'resueltos_1','resueltos_5','resueltos_10','resueltos_15','resueltos_30','resueltos_45','resueltos_mas_45',
		'resueltos_desistimiento_renuncia_caducidad','resueltos_prescripcion',
		'en_plazo',
		't_medio_habiles','t_medio_naturales',
		];
		/* 'totalsolicitudes', */
	$scope.attrstablacalculados = ['total_resueltos','fuera_plazo', 'pendientes'];
	$scope.attrsresp = ['codplaza', 'login','nombre','apellidos','telefono'];

	$scope.meses = $rootScope.meses;
	$scope.colorText = $rootScope.colorText;

	$scope.graficasgrandes = false;
	$scope.xAxisTickValuesFunction = function(){ return function(d){ return [0,1,2,3,4,5,6,7,8,9,10,11]; };};
	$scope.xAxisTickFormatFunction = function(){ return function(d){ return $scope.meses[d]; } };
	$scope.colorFunction2= function(){ return function(d,i){ 
		var color = $scope.colorText(i, 5, 60);
		var r = (color.red<16 ? '0': '')+color.red.toString(16), g = (color.green<16 ? '0': '')+color.green.toString(16), b = (color.blue<16 ? '0': '')+color.blue.toString(16);
	 	return '#'+r+g+b;
	}};
	var colorCategory = d3.scale.category20b()
	$scope.colorFunction = function() {
	    return function(d, i) {
	        return colorCategory(i);
	    };
	};

	$scope.recalculate = function(){
		//
		console.log('incluir código recálculo, a hacer en el servidor');
		$scope.procedimientoSeleccionado.$update(function(response){
			console.error(response);
		});
	}
	$scope.checkNumber = function(data) {
		var valor = parseInt(data);
	    if(isNaN(valor) || ! /^\d+$/.test(data) ){
	      	return "Esto no es un número";
	    }else if (valor<0){
	    	return "No se admiten valores menores de 0";
	    }
	};    
}
DetallesCtrl.$inject = ['$rootScope','$scope','$routeParams','$window','Procedimiento','DetalleCarmProcedimiento','DetalleCarmProcedimiento2','Raw','Aggregate'];

function parseStr2Int (str){
	var valor = parseInt(str);
	if(isNaN(valor) || ! /^\d+$/.test(data) ) valor=0;
	return valor;
}
