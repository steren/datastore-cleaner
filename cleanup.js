import {Datastore} from '@google-cloud/datastore';

const defaultLimit = 100;
const defaultDays = 365;

const datastore = new Datastore();

async function cleanUp(entity, attribute, days, limit) {
  days = days || defaultDays;
  limit = limit || defaultLimit;

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

export { cleanUp }