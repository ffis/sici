# SICI


Sistema Integrado de Control de Indicadores.
Comunidad Autónoma de la Región de Murcia.

### Enlaces de interés


* [BORM]
* [Carta de Servicios]

### Requisitos tecnológicos

* MongoDB server community v 3.4.3 o superior
* NodeJS v7.8.0 o superior
* Opcional: Git, para descargar el código y mantenerlo actualizado

El sistema operativo con el que está probado es ubuntu 14.04 LTS.


### Hardware requerido

Para desplegar el sistema es posible realizarlo de forma operativa pero sin tolerancia a fallos con el siguiente equipamiento:

* Un equipo para la ejecución del servidor MongoDB. Este equipo requeriría 2 GB de memoria RAM, un disco duro de unos 20 GB de disco duro para la copia en producción de la base de datos así como el sistema operativo y el servidor. Un procesador de 64 bits con un único núcleo también es un requisito mínimo. Para la partición de datos de MongoDB se recomienda encarecidamente el sistema de ficheros XFS.
* Un equipo para la ejecución de la aplicación en nodeJS. Este equipo tendría unos requisitos mínimos, 1 GB de RAM y 10 GB de disco duro para la aplicación (< de 500MB, dependencias incluidas) y el sistema operativo.

Una instalación tolerante a fallos requeriría:

* Tres máquinas para la ejecución de un cluster mongodb con replicación y tolerancia a fallos, configurados como tal (_replicaset_). Son máquinas idénticas entre sí y la misma configuración del subapartado anterior valdría.
* Dos máquinas para la ejecución de dos servidores, con similares requisitos a los ya mencionados en el subapartado anterior.
* Dos equipos que actúen de balanceadores de carga HTTP, recomiendo usar _nginx_ por su sencillez y por ser un servidor ligero. Aunque podría servir cualquiera o incluso hardware dedicado. Su función es la de detectar las caídas producidas durante las actualizaciones de código (aunque el redespliegue se mide en milisegundos y no existe pérdida de sesión del usuario, no suelen percatarse de estos cambios).
* Idealmente se daría de alta en un DNS un nombre de dominio asociado a las IPS de los balanceadores.

Para esta instalación tolerante a fallos no sería necesario modificar el código, tan sólo ajustar la cadena de conexión hacia el _replicaset_ en el fichero _config.json_.

En cualquier caso sería obligatorio realizar copias de seguridad de la base de datos. Cada copia completa comprimida en 7z, descartando los logs de actividad, ocupa unos 750MB y son efectuadas cada noche con un servicio en el cron. MongoDB proporciona su propio mecanismo de bitácora al que también podría recurrirse en caso de necesitar restaurar la base de datos a un estado previo.


### Instalación y despliegue

1.a Clonar repositorio (opción GIT)

```sh
$ git config --global url."https://".insteadOf git:// #restricción de la red CARM
$ git clone https://github.com/ffis/sici
```

1.b Alternativa al GIT:
```sh
$ wget https://github.com/ffis/sici/archive/master.zip sici.zip
$ unzip sici.zip
```

2. Instalación de dependencias
```sh 
$ cd sici
$ npm install
$ bower install
```

3. Establecer configuración en el fichero config.json, en especial cadena de conexión al servidor mongodb.
4. Ejecutar tests.
```sh
$ npm test
```

5. Ejecutar servidor.
```sh
$ forever app.js
```

### Todo:
* Desplegar este sistema mediante Vagrant.
* Mejorar el sistema de gestión de versiones de dependencias.
* Mejorar la separación entre la funcionalidad y el API Rest.
* Reescribir y añadir más tests.


 [best-practices]: <https://strongloop.com/strongblog/best-practices-for-express-in-production-part-one-security/>
 [BORM]: http://www.borm.es/borm/documento?obj=anu&id=699315
 [Carta de Servicios]: https://www.carm.es/web/pagina?IDCONTENIDO=2469&IDTIPO=100&RASTRO=c672$m

