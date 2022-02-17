import * as http from 'http';
import * as url from 'url';

import { cleanUp } from './cleanup.js';

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

    const days = parseInt(parsedURL.query.days);
    const limit = parseInt(parsedURL.query.limit);
    
    await cleanUp(entity, attribute, days, limit);
    
    return res.end('OK');
  } else {
    return res.end('Send a POST request to delete entities. "entity" and "attribute" are required URL parameters, example: ?entity=Event&attribute=createdOn');
  }

});
server.listen(port, () => console.info(`datastore-cleaner is listening on port ${port}`));
