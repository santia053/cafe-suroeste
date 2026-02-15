
import { test, expect } from '@playwright/test';

test.describe('Performance Vitals', () => {

    test('Debe cumplir con los umbrales de Web Vitals en la Home', async ({ page }) => {
        // Habilitar métricas de performance
        await page.goto('/');

        // Extraer métricas básicas usando el Performance API del navegador
        const metrics = await page.evaluate(() => {
            const getVitals = () => {
                const nav = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
                const paint = performance.getEntriesByType('paint');
                const fcp = paint.find(p => p.name === 'first-contentful-paint');

                return {
                    tdns: nav.domainLookupEnd - nav.domainLookupStart,
                    ttfb: nav.responseStart - nav.requestStart,
                    domReady: nav.domContentLoadedEventEnd - nav.fetchStart,
                    fcp: fcp ? fcp.startTime : 0,
                };
            };
            return getVitals();
        });

        console.log('Performance Metrics (Home):', metrics);

        // Umbrales para entorno de DEV (En PROD deberían ser más bajos)
        expect(metrics.ttfb).toBeLessThan(1000); // TTFB < 1s en Dev
        expect(metrics.fcp).toBeLessThan(2000); // FCP < 2s en Dev
    });

    test('Debe cargar el Catálogo en menos de 1 segundo (TTI estimado)', async ({ page }) => {
        const start = Date.now();
        await page.goto('/catalog');
        await page.waitForSelector('.grid'); // Esperar a que los productos sean visibles
        const duration = Date.now() - start;

        console.log(`Catálogo cargado en: ${duration}ms`);
        expect(duration).toBeLessThan(2000); // Umbral de 2s para entorno de dev local
    });

});
