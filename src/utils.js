import forOwn from 'lodash/forOwn';
import debounce from 'lodash/debounce';
import sortBy from 'lodash/sortBy';
import uniq from 'lodash/uniq';
import uniqBy from 'lodash/uniqBy';

export const _ = { forOwn, debounce, sortBy, uniq, uniqBy };

export const clamp = (v, min, max) => v < min ? min : (v > max ? max : v);

export const countItems = (arr, query, field) => {
    return arr.filter( r => r[field] === query ).length;
}

export const getCountSortFunc = (arr, field) => (a, b) => {
    const countA = countItems(arr, a, field);
    const countB = countItems(arr, b, field);
    return countB - countA;
};