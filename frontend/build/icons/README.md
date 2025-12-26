# PWA Icons

This directory should contain app icons in the following sizes:

## Required Sizes:
- icon-72x72.png
- icon-96x96.png
- icon-128x128.png
- icon-144x144.png
- icon-152x152.png
- icon-192x192.png (minimum for Android)
- icon-384x384.png
- icon-512x512.png (required for Android)

## How to Generate Icons:

### Option 1: Use online tool
Visit: https://www.pwabuilder.com/imageGenerator
- Upload your logo/icon (at least 512x512px)
- Download the generated icon pack
- Extract all icons to this directory

### Option 2: Use your existing logo
If you have a logo file, you can use ImageMagick to generate all sizes:

```bash
# Install ImageMagick
sudo apt-get install imagemagick

# Generate all sizes from your logo
convert your-logo.png -resize 72x72 icon-72x72.png
convert your-logo.png -resize 96x96 icon-96x96.png
convert your-logo.png -resize 128x128 icon-128x128.png
convert your-logo.png -resize 144x144 icon-144x144.png
convert your-logo.png -resize 152x152 icon-152x152.png
convert your-logo.png -resize 192x192 icon-192x192.png
convert your-logo.png -resize 384x384 icon-384x384.png
convert your-logo.png -resize 512x512 icon-512x512.png
```

### Option 3: Temporary placeholder
For now, the PWA will work without icons, but browsers won't show the install prompt.
You can add icons later without affecting functionality.

## Icon Guidelines:
- Use PNG format
- Square aspect ratio (1:1)
- Transparent background recommended
- Simple, recognizable design
- High contrast for visibility
- Avoid text (icons are small)

## Maskable Icons:
For best Android experience, create maskable icons where the important content
is within the "safe zone" (center 80% of the icon).
