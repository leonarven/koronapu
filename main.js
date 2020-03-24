(()=>{
	var { log, error } = console;
	console.log   = function(){   log.bind( null, (new Date()).toLocaleString(), "::" ).apply( null, arguments ); }
	console.error = function(){ error.bind( null, (new Date()).toLocaleString(), ":: \[\033[31mERROR\033[0m\] ::" ).apply( null, arguments ); }
})();

/************************/

const express        = require( "express" );
const bodyParser     = require( "body-parser" );

const Datapoint      = require( "./Datapoint" );
const Role           = require( "./Role" );
const ContentHandler = require( "./ContentHandler" );

const config         = require( "./config.json" );

const API            = require( "./api.js" );

/************************/

console.log( "SYSTEM :: Initiating HTTP server ..." );

const app = express();

app.use( bodyParser.urlencoded({ extended: false }));
app.use( bodyParser.json( ));

app.use( "/api", API.router );
app.use( express.static( 'public', config.static ));

console.log( "SYSTEM :: Initiating API ..." );

API.init( config ).then(() => {
	console.log( "SYSTEM :: Initiating API ... READY!" );

	app.listen( config.http.port, function(){
		console.log( "SYSTEM :: Initiating HTTP server ... READY!" );
		console.log( "SYSTEM :: HTTP server started, port:", config.http.port );
	});
}).catch(err => {
	console.error( "SYSTEM :: Failed to initiate API" );
	console.error( err );
});
