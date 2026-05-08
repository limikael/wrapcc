function camelize(str) {
    return str
        .toLowerCase()
        .split(/[-]/)
        .filter(Boolean)
        .map((part, i) =>
            i === 0 ? part : part[0].toUpperCase() + part.slice(1)
        )
        .join('');
}

export function camelizeObject(o) {
    let res={};
    for (let k in o)
        res[camelize(k)]=o[k];

    return res;
}

export async function runInParallel(jobs, parallelism=4) {
    let index=0;
    let results=new Array(jobs.length);

    async function worker() {
        while (true) {
            let current=index++;

            if (current>=jobs.length)
                return;

            results[current]=await jobs[current]();
        }
    }

    let workers=[];

    for (let i=0;i<parallelism;i++)
        workers.push(worker());

    await Promise.all(workers);

    return results;
}