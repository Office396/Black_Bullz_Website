# Quick Start - Admin Page Modifier

## 🚀 Get Started in 3 Steps

### Step 1: Run Database Migration
1. Open your Supabase dashboard
2. Go to **SQL Editor**
3. Copy the entire contents of `database/page_modifiers_table.sql`
4. Paste and click **Run**

### Step 2: Access Admin Panel
1. Go to your website's admin panel: `http://localhost:3000/admin` (or your domain)
2. Login with your admin credentials
3. Click on the **"Modifier"** tab

### Step 3: Start Customizing
You'll see four tabs:
- **Hero Carousel** - Manage slideshow images and logos
- **Trending Games** - Control which games show in trending section
- **Game of the Day** - Set featured game with trailer
- **Collections** - Create game series/collections

## 📝 What Happens on First Load?

The system automatically loads your existing data:
- **Carousel**: First 8 games from your database
- **Trending**: All games marked as "trending"
- **Game of the Day**: Empty (you set it)
- **Collections**: Empty (you create them)

## 💾 Saving Changes

1. Make your edits in any of the four tabs
2. Click **"Save All Changes"** button at the top
3. Changes appear immediately on your website

## 🎨 Getting Game Logos

Visit https://www.steamgriddb.com/ to find high-quality game logos:
1. Search for your game
2. Download the logo (transparent PNG)
3. Upload to your image hosting
4. Use the URL in the carousel editor

## ❓ Need Help?

See `ADMIN_MODIFIER_SETUP.md` for detailed instructions and troubleshooting.

---

**That's it!** Your admin panel is now ready to manage your home page content dynamically. 🎉
