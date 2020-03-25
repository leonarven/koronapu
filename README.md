# koronapu
Location based platform (API) for asking ang giving help and for solidarity.

### Asennus

`npm i`

### Käyttö

`node main.js`

### Esimerkkinä config.json
```
{
	"http": {
		"port": 8080
	},
	"database": {
		"sqlite3": {
			"file"        : "./database.db",
			"schema_file" : "./schema.sqlite"
		}
	},
	"static": {
		"dotfiles"   : "ignore",
		"etag"       : false,
		"extensions" : [ "json" ],
		"index"      : false,
		"maxAge"     : "1d",
		"redirect"   : false
	}
}
```

### API

#### GET `/api/datapoints.json` - Noutaa tietueita
**Haun parametrit:** *id*, *role*
`/api/helpers.json`  = `/api/datapoints.json?role=helpers`
`/api/infected.json` = `/api/datapoints.json?role=infected`
`/api/datapoints.json/{id}` = `/api/datapoints.json?id={id}`


#### POST `/api/infected.json`, `/api/helpers.json` - Luo tietueita

#### POST `/api/datapoints.json?id={id}`, `/api/datapoints.json/{id}` - Päivittää tietueen
