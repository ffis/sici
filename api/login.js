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
		  res.status(401).send('Wrong password');
		  return;
		}

		Persona.find( { login: req.body.username, habilitado:true },
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

						//o.permisos = [];
						o.permisoscalculados = {
							jerarquialectura :[], jerarquiaescritura :[],
							procedimientoslectura :[], procedimientosescritura :[],
							superuser : false
						};
						var now = new Date();
						for(var i=0,j = permisos.length; i<j;i++ ){
							if (!permisos[i].caducidad || permisos[i].caducidad.getTime() < now.getTime())
							{
								o.permisoscalculados.superuser = o.permisoscalculados.superuser || permisos[i].superuser;
								o.permisoscalculados.jerarquiaescritura = o.permisoscalculados.jerarquiaescritura.concat( permisos[i].jerarquiaescritura);
								o.permisoscalculados.procedimientosescritura = o.permisoscalculados.procedimientosescritura.concat( permisos[i].procedimientosescritura);								
								//o.permisos.push( permisos[i] );
							}
						}
						for(var i=0,j = permisos.length; i<j;i++ ){
							for(var k=0,l=permisos[i].jerarquialectura.length;k<l;k++)
								if ( (!permisos[i].caducidad || permisos[i].caducidad.getTime() < now.getTime()) && 
									(o.permisoscalculados.jerarquiaescritura.indexOf(permisos[i].jerarquialectura[k])==-1 ) )
								{
									o.permisoscalculados.jerarquialectura.push( permisos[i].jerarquialectura[k]);								
								}
						}
						for(var i=0,j = permisos.length; i<j;i++ ){
							for(var k=0,l=permisos[i].procedimientoslectura.length;k<l;k++)
								if ( (!permisos[i].caducidad || permisos[i].caducidad.getTime() < now.getTime()) && 
									(o.permisoscalculados.procedimientosescritura.indexOf(permisos[i].procedimientoslectura[k])==-1 ) )
								{
									o.permisoscalculados.procedimientoslectura.push( permisos[i].procedimientoslectura[k]);
								}
						}
						
						//console.log(o.permisoscalculados);
						
						var token = jwt.sign(o, secret, { expiresInMinutes: 60*5 });
						res.json({ profile: o, token: token });
					}
				)
			}
		);
  }
}
