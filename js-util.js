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