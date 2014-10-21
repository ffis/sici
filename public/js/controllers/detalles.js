function DetallesCtrl($rootScope,$scope, $routeParams, $window, Procedimiento,DetalleCarmProcedimiento,DetalleCarmProcedimiento2,Raw,Aggregate) {

	$scope.detallesCarm = DetalleCarmProcedimiento.get({codigo:$routeParams.codigo});
	$scope.detallesCarm2 = DetalleCarmProcedimiento2.get({codigo:$routeParams.codigo});		
	$scope.numgraphs = 0;
	$scope.graficasbarras = false;
	$scope.mesActual = (new Date()).getMonth();
	$scope.procedimientoSeleccionado = Procedimiento.get({codigo: $routeParams.codigo } ,function(){
		$window.document.title ='SICI: '+$scope.procedimientoSeleccionado.denominacion;
		var graphskeys = [
				{caption:'RESUMEN DE DATOS DE GESTIÓN',keys:['Solicitados','Iniciados','Pendientes','Total resueltos']},
				{caption:'RESUELTOS EN PLAZO',keys:['En plazo','Fuera de plazo']},
				{caption:'DESESTIMIENTOS/RENUNCIAS Y PRESCRITOS/CADUCADOS',keys:['Resueltos por Desistimiento/Renuncia/Caducidad (Resp_Ciudadano)',	'Resueltos por Prescripcion/Caducidad (Resp_Admon)']},
				{caption:'QUEJAS Y RECURSOS CONTRA EL PROCEDIMIENTO',keys:['Quejas presentadas en el mes','Recursos presentados en el mes']},
				{caption:'VARIACIÓN DE TRAMITACIÓN MENSUAL (DATOS ABSOLUTOS)',keys:['Tramitados 2013','Total resueltos']},
			];
		$scope.graphs = [];
		graphskeys.forEach(function(g, i){
			$scope.numgraphs = 0;
			var maxvalue = 0;
			var data = [];
			var caption = g.caption;
			g.keys.forEach(function(key,indx){
				var values = [];
				$scope.procedimientoSeleccionado[key].forEach(function (val,idx) {
					values.push( [ idx, val] ) ;
					if (maxvalue< val) maxvalue=val;
				});
				data.push(	{ "key": key,"values": values} );
			})
			var forcey = [0, Math.ceil(maxvalue*1.3) ];
			if (maxvalue>0){
				$scope.graphs.push( { data : data, forcey : forcey, caption:caption} );
				$scope.numgraphs++;
			}
		})

		$scope.inconsistencias =  Raw.query({model: 'reglasinconsistencias'},function(){
			$scope.inconsistencias.forEach(function(i,idx){
				var campo = {'codigo':'$codigo'};
				var restriccion = JSON.parse(i.restriccion);
				restriccion.CODIGO = $scope.procedimientoSeleccionado['codigo'];
				$scope.inconsistencias[idx].datos = Aggregate.query({ campo : JSON.stringify(campo), restriccion:JSON.stringify(restriccion)});
			});
		});

	} );	
	$scope.attrspar = [

		'codigo',
		'denominacion',
		'tipo',
		'codplaza',
		'fechacreacion',
		'fechafin',
		'fechaversion',

		/*
		'codigo',
		'denominacion',
		'Codigo Nivel 1',
		'Denominacion Nivel 1',
		'Codigo Nivel 2',
		'Denominacion Nivel 2',
		'Codigo Nivel 3',
		'Denominacion Nivel 3',
		*/
		'Codigo plaza responsable',
		'Login responsable',
		'Nombre responsable',
		'Correo-e responsable',
		'Teléfono responsable',
		'Plazo maximo legal para resolver (dias naturales)',
		'Plazo maximo legal para responder (dias habiles)',
		'Plazo CS /ANS (dias naturales)',
		'Plazo CS /ANS (dias habiles)',
		'Pendientes iniciales (a 31-12)',
	];
	$scope.attrstabla = [
		'Tramitados 2013','Solicitados',
		'Iniciados',
		'Resueltos [1]',
		'Resueltos [5]',
		'Resueltos [10]',
		'Resueltos [15]',
		'Resueltos [30]',
		'Resueltos [45]',
		'Resueltos [>45]',
		'Resueltos por Desistimiento/Renuncia/Caducidad (Resp_Ciudadano)',
		'Resueltos por Prescripcion/Caducidad (Resp_Admon)',
		'T_ medio dias naturales',
		'T_ medio dias habiles descontando T_ de suspensiones',
		'En plazo',
		'Quejas presentadas en el mes',
		'Recursos presentados en el mes',
		];
	$scope.attrstablacalculados = ['Total resueltos', 'Fuera de plazo', 'Pendientes'];
	$scope.meses = $rootScope.meses;
	$scope.graficasgrandes = false;
	$scope.colorText = function(i, numcolors, phase)
	{
	    if (phase == undefined) phase = 0;
	    center = 128;
	    width = 127;
	    frequency = Math.PI*2/numcolors;
	    
	    return {
	        red   : Math.ceil(Math.sin(frequency*i+2+phase) * width + center),
	        green : Math.ceil(Math.sin(frequency*i+0+phase) * width + center),
	        blue  : Math.ceil(Math.sin(frequency*i+4+phase) * width + center)
	    };
	};
	$scope.xAxisTickValuesFunction = function(){ return function(d){ return [0,1,2,3,4,5,6,7,8,9,10,11]; };};
	$scope.xAxisTickFormatFunction = function(){ return function(d){ return $scope.meses[d]; } };
	$scope.colorFunction2= function(){ return function(d,i){ 
		var color = $scope.colorText(i, 5, 60);
		var r = (color.red<16 ? '0': '')+color.red.toString(16), g = (color.green<16 ? '0': '')+color.green.toString(16), b = (color.blue<16 ? '0': '')+color.blue.toString(16);
		//console.log('#'+r+g+b);
	 	return '#'+r+g+b;
	}};
	var colorCategory = d3.scale.category20b()
	$scope.colorFunction = function() {
	    return function(d, i) {
	        return colorCategory(i);
	    };
	};
	$scope.graphs = false;
	$scope.recalculate = function(){
		var objeto = $scope.procedimientoSeleccionado;
		objeto['Total resueltos'] = [];
		objeto['Fuera de plazo']  =[];
		objeto['Pendientes'] = [];
		objeto.Incidencias = {
			'Se han resuelto expedientes fuera de Plazo': [],
			'Aumenta el N de expedientes pendientes': [],
			'Hay quejas presentadas': [],
			'Hay expedientes prescritos/caducados': [],
			'Las solicitudes aumentan al menos 20%': [],
			'Posible incumplimiento de compromisos': [],
		};

		var pendientes = parseStr2Int( objeto['Pendientes iniciales (a 31-12)']);
		var solicitudesprevias = parseStr2Int( objeto['Solicitados'][0]);
		var totalsolicitudes = 0;
		for(var mes = 0; mes<12;mes++){
			var pendientesprevios = pendientes;
			var totalresueltos =
				parseStr2Int(objeto['Resueltos [1]'][mes])+parseStr2Int(objeto['Resueltos [5]'][mes])+parseStr2Int(objeto['Resueltos [10]'][mes])+
				parseStr2Int(objeto['Resueltos [15]'][mes])+
				parseStr2Int(objeto['Resueltos [30]'][mes])+parseStr2Int(objeto['Resueltos [45]'][mes])+parseStr2Int(objeto['Resueltos [>45]'][mes])+
				parseStr2Int(objeto['Resueltos por Desistimiento/Renuncia/Caducidad (Resp_Ciudadano)'][mes]) +
				parseStr2Int(objeto['Resueltos por Prescripcion/Caducidad (Resp_Admon)'][mes]);
			var fueradeplazo = totalresueltos - parseStr2Int(objeto['En plazo'][mes]);
			var solicitudes = parseStr2Int(objeto['Solicitados'][mes]);
			totalsolicitudes += solicitudes;
			pendientes = pendientes + solicitudes - totalresueltos ;

			objeto['Total resueltos'].push(totalresueltos);
			objeto['Fuera de plazo'].push(fueradeplazo);
			objeto['Pendientes'].push(pendientes);

			objeto.Incidencias['Se han resuelto expedientes fuera de Plazo'].push( fueradeplazo );
			objeto.Incidencias['Aumenta el N de expedientes pendientes'].push( pendientes > pendientesprevios ? pendientes - pendientesprevios : 0 );
			objeto.Incidencias['Hay quejas presentadas'].push( parseStr2Int(objeto['Quejas presentadas en el mes'][mes]) );
			objeto.Incidencias['Hay expedientes prescritos/caducados'].push( parseStr2Int(objeto['Resueltos por Prescripcion/Caducidad (Resp_Admon)'][mes]) );
			objeto.Incidencias['Las solicitudes aumentan al menos 20%'].push( (solicitudes > solicitudesprevias*1.2) ? solicitudes-solicitudesprevias : 0 );
			objeto.Incidencias['Posible incumplimiento de compromisos'].push( 0 );
			solicitudesprevias = solicitudes;
		}
		
		
		var ultimomesconsolicitados=11;
		for(; ultimomesconsolicitados>0; ultimomesconsolicitados--){
			if (parseInt(objeto.Solicitados[ultimomesconsolicitados]) >0) break;
		}

		ultimomesconsolicitados++;
		for(;ultimomesconsolicitados<12;ultimomesconsolicitados++)
			objeto.Pendientes[ultimomesconsolicitados]=0;
			
		objeto['totalsolicitudes'] = totalsolicitudes;

		$scope.procedimientoSeleccionado = objeto;
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
	if(isNaN(valor)) valor=0;
	return valor;
}
