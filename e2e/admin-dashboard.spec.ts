
import { test, expect } from '@playwright/test';

test.describe('Admin Dashboard & Plan Management', () => {

    test('Debe permitir al administrador ver métricas y editar un plan', async ({ page }) => {
        // IDs reales para evitar errores de sintaxis UUID en Postgres
        const adminId = '00000000-0000-4000-a000-000000000001';
        const planId = '33333333-3333-4000-b333-333333333333';

        // 1. Setup Session (Admin)
        await page.addInitScript(({ adminId }) => {
            const adminUser = {
                id: adminId,
                email: 'admin@cafesuroeste.com',
                user_metadata: { full_name: 'Administrador Senior' },
                app_metadata: { role: 'admin' }
            };
            window.localStorage.setItem('sb-bsgthsxojgcybinzvnuh-auth-token', JSON.stringify({
                access_token: 'fake-token',
                refresh_token: 'fake-refresh',
                user: adminUser,
                expires_at: Math.floor(Date.now() / 1000) + 3600
            }));
            // Mock de perfil admin
            window.localStorage.setItem('user_profile', JSON.stringify({
                ...adminUser,
                full_name: 'Administrador Senior',
                is_admin: true
            }));
        }, { adminId });

        // 2. Network Mocks
        // Mock de suscripciones (para métricas)
        await page.route('**/rest/v1/subscriptions*', async route => {
            await route.fulfill({
                status: 200,
                json: [
                    {
                        id: 'sub-1',
                        status: 'ACTIVE',
                        profiles: { full_name: 'Cliente Test' },
                        subscription_plans: { name: 'Plan Experto', price_monthly: 45000 }
                    }
                ]
            });
        });

        // Mock de órdenes (para métricas)
        await page.route('**/rest/v1/orders*', async route => {
            await route.fulfill({
                status: 200,
                json: [
                    {
                        id: 'order-1',
                        total_amount: 50000,
                        payment_status: 'APPROVED',
                        order_status: 'ENTREGADO',
                        customer_email: 'cliente@test.com',
                        created_at: new Date().toISOString()
                    }
                ]
            });
        });

        // Mock de productos
        await page.route('**/rest/v1/products*', async route => {
            await route.fulfill({
                status: 200,
                json: []
            });
        });

        // Mock de planes
        await page.route('**/rest/v1/subscription_plans*', async route => {
            await route.fulfill({
                status: 200,
                json: [
                    {
                        id: planId,
                        name: 'Plan Test Mensual',
                        price_monthly: 35000,
                        features: ['2 bolsas de café', 'Envío gratis'],
                        description: 'Prueba de planes',
                        is_active: true,
                        is_popular: true
                    }
                ]
            });
        });

        // INTERCEPTAR RPC UPDATE
        await page.route('**/rest/v1/rpc/update_plan_v2', async route => {
            if (route.request().method() === 'POST') {
                const body = route.request().postDataJSON();
                console.log('Intercepted update_plan_v2:', body);
                await route.fulfill({ status: 200, json: { success: true } });
            }
        });

        // 3. Acciones del Test
        await page.goto('/admin');

        // Verificar Carga
        await expect(page.getByText('Panel de Control')).toBeVisible({ timeout: 15000 });

        // Verificar Métricas (usando el texto exacto basado en el mock de órdenes)
        // El precio se formatea con comas en la UI. Usamos .first() para evitar strict mode violation.
        await expect(page.getByText('$50,000').first()).toBeVisible();
        await expect(page.getByText('Pedidos Totales')).toBeVisible();

        // Ir a la pestaña de Planes (si existe navegación por tabs)
        // En src/app/admin/page.tsx, hay un sistema de tabs. Usamos .first() para evitar strict mode violation.
        const statsSection = page.locator('div[style*="grid-template-columns"]').first();
        await expect(statsSection).toBeVisible();

        // Como no veo un botón directo de 'Planes' en el resumen superior, 
        // asumimos que el administrador baja o abre el modal si hay un botón.
        // En el código vi fetchPlans() y showPlanModal. 
        // Vamos a buscar un elemento que nos lleve a la edición de planes.

        // Simulamos la acción de editar un plan
        // Nota: En la UI de admin, los planes suelen estar en una sección específica.
        // Vamos a buscar el texto del plan que mockeamos.
        await expect(page.getByText('Plan Test Mensual')).toBeVisible();

        // Buscar el botón de editar (usualmente un icono lucide-react Edit)
        // En el código: <Edit size={16} /> dentro de algún botón
        const editButton = page.locator('button').filter({ has: page.locator('svg[class*="lucide-edit"]') }).first();
        await editButton.click();

        // Verificar Modal de Edición
        await expect(page.getByText('Editar Plan de Suscripción')).toBeVisible();

        // Modificar el precio
        const priceInput = page.locator('input[type="number"]').first();
        await priceInput.fill('40000');

        // Guardar
        await page.getByRole('button', { name: 'Guardar Cambios' }).click();

        // Verificar Toast de éxito
        await expect(page.getByText('Plan actualizado correctamente')).toBeVisible();
    });

});
