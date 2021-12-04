import forOwn from 'lodash/forOwn';
import debounce from 'lodash/debounce';
import sortBy from 'lodash/sortBy';
import uniq from 'lodash/uniq';
import uniqBy from 'lodash/uniqBy';
import times from 'lodash/times';
import trim from 'lodash/trim';

export const trace = console.log.bind(this);
export const prettyJSON = d => JSON.stringify(d, null, '  ');

export const _ = { forOwn, debounce, sortBy, uniq, uniqBy, times, trim };

export const clamp = (v, min, max) => v < min ? min : (v > max ? max : v);

export const countItems = (arr, query, field) => {
    return arr.filter( r => r[field] === query ).length;
}

export const getCountSortFunc = (arrGetter, field) => (a, b) => {
    const arr = arrGetter();
    const countA = countItems(arr, a, field);
    const countB = countItems(arr, b, field);
    return countB - countA;
};

export const defer = () => new Promise( _then => {
    requestAnimationFrame( _then );
});

export const getTime = () => new Date().getTime();

export const queryParams = q => {
    if(!q) q = window.location.search;
    const params = new URLSearchParams(q);
    const results = {};
    
    params.forEach((value, key) => {
        results[key] = value;
    });

    return results;
}

export function pushByColumns(cols) {
    const results = [];
    var current = [];
    return {
        $push(item) {
            current.push(item);
            if(current.length===cols) {
                results.push(current);
                current = [];
            }

            return 
        },
        $toString(sepOuter, sepInner) {
            return results
                .map( arr => arr.join(sepInner) )
                .join( sepOuter );
        },
    }
}