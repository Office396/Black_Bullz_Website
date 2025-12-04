import { NextRequest, NextResponse } from 'next/server';
import { GameDetailsScraper } from '@/lib/scrapers/ova-scraper';
import { IMDbGameScraper } from '@/lib/scrapers/imdb-scraper';
import { GameDataExtractor } from '@/lib/scrapers/fitgirl-scraper';
import { ElAmigosDataExtractor } from '@/lib/scrapers/elamigos-scraper';

// Set runtime to nodejs for web scraping on Vercel
export const runtime = 'nodejs';
export const maxDuration = 60; // Maximum execution time for Vercel serverless functions

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { ovagamesUrls = [], fitgirlUrls = [], elamigosUrls = [], imdbUrls = [] } = body;

        // Validate input
        if (!Array.isArray(ovagamesUrls) || !Array.isArray(fitgirlUrls) || !Array.isArray(imdbUrls)) {
            return NextResponse.json(
                { error: 'Invalid input format. Expected arrays of URLs.' },
                { status: 400 }
            );
        }

        const maxUrls = Math.max(ovagamesUrls.length, fitgirlUrls.length, elamigosUrls.length, imdbUrls.length);

        if (maxUrls === 0) {
            return NextResponse.json(
                { error: 'No URLs provided' },
                { status: 400 }
            );
        }

        // Initialize scrapers
        const ovaScraper = new GameDetailsScraper();
        const imdbScraper = new IMDbGameScraper();
        const fitgirlScraper = new GameDataExtractor();
        const elamigosScraper = new ElAmigosDataExtractor();

        // Scrape data from all sources with timeout handling
        const results = [];

        for (let i = 0; i < maxUrls; i++) {
            const gameData: any = {
                index: i,
                ovagames: null,
                fitgirl: null,
                elamigos: null,
                imdb: null
            };

            // Scrape OvaGames with timeout
            if (ovagamesUrls[i]) {
                try {
                    console.log(`Scraping OvaGames: ${ovagamesUrls[i]}`);
                    gameData.ovagames = await Promise.race([
                        ovaScraper.scrapeGame(ovagamesUrls[i]),
                        new Promise((_, reject) =>
                            setTimeout(() => reject(new Error('Timeout')), 30000)
                        )
                    ]);
                } catch (error) {
                    console.error(`Error scraping OvaGames URL ${i}:`, error);
                    gameData.ovagames = null;
                }
            }

            // Scrape FitGirl with timeout
            if (fitgirlUrls[i]) {
                try {
                    console.log(`Scraping FitGirl: ${fitgirlUrls[i]}`);
                    gameData.fitgirl = await Promise.race([
                        fitgirlScraper.extractFitgirlData(fitgirlUrls[i]),
                        new Promise((_, reject) =>
                            setTimeout(() => reject(new Error('Timeout')), 30000)
                        )
                    ]);
                } catch (error) {
                    console.error(`Error scraping FitGirl URL ${i}:`, error);
                    gameData.fitgirl = null;
                }
            }

            // Scrape ElAmigos with timeout
            if (elamigosUrls[i]) {
                try {
                    console.log(`Scraping ElAmigos: ${elamigosUrls[i]}`);
                    gameData.elamigos = await Promise.race([
                        elamigosScraper.extractElAmigosData(elamigosUrls[i]),
                        new Promise((_, reject) =>
                            setTimeout(() => reject(new Error('Timeout')), 30000)
                        )
                    ]);
                } catch (error) {
                    console.error(`Error scraping ElAmigos URL ${i}:`, error);
                    gameData.elamigos = null;
                }
            }

            // Scrape IMDB with timeout
            if (imdbUrls[i]) {
                try {
                    console.log(`Scraping IMDB: ${imdbUrls[i]}`);
                    gameData.imdb = await Promise.race([
                        imdbScraper.scrapeGameDetails(imdbUrls[i]),
                        new Promise((_, reject) =>
                            setTimeout(() => reject(new Error('Timeout')), 30000)
                        )
                    ]);
                } catch (error) {
                    console.error(`Error scraping IMDB URL ${i}:`, error);
                    gameData.imdb = null;
                }
            }

            results.push(gameData);
        }

        console.log(`Successfully scraped ${results.length} games`);
        return NextResponse.json({ success: true, data: results });
    } catch (error) {
        console.error('Scraping error:', error);
        return NextResponse.json(
            { error: 'Failed to scrape game data', details: (error as Error).message },
            { status: 500 }
        );
    }
}
