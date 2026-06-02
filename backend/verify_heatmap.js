async function verify() {
    const baseUrl = 'https://local-business-listing-directory-production.up.railway.app/api/v1';
    
    try {
        console.log('Fetching heatmap data...');
        // Note: Heatmap is restricted to SUPERADMIN, but I'll try to fetch it.
        // If it fails with 403, it means the security is working.
        // For testing, I'll check the demand insights which might be public or easier to check.
        
        const response = await fetch(`${baseUrl}/demand/heatmap`);
        if (response.ok) {
            const data = await response.json();
            console.log('Heatmap Data:', JSON.stringify(data, null, 2));
        } else {
            console.error(`Error: ${response.status} ${response.statusText}`);
            if (response.status === 403) {
                console.log('Access restricted as expected (Super Admin only).');
            }
        }
    } catch (err) {
        console.error('Error verifying heatmap:', err.message);
    }
}

verify();

