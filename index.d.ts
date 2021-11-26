declare module 'fs-extra';
declare module 'pg';

interface LineChartType {
    xAxis:AxisType,
    yAxis:AxisType,
    xBounds:Array<any>,
    yBounds:Array<any>,
    entries:Array<any>,
    canvas:HTMLCanvasElement,
    $el:HTMLElement,
    pixi:any,
}

interface AxisType {
    label:string,
    evaluate?:Function,
    boundsPixels:Array<number>,
    compareFunc:Function,
    tick:Function,
    size:number,
    plot:Function,
}

interface XYType {
    x:number,
    y:number
}

interface PIXIDisplay {
    x:number,
    y:number,
    scale:XYType,
    anchor:XYType,
    pivot:XYType,
    alpha:number,
    rotation:number,
    destroy(opts?:any):any,
}

interface PIXIGraphics extends PIXIDisplay {
    beginFill():any;
    lineStyle():any;
    drawCircle():any;
    moveTo():any;
    lineTo():any;
}

interface PIXIContainer extends PIXIDisplay {
    addChild(child:PIXIDisplay):void
    removeChild(child:PIXIDisplay):void
}