#!/usr/bin/env node
import {wrapcc} from "./wrapcc.js";
import minimist from "minimist";
import {camelizeObject} from "./js-util.js";

let args=camelizeObject(minimist(process.argv.slice(2),{
	stopEarly: true,
	boolean: "dry-run",
	string: "build-dir",
	default: {
		"dry-run": false,
		"build-dir": ".build"
	},
	unknown: s=>{
		if (s.startsWith("-")) {
			console.log("Unknown option: "+s);
			process.exit(1);
		}
	}
}));

await wrapcc(args._,args);
