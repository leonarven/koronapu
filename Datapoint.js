class Datapoint {
	constructor( json ){
		this.role        = json.role;
		this.id          = json.id;

		this.name        = json.name;
		this.summary     = json.summary;
		this.description = json.description;
		this.radius      = json.radius;

		this.updated_at  = json.updated_at;
		this.created_at  = json.created_at;

		// passhash ei kuulu tänne, sitä käsitellään vain autentikaation yhteydessä

		var location = idToLocation( this.id );
		Object.defineProperty( this, 'location', {
			get: ()=>location
		});
	}

	toJSON( json ) {
		json = json || {};
		for (var k of ['role','id','name','summary','description','radius','location','updated_at','created_at']) {
			json[k] = this[k];
		}

		return json;
	}
}

function idToLocation( id ) {
	var location = id.split( ";" );
	return { lat: parseFloat( location[0] ), lon: parseFloat( location[1] ) };
}

module.exports = Datapoint;
