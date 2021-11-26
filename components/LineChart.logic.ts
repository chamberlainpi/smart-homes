/* global PIXI */
import { _, clamp, pushByColumns } from '@/src/utils';
import { createPixiApp } from '@/src/utils.pixi';
import EventEmitter from 'eventemitter3';

const gap:XYType = {x: 80, y: 50};
const deg2rad:number = Math.PI / 180;
const identity = (a:any) => a;

export default null;

export function setupLineChart(_this:LineChartType) {
    let pixi:any;
    let guideUI:any;
    let xTickContainer:PIXIContainer;
    let xTicks:any;
    let mouseTooltip:PIXIContainer;

    const {xAxis, yAxis, $el} = _this;
    const getSize = () => ({w: $el.offsetWidth, h: $el.offsetHeight});
    const events = new EventEmitter();

    const ctx = {
        events,

        setupPixiCanvas() {
            pixi = createPixiApp({
                view: _this.canvas,
                backgroundColor: 0xffffff,
                onMouseMove: (mouseXY:XYType) => ctx.onMouseMove(mouseXY)
            });

            ctx.initGuides();

            xTickContainer = pixi.createContainer();
            mouseTooltip = pixi.createContainer((c:PIXIContainer) => {
                c._text = pixi.drawLabel(null, 0, 0, _this.tooltipStyle);

                c._graphics = pixi.drawGraphic();
            });

            return pixi;
        },

        destroy() {
            pixi.destroy();
            events.removeAllListeners();
        },

        clearCanvas() {
            if(!pixi) return;
            pixi.clear();
        },

        resizeChart() {
            const {w, h} = getSize();
            pixi.renderer.resize(w, h);
            ctx.updateChart(true);
        },

        async updateChart(skipInit=false) {
            !skipInit && ctx.initEntries();

            await ctx.adjustGuides();
            await ctx.adjustEntries();
            ctx.onMouseMove();

            events.emit('unbusy');
        },

        initGuides() {
            guideUI = {};
            guideUI.group = pixi.createContainer(() => {
                guideUI.g = pixi.drawGraphic();
                guideUI.xLabel = pixi.drawLabel(xAxis.label);
                guideUI.yLabel = pixi.drawLabel(yAxis.label);
                guideUI.yLabel.rotation = -90 * deg2rad;

                const fontSize = 10;
                guideUI.xLabelMin = pixi.drawLabel('', 0, 0, {fontSize, align: 'left'});
                guideUI.xLabelMax = pixi.drawLabel('', 0, 0, {fontSize, align: 'right'});
                guideUI.yLabelMin = pixi.drawLabel('', 0, 0, {fontSize, align: 'right'});
                guideUI.yLabelMax = pixi.drawLabel('', 0, 0, {fontSize, align: 'right'});
            });
        },

        initEntries() {
            events.emit('busy');
            
            /**
             * Reason that we "init" the entries and not simply "draw" them right away
             * is to prepare each one belonging to a given timestamp to render on its own PIXI.Container.
             * Then, when scaling the graph horizontally, it's just a matter of adjusting those
             * containers' X positions.
             */
            xTickContainer.removeChildren();
            xTicks = {};
    
            for(var entry of _this.entries) {
                const xData = xAxis.compareFunc(entry);
                
                if(xTicks[xData]) continue;
    
                const tick = xTicks[xData] = pixi.createContainer((tick:PIXIContainer | any) => {
                    tick._line = pixi.drawGraphic((g:PIXIGraphics) => pixi.drawLine(g, 0, 0, 0, 10, 0x0, 0.3));
                    tick._entries = pixi.drawGraphic();
                });
    
                tick.name = xData;
    
                xTickContainer.addChild(tick);
            }
        },

        async adjustGuides() {
            ctx.createPlotFunctions();
            ctx.drawMainGuides();
    
            for(var xData in xTicks) {
                const tick = xTicks[xData];
                tick.x = xAxis.plot(xData) | 0;
                tick.y = 0;
    
                tick._entries.clear();
                tick._entries.beginFill(0xff0000, 1);
            }
    
            for(var e in _this.entries) {
                var entry = _this.entries[e];
    
                const xData = xAxis.compareFunc(entry);
                const yData = yAxis.compareFunc(entry);
                const tick = xTicks[xData];

                tick._entries.drawCircle(0, yAxis.plot(yData), 2);
            }
        },

        createPlotFunctions() {
            const { w, h } = getSize();
            
            xAxis.boundsPixels = [gap.x, w];
            yAxis.boundsPixels = [h-gap.y, 0];
            
            const createPlotFunction = (axis:AxisType, bounds:Array<any>) => {
                const evaluate:any = axis.evaluate || identity;
                const evaluateInv:any = axis.evaluateInverse || identity;
                const [min, max] = bounds.map(evaluate);
                const [minPX, maxPX] = axis.boundsPixels;
                const diff = max - min;
                const diffPixels = maxPX - minPX;
                
                axis.plot = (input:any) => {
                    const value = evaluate(input);
                    const ratio = (value - min) / diff;
                    return minPX + ratio * diffPixels;
                };

                axis.plotInverse = (pixel:number) => {
                    const ratio = (pixel - minPX) / diffPixels;
                    const value = ratio * diff + min;
                    return evaluateInv(value);
                }
            }
    
            createPlotFunction(xAxis, _this.xBounds);
            createPlotFunction(yAxis, _this.yBounds);
        },
    
        async adjustEntries() {
            for(var xData in xTicks) {
                const tick = xTicks[xData];
                const x = xAxis.plot(xData);
                const y = yAxis.plot(0);
                tick.x = x | 0;
                tick.y = 0;
                tick._line.y = y;
    
                tick._entries.clear();
                tick._entries.beginFill(0xff0000);
            }

            for(var e in _this.entries) {
                var entry = _this.entries[e];
                const xData = xAxis.compareFunc(entry);
                const yData = yAxis.compareFunc(entry);
                const xTick = xTicks[xData];
                
                xTick._entries.beginFill(0xff0000, 1);
                xTick._entries.drawCircle(0, yAxis.plot(yData), 2);
            }
        },
    
        drawMainGuides() {
            const { g, xLabel, yLabel } = guideUI;
            const { w, h } = getSize();
    
            g.clear();
            pixi.drawLine(g, gap.x, 0, gap.x, h-gap.y, 0x000000);
            pixi.drawLine(g, gap.x, h-gap.y, w, h-gap.y, 0x000000);
            xLabel.x = w/2;
            xLabel.y = h-gap.y/2;
    
            yLabel.x = 2;
            yLabel.y = h/2;

            const { xLabelMin, xLabelMax, yLabelMin, yLabelMax } = guideUI;
            const xEval = xAxis.plotInverse || identity;
            const yEval = yAxis.plotInverse || identity;
            const setPivot = (label:any, ratioX:number, ratioY:number) => {
                label.pivot.x = (ratioX * label.width) | 1;
                label.pivot.y = (ratioY * label.height) | 0;
            }

            xLabelMin.x = gap.x;
            xLabelMin.y = h - gap.y;
            xLabelMin.text = xEval(xLabelMin.x);
            setPivot(xLabelMin, -0.08, 0);
            
            xLabelMax.x = w;
            xLabelMax.y = h - gap.y;
            xLabelMax.text = xEval(xLabelMax.x);
            setPivot(xLabelMax, 1.08, 0);
            
            yLabelMin.x = gap.x;
            yLabelMin.y = h - gap.y;
            yLabelMin.text = yEval(yLabelMin.y);
            setPivot(yLabelMin, 1.08, 1.08);

            yLabelMax.x = gap.x;
            yLabelMax.y = 0;
            yLabelMax.text = yEval(yLabelMax.y);
            setPivot(yLabelMax, 1.08, 0.08);
        },
    
        onMouseMove(mouseXY?:XYType) {
            const { w, h } = getSize();
            const entryAlpha = 0.2;
            const entryAlphaInv = 1 - entryAlpha;
            const proximity = 20;
    
            if(!mouseXY || mouseXY.x < gap.x || mouseXY.y > (h - gap.y)) {
                mouseTooltip.visible = false;
                for(var xData in xTicks) {
                    const tick = xTicks[xData];
    
                    tick._line.alpha = 0;
                    tick._entries.alpha = entryAlpha;
                }
            } else {
                const {x, y} = mouseXY;
                
                ctx.updateMouseToolTip(x, y, w, h);
                
                for(var xData in xTicks) {
                    const tick = xTicks[xData];
    
                    const a = clamp( 1 - Math.abs(x - tick.x)/proximity, 0, 1);
    
                    tick._entries.alpha = entryAlpha + a * entryAlphaInv;
                    tick._line.alpha = a;
                    tick._line.scale.y = 1 + a;
                }
            }
        },

        updateMouseToolTip(x:number, y:number, w:number, h:number) {
            const mouseXData = xAxis.plotInverse(x);
            const mouseYData = yAxis.plotInverse(y);
            const xInt = x | 0;
            const yInt = y | 0;

            mouseTooltip.visible = true;
            
            const { _text, _graphics } = mouseTooltip;
            _text.x = xInt;
            _text.y = yInt;
            _text.text = `${mouseYData}\n${mouseXData}`;
            
            _text.pivot.x = (x < w - _text.width) ? 0 : _text.width;
            _text.pivot.y = (y < _text.height) ? 0 : _text.height;
            
            //Draw horizontal line to mouse:
            _graphics.clear();
            pixi.drawLine(_graphics, gap.x, yInt, xInt, yInt, 0x888888, 1);
            pixi.drawLine(_graphics, xInt, yInt, xInt, h - gap.y, 0x888888, 1);
        },
    }

    return ctx;
}