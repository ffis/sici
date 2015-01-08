"use strict";

var schemas = {};

var schemasfields = {
	crawled : { 'id': Number, 'jerarquia': [String], 'completo': String },
	guiacarm: {	'id': Number,'titulo': String },
	settings: { version:Number, 'secret': String, 'secret2': String, 'anyo': String, 'port': Number,  'urlbasedecrypt': String, logincarm: Boolean },
	reglasinconsistencias : { 'titulo': String, 'restriccion': String},
	historico: {},
	//periodo: { a2013:[Number], a2014:[Number], a2015:[Number] },
	periodo: {},
	persona : {
		'codplaza' : String,
		'login' : String,
		'nombre' : String,
		'apellidos' : String,
		'genero' : String,
		'telefono' : String,
		'habilitado' : Boolean,
		'ultimologin': Date,
        'ultimoupdate': Date
	},
	permiso : {
		'codplaza' : String,

		'login' : String,
		'jerarquialectura' : [Number], /*calculados, cacheados*/
		'jerarquiaescritura' : [Number],/*calculados, cacheados*/
		'procedimientoslectura' : [String],  /*calculados, cacheados*/
		'procedimientosescritura' : [String],  /*calculados, cacheados*/

		'jerarquiadirectalectura' : [Number], /*reales, asignados*/
		'jerarquiadirectaescritura' : [Number], /*reales, asignados*/
		'procedimientosdirectalectura' : [String], /*reales, asignados*/
		'procedimientosdirectaescritura' : [String], /*reales, asignados*/		

		'caducidad' : Date,
		'descripcion' : String,
		'grantoption': Boolean, /* puede clonar su permiso */
		'superuser' : Number,

		'cod_plaza_grantt': String,
	},
	registroactividad : {
		'usr' : String,
		'fecha' : Date,
		'url' : String
	},
	expediente: {
		'idexpediente' : String,
		'procedimiento': String,
		'fechainicio' : Date,
		'fechafin' : Date,
		'periodossuspension': [{'fechasuspension' : Date, 'fechareinicio' : Date}],
		'responsable' : Number,
		'metadatos': String,
		'anualidad': Number,
		'duracion' : Number,
		'diashabiles' : Number,
		'diasnaturales': Number
	},
	jerarquia: {
		'nombre':String,
		'nombrelargo' : String,
		'tipo':String,
		'inicialestipo':String,
		'id':Number,
		'ancestrodirecto':Number,
		//recalculables
		'ancestros':[Number],
		'descendientes':[Number],
		'numprocedimientos': Number,
	},
	importacionesprocedimiento :{
		'login_importador': String,
		'fichero' : String,
		'time' : Date,
		'estado' : String,
		'mostrable' : Boolean,
		//'input': AnyType
		//'output': AnyType
		//'avisos': AnyType
		//'errores': AnyType
	},
	etiqueta:{
		'_id' : String,
		'descripcion':String,
		'familia' : String,
		'color':String,
	},
	plantillaanualidad: {
		'plazo_maximo_resolver':Number,
		'plazo_maximo_responder':Number,
		'plazo_CS_ANS_naturales':Number,
		'plazo_CS_ANS_habiles':Number,
		'pendientes_iniciales':Number,
		'total_resueltos':[Number],
		'solicitados':[Number],
		'iniciados': [Number],
		'resueltos_1':[Number],
		'resueltos_5':[Number],				
		'resueltos_10':[Number],
		'resueltos_15':[Number],
		'resueltos_30':[Number],
		'resueltos_45':[Number],
		'resueltos_mas_45':[Number],
		'resueltos_desistimiento_renuncia_caducidad':[Number],
		'resueltos_prescripcion':[Number],
		't_medio_naturales':[Number],
		't_medio_habiles':[Number],
		'en_plazo':[Number],
		'quejas':[Number],
		'recursos':[Number],
		'fuera_plazo':[Number],
		'pendientes':[Number],
		'periodoscerrados':[Number],
		'totalsolicitudes':Number,
		'Incidencias': {
			'Se han resuelto expedientes fuera de Plazo': [Number],
			'Aumenta el N de expedientes pendientes': [Number],
			'Hay quejas presentadas': [Number],
			'Hay expedientes prescritos/caducados': [Number],
			'Las solicitudes aumentan al menos 20%': [Number],
			'Posible incumplimiento de compromisos': [Number],
		}
	},
	procedimiento : {
		'codigo': String,
		'denominacion':String,
		'idjerarquia': Number,
		'tipo':String,
		'cod_plaza':String,
		'fecha_creacion':Date,
		'fecha_fin':Date,
		'fecha_version':Date,
                'oculto' : Boolean,
                'eliminado' : Boolean,
		'etiquetas':[String],
		'padre':String,
                'ancestro_1': String,
                'ancestro_2': String,
                'ancestro_3': String,
                'ancestro_4': String,
                'ancestro_v_1': String,
                'ancestro_v_2': String,
                'ancestro_v_3': String,
                'ancestro_v_4': String,
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
			'a2014':
			{
				'plazo_maximo_resolver':Number,
				'plazo_maximo_responder':Number,
				'plazo_CS_ANS_naturales':Number,
				'plazo_CS_ANS_habiles':Number,
				'pendientes_iniciales':Number,
				'total_resueltos':[Number],
				'solicitados':[Number],
				'iniciados': [Number],
				'resueltos_1':[Number],
				'resueltos_5':[Number],				
				'resueltos_10':[Number],
				'resueltos_15':[Number],
				'resueltos_30':[Number],
				'resueltos_45':[Number],
				'resueltos_mas_45':[Number],
				'resueltos_desistimiento_renuncia_caducidad':[Number],
				'resueltos_prescripcion':[Number],
				't_medio_naturales':[Number],
				't_medio_habiles':[Number],
				'en_plazo':[Number],
				'quejas':[Number],
				'recursos':[Number],
				'fuera_plazo':[Number],
				'pendientes':[Number],
				'periodoscerrados':[Number],
				'totalsolicitudes':Number,
				'Incidencias': {
					'Se han resuelto expedientes fuera de Plazo': [Number],
					'Aumenta el N de expedientes pendientes': [Number],
					'Hay quejas presentadas': [Number],
					'Hay expedientes prescritos/caducados': [Number],
					'Las solicitudes aumentan al menos 20%': [Number],
					'Posible incumplimiento de compromisos': [Number],
				},
			},
			'a2015':
			{
				'plazo_maximo_resolver':Number,
				'plazo_maximo_responder':Number,
				'plazo_CS_ANS_naturales':Number,
				'plazo_CS_ANS_habiles':Number,
				'pendientes_iniciales':Number,
				'total_resueltos':[Number],
				'solicitados':[Number],
				'iniciados': [Number],
				'resueltos_1':[Number],
				'resueltos_5':[Number],				
				'resueltos_10':[Number],
				'resueltos_15':[Number],
				'resueltos_30':[Number],
				'resueltos_45':[Number],
				'resueltos_mas_45':[Number],
				'resueltos_desistimiento_renuncia_caducidad':[Number],
				'resueltos_prescripcion':[Number],
				't_medio_naturales':[Number],
				't_medio_habiles':[Number],
				'en_plazo':[Number],
				'quejas':[Number],
				'recursos':[Number],
				'fuera_plazo':[Number],
				'pendientes':[Number],
				'periodoscerrados':[Number],
				'totalsolicitudes':Number,
				'Incidencias': {
					'Se han resuelto expedientes fuera de Plazo': [Number],
					'Aumenta el N de expedientes pendientes': [Number],
					'Hay quejas presentadas': [Number],
					'Hay expedientes prescritos/caducados': [Number],
					'Las solicitudes aumentan al menos 20%': [Number],
					'Posible incumplimiento de compromisos': [Number],
				}			
			}			
		}*/
	
	}
	
}

exports.getSchema = function(name){
	return schemasfields[name];
}

function schemaConstructor(name, mongoose, strict){
	if (typeof schemas[name] !== 'undefined') return schemas[name];
	if (typeof mongoose === 'undefined'){  throw new Error('Debe inicializar el schema previamente a su uso.'); }
	var Schema = mongoose.Schema;
	var fields = schemasfields[name] ? schemasfields[name] : {} ;
	var cfg = { collection: name };
	if (Object.keys(fields).length==0 || !strict)
		cfg.strict = false;
	var objSchema = new Schema (fields, cfg);
	schemas[name]= mongoose.model(name,objSchema);
	
 	if (typeof schemasfields[name] === 'undefined')
		console.error(__filename+':'+ schemasfields[name]);
	
	return schemas[name];
}

exports.init = function(mongoose) {
	var Schema = mongoose.Schema;
	schemasfields.crawled.any = Schema.Types.Mixed;	
	schemasfields.registroactividad.req = Schema.Types.Mixed;
	schemasfields.procedimiento.ancestros = Schema.Types.Mixed;
	schemasfields.procedimiento.periodos = Schema.Types.Mixed;
	schemasfields.procedimiento.responsables = Schema.Types.Mixed;	
	schemasfields.importacionesprocedimiento.input = Schema.Types.Mixed;
	schemasfields.importacionesprocedimiento.output = Schema.Types.Mixed;
	schemasfields.importacionesprocedimiento.avisos = Schema.Types.Mixed;
	schemasfields.importacionesprocedimiento.errores = Schema.Types.Mixed;

	for(var name in schemasfields){
		exports[name](mongoose);
	}
}

function constructorschema(name){
	return function(mongoose) { return schemaConstructor(name,mongoose, true); };
}

for(var name in schemasfields){
	exports[name] = constructorschema(name);
}
