(function(module, log){
	'use strict';
	var mongoose = false;
	var schemas = {};
	var mapconstructors = {};
	var schemasfields = {
		'crawled': {'id': Number, 'jerarquia': [String], 'completo': String, 'oculto': Boolean, 'eliminado': Boolean, 'expires': Date},
		'guiacarm': {'id': Number, 'titulo': String},
		'settings': {
			'version': Number,
			'secret': String,
			'secret2': String,
			'anyo': String,
			'port': Number,
			'urlbasedecrypt': String,
			'logincarm': Boolean,
			'ws_url': String,
			'ws_user': String,
			'ws_pwd': String,
			'downloadhashprefix': String,
			'session_time': Number,
			'cas': {
				'baseurl': String,
				'login': String,
				'service': String
			}
		},
		'reglasinconsistencias': {'titulo': String, 'restriccion': String},
		'historico': {},
		'historicoindicador': {},
		//periodo: { a2013:[Number], a2014:[Number], a2015:[Number], a2016:[Number] },
		'periodo': {},
		'planmejora': {},
		'accionmejora': {},
		'feedback': {
			'usr': String,
			'fecha': Date,
			'url': String,
			'comentario': String,
			'contacto': String,
			'captura': String,
			'estado': String,
			'tipo': String,
			'destinatario': String
		},
		'persona': {
			'codplaza': String,
			'login': String,
			'nombre': String,
			'apellidos': String,
			'genero': String,
			'telefono': String,
			'habilitado': Boolean,
			'ultimologin': Date,
			'ultimoupdate': Date,
			'contrasenya': String,
			'teletrabajador': Boolean,
			'actualizaciones': [{
				'fecha': Date,
				'comentario': String
			}]
		},
		'permiso': {
			'codplaza': String,
			'login': String,
			'jerarquialectura': [Number], /*calculados, cacheados*/
			'jerarquiaescritura': [Number], /*calculados, cacheados*/
			'procedimientoslectura': [String], /*calculados, cacheados*/
			'procedimientosescritura': [String], /*calculados, cacheados*/
			'entidadobjetolectura': [String],  /*calculados, cacheados*/
			'entidadobjetoescritura': [String], /*calculados, cacheados*/
			'jerarquiadirectalectura': [Number], /*reales, asignados*/
			'jerarquiadirectaescritura': [Number], /*reales, asignados*/
			'procedimientosdirectalectura': [String], /*reales, asignados*/
			'procedimientosdirectaescritura': [String], /*reales, asignados*/
			'entidadobjetodirectalectura': [String],  /*reales, asignados*/
			'entidadobjetodirectaescritura': [String], /*reales, asignados*/
			'caducidad': Date,
			'descripcion': String,
			'grantoption': Boolean, /* puede clonar su permiso */
			'superuser': Number,
			'cod_plaza_grantt': String
		},
		'registroactividad': {
			'usr': String,
			'fecha': Date,
			'url': String
		},
		'expediente': {
			'idexpediente': String,
			'procedimiento': String,
			'fechainicio': Date,
			'fechafin': Date,
			'periodossuspension': [{'fechasuspension': Date, 'fechareinicio': Date}],
			'responsable': Number,
			'metadatos': String,
			'anualidad': Number,
			'duracion': Number,
			'diashabiles': Number,
			'diasnaturales': Number
		},
		'jerarquia': {
			'nombre': String,
			'nombrelargo': String,
			'tipo': String,
			'inicialestipo': String,
			'id': Number,
			'ancestrodirecto': Number,
			//recalculables
			'ancestros': [Number],
			'descendientes': [Number],
			'numprocedimientos': Number,
			'numcartas': Number
		},
		'importacionesprocedimiento': {
			'login_importador': String,
			'fichero': String,
			'time': Date,
			'estado': String,
			'mostrable': Boolean
			//'input': AnyType
			//'output': AnyType
			//'avisos': AnyType
			//'errores': AnyType
		},
		'etiqueta': {
			'_id': String,
			'descripcion': String,
			'familia': String,
			'color': String
		},
		'plantillaanualidad': {
			'actualizado': [Number],
			'plazo_maximo_resolver': Number,
			'plazo_maximo_responder': Number,
			'plazo_CS_ANS_naturales': Number,
			'plazo_CS_ANS_habiles': Number,
			'pendientes_iniciales': Number,
			'total_resueltos': [Number],
			'solicitados': [Number],
			'iniciados': [Number],
			'resueltos_1': [Number],
			'resueltos_5': [Number],
			'resueltos_10': [Number],
			'resueltos_15': [Number],
			'resueltos_30': [Number],
			'resueltos_45': [Number],
			'resueltos_mas_45': [Number],
			'resueltos_desistimiento_renuncia_caducidad': [Number],
			'resueltos_prescripcion': [Number],
			't_medio_naturales': [Number],
			't_medio_habiles': [Number],
			'en_plazo': [Number],
			'quejas': [Number],
			'recursos': [Number],
			'fuera_plazo': [Number],
			'pendientes': [Number],
			'periodoscerrados': [Number],
			'totalsolicitudes': Number,
			'Incidencias': {
				'Se han resuelto expedientes fuera de Plazo': [Number],
				'Aumenta el N de expedientes pendientes': [Number],
				'Hay quejas presentadas': [Number],
				'Hay expedientes prescritos/caducados': [Number],
				'Las solicitudes aumentan al menos 20%': [Number],
				'Posible incumplimiento de compromisos': [Number]
			}
		},
		'procedimiento': {
			'codigo': String,
			'denominacion': String,
			'idjerarquia': Number,
			'tipo': String,
			'cod_plaza': String,
			'fecha_creacion': Date,
			'fecha_fin': Date,
			'fecha_version': Date,
			'oculto': Boolean,
			'eliminado': Boolean,
			'etiquetas': [String],
			'padre': String,
			'ancestro_1': String,
			'ancestro_2': String,
			'ancestro_3': String,
			'ancestro_4': String,
			'ancestro_5': String,
			'ancestro_v_1': String,
			'ancestro_v_2': String,
			'ancestro_v_3': String,
			'ancestro_v_4': String,
			'ancestro_v_5': String
			//recalculable: (se incluye como AnyType abajo)
			//'ancestros' : [ jerarquia],
			//responsables : [persona]
			//'periodos':{}
			/*
			'periodos':{
				'a2013':
				{
					'plazo_maximo_resolver':Number,
					'plazo_maximo_responder':Number,
					'plazo_CS_ANS_naturales':Number,
					'plazo_CS_ANS_habiles':Number,
					'pendientes_iniciales':Number,
					'periodoscerrados':[Number],
					'total_resueltos':[Number],
				},
				'a2014': plantillaanualidad
			}*/
		}, /* dic-2015 */
		'entidadobjeto': {
			'codigo': Number,
			'denominacion': String,
			'url': String,
			'responsable': String,
			'idjerarquia': Number,
			'tipoentidad': String,
			'fechaalta': Date,
			'fechafin': Date,
			'fechaversion': {type: Date, default: Date.now},
			'eliminado': Boolean,
			'expediente': String
		},
		'objetivo': {
			//'carta': Schema.Types.ObjectId,
			'codigo': Number,
			'denominacion': String,
			'index': Number,
			'objetivoestrategico': Number,
			'perspectiva': String,
			'estado': String, /* publicado en la web o no */
			'formulas': [{
				'human': String,
				'computer': String,
				'frecuencia': String,
				'meta': Number,
				'direccion': String,
				'pendiente': Boolean,
				'valores': 'Mixed',
				'indicadores': 'Mixed',
				'procedimientos': 'Mixed',
				'intervalos': [{
					'min': Number,
					'max': Number,
					'mensaje': String,
					'color': String,
					'alerta': String
				}]
			}]
		},
		'indicador': {
			'id': Number,
			'nombre': String,
			'idjerarquia': Number,
			'resturl': String,
			'fechaversion': {'type': Date, 'default': Date.now},
			'vinculacion': String,
			'frecuencia': String,
			'pendiente': Boolean,
			'acumulador': String,
			'tipo': String,
			'unidad': String,
			'valores': 'Mixed',
			'observaciones': 'Mixed',
			'observacionessupervisor': 'Mixed',
			'medidas': 'Mixed',
			'valoresacumulados': 'Mixed',
			'actividad': 'Mixed'
		},
		'operador': {
			'texto': String,
			'valor': String
		}
	};

	module.exports.getSchema = function(name){
		return schemasfields[name];
	};

	function schemaConstructor(name, mongooselib, strict){
		if (typeof schemas[name] !== 'undefined'){

			return schemas[name];
		}
		if (typeof mongooselib === 'undefined'){

			throw new Error('Debe inicializar el schema previamente a su uso.');
		}
		const Schema = mongooselib.Schema,
			fields = schemasfields[name] ? schemasfields[name] : {},
			cfg = {collection: name};
		if (Object.keys(fields).length === 0 || !strict){
			cfg.strict = false;
		}
		const objSchema = new Schema(fields, cfg);
		schemas[name] = mongooselib.model(name, objSchema);

		if (typeof schemasfields[name] === 'undefined'){
			log.error(__filename, schemasfields[name]);
		}

		return schemas[name];
	}
	module.exports.ObjectId = module.exports.objectId = function(o){

		return mongoose.Types.ObjectId(o);
	};
	module.exports.init = function(mongoos) {
		mongoose = mongoos;
		const Schema = mongoose.Schema;
		schemasfields.crawled.any = Schema.Types.Mixed;
		schemasfields.registroactividad.req = Schema.Types.Mixed;
		schemasfields.procedimiento.ancestros = Schema.Types.Mixed;
		schemasfields.procedimiento.periodos = Schema.Types.Mixed;
		schemasfields.procedimiento.responsables = Schema.Types.Mixed;
		schemasfields.importacionesprocedimiento.input = Schema.Types.Mixed;
		schemasfields.importacionesprocedimiento.output = Schema.Types.Mixed;
		schemasfields.importacionesprocedimiento.avisos = Schema.Types.Mixed;
		schemasfields.importacionesprocedimiento.errores = Schema.Types.Mixed;
		schemasfields.objetivo.carta = Schema.Types.ObjectId;
		schemasfields.objetivo.formulas[0].indicadores = Schema.Types.Mixed;
		schemasfields.objetivo.formulas[0].valores = Schema.Types.Mixed;
		schemasfields.indicador.valores = Schema.Types.Mixed;
		schemasfields.indicador.observaciones = Schema.Types.Mixed;
		schemasfields.indicador.medidas = Schema.Types.Mixed;
		schemasfields.indicador.valoresacumulados = Schema.Types.Mixed;
		schemasfields.indicador.actividad = Schema.Types.Mixed;

		for (const name in schemasfields){
			if (schemasfields.hasOwnProperty(name)) {
				exports[name](mongoose);
			}
		}
	};

	function constructorschema(name){
		return function(mgse) {
			if (mapconstructors[name]){
				return mapconstructors[name];
			}
			mapconstructors[name] = schemaConstructor(name, mgse, true);

			return mapconstructors[name];
		};
	}

	for (var name in schemasfields){
		if (schemasfields.hasOwnProperty(name)) {
			module.exports[name] = constructorschema(name);
		}
	}

})(module, console);
