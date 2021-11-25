/* global PIXI */

export function createPixiApp( pixiOptions ) {
    const app = new PIXI.Application({
        resolution: window.devicePixelRatio,
        autoResize: true,
        antialias: true,
        ... pixiOptions
    });

    return {
        app,
        ticker: app.ticker,
        renderer: app.renderer,
        
        destroy() {
            app.destroy(true, true);
        },
        clear() {
            app.renderer.clear();
        },
        test() {
            var g = new PIXI.Graphics();
            app.stage.addChild(g);

            const { ticker } = app;

            window.ticker = ticker;

            app.ticker.add(() => {
                const w = app.renderer.width;
                const h = app.renderer.height;
                const t = ticker.lastTime * 0.001;
                const x = Math.cos(t) * w/2;
                const y = Math.sin(t) * h/2;
                g.clear();
                g.lineStyle(2, 0xff0000, 1);
                g.moveTo(w/2, h/2);
                g.lineTo(w/2 + x, h/2 + y);
            });
        }
    };
}