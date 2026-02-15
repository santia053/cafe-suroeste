
import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test.describe('Accesibilidad y Diseño Inclusivo', () => {

    test('La Home debe cumplir con los estándares básicos de accesibilidad', async ({ page }) => {
        await page.goto('/');

        // Esperar a que la página esté cargada
        await page.waitForLoadState('networkidle');

        // Ejecutar auditoría de accesibilidad
        const accessibilityScanResults = await new AxeBuilder({ page })
            .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
            .analyze();

        // Extraer violaciones si existen
        const violations = accessibilityScanResults.violations;

        if (violations.length > 0) {
            console.log('Violaciones de Accesibilidad (Home):', JSON.stringify(violations, null, 2));
        }

        expect(violations).toEqual([]);
    });

    test('El Catálogo debe tener etiquetas correctas en productos y filtros', async ({ page }) => {
        await page.goto('/catalog');
        await page.waitForSelector('.grid');

        const accessibilityScanResults = await new AxeBuilder({ page })
            .withTags(['wcag2a', 'wcag2aa'])
            .analyze();

        expect(accessibilityScanResults.violations).toEqual([]);
    });

    test('La navegación por teclado debe ser coherente', async ({ page }) => {
        await page.goto('/');

        // Presionar Tab varias veces y verificar que el foco se mueva
        await page.keyboard.press('Tab');
        const activeElement = await page.evaluate(() => document.activeElement?.tagName);
        expect(activeElement).not.toBe('BODY');
    });

});
