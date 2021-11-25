
interface LineChartType {
    xAxis:any,
    yAxis:any,
    xBounds:Array<any>,
    yBounds:Array<any>,
    entries:Array<any>,
    canvas:HTMLCanvasElement,
    $el:HTMLElement,
    pixi:any,
}

interface AxisType {
    evaluate?:Function,
    boundsPixels:Array<number>
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