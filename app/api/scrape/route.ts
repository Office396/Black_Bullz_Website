import { NextRequest, NextResponse } from 'next/server';
import { execFile } from 'child_process';
import { promisify } from 'util';
import path from 'path';

const execFileAsync = promisify(execFile);

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { ovagamesUrls = [], fitgirlUrls = [], imdbUrls = [] } = body;

        // Validate input
        if (!Array.isArray(ovagamesUrls) || !Array.isArray(fitgirlUrls) || !Array.isArray(imdbUrls)) {
            return NextResponse.json(
                { error: 'Invalid input format. Expected arrays of URLs.' },
                { status: 400 }
            );
        }

        const maxUrls = Math.max(ovagamesUrls.length, fitgirlUrls.length, imdbUrls.length);

        if (maxUrls === 0) {
            return NextResponse.json(
                { error: 'No URLs provided' },
                { status: 400 }
            );
        }

        // Path to Python wrapper scripts
        const scriptsDir = path.join(process.cwd(), 'Automation of PC games details');

        // Scrape data from all sources
        const results = [];

        for (let i = 0; i < maxUrls; i++) {
            const gameData: any = {
                index: i,
                ovagames: null,
                fitgirl: null,
                imdb: null
            };

            // Scrape OvaGames
            if (ovagamesUrls[i]) {
                try {
                    gameData.ovagames = await scrapeOvaGames(scriptsDir, ovagamesUrls[i]);
                } catch (error) {
                    console.error(`Error scraping OvaGames URL ${i}:`, error);
                }
            }

            // Scrape FitGirl
            if (fitgirlUrls[i]) {
                try {
                    gameData.fitgirl = await scrapeFitGirl(scriptsDir, fitgirlUrls[i]);
                } catch (error) {
                    console.error(`Error scraping FitGirl URL ${i}:`, error);
                }
            }

            // Scrape IMDB
            if (imdbUrls[i]) {
                try {
                    gameData.imdb = await scrapeIMDB(scriptsDir, imdbUrls[i]);
                } catch (error) {
                    console.error(`Error scraping IMDB URL ${i}:`, error);
                }
            }

            results.push(gameData);
        }

        return NextResponse.json({ success: true, data: results });
    } catch (error) {
        console.error('Scraping error:', error);
        return NextResponse.json(
            { error: 'Failed to scrape game data', details: (error as Error).message },
            { status: 500 }
        );
    }
}

async function scrapeOvaGames(scriptsDir: string, url: string) {
    const scriptPath = path.join(scriptsDir, 'ova_scraper_wrapper.py');

    try {
        const { stdout, stderr } = await execFileAsync('python', [scriptPath, url], {
            timeout: 30000 // 30 second timeout
        });

        if (stderr) {
            console.warn(`OvaGames stderr: ${stderr}`);
        }

        try {
            const data = JSON.parse(stdout);
            return data;
        } catch (parseError) {
            console.error('OvaGames JSON parse error:', parseError);
            console.error('OvaGames stdout:', stdout);
            throw new Error(`Failed to parse JSON output: ${(parseError as Error).message}. Stdout: ${stdout.substring(0, 200)}...`);
        }
    } catch (error) {
        throw new Error(`OvaGames scraping failed: ${(error as Error).message}`);
    }
}

async function scrapeFitGirl(scriptsDir: string, url: string) {
    const scriptPath = path.join(scriptsDir, 'fitgirl_scraper_wrapper.py');

    try {
        const { stdout, stderr } = await execFileAsync('python', [scriptPath, url], {
            timeout: 30000
        });

        if (stderr) {
            console.warn(`FitGirl stderr: ${stderr}`);
        }

        try {
            const data = JSON.parse(stdout);
            return data;
        } catch (parseError) {
            console.error('FitGirl JSON parse error:', parseError);
            console.error('FitGirl stdout:', stdout);
            throw new Error(`Failed to parse JSON output: ${(parseError as Error).message}. Stdout: ${stdout.substring(0, 200)}...`);
        }
    } catch (error) {
        throw new Error(`FitGirl scraping failed: ${(error as Error).message}`);
    }
}

async function scrapeIMDB(scriptsDir: string, url: string) {
    const scriptPath = path.join(scriptsDir, 'imdb_scraper_wrapper.py');

    try {
        const { stdout, stderr } = await execFileAsync('python', [scriptPath, url], {
            timeout: 30000
        });

        if (stderr) {
            console.warn(`IMDB stderr: ${stderr}`);
        }

        try {
            const data = JSON.parse(stdout);
            return data;
        } catch (parseError) {
            console.error('IMDB JSON parse error:', parseError);
            console.error('IMDB stdout:', stdout);
            throw new Error(`Failed to parse JSON output: ${(parseError as Error).message}. Stdout: ${stdout.substring(0, 200)}...`);
        }
    } catch (error) {
        throw new Error(`IMDB scraping failed: ${(error as Error).message}`);
    }
}
