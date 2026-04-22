#!/usr/bin/env node
import {wrapcc} from "./wrapcc.js";

let argv=process.argv.slice(2);
//await wrapcc(argv,{/*dryRun: true*/});

await wrapcc(argv);
