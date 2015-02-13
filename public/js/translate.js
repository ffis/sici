(function(angular){
'use strict';


angular.module('sici.translate', ['pascalprecht.translate'], ['$translateProvider',
	function ($translateProvider) {

		$translateProvider.translations('es_ES', {
			'codigo': 'Código',
			'denominacion': 'Denominación',
			'tipo': 'Tipo',
			'cod_plaza': 'Código de plaza',
			'fecha_creacion': 'Fecha de registro',
			'fecha_fin': 'Fecha de fin',
			'fecha_version': 'Fecha de versión',
			'en_plazo': 'En plazo',
			'fuera_plazo': 'Fuera de plazo',
			'iniciados': 'Iniciados',
			'pendientes': 'Pendientes',
			'periodos_cerrados': 'Períodos cerrados',
			'quejas': 'Quejas presentadas en el mes',
			'recursos': 'Recursos presentados en el mes',
			'resueltos_1': 'Resueltos < 1',
			'resueltos_5': 'Resueltos 1 < 5',
			'resueltos_10': 'Resueltos 5 < 10',
			'resueltos_15': 'Resueltos 10 < 15',
			'resueltos_30': 'Resueltos 15 < 30',
			'resueltos_45': 'Resueltos 30 < 45',
			'resueltos_mas_45': 'Resueltos > 45',
			'resueltos_desistimiento_renuncia_caducidad': 'Resueltos por Desistimiento/Renuncia/Caducidad (Resp_Ciudadano)',
			'resueltos_prescripcion': 'Resueltos por Prescripción/Caducidad (Resp. Admón.)',
			'solicitados': 'Solicitados',
			't_medio_habiles': 'Tiempo medio en días hábiles descontando Tiempo de suspensiones',
			't_medio_naturales': 'Tiempo medio en días naturales',
			'total_resueltos': 'Resueltos totales ',
			'totalsolicitudes': 'Solicitudes totales ',
			'pendientes_iniciales': 'Pendientes iniciales (a 31-12)',
			'periodoscerrados': 'Períodos cerrados',
			'plazo_CS_ANS_habiles': 'Plazo CS /ANS (dias hábiles)',
			'plazo_CS_ANS_naturales': 'Plazo CS /ANS (dias naturales)',
			'plazo_maximo_resolver': 'Plazo máximo legal para resolver (días naturales)',
			'plazo_maximo_responder': 'Plazo máximo legal para responder (días hábiles)',
			'codplaza': 'Código de plaza',
			'login': 'Login CARM',
			'nombre': 'Nombre',
			'apellidos': 'Apellidos',
			'telefono': 'Teléfono',
			'ancestro_v_1': 'Nivel 1',
			'ancestro_v_2': 'Nivel 2',
			'ancestro_v_3': 'Nivel 3',
			'ancestro_v_4': 'Nivel 4'
		});
		$translateProvider.preferredLanguage('es_ES');
	}]);
})(angular);
