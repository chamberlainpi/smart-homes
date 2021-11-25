export function createPixiApp( pixiOptions ) {
    const app = new PIXI.Application({
        resolution: window.devicePixelRatio,
        // autoResize: true,
        antialias: true,
        ... pixiOptions
    });

    const drawContext = [app.stage];

    return {
        app,
        ticker: app.ticker,
        renderer: app.renderer,
        stage: app.stage,

        get width() {
            return app.renderer.width;
        },

        get height() {
            return app.renderer.height;
        },

        destroy() {
            app.destroy(true, true);
        },
        clear() {
            app.renderer.clear();
        },
        test() {
            const g = new PIXI.Graphics();
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
        },

        createContainer(drawFunc) {
            const container = drawContext[drawContext.length - 1];
            const c = new PIXI.Container();
            container.addChild(c);
            drawContext.push(c);
            drawFunc && drawFunc(c);
            drawContext.pop();
            return c;
        },

        drawGraphic(drawFunc) {
            const container = drawContext[drawContext.length - 1];
            const g = new PIXI.Graphics();
            container.addChild(g);

            drawFunc && drawFunc(g);

            return g;
        },

        drawLine(g, x1, y1, x2, y2, clr=0x000000, thickness=2) {
            g.lineStyle(thickness, clr, 1);
            g.moveTo(x1, y1);
            g.lineTo(x2, y2);
        },

        drawLabel(txt, x, y, opts) {
            const container = drawContext[drawContext.length - 1];
            const text = new PIXI.Text(txt, {
                fontFamily : 'Arial',
                fontSize: 12,
                fill : 0x000000,
                align : 'center',
                ... opts
            });

            text.x = x;
            text.y = y;
            container.addChild(text);
            return text;
        }
    };
}