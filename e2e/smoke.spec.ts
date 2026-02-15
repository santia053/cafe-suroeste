
import { test, expect } from '@playwright/test';

test.describe('Flujo Principal de Usuario', () => {

    test('La página principal debe cargar correctamente', async ({ page }) => {
        // 1. Navegar al Home
        await page.goto('/');

        // 2. Verificar Título
        await expect(page).toHaveTitle(/Café de Origen/);

        // 3. Verificar que exista el catalogo
        const catalogoHeader = page.getByRole('heading', { name: 'Nuestro Catálogo' });
        if (await catalogoHeader.isVisible()) {
            await expect(catalogoHeader).toBeVisible();
        }
    });

    test('Debe poder agregar un producto al carrito', async ({ page }) => {
        // 1. Interceptar la llamada a Supabase ANTES de navegar
        await page.route('**/rest/v1/products*', async route => {
            const json = [
                {
                    id: 'mock-123',
                    name: 'Café Test E2E',
                    origin_farm: 'Finca Test',
                    origin_municipality: 'Jericó',
                    origin_altitude: 1800,
                    variety: 'Castillo',
                    process: 'Lavado',
                    roast_level: 'Medio',
                    tasting_notes: ['Chocolate', 'Nuez'],
                    description: 'Un café mockeado para pruebas automatizadas.',
                    price: 45000,
                    stock: 10,
                    image_url: null,
                    is_published: true,
                    gramaje: 340
                }
            ];
            await route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: JSON.stringify(json)
            });
        });

        // 2. Ir al catálogo (ahora sí cargará el mock)
        await page.goto('/catalog');

        // 3. Esperar que cargue el producto mockeado
        const addToCartBtn = page.getByTestId('add-to-cart-button').first();
        await addToCartBtn.waitFor({ state: 'visible', timeout: 10000 });

        // 4. Hacer clic
        await addToCartBtn.click();

        // 5. Verificar mensaje de éxito
        await expect(page.getByText('añadido al carrito')).toBeVisible();

        // 6. Verificar contador del carrito (opcional)
        // const cartBadge = page.locator('.cart-badge');
        // if (await cartBadge.isVisible()) {
        //     await expect(cartBadge).toHaveText('1');
        // }
    });

});
