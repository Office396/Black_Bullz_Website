import { NextResponse } from 'next/server'
import { getItems } from '@/lib/server/items-store'

export async function GET() {
    try {
        const items = await getItems();

        // Format the items into a text string
        let textContent = "========================================\n";
        textContent += "BULLZGAMEZ - ALL GAMES EXPORT DATA\n";
        textContent += `Generated: ${new Date().toISOString()}\n`;
        textContent += `Total Items: ${items.length}\n`;
        textContent += "========================================\n\n";

        items.forEach((item, index) => {
            textContent += `========================================\n`;
            textContent += `GAME [${index + 1}]: ${item.title}\n`;
            textContent += `========================================\n`;
            textContent += `ID: ${item.id}\n`;
            textContent += `TITLE: ${item.title}\n`;
            textContent += `CATEGORY: ${item.category}\n`;
            textContent += `DEVELOPER: ${item.developer || 'N/A'}\n`;
            textContent += `RELEASE DATE: ${item.releaseDate || 'N/A'}\n`;
            textContent += `UPLOAD DATE: ${item.uploadDate || 'N/A'}\n`;
            textContent += `SIZE: ${item.size || 'N/A'}\n`;
            textContent += `RATING: ${item.rating || 'N/A'}\n`;
            textContent += `TRENDING: ${item.trending ? 'YES' : 'NO'}\n`;
            textContent += `LATEST: ${item.latest ? 'YES' : 'NO'}\n`;
            textContent += `IMAGE URL: ${item.image || 'N/A'}\n`;
            textContent += `SHARED PIN CODE: ${item.sharedPinCode || 'N/A'}\n`;
            textContent += `SHARED RAR PASSWORD: ${item.sharedRarPassword || 'N/A'}\n`;
            textContent += `NOTE: ${item.note || 'N/A'}\n`;

            textContent += `\n--- SYSTEM REQUIREMENTS (RECOMMENDED) ---\n`;
            if (item.systemRequirements && item.systemRequirements.recommended) {
                const sr = item.systemRequirements.recommended;
                textContent += `OS: ${sr.os || 'N/A'}\n`;
                textContent += `PROCESSOR: ${sr.processor || 'N/A'}\n`;
                textContent += `MEMORY: ${sr.memory || 'N/A'}\n`;
                textContent += `GRAPHICS: ${sr.graphics || 'N/A'}\n`;
                textContent += `STORAGE: ${sr.storage || 'N/A'}\n`;
            } else {
                textContent += `N/A\n`;
            }

            textContent += `\n--- ANDROID REQUIREMENTS (RECOMMENDED) ---\n`;
            if (item.androidRequirements && item.androidRequirements.recommended) {
                const ar = item.androidRequirements.recommended;
                textContent += `OS: ${ar.os || 'N/A'}\n`;
                textContent += `RAM: ${ar.ram || 'N/A'}\n`;
                textContent += `STORAGE: ${ar.storage || 'N/A'}\n`;
                textContent += `PROCESSOR: ${ar.processor || 'N/A'}\n`;
            } else {
                textContent += `N/A\n`;
            }

            textContent += `\n--- KEY FEATURES ---\n`;
            if (item.keyFeatures && item.keyFeatures.length > 0) {
                item.keyFeatures.forEach((feat, fi) => {
                    textContent += `[${fi + 1}] ${feat}\n`;
                });
            } else {
                textContent += `N/A\n`;
            }

            textContent += `\n--- SCREENSHOTS ---\n`;
            if (item.screenshots && item.screenshots.length > 0) {
                item.screenshots.forEach((ss, ssi) => {
                    textContent += `[${ssi + 1}] ${ss}\n`;
                });
            } else {
                textContent += `N/A\n`;
            }

            textContent += `\n--- CLOUD DOWNLOAD LINKS ---\n`;
            if (item.cloudDownloads && item.cloudDownloads.length > 0) {
                item.cloudDownloads.forEach((cloud) => {
                    textContent += `PROVIDER: ${cloud.cloudName || 'Direct'}\n`;
                    if (cloud.actualDownloadLinks && cloud.actualDownloadLinks.length > 0) {
                        cloud.actualDownloadLinks.forEach((link) => {
                            textContent += `  -> [${link.name || 'URL'}] ${link.url} ${link.size ? `(${link.size})` : ''}\n`;
                        });
                    }
                });
            } else {
                textContent += `N/A\n`;
            }

            textContent += `\n--- SHORT DESCRIPTION ---\n`;
            textContent += `${item.description || 'N/A'}\n`;

            textContent += `\n--- LONG DESCRIPTION (HTML) ---\n`;
            textContent += `${item.longDescription || 'N/A'}\n`;

            textContent += `\n\n`;
        });

        const response = new NextResponse(textContent, {
            status: 200,
            headers: {
                'Content-Type': 'text/plain',
                'Content-Disposition': 'attachment; filename="bullzgamez_games_export.txt"'
            }
        });

        return response;
    } catch (error) {
        console.error('Failed to export games:', error)
        return NextResponse.json({ success: false, error: 'Failed to export games' }, { status: 500 })
    }
}
