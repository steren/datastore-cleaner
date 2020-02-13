const http = require('http');
const url = require('url');
const assert = require('assert');
const {Datastore} = require('@google-cloud/datastore');

const defaultLimit = 100;
const defaultDays = 365;

const datastore = new Datastore();

async function cleanUp(entity, attribute, days, limit) {
  let d = new Date();
  d.setDate( d.getDate() - days);

  console.info(`Cleaning up ${limit} ${entity} where ${attribute} is older than ${d}`);

  const query = datastore.createQuery(entity).filter(attribute, '<', d).limit(limit);
  const [entities] = await datastore.runQuery(query);
  console.info(`Found ${entities.length} ${entity} to clean up.`);
  
  let entitiesToCleanup = [];
  for (const e of entities) {
    console.info(`${entity} to delete: ${e[datastore.KEY].id}, created on: ${e[attribute]}`)
    // Safety first
    if(e[attribute] < d) {
      entitiesToCleanup.push(e[datastore.KEY]);
    } 
  }

  // This is a batch operation: https://cloud.google.com/datastore/docs/concepts/entities#batch_operations
  await datastore.delete(entitiesToCleanup);

  console.info(`Cleaned up ${entitiesToCleanup.length} entities`);
}


const port = process.env.PORT || 8080;
const server = http.createServer(async (req, res) => {
  if(req.method === 'POST') {
    const parsedURL = url.parse(req.url, true);

    const entity = parsedURL.query.entity;
    if(!entity) {
        const errMsg = '"entity" URL parameter is required'; 
        console.error(errMsg);
        res.writeHead(500);
        return res.end(errMsg);
    }

    const attribute = parsedURL.query.attribute;
    if(!attribute) {
        const errMsg = '"attribute" URL parameter is required'; 
        console.error(errMsg);
        res.writeHead(500);
        return res.end(errMsg);
    }

    const days = parseInt(parsedURL.query.days) || defaultDays;
    const limit = parseInt(parsedURL.query.limit) || defaultLimit;
    
    await cleanUp(entity, attribute, days, limit);
    
    return res.end('OK');
  } else {
    return res.end('Send a POST request to delete entities. "entity" and "attribute" are required URL parameters, example: ?entity=Event&attribute=createdOn');
  }

});
server.listen(port, () => console.info(`datastore-cleaner is listening on port ${port}`));
