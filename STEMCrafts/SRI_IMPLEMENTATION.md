# SRI Hash Implementation Notes

Due to network restrictions in the current environment, SRI hashes could not be computed for the CDN resources. To complete the implementation:

## Required SRI Hashes

1. **animate.css 4.1.1**: <https://cdnjs.cloudflare.com/ajax/libs/animate.css/4.1.1/animate.min.css>
2. **GSAP 3.12.2**: <https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.2/gsap.min.js>
3. **Anime.js 3.2.1**: <https://cdnjs.cloudflare.com/ajax/libs/animejs/3.2.1/anime.min.js>

## Implementation Steps

1. Generate SHA384 hashes using:
   ```bash
   curl -s "URL" | openssl dgst -sha384 -binary | openssl base64 -A
   ```

2. Add integrity attributes to the link/script tags:
   ```html
   <link rel="stylesheet" href="..." integrity="sha384-HASH" crossorigin="anonymous">
   <script src="..." integrity="sha384-HASH" crossorigin="anonymous" defer></script>
   ```

3. Update all HTML files with the computed hashes.

## Files to Update
- index.html
- about.html  
- contact.html
- events.html
- newsletters.html
- brackets.html
- 404.html
- tech/index.html (CSS only)

The crossorigin="anonymous" attribute has already been added to all CDN resources in preparation for SRI implementation.