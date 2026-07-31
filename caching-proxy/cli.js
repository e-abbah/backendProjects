#!/usr/bin/env node
import {createClient} from "redis"
import express from 'express';
import axios from "axios";


//the above is a shebang line that is often needed when we an operating system needs to know how it should interpret the line
//since this consists of a shebang project then it makes sense it is done like this



let port;
let origin;
let clearCache = false;

const args = process.argv.slice(2);

for (let i = 0; i < args.length; i++){
    if (args[i] === '--port'){
        port = args[i + 1];
    }
    if (args[i] === '--origin'){
        origin = args[i + 1]
    }
    if (args[i] === '--clear-cache'){
        clearCache = true;
    }
}
if (clearCache) {
  console.log('Clearing cache...');
  // real clear-cache logic comes in Phase 6
} else if (port && origin) {
  console.log(`Starting caching proxy server on port ${port}, forwarding to ${origin}`);


  const app = express();
  const client = await createClient()
  .on("error", (err) => console.log("Redis Client Error", err))
  .connect();


  app.use(async (req, res) => {
  console.log(`Incoming request: ${req.method} ${req.url}`);

  const cacheKey = `${req.method}:${req.url}`;
  const cachedResponse = await client.get(cacheKey);

  if (cachedResponse) {
    console.log('Serving from cache');
    res.set('X-Cache', 'HIT');
    return res.send(cachedResponse);
  }


  const targetUrl = origin + req.url;


  try {
    const response = await axios({
      method: req.method,
      url: targetUrl,
    });


    res.send(response.data);
  } catch (error) {
    console.log(error);
    res.status(500).send('Something went wrong forwarding the request');
  }
});

  app.listen(port, () => {
    console.log(`Listening on port: ${port}`);
  });
  
} else {
  console.log('Usage: caching-proxy --port <number> --origin <url>');
  console.log('       caching-proxy --clear-cache');
}
console.log({port, origin, clearCache});



