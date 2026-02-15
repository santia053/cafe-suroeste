export interface Product {
    id: string;
    name: string;
    origin: {
        farm: string;
        municipality: string;
        altitude: number;
    };
    variety: string;
    process: string;
    roast_level: string;
    tasting_notes: string[];
    description: string;
    price: number;
    stock: number;
    image_url: string;
    gramaje: number;
}

export interface SubscriptionPlan {
    id: string;
    name: string;
    bags_count: number;
    grammage: number;
    price_monthly: number;
    description: string;
    features: string[];
    is_popular?: boolean;
}

export const MOCK_PRODUCTS: Product[] = [
    {
        id: '11111111-1111-1111-1111-111111111111',
        name: 'Jericó Tradicional',
        origin: {
            farm: 'Finca La Esperanza',
            municipality: 'Jericó',
            altitude: 1950,
        },
        variety: 'Caturra',
        process: 'Lavado',
        roast_level: 'Media',
        tasting_notes: ['Cítrico', 'Panela', 'Chocolate'],
        description: 'Un café equilibrado con notas dulces y una acidez brillante característica de las altas montañas de Jericó.',
        price: 38000,
        stock: 50,
        image_url: '/products/jerico.jpg',
        gramaje: 340,
    },
    {
        id: '22222222-2222-2222-2222-222222222222',
        name: 'Concordia Intenso',
        origin: {
            farm: 'Finca El Mirador',
            municipality: 'Concordia',
            altitude: 1800,
        },
        variety: 'Castillo',
        process: 'Natural',
        roast_level: 'Media-Oscura',
        tasting_notes: ['Chocolate', 'Nuez', 'Caramelo'],
        description: 'Cuerpo robusto y sabores intensos a chocolate negro y frutos secos.',
        price: 42000,
        stock: 35,
        image_url: '/products/concordia.jpg',
        gramaje: 340,
    },
    {
        id: '33333333-3333-3333-3333-333333333333',
        name: 'Urrao Floral',
        origin: {
            farm: 'Finca Las Nubes',
            municipality: 'Urrao',
            altitude: 2100,
        },
        variety: 'Chiroso',
        process: 'Honey',
        roast_level: 'Media-Clara',
        tasting_notes: ['Frutos Rojos', 'Floral', 'Jazmín'],
        description: 'Una joya de Urrao, con perfiles florales sumamente delicados y complejos.',
        price: 45000,
        stock: 20,
        image_url: '/products/urrao.jpg',
        gramaje: 340,
    },
    {
        id: '44444444-4444-4444-4444-444444444444',
        name: 'Andes Reserva',
        origin: {
            farm: 'Finca San Juan',
            municipality: 'Andes',
            altitude: 1750,
        },
        variety: 'Colombia',
        process: 'Lavado',
        roast_level: 'Media',
        tasting_notes: ['Caramelo', 'Manzana', 'Cacao'],
        description: 'Café de tradición andina con dulzura persistente y retrogusto limpio.',
        price: 39000,
        stock: 45,
        image_url: '/products/andes.jpg',
        gramaje: 340,
    },
];

export const MOCK_SUBSCRIPTION_PLANS: SubscriptionPlan[] = [
    {
        id: '10000000-0000-0000-0000-000000000001',
        name: 'Explorador',
        bags_count: 1,
        grammage: 340,
        price_monthly: 45000,
        description: 'Perfecto para iniciar tu viaje en el café de especialidad.',
        features: ['1 Bolsa de 340g', 'Origen rotativo mensual', 'Guía de cata digital'],
    },
    {
        id: '20000000-0000-0000-0000-000000000002',
        name: 'Barista',
        bags_count: 2,
        grammage: 340,
        price_monthly: 85000,
        description: 'Para los amantes del café que no pueden pasar un día sin su taza perfecta.',
        features: ['2 Bolsas de 340g', 'Envío prioritario', 'Regalo sorpresa mensual', 'Cata virtual trimestral'],
        is_popular: true,
    },
    {
        id: '40000000-0000-0000-0000-000000000004',
        name: 'Maestro',
        bags_count: 4,
        grammage: 340,
        price_monthly: 150000,
        description: 'La experiencia definitiva para los conocedores más exigentes.',
        features: ['4 Bolsas de 340g', 'Molienda personalizada', 'Cata virtual mensual exclusiva', 'Acceso a microlotes limitados'],
    },
];
