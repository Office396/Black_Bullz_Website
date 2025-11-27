# batch_processor.py
import csv
from website_automation_fitgirl import WebsiteAutomation

class BatchProcessor:
    def __init__(self):
        self.automation = WebsiteAutomation()

    def process_from_csv(self, csv_file):
        """Process URLs from a CSV file"""
        urls = []
        with open(csv_file, 'r', encoding='utf-8') as f:
            reader = csv.reader(f)
            for row in reader:
                if row and row[0].startswith('http'):
                    urls.append(row[0])

        return self.automation.process_game_urls(urls)

    def export_to_admin_format(self, games_data, output_file):
        """Export data in format ready for admin portal"""
        with open(output_file, 'w', encoding='utf-8') as f:
            for game in games_data:
                f.write("=== NEW GAME ENTRY ===\n")
                f.write(f"Title: {game.get('title', '')}\n")
                f.write(f"Genres: {', '.join(game.get('genres', []))}\n")
                f.write(f"Companies: {game.get('companies', '')}\n")
                f.write(f"Languages: {game.get('languages', '')}\n")
                f.write(f"Original Size: {game.get('original_size', '')}\n")
                f.write(f"Repack Size: {game.get('repack_size', '')}\n")

                # Write download links
                download_links = game.get('download_links', {})
                if download_links:
                    f.write("Download Links:\n")
                    for hoster, files in download_links.items():
                        if files:
                            f.write(f"  {hoster.upper()}:\n")
                            for file_group, links in files.items():
                                f.write(f"    {file_group}:\n")
                                for link_info in links:
                                    f.write(f"      - {link_info['filename']}: {link_info['url']}\n")

                f.write("Screenshots:\n")
                for i, screenshot in enumerate(game.get('screenshots', []), 1):
                    f.write(f"{i}. {screenshot}\n")
                f.write("System Requirements:\n")
                for key, value in game.get('system_requirements', {}).items():
                    f.write(f"{key}: {value}\n")
                f.write("\n" + "="*50 + "\n\n")

# Run batch processing
if __name__ == "__main__":
    processor = BatchProcessor()

    # Process from CSV
    games_data = processor.process_from_csv('game_urls.csv')

    # Export for admin portal
    processor.export_to_admin_format(games_data, 'admin_import.txt')

    print("Batch processing complete!")
