
import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
    stages: [
        { duration: '30s', target: 20 }, // RAMPA: Subir a 20 usuarios en 30s
        { duration: '1m', target: 20 },  // MESETA: Mantener 20 usuarios por 1m
        { duration: '20s', target: 0 },  // BAJADA: Bajar a 0 usuarios
    ],
    thresholds: {
        http_req_duration: ['p(95)<500'], // El 95% de las peticiones deben ser menores a 500ms
        http_req_failed: ['rate<0.01'],    // Menos del 1% de errores
    },
};

export default function () {
    const baseURL = 'http://localhost:3000';

    // 1. Home Page
    const resHome = http.get(`${baseURL}/`);
    check(resHome, {
        'status is 200 (Home)': (r) => r.status === 200,
    });
    sleep(1);

    // 2. Catalog
    const resCatalog = http.get(`${baseURL}/catalog`);
    check(resCatalog, {
        'status is 200 (Catalog)': (r) => r.status === 200,
        'has coffee items': (r) => r.body.includes('Café'),
    });
    sleep(2);

    // 3. Login Page (Simular interés en comprar)
    const resLogin = http.get(`${baseURL}/login`);
    check(resLogin, {
        'status is 200 (Login)': (r) => r.status === 200,
    });
    sleep(1);
}
