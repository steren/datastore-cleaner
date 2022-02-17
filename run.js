import { cleanUp } from './cleanup.js';

const args = process.argv.slice(2);

const entity = args[0];
const attribute = args[1];
const days = parseInt(args[2]);
const limit = parseInt(args[3]);

if(!entity) {
  console.error('First positional argument is missing. It must capture the "entity" name to delete');
  process.exit(1)
}

if(!attribute) {
  console.error('Second positional argument is missing. It must capture the "attribute" of the Entity which contais the date');
  process.exit(1)
}

await cleanUp(entity, attribute, days, limit);

process.exit(0)