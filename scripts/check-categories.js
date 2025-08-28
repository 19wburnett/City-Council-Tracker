const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkCategories() {
  console.log('🔍 Checking categories in agenda items...\n');

  try {
    // Get all unique categories
    const { data: categories, error: categoriesError } = await supabase
      .from('agenda_items')
      .select('category')
      .not('category', 'is', null);

    if (categoriesError) {
      console.error('❌ Error fetching categories:', categoriesError);
      return;
    }

    // Count occurrences of each category
    const categoryCounts = {};
    categories.forEach(item => {
      const category = item.category || 'No Category';
      categoryCounts[category] = (categoryCounts[category] || 0) + 1;
    });

    console.log('📊 Categories found:');
    Object.entries(categoryCounts)
      .sort(([,a], [,b]) => b - a)
      .forEach(([category, count]) => {
        console.log(`   - ${category}: ${count} items`);
      });

    // Get some sample agenda items with their categories
    console.log('\n📋 Sample agenda items with categories:');
    const { data: samples, error: samplesError } = await supabase
      .from('agenda_items')
      .select('title, category, tags')
      .not('category', 'is', null)
      .limit(10);

    if (samplesError) {
      console.error('❌ Error fetching samples:', samplesError);
      return;
    }

    samples.forEach((item, index) => {
      console.log(`   ${index + 1}. Category: "${item.category}"`);
      console.log(`      Title: ${item.title.substring(0, 80)}...`);
      if (item.tags && item.tags.length > 0) {
        console.log(`      Tags: ${item.tags.join(', ')}`);
      }
      console.log('');
    });

  } catch (error) {
    console.error('❌ Error:', error);
  }
}

checkCategories();
