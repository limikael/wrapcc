import { runCommand } from "./node-utils.js";
import path from "path";
import fs from "fs";
import {runInParallel} from "./js-util.js";

function isCppFile(arg) {
    return (arg.endsWith(".cpp") || arg.endsWith(".c"));
}

function isOutputFlag(arg) {
    return arg === "-o";
}

function toObjectFile(src, buildDir) {
    const rel = src.replace(/^\.\//, "");
    return path.join(buildDir, rel + ".o");
}

function ensureDir(filePath) {
    fs.mkdirSync(path.dirname(filePath), { recursive: true });
}

export async function wrapcc(argv, options={}) {
    let {dryRun,buildDir}=options;

    let compiler=argv[0];
    argv=argv.slice(1);

    let linker=options.linker;
    if (!linker)
        linker=compiler;

    const cppFiles = [];
    const compileArgs = [];
    const linkArgs = [];
    const staticLibs = [];

    let outputBinary = null;

    // -----------------------------
    // 1. Parse argv (lightweight)
    // -----------------------------
    for (let i = 0; i < argv.length; i++) {
        const a = argv[i];

        if (isOutputFlag(a)) {
            outputBinary = argv[i + 1];
            linkArgs.push("-o", outputBinary);
            i++;
            continue;
        }

        if (isCppFile(a)) {
            cppFiles.push(a);
            continue;
        }

        if (a.endsWith(".a")) {
            staticLibs.push(a);
            continue;
        }

        // everything else is compiler/linker flag
        compileArgs.push(a);
        linkArgs.push(a);
    }

    if (!outputBinary) {
        throw new Error("wrapcc: missing -o output binary");
    }

    // -----------------------------
    // 2. Compile step (ccache)
    // -----------------------------
    const objectFiles = [];

    let jobs=[];

    for (const file of cppFiles) {
        const obj = toObjectFile(file,buildDir);
        if (!dryRun)
            ensureDir(obj);
        objectFiles.push(obj);

        if (dryRun) {
            console.log("ccache",[
                compiler,
                ...compileArgs,
                "-c",
                file,
                "-o",
                obj
            ].join(" "));
        }

        else {
            // removed... push to promises
            jobs.push(async ()=>{
                //console.log(file);
                await runCommand("ccache", [
                    compiler,
                    ...compileArgs,
                    "-c",
                    file,
                    "-o",
                    obj
                ]);
            });
        }
    }

    await runInParallel(jobs,4);

    // -----------------------------
    // 3. Link step
    // -----------------------------
    if (dryRun) {
        console.log(linker,[
            ...linkArgs,
            ...objectFiles,
            ...staticLibs
        ].join(" "));
    }

    else {
        await runCommand(linker, [
            ...linkArgs,
            ...objectFiles,
            ...staticLibs
        ]);
    }
}