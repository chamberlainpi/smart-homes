globalThis.trace = console.log.bind(this);
globalThis.prettyJSON = d => JSON.stringify(d, null, '  ');