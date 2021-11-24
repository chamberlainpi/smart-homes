export const clamp = (v, min, max) => v < min ? min : (v > max ? max : v);

export const countItems = (arr, query, field) => {
    return arr.filter( r => r[field] === query ).length;
}

export const getCountSortFunc = (arr, field) => (a, b) => {
    const countA = countItems(arr, a, field);
    const countB = countItems(arr, b, field);
    return countB - countA;
};