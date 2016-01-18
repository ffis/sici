(function(angular, d3){
	'use strict';
	angular.module('sici')
		.controller('DetallesOrganicaCtrl', ['$q', '$rootScope', '$scope', '$routeParams', '$window', '$location', '$timeout', '$http', '$log', 'JerarquiaAncestros', 'Periodo', 'ExportarResultadosJerarquia', 'ResumenNodoJerarquia', 'Jerarquia',
			function ($q, $rootScope, $scope, $routeParams, $window, $location, $timeout, $http, $log, JerarquiaAncestros, Periodo, ExportarResultadosJerarquia, ResumenNodoJerarquia, Jerarquia) {

				$scope.numgraphs = 0;
				$scope.graficasbarras = false;
				$scope.mesActual = (new Date()).getMonth();
				$scope.graphs = false;
				$scope.padre = '';
				$scope.ancestros = [];

				$scope.periodos = Periodo.query(function(){
					$scope.periodo = $scope.periodos[0];
				});

				$scope.getAncestros = function() {
					/* function(jerarquia) */
					return $scope.ancestros;
				};

				$scope.nextYear = function () {
					var year = parseInt($scope.anualidad.replace('a', '')) + 1;
					$scope.anualidad = '' + (year);
					$scope.updateGraphKeys(year);
				};

				$scope.exists = function (attr) {
					if ($scope.anualidad) {
						return $scope.resumenJerarquiaSeleccionada[$scope.anualidad] &&
							typeof $scope.resumenJerarquiaSeleccionada[$scope.anualidad][attr] !== 'undefined';
					}
				};

				$scope.prevYear = function () {
					var year = parseInt($scope.anualidad.replace('a', '')) - 1;
					$scope.anualidad = '' + (year);
					$scope.updateGraphKeys(year);
				};

				$scope.getNext = function () {
					if ($scope.anualidad) {
						return '' + (parseInt($scope.anualidad.replace('a', '')) + 1);
					}
				};

				$scope.getPrev = function () {
					if ($scope.anualidad) {
						return '' + (parseInt($scope.anualidad.replace('a', '')) - 1);
					}
				};

				$scope.editarPadre = function () {
					$scope.mostrarAutocompletePadre = true;
				};

				$scope.ocultarEditarPadre = function () {
					$scope.mostrarAutocompletePadre = false;
				};

				$scope.deletePadre = function () {
					$scope.procedimientoSeleccionado.padre = null;
					$scope.procedimientoSeleccionado.$update(function (response) {
						$log.error(response);
					});
					$scope.nombrePadre = 'Sin definir';
				};

				$scope.descargarExcel = function () {
					$scope.actualizando = 1;

					ExportarResultadosJerarquia.get({jerarquia: $scope.jerarquiaSeleccionada.id}, function (token) {
						$scope.actualizando = 0;
						$scope.respuesta = {
							clase: 'alert-success',
							mensaje: 'Ha funcionado correctamente.'
						};
						var url = '/download/' + token.time + '/' + token.hash;
						$window.location = url;
					}, function () {
						$scope.actualizando = 0;
						$scope.respuesta = {
							clase: 'alert-warning',
							mensaje: 'Error al descargar el informe.'
						};
					});
				};

				$scope.updateGraphKeys = function(anualidad) {
					anualidad = parseInt(anualidad);
					$log.log('voy a dibujar anualidad=' + anualidad);
					var anualidadAnterior = anualidad - 1;
					var graphskeys = [
						{
							caption: 'RESUMEN DE DATOS DE GESTIÓN ' + anualidad,
							keys: [
								{caption: 'Solicitados', vals: '' + anualidad + '.solicitados', maxx: $scope.mesActual},
								{caption: 'Iniciados', vals: '' + anualidad + '.iniciados', maxx: $scope.mesActual},
								{caption: 'Pendientes', vals: '' + anualidad + '.pendientes', maxx: $scope.mesActual},
								{caption: 'Total resueltos', vals: '' + anualidad + '.total_resueltos', maxx: $scope.mesActual},
								{caption: 'Total resueltos ' + anualidadAnterior, vals: '' + anualidadAnterior + '.total_resueltos', maxx: 12}
							]
						},
						{
							caption: 'RESUELTOS EN PLAZO ' + anualidad,
							keys: [
								{caption: 'En plazo', vals: '' + anualidad + '.en_plazo', maxx: $scope.mesActual},
								{caption: 'Fuera de plazo', vals: '' + anualidad + '.fuera_plazo', maxx: $scope.mesActual}
							]
						},
						{
							caption: 'DESESTIMIENTOS/RENUNCIAS Y PRESCRITOS/CADUCADOS ' + anualidad,
							keys: [
								{caption: 'Resueltos por Desistimiento/Renuncia/Caducidad (Resp_Ciudadano)', vals: '' + anualidad + '.resueltos_desistimiento_renuncia_caducidad', maxx: $scope.mesActual},
								{caption: 'Resueltos por Prescripcion/Caducidad (Resp_Admon)', vals: '' + anualidad + '.resueltos_prescripcion', maxx: $scope.mesActual}
							]
						},
						{
							caption: 'QUEJAS Y RECURSOS CONTRA EL PROCEDIMIENTO ' + anualidad, keys: [
								{caption: 'Quejas presentadas en el mes', vals: '' + anualidad + '.quejas', maxx: $scope.mesActual},
								{caption: 'Recursos presentados en el mes', vals: '' + anualidad + '.recursos', maxx: $scope.mesActual}
							]
						}
					];
					$scope.graphskeys = graphskeys;
					$scope.graphs = [];
					$scope.numgraphs = 0;
					graphskeys.forEach(function (g, i) {
						var maxvalue = 0;
						var data = [];
						var caption = g.caption;
						g.keys.forEach(function (key, indx) {
							var k = $scope.resumenJerarquiaSeleccionada;
							var values = [];
							var indexes = key.vals.split('.');
							for (var j in indexes) {
								var index = indexes[j];
								if (typeof k[index] === 'undefined'){
									break;
								}
								k = k[index];
							}
							if (typeof k !== 'undefined' && k.length > 0) {
								k.forEach(function (val, idx) {
									//dibujar meses anteriores al actual
									if ((anualidad < $scope.anualidadActual) || ( (idx <= graphskeys[i].keys[indx].maxx) && (anualidad === $scope.anualidadActual) )) {
										values.push([idx, val]);
										if (maxvalue < val){
											maxvalue = val;
										}
									}
								});
								if (values.length > 0){
									data.push({key: key.caption, values: values});
								}
							} else {
								$log.log('Index malo:' + JSON.stringify(indexes));
								$log.log(JSON.stringify($scope.resumenJerarquiaSeleccionada));
							}
						});
						var forcey = [0, Math.ceil(maxvalue * 1.3)];
						if (maxvalue > 0 && data.length > 0) {

							$scope.graphs.push({data: data, forcey: forcey, caption: caption});
							$scope.numgraphs = $scope.numgraphs + 1;
							$log.log($scope.graphs);
						}
					});
				};


				$scope.resumenJerarquiaSeleccionada = ResumenNodoJerarquia.get({jerarquia: $routeParams.idjerarquia},
					function(){
						$scope.updateGraphKeys($scope.anualidad.replace('a', ''));
					}
				);

				$scope.jerarquiaSeleccionada = Jerarquia.get({id: $routeParams.idjerarquia}, function () {
					$rootScope.setTitle('$scope.jerarquiaSeleccionada.nombrelargo');
					$scope.anualidad = '' + (new Date()).getFullYear();
					$scope.anualidadActual = parseInt($scope.anualidad.replace('a', ''));
					//$scope.procedimientosPadre = ProcedimientoList.query({'idjerarquia': $scope.procedimientoSeleccionado.idjerarquia, 'recursivo': false});

					$scope.ancestros = JerarquiaAncestros.query({'idjerarquia': $routeParams.idjerarquia}, function(){
						if ($scope.ancestros && $scope.ancestros[0] && $scope.ancestros[0].id === 1)
						{
							$scope.ancestros.reverse();//TODO: revisar este parche
						}
					});


					$scope.superuser = $rootScope.superuser();

					$scope.filtrosocultos = false;

					$scope.gotoBreadCrumb = function () {
						//$location.hash('breadcrumb');
					};

					$scope.gotOkCancel = function () {
						//$location.hash('ok_cancel_changeOrganica');
					};
				});

				$scope.attrspar = [
					'id', 'nombrelargo', 'numprocedimientos'
				];

				$scope.attrstabla = [
					'solicitados',
					'iniciados',
					'quejas', 'recursos',
					'resueltos_1', 'resueltos_5', 'resueltos_10', 'resueltos_15', 'resueltos_30', 'resueltos_45', 'resueltos_mas_45',
					'resueltos_desistimiento_renuncia_caducidad', 'resueltos_prescripcion',
					'en_plazo',
					't_medio_habiles', 't_medio_naturales'
				];
				/* 'totalsolicitudes', */
				$scope.attrstablacalculados = ['total_resueltos', 'fuera_plazo', 'pendientes'];
				$scope.attrstabla = $scope.attrstabla.concat($scope.attrstablacalculados);

				$scope.meses = $rootScope.meses;
				$scope.colorText = $rootScope.colorText;

				$scope.graficasgrandes = false;
				$scope.xAxisTickValuesFunction = function () {
					return function () {
						return [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11];
					};
				};
				$scope.xAxisTickFormatFunction = function () {
					return function (d) {
						return $scope.meses[d];
					};
				};
				$scope.colorFunction2 = function () {
					return function (d, i) {
						return $rootScope.colorToHex($rootScope.colorText(i, 5, 60));
					};
				};
				var colorCategory = d3.scale.category20b();
				$scope.colorFunction = function () {
					return function (d, i) {
						return colorCategory(i);
					};
				};

				$scope.checkNumber = function (data, anualidad, attr, index) {

					$scope.cellChanged = ($scope.resumenJerarquiaSeleccionada[anualidad][attr][index] !== data);

					var valor = parseInt(data);
					if (isNaN(valor) || !/^\d+$/.test(data)) {
						return 'Esto no es un número';
					} else if (valor < 0) {
						return 'No se admiten valores menores de 0';
					}
				};

			//    $scope.downloadGraphic = function (id) {
			//        console.log(id);
			//        var canvas = document.getElementById(id);
			//        var ctx = canvas.getContext("2d");
			//        // draw to canvas...
			//        canvas.toBlob(function (blob) {
			//            saveAs(blob, "image.png");
			//        });
			//    };
			//
			//    $scope.guardarImagen = function(id) {
			////        http://techslides.com/save-svg-as-an-image
			//      var html = d3.select('#svg'+id)
			//        .attr("version", 1.1)
			//        .attr("xmlns", "http://www.w3.org/2000/svg")
			//        .node().parentNode.innerHTML;
			//
			//        console.log(html);
			//        var imgsrc = 'data:image/svg+xml;base64,'+ btoa(html);
			//        var img = '<img src="'+imgsrc+'">';
			//        d3.select("#svgdataurl"+id).html(img);
			//
			//
			//        var canvas = document.querySelector("canvas"),
			//                context = canvas.getContext("2d");
			//
			//        var image = new Image();
			//        image.src = imgsrc;
			//        image.onload = function() {
			//            context.drawImage(image, 0, 0);
			//            var canvasdata = canvas.toDataURL("image/png");
			//            var pngimg = '<img src="'+canvasdata+'">';
			//            d3.select("#pngdataurl"+id).html(pngimg);
			//
			//            var a = document.createElement("a");
			//            a.download = "grafica.png";
			//            a.href = canvasdata;
			//            a.click();
			//        };
			//    };

			}
		]);

})(angular, d3);
