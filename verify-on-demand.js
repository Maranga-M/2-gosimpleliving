import { dbService } from './services/database.js';

async function verify() {
    console.log('--- Verification: On-Demand Fetching ---');

    try {
        // Attempt to fetch a product (even if it returns null, we check for errors)
        console.log('Testing dbService.getProductById("non-existent-id")...');
        const product = await dbService.getProductById('non-existent-id');
        console.log('✅ getProductById called successfully (Result: ' + (product === null ? 'null as expected' : 'found') + ')');

        console.log('Testing dbService.getBlogPostBySlug("non-existent-slug")...');
        const post = await dbService.getBlogPostBySlug('non-existent-slug');
        console.log('✅ getBlogPostBySlug called successfully (Result: ' + (post === null ? 'null as expected' : 'found') + ')');

        console.log('--- Verification Complete ---');
    } catch (error) {
        console.error('❌ Verification failed with error:', error);
        process.exit(1);
    }
}

verify();
