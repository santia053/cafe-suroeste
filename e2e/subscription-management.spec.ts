
import { test, expect } from '@playwright/test';

test.describe('Subscription Management (User)', () => {

    test('Debe permitir al usuario pausar y reanudar su suscripción', async ({ page }) => {
        const userId = '00000000-0000-4000-0000-000000000002';
        const subId = 'ffffffff-ffff-4000-a000-000000000001';

        // 1. Setup Session (Regular User with ACTIVE sub)
        await page.addInitScript(({ userId }) => {
            const user = {
                id: userId,
                email: 'cliente@cafesuroeste.com',
                full_name: 'Juan Valdez', // Campo crítico para el header del perfil
                user_metadata: { full_name: 'Juan Valdez' }
            };
            window.localStorage.setItem('sb-bsgthsxojgcybinzvnuh-auth-token', JSON.stringify({
                access_token: 'fake-token-user',
                refresh_token: 'fake-refresh-user',
                user: user,
                expires_at: Math.floor(Date.now() / 1000) + 3600
            }));
            window.localStorage.setItem('user_profile', JSON.stringify(user));
        }, { userId });

        // 2. Network Mocks
        // Mock de suscripción ACTIVE
        await page.route('**/rest/v1/subscriptions?user_id=eq.*', async route => {
            const method = route.request().method();

            if (method === 'GET') {
                await route.fulfill({
                    status: 200,
                    json: [{
                        id: subId,
                        status: 'ACTIVE',
                        start_date: '2026-01-01',
                        next_billing_date: '2026-03-01',
                        subscription_plans: {
                            name: 'Plan Experto',
                            price_monthly: 45000,
                            bags_count: 2
                        }
                    }]
                });
            } else if (method === 'PATCH') {
                const body = route.request().postDataJSON();
                console.log('Intercepted Subscription Update:', body);
                await route.fulfill({ status: 200, json: { ...body, id: subId } });
            }
        });

        // Mock de órdenes
        await page.route('**/rest/v1/orders*', async route => {
            await route.fulfill({ status: 200, json: [] });
        });

        // 3. Acciones del Test
        await page.goto('/profile');

        // Pequeño delay para asegurar hidratación de localStorage -> Auth State
        await page.waitForTimeout(2000);

        // Verificar Estado Inicial
        // Usamos regex con .first() para ser flexibles con mayúsculas/minúsculas o espacios extra
        await expect(page.getByText(/Plan Experto/i).first()).toBeVisible({ timeout: 15000 });
        await expect(page.getByText(/Activa/i).first()).toBeVisible();

        // Pausar Suscripción
        const pauseButton = page.getByRole('button', { name: 'Pausar Suscripción' });
        await expect(pauseButton).toBeVisible();
        await pauseButton.click();

        // Verificar Cambio en UI
        await expect(page.getByText('Suscripción pausada con éxito')).toBeVisible();
        // El badge debería cambiar a 'Pausada'
        await expect(page.getByText('Pausada')).toBeVisible();

        // Reanudar Suscripción
        // El botón debería cambiar de texto dinámicamente según el estado
        const resumeButton = page.getByRole('button', { name: 'Reanudar Suscripción' });
        await expect(resumeButton).toBeVisible();
        await resumeButton.click();

        // Verificar Cambio en UI Final
        await expect(page.getByText('Suscripción reactivada')).toBeVisible();
        await expect(page.getByText('Activa')).toBeVisible();
    });

});
