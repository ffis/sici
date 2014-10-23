exports.authenticate = function(config){

	var jwt = config.jwt;
	var secret = config.secret;
	var Persona = config.models.persona();
	var Permisos = config.models.permiso();

	if (!jwt || !secret || !Persona || ! Permisos)
		throw new Error('bad config for authenticate method');

	return function(req, res){

		//should delegate 
		//if is invalid, return 401
		//for testing this should be enough
		if (req.body.password !== 'password') {
		  res.send(401, 'Wrong user or password');		  
		  return;
		}

		Persona.find( { login: req.body.username, habilitado:true },
			function(err,personas){			
				if (err ||personas.length===0)
				{
					res.send(401, 'Wrong user or password');					
					return;
				}
				personas[0].ultimologin = new Date();
				personas[0].save();
				
				//Permisos are bound using login or codplaza
				Permisos.find(
 					{ $or:[ {login: personas[0].login},{codplaza: personas[0].codplaza} ] },
 					function(err, permisos){
 						var o = JSON.parse(JSON.stringify(personas[0]));

						o.permisos = [];
						o.permisoscalculados = {
							jerarquialectura :[], jerarquiaescritura :[], procedimientoslectura :[], procedimientosescritura :[],
						};
						var now = new Date();
						for(var i=0,j = permisos.length; i<j;i++ ){
							if (!permisos[i].caducidad || permisos[i].caducidad.getTime() < now.getTime())
							{
								o.permisoscalculados.jerarquialectura   = o.permisoscalculados.jerarquialectura.concat( permisos[i].jerarquialectura);
								o.permisoscalculados.jerarquiaescritura = o.permisoscalculados.jerarquiaescritura.concat( permisos[i].jerarquiaescritura);
								o.permisoscalculados.procedimientoslectura   = o.permisoscalculados.procedimientoslectura.concat( permisos[i].procedimientoslectura);
								o.permisoscalculados.procedimientosescritura = o.permisoscalculados.procedimientosescritura.concat( permisos[i].procedimientosescritura);
								o.permisos.push( permisos[i] );
							}
						}
						var token = jwt.sign(o, secret, { expiresInMinutes: 60*5 });
						res.json({ profile: o, token: token, permisos : permisos });
					}
				)
			}
		);
  }
}
