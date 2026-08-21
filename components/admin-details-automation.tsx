'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Check } from 'lucide-react';
import { mergeGameData, type ScrapedGameData, type MergedGameData, type MergePreferences, cleanFitGirlTitle, extractFileSize } from '@/lib/scraper-utils';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

// Default preferences as requested by user
const DEFAULT_PREFERENCES: MergePreferences = {
  title: 'fitgirl',
  developer: 'ovagames',
  fileSize: 'ovagames',
  longDescription: 'ovagames',
  shortDescription: 'imdb',
  screenshots: 'fitgirl',
  genres: 'fitgirl',
  languages: 'fitgirl',
  systemRequirements: 'ovagames',
  downloadLinks: 'fitgirl',
  rating: 'imdb',
  originalSize: 'fitgirl'
};
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

type FieldSource = 'ovagames' | 'fitgirl' | 'elamigos' | 'imdb';

interface GameResult {
    index: number;
    ovagames: any;
    fitgirl: any;
    elamigos: any;
    imdb: any;
    merged: MergedGameData;
    preferences: MergePreferences;
}

export default function AdminDetailsAutomation() {
    const [category, setCategory] = useState<string>('PC Games');
    const [ovagamesUrls, setOvagamesUrls] = useState<string>('');
    const [fitgirlUrls, setFitgirlUrls] = useState<string>('');
    const [elamigosUrls, setElamigosUrls] = useState<string>('');
    const [imdbUrls, setImdbUrls] = useState<string>('');
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [isSaving, setIsSaving] = useState<boolean>(false);
    const [results, setResults] = useState<GameResult[]>([]);
    const [error, setError] = useState<string>('');
    const [saveSuccess, setSaveSuccess] = useState<string>('');

    const handleStartAutomation = async () => {
        setIsLoading(true);
        setError('');
        setResults([]);

        try {
            const ovagamesUrlList = ovagamesUrls.split('\n').map(u => u.trim()).filter(u => u);
            const fitgirlUrlList = fitgirlUrls.split('\n').map(u => u.trim()).filter(u => u);
            const elamigosUrlList = elamigosUrls.split('\n').map(u => u.trim()).filter(u => u);
            const imdbUrlList = imdbUrls.split('\n').map(u => u.trim()).filter(u => u);

            const response = await fetch('/api/scrape', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ovagamesUrls: ovagamesUrlList,
                    fitgirlUrls: fitgirlUrlList,
                    elamigosUrls: elamigosUrlList,
                    imdbUrls: imdbUrlList,
                }),
            });

            const data = await response.json();
            if (!response.ok) throw new Error(data.error || 'Failed to scrape data');

            const processedResults = data.data.map((item: any) => {
                const scraped: ScrapedGameData = {
                    ovagames: item.ovagames,
                    fitgirl: item.fitgirl,
                    elamigos: item.elamigos,
                    imdb: item.imdb,
                };

                // Debug logging to see download links structure
                if (item.fitgirl?.download_links) {
                    console.log('FitGirl download_links:', JSON.stringify(item.fitgirl.download_links, null, 2));
                }

                const merged = mergeGameData(scraped);

                // Debug logging to see merged download links
                if (merged.downloadLinks) {
                    console.log('Merged downloadLinks:', JSON.stringify(merged.downloadLinks, null, 2));
                }

                return { ...item, merged, preferences: { ...DEFAULT_PREFERENCES } };
            });

            setResults(processedResults);
        } catch (err) {
            setError((err as Error).message || 'An error occurred during scraping');
        } finally {
            setIsLoading(false);
        }
    };

    const updatePreference = (gameIndex: number, field: keyof MergePreferences, source: FieldSource) => {
        setResults(prevResults => prevResults.map((game, idx) => {
            if (idx !== gameIndex) return game;
            const newPreferences = { ...game.preferences, [field]: source };
            const scraped: ScrapedGameData = {
                ovagames: game.ovagames,
                fitgirl: game.fitgirl,
                elamigos: game.elamigos,
                imdb: game.imdb,
            };
            return {
                ...game,
                preferences: newPreferences,
                merged: mergeGameData(scraped, newPreferences)
            };
        }));
    };

    const handleSaveAll = async () => {
        if (results.length === 0) return;

        setIsSaving(true);
        setSaveSuccess('');
        setError('');

        try {
            let savedCount = 0;

            for (const result of results) {
                const merged = result.merged;

                const formData = {
                    title: merged.title || 'Untitled Game',
                    category: category,
                    description: merged.shortDescription || '',
                    longDescription: merged.longDescription || '',
                    developer: merged.developer || '',
                    size: merged.fileSize || '',
                    releaseDate: new Date().toISOString().split('T')[0],
                    image: merged.profileImage || '',
                    rating: merged.rating || '4.0',
                    latest: true,
                    keyFeatures: merged.genres || [],
                    screenshots: merged.screenshots || [],
                    note: merged.languages ? `Languages: ${merged.languages}\nOriginal Size: ${merged.originalSize || 'N/A'}\nRepack Size: ${merged.repackSize || 'N/A'}` : undefined,
                    systemRequirements: {
                        recommended: {
                            os: merged.systemRequirements?.os || '',
                            processor: merged.systemRequirements?.processor || '',
                            memory: merged.systemRequirements?.memory || '',
                            graphics: merged.systemRequirements?.graphics || '',
                            storage: merged.systemRequirements?.storage || '',
                            directx: merged.systemRequirements?.directx || '',
                            sound_card: merged.systemRequirements?.sound_card || ''
                        }
                    },
                    sharedPinCode: Math.floor(1000 + Math.random() * 9000).toString(),
                    sharedRarPassword: '',
                    cloudDownloads: merged.downloadLinks?.length ? merged.downloadLinks.map(provider => ({
                        cloudName: provider.cloudName,
                        partsNumber: undefined, // Don't auto-fill partsNumber
                        version: undefined,
                        actualDownloadLinks: provider.links
                    })) : [{
                        cloudName: '',
                        actualDownloadLinks: [{ name: '', url: '', size: '' }]
                    }]
                };

                const response = await fetch('/api/items', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(formData),
                });

                const responseData = await response.json();

                if (response.ok && responseData.success) {
                    savedCount++;
                } else {
                    throw new Error(responseData.error || `Failed to save "${merged.title}"`);
                }
            }

            setSaveSuccess(`✅ Successfully saved ${savedCount} game(s) to the database!`);

            setTimeout(() => {
                setResults([]);
                setOvagamesUrls('');
                setFitgirlUrls('');
                setElamigosUrls('');
                setImdbUrls('');
                setSaveSuccess('');
            }, 3000);

        } catch (err) {
            setError(`Save failed: ${(err as Error).message}`);
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle>Details Automation</CardTitle>
                    <CardDescription>Automatically extract and save game details from multiple sources</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="mb-6">
                        <label className="block text-sm font-medium mb-2">Category</label>
                        <select value={category} onChange={(e) => setCategory(e.target.value)} className="w-full p-2 border rounded-md bg-gray-800 text-white">
                            <option value="PC Games">PC Games</option>
                        </select>
                    </div>

                    {category === 'PC Games' ? (
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium mb-2">OvaGames URLs (one per line)</label>
                                <Textarea value={ovagamesUrls} onChange={(e) => setOvagamesUrls(e.target.value)} placeholder="https://www.ovagames.com/game-url" className="min-h-[100px] bg-gray-800 text-white" disabled={isLoading} />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-2">FitGirl Repack URLs (one per line)</label>
                                <Textarea value={fitgirlUrls} onChange={(e) => setFitgirlUrls(e.target.value)} placeholder="https://fitgirl-repacks.site/game-url" className="min-h-[100px] bg-gray-800 text-white" disabled={isLoading} />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-2">ElAmigos URLs (one per line)</label>
                                <Textarea value={elamigosUrls} onChange={(e) => setElamigosUrls(e.target.value)} placeholder="https://www.elamigosgamez.com/games/game-url" className="min-h-[100px] bg-gray-800 text-white" disabled={isLoading} />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-2">IMDB URLs (one per line)</label>
                                <Textarea value={imdbUrls} onChange={(e) => setImdbUrls(e.target.value)} placeholder="https://www.imdb.com/title/tt123456/" className="min-h-[100px] bg-gray-800 text-white" disabled={isLoading} />
                            </div>
                            <Button onClick={handleStartAutomation} disabled={isLoading || (!ovagamesUrls && !fitgirlUrls && !elamigosUrls && !imdbUrls)} className="w-full">
                                {isLoading ? (<><Loader2 className="mr-2 h-4 w-4 animate-spin" />Scraping data...</>) : 'Start Automation'}
                            </Button>
                        </div>
                    ) : (
                        <div className="text-center py-12 text-gray-400">
                            <p>Automation for {category} is not yet available</p>
                            <p className="text-sm mt-2">Currently only PC Games automation is supported</p>
                        </div>
                    )}

                    {error && (
                        <div className="mt-4 p-4 bg-red-900/20 border border-red-500 rounded-md">
                            <p className="text-red-500">{error}</p>
                        </div>
                    )}
                </CardContent>
            </Card>

            {results.length > 0 && (
                <div className="space-y-8">
                    {results.map((result, index) => (
                        <Card key={index} className="bg-gray-800/50 border-gray-700 overflow-hidden">
                            <CardHeader className="bg-gray-900/50 border-b border-gray-700">
                                <div className="flex items-center justify-between">
                                    <CardTitle className="text-xl text-white">{result.merged?.title || `Game ${index + 1}`}</CardTitle>
                                    <div className="flex items-center space-x-2">
                                        <TooltipProvider><Tooltip><TooltipTrigger>
                                            <Badge variant={result.ovagames ? "default" : "destructive"} className="mr-1">Ova: {result.ovagames ? "OK" : "No Data"}</Badge>
                                        </TooltipTrigger><TooltipContent><p>Raw Status: {result.ovagames ? "Success" : "Failed/Empty"}</p></TooltipContent></Tooltip></TooltipProvider>
                                        <TooltipProvider><Tooltip><TooltipTrigger>
                                            <Badge variant={result.fitgirl ? "default" : "destructive"} className="mr-1">FitGirl: {result.fitgirl ? "OK" : "No Data"}</Badge>
                                        </TooltipTrigger><TooltipContent><p>Raw Status: {result.fitgirl ? "Success" : "Failed/Empty"}</p></TooltipContent></Tooltip></TooltipProvider>
                                        <TooltipProvider><Tooltip><TooltipTrigger>
                                            <Badge variant={result.elamigos ? "default" : "destructive"} className="mr-1">ElAmigos: {result.elamigos ? "OK" : "No Data"}</Badge>
                                        </TooltipTrigger><TooltipContent><p>Raw Status: {result.elamigos ? "Success" : "Failed/Empty"}</p></TooltipContent></Tooltip></TooltipProvider>
                                        <TooltipProvider><Tooltip><TooltipTrigger>
                                            <Badge variant={result.imdb ? "default" : "destructive"}>IMDB: {result.imdb ? "OK" : "No Data"}</Badge>
                                        </TooltipTrigger><TooltipContent><p>Raw Status: {result.imdb ? "Success" : "Failed/Empty"}</p></TooltipContent></Tooltip></TooltipProvider>
                                    </div>
                                </div>
                                <CardDescription>Click on a cell to select that source for the final merged data.</CardDescription>
                            </CardHeader>
                            <CardContent className="p-0">
                                <div className="overflow-x-auto">
                                    <Table>
                                        <TableHeader>
                                            <TableRow className="bg-gray-900/80 hover:bg-gray-900/80">
                                                <TableHead className="w-[150px] text-gray-300">Field</TableHead>
                                                <TableHead className="text-blue-400 font-bold">OvaGames</TableHead>
                                                <TableHead className="text-green-400 font-bold">FitGirl</TableHead>
                                                <TableHead className="text-orange-400 font-bold">ElAmigos</TableHead>
                                                <TableHead className="text-purple-400 font-bold">IMDB</TableHead>
                                                <TableHead className="w-[250px] text-white font-bold bg-gray-900">Merged Result</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            <ComparisonRow label="Title" field="title" gameIndex={index} result={result} onSelect={updatePreference} values={{ ovagames: result.ovagames?.title, fitgirl: result.fitgirl?.title ? cleanFitGirlTitle(result.fitgirl.title) : null, elamigos: result.elamigos?.title, imdb: result.imdb?.title }} mergedValue={result.merged.title} />
                                            <ComparisonRow label="Developer" field="developer" gameIndex={index} result={result} onSelect={updatePreference} values={{ ovagames: result.ovagames?.developer, fitgirl: result.fitgirl?.companies, elamigos: result.elamigos?.developer, imdb: result.imdb?.developer }} mergedValue={result.merged.developer} />
                                            <ComparisonRow label="File Size" field="fileSize" gameIndex={index} result={result} onSelect={updatePreference} values={{ ovagames: result.ovagames?.file_size ? extractFileSize(result.ovagames.file_size) : null, fitgirl: result.fitgirl?.repack_size, elamigos: result.elamigos?.repack_size, imdb: null }} mergedValue={result.merged.fileSize} />
                                            <ComparisonRow label="Rating" field="rating" gameIndex={index} result={result} onSelect={updatePreference} values={{ ovagames: result.ovagames?.rating, fitgirl: null, elamigos: null, imdb: result.imdb?.rating }} mergedValue={result.merged.rating} />
                                            <ComparisonRow label="Short Description" field="shortDescription" gameIndex={index} result={result} onSelect={updatePreference} values={{ ovagames: result.ovagames?.short_description?.substring(0, 50) + '...', fitgirl: null, elamigos: null, imdb: result.imdb?.short_description?.substring(0, 50) + '...' }} mergedValue={result.merged.shortDescription?.substring(0, 50) + '...'} />
                                            <ComparisonRow label="Long Description" field="longDescription" gameIndex={index} result={result} onSelect={updatePreference} values={{ ovagames: result.ovagames?.long_description?.substring(0, 50) + '...', fitgirl: null, elamigos: result.elamigos?.description?.substring(0, 50) + '...', imdb: result.imdb?.long_description?.substring(0, 50) + '...' }} mergedValue={result.merged.longDescription?.substring(0, 50) + '...'} />
                                            <ComparisonRow label="Screenshots" field="screenshots" gameIndex={index} result={result} onSelect={updatePreference} values={{ ovagames: result.ovagames?.screenshots ? `${result.ovagames.screenshots.length} images` : null, fitgirl: result.fitgirl?.screenshots ? `${result.fitgirl.screenshots.length} images` : null, elamigos: result.elamigos?.screenshots ? `${result.elamigos.screenshots.length} images` : null, imdb: result.imdb?.screenshots ? `${result.imdb.screenshots.length} images` : null }} mergedValue={`${Math.min(result.merged.screenshots?.length || 0, 6)} images (max 6)`} />
                                            <ComparisonRow label="Genres" field="genres" gameIndex={index} result={result} onSelect={updatePreference} values={{ ovagames: result.ovagames?.category, fitgirl: result.fitgirl?.genres?.join(', '), elamigos: null, imdb: result.imdb?.category?.join(', ') }} mergedValue={result.merged.genres?.join(', ')} />
                                            <ComparisonRow label="Languages" field="languages" gameIndex={index} result={result} onSelect={updatePreference} values={{ ovagames: null, fitgirl: result.fitgirl?.languages, elamigos: result.elamigos?.languages, imdb: null }} mergedValue={result.merged.languages} />
                                            <ComparisonRow label="System Req" field="systemRequirements" gameIndex={index} result={result} onSelect={updatePreference} values={{
                                                ovagames: result.ovagames?.system_requirements && typeof result.ovagames.system_requirements === 'string' && result.ovagames.system_requirements.length > 10 ? 'Available' : null,
                                                fitgirl: null,
                                                elamigos: result.elamigos?.system_requirements && (result.elamigos.system_requirements.os || result.elamigos.system_requirements.processor || result.elamigos.system_requirements.memory || result.elamigos.system_requirements.graphics) ? 'Available' : null,
                                                imdb: null
                                            }} mergedValue={result.merged.systemRequirements && (result.merged.systemRequirements.os || result.merged.systemRequirements.processor || result.merged.systemRequirements.memory || result.merged.systemRequirements.graphics) ? 'Available' : 'N/A'} />
                                            <ComparisonRow label="Download Links" field="downloadLinks" gameIndex={index} result={result} onSelect={updatePreference} values={{ ovagames: null, fitgirl: result.fitgirl?.download_links ? 'Available' : null, elamigos: null, imdb: null }} mergedValue={result.merged.downloadLinks?.length ? result.merged.downloadLinks.map(p => p.cloudName).join(', ') : 'N/A'} />
                                        </TableBody>
                                    </Table>
                                </div>
                            </CardContent>
                        </Card>
                    ))}

                    <div className="space-y-4">
                        {saveSuccess && (<div className="p-4 bg-green-900/20 border border-green-500 rounded-md"><p className="text-green-400">{saveSuccess}</p></div>)}
                        <Button onClick={handleSaveAll} disabled={isSaving || results.length === 0} className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3 text-lg" size="lg">
                            {isSaving ? (<><Loader2 className="mr-2 h-4 w-4 animate-spin" />Saving {results.length} game(s)...</>) : `Save All ${results.length} Games to Database`}
                        </Button>
                    </div>
                </div>
            )}
        </div>
    );
}

interface ComparisonRowProps {
    label: string;
    field: keyof MergePreferences;
    gameIndex: number;
    result: GameResult;
    onSelect: (index: number, field: keyof MergePreferences, source: FieldSource) => void;
    values: { ovagames: string | null | undefined; fitgirl: string | null | undefined; elamigos: string | null | undefined; imdb: string | null | undefined; };
    mergedValue: string | null | undefined;
}

function ComparisonRow({ label, field, gameIndex, result, onSelect, values, mergedValue }: ComparisonRowProps) {
    const selectedSource = result.preferences[field];

    // Determine which source is actually being used for the merged value
    const getActualSource = (): FieldSource | null => {
        // Debug logging
        if (field === 'languages' || field === 'screenshots') {
            console.log(`[SourceDetection] Field: ${field}, selectedSource: ${selectedSource}`);
            console.log(`[SourceDetection] Values:`, values);
            console.log(`[SourceDetection] Merged: "${mergedValue}"`);
        }

        // First priority: if manually selected and has data, use it
        if (selectedSource && values[selectedSource] && values[selectedSource] !== '-') {
            return selectedSource;
        }

        // Second priority: find source with data that matches merged value
        const sources: FieldSource[] = ['ovagames', 'fitgirl', 'elamigos', 'imdb'];
        for (const source of sources) {
            if (values[source] && values[source] !== '-') {
                // For exact match
                if (values[source] === mergedValue) {
                    return source;
                }
                // For screenshots (count strings)
                if (field === 'screenshots' && mergedValue?.includes(values[source])) {
                    return source;
                }
                // For languages (partial match)
                if (field === 'languages' && mergedValue && values[source] &&
                    (mergedValue.includes(values[source]) || values[source].includes(mergedValue.substring(0, 20)))) {
                    return source;
                }
            }
        }

        // Third priority: return first source that has any data
        for (const source of sources) {
            if (values[source] && values[source] !== '-') {
                return source;
            }
        }

        // Last resort: return selected source if it exists
        return selectedSource || null;
    };

    const actualSource = getActualSource();

    const getCellClass = (source: FieldSource) => {
        const isSelected = selectedSource === source;
        const isActualSource = actualSource === source;
        const hasData = !!values[source];
        if (isSelected) return "bg-blue-900/40 border-2 border-blue-500 cursor-pointer hover:bg-blue-900/50 transition-colors";
        if (isActualSource && !isSelected) return "bg-green-900/20 border border-green-500 cursor-pointer hover:bg-green-800 transition-colors";
        if (!hasData) return "bg-gray-900/20 text-gray-600 cursor-not-allowed";
        return "cursor-pointer hover:bg-gray-800 transition-colors border border-transparent hover:border-gray-600";
    };

    const getSourceIndicator = (source: FieldSource) => {
        const colors = {
            ovagames: 'text-blue-400',
            fitgirl: 'text-green-400',
            elamigos: 'text-orange-400',
            imdb: 'text-purple-400'
        };
        return colors[source] || 'text-gray-400';
    };

    return (
        <TableRow className="border-b border-gray-800 hover:bg-transparent">
            <TableCell className="font-medium text-gray-300 bg-gray-900/30">{label}</TableCell>
            <TableCell className={`p-3 relative ${getCellClass('ovagames')}`} onClick={() => values.ovagames && onSelect(gameIndex, field, 'ovagames')}>
                {selectedSource === 'ovagames' && <Check className="absolute top-1 right-1 h-3 w-3 text-blue-400" />}
                {actualSource === 'ovagames' && selectedSource !== 'ovagames' && <div className="absolute top-1 right-1 h-2 w-2 bg-blue-400 rounded-full"></div>}
                <span className="line-clamp-2" title={values.ovagames || ''}>{values.ovagames || '-'}</span>
            </TableCell>
            <TableCell className={`p-3 relative ${getCellClass('fitgirl')}`} onClick={() => values.fitgirl && onSelect(gameIndex, field, 'fitgirl')}>
                {selectedSource === 'fitgirl' && <Check className="absolute top-1 right-1 h-3 w-3 text-green-400" />}
                {actualSource === 'fitgirl' && selectedSource !== 'fitgirl' && <div className="absolute top-1 right-1 h-2 w-2 bg-green-400 rounded-full"></div>}
                <span className="line-clamp-2" title={values.fitgirl || ''}>{values.fitgirl || '-'}</span>
            </TableCell>
            <TableCell className={`p-3 relative ${getCellClass('elamigos')}`} onClick={() => values.elamigos && onSelect(gameIndex, field, 'elamigos')}>
                {selectedSource === 'elamigos' && <Check className="absolute top-1 right-1 h-3 w-3 text-orange-400" />}
                {actualSource === 'elamigos' && selectedSource !== 'elamigos' && <div className="absolute top-1 right-1 h-2 w-2 bg-orange-400 rounded-full"></div>}
                <span className="line-clamp-2" title={values.elamigos || ''}>{values.elamigos || '-'}</span>
            </TableCell>
            <TableCell className={`p-3 relative ${getCellClass('imdb')}`} onClick={() => values.imdb && onSelect(gameIndex, field, 'imdb')}>
                {selectedSource === 'imdb' && <Check className="absolute top-1 right-1 h-3 w-3 text-purple-400" />}
                {actualSource === 'imdb' && selectedSource !== 'imdb' && <div className="absolute top-1 right-1 h-2 w-2 bg-purple-400 rounded-full"></div>}
                <span className="line-clamp-2" title={values.imdb || ''}>{values.imdb || '-'}</span>
            </TableCell>
            <TableCell className="bg-gray-900/50 font-medium text-white border-l border-gray-700">
                <div className="flex items-center justify-between">
                    <span className="line-clamp-2 flex-1" title={mergedValue || ''}>{mergedValue || '-'}</span>
                    {actualSource && (
                        <span className={`text-xs ml-2 px-1 py-0.5 rounded ${getSourceIndicator(actualSource)} bg-gray-800/50`}>
                            {actualSource === 'ovagames' ? 'OVA' :
                             actualSource === 'fitgirl' ? 'FG' :
                             actualSource === 'elamigos' ? 'EL' :
                             actualSource === 'imdb' ? 'IMDB' : actualSource}
                        </span>
                    )}
                </div>
            </TableCell>
        </TableRow>
    );
}
