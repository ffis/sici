/*
# Actualización anual sici:

Supuesto que se aplique a la anualidad 2018, el script mongodb a ejecutar desde su shell sería:

```js
*/
anualidad = "a2018"; //cambiar este valor según la anualidad

periodoupdate = {};
periodoupdate[anualidad] = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];

db.periodo.update({}, {$set: periodoupdate});


var plantilla = db.plantillaanualidad.findOne();
delete plantilla._id;

/* aplicar plantilla anualidad a los procedimientos */

fieldname = "periodos." + anualidad;
restriction = {};
restriction[fieldname] = {$exists: false};
procedimientoupdate = {};
procedimientoupdate[fieldname] = plantilla;

db.procedimiento.update(restriction, {$set:procedimientoupdate}, {multi:true});

/*
Las siguientes actualizaciones no son del todo necesarias, pero hacerlas de una vez
ayuda a evitar algunas comprobaciones en cada interacción. Son recomenables.
*/

/* aplicar plantillas sobre los indicadores */

plantillavalores = [null, null, null, null, null, null, null, null, null, null, null, null, 0];

fieldname = "valores." + anualidad;
restrictionindicador = {};
restrictionindicador[fieldname] = {$exists: false};
indicadorupdate = {};
indicadorupdate[fieldname] = plantillavalores;

db.indicador.update(restrictionindicador, { $set: indicadorupdate}, {multi:true});

plantillaobservaciones = ["", "", "", "", "", "", "", "", "", "", "", "", ""];

fieldname = "observaciones." + anualidad;
restrictionindicador2 = {};
restrictionindicador2[fieldname] = {$exists: false};
indicadorupdate2 = {};
indicadorupdate2[fieldname] = plantillaobservaciones;

db.indicador.update(restrictionindicador2, {$set: indicadorupdate2}, {multi:true});

plantillavalores = [null, null, null, null, null, null, null, null, null, null, null, null, 0];

fieldname = "valoresacumulados." + anualidad;
restrictionindicador3 = {};
restrictionindicador3[fieldname] = {$exists: false};
indicadorupdate3 = {};
indicadorupdate3[fieldname] = plantillavalores;

db.indicador.update(restrictionindicador3, {$set: indicadorupdate3}, {multi:true});

plantillaactividad = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];

fieldname = "actividad." + anualidad;
restrictionindicador4 = {};
restrictionindicador4[fieldname] = {$exists: false};
indicadorupdate4 = {};
indicadorupdate4[fieldname] = plantillaactividad;

db.indicador.update(restrictionindicador4, {$set: indicadorupdate4}, {multi:true});


/* aplicar plantilla sobre objetivos */

tplValores = {"resultado" : null, "formula" : []};
valoresobjetivo = [];
for (var i = 0; i < 13; i++){
	valoresobjetivo.push(tplValores);
}

db.objetivo.find({}).forEach(function (doc){
	for(var i = 0, j = doc.formulas.length; i < j;i++){
		var obj = { '$set': {} };
		var fieldname = 'formulas.' + i + '.valores.' + anualidad;
		var restriction = {_id: doc._id};
		restriction[fieldname] = {$exists: false};

		obj.$set[fieldname] = valoresobjetivo;
		db.objetivo.update(restriction, obj);
	}
});

```
