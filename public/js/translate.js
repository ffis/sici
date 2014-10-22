'use strict';

angular.module('sici.translate', ['pascalprecht.translate'], ['$translateProvider', function ($translateProvider) {

	$translateProvider.translations('es_ES',{
		'codigo': 'Código',
		'denominacion': 'Denominación',

		'tipo' : 'Tipo',
		'codplaza': 'Código de plaza',
		'fechacreacion' : 'Fecha de registro',
		'fechafin' : 'Fecha de fin',
		'fechaversion' : 'Fecha de versión',

		'en_plazo' : 'En plazo',
		'fuera_plazo' : 'Fuera de plazo',
		'iniciados': 'Iniciados',
		'pendientes' : 'Pendientes',
		'periodos_cerrados': 'Períodos cerrados',
		'quejas': 'Quejas presentadas en el mes',
		'recursos' : 'Recursos presentados en el mes',
		'resueltos_1': 'Resueltos < 1',
		'resueltos_5': 'Resueltos 1 < 5',
		'resueltos_10': 'Resueltos 5 < 10',
		'resueltos_15': 'Resueltos 10 < 15',
		'resueltos_30': 'Resueltos 15 < 30',
		'resueltos_45': 'Resueltos 30 < 45',
		'resueltos_mas_45': 'Resueltos > 45',
		'resueltos_desistimiento_renuncia_caducidad' : 'Resueltos por Desistimiento/Renuncia/Caducidad (Resp_Ciudadano)',
		'resueltos_prescripcion': 'Resueltos por Prescripción/Caducidad (Resp. Admón.)',
		'solicitados': 'Solicitados',
		't_medio_habiles': 'Tiempo medio en días hábiles',
		't_medio_naturales' : 'Tiempo medio en días naturales',
		'total_resueltos' : 'Resueltos totales ',
		'totalsolicitudes' : 'Solicitudes totales ',

		'pendientes_iniciales':'Pendientes iniciales (a 31-12)',
		'periodoscerrados': 'Períodos cerrados',
		'plazo_CS_ANS_habiles': 'Plazo CS /ANS (dias hábiles)',
		'plazo_CS_ANS_naturales': 'Plazo CS /ANS (dias naturales)',
		'plazo_maximo_resolver': 'Plazo máximo legal para resolver (días naturales)',
		'plazo_maximo_responder': 'Plazo maximo legal para responder (dias hábiles)',
	});
	$translateProvider.preferredLanguage('es_ES');
}]);
