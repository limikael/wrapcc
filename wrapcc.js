import { runCommand } from "./node-utils.js";
import path from "path";
import fs from "fs";

function isCppFile(arg) {
    return arg.endsWith(".cpp");
}

function isOutputFlag(arg) {
    return arg === "-o";
}

function toObjectFile(src) {
    const rel = src.replace(/^\.\//, "");
    return path.join(".build", rel + ".o");
}

function ensureDir(filePath) {
    fs.mkdirSync(path.dirname(filePath), { recursive: true });
}

export async function wrapcc(argv, options={}) {
    let {dryRun}=options;

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
        throw new Error("ccwrap: missing -o output binary");
    }

    // -----------------------------
    // 2. Compile step (ccache)
    // -----------------------------
    const objectFiles = [];

    let promises=[];

    for (const file of cppFiles) {
        const obj = toObjectFile(file);
        if (!dryRun)
            ensureDir(obj);
        objectFiles.push(obj);

        if (dryRun) {
            console.log("ccache",[
                "g++",
                ...compileArgs,
                "-c",
                file,
                "-o",
                obj
            ].join(" "));
        }

        else {
            // removed... push to promises
            await runCommand("ccache", [
                "g++",
                ...compileArgs,
                "-c",
                file,
                "-o",
                obj
            ]);
        }
    }

    await Promise.all(promises);

    // -----------------------------
    // 3. Link step
    // -----------------------------
    if (dryRun) {
        console.log("g++",[
            ...linkArgs,
            ...objectFiles,
            ...staticLibs
        ].join(" "));
    }

    else {
        await runCommand("g++", [
            ...linkArgs,
            ...objectFiles,
            ...staticLibs
        ]);
    }
}