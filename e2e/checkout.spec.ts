
import { test, expect } from '@playwright/test';

test.describe('Flujo de Checkout (Guest) - State Seeding', () => {

    test('Debe permitir a un usuario invitado completar una compra (con carrito precargado)', async ({ page }) => {
        test.setTimeout(60000);

        // Debug: Print browser console logs to terminal
        page.on('console', msg => console.log(`BROWSER: ${msg.text()}`));
        page.on('pageerror', err => console.log(`BROWSER ERROR: ${err}`));

        console.log('--- INICIO TEST (SEEDING) ---');

        // 1. Definir el estado del carrito (State Seeding)
        const mockCartItem = {
            id: "e2e00000-0000-4000-8000-000000000123",
            name: "Café Especial Origen (Seed)",
            description: "Notas de chocolate y nuez",
            price: 25000,
            image_url: "https://example.com/coffee.jpg",
            category: "cafe",
            stock: 10,
            // Datos coincidentes con la estructura de Product de la App
            origin: {
                municipality: "Jericó",
                farm: "La Esperanza",
                altitude: 1800
            },
            origin_municipality: "Jericó", // Mantener redundancia por seguridad si algo lo usa plano
            origin_farm: "La Esperanza",
            origin_altitude: 1800,
            variety: "Castillo",
            process: "Lavado",
            roast_level: "Medio",
            tasting_notes: ["Chocolate", "Caramelo"],
            is_published: true,
            gramaje: 340,
            quantity: 2 // 2 unidades para probar totales
        };

        // 2. Mock de Red (Network Mocking)
        // Mock de validación de precios (si la app lo hace al cargar checkout)
        // La app valida precios contra la DB, así que debemos mockear la respuesta de Supabase para este producto
        await page.route(`**/rest/v1/products?select=price&id=eq.${mockCartItem.id}`, async route => {
            console.log('Intercepted PRICE CHECK');
            await route.fulfill({
                status: 200,
                json: { price: 25000 } // El precio no ha cambiado
            });
        });

        // Mock genérico de productos por si acaso
        await page.route('**/rest/v1/products*', async route => {
            if (route.request().method() === 'GET') {
                // Si es una búsqueda específica por ID (usada en validación a veces)
                if (route.request().url().includes('select=price')) {
                    await route.fulfill({ status: 200, json: { price: 25000 } });
                    return;
                }
                // Si es query general
                await route.fulfill({ status: 200, json: [mockCartItem] });
            } else {
                await route.continue();
            }
        });

        // Mock de Creación de Orden (POST /orders)
        await page.route('**/rest/v1/orders', async route => {
            if (route.request().method() === 'POST') {
                console.log('Intercepted ORDER CREATION');
                const reqBody = route.request().postDataJSON();
                console.log('Order Body:', reqBody);

                await route.fulfill({
                    status: 201,
                    json: {
                        id: "order-seed-001",
                        total_amount: reqBody.total_amount,
                        status: "RECIBIDO"
                    }
                });
            } else {
                await route.continue();
            }
        });

        // Mock de Items de Orden (POST /order_items)
        await page.route('**/rest/v1/order_items', async route => {
            if (route.request().method() === 'POST') {
                await route.fulfill({ status: 201, json: {} });
            } else {
                await route.continue();
            }
        });

        // 3. Inyectar Estado y Navegar
        await page.addInitScript(cart => {
            window.localStorage.setItem('cart', JSON.stringify([cart]));
        }, mockCartItem);

        // Navegar directamente al checkout (ya con datos)
        await page.goto('/checkout');

        // --- VERIFICACIÓN DE ESTADO INICIAL ---
        // Verificar que el producto inyectado aparece (Playwright reintentará automáticamente)
        await expect(page.getByText('Café Especial Origen (Seed)')).toBeVisible({ timeout: 15000 });

        // El precio aparece en varios lugares (item subtotal, subtotal general, total)
        // Usamos .first() para evitar violaciones de modo estricto
        await expect(page.getByText('$50,000').first()).toBeVisible();

        // --- FLUJO DE UI ---

        // Clic en Continuar al Envío
        await page.getByRole('button', { name: 'Continuar al Envío' }).click();

        // Llenar formulario de envío
        await page.fill('input[placeholder="Tu nombre completo"]', 'Arquitecto Test');
        await page.fill('input[placeholder="tu@email.com"]', 'arquitecto@test.com');
        await page.fill('input[placeholder="300 123 4567"]', '3009998888');
        await page.fill('input[placeholder="Medellín"]', 'Medellín');
        await page.selectOption('select', 'Antioquia');
        await page.fill('input[placeholder="Calle 10 #5-23, Apt 402"]', 'Calle Test 123');

        // Clic en Continuar al Pago
        await page.getByRole('button', { name: 'Continuar al Pago' }).click();

        // Verificar Resumen
        await expect(page.getByText('Resumen del Pedido')).toBeVisible();

        // Confirmar y Pagar
        const payButton = page.locator('button:has-text("Confirmar y Pagar")');
        await expect(payButton).toBeVisible();
        await payButton.click();

        // --- EXITO ---
        // Esperar transición a pantalla de éxito
        await expect(page.getByText('¡Pedido Exitoso!')).toBeVisible({ timeout: 15000 });
        await expect(page.getByText('Gracias por apoyar al café del suroeste antioqueño.')).toBeVisible();
    });

});
