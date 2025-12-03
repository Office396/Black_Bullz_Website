const fs = require('fs');
try {
    const data = JSON.parse(fs.readFileSync('output.json', 'utf8'));
    if (data.success && data.data && data.data[0] && data.data[0].fitgirl) {
        console.log('Title:', data.data[0].fitgirl.title);
        console.log('Debug Info:', JSON.stringify(data.data[0].fitgirl.debug_info, null, 2));
    } else {
        console.log('Structure not found', JSON.stringify(data, null, 2).substring(0, 500));
    }
} catch (e) {
    console.error(e);
}
