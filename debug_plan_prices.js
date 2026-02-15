const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

try {
    let envContent = '';
    if (fs.existsSync('.env')) {
        envContent = fs.readFileSync('.env', 'utf8');
        console.log('Reading .env');
    } else if (fs.existsSync('.env.local')) {
        envContent = fs.readFileSync('.env.local', 'utf8');
        console.log('Reading .env.local');
    } else {
        console.log('No .env file found');
    }

    // Simple regex to find the specific keys we need
    const urlMatch = envContent.match(/NEXT_PUBLIC_SUPABASE_URL=["']?([^"'\s]+)["']?/);
    const keyMatch = envContent.match(/NEXT_PUBLIC_SUPABASE_ANON_KEY=["']?([^"'\s]+)["']?/);

    if (urlMatch) process.env.NEXT_PUBLIC_SUPABASE_URL = urlMatch[1];
    if (keyMatch) process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = keyMatch[1];

} catch (e) {
    console.log('Error reading env files:', e.message);
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Error: supabaseUrl and supabaseKey are required.');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkPlans() {
    console.log('Connecting to Supabase...');

    // 1. Check Plans
    const { data: plans, error: plansError } = await supabase
        .from('subscription_plans')
        .select('*');

    if (plansError) {
        console.error('Error fetching plans:', plansError);
    } else {
        console.log('\n--- Current Plans in DB ---');
        plans.forEach(plan => {
            console.log(`- ${plan.name}: $${plan.price_monthly} (Active: ${plan.is_active})`);
        });
    }

    // 2. Check Admins
    console.log('\n--- Checking Admin Users ---');
    const { data: admins, error: adminsError } = await supabase
        .from('profiles')
        .select('id, role, full_name') // Removed email
        .eq('role', 'admin');

    if (adminsError) {
        console.error('Error fetching admins (RLS might be blocking):', adminsError.message);
    } else {
        if (!admins || admins.length === 0) {
            console.log('NO ADMINS FOUND in profiles table!');
        } else {
            admins.forEach(admin => {
                console.log(`- Admin ID: ${admin.id} (Name: ${admin.full_name})`);
            });
        }
    }
}

checkPlans();
