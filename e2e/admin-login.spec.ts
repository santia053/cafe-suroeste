
import { test, expect } from '@playwright/test';

test.describe('Admin Login Flow', () => {

    test('Debe redirigir y mostrar opciones de Admin tras login exitoso (Mock)', async ({ page }) => {
        const MOCK_USER_ID = "mock-user-id-admin";

        // 1. Interceptar Auth (Session)
        await page.route('**/auth/v1/token*', async route => {
            const mockAuthResponse = {
                access_token: "mock-access-token-12345",
                token_type: "bearer",
                expires_in: 3600,
                refresh_token: "mock-refresh-token-67890",
                user: {
                    id: MOCK_USER_ID,
                    aud: "authenticated",
                    role: "authenticated",
                    email: "admin@cafeorigen.com",
                    app_metadata: { provider: "email" },
                    user_metadata: { full_name: "Admin Test" },
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString()
                }
            };

            await route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: JSON.stringify(mockAuthResponse)
            });
        });

        // 2. Interceptar Profiles (Role Check)
        // La app hace: from('profiles').select('*').eq('id', id).single()
        // Esto envía header 'Accept: application/vnd.pgrst.object+json'
        await page.route('**/rest/v1/profiles*', async route => {
            const mockProfile = {
                id: MOCK_USER_ID,
                full_name: "Admin Test",
                email: "admin@cafeorigen.com",
                role: "admin", // <--- CLAVE: Esto habilita el menú de admin
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            };

            // Detectamos si piden single object
            const headers = route.request().headers();
            const accept = headers['accept'] || '';

            if (accept.includes('application/vnd.pgrst.object+json')) {
                // Return single object
                await route.fulfill({
                    status: 200,
                    contentType: 'application/json',
                    body: JSON.stringify(mockProfile)
                });
            } else {
                // Return array
                await route.fulfill({
                    status: 200,
                    contentType: 'application/json',
                    body: JSON.stringify([mockProfile])
                });
            }
        });

        // 3. Navegar a /login
        await page.goto('/login');

        // 4. Llenar Credenciales
        await page.fill('input[type="email"]', 'admin@cafeorigen.com');
        await page.fill('input[type="password"]', 'password123');

        // 5. Submit
        const loginButton = page.locator('button[type="submit"]');
        await loginButton.click();

        // 6. Verificar
        // La app redirige a Home ('/') no a Admin directamente.
        await expect(page).toHaveURL('/');

        // 7. Verificar que el usuario aparece en el navbar
        // Abrir menú de usuario
        // El botón del avatar tiene el texto de la inicial "A"
        const avatarButton = page.getByText('A', { exact: true }).first();
        await expect(avatarButton).toBeVisible();
        await avatarButton.click();

        // 8. Verificar enlace "Panel Admin"
        const adminLink = page.getByRole('link', { name: 'Panel Admin' });
        await expect(adminLink).toBeVisible();
    });

});
