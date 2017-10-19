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

