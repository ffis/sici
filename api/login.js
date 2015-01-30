
function calcularPermisos(permisos) {
	var permisoscalculados = {
			jerarquialectura :[], jerarquiaescritura :[],
			procedimientoslectura :[], procedimientosescritura :[],
			superuser : false,
			grantoption: false,
	};
	for(var i=0;i<permisos.length;i++)
	{
		var permiso = permisos[i];
		

		var now = new Date();
		for(var i=0,j = permisos.length; i<j;i++ ){
			if (!permisos[i].caducidad || permisos[i].caducidad.getTime() < now.getTime())
			{
				permisoscalculados.superuser = permisoscalculados.superuser || permisos[i].superuser;
				permisoscalculados.jerarquiaescritura = permisoscalculados.jerarquiaescritura.concat( permisos[i].jerarquiaescritura);
				permisoscalculados.procedimientosescritura = permisoscalculados.procedimientosescritura.concat( permisos[i].procedimientosescritura);								
				permisoscalculados.grantoption = permisoscalculados.grantoption ||  permisos[i].grantoption;
				//o.permisos.push( permisos[i] );
			}
		}
		for(var i=0,j = permisos.length; i<j;i++ ){
			for(var k=0,l=permisos[i].jerarquialectura.length;k<l;k++)
				if ( (!permisos[i].caducidad || permisos[i].caducidad.getTime() < now.getTime()) && 
					(permisoscalculados.jerarquiaescritura.indexOf(permisos[i].jerarquialectura[k])==-1 ) )
				{
					permisoscalculados.jerarquialectura.push( permisos[i].jerarquialectura[k]);								
				}
		}
		for(var i=0,j = permisos.length; i<j;i++ ){
			for(var k=0,l=permisos[i].procedimientoslectura.length;k<l;k++)
				if ( (!permisos[i].caducidad || permisos[i].caducidad.getTime() < now.getTime()) && 
					(permisoscalculados.procedimientosescritura.indexOf(permisos[i].procedimientoslectura[k])==-1 ) )
				{
					permisoscalculados.procedimientoslectura.push( permisos[i].procedimientoslectura[k]);
				}
		}				
	}	
	
	return permisoscalculados;
}

exports.getpermisoscalculados = function(models) {
	return function(req,res){
		var Permisos = models.permiso();
		Permisos.find({"_id":{"$in":req.user.idspermisos}},function(err, permisos){
			if (err) { res.status(500); res.send(err) ;}
			else {
				var permisoscalculados = calcularPermisos(permisos);						
				res.json(permisoscalculados);
			}
		});		
	}
}

exports.setpermisoscalculados = function(config){
	return function(req, res, next) {
		var Permisos = config.models.permiso();
		Permisos.find({"_id":{"$in":req.user.idspermisos}},function(err, permisos){
			if (err){ console.error(err); next(err);		}
			var permisoscalculados = calcularPermisos(permisos);	
			req.user.permisoscalculados = permisoscalculados;
			next();
		});
	}
}


exports.authenticate = function(config){

	var jwt = config.jwt;
	var secret = config.secret;
	var Persona = config.models.persona();
	var Permisos = config.models.permiso();
	var crypto = config.crypto;

	if (!jwt || !secret || !Persona || ! Permisos)
		throw new Error('bad config for authenticate method');

	return function(req, res){

		//should delegate 
		//if is invalid, return 401
		//for testing this should be enough

		/*if (req.body.password !== 'password') {
		  res.status(401).send('Wrong password');
		  return;
		}*/
		
		var restriccion = {login: req.body.username, habilitado : true};
		var shasum = crypto.createHash('sha256');
		shasum.update(req.body.password);
		var shasum_digest = shasum.digest('hex');
		console.log('digerido');
		console.log(shasum_digest);
		
		
		if (!!req.body.notcarmuser)
			restriccion.contrasenya = shasum_digest;
		
		console.log(restriccion);
		
		Persona.find( restriccion,
			function(err,personas){			
				if (err ||personas.length===0)
				{
					res.status(401).send('Wrong user or password');					
					return;
				}
				personas[0].ultimologin = new Date();
				personas[0].save();
				
				//Permisos are bound using login or codplaza
				Permisos.find(
 					{ $or:[ {login: personas[0].login},{codplaza: personas[0].codplaza} ] },
 					function(err, permisos){
 						var o = JSON.parse(JSON.stringify(personas[0]));
						
						o.idspermisos = [];
						for(var i=0,j = permisos.length; i<j;i++ ){
							o.idspermisos.push(permisos[i]._id);
						}
						
						var token = jwt.sign(o, secret, { expiresInMinutes: 60*5 });
						res.json({ profile: o, token: token });
					}
				)
			}
		);
  }
}

exports.pretend = function(config){

	var jwt = config.jwt,
		secret = config.secret,
		Persona = config.models.persona(),
		Permisos = config.models.permiso();

	if (!jwt || !secret || !Persona || ! Permisos)
		throw new Error('bad config for pretend method');

	return function(req, res){

		if (!req.user.permisoscalculados.superuser) {
			console.error(req.user);
		  res.status(401).send('Not allowed'); //provoca perdida de sesion
		  return;
		}
		if (typeof req.body.username === 'undefined'){
		  res.status(404).send('Fallo de petición');
		  return;
		}else{

			Persona.find( { login: req.body.username, habilitado:true },
				function(err,personas){			
					if (err ||personas.length===0)
					{
						res.status(404).send('Wrong user');	
						return;
					}
					personas[0].ultimologin = new Date();
					personas[0].save();
					
					//Permisos are bound using login or codplaza
					Permisos.find(
	 					{ $or:[ {login: personas[0].login},{codplaza: personas[0].codplaza} ] },
	 					function(err, permisos){
	 						var o = JSON.parse(JSON.stringify(personas[0]));
							
							o.idspermisos = [];
							for(var i=0,j = permisos.length; i<j;i++ ){
								o.idspermisos.push(permisos[i]._id);
							}
							
							var token = jwt.sign(o, secret, { expiresInMinutes: 60*5 });
							res.json({ profile: o, token: token });
						}
					)
				}
			);
		}
  }
}

