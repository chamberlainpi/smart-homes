const d3 = require('d3');

export function setupSVG(selector, {width, height, class: css}) {
    d3.select(selector)
        .attr('width', width)
        .attr('height', height)
        .attr('class', css);

    
    
}