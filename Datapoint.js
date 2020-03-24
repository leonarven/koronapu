class Datapoint {
	constructor( json ){
		console.log(json);
		this.role        = json.role;
		this.id          = json.id;

		this.name        = json.name;
		this.summary     = json.summary     || '';
		this.description = json.description || '';
		this.radius      = json.radius      || 1000;

		// passhash ei kuulu tänne, sitä käsitellään vain autentikaation yhteydessä

		var location = idToLocation( this.id );
		Object.defineProperty( this, 'location', {
			get: ()=>location
		});
	}
}

function idToLocation( id ) {
	var location = id.split( ";" );
	location.lat = location[0];
	location.lon = location[1];
	return location;
}

module.exports = Datapoint;
