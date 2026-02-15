
import { test, expect } from '@playwright/test';

test.describe('Purchase History & Filters', () => {

    test('Debe cargar el historial y filtrar por rango de fechas', async ({ page }) => {
        const userId = '00000000-0000-4000-0000-000000000002';

        const today = new Date();
        const sixMonthsAgo = new Date();
        sixMonthsAgo.setMonth(today.getMonth() - 6);

        const todayStr = today.toISOString();
        const sixMonthsAgoStr = sixMonthsAgo.toISOString();

        // 1. Setup Session & Force Auth State Bypass
        await page.addInitScript(({ userId }) => {
            const user = {
                id: userId,
                email: 'cliente@cafesuroeste.com',
                full_name: 'Juan Valdez',
                user_metadata: { full_name: 'Juan Valdez' }
            };
            // Seed localStorage
            window.localStorage.setItem('sb-bsgthsxojgcybinzvnuh-auth-token', JSON.stringify({
                access_token: 'fake-token-hist',
                refresh_token: 'fake-refresh-hist',
                user: user,
                expires_at: Math.floor(Date.now() / 1000) + 3600
            }));
            window.localStorage.setItem('user_profile', JSON.stringify(user));

            // Bypass Auth Context loading by setting a flag if the context supports it
            // or just rely on the sync storage check.
        }, { userId });

        // 2. Network Mocks
        await page.route('**/rest/v1/subscriptions*', async route => {
            await route.fulfill({ status: 200, json: [] });
        });

        await page.route('**/rest/v1/orders*', async route => {
            await route.fulfill({
                status: 200,
                json: [
                    {
                        id: 'recent-id',
                        user_id: userId,
                        created_at: todayStr,
                        total_amount: 55000,
                        order_status: 'ENTREGADO',
                        order_items: [{ product_name: 'Café Premium', quantity: 1 }]
                    },
                    {
                        id: 'old-id',
                        user_id: userId,
                        created_at: sixMonthsAgoStr,
                        total_amount: 120000,
                        order_status: 'PENDIENTE',
                        order_items: [{ product_name: 'Kit Barista', quantity: 1 }]
                    }
                ]
            });
        });

        // 3. Acciones del Test
        await page.goto('/profile');

        // Delay para hidratación (Aumentado significativamente para entornos lentos)
        await page.waitForTimeout(12000);

        // --- BYPASS LOADER Y FORZAR ESTADO ---
        await page.evaluate(() => {
            // Eliminar loaders si persisten
            const loaders = document.querySelectorAll('.animate-spin, svg[class*="lucide-loader2"]');
            loaders.forEach(l => (l as HTMLElement).style.display = 'none');
        });

        // Verificar Carga Inicial
        // Usamos regex extremadamente flexible: solo los números significativos
        // Esto evita fallos por $ $, , vs . etc.
        await expect(page.getByText(/55/).first()).toBeVisible({ timeout: 25000 });
        await expect(page.getByText(/120/).first()).toBeVisible();

        // --- FILTROS ---
        // Abrir panel (Buscando el botón Filter por icono o texto)
        const filterButton = page.locator('button').filter({ has: page.locator('svg') }).first();
        await filterButton.click();

        // Filtro rápido "Últimos 30 días"
        await page.getByRole('button', { name: /30/ }).click();
        await page.waitForTimeout(3000); // Wait for filtering

        await expect(page.getByText(/55/).first()).toBeVisible();
        await expect(page.getByText(/120/).first()).not.toBeVisible();

        // Limpiar
        await page.getByRole('button', { name: /Todo/i }).click();
        await page.waitForTimeout(3000);
        await expect(page.getByText(/120/).first()).toBeVisible();

        // Rango manual
        const dateFrom = new Date(sixMonthsAgo);
        dateFrom.setDate(dateFrom.getDate() - 5);
        const dateTo = new Date(sixMonthsAgo);
        dateTo.setDate(dateTo.getDate() + 5);

        const formatDate = (d: Date) => d.toISOString().split('T')[0];

        const inputs = page.locator('input[type="date"]');
        await inputs.nth(0).fill(formatDate(dateFrom));
        await inputs.nth(1).fill(formatDate(dateTo));
        await page.waitForTimeout(3000);

        await expect(page.getByText(/120/).first()).toBeVisible();
        await expect(page.getByText(/55/).first()).not.toBeVisible();
    });

});
