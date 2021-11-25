import forOwn from 'lodash/forOwn';
import debounce from 'lodash/debounce';
import sortBy from 'lodash/sortBy';
import uniq from 'lodash/uniq';
import uniqBy from 'lodash/uniqBy';
import times from 'lodash/times';

export const _ = { forOwn, debounce, sortBy, uniq, uniqBy, times };

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