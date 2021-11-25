/* global PIXI */
import { _, defer, clamp } from '@/src/utils';
import { createPixiApp } from '@/src/utils.pixi';

const gap:XYType = {x: 50, y: 80};
const deg2rad:number = Math.PI / 180;
const identity = (a:any) => a;

export function setupLineChart(_this:LineChartType) {
    let pixi:any;
    let guideUI:any;
    let xTickContainer:PIXIContainer | null;
    let xTicks:any;

    const {xAxis, yAxis, $el} = _this;
    const getSize = () => ({w: $el.offsetWidth, h: $el.offsetHeight});

    const ctx = {
        setupPixiCanvas() {
            trace("--setupPixiCanvas");
            pixi = createPixiApp({
                view: _this.canvas,
                backgroundColor: 0xffffff,
                onMouseMove: (mouseXY:XYType) => ctx.onMouseMove(mouseXY)
            });
    
            ctx.initGuides();

            return pixi;
        },

        destroy() {
            trace("--destroy");
            pixi.destroy();
        },

        clearCanvas() {
            trace("--clearCanvas");
            if(!pixi) return;
            pixi.clear();
        },

        _resizeChart:null,

        resizeChart() {
            const {w, h} = getSize();
            pixi.renderer.resize(w, h);
            ctx.updateChart(true);
        },

        async updateChart(skipInit=false) {
            trace("--updateChart");

            !skipInit && ctx.initEntries();
    
            await ctx.adjustGuides();
            await ctx.adjustEntries();
            ctx.onMouseMove();
        },

        initGuides() {
            trace("--initGuides");
            guideUI = {};
            guideUI.group = pixi.createContainer(() => {
                guideUI.g = pixi.drawGraphic();
                guideUI.xLabel = pixi.drawLabel(xAxis.label);
                guideUI.yLabel = pixi.drawLabel(yAxis.label);
                guideUI.yLabel.rotation = -90 * deg2rad;
            });
        },

        initEntries() {
            /**
             * Reason that we "init" the entries and not simply "draw" them right away
             * is to prepare each one belonging to a given timestamp to render on a PIXI.Container.
             * Then, when scaling the graph horizontally, it's just a matter of adjusting those
             * containers' X positions.
             */
            if(xTickContainer) {
                xTickContainer.destroy({children: true});
                xTickContainer = null;
            }
    
            xTickContainer = pixi.createContainer();
            xTicks = {};

            const xTickRender = xAxis.tick || identity;
    
            for(var entry of _this.entries) {
                const xData = xAxis.compareFunc(entry);
                
                if(xTicks[xData]) continue;
    
                const tick = xTicks[xData] = pixi.createContainer((tick:PIXIContainer | any) => {
                    tick._label = pixi.drawLabel(xTickRender(xData), 0, 0, {fontSize: xAxis.size || 12});
                    tick._label.pivot.y = -10;
                    tick._label.pivot.x = (tick._label.width * .5) | 0;
                    tick._line = pixi.drawGraphic((g:PIXIGraphics) => pixi.drawLine(g, 0, 0, 0, 10, 0x0, 1));
                    tick._entries = pixi.drawGraphic();
                });
    
                tick.name = xData;
    
                xTickContainer!.addChild(tick);
            }

            trace("--initEntries", Object.keys(xTicks));
        },

        async adjustGuides() {
            trace("--adjustGuides");
            
            ctx.drawMainGuides();
            
            ctx.createPlotFunctions();
    
            for(var xData in xTicks) {
                const tick = xTicks[xData];
                tick.x = xAxis.plot(xData);
                tick.y = 0;
                tick._label.y = 0; yAxis.plot(0);
    
                tick._entries.clear();
                tick._entries.beginFill(0xff0000);
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
            
            const createPlotFunction = (axis:AxisType, bounds:Array<any>, evaluate:any) => {
                const [min, max] = bounds.map(evaluate);
                const [minPX, maxPX] = axis.boundsPixels;
                const diff = max - min;
                const diffPixels = maxPX - minPX;
                
                return (input:any) => {
                    const value = evaluate(input);
                    const ratio = (value - min) / diff;
                    return minPX + ratio * diffPixels;
                }
            }
    
            xAxis.plot = createPlotFunction(xAxis, _this.xBounds, xAxis.evaluate || identity);
            yAxis.plot = createPlotFunction(yAxis, _this.yBounds, yAxis.evaluate || identity);
        },
    
        async adjustEntries() {
            trace("--adjustEntries");
            for(var xData in xTicks) {
                const tick = xTicks[xData];
                const x = xAxis.plot(xData);
                const y = yAxis.plot(0);
                tick.x = x | 0;
                tick.y = 0;
                tick._label.y = y;
                tick._line.y = y;
    
                tick._entries.clear();
                tick._entries.beginFill(0xff0000);
            }
    
            for(var e in _this.entries) {
                var entry = _this.entries[e];
                const xData = xAxis.compareFunc(entry);
                const yData = yAxis.compareFunc(entry);
                const xTick = xTicks[xData];
    
                xTick._entries.drawCircle(0, yAxis.plot(yData), 2);
            }
        },
    
        drawMainGuides() {
            trace("--drawMainGuides");
            const { g, xLabel, yLabel } = guideUI;
            const { w, h } = getSize();
    
            g.clear();
            pixi.drawLine(g, gap.x, 0, gap.x, h-gap.y, 0x000000);
            pixi.drawLine(g, gap.x, h-gap.y, w, h-gap.y, 0x000000);
            xLabel.x = w/2;
            xLabel.y = h-gap.y/2;
    
            yLabel.x = 2;
            yLabel.y = h/2;
        },
    
        onMouseMove(mouseXY?:XYType) {
            // trace("--onMouseMove");
            const yZero = yAxis.plot ? yAxis.plot(0) : 0;
            const entryAlpha = 0.3;
            const entryAlphaInv = 1 - entryAlpha;
            const proximity = 20;
            const distance = 5;
    
            if(!mouseXY) {
                for(var xData in xTicks) {
                    const tick = xTicks[xData];
    
                    tick._label.alpha = 0;
                    tick._line.alpha = 0;
                    tick._entries.alpha = 0.5;
                }
            } else {
                const {x, y} = mouseXY;
                
                for(var xData in xTicks) {
                    const tick = xTicks[xData];
    
                    const a = clamp( 1 - Math.abs(x - tick.x)/proximity, 0, 1);
    
                    tick._label.alpha = a; // > 0.9 ? 1 : 0;
                    tick._line.alpha = a;
                    tick._entries.alpha = entryAlpha + a * entryAlphaInv;
    
                    const aExpo = (a * 2)**2;
                    tick._label.y = yZero + aExpo * distance;
                    tick._line.scale.y = 1 + a;
                }
            }
        }
    }

    return ctx;
}